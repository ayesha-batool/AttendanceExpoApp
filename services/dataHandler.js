import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Databases, ID } from 'appwrite';
// useNetworkStatus.js (or inline if needed)
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const subscribe = Network.addNetworkStateListener((state) => {
      setIsConnected(state.isConnected);
      console.log('Connection changed:', state.isConnected);
    });

    return () => {
      subscribe && subscribe.remove();
    };
  }, []);

  return isConnected;
};



// Appwrite Setup
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
  bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID,
};

// Appwrite Initialization
const client = new Client().setEndpoint(config.endpoint).setProject(config.project);
const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

// Check internet connectivity
const isOnline = async () => {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected;
};

export const clearAllLocalData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🧹 All local data removed successfully');
  } catch (e) {
    console.error('❌ Failed to clear local storage:', e);
  }
};

// Clear corrupted data for a specific collection
export const clearCorruptedData = async (collectionId) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
    
    if (collectionKeys.length > 0) {
      await AsyncStorage.multiRemove(collectionKeys);
      console.log(`🧹 Cleared ${collectionKeys.length} corrupted entries for ${collectionId}`);
    } else {
      console.log(`🧹 No data found for ${collectionId}`);
    }
  } catch (e) {
    console.error('❌ Failed to clear corrupted data:', e);
  }
};

// Remove duplicate entries for a specific collection
export const removeDuplicateEntries = async (collectionId) => {
  try {
    const data = await getFromLocal(collectionId);
    const seen = new Set();
    const unique = [];
    const duplicateKeys = [];
    
    for (const item of data) {
      const id = item.id || item.$id;
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(item);
      } else {
        // Find the key for this duplicate item
        const keys = await AsyncStorage.getAllKeys();
        const itemKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
        
        for (const key of itemKeys) {
          try {
            const value = await AsyncStorage.getItem(key);
            const parsed = JSON.parse(value);
            if ((parsed.id === id || parsed.$id === id) && !unique.find(u => (u.id === parsed.id || u.$id === parsed.$id))) {
              duplicateKeys.push(key);
              break;
            }
          } catch (e) {
            console.error('Error parsing item:', e);
          }
        }
      }
    }
    
    if (duplicateKeys.length > 0) {
      await AsyncStorage.multiRemove(duplicateKeys);
      console.log(`🧹 Removed ${duplicateKeys.length} duplicate entries for ${collectionId}`);
    } else {
      console.log(`🧹 No duplicates found for ${collectionId}`);
    }
    
    return unique;
  } catch (e) {
    console.error('❌ Failed to remove duplicate entries:', e);
    return [];
  }
};
// Optional: Sync all local records with synced: false
export const syncPendingLocalData = async () => {
  const allItems = await getAllLocal();
  const unsynced = allItems.filter(({ data }) => !data.synced);

  for (const { key, data } of unsynced) {
    const collectionId = key.split('_')[0];
    await syncIfOnline(key, data, collectionId);
  }
};

// Save to local storage
export const saveToLocal = async (key, data) => {
  try {
    console.log('🔍 saveToLocal - saving data for key:', key);
    console.log('🔍 saveToLocal - data to save:', data);
    
    // Validate data structure before saving
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data structure for saving');
    }
    
    const jsonString = JSON.stringify(data);
    console.log('🔍 saveToLocal - JSON string length:', jsonString.length);
    console.log('🔍 saveToLocal - JSON string preview:', jsonString.substring(0, 200) + '...');
    
    await AsyncStorage.setItem(key, jsonString);
    console.log('✅ Saved locally:', key);
    console.log('✅ Data size:', jsonString.length, 'characters');
  } catch (e) {
    console.error('❌ Local save error:', e);
    throw e; // Re-throw to handle in calling function
  }
};

