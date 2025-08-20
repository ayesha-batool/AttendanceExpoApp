import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Client, Databases, ID, Query, Storage } from 'appwrite';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
// Unified config
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID || 'shelfie_database',
  employeesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID || '689ca41b00061e94a51f',
  casesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CASES_COLLECTION_ID || 'cases',
  expensesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID || 'expenses',
  attendanceCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION_ID || 'attendance',
  customOptionsCollectionId: 'customOptions'
};

// Initialize Appwrite
const client = new Client();
const account = new Account(client);
const databases = new Databases(client);
const appwriteStorage = new Storage(client);

try {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  
  if (!projectId) {
    console.error('🚨 EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set! Please add it to your .env file');
    throw new Error('Appwrite Project ID not configured');
  }
  
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
    
  console.log('✅ Appwrite initialized successfully');
  console.log('📍 Endpoint:', endpoint);
  console.log('🆔 Project ID:', projectId);
} catch (error) {
  console.error('❌ Failed to initialize Appwrite:', error);
  console.error('💡 Please check your .env file and ensure EXPO_PUBLIC_APPWRITE_PROJECT_ID is set correctly');
}

// Utility functions
const generateId = () => {
  // Generate a valid Appwrite document ID (max 36 chars, alphanumeric + period, hyphen, underscore)
  // Use a shorter timestamp + random string to ensure we stay under 36 chars
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 26); // 24 chars
  return `${timestamp}_${randomStr}`; // 8 + 1 + 24 = 33 chars total
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

// Get device identifier
const getDeviceId = async () => {
  try {
    // Check if we have a stored device ID first
    const storedDeviceId = await storage.get('device_id');
    console.log("storedDeviceId",storedDeviceId)
    if (storedDeviceId) {
      return storedDeviceId;
    }

    let deviceId = 'unknown_device';
    
    // Try to get device name from Constants
    if (Constants.expoConfig?.name) {
      deviceId = Constants.expoConfig.name;
    }
    
    // Try to get device name from platform with more specific info
    if (Constants.platform) {
      const platform = Constants.platform;
      if (platform.ios) {
        const deviceName = platform.ios.deviceName || 'iPhone';
        const systemVersion = platform.ios.systemVersion || 'unknown';
        deviceId = `${deviceName}_iOS_${systemVersion}`;
      }
      if (platform.android) {
        const deviceName = platform.android.deviceName || 'Android';
        const versionCode = platform.android.versionCode || 'unknown';
        const model = platform.android.model || 'unknown';
        deviceId = `${deviceName}_${model}_Android_${versionCode}`;
      }
      if (platform.web) {
        const userAgent = platform.web.userAgent || 'unknown';
        // Extract browser and OS info from user agent
        const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
        const osMatch = userAgent.match(/\((.*?)\)/);
        const browser = browserMatch ? browserMatch[1] : 'Browser';
        const os = osMatch ? osMatch[1].split(';')[0].trim() : 'OS';
        deviceId = `Desktop_${os}_${browser}`;
      }
    }
    
    // Add timestamp to make it more unique
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits
    deviceId = `${deviceId}_${timestamp}`;
    
    // Store the device ID for future use
    await storage.save('device_id', deviceId);
    
    console.log(`🔧 Generated device ID: ${deviceId}`);
    return deviceId;
  } catch (error) {
    console.error('Error getting device info:', error);
    return 'unknown_device';
  }
};


