import AsyncStorage from '@react-native-async-storage/async-storage';
import { hybridDataService } from './hybridDataService';

class DataCacheService {
  constructor() {
    this.cache = {
      employees: { data: null, timestamp: null, loading: false },
      cases: { data: null, timestamp: null, loading: false },
      expenses: { data: null, timestamp: null, loading: false },
      options: { data: {}, timestamp: null, loading: false }
    };
    
    // Cache duration in milliseconds (5 minutes)
    this.CACHE_DURATION = 5 * 60 * 1000;
    
    // Listeners for cache updates
    this.listeners = {
      employees: [],
      cases: [],
      expenses: [],
      options: []
    };
  }

  // Add listener for cache updates
  addListener(collection, callback) {
    if (!this.listeners[collection]) {
      this.listeners[collection] = [];
    }
    this.listeners[collection].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[collection] = this.listeners[collection].filter(cb => cb !== callback);
    };
  }

  // Notify listeners of cache updates
  notifyListeners(collection, data) {
    if (this.listeners[collection]) {
      this.listeners[collection].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in cache listener:', error);
        }
      });
    }
  }

  // Check if cache is valid
  isCacheValid(collection) {
    const cacheEntry = this.cache[collection];
    if (!cacheEntry || !cacheEntry.data || !cacheEntry.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cacheEntry.timestamp) < this.CACHE_DURATION;
    
    console.log(`📦 [CACHE] ${collection} cache ${isValid ? 'VALID' : 'EXPIRED'} (age: ${Math.round((now - cacheEntry.timestamp) / 1000)}s)`);
    return isValid;
  }

  // Get data from cache or fetch if needed
  async getData(collection) {
    console.log(`📦 [CACHE] Requesting ${collection} data`);
    
    // Return cached data if valid
    if (this.isCacheValid(collection)) {
      console.log(`📦 [CACHE] Returning cached ${collection} data (${this.cache[collection].data.length} items)`);
      return this.cache[collection].data;
    }

    // If already loading, wait for it to complete
    if (this.cache[collection].loading) {
      console.log(`📦 [CACHE] ${collection} already loading, waiting...`);
      return this.waitForLoad(collection);
    }

    // Fetch fresh data
    return this.fetchAndCache(collection);
  }

  // Wait for ongoing load to complete
  async waitForLoad(collection, timeout = 10000) {
    const startTime = Date.now();
    
    while (this.cache[collection].loading && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.cache[collection].data) {
      return this.cache[collection].data;
    }
    
    throw new Error(`Timeout waiting for ${collection} to load`);
  }

  // Fetch and cache data
  async fetchAndCache(collection) {
    console.log(`📦 [CACHE] Fetching fresh ${collection} data from Appwrite`);
    
    this.cache[collection].loading = true;
    
    try {
      let data;
      
      if (collection === 'options') {
        // For options, we need to fetch multiple option types
        data = await this.fetchAllOptions();
      } else {
        // For regular collections
        data = await hybridDataService.getItems(collection);
      }
      
      // Validate and filter data
      const validData = Array.isArray(data) ? data.filter(item => item && typeof item === 'object') : data;
      
      // Update cache
      this.cache[collection] = {
        data: validData,
        timestamp: Date.now(),
        loading: false
      };
      
      console.log(`📦 [CACHE] Cached ${collection} data (${Array.isArray(validData) ? validData.length : 'N/A'} items)`);
      
      // Notify listeners
      this.notifyListeners(collection, validData);
      
      // Persist critical data to AsyncStorage
      if (collection !== 'options') {
        try {
          await AsyncStorage.setItem(`cache_${collection}`, JSON.stringify({
            data: validData,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn(`Failed to persist ${collection} cache:`, error);
        }
      }
      
      return validData;
      
    } catch (error) {
      console.error(`📦 [CACHE] Error fetching ${collection}:`, error);
      this.cache[collection].loading = false;
      
      // Try to return stale cache if available
      if (this.cache[collection].data) {
        console.log(`📦 [CACHE] Returning stale ${collection} cache due to error`);
        return this.cache[collection].data;
      }
      
      // Try to load from AsyncStorage as fallback
      try {
        const cached = await AsyncStorage.getItem(`cache_${collection}`);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          console.log(`📦 [CACHE] Loaded ${collection} from AsyncStorage fallback`);
          return parsedCache.data;
        }
      } catch (storageError) {
        console.warn(`Failed to load ${collection} from storage:`, storageError);
      }
      
      throw error;
    }
  }

  // Fetch all option types
  async fetchAllOptions() {
    const optionTypes = [
      'departments',
      'ranks', 
      'employment_status',
      'case_categories',
      'case_priorities',
      'case_statuses',
      'expense_categories'
    ];
    
    const options = {};
    
    await Promise.all(
      optionTypes.map(async (type) => {
        try {
          options[type] = await hybridDataService.getOptions(type);
        } catch (error) {
          console.warn(`Failed to fetch ${type} options:`, error);
          options[type] = [];
        }
      })
    );
    
    return options;
  }

  // Get specific options
  async getOptions(optionType) {
    const allOptions = await this.getData('options');
    return allOptions[optionType] || [];
  }

  // Invalidate cache for a collection
  invalidateCache(collection) {
    console.log(`📦 [CACHE] Invalidating ${collection} cache`);
    this.cache[collection] = {
      data: null,
      timestamp: null,
      loading: false
    };
    
    // Remove from AsyncStorage
    AsyncStorage.removeItem(`cache_${collection}`).catch(error => {
      console.warn(`Failed to remove ${collection} from storage:`, error);
    });
  }

  // Invalidate all caches
  invalidateAll() {
    console.log('📦 [CACHE] Invalidating all caches');
    Object.keys(this.cache).forEach(collection => {
      this.invalidateCache(collection);
    });
  }

  // Update cache when data changes
  updateCache(collection, newData) {
    console.log(`📦 [CACHE] Updating ${collection} cache with new data`);
    
    this.cache[collection] = {
      data: newData,
      timestamp: Date.now(),
      loading: false
    };
    
    // Notify listeners
    this.notifyListeners(collection, newData);
    
    // Persist to AsyncStorage
    if (collection !== 'options') {
      AsyncStorage.setItem(`cache_${collection}`, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      })).catch(error => {
        console.warn(`Failed to persist updated ${collection} cache:`, error);
      });
    }
  }

  // Add new item to cache
  addToCache(collection, newItem) {
    if (this.cache[collection].data) {
      const updatedData = [...this.cache[collection].data, newItem];
      this.updateCache(collection, updatedData);
    }
  }

  // Update item in cache
  updateInCache(collection, itemId, updatedItem) {
    if (this.cache[collection].data) {
      const updatedData = this.cache[collection].data.map(item => {
        const id = item.id || item.$id;
        return id === itemId ? updatedItem : item;
      });
      this.updateCache(collection, updatedData);
    }
  }

  // Remove item from cache
  removeFromCache(collection, itemId) {
    if (this.cache[collection].data) {
      const updatedData = this.cache[collection].data.filter(item => {
        const id = item.id || item.$id;
        return id !== itemId;
      });
      this.updateCache(collection, updatedData);
    }
  }

  // Get cache status
  getCacheStatus() {
    const status = {};
    Object.keys(this.cache).forEach(collection => {
      const cache = this.cache[collection];
      status[collection] = {
        cached: !!cache.data,
        items: cache.data ? (Array.isArray(cache.data) ? cache.data.length : 'N/A') : 0,
        age: cache.timestamp ? Math.round((Date.now() - cache.timestamp) / 1000) : 0,
        valid: this.isCacheValid(collection),
        loading: cache.loading
      };
    });
    return status;
  }

  // Initialize cache from AsyncStorage
  async initializeFromStorage() {
    console.log('📦 [CACHE] Initializing cache from AsyncStorage');
    
    const collections = ['employees', 'cases', 'expenses'];
    
    await Promise.all(
      collections.map(async (collection) => {
        try {
          const cached = await AsyncStorage.getItem(`cache_${collection}`);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            
            // Only use if not too old (1 hour max for storage)
            const age = Date.now() - parsedCache.timestamp;
            if (age < 60 * 60 * 1000) { // 1 hour
              this.cache[collection] = {
                data: parsedCache.data,
                timestamp: parsedCache.timestamp,
                loading: false
              };
              console.log(`📦 [CACHE] Loaded ${collection} from storage (${parsedCache.data.length} items, ${Math.round(age/1000)}s old)`);
            }
          }
        } catch (error) {
          console.warn(`Failed to initialize ${collection} from storage:`, error);
        }
      })
    );
  }
}

// Create singleton instance
const dataCache = new DataCacheService();

export default dataCache;