// Update local record
export const updateLocal = async (key, updatedData) => {
  try {
    console.log('🔍 updateLocal - updating data for key:', key);
    console.log('🔍 updateLocal - data to update:', updatedData);
    const jsonString = JSON.stringify(updatedData);
    console.log('🔍 updateLocal - JSON string length:', jsonString.length);
    await AsyncStorage.setItem(key, jsonString);
    console.log('✅ Updated locally:', key);
  } catch (e) {
    console.error('❌ Local update error:', e);
  }
};

// Delete from local storage
export const deleteLocal = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('Deleted locally:', key);
  } catch (e) {
    console.error('Local delete error:', e);
  }
};

// Get all local records
export const getAllLocal = async () => {
  const keys = await AsyncStorage.getAllKeys();

  // Only get keys starting with your collection name prefix
  const filteredKeys = keys.filter((key) => key.includes('_')); // or use "employees_", "projects_" etc.
  const items = await AsyncStorage.multiGet(filteredKeys);

  const safeParsed = [];

  for (const [k, v] of items) {
    try {
      const data = JSON.parse(v);
      safeParsed.push({ key: k, data });
    } catch (e) {
      console.warn(`Skipping invalid JSON for key: ${k}`);
    }
  }

  return safeParsed;
};

// Get specific collection's local data
export const getFromLocal = async (collectionId) => {
  console.log('🔍 getFromLocal called for collectionId:', collectionId);
  const keys = await AsyncStorage.getAllKeys();
  console.log('🔍 getFromLocal - all keys in AsyncStorage:', keys);
  console.log('🔍 getFromLocal - total keys count:', keys.length);
  
  const filteredKeys = keys.filter((key) => key.startsWith(`${collectionId}_`));
  console.log('🔍 getFromLocal - filtered keys for', collectionId, ':', filteredKeys);
  console.log('🔍 getFromLocal - number of filtered keys:', filteredKeys.length);
  
  // Debug: Check for any keys that might be incorrectly filtered
  if (collectionId === 'employees') {
    const potentialEmployeeKeys = keys.filter(key => key.includes('employee') || key.includes('officer'));
    console.log('🔍 getFromLocal - potential employee-related keys:', potentialEmployeeKeys);
  }
  
  const items = await AsyncStorage.multiGet(filteredKeys);
  console.log('🔍 getFromLocal - raw items for', collectionId, ':', items);
  console.log('🔍 getFromLocal - number of raw items:', items.length);
  
  // Log each item's data size
  items.forEach(([key, value], index) => {
    if (value) {
      console.log(`🔍 getFromLocal - item ${index} (${key}) size:`, value.length, 'characters');
    }
  });
  const parsedItems = items.map(([k, v]) => {
    try {
      const parsed = JSON.parse(v);
      console.log(`🔍 getFromLocal - parsed item ${k}:`, parsed);
      
      // Normalize the data to ensure required fields exist
      const normalized = {
        ...parsed,
        $id: parsed.$id || parsed.id || k.split('_')[1],
        id: parsed.id || parsed.$id || k.split('_')[1]
      };
      
      // Add collection-specific normalization
      if (collectionId === 'employees') {
        normalized.fullName = parsed.fullName || 'Unknown';
        normalized.status = parsed.status || 'active';
        normalized.employmentStatus = parsed.employmentStatus || parsed.status || 'active';
        normalized.phone = parsed.phone || '';
        normalized.department = parsed.department || '';
        normalized.rank = parsed.rank || '';
        
        console.log(`🔍 getFromLocal - normalization for ${k}:`, {
          originalStatus: parsed.status,
          normalizedStatus: normalized.status,
          originalEmploymentStatus: parsed.employmentStatus,
          normalizedEmploymentStatus: normalized.employmentStatus
        });
        
        // Ensure photoUrl is preserved during normalization
        if (parsed.photoUrl) {
          normalized.photoUrl = parsed.photoUrl;
          console.log(`🔍 getFromLocal - preserved photoUrl for ${k}:`, normalized.photoUrl.length, 'characters');
        }
      } else if (collectionId === 'expenses') {
        normalized.title = parsed.title || 'Untitled Expense';
        normalized.amount = parsed.amount || 0;
        normalized.category = parsed.category || 'Other';
        normalized.department = parsed.department || '';
        normalized.date = parsed.date || new Date().toISOString();
      } else if (collectionId === 'cases') {
        normalized.title = parsed.title || 'Untitled Case';
        normalized.status = parsed.status || 'active';
        normalized.priority = parsed.priority || 'medium';
        normalized.department = parsed.department || '';
      }
      
      console.log(`🔍 getFromLocal - normalized item ${k}:`, normalized);
      if (collectionId === 'employees') {
        console.log(`🔍 getFromLocal - employee ${k} final status:`, normalized.status);
        console.log(`🔍 getFromLocal - employee ${k} final employmentStatus:`, normalized.employmentStatus);
      }
      if (normalized.photoUrl) {
        console.log(`🔍 getFromLocal - photoUrl for ${k}:`, normalized.photoUrl);
        console.log(`🔍 getFromLocal - photoUrl type for ${k}:`, typeof normalized.photoUrl);
      }
      
      return normalized;
    } catch (e) {
      console.error(`❌ getFromLocal - failed to parse ${k}:`, e);
      console.error(`❌ getFromLocal - raw value for ${k}:`, v);
      return null;
    }
  }).filter(item => item !== null);
  console.log('🔍 getFromLocal - returning items for', collectionId, ':', parsedItems.length);
  return parsedItems;
};

