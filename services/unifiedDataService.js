import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Client, Databases, ID, Query } from 'appwrite';
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { appConfig } from '../config/appConfig';

// Set to false to reduce console spam
const DEBUG_MODE = false;

// Helper function for conditional logging


// Use centralized configuration
const config = {
  endpoint: appConfig.appwrite.endpoint,
  project: appConfig.appwrite.projectId,
  databaseId: appConfig.appwrite.databaseId,
  employeesCollectionId: appConfig.appwrite.collections.employees,
  casesCollectionId: appConfig.appwrite.collections.cases,
  expensesCollectionId: appConfig.appwrite.collections.expenses,
  attendanceCollectionId: appConfig.appwrite.collections.attendance,
  customOptionsCollectionId: appConfig.appwrite.collections.customOptions
};

// Initialize Appwrite
const client = new Client();
const account = new Account(client);
const databases = new Databases(client);

// Authentication caching to reduce API calls
let authCache = { 
  status: null, 
  timestamp: 0, 
  isAuthenticated: false 
};
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached authentication function
async function getCachedAuthStatus() {
  const now = Date.now();
  
  // Return cached status if still valid
  if (authCache.status && (now - authCache.timestamp) < AUTH_CACHE_DURATION) {
    console.log(`🔍 [AUTH CACHE] Using cached auth status: ${authCache.isAuthenticated}`);
    return authCache.isAuthenticated;
  }
  
  try {
    console.log(`🔍 [AUTH CACHE] Fetching fresh auth status...`);
    const user = await account.get();
    authCache = { 
      status: user, 
      timestamp: now, 
      isAuthenticated: true 
    };
    console.log(`✅ [AUTH CACHE] Auth status cached: authenticated`);
    return true;
  } catch (authError) {
    // Only treat as unauthenticated if it's a specific scope error
    const isUnauthenticated = authError.message.includes('missing scope (account)') || 
                             authError.message.includes('User (role: guests)') ||
                             authError.message.includes('401') ||
                             authError.message.includes('Unauthorized');
    
    authCache = { 
      status: null, 
      timestamp: now, 
      isAuthenticated: !isUnauthenticated 
    };
    console.log(`⚠️ [AUTH CACHE] Auth status cached: ${authCache.isAuthenticated ? 'authenticated' : 'unauthenticated'}`);
    return authCache.isAuthenticated;
  }
}

// Clear auth cache when needed
function clearAuthCache() {
  authCache = { status: null, timestamp: 0, isAuthenticated: false };
  console.log(`🔄 [AUTH CACHE] Cache cleared`);
}

// Request queue to prevent overwhelming the server
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { request, resolve, reject } = this.queue.shift();
    
    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Global request queue instance
const requestQueue = new RequestQueue(3);

// Batch operations for multiple data items
async function batchSaveData(items, collectionId) {
  console.log(`🔄 [BATCH SAVE] Processing ${items.length} items for ${collectionId}`);
  
  const batchSize = 5; // Process 5 items at a time
  const batches = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  const results = [];
  
  for (const batch of batches) {
    const batchPromises = batch.map(item => 
      requestQueue.add(() => dataService.saveData(item, collectionId))
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      console.log(`✅ [BATCH SAVE] Completed batch of ${batch.length} items`);
    } catch (error) {
      console.error(`❌ [BATCH SAVE] Batch failed:`, error);
      // Continue with other batches even if one fails
    }
  }
  
  console.log(`✅ [BATCH SAVE] Completed ${results.length}/${items.length} items`);
  return results;
}


try {
  
  if (!config.project) {
    console.error('🚨 Project ID is not set! Please check your .env file');
    throw new Error('Appwrite Project ID not configured');
  }
  
  client
    .setEndpoint(config.endpoint)
    .setProject(config.project);
}
  catch (error) {
  console.error('❌ Failed to initialize Appwrite:', error);
  console.error('💡 Please check your environment variables and configuration');
}

// Utility functions
const generateId = () => {
  // Generate a valid Appwrite document ID (max 36 chars, alphanumeric + period, hyphen, underscore)
  // Use a shorter timestamp + random string to ensure we stay under 36 chars
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 26); // 24 chars
  return `${timestamp}_${randomStr}`; // 8 + 1 + 24 = 33 chars total
};

// Mark item as synced in local storage
const markItemAsSynced = async (collectionId, itemId) => {
  try {
    const key = `${collectionId}_${itemId}`;
    const existingData = await storage.get(key);
    if (existingData) {
      const updatedData = { ...existingData, synced: true, syncedAt: new Date().toISOString() };
      await storage.save(key, updatedData);
    }
  } catch (error) {
    console.error('Error marking item as synced:', error);
  }
};

const validateAppwriteId = (id) => {
  // Appwrite document ID requirements:
  // - Max 36 characters
  // - Valid chars: a-z, A-Z, 0-9, period, hyphen, underscore
  // - Can't start with a special char
  if (!id || typeof id !== 'string') return false;
  if (id.length > 36) return false;
  if (!/^[a-zA-Z0-9]/.test(id)) return false; // Must start with alphanumeric
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) return false; // Only valid characters
  return true;
};

const generateValidAppwriteId = (originalId = null) => {
  // If original ID is valid for Appwrite, use it; otherwise generate a new one
  if (originalId && validateAppwriteId(originalId)) {
    return originalId;
  }
  if (originalId) {
    console.warn(`⚠️ Invalid Appwrite document ID detected: "${originalId}" (length: ${originalId.length}). Generating new valid ID.`);
  }
  return generateId();
};
const isOnline = async () => {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected;
  } catch {
    return false;
  }
};

// Device ID management - integrated into unified service
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate a unique device ID
      const timestamp = Date.now().toString();
      const randomStr = Math.random().toString(36).substring(2, 15);
      deviceId = `DEVICE_${timestamp}_${randomStr}`;
      
      // Save the device ID
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('✅ Generated new device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Generate a fallback device ID
    const fallbackId = `DEVICE_${Date.now().toString().slice(-6)}`;
    return fallbackId;
  }
};

// Cache management for Appwrite data



