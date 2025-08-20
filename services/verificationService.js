import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Client } from 'appwrite';
import { emailService } from './emailService';

// Initialize Appwrite client for verification
const client = new Client();
const account = new Account(client);

try {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  
  if (!projectId) {
    console.error('🚨 EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set!');
    throw new Error('Appwrite Project ID not configured');
  }
  
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
    
  console.log('✅ Verification service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize verification service:', error);
}

// Generate a random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification code in local storage
const storeVerificationCode = async (email, code) => {
  try {
    const verificationData = {
      email,
      code,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 5
    };
    
    await AsyncStorage.setItem(`verification_${email}`, JSON.stringify(verificationData));
    console.log('✅ Verification code stored for:', email);
    return true;
  } catch (error) {
    console.error('❌ Error storing verification code:', error);
    return false;
  }
};

// Get verification code from local storage
const getVerificationCode = async (email) => {
  try {
    const data = await AsyncStorage.getItem(`verification_${email}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting verification code:', error);
    return null;
  }
};

// Remove verification code from local storage
const removeVerificationCode = async (email) => {
  try {
    await AsyncStorage.removeItem(`verification_${email}`);
    console.log('✅ Verification code removed for:', email);
    return true;
  } catch (error) {
    console.error('❌ Error removing verification code:', error);
    return false;
  }
};

// Check if verification code is expired (15 minutes)
const isCodeExpired = (timestamp) => {
  const now = Date.now();
  const expirationTime = 15 * 60 * 1000; // 15 minutes in milliseconds
  return (now - timestamp) > expirationTime;
};

// Increment verification attempts
const incrementAttempts = async (email) => {
  try {
    const data = await getVerificationCode(email);
    if (data) {
      data.attempts += 1;
      await AsyncStorage.setItem(`verification_${email}`, JSON.stringify(data));
      return data.attempts;
    }
    return 0;
  } catch (error) {
    console.error('❌ Error incrementing attempts:', error);
    return 0;
  }
};

// Check if user exists in local storage
const checkUserInLocalStorage = async (email) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.startsWith('user_'));
    
    for (const key of userKeys) {
      const userData = await AsyncStorage.getItem(key);
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email === email) {
          return user;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error checking user in local storage:', error);
    return null;
  }
};

// Store user data in local storage
const storeUserInLocalStorage = async (userData) => {
  try {
    const userKey = `user_${userData.$id}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(userData));
    console.log('✅ User stored in local storage:', userData.email);
    return true;
  } catch (error) {
    console.error('❌ Error storing user in local storage:', error);
    return false;
  }
};

// Send verification email using real email service
const sendVerificationEmail = async (email, code) => {
  try {
    console.log('📧 Sending verification email to:', email);
    console.log('🔑 Verification code:', code);
    
    // Use the real email service
    const result = await emailService.sendVerificationEmail(email, code);
    
    if (result) {
      console.log('✅ Verification email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send verification email');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending veriication email:', error);
    return false;
  }
};

// Main verification service
export const verificationService = {
  // Generate and send verification code
  async sendVerificationCode(email) {
    try {
      console.log('🔐 Generating verification code for:', email);
      
      // Check if user already exists
      const existingUser = await checkUserInLocalStorage(email);
      if (existingUser) {
        throw new Error('User already exists with this email address');
      }
      
      // Generate verification code
      const code = generateVerificationCode();
      
      // Store verification code
      const stored = await storeVerificationCode(email, code);
      if (!stored) {
        throw new Error('Failed to store verification code');
      }
      
      // Send verification email
      const sent = await sendVerificationEmail(email, code);
      if (!sent) {
        throw new Error('Failed to send verification email');
      }
      
      return {
        success: true,
        message: 'Verification code sent successfully',
        email
      };
    } catch (error) {
      console.error('❌ Error in sendVerificationCode:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Verify the code and complete registration
  async verifyCode(email, code) {
    try {
      console.log('🔍 Verifying code for:', email);
      
      // Get stored verification data
      const verificationData = await getVerificationCode(email);
      if (!verificationData) {
        throw new Error('No verification code found for this email');
      }
      
      // Check if code is expired
      if (isCodeExpired(verificationData.timestamp)) {
        await removeVerificationCode(email);
        throw new Error('Verification code has expired. Please request a new one.');
      }
      
      // Check if max attempts exceeded
      if (verificationData.attempts >= verificationData.maxAttempts) {
        await removeVerificationCode(email);
        throw new Error('Too many verification attempts. Please request a new code.');
      }
      
      // Increment attempts
      await incrementAttempts(email);
      
      // Verify the code
      if (verificationData.code !== code) {
        throw new Error('Invalid verification code. Please try again.');
      }
      
      // Code is valid - remove it from storage
      await removeVerificationCode(email);
      
      return {
        success: true,
        message: 'Email verified successfully',
        email
      };
    } catch (error) {
      console.error('❌ Error in verifyCode:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Resend verification code
  async resendVerificationCode(email) {
    try {
      console.log('🔄 Resending verification code for:', email);
      
      // Remove existing verification code if any
      await removeVerificationCode(email);
      
      // Generate new code
      const code = generateVerificationCode();
      
      // Store new verification code
      const stored = await storeVerificationCode(email, code);
      if (!stored) {
        throw new Error('Failed to store verification code');
      }
      
      // Send new verification email
      const sent = await sendVerificationEmail(email, code);
      if (!sent) {
        throw new Error('Failed to send verification email');
      }
      
      return {
        success: true,
        message: 'New verification code sent successfully',
        email
      };
    } catch (error) {
      console.error('❌ Error in resendVerificationCode:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Check if user exists in local storage
  async checkUserExists(email) {
    try {
      const user = await checkUserInLocalStorage(email);
      return {
        exists: !!user,
        user: user
      };
    } catch (error) {
      console.error('❌ Error checking if user exists:', error);
      return {
        exists: false,
        user: null
      };
    }
  },

  // Store user data after successful verification
  async storeVerifiedUser(userData) {
    try {
      const stored = await storeUserInLocalStorage(userData);
      if (!stored) {
        throw new Error('Failed to store user data');
      }
      
      return {
        success: true,
        message: 'User data stored successfully'
      };
    } catch (error) {
      console.error('❌ Error storing verified user:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get all users from local storage
  async getAllUsers() {
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
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  },

  // Clear all verification data (for testing/debugging)
  async clearAllVerificationData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const verificationKeys = keys.filter(key => key.startsWith('verification_'));
      
      for (const key of verificationKeys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log('✅ All verification data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing verification data:', error);
      return false;
    }
  },

  // Get verification status for an email
  async getVerificationStatus(email) {
    try {
      const verificationData = await getVerificationCode(email);
      if (!verificationData) {
        return {
          hasCode: false,
          isExpired: false,
          attempts: 0,
          maxAttempts: 5
        };
      }
      
      return {
        hasCode: true,
        isExpired: isCodeExpired(verificationData.timestamp),
        attempts: verificationData.attempts,
        maxAttempts: verificationData.maxAttempts,
        remainingAttempts: verificationData.maxAttempts - verificationData.attempts
      };
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      return {
        hasCode: false,
        isExpired: false,
        attempts: 0,
        maxAttempts: 5
      };
    }
  },

  // Test email service
  async testEmailService(email) {
    try {
      return await emailService.testEmailService(email);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default verificationService;