// Save to Appwrite
export const saveToAppwrite = async (data, collectionId) => {
  return await databases.createDocument(DATABASE_ID, collectionId, ID.unique(), data);
};

// Update in Appwrite
export const updateAppwrite = async (docId, updatedData, collectionId) => {
  return await databases.updateDocument(DATABASE_ID, collectionId, docId, updatedData);
};

// Delete from Appwrite
export const deleteAppwrite = async (docId, collectionId) => {
  return await databases.deleteDocument(DATABASE_ID, collectionId, docId);
};

// Sync a single local entry to Appwrite
export const syncIfOnline = async (key, data, collectionId) => {
  const online = await isOnline();
  if (!online) return;
  console.log("data", data)
  
  // Only validate email for user collections, not for employees
  if (collectionId === 'users') {
    const isValidEmail = (email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail(data.email)) {
      console.warn(`❌ Skipping invalid email for ${key}: ${data.email}`);
      return;
    }
  }

  // Salary casting (only if salary field exists)
  const cleanData = {
    ...data,
    ...(data.salary && { salary: parseInt(data.salary, 10) || 0 }),
  };
  const cleaned = sanitizeForAppwrite(cleanData);

  try {
    const saved = await saveToAppwrite(cleaned, collectionId);

    const syncedData = { ...cleaned, $id: saved.$id, synced: true };
    const newKey = `${collectionId}_${saved.$id}`;

    await saveToLocal(newKey, syncedData);

    if (key !== newKey) await deleteLocal(key);

    console.log(`✅ Synced ${key} → ${newKey} to Appwrite`);

  } catch (e) {
    console.error(`❌ Sync failed for ${key}`, e);
  }
};


// Get employee list (Local storage only for now)
export const getItems = async (collectionId) => {
  console.log('🔍 getItems called for collectionId:', collectionId);
  console.log('🔍 getItems - forcing local storage only...');
  try {
    const localData = await getFromLocal(collectionId);
    console.log('📱 getItems - localData retrieved:', localData);
    console.log('📱 getItems - localData type:', typeof localData);
    console.log('📱 getItems - localData is array:', Array.isArray(localData));
    console.log('📱 getItems - localData length:', localData?.length);
    
    if (localData && Array.isArray(localData) && localData.length > 0) {
      console.log('📱 getItems - first item structure:', localData[0]);
      console.log('📱 getItems - first item keys:', Object.keys(localData[0]));
    }
    
    return localData;
  } catch (e) {
    console.error('❌ getItems - Failed to fetch from AsyncStorage:', e);
    console.error('❌ getItems - Error stack:', e.stack);
    return [];
  }
};