// Clean data for Appwrite - remove id and $id fields and keep only allowed fields
const cleanDataForAppwrite = async (data, collectionId) => {
  const { id, $id, synced, ...baseData } = data;
  
  // Define allowed fields for each collection
  const allowedFields = {
         expenses: [
       'title', 'amount', 'category', 'department', 'date', 
       'description', 'notes', 'updatedAt', 'deviceId', 'status'
    ],
                   employees: [
        'badgeNumber', 'fullName', 'fatherName', 'cnic', 'dateOfBirth',
        'gender', 'contactNumber', 'email', 'address', 'joiningDate',
        'rank', 'department', 'postingStation', 'shift',
        'isArmed', 'serviceYears', 
        'lastPromotionDate', 'disciplinaryActions', 'trainingCertifications',
        'salary', 'overtimeRate', 'status', 'notes',
        'weaponLicenseNumber', 'drivingLicenseNumber', 'equipmentAssigned',
        'vehicleAssigned', 'workLocation', 'supervisor', 'deviceId',
        'paymentType', 'workingDays', 'checkInTime', 'checkOutTime',
        'leavesAllowedPerMonth', 'bonus'
      ],
    cases: [
      'title', 'description', 'status', 'priority', 'assignedOfficer',
      'location', 'category', 'evidence', 'notes', 'startDate',
      'endDate', 'deviceId'
    ],
                                       attendance: [
        'employeeId', 'employeeName', 'date', 'status',
        'totalWorkingHours', 'timestamp', 'deviceId'
      ],
    
     
    customOptions: [
      'item', 'options', 'deviceId'
    ]
  };

  // Filter data to keep only allowed fields for the collection
  const allowedFieldsForCollection = allowedFields[collectionId] || [];
  const cleanData = {};
  
  // Always ensure deviceId is present
  cleanData.deviceId = baseData.deviceId || await getDeviceId();
  
  // Debug logging for attendance
  if (collectionId === 'attendance') {
    console.log(`🔍 [CLEAN DATA] Cleaning attendance data for Appwrite:`, baseData);
    console.log(`🔍 [CLEAN DATA] Allowed fields for attendance:`, allowedFieldsForCollection);
  }
  for (const field of allowedFieldsForCollection) {
    if (baseData.hasOwnProperty(field)) {
        
        // Handle timestamp field - convert null to current timestamp
      if (field === 'timestamp' && (baseData[field] === null || baseData[field] === undefined)) {
        cleanData[field] = new Date().toISOString();
        continue;
      }
      
      // Skip empty arrays and null/undefined values for other fields
      if (baseData[field] === null || baseData[field] === undefined || 
          (Array.isArray(baseData[field]) && baseData[field].length === 0)) {
        continue; // Skip this field entirely
      }
      
      // Handle empty numeric fields - convert empty strings to null for Appwrite
      if (['salary', 'overtimeRate',  'amount', 'bonus'].includes(field)) {
        cleanData[field] = baseData[field] === '' || baseData[field] === null || baseData[field] === undefined ? null : parseFloat(baseData[field]);
      } 
      // Handle leavesAllowedPerMonth - convert to integer
      else if (field === 'leavesAllowedPerMonth') {
        cleanData[field] = baseData[field] === '' || baseData[field] === null || baseData[field] === undefined ? null : parseInt(baseData[field]);
      }
      // Handle workingDays array - convert to string for Appwrite
      else if (field === 'workingDays') {
        if (Array.isArray(baseData[field])) {
          cleanData[field] = baseData[field]; // already an array
        } else if (typeof baseData[field] === 'string') {
          // split by comma into array of trimmed strings
          cleanData[field] = baseData[field].split(',').map(day => day.trim());
        } else {
          cleanData[field] = []; // fallback
        }
      }
      
      // else if (field === 'totalWorkingHours') {
      //   // cleanData[field] = formatWorkingHours(baseData[field]);
      //   cleanData[field] = baseData[field];

      // }
      // Handle arrays - convert to string if not empty
      else if (Array.isArray(baseData[field]) && baseData[field].length > 0) {
        cleanData[field] = baseData[field].join(', ');
      }
      else {
        cleanData[field] = baseData[field];
      }
    }
  }

  // Ensure we have at least some data
  if (Object.keys(cleanData).length === 0) {
    console.warn('⚠️ No data to send to Appwrite, using minimal data');
    cleanData.deviceId = baseData.deviceId || await getDeviceId();
  }
  
  // For attendance, ensure we have required fields
  if (collectionId === 'attendance') {
    if (!cleanData.employeeId && baseData.employeeId) {
      cleanData.employeeId = baseData.employeeId;
    }
    if (!cleanData.employeeName && baseData.employeeName) {
      cleanData.employeeName = baseData.employeeName;
    }
    if (!cleanData.date && baseData.date) {
      cleanData.date = baseData.date;
    }
    if (!cleanData.status && baseData.status) {
      cleanData.status = baseData.status;
    }
    if (!cleanData.timestamp) {
      cleanData.timestamp = new Date().toISOString();
    }
  }
  
  // Debug logging for attendance
  if (collectionId === 'attendance') {
    console.log(`🔍 [CLEAN DATA] Final cleaned data for Appwrite:`, cleanData);
  }
  
  return cleanData;
};