// Clean data for Appwrite - remove id and $id fields and keep only allowed fields
const cleanDataForAppwrite = async (data, collectionId) => {
  const { id, $id, ...baseData } = data;
  
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
  for (const field of allowedFieldsForCollection) {
    if (baseData.hasOwnProperty(field)) {
      // Don't skip empty arrays for attendance data (checkInTimes, checkOutTimes)
      if (collectionId === 'attendance' && (field === 'checkInTimes' || field === 'checkOutTimes')) {
        cleanData[field] = Array.isArray(baseData[field]) ? baseData[field] : [];
        continue;
      }
        
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
  
  console.log('🧹 Cleaned data for Appwrite:', { 
    collection: collectionId,
    original: baseData, 
    cleaned: cleanData,
    allowedFields: allowedFieldsForCollection
  });
  
  return cleanData;
};



// Unified storage
const storage = {
  async save(key, data) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },
  async get(key) {
    const data = await AsyncStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : null;
    return parsed;
  },
  async delete(key) {
    await AsyncStorage.removeItem(key);
  },
  async getAllKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  },

  // Debug function to log all attendance, holidays, and leaves data
  async debugAttendanceData() {
    try {
      
      const allKeys = await this.getAllKeys();
      // Get data using unified data service methods
      console.log('📊 === ATTENDANCE DATA ===');
      const attendanceData = await getItems('attendance');
      console.log('📅 Attendance records:', attendanceData);
      
      
      
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
  
    gender: [
      'Male', 'Female', 'Non-Binary', 'Other', 'Rather not say'
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
          // Check if user is authenticated before making Appwrite calls
          let user = null;
          try {
            user = await account.get();
          } catch (authError) {
            if (authError.message.includes('missing scope (account)') || authError.message.includes('User (role: guests)')) {
              console.log(`👤 User not authenticated, redirecting to auth page`);
              // Throw a specific error that can be caught by the UI to redirect to auth
              const authError = new Error('AUTHENTICATION_REQUIRED');
              authError.code = 'AUTH_REQUIRED';
              authError.message = 'User not authenticated. Please log in to continue.';
              throw authError;
            }
            throw authError;
          }
          
          if (!user) {
            console.log(`👤 No authenticated user, redirecting to auth page`);
            // Throw a specific error that can be caught by the UI to redirect to auth
            const authError = new Error('AUTHENTICATION_REQUIRED');
            authError.code = 'AUTH_REQUIRED';
            authError.message = 'User not authenticated. Please log in to continue.';
            throw authError;
          }
          
          console.log(`🌐 Fetching ${collectionId} from Appwrite...`);
          
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
          console.log("appwriteCollec tionId",appwriteCollectionId)
          // Fetch from Appwrite
          const appwriteDocuments = await databases.listDocuments(
            config.databaseId,
            appwriteCollectionId,
            [Query.limit(100)] // Limit to 100 documents
          );
          
          console.log(`📥 Received ${appwriteDocuments.documents.length} documents from Appwrite for ${collectionId}`);
          
          // Get all local keys for this collection
          const localKeys = await storage.getAllKeys();
          const collectionLocalKeys = localKeys.filter(key => key.startsWith(`${collectionId}_`));
          console.log("collectionLocalKeys",collectionLocalKeys)
          // Create a set of Appwrite document IDs for fast lookup
          const appwriteDocIds = new Set(appwriteDocuments.documents.map(doc => doc.$id));
          
          // Remove local items that no longer exist in Appwrite (deletions)
          for (const localKey of collectionLocalKeys) {
            const localDocId = localKey.split('_')[1];
            if (!appwriteDocIds.has(localDocId)) {
              await storage.delete(localKey);
              console.log(`🗑️ Removed deleted document ${localDocId} from local storage`);
            }
          }
          
          // Store each document in local storage (if not duplicate or if newer)
          for (const doc of appwriteDocuments.documents) {
            const localKey = `${collectionId}_${doc.$id}`;
            const existingData = await storage.get(localKey);
            
            // Only save if it doesn't exist locally or if Appwrite version is newer
            if (!existingData || (doc.$updatedAt && existingData.$updatedAt && doc.$updatedAt > existingData.$updatedAt)) {
              const localData = {
                ...doc,
                id: doc.$id,
                $id: doc.$id,
                $createdAt: doc.$createdAt,
                $updatedAt: doc.$updatedAt,
                deviceId: doc.deviceId || 'unknown'
              };
              await storage.save(localKey, localData);
              console.log(`💾 Synced document ${doc.$id} (device: ${doc.deviceId || 'unknown'}) to local storage`);
            }
          }
          
        } catch (appwriteError) {
          console.error(`❌ Appwrite sync failed for ${collectionId}:`, appwriteError);
          console.log(`📱 Falling back to local storage for ${collectionId}`);
        }
      } else {
        console.log(`📱 Offline mode: using local storage for ${collectionId}`);
      }
      
      // Get data from local storage (combines local and synced data)
      const keys = await storage.getAllKeys();
      const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
      
      if (collectionKeys.length === 0) {
        console.log(`📭 No local data found for ${collectionId}`);
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
      console.log(`📊 Returning ${validItems.length} items for ${collectionId} (mix of local and synced data)`);
      return validItems;
      
    } catch (error) {
      console.error(`❌ Error getting items for ${collectionId}:`, error);
      return [];
    }
  },

  async saveData(data, collectionId) {
    try {
      console.log(data)
      const deviceId = await getDeviceId();
      const uniqueId = generateValidAppwriteId(data.id || data.$id);
      const cleanData = { ...data, id: uniqueId, $id: uniqueId, deviceId: deviceId };
      console.log("id",uniqueId, "deviceId", deviceId)
      
      // Check for duplicates only within same device
      const existing = await dataService.getItems(collectionId);
      const duplicate = existing.find(item => {
        if (item.deviceId === deviceId) {
          if (collectionId === 'employees' && data.badgeNumber && item.badgeNumber) {
            return item.badgeNumber === data.badgeNumber;
          }
          if (collectionId === 'cases' && data.title && item.title) {
            return item.title === data.title;
          }
          if (collectionId === 'expenses' && data.title && item.title) {
            return item.title === data.title;
          }
        }
        return false;
      });
      
      if (duplicate) {
        throw new Error(`${collectionId === 'employees' ? 'Badge number' : 'Title'} already exists on this device.`);
      }
      
      const key = `${collectionId}_${uniqueId}`;
      await storage.save(key, cleanData);
      
      // Try to save to Appwrite
      if (await isOnline() && client && databases) {
        try {
          // Check if user is authenticated before making Appwrite calls
          let user = null;
          try {
            user = await account.get();
          } catch (authError) {
            if (authError.message.includes('missing scope (account)') || authError.message.includes('User (role: guests)')) {
              console.log(`👤 User not authenticated, adding to pending sync for ${collectionId}`);
              await pendingSyncQueue.addPendingSync('create', collectionId, cleanData, uniqueId);
              return cleanData;
            }
            throw authError;
          }
          
          if (!user) {
            console.log(`👤 No authenticated user, adding to pending sync for ${collectionId}`);
            await pendingSyncQueue.addPendingSync('create', collectionId, cleanData, uniqueId);
            return cleanData;
          }
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
          console.log(cleanData)
          const appwriteData = await cleanDataForAppwrite(cleanData, collectionId);
          console.log("🌐 Saving to Appwrite:", { collectionId, appwriteCollectionId, data: appwriteData });
          
          // Ensure we have valid data to send
          if (!appwriteData || Object.keys(appwriteData).length === 0) {
            console.warn('⚠️ No valid data to send to Appwrite, skipping save');
            return cleanData;
          }
          console.log("appwriteData documentId",uniqueId)
          
          // Try to create document first, if it exists then update it
          try {
            const response = await databases.createDocument(
              config.databaseId,
              appwriteCollectionId,
              uniqueId,
              appwriteData
            );
            console.log(`✅ Successfully created in Appwrite: ${uniqueId}`);
          } catch (createError) {
            if (createError.message.includes('Document with the requested ID already exists')) {
              // Document exists, update it
              await databases.updateDocument(
                config.databaseId,
                appwriteCollectionId,
                uniqueId,
                appwriteData
              );
              console.log(`✅ Successfully updated in Appwrite: ${uniqueId}`);
            } else {
              throw createError;
            }
          }
          
        } catch (appwriteError) {
          console.error(`❌ Appwrite save failed for ${collectionId}:`, appwriteError);
          
          // Check if it's a project ID error
          if (appwriteError.message && appwriteError.message.includes('project with requested id could not be found')) {
            console.error('🚨 Appwrite Project ID Error: Please check your EXPO_PUBLIC_APPWRITE_PROJECT_ID environment variable');
            console.error('Current project ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
          }
          
          // Add to pending sync queue for later retry
          console.log(`📝 Adding to pending sync queue for later retry`);
          await pendingSyncQueue.addPendingSync('create', collectionId, cleanData, uniqueId);
        }
      } else {
        console.log(`📱 Offline mode: saving to local storage and adding to pending sync for ${collectionId}`);
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
      const deviceId = await getDeviceId();
      const cleanData = { ...data, id: documentId, $id: documentId, deviceId: deviceId };
      
      // Check for duplicates only within same device (excluding current item)
      const existing = await dataService.getItems(collectionId);
      const duplicate = existing.find(item => {
        // Skip the current item being updated
        if (item.id === documentId || item.$id === documentId) return false;
        
        if (item.deviceId === deviceId) {
          if (collectionId === 'employees' && data.badgeNumber && item.badgeNumber) {
            return item.badgeNumber === data.badgeNumber;
          }
          if (collectionId === 'cases' && data.title && item.title) {
            return item.title === data.title;
          }
          if (collectionId === 'expenses' && data.title && item.title) {
            return item.title === data.title;
          }
        }
        return false;
      });
      
      if (duplicate) {
        throw new Error(`${collectionId === 'employees' ? 'Badge number' : 'Title'} already exists on this device.`);
      }
      
      await storage.save(key, cleanData);
      
      // Try to update in Appwrite
      if (await isOnline() && client && databases) {
        try {
          // Check if user is authenticated before making Appwrite calls
          let user = null;
          try {
            user = await account.get();
          } catch (authError) {
            if (authError.message.includes('missing scope (account)') || authError.message.includes('User (role: guests)')) {
              console.log(`👤 User not authenticated, adding to pending sync for ${collectionId}`);
              await pendingSyncQueue.addPendingSync('update', collectionId, cleanData, documentId);
              return cleanData;
            }
            throw authError;
          }
          
          if (!user) {
            console.log(`👤 No authenticated user, adding to pending sync for ${collectionId}`);
            await pendingSyncQueue.addPendingSync('update', collectionId, cleanData, documentId);
            return cleanData;
          }
          const collectionMap = {
            employees: config.employeesCollectionId,
            cases: config.casesCollectionId,
            expenses: config.expensesCollectionId,
            attendance: config.attendanceCollectionId,
           
          };
          
          const appwriteData = await cleanDataForAppwrite(cleanData, collectionId);
          console.log("appwriteData",appwriteData)
          
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
          } catch (updateError) {
            if (updateError.message.includes('Document with the requested ID could not be found')) {
              // Document doesn't exist, create it
              const validDocumentId = generateValidAppwriteId(documentId);
              await databases.createDocument(
                config.databaseId,
                collectionMap[collectionId],
                validDocumentId,
                appwriteData
              );
            } else {
              throw updateError;
            }
          }
        } catch (error) {
          console.log('❌ Could not update/create in Appwrite:', error.message);
          // Add to pending sync queue for later retry
          await pendingSyncQueue.addPendingSync('update', collectionId, cleanData, documentId);
        }
      } else {
        console.log('📱 Offline mode - updated local storage and added to pending sync');
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
          // Check if user is authenticated before making Appwrite calls
          let user = null;
          try {
            user = await account.get();
          } catch (authError) {
            if (authError.message.includes('missing scope (account)') || authError.message.includes('User (role: guests)')) {
              console.log(`👤 User not authenticated, adding to pending sync for ${collectionId}`);
              await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
              return { success: true, id: documentId };
            }
            throw authError;
          }
          
          if (!user) {
            console.log(`👤 No authenticated user, adding to pending sync for ${collectionId}`);
            await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
            return { success: true, id: documentId };
          }
          const collectionMap = {
            employees: config.employeesCollectionId,
            cases: config.casesCollectionId,
            expenses: config.expensesCollectionId,
            attendance: config.attendanceCollectionId,
          
          };
          
          console.log(`🌐 Deleting from Appwrite collection: ${collectionMap[collectionId]}`);
          const validDocumentId = generateValidAppwriteId(documentId);
          await databases.deleteDocument(
            config.databaseId,
            collectionMap[collectionId],
            validDocumentId
          );
          console.log(`✅ Successfully deleted from Appwrite`);
        } catch (error) {
          console.log('❌ Could not delete from Appwrite:', error.message);
          // Add to pending sync queue for later retry
          await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
        }
      } else {
        console.log('📱 Offline mode - deleted from local storage and added to pending sync');
        await pendingSyncQueue.addPendingSync('delete', collectionId, null, documentId);
      }
      
      return { success: true, id: documentId };
    } catch (error) {
      console.error('❌ Error deleting data:', error);
      throw error;
    }
  },

  // File upload functions
  async uploadFile(file, bucketId = 'profileImage') {
    try {
      console.log('📤 === FILE UPLOAD START ===');
      console.log('📁 File object:', file);
      console.log('🪣 Bucket ID:', bucketId);
      console.log('🌐 Appwrite client initialized:', !!client);
      console.log('📦 Appwrite storage initialized:', !!appwriteStorage);
      
      // Test Appwrite configuration
      console.log('🔧 Testing Appwrite configuration...');
      console.log('Endpoint:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1');
      console.log('Project ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ? 'Set' : 'Not set');
      
      if (!file || !file.uri) {
        console.error('❌ Invalid file object - missing uri');
        throw new Error('Invalid file object - missing uri');
      }
      
      if (!client || !appwriteStorage) {
        console.error('❌ Appwrite not properly initialized');
        throw new Error('Appwrite not properly initialized');
      }
      
      // Create a unique file ID
      const fileId = ID.unique();
      console.log('🆔 Generated file ID:', fileId);
      
      // For React Native/Expo, we need to fetch the file and create a proper File object
      console.log('📤 Fetching file from URI...');
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Create a File object from the blob (with fallback for environments without File constructor)
      const fileName = file.name || `file_${fileId}`;
      let fileObject;
      
      try {
        fileObject = new File([blob], fileName, { type: file.type || 'image/jpeg' });
      } catch (fileError) {
        console.log('⚠️ File constructor not available, using blob directly');
        fileObject = blob;
      }
      
      console.log('📁 Created final object:', fileObject);
      
      // Upload file to Appwrite storage
      console.log('📤 Attempting to upload file...');
      const result = await appwriteStorage.createFile(
        bucketId,
        fileId,
        fileObject
      );
      
      console.log('✅ File uploaded successfully:', result);
      
      // Return the file URL as a string
      const fileUrl = appwriteStorage.getFileView(bucketId, result.$id);
      console.log('🔗 Generated file URL:', fileUrl);
      console.log('📤 === FILE UPLOAD COMPLETE ===');
      
      // Ensure we return a string URL
      return fileUrl.toString();
      
    } catch (error) {
      console.error('❌ === FILE UPLOAD ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  // Test function to verify Appwrite setup (v2.0 - cache busting)
  async testAppwriteSetup() {
    const testTimestamp = new Date().toISOString();
    const version = 'v2.0';
    try {
      console.log(`🧪 === TESTING APPWRITE SETUP ${version} ===`, testTimestamp);
      
      // Basic initialization checks
      const clientStatus = !!client;
      const storageStatus = !!appwriteStorage;
      const databasesStatus = !!databases;
      const accountStatus = !!account;
      
      console.log('Client initialized:', clientStatus);
      console.log('Storage initialized:', storageStatus);
      console.log('Databases initialized:', databasesStatus);
      console.log('Account initialized:', accountStatus);
      
      // Check if all services are initialized
      if (!clientStatus || !storageStatus || !databasesStatus || !accountStatus) {
        throw new Error('One or more Appwrite services not properly initialized');
      }
      
      // Check storage object properties without calling methods
      try {
        console.log('✅ Storage object exists:', typeof appwriteStorage);
        console.log('✅ Storage object constructor:', appwriteStorage.constructor.name);
        
        // Check if it has the expected methods (without calling them)
        const hasCreateFile = typeof appwriteStorage.createFile === 'function';
        const hasGetFileView = typeof appwriteStorage.getFileView === 'function';
        const hasDeleteFile = typeof appwriteStorage.deleteFile === 'function';
        
        console.log('✅ Has createFile method:', hasCreateFile);
        console.log('✅ Has getFileView method:', hasGetFileView);
        console.log('✅ Has deleteFile method:', hasDeleteFile);
        
        if (hasCreateFile && hasGetFileView && hasDeleteFile) {
          console.log('✅ Storage service accessible and properly configured');
          return { 
            success: true, 
            message: 'Storage service accessible and properly configured',
            version,
            timestamp: testTimestamp,
            storageType: typeof appwriteStorage,
            constructor: appwriteStorage.constructor.name,
            hasCreateFile,
            hasGetFileView,
            hasDeleteFile
          };
        } else {
          throw new Error('Storage service missing required methods');
        }
      } catch (storageError) {
        console.log('⚠️ Storage service test failed:', storageError.message);
        return { success: false, error: storageError.message, version, timestamp: testTimestamp };
      }
    } catch (error) {
      console.error('❌ Appwrite setup test failed:', error);
      return { success: false, error: error.message, version, timestamp: testTimestamp };
    }
  },

  async deleteFile(fileId, bucketId = 'profileImage') {
    try {
      console.log('🗑️ Deleting file from Appwrite storage...');
      console.log('📁 File ID:', fileId);
      console.log('🪣 Bucket ID:', bucketId);
      
      await appwriteStorage.deleteFile(bucketId, fileId);
      console.log('✅ File deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  },

  async debugCollections() {
    try {
      console.log('🔍 Debugging collections...');
      if (!client || !databases) {
        console.log('❌ Appwrite not initialized');
        return { success: false, error: 'Appwrite not initialized' };
      }
      
      const result = await databases.listCollections(config.databaseId);
      console.log('📊 Collections found:', result.collections);
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
             
              };
             
             const appwriteDocs = await databases.listDocuments(
               config.databaseId,
               collectionMap[collectionId]
             );
             existingDocs = appwriteDocs.documents;
           } catch (error) {
             console.log(`⚠️ Could not fetch existing documents for ${collectionId}:`, error.message);
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
                   
                  };
                 
                 const cleanData = await cleanDataForAppwrite(item, collectionId);
                 console.log(`🌐 Processing item for sync:`, cleanData);
                 
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
                   console.log(`🔄 Updating existing document:`, existingDoc.$id);
                   await databases.updateDocument(
                     config.databaseId,
                     collectionMap[collectionId],
                     existingDoc.$id,
                     cleanData
                   );
                   totalUpdated++;
                   console.log(`✅ Updated existing document successfully`);
                 } else {
                   // Create new document
                   console.log(`🆕 Creating new document`);
                   console.log(item.id)
                   await databases.createDocument(
                     config.databaseId,
                     collectionMap[collectionId],
                     generateValidAppwriteId(item.id || item.$id),
                     cleanData
                   );
                   totalSynced++;
                   console.log(`✅ Created new document successfully`);
                 }
               }
             } catch (error) {
               console.log(`❌ Failed to sync ${collectionId} item:`, error.message);
             }
           }
         }
       }
       
       const message = `Sync completed. Created ${totalSynced} new items, updated ${totalUpdated} existing items.`;
       console.log(`✅ ${message}`);
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
      console.log('📊 Getting storage stats...');
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
      
      console.log('📊 Storage stats:', stats);
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
      console.log(`🌐 Network status: ${online ? 'Online' : 'Offline'}`);
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
      console.log('🧹 Cleaning up attendance data...');
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
      
      console.log(`✅ Cleaned up ${cleanedCount} attendance records`);
      return { success: true, cleanedCount };
    } catch (error) {
      console.error('❌ Error cleaning up attendance data:', error);
      return { success: false, error: error.message };
    }
  }
};