// Master handler for form submission (create)
export const handleDataSubmit = async (data, collectionId) => {
  // Ensure collectionId is a string
  const collectionIdStr = typeof collectionId === 'string' ? collectionId : 'employees';
  console.log('🔍 handleDataSubmit called with:', { collectionId, collectionIdStr, data });
  
  // Debug: Log when employee data is being submitted
  if (collectionIdStr === 'employees') {
    console.log('🔍 EMPLOYEE DATA SUBMISSION - Employee name:', data.fullName || data.name);
    console.log('🔍 EMPLOYEE DATA SUBMISSION - Employee ID:', data.employeeId || data.id);
  }
  
  // Validate that data is a proper object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('❌ Invalid data structure:', data);
    throw new Error('Data must be a valid object');
  }
  
  // Generate a unique ID for the item
  const uniqueId = data.id || data.$id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const key = `${collectionIdStr}_${uniqueId}`;
  console.log('🔍 Generated key:', key);
  console.log('🔍 Generated uniqueId:', uniqueId);
  
  // Ensure data is a proper object and clean it
  const cleanData = { ...data };
  
  // Remove any undefined or null values that might cause issues
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined || cleanData[key] === null) {
      delete cleanData[key];
    }
  });
  
  // Handle photoUrl field - ensure it's properly formatted but don't truncate
  if (cleanData.photoUrl && typeof cleanData.photoUrl === 'string') {
    // Clean the photoUrl but don't truncate it
    cleanData.photoUrl = cleanData.photoUrl.trim();
    console.log('🔍 PhotoUrl length:', cleanData.photoUrl.length, 'characters');
  }
  
  console.log('🔍 Clean data to save:', cleanData);
  console.log('🔍 Status in cleanData:', cleanData.status);
  console.log('🔍 EmploymentStatus in cleanData:', cleanData.employmentStatus);
  console.log('🔍 PhotoUrl in cleanData:', cleanData.photoUrl);
  console.log('🔍 PhotoUrl type:', typeof cleanData.photoUrl);
  
  // Validate the cleaned data structure
  try {
    const jsonString = JSON.stringify(cleanData);
    console.log('🔍 JSON serialization successful, length:', jsonString.length);
  } catch (error) {
    console.error('❌ Data cannot be serialized:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Problematic data:', cleanData);
    throw new Error('Data contains invalid values that cannot be saved');
  }
  
  await saveToLocal(key, { ...cleanData, synced: false });
  await syncIfOnline(key, cleanData, collectionIdStr);
  
  // Return the saved data with consistent ID structure
  return { ...cleanData, $id: uniqueId, id: uniqueId, synced: false };
};

