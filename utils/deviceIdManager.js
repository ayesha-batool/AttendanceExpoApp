import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Unified Device ID Management Utility
 * Handles device ID generation, storage, and retrieval with hostname + 5-character unique ID format
 */
class DeviceIdManager {
  constructor() {
    this.deviceIdKey = 'deviceId';
  }

  /**
   * Get hostname for the current environment
   * @returns {string} hostname (localhost for web, IP for mobile)
   */
  getHostname() {
    try {
      // For web browsers
      if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        console.log(`🔍 [DEVICE ID] Web hostname: ${hostname}`);
        return hostname;
      }
      
      // For React Native/Expo
      if (typeof global !== 'undefined' && global.__DEV__) {
        // In development, try to get local IP
        console.log(`🔍 [DEVICE ID] React Native development mode`);
        return 'localhost'; // Fallback for development
      }
      
      // Fallback
      console.log(`🔍 [DEVICE ID] Using fallback hostname`);
      return 'localhost';
    } catch (error) {
      console.log(`🔍 [DEVICE ID] Error getting hostname, using fallback:`, error.message);
      return 'localhost';
    }
  }

  /**
   * Generate a 5-character unique ID
   * @returns {string} 5-character alphanumeric string
   */
  generateUniqueId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const uniqueId = Array.from({ length: 7 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    console.log(`🔍 [DEVICE ID] Generated unique ID: ${uniqueId}`);
    return uniqueId;
  }

  /**
   * Get or create device ID in format: hostname + uniqueId
   * @returns {Promise<string>} device ID
   */
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem(this.deviceIdKey);
      console.log(`🔍 [DEVICE ID] Retrieved device ID from storage:`, deviceId);
      
      if (!deviceId) {
        const hostname = this.getHostname();
        const uniqueId = this.generateUniqueId();
        deviceId = `${hostname}_${uniqueId}`;
        
        await AsyncStorage.setItem(this.deviceIdKey, deviceId);
        console.log(`✅ [DEVICE ID] Generated and saved new device ID: ${deviceId}`);
      } else {
        console.log(`✅ [DEVICE ID] Using existing device ID: ${deviceId}`);
      }
      
      return deviceId;
    } catch (error) {
      console.error('❌ [DEVICE ID] Error getting device ID:', error);
      // Generate fallback device ID
      const fallbackId = `fallback_${Date.now().toString().slice(-6)}`;
      console.log(`⚠️ [DEVICE ID] Using fallback device ID: ${fallbackId}`);
      return fallbackId;
    }
  }

  /**
   * Generate device employee ID in format: device_hostname_uniqueId
   * @returns {Promise<string>} device employee ID
   */
  async getDeviceEmployeeId() {
    const baseDeviceId = await this.getDeviceId();
    const hostname = this.getHostname();
    const deviceEmployeeId = `${baseDeviceId.split('_')[1]}`;
    console.log(`🔍 [DEVICE ID] Generated device employee ID: ${deviceEmployeeId}`);
    return deviceEmployeeId;
  }

  /**
   * Generate admin device ID in format: hostname_baseDeviceId
   * @returns {Promise<string>} admin device ID
   */
  async getAdminDeviceId() {
    const baseDeviceId = await this.getDeviceId();
    console.log(`🔍 [DEVICE ID] Generated admin device ID: ${baseDeviceId}`);
    return baseDeviceId;
  }

  /**
   * Clear device ID from storage
   * @returns {Promise<void>}
   */
  async clearDeviceId() {
    try {
      await AsyncStorage.removeItem(this.deviceIdKey);
      console.log(`✅ [DEVICE ID] Device ID cleared from storage`);
    } catch (error) {
      console.error('❌ [DEVICE ID] Error clearing device ID:', error);
      throw error;
    }
  }

  /**
   * Get device ID without the device_ prefix for display purposes
   * @returns {Promise<string>} clean device ID for display
   */
  async getDisplayDeviceId() {
    const deviceId = await this.getDeviceId();
    // Remove device_ prefix if present for display
    return deviceId.replace(/^device_/, '');
  }

  /**
   * Check if device ID exists in storage
   * @returns {Promise<boolean>} true if device ID exists
   */
  async hasDeviceId() {
    try {
      const deviceId = await AsyncStorage.getItem(this.deviceIdKey);
      return !!deviceId;
    } catch (error) {
      console.error('❌ [DEVICE ID] Error checking device ID existence:', error);
      return false;
    }
  }
}

// Create singleton instance
const deviceIdManager = new DeviceIdManager();

export default deviceIdManager;