// Auth service
export const authService = {
  async login(email, password) {
    try {
      console.log('🔐 Attempting login...');
      await account.deleteSession("current").catch(() => {});
      const result = await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  async register(email, password, name) {
    try {
      console.log('📝 Attempting registration...');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);
      
      // Validate client configuration
      if (!client.config.endpoint || !client.config.project) {
        throw new Error('Appwrite client not properly configured. Please check your environment variables.');
      }
      
      console.log('🔧 Client endpoint:', client.config.endpoint);
      console.log('🔧 Client project:', client.config.project);
      
      // Create the user account first
      console.log('🔄 Creating account...');
      await account.create(ID.unique(), email, password);
      console.log('✅ Account created successfully');
      
      // Automatically log in the user after registration
      console.log('🔐 Auto-logging in after registration...');
      await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful');
      
      // Wait a moment for session to be established
      console.log('⏳ Waiting for session to establish...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now update the user's name (only after successful login)
      try {
        console.log('🔄 Updating user name...');
        await account.updateName(name);
        console.log('✅ Name updated successfully');
      } catch (nameError) {
        console.warn('⚠️ Could not update name:', nameError.message);
        console.warn('⚠️ Name error details:', nameError);
        // Don't fail registration if name update fails
      }
      
      // Get the user data to confirm authentication
      console.log('🔄 Getting user data...');
      const user = await account.get();
      console.log('✅ Registration and auto-login successful');
      console.log('👤 User authenticated:', user.email, 'Verified:', user.emailVerification);
      
      return user;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      });
      throw error;
    }
  },

  async getUser() {
    try {
      const user = await account.get();
      console.log('👤 Current user:', user ? 'Logged in' : 'Not logged in');
      return user;
    } catch (error) {
      console.log('❌ Could not get user:', error.message);
      return null;
    }
  },

  async logout() {
    try {
      console.log('🚪 Logging out...');
      await account.deleteSession("current");
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
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
      console.log(`📝 Added to pending sync queue: ${operation} ${collectionId} ${documentId || 'new'}`);
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
      console.log(`✅ Removed from pending sync queue: ${pendingId}`);
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
      
      console.log(`🧹 Cleared ${pendingKeys.length} pending sync items`);
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

    // Set up periodic sync every 2 minutes
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, 120000); // 2 minutes
  },

  async syncPendingChanges(currentUserFromContext = null) {
    try {
      console.log('🔄 Starting pending sync...');
      
      if (!(await isOnline()) || !client || !databases) {
        console.log('📱 Offline or Appwrite not available, skipping sync');
        return { success: false, message: 'Offline or Appwrite not available' };
      }

      // Check if user is authenticated - try multiple methods
      let user = null;
      let authMethod = 'none';
      
      // First, try to use user from context if provided
      if (currentUserFromContext) {
        user = currentUserFromContext;
        authMethod = 'context';
        console.log('👤 Using user from context');
      } else {
        // Try Appwrite session
        try {
          user = await account.get();
          authMethod = 'appwrite_session';
        } catch (authError) {
          console.log('📱 Appwrite session not available, but continuing with sync...');
          // Continue with sync even if Appwrite session is not available
          // The sync will work with the data we have
        }
      }

      if (!user) {
        console.log('👤 No authenticated user found, but continuing with sync for offline data...');
        // Continue with sync even without user - this allows syncing offline data
      } else {
        console.log(`👤 User authenticated via: ${authMethod}`);
      }

      const pendingItems = await pendingSyncQueue.getPendingSyncItems();
      console.log(`📋 Found ${pendingItems.length} pending sync items`);

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

              try {
                await databases.createDocument(
                  config.databaseId,
                  appwriteCollectionId,
                  createDocumentId,
                  createData
                );
                console.log(`✅ Synced create: ${createDocumentId} (device: ${item.data.deviceId})`);
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
                    console.log(`✅ Synced create->update: ${createDocumentId} (device: ${item.data.deviceId})`);
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
                console.log(`✅ Synced update: ${updateDocumentId} (device: ${item.data.deviceId})`);
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
                    console.log(`✅ Synced update->create: ${updateDocumentId} (device: ${item.data.deviceId})`);
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
              console.log(`✅ Synced delete: ${deleteDocumentId}`);
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
            console.log(`🗑️ Removing failed sync item after 3 retries: ${item.id}`);
            await pendingSyncQueue.removePendingSync(item.id);
          }
        }
      }

      console.log(`🔄 Pending sync completed: ${successCount} success, ${errorCount} errors`);
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
    console.log('⏹️ Background sync stopped');
  },

  async performBackgroundSync() {
    try {
      if (!(await isOnline()) || !client || !databases) {
        console.log('📱 Skipping background sync - offline or Appwrite not available');
        return;
      }

      // First, sync any pending changes
      await this.syncPendingChanges();

             const collections = ['employees', 'cases', 'expenses', 'attendance'];
       let totalSynced = 0;

      for (const collectionId of collections) {
        const localData = await dataService.getItems(collectionId);
        
        if (localData.length === 0) {
          console.log(`📭 No local data for ${collectionId}, skipping`);
          continue;
        }

        try {
                     const collectionMap = {
             employees: config.employeesCollectionId,
             cases: config.casesCollectionId,
             expenses: config.expensesCollectionId,
             attendance: config.attendanceCollectionId,
           };

          // Get all existing documents from Appwrite for this collection
          const existingDocs = await databases.listDocuments(
            config.databaseId,
            collectionMap[collectionId]
          );
          
          const existingDocIds = existingDocs.documents.map(doc => doc.$id);
          console.log(`📋 Found ${existingDocIds.length} existing documents in Appwrite for ${collectionId}`);

          // Only create documents that don't exist in Appwrite
          for (const item of localData) {
            const itemId = item.id || item.$id;
            
            if (!existingDocIds.includes(itemId)) {
              try {
                console.log(`📝 Creating missing document ${itemId} in Appwrite for ${collectionId}`);
                const cleanData = await cleanDataForAppwrite(item, collectionId);
                await databases.createDocument(
                  config.databaseId,
                  collectionMap[collectionId],
                  generateValidAppwriteId(itemId),
                  cleanData
                );
                totalSynced++;
                console.log(`✅ Created document ${itemId} in Appwrite`);
              } catch (error) {
                console.log(`❌ Error creating document ${itemId} in ${collectionId}:`, error.message);
              }
            } else {
              console.log(`✅ Document ${itemId} already exists in Appwrite for ${collectionId}`);
            }
          }
        } catch (error) {
          console.log(`❌ Error fetching existing documents for ${collectionId}:`, error.message);
        }
      }

      if (totalSynced > 0) {
        console.log(`✅ Background sync completed: ${totalSynced} documents created`);
      } else {
        console.log('✅ Background sync completed: no new documents to sync');
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
    console.log('❌ Auto-initialization skipped:', error.message);
  }
};

// Auto-start background sync when service is loaded
const autoStartBackgroundSync = async () => {
  try {
    // Wait a bit for Appwrite to initialize
    setTimeout(async () => {
      await backgroundSyncService.startBackgroundSync();
    }, 3000);
  } catch (error) {
   }
};

// Start auto-initialization
autoInitializeDefaults();
autoStartBackgroundSync();

// Debug attendance data on service load
setTimeout(async () => {
  console.log('🔍 Auto-debugging attendance data...');
  await storage.debugAttendanceData();
}, 5000); // Run after 5 seconds to allow other services to initialize

// Clean up attendance data on service load
setTimeout(async () => {
  console.log('🧹 Auto-cleaning attendance data...');
  await dataService.cleanupAttendanceData();
}, 7000); // Run after 7 seconds

// Test Appwrite setup on service load
setTimeout(async () => {
  console.log('🧪 Testing Appwrite setup...');
  await dataService.testAppwriteSetup();
}, 6000); // Run after 6 seconds

// Export everything
export const { 
  getItems, 
  saveData, 
  updateData, 
  deleteData,
  uploadFile,
  deleteFile,
  testAppwriteSetup,
  cleanupAttendanceData
} = dataService;
export const { login, register, getUser, logout } = authService;
export { customOptionsService, storage };