// Master handler for updating data
export const handleDataUpdate = async (key, docId, updatedData, collectionId) => {
  console.log('🔍 handleDataUpdate called with:', { key, docId, updatedData, collectionId });
  const online = await isOnline();
  
  // Clean the data before processing
  const cleanData = { ...updatedData };
  
  // Handle photoUrl field - ensure it's properly formatted but don't truncate
  if (cleanData.photoUrl && typeof cleanData.photoUrl === 'string') {
    // Clean the photoUrl but don't truncate it
    cleanData.photoUrl = cleanData.photoUrl.trim();
    console.log('🔍 handleDataUpdate - PhotoUrl length:', cleanData.photoUrl.length, 'characters');
  }
  
  const cleaned = sanitizeForAppwrite(cleanData);
  console.log('🔍 handleDataUpdate - cleaned data:', cleaned);
  console.log('🔍 handleDataUpdate - online status:', online);
  
  // Find the actual key if the provided key doesn't exist
  let actualKey = key;
  try {
    await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('🔍 Provided key not found, searching for actual key...');
    actualKey = await findItemKey(collectionId, docId);
    if (!actualKey) {
      console.error('❌ Could not find key for item:', docId);
      throw new Error('Item not found');
    }
  }

  console.log('🔍 Updating with actual key:', actualKey);
  await updateLocal(actualKey, { ...cleaned, $id: docId, synced: online });
  console.log('🔍 handleDataUpdate - all local data after update:', await getAllLocal());

  if (online) {
    try {
      await updateAppwrite(docId, cleaned, collectionId);
      console.log('✅ Appwrite update successful');
    } catch (e) {
      console.error('❌ Appwrite update failed, local was updated.', e);
    }
  }
};
const sanitizeForAppwrite = (data) => {
  const forbiddenKeys = [
    "$id",
    "$databaseId",
    "$collectionId",
    "$createdAt",
    "$updatedAt",
    "$permissions",
    "$sequence",
    "synced"
  ];

  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !forbiddenKeys.includes(key))
  );
};


// Find the actual key for an item in AsyncStorage
export const findItemKey = async (collectionId, itemId) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const collectionKeys = keys.filter(key => key.startsWith(`${collectionId}_`));
    
    for (const key of collectionKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        const parsed = JSON.parse(value);
        if (parsed.id === itemId || parsed.$id === itemId) {
          console.log(`🔍 Found key for item ${itemId}: ${key}`);
          return key;
        }
      } catch (e) {
        console.error('Error parsing item:', e);
      }
    }
    
    console.log(`🔍 No key found for item ${itemId} in collection ${collectionId}`);
    return null;
  } catch (e) {
    console.error('Error finding item key:', e);
    return null;
  }
};

// Master handler for deleting data
export const handleDataDelete = async (key, docId, collectionId) => {
  console.log('🔍 handleDataDelete called with:', { key, docId, collectionId });
  const online = await isOnline();

  // Find the actual key if the provided key doesn't exist
  let actualKey = key;
  try {
    await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('🔍 Provided key not found, searching for actual key...');
    actualKey = await findItemKey(collectionId, docId);
    if (!actualKey) {
      console.error('❌ Could not find key for item:', docId);
      throw new Error('Item not found');
    }
  }

  console.log('🔍 Deleting with actual key:', actualKey);
  await deleteLocal(actualKey);

  if (online) {
    try {
      await deleteAppwrite(docId, collectionId);
      console.log('✅ Appwrite delete successful');
    } catch (e) {
      console.error('❌ Appwrite delete failed, local was deleted:', e);
    }
  }
};

// User-specific functions
// Save user to local storage
export const saveUserToLocal = async (userData) => {
  try {
    const key = `user_${userData.$id || Date.now()}`;
    await AsyncStorage.setItem(key, JSON.stringify({ ...userData, synced: false }));
    console.log('👤 User saved locally:', key);
    return key;
  } catch (e) {
    console.error('❌ Local user save error:', e);
    throw e;
  }
};

// Get user from local storage
export const getUserFromLocal = async (userId) => {
  try {
    const key = `user_${userId}`;
    const userData = await AsyncStorage.getItem(key);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('❌ Failed to get user from local storage:', e);
    return null;
  }
};

// Get current user from local storage
export const getCurrentUserFromLocal = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.startsWith('user_'));
    
    if (userKeys.length === 0) return null;
    
    // Get the most recent user (assuming single user app)
    const userData = await AsyncStorage.getItem(userKeys[0]);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('❌ Failed to get current user from local storage:', e);
    return null;
  }
};

// Update user in local storage
export const updateUserInLocal = async (userId, updatedData) => {
  try {
    const key = `user_${userId}`;
    const existingData = await AsyncStorage.getItem(key);
    const currentData = existingData ? JSON.parse(existingData) : {};
    
    const mergedData = { ...currentData, ...updatedData, synced: false };
    await AsyncStorage.setItem(key, JSON.stringify(mergedData));
    console.log('👤 User updated locally:', key);
  } catch (e) {
    console.error('❌ Local user update error:', e);
    throw e;
  }
};