// Unified storage
const storage = {
  async save(key, data) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },
  async get(key) {
    try {
    const data = await AsyncStorage.getItem(key);
      if (!data) return null;
      
      // Handle the case where data might not be valid JSON
      try {
        const parsed = JSON.parse(data);
    return parsed;
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse JSON for key "${key}":`, parseError.message);
        console.warn(`Raw data:`, data);
        // If it's not valid JSON, return the raw string
        return data;
      }
    } catch (error) {
      console.error(`❌ Error getting data for key "${key}":`, error);
      return null;
    }
  },
  async delete(key) {
    await AsyncStorage.removeItem(key);
  },
  async getAllKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  },

   async debugAttendanceData() {
    try {
      
      const allKeys = await this.getAllKeys();
      // Get data using unified data service methods
      const attendanceData = await getItems('attendance');
      
      
      
      // Also check for any custom options related to attendance
      const customKeys = allKeys.filter(key => key.startsWith('custom_'));
      const attendanceRelatedCustomKeys = customKeys.filter(key => 
        key.includes('attendance') 
      );
      
      if (attendanceRelatedCustomKeys.length > 0) {
        for (const key of attendanceRelatedCustomKeys) {
          const data = await this.get(key);
        }
      }
      
      
      return {
        attendanceData,
      
        attendanceRelatedCustomKeys,
        totalKeys: allKeys.length
      };
    } catch (error) {
      console.error('❌ Error debugging attendance data:', error);
      return { error: error.message };
    }
  }
};

// Custom options service
const customOptionsService = {
  // Default options data

   DEFAULT_OPTIONS : {
    departments: [
      'Traffic', 'Investigation', 'Patrol', 'Special Ops', 'Administration',
      'Cyber Crime', 'Narcotics', 'Forensic', 'Anti-Terrorism', 'VIP Security',
      'Community Policing', 'Internal Affairs', 'K9 Unit', 'Intelligence'
    ],
  
    ranks: [
      'Constable', 'Head Constable', 'Assistant Sub Inspector', 'Sub Inspector',
      'Inspector', 'Senior Inspector', 'Deputy Superintendent',
      'Superintendent', 'Assistant Commissioner', 'Commissioner',
      'Deputy Inspector General', 'Inspector General'
    ],
  
    employment_status: [
      'Active', 'Suspended', 'Retired', 'Transferred', 'On Leave', 'Terminated',
      'Probation', 'Temporary', 'Resigned', 'Deceased', 'Training'
    ],
  

  
    expense_categories: [
      'Fuel', 'Equipment', 'Training', 'Maintenance', 'Office Supplies',
      'Travel', 'Uniforms', 'Weapons', 'Technology', 'Communication',
      'Medical Expenses', 'Vehicles', 'Building Maintenance'
    ],
  
    case_categories: [
      'Theft', 'Assault', 'Fraud', 'Drug Related', 'Traffic Violation',
      'Domestic Violence', 'Property Crime', 'White Collar Crime',
      'Cyber Crime', 'Kidnapping', 'Homicide', 'Arson',
      'Sexual Offense', 'Terrorism', 'Corruption'
    ],
  
    case_status: [
      'Active', 'Under Investigation', 'Pending Review', 'Awaiting Evidence',
      'Court Proceedings', 'Closed - Solved', 'Closed - Unsolved',
      'Cold Case', 'Reopened', 'Dismissed'
    ],
  
    case_priority: [
      'Low', 'Medium', 'High', 'Critical', 'Emergency', 'Urgent'
    ]
  },
  
  // Initialize default options in Appwrite
  async initializeDefaultOptions() {
    try {
      if (!client || !databases) {
        return { success: false, message: 'Appwrite not initialized' };
      }

      // Check if user is logged in
      try {
        const user = await account.get();
        if (!user) {
          return { success: false, message: 'User not logged in' };
        }
      } catch (error) {
        return { success: false, message: 'User not authenticated' };
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const [itemName, options] of Object.entries(this.DEFAULT_OPTIONS)) {
        try {
                     // Check if document already exists
           const existingDocs = await databases.listDocuments(
             config.databaseId,
             config.customOptionsCollectionId,
             [Query.equal('item', itemName)]
           );

          if (existingDocs.documents.length > 0) {
            // Update existing document
            const docId = existingDocs.documents[0].$id;
            const updateData = {
              options: options
            };
            
            await databases.updateDocument(
              config.databaseId,
              config.customOptionsCollectionId,
              docId,
              updateData
            );
            updatedCount++;
          } else {
            // Create new document
            const createData = {
              item: itemName,
              options: options
            };
            
            await databases.createDocument(
              config.databaseId,
              config.customOptionsCollectionId,
              `custom_${itemName}`,
              createData
            );
            createdCount++;
          }

          // Also save to local storage for immediate access
          await storage.save(`custom_${itemName}`, options);

        } catch (error) {
          console.error(`❌ Error setting up ${itemName}:`, error.message);
        }
      }

      const message = `Default options initialized: ${createdCount} created, ${updatedCount} updated`;
      return { success: true, message, createdCount, updatedCount };

    } catch (error) {
      console.error('❌ Error initializing default options:', error);
      return { success: false, error: error.message };
    }
  },

  async getOptions(itemName) {
    try {
      const local = await storage.get(`custom_${itemName}`);
      if (local) {
        return local;
      }

      if (client && databases) {
        // Check if user is logged in before trying Appwrite
        try {
          const user = await account.get();
          if (!user) {
            return local || [];
          }
        } catch (error) {
          return local || [];
        }

        try {
          const result = await databases.listDocuments(
            config.databaseId,
            config.customOptionsCollectionId,
            [Query.equal('item', itemName)]
          );
          
          if (result.documents.length > 0) {
            const options = result.documents[0].options || [];
            await storage.save(`custom_${itemName}`, options);
            return options;
          } else {
          }
        } catch (error) {
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting options:', error);
      return [];
    }
  },

  async saveOptions(itemName, options) {
    try {
      await storage.save(`custom_${itemName}`, options);

      if (client && databases) {
                 try {
           const result = await databases.listDocuments(
             config.databaseId,
             config.customOptionsCollectionId,
             [Query.equal('item', itemName)]
           );
          
          if (result.documents.length > 0) {
            const updateData = { options };
            await databases.updateDocument(
              config.databaseId,
              config.customOptionsCollectionId,
              result.documents[0].$id,
              updateData
            );
          } else {
            const createData = {
              item: itemName,
              options
            };
            await databases.createDocument(
              config.databaseId,
              config.customOptionsCollectionId,
              `custom_${itemName}`,
              createData
            );
          }
        } catch (error) {
        }
      }
    } catch (error) {
      console.error('❌ Error saving options:', error);
    }
  },

  async addOption(itemName, newOption) {
    try {
      const existingOptions = await this.getOptions(itemName);
      
      if (existingOptions.includes(newOption)) {
        return { success: false, message: 'Option already exists' };
      }

      const updatedOptions = [...existingOptions, newOption];
      await this.saveOptions(itemName, updatedOptions);
      
      return { 
        success: true, 
        message: 'Option added successfully',
        options: updatedOptions
      };
    } catch (error) {
      console.error(`❌ Error adding option for ${itemName}:`, error);
      return { success: false, message: 'Error adding option' };
    }
  },

  async removeOption(itemName, optionToRemove) {
    try {
      const existingOptions = await this.getOptions(itemName);
      const updatedOptions = existingOptions.filter(option => option !== optionToRemove);
      await this.saveOptions(itemName, updatedOptions);
      
      return {
        success: true,
        message: 'Option removed successfully',
        options: updatedOptions
      };
    } catch (error) {
      console.error(`❌ Error removing option for ${itemName}:`, error);
      return { success: false, message: 'Error removing option' };
    }
  },

  async getAllItemNames() {
    try {
      const keys = await storage.getAllKeys();
      const customOptionKeys = keys.filter(key => key.startsWith('custom_'));
      const itemNames = customOptionKeys.map(key => key.replace('custom_', ''));
      return itemNames;
    } catch (error) {
      console.error('❌ Error getting all item names:', error);
      return [];
    }
  },

  // Check if default options are initialized
  async checkDefaultOptionsStatus() {
    try {
      const itemNames = Object.keys(this.DEFAULT_OPTIONS);
      const status = {};

      for (const itemName of itemNames) {
        const localOptions = await storage.get(`custom_${itemName}`);
        status[itemName] = {
          hasLocal: !!localOptions,
          localCount: localOptions ? localOptions.length : 0,
          hasAppwrite: false
        };

                 // Check Appwrite if available
         if (client && databases) {
           try {
             const result = await databases.listDocuments(
               config.databaseId,
               config.customOptionsCollectionId,
               [Query.equal('item', itemName)]
             );
            status[itemName].hasAppwrite = result.documents.length > 0;
            status[itemName].appwriteCount = result.documents.length > 0 ? result.documents[0].options?.length || 0 : 0;
          } catch (error) {
          }
        }
      }
    return status;
    } catch (error) {
      console.error('❌ Error checking default options status:', error);
      return {};
    }
  }
};

// Data service
export const dataService = {
  async getItems(collectionId) {
    try {
      

      
      // Check if online and try to sync from Appwrite first
      if (await isOnline() && client && databases) {
        try {
          // Use cached authentication status
          const isAuthenticated = await getCachedAuthStatus();
          
          if (isAuthenticated) {
              
          const collectionMap = {
            employees: config.employeesCollectionId,
            cases: config.casesCollectionId,
            expenses: config.expensesCollectionId,
            attendance: config.attendanceCollectionId,
            customOptions: config.customOptionsCollectionId
          };
          
          const appwriteCollectionId = collectionMap[collectionId];
          if (!appwriteCollectionId) {
            console.warn(`⚠️ No Appwrite collection mapping for ${collectionId}`);
            throw new Error('No collection mapping');
          }
            
          // Fetch from Appwrite with error handling and retry logic
          let appwriteDocuments;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
                appwriteDocuments = await databases.listDocuments(
                config.databaseId,
                appwriteCollectionId,
                [Query.limit(100)] // Limit to 100 documents
              );
                break; // Success, exit retry loop
            } catch (fetchError) {
              retryCount++;
              console.error(`❌ Error fetching documents from Appwrite for ${collectionId} (attempt ${retryCount}/${maxRetries}):`, fetchError);
              
              // Check if it's a network-related error
              const errorMessage = fetchError.message?.toLowerCase() || '';
              const isNetworkError = errorMessage.includes('bad gateway') || 
                                   errorMessage.includes('network') || 
                                   errorMessage.includes('connection') ||
                                   errorMessage.includes('timeout') ||
                                   errorMessage.includes('502') ||
                                   errorMessage.includes('503') ||
                                   errorMessage.includes('504');
              
              if (isNetworkError && retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                continue;
              } else {
                  throw fetchError;
              }
            }
          }
          
            
          // Get all local keys for this collection
          const localKeys = await storage.getAllKeys();
          const collectionLocalKeys = localKeys.filter(key => key.startsWith(`${collectionId}_`));
            
          // Create a set of Appwrite document IDs for fast lookup
          const appwriteDocIds = new Set(appwriteDocuments.documents.map(doc => doc.$id));
          
          // Remove local items that no longer exist in Appwrite (deletions)
          for (const localKey of collectionLocalKeys) {
            const localDocId = localKey.split('_')[1];
            if (!appwriteDocIds.has(localDocId)) {
              await storage.delete(localKey);
            }
          }
          
            // Cache the Appwrite data for future use
          const appwriteData = appwriteDocuments.documents.map(doc => ({
            ...doc,
            id: doc.$id,
            $id: doc.$id,
            $createdAt: doc.$createdAt,
            $updatedAt: doc.$updatedAt,
            deviceId: doc.deviceId || 'unknown'
          }));
          
          
          
          // Store each document in local storage and handle duplicates
          for (const doc of appwriteDocuments.documents) {
            const localKey = `${collectionId}_${doc.$id}`;
            const existingData = await storage.get(localKey);
            
                             // Check for duplicates based on business rules
               let isDuplicate = false;
               if (collectionId === 'employees' && doc.badgeNumber) {
                 // Check for duplicate badge numbers across all devices
                 const keys = await storage.getAllKeys();
                 const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
                 const allLocalData = await Promise.all(
                   collectionKeys.map(async key => {
                     const data = await storage.get(key);
                     return data ? { ...data, id: data.id || key.split('_')[1] } : null;
                   })
                 );
                 const validLocalData = allLocalData.filter(item => item !== null);
                 const duplicateBadge = validLocalData.find(item => 
                   item.badgeNumber === doc.badgeNumber && item.id !== doc.$id
                 );
                 if (duplicateBadge) {
                   console.warn(`⚠️ Duplicate badge number found: ${doc.badgeNumber} (${doc.$id} vs ${duplicateBadge.id})`);
                   isDuplicate = true;
                 }
               } else if ((collectionId === 'cases' || collectionId === 'expenses') && doc.title) {
                 // Check for duplicate titles across all devices
                 const keys = await storage.getAllKeys();
                 const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
                 const allLocalData = await Promise.all(
                   collectionKeys.map(async key => {
                     const data = await storage.get(key);
                     return data ? { ...data, id: data.id || key.split('_')[1] } : null;
                   })
                 );
                 const validLocalData = allLocalData.filter(item => item !== null);
                 const duplicateTitle = validLocalData.find(item => 
                   item.title === doc.title && item.id !== doc.$id
                 );
                 if (duplicateTitle) {
                   console.warn(`⚠️ Duplicate title found: ${doc.title} (${doc.$id} vs ${duplicateTitle.id})`);
                   isDuplicate = true;
                 }
               }
              
              // Only save if it doesn't exist locally, is newer, or is not a duplicate
            if (!existingData || (doc.$updatedAt && existingData.$updatedAt && doc.$updatedAt > existingData.$updatedAt)) {
                if (!isDuplicate) {
              const localData = {
                ...doc,
                id: doc.$id,
                $id: doc.$id,
                $createdAt: doc.$createdAt,
                    $updatedAt: doc.$updatedAt,
                    deviceId: doc.deviceId || 'unknown'
              };
              await storage.save(localKey, localData);
                } else {
                   }
              }
            }
          } else {
             }
          
        } catch (appwriteError) {
          console.error(`❌ Appwrite sync failed for ${collectionId}:`, appwriteError);
           }
      } else {
         }
      
      // Get data from local storage (combines local and synced data)
      const keys = await storage.getAllKeys();
      const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
      
      if (collectionKeys.length === 0) {
          return [];
      }
      
      const items = await Promise.all(
        collectionKeys.map(async key => {
          const data = await storage.get(key);
          if (!data) return null;
          
          return { 
            ...data, 
            id: data.id || key.split('_')[1], 
            $id: data.$id || key.split('_')[1],
            deviceId: data.deviceId || 'unknown'
          };
        })
      );
      
      const validItems = items.filter(item => item !== null);
      
      return validItems;
      
    } catch (error) {
      console.error(`❌ Error getting items for ${collectionId}:`, error);
      return [];
    }
  },

  // Get only unsynced items for efficient syncing
  async getUnsyncedItems(collectionId) {
    try {
      const allItems = await this.getItems(collectionId);
      return allItems.filter(item => item.synced !== true);
    } catch (error) {
      console.error('Error getting unsynced items:', error);
      return [];
    }
  },

  // Get sync status for a collection
  async getSyncStatus(collectionId) {
    try {
      const allItems = await this.getItems(collectionId);
      const syncedCount = allItems.filter(item => item.synced === true).length;
      const unsyncedCount = allItems.filter(item => item.synced !== true).length;
      
      return {
        total: allItems.length,
        synced: syncedCount,
        unsynced: unsyncedCount
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return { total: 0, synced: 0, unsynced: 0 };
    }
  },

  // Helper method to get all local data for a collection
  async getAllLocalData(collectionId) {
    const keys = await storage.getAllKeys();
    const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
    
    if (collectionKeys.length === 0) {
        return [];
    }
    
    const items = await Promise.all(
      collectionKeys.map(async key => {
        const data = await storage.get(key);
        if (!data) return null;
        
        return { 
          ...data, 
          id: data.id || key.split('_')[1], 
          $id: data.$id || key.split('_')[1],
          deviceId: data.deviceId || 'unknown'
        };
      })
    );
    
    return items.filter(item => item !== null);
  },

  // Cache management functions


  // Efficient sync - only sync unsynced items
  async syncUnsyncedItems(collectionId) {
    try {
      const unsyncedItems = await this.getUnsyncedItems(collectionId);
      
      if (unsyncedItems.length === 0) {
        console.log(`✅ All items in ${collectionId} are already synced`);
        return { synced: 0, failed: 0 };
      }
      
      console.log(` Syncing ${unsyncedItems.length} unsynced items for ${collectionId}...`);
      
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const item of unsyncedItems) {
        try {
          // Try to save to Appwrite
          await this.saveData(item, collectionId);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync item ${item.id}:`, error);
          failedCount++;
        }
      }
      
      console.log(`✅ Sync completed: ${syncedCount} synced, ${failedCount} failed`);
      return { synced: syncedCount, failed: failedCount };
      
    } catch (error) {
      console.error(`❌ Error syncing unsynced items for ${collectionId}:`, error);
      return { synced: 0, failed: 0 };
    }
  },

  async saveData(data, collectionId) {
    try {
      const deviceId = await getDeviceId();
      
      // For attendance, preserve the employeeId_date format, don't generate random ID
      let uniqueId;
      if (collectionId === 'attendance' && data.id && data.id.includes('_')) {
        // Check if the employeeId_date format is valid for Appwrite
        if (validateAppwriteId(data.id)) {
          uniqueId = data.id;
          console.log(`🔍 [ATTENDANCE ID] Preserving valid attendance ID: ${uniqueId}`);
        } else {
          console.log(`🔍 [ATTENDANCE ID] Invalid format "${data.id}", generating compatible ID`);
          uniqueId = generateValidAppwriteId(data.id);
        }
      } else {
        // For other collections, generate Appwrite-compatible ID
        uniqueId = generateValidAppwriteId(data.id || data.$id);
      }
      
      const cleanData = { ...data, id: uniqueId, $id: uniqueId, deviceId: deviceId, synced: false };
     
      // Check for duplicates across ALL devices (not just current device)
      const existing = await dataService.getItems(collectionId);
      
      // Debug logging for attendance
      if (collectionId === 'attendance') {
        console.log(`🔍 [DUPLICATE CHECK] Looking for duplicates in ${existing.length} existing records`);
        console.log(`🔍 [DUPLICATE CHECK] New data - employeeId: ${data.employeeId}, date: ${data.date}, uniqueId: ${uniqueId}`);
        console.log(`🔍 [DUPLICATE CHECK] Existing attendance records:`, existing.map(item => ({
          id: item.id,
          employeeId: item.employeeId,
          date: item.date,
          status: item.status
        })));
      }
      
      const duplicate = existing.find(item => {
        // Skip the current item if we're updating
        if (item.id === uniqueId || item.$id === uniqueId) {
          if (collectionId === 'attendance') {
            console.log(`🔍 [DUPLICATE CHECK] Skipping self (same ID): ${item.id}`);
          }
          return false;
        }
        
        // Check for duplicates based on business rules
        if (collectionId === 'employees' && data.badgeNumber && item.badgeNumber) {
          return item.badgeNumber === data.badgeNumber;
        }
        if (collectionId === 'cases' && data.title && item.title) {
          return item.title === data.title;
        }
        if (collectionId === 'expenses' && data.title && item.title) {
          return item.title === data.title;
        }
        // Note: attendance duplicates are now prevented by using employeeId_date as ID format
        return false;
      });
      
      if (collectionId === 'attendance') {
        console.log(`🔍 [DUPLICATE CHECK] Duplicate found:`, duplicate ? duplicate.id : 'none');
      }
      
      if (duplicate) {
        // For attendance, the employeeId_date ID format naturally prevents duplicates
        // so this should not happen, but if it does, throw an error for non-attendance
        if (collectionId !== 'attendance') {
          const duplicateType = collectionId === 'employees' ? 'Badge number' : 'Title';
          const duplicateValue = collectionId === 'employees' ? data.badgeNumber : data.title;
          throw new Error(`${duplicateType} "${duplicateValue}" already exists.`);
        }
      }
      
      const key = `${collectionId}_${uniqueId}`;
      await storage.save(key, cleanData);
      
      // Try to save to Appwrite
      if (await isOnline() && client && databases) {
        try {
          // Use cached authentication status
          const isAuthenticated = await getCachedAuthStatus();
          
          if (isAuthenticated) {
            const collectionMap = {
              employees: config.employeesCollectionId,
              cases: config.casesCollectionId,
              expenses: config.expensesCollectionId,
              attendance: config.attendanceCollectionId,
             
            };
            
            const appwriteCollectionId = collectionMap[collectionId];
            if (!appwriteCollectionId) {
              console.warn(`⚠️ No Appwrite collection mapping for ${collectionId}`);
              throw new Error('No collection mapping');
            }
            const appwriteData = await cleanDataForAppwrite(cleanData, collectionId);
              
            // Ensure we have valid data to send
            if (!appwriteData || Object.keys(appwriteData).length === 0) {
              console.warn('⚠️ No valid data to send to Appwrite, skipping save');
              return cleanData;
            }
            
            // Try to create document first, if it exists then update it
            try {
              const response = await databases.createDocument(
                config.databaseId,
                appwriteCollectionId,
                uniqueId,
                appwriteData
              );
              
              // Mark as synced after successful Appwrite save
              await markItemAsSynced(collectionId, uniqueId);
              

              
              } catch (createError) {
              if (createError.message.includes('Document with the requested ID already exists')) {
                // Document exists, update it
                try {
                  await databases.updateDocument(
                    config.databaseId,
                    appwriteCollectionId,
                    uniqueId,
                    appwriteData
                  );
                  
                  // Mark as synced after successful Appwrite update
                  await markItemAsSynced(collectionId, uniqueId);
                  

                  
                  } catch (updateError) {
                  console.error(`❌ Failed to update existing document: ${updateError.message}`);
                  // If update also fails, generate a new unique ID and try again
                  const newUniqueId = generateId();
                    
                  try {
                    await databases.createDocument(
                      config.databaseId,
                      appwriteCollectionId,
                      newUniqueId,
                      appwriteData
                    );
                    
                                    // Mark as synced after successful Appwrite save
                await markItemAsSynced(collectionId, newUniqueId);
                

                      
                    // Update local storage with new ID
                    const newKey = `${collectionId}_${newUniqueId}`;
                    const updatedData = { ...cleanData, id: newUniqueId, $id: newUniqueId };
                    await storage.save(newKey, updatedData);
                    
                    // Remove old key if it exists
                    await storage.delete(key);
                    
                    return updatedData;
                  } catch (finalError) {
                    console.error(`❌ Failed to create with new ID: ${finalError.message}`);
                    throw finalError;
                  }
                }
              } else {
                throw createError;
              }
            }
            
          } 
        } catch (error) {
          console.error('❌ Error saving data:', error);
          throw error;
        }
      } else {
          await pendingSyncQueue.addPendingSync('create', collectionId, cleanData, uniqueId);
      }
      
      return cleanData;
    } catch (error) {
      console.error('❌ Error saving data:', error);
      throw error;
    }
  },

  async updateData(key, documentId, data, collectionId) {
    try {
        const cleanData = { ...data, id: documentId, $id: documentId };
      
      // Check for duplicates across ALL devices (excluding current item)
      const existing = await dataService.getItems(collectionId);
      const duplicate = existing.find(item => {
        // Skip the current item being updated
        if (item.id === documentId || item.$id === documentId) return false;
        
        // Check for duplicates based on business rules
        if (collectionId === 'employees' && data.badgeNumber && item.badgeNumber) {
          return item.badgeNumber === data.badgeNumber;
        }
        if (collectionId === 'cases' && data.title && item.title) {
          return item.title === data.title;
        }
        if (collectionId === 'expenses' && data.title && item.title) {
          return item.title === data.title;
        }
        return false;
      });
      
      if (duplicate) {
        const duplicateType = collectionId === 'employees' ? 'Badge number' : 'Title';
        const duplicateValue = collectionId === 'employees' ? data.badgeNumber : data.title;
        throw new Error(`${duplicateType} "${duplicateValue}" already exists.`);
      }
      
      await storage.save(key, cleanData);
      
      // Try to update in Appwrite
      if (await isOnline() && client && databases) {
        try {
          // Use cached authentication status
          const isAuthenticated = await getCachedAuthStatus();
          
          if (isAuthenticated) {
            const collectionMap = {
              employees: config.employeesCollectionId,
              cases: config.casesCollectionId,
              expenses: config.expensesCollectionId,
              attendance: config.attendanceCollectionId,
              customOptions: config.customOptionsCollectionId
            };
            
            const appwriteData = await cleanDataForAppwrite(cleanData, collectionId);
            
            // Validate that we have data to send
            if (!appwriteData || Object.keys(appwriteData).length === 0) {
              console.warn('⚠️ No valid data to send to Appwrite, skipping update');
              return cleanData;
            }
            
            // Try to update document first, if it doesn't exist then create it
            try {
              const validDocumentId = generateValidAppwriteId(documentId);
              await databases.updateDocument(
                config.databaseId,
                collectionMap[collectionId],
                validDocumentId,
                appwriteData
              );
              
              // Mark as synced after successful Appwrite update
              await markItemAsSynced(collectionId, documentId);
              

              
            } catch (updateError) {
              if (updateError.message.includes('Document with the requested ID could not be found')) {
                // Document doesn't exist, create it
                try {
                await databases.createDocument(
                  config.databaseId,
                  collectionMap[collectionId],
                  validDocumentId,
                  appwriteData
                );
                
                // Mark as synced after successful Appwrite create
                await markItemAsSynced(collectionId, documentId);
                

                
                  } catch (createError) {
                  throw createError;
                }
              } else {
                throw updateError;
              }
            }
          } 
        } catch (error) {
                await pendingSyncQueue.addPendingSync('update', collectionId, cleanData, documentId);
        }
      } else {
              await pendingSyncQueue.addPendingSync('update', collectionId, cleanData, documentId);
      }
      
      return cleanData;
    } catch (error) {
      console.error('❌ Error updating data:', error);
      throw error;
    }
      
    
  },

  async deleteData(key, documentId, collectionId) {
    try {

      await storage.delete(key);
      
      // Try to delete from Appwrite
      if (await isOnline() && client && databases) {
        try {
          // Use cached authentication status
          const isAuthenticated = await getCachedAuthStatus();
          
          if (isAuthenticated) {
                const collectionMap = {
              employees: config.employeesCollectionId,
              cases: config.casesCollectionId,
              expenses: config.expensesCollectionId,
              attendance: config.attendanceCollectionId,
              customOptions: config.customOptionsCollectionId
            };
            
              const validDocumentId = generateValidAppwriteId(documentId);
            await databases.deleteDocument(
              config.databaseId,
              collectionMap[collectionId],
              validDocumentId
            );
            
            // Mark as synced after successful Appwrite delete
            await markItemAsSynced(collectionId, documentId);
            

            } 
        } catch (error) {
            // Add to pending sync queue for later retry
          await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
        }
      } else {
          await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
      }
      
      return { success: true, id: documentId };
    } catch (error) {
      console.error('❌ Error deleting data:', error);
      throw error;
    }
  },



  // Test function to verify Appwrite setup
  async testAppwriteSetup() {
    try {
      // Basic initialization checks
      if (!client || !databases || !account) {
        throw new Error('One or more Appwrite services not properly initialized');
      }
      
      // Test database connection
      const result = await databases.listDocuments(
        appwrite.databaseId,
        appwrite.collections.employees,
        [],
        1
      );

      return {
        success: true,
        message: 'Appwrite is working correctly',
        documents: result.documents
      };

    } catch (error) {
      console.error('❌ Appwrite test failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  },



  async debugCollections() {
    try {
        if (!client || !databases) {
          return { success: false, error: 'Appwrite not initialized' };
      }
      
      const result = await databases.listCollections(config.databaseId);
        return {
        success: true,
        config: { databaseId: config.databaseId },
        collections: result.collections.map(c => ({ id: c.$id, name: c.name }))
      };
    } catch (error) {
      console.error('❌ Debug collections error:', error);
      return { success: false, error: error.message };
    }
  },

     // Sync pending data (for backward compatibility)
       async syncPendingData() {
      try {
        const collections = ['employees', 'cases', 'expenses', 'attendance'];
        let totalSynced = 0;
        let totalUpdated = 0;
       
       for (const collectionId of collections) {
         const localData = await this.getItems(collectionId);
         if (localData.length > 0) {     
                       // Get existing Appwrite documents to check for duplicates
            let existingDocs = [];
            try {
              const collectionMap = {
                employees: config.employeesCollectionId,
                cases: config.casesCollectionId,
                expenses: config.expensesCollectionId,
                attendance: config.attendanceCollectionId,
                customOptions: config.customOptionsCollectionId
              };
             
             const appwriteDocs = await databases.listDocuments(
               config.databaseId,
               collectionMap[collectionId]
             );
             existingDocs = appwriteDocs.documents;
           } catch (error) {
              }
           
           // Try to sync each item to Appwrite
           for (const item of localData) {
             try {
                               if (await isOnline() && client && databases) {
                  const collectionMap = {
                    employees: config.employeesCollectionId,
                    cases: config.casesCollectionId,
                    expenses: config.expensesCollectionId,
                    attendance: config.attendanceCollectionId,
                    customOptions: config.customOptionsCollectionId
                  };
                 
                 const cleanData = await cleanDataForAppwrite(item, collectionId);
                   
                 // Check if document already exists in Appwrite
                 let existingDoc = null;
                 if (collectionId === 'employees' && item.badgeNumber) {
                   existingDoc = existingDocs.find(doc => doc.badgeNumber === item.badgeNumber);
                 } else if ((collectionId === 'cases' || collectionId === 'expenses') && item.title) {
                   existingDoc = existingDocs.find(doc => doc.title === item.title);
                 }
                 else if (collectionId === 'attendance' && item.id) {
                  // Match on your custom ID (date_employeeId)
                  existingDoc = existingDocs.find(doc => doc.$id === item.id);
                }
                 if (existingDoc) {
                   // Update existing document
                     await databases.updateDocument(
                     config.databaseId,
                     collectionMap[collectionId],
                     existingDoc.$id,
                     cleanData
                   );
                   totalUpdated++;
                   } else {
                   // Create new document
                       await databases.createDocument(
                     config.databaseId,
                     collectionMap[collectionId],
                     generateValidAppwriteId(item.id || item.$id),
                     cleanData
                   );
                   totalSynced++;
                    }
               }
             } catch (error) {
                }
           }
         }
       }
       
       const message = `Sync completed. Created ${totalSynced} new items, updated ${totalUpdated} existing items.`;
         return { 
         success: true, 
         message,
         created: totalSynced,
         updated: totalUpdated
       };
     } catch (error) {
       console.error('❌ Sync pending data failed:', error);
       return { success: false, error: error.message };
     }
   },

  // Storage stats
  async getStorageStats() {
    try {
        const keys = await storage.getAllKeys();
             const collections = ['employees', 'cases', 'expenses', 'attendance'];
      const stats = { total: 0, invalidItems: 0, byCollection: {} };
      
      for (const collection of collections) {
        const collectionKeys = keys.filter(key => key.startsWith(`${collection}_`));
        const items = await Promise.all(
          collectionKeys.map(async key => {
            const data = await storage.get(key);
            return data ? { ...data, key } : null;
          })
        );
        
        const validItems = items.filter(item => item !== null);
        const invalidItems = items.filter(item => item === null);
        
        stats.byCollection[collection] = {
          total: validItems.length,
          invalid: invalidItems.length
        };
        
        stats.total += validItems.length;
        stats.invalidItems += invalidItems.length;
      }
      
        return stats;
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { total: 0, invalidItems: 0, byCollection: {} };
    }
  },

  // Sync status
  async getSyncStatus() {
    try {
      const online = await isOnline();
        return {
        online,
        pendingSync: 0, // Simplified for now
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return { online: false, pendingSync: 0, lastSync: null };
    }
  },

  // Manual sync
  async manualSync() {
    try {
      const result = await this.syncPendingData();
      return result;
    } catch (error) {
      console.error('❌ Error during manual sync:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up existing attendance data
  async cleanupAttendanceData() {
    try {
        const keys = await storage.getAllKeys();
      const attendanceKeys = keys.filter(key => key.startsWith('attendance_'));
      
      let cleanedCount = 0;
      for (const key of attendanceKeys) {
        const data = await storage.get(key);
        if (data) {
          // Ensure checkInTimes and checkOutTimes are arrays
          const cleanData = {
            ...data,
            checkInTimes: Array.isArray(data.checkInTimes) ? data.checkInTimes : [],
            checkOutTimes: Array.isArray(data.checkOutTimes) ? data.checkOutTimes : [],
            timestamp: data.timestamp || new Date().toISOString()
          };
          await storage.save(key, cleanData);
          cleanedCount++;
        }
      }
      
        return { success: true, cleanedCount };
    } catch (error) {
      console.error('❌ Error cleaning up attendance data:', error);
      return { success: false, error: error.message };
    }
  },


};

// Auth service
export const authService = {
  async login(email, password) {
    try {
        await account.deleteSession("current").catch(() => {});
      clearAuthCache(); // Clear cache before login
      const result = await account.createEmailPasswordSession(email, password);
      clearAuthCache(); // Clear cache after login to force refresh
        return result;
    } catch (error) {
      // Extract clean error message from Appwrite error format
      let cleanErrorMessage = error.message || '';
      if (cleanErrorMessage.includes('AppwriteException:')) {
        cleanErrorMessage = cleanErrorMessage.split('AppwriteException:')[1]?.trim() || cleanErrorMessage;
      }
        
      // Handle specific Appwrite errors and provide user-friendly messages
      let userFriendlyMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.message) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid credentials') || 
            errorMessage.includes('invalid email') || 
            errorMessage.includes('invalid password')) {
          userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('user not found')) {
          userFriendlyMessage = 'Account not found. Please check your email address or create a new account.';
        } else if (errorMessage.includes('email not verified')) {
          userFriendlyMessage = 'Please verify your email address before logging in.';
        } else if (errorMessage.includes('too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
        }
      }
      
      // Create a new error with user-friendly message
      const friendlyError = new Error(userFriendlyMessage);
      friendlyError.originalError = error;
      throw friendlyError;
    }
  },



  async getUser() {
    try {
      const user = await account.get();
        return user;
    } catch (error) {
        return null;
    }
  },

  async logout() {
    try {
        
      // Delete Appwrite session
      await account.deleteSession("current");
      clearAuthCache(); // Clear cache on logout
        
      // Clear stored user data from AsyncStorage
      try {
        await AsyncStorage.removeItem('verified_user');
        } catch (storageError) {
         }
      
      } catch (error) {
        throw error;
    }
  },

  async saveVerifiedUserToStorage(user, email, password) {
    try {
        const userData = {
        user: user,
        credentials: {
          email: email,
          password: password
        },
        isVerified: true,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem('verified_user', JSON.stringify(userData));
      } catch (error) {
      console.error('❌ Error saving verified user to storage:', error);
      throw error;
    }
  },

  async getVerifiedUserFromStorage() {
    try {
        const userData = await AsyncStorage.getItem('verified_user');
      if (userData) {
        const parsedData = JSON.parse(userData);
          return parsedData;
      }
        return null;
    } catch (error) {
      console.error('❌ Error getting verified user from storage:', error);
      return null;
    }
  },

  async isUserAvailableOffline() {
    try {
      const userData = await this.getVerifiedUserFromStorage();
      return userData && userData.isVerified;
    } catch (error) {
      console.error('❌ Error checking offline user availability:', error);
      return false;
    }
  }
};

// Pending sync queue
const pendingSyncQueue = {
  async addPendingSync(operation, collectionId, data, documentId = null) {
    try {
      const pendingItem = {
        id: ID.unique(),
        operation, // 'create', 'update', 'delete'
        collectionId,
        data,
        documentId,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };
      
      const pendingKey = `pending_sync_${pendingItem.id}`;
      await storage.save(pendingKey, pendingItem);
        return pendingItem;
    } catch (error) {
      console.error('❌ Error adding to pending sync:', error);
    }
  },

  async getPendingSyncItems() {
    try {
      const keys = await storage.getAllKeys();
      const pendingKeys = keys.filter(key => key.startsWith('pending_sync_'));
      
      const pendingItems = await Promise.all(
        pendingKeys.map(async key => {
          const item = await storage.get(key);
          return item;
        })
      );
      
      return pendingItems.filter(item => item !== null);
    } catch (error) {
      console.error('❌ Error getting pending sync items:', error);
      return [];
    }
  },

  async removePendingSync(pendingId) {
    try {
      const pendingKey = `pending_sync_${pendingId}`;
      await storage.delete(pendingKey);
      } catch (error) {
      console.error('❌ Error removing pending sync:', error);
    }
  },

  async clearPendingSync() {
    try {
      const keys = await storage.getAllKeys();
      const pendingKeys = keys.filter(key => key.startsWith('pending_sync_'));
      
      await Promise.all(
        pendingKeys.map(key => storage.delete(key))
      );
      
      } catch (error) {
      console.error('❌ Error clearing pending sync:', error);
    }
  }
};



// Sync monitor service
export const syncMonitor = {
  async getStatus() {
    try {
      const pendingItems = await pendingSyncQueue.getPendingSyncItems();
      const pendingCount = pendingItems.length;
      
      return {
        pendingCount,
        pendingItems,
        hasPendingItems: pendingCount > 0,
        summary: this.generateSummary(pendingItems)
      };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return {
        pendingCount: 0,
        pendingItems: [],
        hasPendingItems: false,
        summary: 'Error getting sync status'
      };
    }
  },

  generateSummary(pendingItems) {
    if (!pendingItems || pendingItems.length === 0) {
      return 'No pending sync items';
    }

    const operationCounts = pendingItems.reduce((acc, item) => {
      acc[item.operation] = (acc[item.operation] || 0) + 1;
      return acc;
    }, {});

    const collectionCounts = pendingItems.reduce((acc, item) => {
      acc[item.collectionId] = (acc[item.collectionId] || 0) + 1;
      return acc;
    }, {});

    return {
      total: pendingItems.length,
      operations: operationCounts,
      collections: collectionCounts,
      oldestItem: pendingItems.length > 0 ? pendingItems[0].timestamp : null,
      newestItem: pendingItems.length > 0 ? pendingItems[pendingItems.length - 1].timestamp : null
    };
  },

  async getComprehensiveStatus() {
    try {
      const [syncStatus, storageStats] = await Promise.all([
        this.getStatus(),
        dataService.getStorageStats()
      ]);
      
      return {
        sync: syncStatus,
        storage: storageStats,
        summary: {
          pendingSync: syncStatus.pendingCount,
          totalItems: storageStats.total,
          invalidItems: storageStats.invalidItems,
          needsCleanup: storageStats.invalidItems > 0
        }
      };
    } catch (error) {
      console.error('❌ Error getting comprehensive status:', error);
      return {
        sync: { pendingCount: 0, hasPendingItems: false },
        storage: { total: 0, invalidItems: 0 },
        summary: { pendingSync: 0, totalItems: 0, invalidItems: 0, needsCleanup: false }
      };
    }
  },

  async getSyncHealthReport() {
    try {
      const [status, stats] = await Promise.all([
        dataService.getSyncStatus(),
        dataService.getStorageStats()
      ]);
      
      const health = {
        online: status.online,
        pendingSync: status.pendingSync,
        storageHealth: {
          total: stats.total,
          invalid: stats.invalidItems,
          valid: stats.total - stats.invalidItems,
          healthPercentage: stats.total > 0 ? ((stats.total - stats.invalidItems) / stats.total * 100).toFixed(1) : 100
        },
        collections: stats.byCollection,
        recommendations: []
      };
      
      // Generate recommendations
      if (health.storageHealth.invalid > 0) {
        health.recommendations.push('Run cleanup to remove invalid items');
      }
      if (health.pendingSync > 10) {
        health.recommendations.push('High pending sync count - consider manual sync');
      }
      if (!health.online) {
        health.recommendations.push('Currently offline - sync will resume when online');
      }
      if (health.storageHealth.healthPercentage < 90) {
        health.recommendations.push('Storage health below 90% - consider cleanup');
      }
      
      return health;
    } catch (error) {
      console.error('❌ Error getting sync health report:', error);
      return {
        online: false,
        pendingSync: 0,
        storageHealth: { total: 0, invalid: 0, valid: 0, healthPercentage: 0 },
        collections: {},
        recommendations: ['Error getting health report']
      };
    }
  }
};

// Network status hook
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsConnected(state.isConnected);
      } catch {
        setIsConnected(false);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
};

// Smart sync with timestamps
async function getLastSyncTime(collectionId) {
  try {
    const lastSyncKey = `lastSync_${collectionId}`;
    const lastSyncTime = await AsyncStorage.getItem(lastSyncKey);
    return lastSyncTime ? parseInt(lastSyncTime) : 0;
  } catch (error) {
    console.error(`❌ Error getting last sync time for ${collectionId}:`, error);
    return 0;
  }
}

async function setLastSyncTime(collectionId, timestamp) {
  try {
    const lastSyncKey = `lastSync_${collectionId}`;
    await AsyncStorage.setItem(lastSyncKey, timestamp.toString());
  } catch (error) {
    console.error(`❌ Error setting last sync time for ${collectionId}:`, error);
  }
}

async function getLocalItemsSince(collectionId, sinceTimestamp) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const collectionKeys = allKeys.filter(key => key.startsWith(`${collectionId}_`));
    
    const items = [];
    for (const key of collectionKeys) {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          const itemTimestamp = new Date(parsedItem.updatedAt || parsedItem.createdAt).getTime();
          
          if (itemTimestamp > sinceTimestamp) {
            items.push(parsedItem);
          }
        }
      } catch (error) {
        console.error(`❌ Error parsing item ${key}:`, error);
      }
    }
    
    return items;
  } catch (error) {
    console.error(`❌ Error getting local items since ${sinceTimestamp}:`, error);
    return [];
  }
}

