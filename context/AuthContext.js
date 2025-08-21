import React, { createContext, useContext, useEffect, useState } from 'react';
import { appwriteEmailVerification } from '../services/appwriteEmailVerification';
import offlineAuthService from '../services/offlineAuthService';
import { authService } from '../services/unifiedDataService';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const register = async (email, password, name) => {
    try {
      console.log('🔐 Starting registration process for:', email);
      
      // Check if device is online
      const online = await offlineAuthService.isOnline();
      
      if (!online) {
        console.log('📱 Device is offline, storing signup locally');
        
        // Store signup credentials locally
        const offlineUser = await offlineAuthService.storePendingSignup({
          email,
          password,
          fullName: name
        });
        
        // Set current user for offline mode
        setCurrentUser({
          ...offlineUser,
          isOfflineUser: true,
          verified: false
        });
        
        return {
          success: true,
          message: 'Signup stored locally. You can now login without verification while offline.',
          user: offlineUser,
          isOffline: true,
          requiresVerification: false
        };
      }
      
      // Online registration with Appwrite
      const user = await authService.register(email, password, name);
      
      // Set current user immediately after successful registration
      setCurrentUser(user);
      
      // Check if user needs email verification
      if (!user.emailVerification) {
        setVerificationSent(true);
        setIsEmailVerified(false);
        console.log('📧 User needs email verification, verification email should be sent automatically by Appwrite');
        console.log('📧 Note: Appwrite automatically sends verification emails upon registration');
      } else {
        setIsEmailVerified(true);
      }
      
      return {
        success: true,
        message: 'Registration successful! Please check your email for verification link.',
        user: user,
        requiresVerification: !user.emailVerification
      };
    } catch (error) {
      // Extract clean error message from Appwrite error format
      let cleanErrorMessage = error.message || '';
      if (cleanErrorMessage.includes('AppwriteException:')) {
        cleanErrorMessage = cleanErrorMessage.split('AppwriteException:')[1]?.trim() || cleanErrorMessage;
      }
      console.log('❌ Registration failed:', cleanErrorMessage);
      
      // If it's already a user-friendly error, just re-throw it
      if (error.message && !error.message.includes('Appwrite')) {
        throw error;
      }
      
      // For technical errors, provide a generic message
      const friendlyError = new Error('Registration failed. Please try again.');
      friendlyError.originalError = error;
      throw friendlyError;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      console.log('📧 Sending verification email...');
      
      // Check if user is authenticated first
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.');
      }
      
      const result = await appwriteEmailVerification.sendVerificationEmail();
      
      if (result.success) {
        setVerificationSent(true);
        return {
          success: true,
          message: 'Verification email sent successfully. Please check your inbox.'
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log('❌ Error sending verification email:', error.message);
      throw error;
    }
  };

  const completeVerification = async (userId, secret) => {
    try {
      console.log('🔍 Completing email verification...');
      
      const result = await appwriteEmailVerification.completeVerification(userId, secret);
      
      if (result.success) {
        // Refresh user data to get updated verification status
        await getUser();
        setVerificationSent(false);
        setIsEmailVerified(true);
        
        return {
          success: true,
          message: 'Email verification completed successfully!'
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log('❌ Error completing verification:', error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Check if device is online
      const online = await offlineAuthService.isOnline();
      
      if (!online) {
        console.log('📱 Device is offline, attempting offline login');
        
        // Attempt offline login
        const session = await offlineAuthService.offlineLogin({
          email,
          password
        });
        
        setCurrentUser(session.user);
        setIsEmailVerified(true); // Offline users don't need verification
        setVerificationSent(false);
        
        return {
          success: true,
          message: 'Offline login successful! Welcome back.',
          user: session.user,
          isOffline: true
        };
      }
      
      // Online login with Appwrite
      const result = await authService.login(email, password);
      
      // Get updated user data
      const user = await authService.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Check if user needs email verification
        if (!user.emailVerification) {
          setVerificationSent(true);
          setIsEmailVerified(false);
        } else {
          setIsEmailVerified(true);
          setVerificationSent(false);
        }
      }
      
      return result;
    } catch (error) {
      // Extract clean error message from Appwrite error format
      let cleanErrorMessage = error.message || '';
      if (cleanErrorMessage.includes('AppwriteException:')) {
        cleanErrorMessage = cleanErrorMessage.split('AppwriteException:')[1]?.trim() || cleanErrorMessage;
      }
      console.log('❌ Login failed:', cleanErrorMessage);
      
      // If it's already a user-friendly error, just re-throw it
      if (error.message && !error.message.includes('Appwrite')) {
        throw error;
      }
      
      // For technical errors, provide a generic message
      const friendlyError = new Error('Login failed. Please check your credentials and try again.');
      friendlyError.originalError = error;
      throw friendlyError;
    }
  };

  const logout = async () => {
    try {
      // Check if user is offline
      if (currentUser?.isOfflineUser) {
        await offlineAuthService.logoutOffline();
        setCurrentUser(null);
        setVerificationSent(false);
        setIsEmailVerified(false);
        return { success: true, message: 'Offline logout successful' };
      }
      
      // Online logout
      const result = await authService.logout();
      setCurrentUser(null);
      setVerificationSent(false);
      setIsEmailVerified(false);
      return result;
    } catch (error) {
      console.log('❌ Logout failed:', error.message);
      throw error;
    }
  };

  const getUser = async () => {
    try {
      // First check for offline user
      const offlineUser = await offlineAuthService.getCurrentOfflineUser();
      if (offlineUser) {
        console.log('📱 Found offline user session');
        setCurrentUser(offlineUser);
        setIsEmailVerified(true); // Offline users don't need verification
        setVerificationSent(false);
        return offlineUser;
      }
      
      // Check online user
      const user = await authService.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Check if user needs email verification
        if (!user.emailVerification) {
          setVerificationSent(true);
          setIsEmailVerified(false);
        } else {
          setIsEmailVerified(true);
          setVerificationSent(false);
        }
      }
      return user;
    } catch (error) {
      console.error("Error getting user in AuthContext:", error);
      setCurrentUser(null);
      return null;
    }
  };

  const checkVerificationStatus = async () => {
    try {
      // Check if user is authenticated first
      if (!currentUser) {
        return {
          success: false,
          message: 'User not authenticated. Please log in first.',
          isVerified: false
        };
      }
      
      const result = await appwriteEmailVerification.checkVerificationStatus();
      return result;
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      return {
        success: false,
        message: error.message || 'Failed to check verification status',
        isVerified: false
      };
    }
  };

  const testVerificationSystem = async () => {
    try {
      // Check if user is authenticated first
      if (!currentUser) {
        return {
          success: false,
          message: 'User not authenticated. Please log in first to test verification system.',
          details: 'Log in to your account before testing verification'
        };
      }
      
      const result = await appwriteEmailVerification.testVerificationSystem();
      return result;
    } catch (error) {
      console.error('❌ Error testing verification system:', error);
      return {
        success: false,
        message: error.message || 'Failed to test verification system'
      };
    }
  };

  useEffect(() => {
    getUser().finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ 
      getUser, 
      login, 
      register, 
      logout, 
      currentUser, 
      loading,
      verificationSent,
      isEmailVerified,
      sendVerificationEmail,
      completeVerification,
      checkVerificationStatus,
      testVerificationSystem
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
