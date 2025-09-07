import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/unifiedDataService';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Fixed credentials for both online and offline authentication
      const authorizedEmail = 'abdulhameedzootg@gmail.com';
      const authorizedPassword = '4811186@Police';
      
      // Check against fixed credentials first
      if (email === authorizedEmail && password === authorizedPassword) {
        console.log('✅ Fixed credentials validated, attempting Appwrite login...');
        
        // Try Appwrite login first (online mode)
        try {
          const result = await authService.login(email, password);
          const user = await authService.getUser();
          
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            await AsyncStorage.setItem('isAuthenticated', 'true');
            await AsyncStorage.setItem('userEmail', email);
            await AsyncStorage.setItem('currentUser', JSON.stringify(user));
            console.log('✅ Online login successful with Appwrite');
            return { success: true, user: user, mode: 'online' };
          }
        } catch (appwriteError) {
          console.log('⚠️ Appwrite login failed, falling back to offline mode:', appwriteError.message);
        }
        
        // Fallback to offline mode if Appwrite fails
        const mockUser = {
          $id: 'offline_user',
          email: email,
          name: 'Admin User',
          status: 'active',
          isOffline: true
        };
        
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('currentUser', JSON.stringify(mockUser));
        
        console.log('✅ Offline login successful (fallback mode)');
        return { success: true, user: mockUser, mode: 'offline' };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };



  const logout = async () => {
    try {
      // Try to logout from Appwrite if available (but don't fail)
      try {
        await authService.logout();
      } catch (appwriteError) {
        console.log('⚠️ Appwrite not available, offline logout only');
      }
      
      // Clear local authentication state
      setCurrentUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('isAuthenticated');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('currentUser');
      
      // Reset the hasLoggedInOnce flag on logout
      await AsyncStorage.setItem('hasLoggedInOnce', 'false');
      console.log('✅ Offline logout successful, hasLoggedInOnce flag set to false');
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  const getUser = async () => {
    try {
      // First try to get user from local storage (offline mode)
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        return user;
      }
      
      // Fallback: try to get user from Appwrite (but don't fail if offline)
      try {
        const user = await authService.getUser();
        if (user) {
          setCurrentUser(user);
          return user;
        }
      } catch (appwriteError) {
        console.log('⚠️ Appwrite not available, using offline mode');
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user in AuthContext:", error);
      setCurrentUser(null);
      return null;
    }
  };



  useEffect(() => {
    const loadAuthState = async () => {
      const storedIsAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      const storedUserEmail = await AsyncStorage.getItem('userEmail');
      const storedUser = await AsyncStorage.getItem('currentUser');

      if (storedIsAuthenticated === 'true' && storedUserEmail && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
          console.log('✅ Offline user session restored successfully');
        } catch (e) {
          console.error("Error parsing stored user:", e);
          setCurrentUser(null);
          setIsAuthenticated(false);
          await AsyncStorage.removeItem('isAuthenticated');
          await AsyncStorage.removeItem('userEmail');
          await AsyncStorage.removeItem('currentUser');
        }
      } else {
        // No stored auth state, try Appwrite as fallback (but don't fail)
        try {
          const user = await authService.getUser();
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            await AsyncStorage.setItem('isAuthenticated', 'true');
            await AsyncStorage.setItem('userEmail', user.email);
            await AsyncStorage.setItem('currentUser', JSON.stringify(user));
            console.log('✅ Appwrite user session restored successfully');
          }
        } catch (appwriteError) {
          console.log('⚠️ Appwrite not available, starting in offline mode');
        }
      }
      setLoading(false);
    };

    loadAuthState();
  }, []);

  // Helper function to check if user is in offline mode
  const isOfflineMode = () => {
    return currentUser && currentUser.isOffline === true;
  };

  // Debug function to log current auth state
  const debugAuthState = () => {
    console.log('🔍 Current Auth State:', {
      isAuthenticated,
      currentUser: currentUser ? {
        id: currentUser.$id,
        email: currentUser.email,
        isOffline: currentUser.isOffline,
        name: currentUser.name
      } : null,
      mode: isOfflineMode() ? 'offline' : 'online'
    });
  };

  return (
    <AuthContext.Provider value={{ 
      getUser, 
      login, 
      logout, 
      currentUser, 
      loading,
      isAuthenticated,
      isOfflineMode,
      debugAuthState
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