// Delete user from local storage
export const deleteUserFromLocal = async (userId) => {
  try {
    const key = `user_${userId}`;
    await AsyncStorage.removeItem(key);
    console.log('👤 User deleted locally:', key);
  } catch (e) {
    console.error('❌ Local user delete error:', e);
    throw e;
  }
};

// Save user to Appwrite
export const saveUserToAppwrite = async (userData) => {
  try {
    const cleanedData = sanitizeForAppwrite(userData);
    const savedUser = await databases.createDocument(DATABASE_ID, 'users', ID.unique(), cleanedData);
    console.log('👤 User saved to Appwrite:', savedUser.$id);
    return savedUser;
  } catch (e) {
    console.error('❌ Appwrite user save error:', e);
    throw e;
  }
};

// Update user in Appwrite
export const updateUserInAppwrite = async (userId, updatedData) => {
  try {
    const cleanedData = sanitizeForAppwrite(updatedData);
    const updatedUser = await databases.updateDocument(DATABASE_ID, 'users', userId, cleanedData);
    console.log('👤 User updated in Appwrite:', userId);
    return updatedUser;
  } catch (e) {
    console.error('❌ Appwrite user update error:', e);
    throw e;
  }
};

// Delete user from Appwrite
export const deleteUserFromAppwrite = async (userId) => {
  try {
    await databases.deleteDocument(DATABASE_ID, 'users', userId);
    console.log('👤 User deleted from Appwrite:', userId);
  } catch (e) {
    console.error('❌ Appwrite user delete error:', e);
    throw e;
  }
};

// Get user from Appwrite
export const getUserFromAppwrite = async (userId) => {
  try {
    const user = await databases.getDocument(DATABASE_ID, 'users', userId);
    console.log('👤 User fetched from Appwrite:', userId);
    return user;
  } catch (e) {
    console.error('❌ Appwrite user fetch error:', e);
    return null;
  }
};

// Get all users from Appwrite
export const getAllUsersFromAppwrite = async () => {
  try {
    const { documents } = await databases.listDocuments(DATABASE_ID, 'users');
    console.log('👤 Users fetched from Appwrite:', documents.length);
    return documents;
  } catch (e) {
    console.error('❌ Appwrite users fetch error:', e);
    return [];
  }
};

// Sync user data (local to Appwrite)
export const syncUserToAppwrite = async (userId) => {
  const online = await isOnline();
  if (!online) {
    console.log('📡 No internet connection, user sync skipped');
    return;
  }

  try {
    const localUser = await getUserFromLocal(userId);
    if (!localUser) {
      console.log('👤 No local user found for sync:', userId);
      return;
    }

    if (localUser.synced) {
      console.log('👤 User already synced:', userId);
      return;
    }

    // Check if user exists in Appwrite
    const appwriteUser = await getUserFromAppwrite(userId);
    
    if (appwriteUser) {
      // Update existing user
      await updateUserInAppwrite(userId, localUser);
    } else {
      // Create new user
      const savedUser = await saveUserToAppwrite(localUser);
      // Update local with Appwrite ID if it was generated
      if (savedUser.$id !== userId) {
        await updateUserInLocal(userId, { $id: savedUser.$id });
        await deleteUserFromLocal(userId);
        await saveUserToLocal({ ...localUser, $id: savedUser.$id, synced: true });
      }
    }

    // Mark as synced
    await updateUserInLocal(userId, { synced: true });
    console.log('✅ User synced to Appwrite:', userId);

  } catch (e) {
    console.error('❌ User sync failed:', e);
  }
};