// Background sync service
export const backgroundSyncService = {
  isRunning: false,
  syncInterval: null,

  async startBackgroundSync() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initial sync
    await this.performBackgroundSync();

    // Set up periodic sync every 5 minutes (reduced frequency)
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, 300000); // 5 minutes
  },

  async syncPendingChanges(currentUserFromContext = null) {
    try {
        
      if (!(await isOnline()) || !client || !databases) {
          return { success: false, message: 'Offline or Appwrite not available' };
      }

      // Check if user is authenticated - try multiple methods
      let user = null;
      let authMethod = 'none';
      
      // First, try to use user from context if provided
      if (currentUserFromContext) {
        user = currentUserFromContext;
        authMethod = 'context';
        } else {
        // Try Appwrite session
        try {
          user = await account.get();
          authMethod = 'appwrite_session';
        } catch (authError) {
            // Continue with sync even if Appwrite session is not available
          // The sync will work with the data we have
        }
      }

      if (!user) {
          // Continue with sync even without user - this allows syncing offline data
      } else {
         }

      const pendingItems = await pendingSyncQueue.getPendingSyncItems();
      ;

      if (pendingItems.length === 0) {
        return { success: true, message: 'No pending items to sync' };
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of pendingItems) {
        try {
          const collectionMap = {
            employees: config.employeesCollectionId,
            cases: config.casesCollectionId,
            expenses: config.expensesCollectionId,
            attendance: config.attendanceCollectionId,
            customOptions: config.customOptionsCollectionId
          };

          const appwriteCollectionId = collectionMap[item.collectionId];
          if (!appwriteCollectionId) {
            console.warn(`⚠️ No Appwrite collection mapping for ${item.collectionId}`);
            continue;
          }

          switch (item.operation) {
            case 'create':
              const createData = await cleanDataForAppwrite(item.data, item.collectionId);
              // Use the documentId from the pending sync item, fallback to data.id or data.$id
              const createDocumentId = generateValidAppwriteId(item.documentId || item.data.id || item.data.$id);

              // Check for duplicates in Appwrite before creating
              try {
                // Try to find existing document with same business key
                let existingDoc = null;
                if (item.collectionId === 'employees' && item.data.badgeNumber) {
                  const existingDocs = await databases.listDocuments(
                    config.databaseId,
                    appwriteCollectionId,
                    [Query.equal('badgeNumber', item.data.badgeNumber)]
                  );
                  if (existingDocs.documents.length > 0) {
                    existingDoc = existingDocs.documents[0];
                  }
                } else if ((item.collectionId === 'cases' || item.collectionId === 'expenses') && item.data.title) {
                  const existingDocs = await databases.listDocuments(
                    config.databaseId,
                    appwriteCollectionId,
                    [Query.equal('title', item.data.title)]
                  );
                  if (existingDocs.documents.length > 0) {
                    existingDoc = existingDocs.documents[0];
                  }
                }

                if (existingDoc) {
                  // Update existing document instead of creating new one
                  await databases.updateDocument(
                    config.databaseId,
                    appwriteCollectionId,
                    existingDoc.$id,
                    createData
                  );
                  } else {
                  // Create new document
                  await databases.createDocument(
                    config.databaseId,
                    appwriteCollectionId,
                    createDocumentId,
                    createData
                  );
                   }
              } catch (createError) {
                if (createError.message.includes('Document with the requested ID already exists')) {
                  // Document already exists, update it instead
                  try {
                    await databases.updateDocument(
                      config.databaseId,
                      appwriteCollectionId,
                      createDocumentId,
                      createData
                    );
                    } catch (updateError) {
                    console.error(`❌ Failed to update existing document: ${updateError.message}`);
                    throw updateError;
                  }
                } else {
                  console.error(`❌ Failed to create document: ${createError.message}`);
                  throw createError;
                }
              }
              break;

            case 'update':
              const updateData = await cleanDataForAppwrite(item.data, item.collectionId);
              // Use the documentId from the pending sync item, fallback to data.id or data.$id
              const updateDocumentId = generateValidAppwriteId(item.documentId || item.data.id || item.data.$id);

              try {
                await databases.updateDocument(
                  config.databaseId,
                  appwriteCollectionId,
                  updateDocumentId,
                  updateData
                );
                } catch (updateError) {
                if (updateError.message.includes('Document with the requested ID could not be found')) {
                  // Document doesn't exist, create it
                  try {
                    await databases.createDocument(
                      config.databaseId,
                      appwriteCollectionId,
                      updateDocumentId,
                      updateData
                    );
                    } catch (createError) {
                    throw createError;
                  }
                } else {
                  throw updateError;
                }
              }
              break;

            case 'delete':
              const deleteDocumentId = generateValidAppwriteId(item.documentId);
              await databases.deleteDocument(
                config.databaseId,
                appwriteCollectionId,
                deleteDocumentId
              );
                break;
          }

          // Remove from pending queue on success
          await pendingSyncQueue.removePendingSync(item.id);
          successCount++;

        } catch (error) {
          console.error(`❌ Failed to sync ${item.operation} ${item.collectionId}:`, error);
          errorCount++;
          
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount >= 3) {
              await pendingSyncQueue.removePendingSync(item.id);
          }
        }
      }

        return { 
        success: true, 
        message: `Synced ${successCount} items, ${errorCount} errors`,
        successCount,
        errorCount
      };

    } catch (error) {
      console.error('❌ Pending sync failed:', error);
      return { success: false, message: error.message };
    }
  },

  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    },

  async performBackgroundSync() {
    try {
      if (!(await isOnline()) || !client || !databases) {
          return;
      }

      // First, sync any pending changes
      await this.syncPendingChanges();

      const collections = ['employees', 'cases', 'expenses', 'attendance'];
      let totalSynced = 0;

      for (const collectionId of collections) {
        // Use smart sync - only get items changed since last sync
        const lastSyncTime = await getLastSyncTime(collectionId);
        const changedItems = await getLocalItemsSince(collectionId, lastSyncTime);
        
        if (changedItems.length === 0) {
          console.log(`🔄 [SMART SYNC] No changes for ${collectionId} since last sync`);
          continue;
        }
        
        console.log(`🔄 [SMART SYNC] Found ${changedItems.length} changed items for ${collectionId}`);

        try {
                     const collectionMap = {
             employees: config.employeesCollectionId,
             cases: config.casesCollectionId,
             expenses: config.expensesCollectionId,
             attendance: config.attendanceCollectionId,
             customOptions: config.customOptionsCollectionId
           };

          // Get all existing documents from Appwrite for this collection
          const existingDocs = await databases.listDocuments(
            config.databaseId,
            collectionMap[collectionId]
          );
          
          const existingDocIds = existingDocs.documents.map(doc => doc.$id);
          ;

          // Check for duplicates and sync documents that don't exist in Appwrite
          for (const item of changedItems) {
            const itemId = item.id || item.$id;
            
            if (!existingDocIds.includes(itemId)) {
              try {
                // Check for duplicates based on business rules before creating
                let existingDoc = null;
                if (collectionId === 'employees' && item.badgeNumber) {
                  const existingDocs = await databases.listDocuments(
                    config.databaseId,
                    collectionMap[collectionId],
                    [Query.equal('badgeNumber', item.badgeNumber)]
                  );
                  if (existingDocs.documents.length > 0) {
                    existingDoc = existingDocs.documents[0];
                  }
                } else if ((collectionId === 'cases' || collectionId === 'expenses') && item.title) {
                  const existingDocs = await databases.listDocuments(
                    config.databaseId,
                    collectionMap[collectionId],
                    [Query.equal('title', item.title)]
                  );
                  if (existingDocs.documents.length > 0) {
                    existingDoc = existingDocs.documents[0];
                  }
                }

                if (existingDoc) {
                  // Update existing document instead of creating new one
                    const cleanData = await cleanDataForAppwrite(item, collectionId);
                  await databases.updateDocument(
                    config.databaseId,
                    collectionMap[collectionId],
                    existingDoc.$id,
                    cleanData
                  );
                  totalSynced++;
                  } else {
                  // Create new document
                  const cleanData = await cleanDataForAppwrite(item, collectionId);
                await databases.createDocument(
                  config.databaseId,
                  collectionMap[collectionId],
                  generateValidAppwriteId(itemId),
                  cleanData
                );
                totalSynced++;
                  }
              } catch (error) {
                 }
            } else {
               }
          }
        } catch (error) {
           }
      }

      if (totalSynced > 0) {
        console.log(`✅ [SMART SYNC] Successfully synced ${totalSynced} items`);
        // Update last sync time for all collections
        const currentTime = Date.now();
        for (const collectionId of collections) {
          await setLastSyncTime(collectionId, currentTime);
        }
      } else {
        console.log(`🔄 [SMART SYNC] No items to sync`);
      }
    } catch (error) {
      console.error('❌ Background sync error:', error);
    }
  }
};

