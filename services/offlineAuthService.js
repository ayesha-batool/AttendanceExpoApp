import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

// Simple hash function for React Native compatibility
const simpleHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Simple password hashing with salt
const hashPassword = (password) => {
  const salt = 'shelfie_salt_2024';
  const saltedPassword = password + salt;
  return simpleHash(saltedPassword);
};

// Compare password with hash
const comparePassword = (password, hash) => {
  const hashedPassword = hashPassword(password);
  return hashedPassword === hash;
};

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_USERS: 'offline_users',
  OFFLINE_SESSIONS: 'offline_sessions',
  PENDING_SIGNUPS: 'pending_signups',
  CURRENT_USER: 'current_offline_user'
};

// Offline Authentication Service
class OfflineAuthService {
  
  // Check if device is online
  async isOnline() {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  // Store pending signup credentials
  async storePendingSignup(userData) {
    try {
      const pendingSignups = await this.getPendingSignups();
      
      // Check if user already exists
      const existingUser = pendingSignups.find(user => 
        user.email === userData.email || user.phone === userData.phone
      );
      
      if (existingUser) {
        throw new Error('User already exists in pending signups');
      }

      // Hash password for security
      const hashedPassword = hashPassword(userData.password);
      
      const signupData = {
        ...userData,
        password: hashedPassword,
        timestamp: new Date().toISOString(),
        status: 'pending',
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      pendingSignups.push(signupData);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SIGNUPS, JSON.stringify(pendingSignups));
      
      console.log('✅ Pending signup stored locally');
      return signupData;
    } catch (error) {
      console.error('❌ Error storing pending signup:', error);
      throw error;
    }
  }

  // Get all pending signups
  async getPendingSignups() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SIGNUPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending signups:', error);
      return [];
    }
  }

  // Store offline user (after successful offline signup)
  async storeOfflineUser(userData) {
    try {
      const offlineUsers = await this.getOfflineUsers();
      
      // Check if user already exists
      const existingUser = offlineUsers.find(user => 
        user.email === userData.email || user.phone === userData.phone
      );
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      const offlineUser = {
        ...userData,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        isOfflineUser: true,
        verified: false // Offline users are not verified
      };

      offlineUsers.push(offlineUser);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_USERS, JSON.stringify(offlineUsers));
      
      console.log('✅ Offline user stored locally');
      return offlineUser;
    } catch (error) {
      console.error('❌ Error storing offline user:', error);
      throw error;
    }
  }

  // Get all offline users
  async getOfflineUsers() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline users:', error);
      return [];
    }
  }

  // Offline login
  async offlineLogin(credentials) {
    try {
      const offlineUsers = await this.getOfflineUsers();
      const pendingSignups = await this.getPendingSignups();
      
      // Check in offline users first
      let user = offlineUsers.find(u => 
        (u.email === credentials.email || u.phone === credentials.phone) ||
        (credentials.email && u.email === credentials.email) ||
        (credentials.phone && u.phone === credentials.phone)
      );

      // If not found in offline users, check pending signups
      if (!user) {
        const pendingUser = pendingSignups.find(u => 
          (u.email === credentials.email || u.phone === credentials.phone) ||
          (credentials.email && u.email === credentials.email) ||
          (credentials.phone && u.phone === credentials.phone)
        );
        
        if (pendingUser) {
          // Move from pending to offline users
          await this.movePendingToOffline(pendingUser);
          user = pendingUser;
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = comparePassword(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Create offline session
      const session = {
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          isOfflineUser: true,
          verified: false
        },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      await this.storeOfflineSession(session);
      
      console.log('✅ Offline login successful');
      return session;
    } catch (error) {
      console.error('❌ Offline login failed:', error);
      throw error;
    }
  }

  // Move pending signup to offline users
  async movePendingToOffline(pendingUser) {
    try {
      const pendingSignups = await this.getPendingSignups();
      const offlineUsers = await this.getOfflineUsers();
      
      // Remove from pending
      const updatedPending = pendingSignups.filter(u => u.id !== pendingUser.id);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SIGNUPS, JSON.stringify(updatedPending));
      
      // Add to offline users
      const offlineUser = {
        ...pendingUser,
        createdAt: new Date().toISOString(),
        isOfflineUser: true,
        verified: false
      };
      
      offlineUsers.push(offlineUser);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_USERS, JSON.stringify(offlineUsers));
      
      console.log('✅ Moved pending user to offline users');
      return offlineUser;
    } catch (error) {
      console.error('❌ Error moving pending user:', error);
      throw error;
    }
  }

  // Store offline session
  async storeOfflineSession(session) {
    try {
      const sessions = await this.getOfflineSessions();
      
      // Remove expired sessions
      const validSessions = sessions.filter(s => new Date(s.expiresAt) > new Date());
      
      // Add new session
      validSessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_SESSIONS, JSON.stringify(validSessions));
      
      // Store current user
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session.user));
      
      console.log('✅ Offline session stored');
    } catch (error) {
      console.error('❌ Error storing offline session:', error);
      throw error;
    }
  }

  // Get offline sessions
  async getOfflineSessions() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline sessions:', error);
      return [];
    }
  }

  // Get current offline user
  async getCurrentOfflineUser() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;
      
      const user = JSON.parse(data);
      
      // Check if session is still valid
      const sessions = await this.getOfflineSessions();
      const validSession = sessions.find(s => s.userId === user.id);
      
      if (!validSession || new Date(validSession.expiresAt) <= new Date()) {
        await this.logoutOffline();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error getting current offline user:', error);
      return null;
    }
  }

  // Logout offline user
  async logoutOffline() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      console.log('✅ Offline logout successful');
    } catch (error) {
      console.error('❌ Error during offline logout:', error);
    }
  }

  // Sync pending signups when online
  async syncPendingSignups() {
    try {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        throw new Error('Device is offline');
      }

      const pendingSignups = await this.getPendingSignups();
      if (pendingSignups.length === 0) {
        console.log('No pending signups to sync');
        return [];
      }

      const syncedSignups = [];
      
      for (const signup of pendingSignups) {
        try {
          // Here you would call your actual signup API
          // For now, we'll just mark them as synced
          console.log(`Syncing signup for: ${signup.email || signup.phone}`);
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          syncedSignups.push(signup);
        } catch (error) {
          console.error(`Failed to sync signup for ${signup.email || signup.phone}:`, error);
        }
      }

      // Remove synced signups from pending
      const remainingSignups = pendingSignups.filter(signup => 
        !syncedSignups.find(synced => synced.id === signup.id)
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SIGNUPS, JSON.stringify(remainingSignups));
      
      console.log(`✅ Synced ${syncedSignups.length} pending signups`);
      return syncedSignups;
    } catch (error) {
      console.error('❌ Error syncing pending signups:', error);
      throw error;
    }
  }

  // Clear all offline data (for testing/debugging)
  async clearAllOfflineData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OFFLINE_USERS,
        STORAGE_KEYS.OFFLINE_SESSIONS,
        STORAGE_KEYS.PENDING_SIGNUPS,
        STORAGE_KEYS.CURRENT_USER
      ]);
      console.log('✅ All offline data cleared');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
    }
  }
}

export default new OfflineAuthService();