// Sync user data (Appwrite to local)
export const syncUserFromAppwrite = async (userId) => {
  const online = await isOnline();
  if (!online) {
    console.log('📡 No internet connection, user sync skipped');
    return;
  }

  try {
    const appwriteUser = await getUserFromAppwrite(userId);
    if (!appwriteUser) {
      console.log('👤 No Appwrite user found for sync:', userId);
      return;
    }

    // Save/update local user
    await saveUserToLocal({ ...appwriteUser, synced: true });
    console.log('✅ User synced from Appwrite:', userId);

  } catch (e) {
    console.error('❌ User sync from Appwrite failed:', e);
  }
};

// Master handler for user creation
export const handleUserCreate = async (userData) => {
  const userId = userData.$id || `local_${Date.now()}`;
  const key = `user_${userId}`;
  
  // Save locally first
  await saveUserToLocal({ ...userData, $id: userId });
  
  // Try to sync to Appwrite
  await syncUserToAppwrite(userId);
  
  return userId;
};

// Master handler for user update
export const handleUserUpdate = async (userId, updatedData) => {
  const online = await isOnline();
  
  // Update locally first
  await updateUserInLocal(userId, updatedData);
  
  // Try to sync to Appwrite
  if (online) {
    try {
      await updateUserInAppwrite(userId, updatedData);
      await updateUserInLocal(userId, { synced: true });
    } catch (e) {
      console.error('❌ Appwrite user update failed, local was updated:', e);
    }
  }
};

// Master handler for user deletion
export const handleUserDelete = async (userId) => {
  const online = await isOnline();
  
  // Delete locally first
  await deleteUserFromLocal(userId);
  
  // Try to delete from Appwrite
  if (online) {
    try {
      await deleteUserFromAppwrite(userId);
    } catch (e) {
      console.error('❌ Appwrite user delete failed, local was deleted:', e);
    }
  }
};

// Get user (Appwrite preferred, fallback to local)
export const getUser = async (userId) => {
  const online = await isOnline();

  if (online) {
    try {
      const appwriteUser = await getUserFromAppwrite(userId);
      if (appwriteUser) {
        // Update local cache
        await saveUserToLocal({ ...appwriteUser, synced: true });
        return appwriteUser;
      }
    } catch (err) {
      console.error('❌ Failed to fetch user from Appwrite:', err);
    }
  }

  // Fallback to local
  try {
    const localUser = await getUserFromLocal(userId);
    return localUser;
  } catch (e) {
    console.error('❌ Failed to fetch user from local storage:', e);
    return null;
  }
};

// Get all users (Appwrite preferred, fallback to local)
export const getAllUsers = async () => {
  const online = await isOnline();

  if (online) {
    try {
      const appwriteUsers = await getAllUsersFromAppwrite();
      
      // Update local cache for all users
      for (const user of appwriteUsers) {
        await saveUserToLocal({ ...user, synced: true });
      }
      
      return appwriteUsers;
    } catch (err) {
      console.error('❌ Failed to fetch users from Appwrite:', err);
    }
  }

  // Fallback to local
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.startsWith('user_'));
    const users = [];
    
    for (const key of userKeys) {
      const userData = await AsyncStorage.getItem(key);
      if (userData) {
        users.push(JSON.parse(userData));
      }
    }
    
    return users;
  } catch (e) {
    console.error('❌ Failed to fetch users from local storage:', e);
    return [];
  }
};

// Sync all pending user data
export const syncAllPendingUsers = async () => {
  const online = await isOnline();
  if (!online) {
    console.log('📡 No internet connection, user sync skipped');
    return;
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.startsWith('user_'));
    
    for (const key of userKeys) {
      const userData = await AsyncStorage.getItem(key);
      if (userData) {
        const user = JSON.parse(userData);
        if (!user.synced) {
          const userId = user.$id;
          await syncUserToAppwrite(userId);
        }
      }
    }
    
    console.log('✅ All pending users synced');
  } catch (e) {
    console.error('❌ Failed to sync pending users:', e);
  }
};