// Auto-initialize default options when service is loaded
const autoInitializeDefaults = async () => {
  try {
    // Wait a bit for Appwrite to initialize
    setTimeout(async () => {
      const status = await customOptionsService.checkDefaultOptionsStatus();
      const needsInitialization = Object.values(status).some(item => !item.hasLocal);
      
      if (needsInitialization) {
        await customOptionsService.initializeDefaultOptions();
      } else {
      }
    }, 2000);
  } catch (error) {
     }
};

// Auto-start background sync when service is loaded - ONE TIME ONLY
const autoStartBackgroundSync = async () => {
  try {
    // Check if we've already done the one-time sync
    const hasSyncedOnce = await AsyncStorage.getItem('one_time_sync_completed');
    
    if (hasSyncedOnce) {
      console.log('✅ One-time sync already completed, skipping background sync');
      return;
    }
    
    // Wait a bit for Appwrite to initialize
    setTimeout(async () => {
      try {
        // Perform one-time sync
        await backgroundSyncService.performOneTimeSync();
        
        // Mark as completed
        await AsyncStorage.setItem('one_time_sync_completed', 'true');
        console.log('✅ One-time sync completed successfully');
        
        // Don't start continuous background sync
        // backgroundSyncService.startBackgroundSync();
      } catch (error) {
        console.error('❌ One-time sync failed:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('❌ Error in auto-start background sync:', error);
  }
};

// Start auto-initialization - DISABLED to prevent Appwrite calls
// autoInitializeDefaults();
// autoStartBackgroundSync();

// Debug attendance data on service load - DISABLED
// setTimeout(async () => {
//     await storage.debugAttendanceData();
// }, 5000); // Run after 5 seconds to allow other services to initialize

// Clean up attendance data on service load - DISABLED
// setTimeout(async () => {
//     await dataService.cleanupAttendanceData();
// }, 7000); // Run after 7 seconds

// Test Appwrite setup on service load - DISABLED
// setTimeout(async () => {
//     await dataService.testAppwriteSetup();
// }, 6000); // Run after 6 seconds

// Export everything - DISABLED to prevent conflicts with hybrid service
// export const { 
//   getItems, 
//   saveData, 
//   updateData, 
//   deleteData,
//   uploadFile,
//   deleteFile,
//   testAppwriteSetup,
//   cleanupAttendanceData,
//   getUnsyncedItems,
//   getSyncStatus,
//   syncUnsyncedItems,

// } = dataService;
export const { login, getUser, logout } = authService;
export { customOptionsService };
// export { storage }; // DISABLED to prevent conflicts

