import AsyncStorage from '@react-native-async-storage/async-storage';
import deviceIdManager from '../utils/deviceIdManager';
import dataCache from './dataCache';
import { customOptionsService } from './unifiedDataService';

// Simple local storage wrapper
const localStorage = {
  async save(key, data) {
    try {
      console.log("data:", data);
      console.log(`🔍 [LOCAL STORAGE] Saving data with key: ${key}`, data);
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ [LOCAL STORAGE] Successfully saved data with key: ${key}`);
    } catch (error) {
      console.error(`❌ [LOCAL STORAGE] Error saving data with key ${key}:`, error);
    }
  },

  async get(key) {
    try {
      console.log(`🔍 [LOCAL STORAGE] Getting data with key: ${key}`);
      const data = await AsyncStorage.getItem(key);
      const parsedData = data ? JSON.parse(data) : null;
      console.log(`✅ [LOCAL STORAGE] Retrieved data with key ${key}:`, parsedData);
      return parsedData;
    } catch (error) {
      console.error(`❌ [LOCAL STORAGE] Error getting data with key ${key}:`, error);
      return null;
    }
  },

  async delete(key) {
    try {
      console.log(`🔍 [LOCAL STORAGE] Deleting data with key: ${key}`);
      await AsyncStorage.removeItem(key);
      console.log(`✅ [LOCAL STORAGE] Successfully deleted data with key: ${key}`);
    } catch (error) {
      console.error(`❌ [LOCAL STORAGE] Error deleting data with key ${key}:`, error);
    }
  },

  async getAllKeys() {
    try {
      console.log(`🔍 [LOCAL STORAGE] Getting all keys`);
      const keys = await AsyncStorage.getAllKeys();
      console.log(`✅ [LOCAL STORAGE] Retrieved ${keys.length} keys:`, keys);
      return keys;
    } catch (error) {
      console.error(`❌ [LOCAL STORAGE] Error getting all keys:`, error);
      return [];
    }
  }
};

// Smart hybrid service that works independently
export const hybridDataService = {
  // Check if Appwrite is healthy (no payment errors, resource limits, etc.)
  async isAppwriteAvailable() {
    try {
      console.log(`🔍 [HEALTH CHECK] Checking if Appwrite is available...`);
      
      // Import the unified data service to check Appwrite status
      const { dataService } = await import('./unifiedDataService');
      
      // Try to make a simple request to check if Appwrite is responding
      try {
        // Attempt to get a small amount of data to test connectivity
        await dataService.getItems('employees', { limit: 1 });
        console.log(`✅ [HEALTH CHECK] Appwrite is available and responding`);
        return true;
      } catch (appwriteError) {
        // Check if it's a payment/limit error
        const errorMessage = appwriteError.message?.toLowerCase() || '';
        console.log(`🔍 [HEALTH CHECK] Full error message: "${appwriteError.message}"`);
        console.log(`🔍 [HEALTH CHECK] Lowercase error message: "${errorMessage}"`);
        
        const isPaymentError = errorMessage.includes('payment') || 
                              errorMessage.includes('limit') || 
                              errorMessage.includes('quota') ||
                              errorMessage.includes('billing') ||
                              errorMessage.includes('subscription') ||
                              errorMessage.includes('exceeded') ||
                              errorMessage.includes('upgrade') ||
                              errorMessage.includes('resource limit') ||
                              errorMessage.includes('higher plans');
        
        if (isPaymentError) {
          console.log(`⚠️ [HEALTH CHECK] Appwrite payment/limit issue detected: ${errorMessage}`);
        } else {
          console.log(`⚠️ [HEALTH CHECK] Appwrite connectivity issue: ${errorMessage}`);
        }
        
        return false;
      }
    } catch (error) {
      console.log(`❌ [HEALTH CHECK] Appwrite health check failed:`, error.message);
      return false;
    }
  },

  // Batch save multiple items efficiently
  async batchSaveData(items, collectionId) {
    console.log(`🔄 [BATCH SAVE] Processing ${items.length} items for ${collectionId}`);
    
    const batchSize = 5; // Process 5 items at a time
    const batches = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    const results = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(item => this.saveData(item, collectionId));
      
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
  },

  // Get items - try Appwrite first if healthy, fallback to local
  async getItems(collectionId) {
    console.log(`🔍 [GET ITEMS] Starting getItems for collection: ${collectionId}`);
    
    try {
      // Check if Appwrite is healthy
      const isAppwriteHealthy = await this.isAppwriteAvailable();
      console.log(`🔍 [GET ITEMS] Appwrite health status: ${isAppwriteHealthy}`);
      
      if (isAppwriteHealthy) {
        console.log(`🔄 [GET ITEMS] Fetching ${collectionId} from Appwrite...`);
        
        try {
          // Use the unified data service to actually fetch from Appwrite
          const { dataService } = await import('./unifiedDataService');
          const appwriteItems = await dataService.getItems(collectionId);
          console.log(`✅ [GET ITEMS] Successfully fetched ${appwriteItems.length} items from Appwrite for ${collectionId}`);
          return appwriteItems;
        } catch (appwriteError) {
          console.log(`⚠️ [GET ITEMS] Appwrite fetch failed for ${collectionId}, using local storage:`, appwriteError.message);
        }
      } else {
        console.log(`📱 [GET ITEMS] Appwrite not healthy, using local storage for ${collectionId}`);
      }
    } catch (error) {
      console.log(`⚠️ [GET ITEMS] Appwrite health check failed, using local storage:`, error.message);
    }

    // Fallback to local storage
    console.log(`📱 [GET ITEMS] Falling back to local storage for ${collectionId}`);
    const localItems = await this.getLocalItems(collectionId);
    console.log(`✅ [GET ITEMS] Final result for ${collectionId}: ${localItems.length} items`);
    return localItems;
  },

  // Get items from local storage
  async getLocalItems(collectionId) {
    console.log(`📱 [LOCAL ITEMS] Getting local items for collection: ${collectionId}`);
    const keys = await localStorage.getAllKeys();
    const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
    
    console.log(`📱 [LOCAL ITEMS] Found ${collectionKeys.length} keys for ${collectionId}:`, collectionKeys);
    
    if (collectionKeys.length === 0) {
      console.log(`📱 [LOCAL ITEMS] No local items found for ${collectionId}`);
      return [];
    }

    const items = await Promise.all(
      collectionKeys.map(async key => {
        const data = await localStorage.get(key);
        console.log(`📱 [LOCAL ITEMS] Processing key: ${key}, data:`, data);
        if (data) {
          const extractedId = data.id || key.split('_')[1];
          console.log(`📱 [LOCAL ITEMS] Extracted ID: ${extractedId} from data.id: ${data.id} or key: ${key.split('_')[1]}`);
          return { ...data, id: extractedId };
        }
        return null;
      })
    );

    const validItems = items.filter(item => item !== null);
    console.log(`📱 [LOCAL ITEMS] Retrieved ${validItems.length} valid items for ${collectionId}`);
    return validItems;
  },


  // Save data - try Appwrite first, fallback to local
  async saveData(data, collectionId) {
    console.log(`🔍 [SAVE DATA] Starting saveData for collection: ${collectionId}`, data);
    
    try {
      // Use the deviceId that was already set in the data, or generate a fallback
      const deviceId = data.deviceId || await this.getDeviceId();
      const uniqueId = this.generateId();
      const cleanData = { 
        ...data, 
        id:data.id || uniqueId, 
        deviceId,
        synced: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`🔍 [SAVE DATA] Generated clean data:`, cleanData);

      // Save locally first
      const key = `${collectionId}_${uniqueId}`;
      console.log(`🔍 [SAVE DATA] Saving to local storage with key: ${key}`);
      await localStorage.save(key, cleanData);

      // Try to save via Appwrite if healthy
      const isAppwriteHealthy = await this.isAppwriteAvailable();
      console.log(`🔍 [SAVE DATA] Appwrite health status: ${isAppwriteHealthy}`);
      
      if (isAppwriteHealthy) {
        try {
          console.log(`🔄 [SAVE DATA] Saving ${collectionId} to Appwrite...`);
          
          // Use the unified data service to actually save to Appwrite
          const { dataService } = await import('./unifiedDataService');
          console.log(`🔍 [SAVE DATA] About to call unifiedDataService.saveData with:`, cleanData);
          const result = await dataService.saveData(cleanData, collectionId);
          console.log(`🔍 [SAVE DATA] UnifiedDataService result:`, result);
          
          // Mark as synced
          cleanData.synced = true;
          console.log(`🔍 [SAVE DATA] Marking as synced:`, cleanData);
          await localStorage.save(key, cleanData);
          
          console.log(`✅ [SAVE DATA] Successfully saved to Appwrite`);
          
        } catch (appwriteError) {
          console.log(`⚠️ [SAVE DATA] Appwrite save failed, keeping local only:`, appwriteError.message);
        }
      } else {
        console.log(`📱 [SAVE DATA] Appwrite not healthy, keeping data local only`);
      }

      // Invalidate cache for this collection
      dataCache.invalidateCache(collectionId);
      console.log(`🗑️ [SAVE DATA] Cache invalidated for collection: ${collectionId}`);
      
      console.log(`✅ [SAVE DATA] Final result:`, cleanData);
      return cleanData;
    } catch (error) {
      console.error(`❌ [SAVE DATA] Error saving data:`, error);
      throw error;
    }
  },

  // Update data - try Appwrite first, fallback to local
  async updateData(key, documentId, data, collectionId) {
    console.log(`🔍 [UPDATE DATA] Starting updateData for collection: ${collectionId}, documentId: ${documentId}`, data);
    console.log(`🔍 [UPDATE DATA] Using key: ${key}`);
    console.log(`🔍 [UPDATE DATA] Key format check - Expected: ${collectionId}_${documentId}, Actual: ${key}`);
    
    try {
      const cleanData = { 
        ...data, 
        id: documentId,
        updatedAt: new Date(),
        synced: false
      };

      console.log(`🔍 [UPDATE DATA] Generated clean data:`, cleanData);
      console.log(`🔍 [UPDATE DATA] Clean data ID: ${cleanData.id}`);
      console.log(`🔍 [UPDATE DATA] Clean data deviceId: ${cleanData.deviceId}`);
      console.log(`🔍 [UPDATE DATA] Clean data registrationType: ${cleanData.registrationType}`);

      // For updates, we don't need to check duplicates - just proceed
      console.log(`🔍 [UPDATE DATA] Proceeding with update operation`);

      // Update locally first
      console.log(`🔍 [UPDATE DATA] Updating local storage with key: ${key}`);
      await localStorage.save(key, cleanData);
      console.log(`✅ [UPDATE DATA] Successfully updated local storage`);

      // Try to update via Appwrite if healthy
      const isAppwriteHealthy = await this.isAppwriteAvailable();
      console.log(`🔍 [UPDATE DATA] Appwrite health status: ${isAppwriteHealthy}`);
      
      if (isAppwriteHealthy) {
        try {
          console.log(`🔄 [UPDATE DATA] Updating ${collectionId} in Appwrite...`);
          
          // Use the unified data service to actually update in Appwrite
          const { dataService } = await import('./unifiedDataService');
          console.log(`🔍 [UPDATE DATA] About to call unifiedDataService.updateData with:`, cleanData);
          const result = await dataService.updateData(key, documentId, cleanData, collectionId);
          console.log(`🔍 [UPDATE DATA] UnifiedDataService result:`, result);
          
          // Mark as synced
          cleanData.synced = true;
          await localStorage.save(key, cleanData);
          
          console.log(`✅ [UPDATE DATA] Successfully updated in Appwrite`);
          
        } catch (appwriteError) {
          console.log(`⚠️ [UPDATE DATA] Appwrite update failed, keeping local only:`, appwriteError.message);
        }
      } else {
        console.log(`📱 [UPDATE DATA] Appwrite not healthy, keeping update local only`);
      }

      // Invalidate cache for this collection
      dataCache.invalidateCache(collectionId);
      console.log(`🗑️ [UPDATE DATA] Cache invalidated for collection: ${collectionId}`);
      
      console.log(`✅ [UPDATE DATA] Final result:`, cleanData);
      return cleanData;
    } catch (error) {
      console.error(`❌ [UPDATE DATA] Error updating data:`, error);
      throw error;
    }
  },

  // Delete data - try Appwrite first, fallback to local
  async deleteData(key, documentId, collectionId) {
    console.log(`🔍 [DELETE DATA] Starting deleteData for collection: ${collectionId}, documentId: ${documentId}`);
    console.log(`🔍 [DELETE DATA] Using key: ${key}`);
    
    try {
      // Try to delete via Appwrite if healthy
      const isAppwriteHealthy = await this.isAppwriteAvailable();
      console.log(`🔍 [DELETE DATA] Appwrite health status: ${isAppwriteHealthy}`);
      
      if (isAppwriteHealthy) {
        try {
          console.log(`🔄 [DELETE DATA] Deleting ${collectionId} from Appwrite...`);
          
          // Use the unified data service to actually delete from Appwrite
          const { dataService } = await import('./unifiedDataService');
          console.log(`🔍 [DELETE DATA] About to call unifiedDataService.deleteData with key: ${key}, documentId: ${documentId}`);
          const result = await dataService.deleteData(key, documentId, collectionId);
          console.log(`🔍 [DELETE DATA] UnifiedDataService result:`, result);
          
          console.log(`✅ [DELETE DATA] Successfully deleted from Appwrite`);
          
        } catch (appwriteError) {
          console.log(`⚠️ [DELETE DATA] Appwrite delete failed, keeping local only:`, appwriteError.message);
        }
      } else {
        console.log(`📱 [DELETE DATA] Appwrite not healthy, deleting from local only`);
      }

      // Delete locally
      console.log(`🔍 [DELETE DATA] Deleting from local storage with key: ${key}`);
      await localStorage.delete(key);
      console.log(`✅ [DELETE DATA] Successfully deleted from local storage`);

      // Invalidate cache for this collection
      dataCache.invalidateCache(collectionId);
      console.log(`🗑️ [DELETE DATA] Cache invalidated for collection: ${collectionId}`);
      
      const result = { success: true, id: documentId };
      console.log(`✅ [DELETE DATA] Final result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [DELETE DATA] Error deleting data:`, error);
      throw error;
    }
  },

  // Export data for remote devices (legacy text format)
  async exportData(collectionId) {
    console.log(`🔍 [EXPORT DATA] Starting exportData for collection: ${collectionId}`);
    
    try {
      const data = await this.getItems(collectionId);
      
      // Also export all options
      const allOptions = {};
      const optionFields = ['departments', 'ranks', 'employment_status', 'expense_categories', 'case_status', 'case_priority', 'case_categories'];
      
      for (const field of optionFields) {
        try {
          allOptions[field] = await this.getOptions(field);
        } catch (error) {
          console.log(`⚠️ [EXPORT DATA] Could not export options for ${field}:`, error.message);
          allOptions[field] = [];
        }
      }
      
      const exportData = {
        collectionId,
        deviceId: await this.getDeviceId(),
        timestamp: new Date().toISOString(),
        data: data,
        options: allOptions
      };
      
      console.log(`✅ [EXPORT DATA] Successfully exported ${data.length} items and options for ${collectionId}`);
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`❌ [EXPORT DATA] Error exporting data:`, error);
      throw error;
    }
  },


  // Import data from remote devices
  async importData(importString) {
    console.log(`🔍 [IMPORT DATA] Starting importData`);
    
    try {
      // Validate input
      if (!importString || typeof importString !== 'string') {
        throw new Error('Invalid import string provided');
      }

      // Extract JSON from shared text format
      let jsonString = importString;
      
      // Check if it's in the shared format: "Shelfie Data Export - {collection}\n\n{json}"
      if (importString.includes('Shelfie Data Export')) {
        const lines = importString.split('\n');
        // Find the line that starts with '{' (the JSON data)
        const jsonLineIndex = lines.findIndex(line => line.trim().startsWith('{'));
        if (jsonLineIndex !== -1) {
          // Join all lines from the JSON start to the end
          jsonString = lines.slice(jsonLineIndex).join('\n');
          console.log(`🔍 [IMPORT DATA] Extracted JSON from shared format`);
        }
      }

      const importData = JSON.parse(jsonString);
      console.log(`🔍 [IMPORT DATA] Parsed import data:`, importData);

      // Validate required fields
      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid import data format');
      }

      const { collectionId, deviceId, data, options } = importData;

      // Validate required properties
      if (!collectionId) {
        throw new Error('Missing collectionId in import data');
      }
      if (!deviceId) {
        throw new Error('Missing deviceId in import data');
      }
      if (!data) {
        throw new Error('Missing data array in import data');
      }
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
      }

      console.log(`🔍 [IMPORT DATA] Importing ${data.length} items for collection: ${collectionId} from device: ${deviceId}`);

      // Don't import data from the same device
      const currentDeviceId = await this.getDeviceId();
      if (deviceId === currentDeviceId) {
        console.log(`⚠️ [IMPORT DATA] Cannot import data from same device: ${deviceId}`);
        throw new Error('Cannot import data from same device');
      }

      // Import each item
      let importedCount = 0;
      for (const item of data) {
        if (!item || !item.id) {
          console.log(`⚠️ [IMPORT DATA] Skipping invalid item:`, item);
          continue;
        }

        const key = `${collectionId}_${item.id}`;
        const existingItem = await localStorage.get(key);

        // Only import if item doesn't exist or remote is newer
        if (!existingItem || new Date(item.updatedAt) > new Date(existingItem.updatedAt)) {
          console.log(`🔍 [IMPORT DATA] Importing item: ${item.id}`);
          await localStorage.save(key, {
            ...item,
            importedFrom: deviceId,
            importedAt: new Date().toISOString(),
            synced: false // Mark as not synced
          });
          importedCount++;
        } else {
          console.log(`🔍 [IMPORT DATA] Skipping item ${item.id} - local version is newer or same`);
        }
      }

      // Import options if available
      let importedOptionsCount = 0;
      if (options && typeof options === 'object') {
        console.log(`🔍 [IMPORT DATA] Importing options:`, Object.keys(options));
        
        for (const [fieldName, optionList] of Object.entries(options)) {
          if (Array.isArray(optionList)) {
            try {
              // Get current options for this field
              const currentOptions = await this.getOptions(fieldName);
              
              // Merge new options with existing ones (avoid duplicates)
              const mergedOptions = [...new Set([...currentOptions, ...optionList])];
              
              // Save merged options
              await localStorage.save(`options_${fieldName}`, mergedOptions);
              
              console.log(`✅ [IMPORT DATA] Imported ${optionList.length} options for ${fieldName}`);
              importedOptionsCount += optionList.length;
            } catch (error) {
              console.log(`⚠️ [IMPORT DATA] Could not import options for ${fieldName}:`, error.message);
            }
          }
        }
      }

      const result = { 
        success: true, 
        imported: importedCount, 
        total: data.length,
        importedOptions: importedOptionsCount
      };
      console.log(`✅ [IMPORT DATA] Successfully imported ${importedCount}/${data.length} items and ${importedOptionsCount} options`);
      return result;
    } catch (error) {
      console.error(`❌ [IMPORT DATA] Error importing data:`, error);
      throw error;
    }
  },


  // Utility methods
  async getDeviceId() {
    return await deviceIdManager.getDeviceId();
  },

  // Generate device ID with hostname prefix for different employee types
  async getAdminDeviceId() {
    return await deviceIdManager.getAdminDeviceId();
  },

  async getDeviceEmployeeDeviceId() {
    return await deviceIdManager.getDeviceEmployeeId();
  },

  // Get hostname (localhost on web, IP on mobile)
  getHostname() {
    return deviceIdManager.getHostname();
  },

  // Default options for each field
  getDefaultOptions(fieldName) {
    const defaultOptions = {
      departments: ['Police', 'Traffic', 'Investigation', 'Patrol', 'CID', 'Special Branch'],
      ranks: ['Constable', 'Head Constable', 'ASI', 'SI', 'Inspector', 'DSP', 'SP'],
      employment_status: ['Active', 'Inactive', 'Suspended', 'Retired', 'Transferred'],
      expense_categories: ['Fuel', 'Food', 'Transport', 'Equipment', 'Stationery', 'Maintenance'],
      case_status: ['Open', 'Under Investigation', 'Closed', 'Pending', 'Archived'],
      case_priority: ['Low', 'Medium', 'High', 'Critical', 'Urgent'],
      case_categories: ['Theft', 'Assault', 'Fraud', 'Drugs', 'Traffic', 'Domestic Violence']
    };
    return defaultOptions[fieldName] || [];
  },

  // Options management using existing unifiedDataService functions
  async getOptions(fieldName) {
    try {
      console.log(`🔍 [OPTIONS] Getting options for field: ${fieldName}`);
      
      // First try to get from Appwrite (even if payment required)
      try {
        const appwriteOptions = await customOptionsService.getOptions(fieldName);
        if (appwriteOptions && appwriteOptions.length > 0) {
          console.log(`✅ [OPTIONS] Got ${appwriteOptions.length} options from Appwrite for ${fieldName}`);
          
          // Store fetched options in local storage
          await localStorage.save(`options_${fieldName}`, appwriteOptions);
          
          // Get deleted options and filter them out
          const deletedOptions = await localStorage.get(`deleted_options_${fieldName}`) || [];
          const filteredOptions = appwriteOptions.filter(option => !deletedOptions.includes(option));
          
          console.log(`✅ [OPTIONS] Returning ${filteredOptions.length} options for ${fieldName} (${deletedOptions.length} deleted)`);
          return filteredOptions;
        }
      } catch (appwriteError) {
        console.log(`⚠️ [OPTIONS] Appwrite failed for ${fieldName}, using local storage:`, appwriteError.message);
      }
      
      // Fallback to local storage
      let localOptions = await localStorage.get(`options_${fieldName}`) || [];
      
      // If no local options, use default options
      if (localOptions.length === 0) {
        const defaultOptions = this.getDefaultOptions(fieldName);
        if (defaultOptions.length > 0) {
          console.log(`🔍 [OPTIONS] No local options found, using ${defaultOptions.length} default options for ${fieldName}`);
          localOptions = defaultOptions;
          // Save default options to local storage
          await localStorage.save(`options_${fieldName}`, defaultOptions);
        }
      }
      
      // Get deleted options and filter them out
      const deletedOptions = await localStorage.get(`deleted_options_${fieldName}`) || [];
      const filteredOptions = localOptions.filter(option => !deletedOptions.includes(option));
      
      console.log(`✅ [OPTIONS] Using local storage: ${filteredOptions.length} options for ${fieldName}`);
      return filteredOptions;
    } catch (error) {
      console.error(`❌ [OPTIONS] Error getting options for ${fieldName}:`, error);
      // Return default options as last resort
      return this.getDefaultOptions(fieldName);
    }
  },

  async addOption(fieldName, newOption) {
    try {
      console.log(`🔍 [OPTIONS] Adding option "${newOption}" to field: ${fieldName}`);
      
      // Get current options
      const currentOptions = await this.getOptions(fieldName);
      
      // Add new option if not already exists
      if (!currentOptions.includes(newOption)) {
        const updatedOptions = [...currentOptions, newOption];
        
        // Save to local storage
        await localStorage.save(`options_${fieldName}`, updatedOptions);
        
        // Try to save to Appwrite (don't fail if it doesn't work)
        try {
          await customOptionsService.addOption(fieldName, newOption);
          console.log(`✅ [OPTIONS] Option "${newOption}" added to both local and Appwrite`);
        } catch (appwriteError) {
          console.log(`⚠️ [OPTIONS] Option "${newOption}" added locally only:`, appwriteError.message);
        }
        
        console.log(`✅ [OPTIONS] Successfully added option "${newOption}" to ${fieldName}`);
        return true;
      } else {
        console.log(`⚠️ [OPTIONS] Option "${newOption}" already exists in ${fieldName}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [OPTIONS] Error adding option to ${fieldName}:`, error);
      return false;
    }
  },

  async removeOption(fieldName, optionToRemove) {
    try {
      console.log(`🔍 [OPTIONS] Removing option "${optionToRemove}" from field: ${fieldName}`);
      
      // Add to deleted options list
      const deletedOptions = await localStorage.get(`deleted_options_${fieldName}`) || [];
      if (!deletedOptions.includes(optionToRemove)) {
        deletedOptions.push(optionToRemove);
        await localStorage.save(`deleted_options_${fieldName}`, deletedOptions);
      }
      
      // Try to remove from Appwrite (don't fail if it doesn't work)
      try {
        await customOptionsService.removeOption(fieldName, optionToRemove);
        console.log(`✅ [OPTIONS] Option "${optionToRemove}" removed from both local and Appwrite`);
      } catch (appwriteError) {
        console.log(`⚠️ [OPTIONS] Option "${optionToRemove}" removed locally only:`, appwriteError.message);
      }
      
      console.log(`✅ [OPTIONS] Successfully removed option "${optionToRemove}" from ${fieldName}`);
      return true;
    } catch (error) {
      console.error(`❌ [OPTIONS] Error removing option from ${fieldName}:`, error);
      return false;
    }
  },

  generateId() {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log(`🔍 [GENERATE ID] Generated new ID: ${id}`);
    return id;
  },

  // Check sync status
  async getSyncStatus() {
    console.log(`🔍 [SYNC STATUS] Getting sync status for all collections`);
    
    const collections = ['employees', 'cases', 'expenses', 'attendance'];
    const status = {};

    for (const collection of collections) {
      const items = await this.getItems(collection);
      const synced = items.filter(item => item.synced).length;
      const total = items.length;
      
      status[collection] = {
        total,
        synced,
        unsynced: total - synced,
        percentage: total > 0 ? Math.round((synced / total) * 100) : 0
      };
      
      console.log(`📊 [SYNC STATUS] ${collection}: ${synced}/${total} synced (${status[collection].percentage}%)`);
    }

    console.log(`✅ [SYNC STATUS] Final sync status:`, status);
    return status;
  },

  // Get all local data for a collection
  async getAllLocalData(collectionId) {
    console.log(`🔍 [ALL LOCAL DATA] Getting all local data for collection: ${collectionId}`);
    const result = await this.getItems(collectionId);
    console.log(`✅ [ALL LOCAL DATA] Retrieved ${result.length} items for ${collectionId}`);
    return result;
  },

  // Manual sync - try to sync all local data to Appwrite
  async manualSync() {
    console.log(`🔍 [MANUAL SYNC] Starting manual sync`);
    
    try {
      const isAppwriteHealthy = await this.isAppwriteAvailable();
      console.log(`🔍 [MANUAL SYNC] Appwrite health status: ${isAppwriteHealthy}`);
      
      if (!isAppwriteHealthy) {
        const message = 'Appwrite is not available. Check health status.';
        console.log(`⚠️ [MANUAL SYNC] ${message}`);
        return { 
          success: false, 
          message: message
        };
      }

      const collections = ['employees', 'cases', 'expenses', 'attendance'];
      let totalSynced = 0;
      let totalItems = 0;

      for (const collection of collections) {
        console.log(`🔍 [MANUAL SYNC] Processing collection: ${collection}`);
        const items = await this.getItems(collection);
        const unsyncedItems = items.filter(item => !item.synced);
        
        console.log(`🔍 [MANUAL SYNC] Found ${unsyncedItems.length} unsynced items in ${collection}`);
        
        for (const item of unsyncedItems) {
          try {
            const key = `${collection}_${item.id}`;
            await this.updateData(key, item.id, item, collection);
            totalSynced++;
            console.log(`✅ [MANUAL SYNC] Successfully synced item ${item.id} in ${collection}`);
          } catch (error) {
            console.log(`❌ [MANUAL SYNC] Failed to sync item ${item.id} in ${collection}:`, error.message);
          }
        }
        totalItems += items.length;
      }

      const result = { 
        success: true, 
        message: `Synced ${totalSynced} items to Appwrite`,
        synced: totalSynced,
        total: totalItems
      };
      
      console.log(`✅ [MANUAL SYNC] Manual sync completed:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [MANUAL SYNC] Manual sync failed:`, error);
      return { 
        success: false, 
        message: `Sync failed: ${error.message}` 
      };
    }
  },

  // Sync with Appwrite (redirects to manual sync)
  async syncWithMongoDB(collectionId) {
    console.log(`🔍 [APPWRITE SYNC] Redirecting to manual sync for collection: ${collectionId}`);
    return await this.manualSync();
  },

  // Get Appwrite health status
  async getAppwriteHealth() {
    console.log(`🔍 [HEALTH STATUS] Getting Appwrite health status`);
    
    try {
      const isHealthy = await this.isAppwriteAvailable();
      const result = {
        healthy: isHealthy,
        error: isHealthy ? null : 'payment_required',
        message: isHealthy ? 'Appwrite is healthy' : 'Appwrite has payment issues - using local storage'
      };
      
      console.log(`✅ [HEALTH STATUS] Health status:`, result);
      return result;
    } catch (error) {
      const result = {
        healthy: false,
        error: 'health_check_failed',
        message: error.message
      };
      
      console.log(`❌ [HEALTH STATUS] Health check failed:`, result);
      return result;
    }
  },

  // Force a fresh health check
  async checkAppwriteHealth() {
    console.log(`🔍 [FORCE HEALTH CHECK] Forcing fresh health check`);
    
    // Clear any cached health status and check again
    const result = await this.isAppwriteAvailable();
    console.log(`✅ [FORCE HEALTH CHECK] Result: ${result}`);
    return result;
  }
};
  