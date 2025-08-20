import { Account, Client } from 'appwrite';

// Use the same client configuration as the main service
const client = new Client();
let account = null;

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
    
  console.log('✅ Appwrite email verification service initialized successfully');
  console.log('📍 Endpoint:', endpoint);
  console.log('🆔 Project ID:', projectId);
} catch (error) {
  console.error('❌ Failed to initialize Appwrite email verification service:', error);
}

// Initialize account service when needed
const getAccount = () => {
  if (!account) {
    account = new Account(client);
  }
  return account;
};

// Appwrite Email Verification Service
export const appwriteEmailVerification = {
  // Send verification email using Appwrite's built-in system
  async sendVerificationEmail() {
    try {
      console.log('📧 Sending verification email via Appwrite...');
      
      const accountService = getAccount();
      
      // First check if user is authenticated
      try {
        const currentUser = await accountService.get();
        console.log('✅ User is authenticated:', currentUser.email);
        console.log('🔍 User verification status:', currentUser.emailVerification);
      } catch (authError) {
        console.error('❌ User not authenticated:', authError.message);
        return {
          success: false,
          message: 'User not authenticated. Please log in first.',
          error: authError,
          code: 'AUTH_REQUIRED'
        };
      }
      
             // Use Appwrite's built-in email verification
       // Note: Appwrite requires a valid HTTP/HTTPS URL, not a custom scheme
       // For development, we'll use localhost:8081
       const verificationUrl = process.env.EXPO_PUBLIC_VERIFICATION_URL || 'http://localhost:8081/verify';
       
       console.log('🔗 Using verification URL:', verificationUrl);
       
       const response = await accountService.createVerification(verificationUrl);
      
      console.log('✅ Verification email sent successfully via Appwrite');
      return {
        success: true,
        message: 'Verification email sent successfully',
        response: response
      };
      
    } catch (error) {
      console.error('❌ Error sending erification email:', error);
      
      // Handle specific Appwrite errors
      if (error.code === 401) {
        return {
          success: false,
          message: 'Authentication required. Please log in first.',
          error: error,
          code: 'AUTH_REQUIRED'
        };
      } else if (error.code === 409) {
        return {
          success: false,
          message: 'Verification email already sent. Please check your inbox.',
          error: error,
          code: 'ALREADY_SENT'
        };
      } else if (error.message && error.message.includes('missing scope')) {
        return {
          success: false,
          message: 'Authentication required. Please log in first.',
          error: error,
          code: 'SCOPE_MISSING'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to send verification email',
        error: error
      };
    }
  },

  // Complete email verification using Appwrite's system
  async completeVerification(userId, secret) {
    try {
      console.log('🔍 Completing email verification via Appwrite...');
      
      const accountService = getAccount();
      
      // Use Appwrite's built-in verification completion
      const response = await accountService.updateVerification(
        userId,
        secret
      );
      
      console.log('✅ Email verification completed successfully');
      return {
        success: true,
        message: 'Email verification completed successfully',
        response: response
      };
      
    } catch (error) {
      console.error('❌ Error completing verification:', error);
      
      // Handle specific Appwrite errors
      if (error.code === 401) {
        return {
          success: false,
          message: 'Authentication required. Please log in first.',
          error: error
        };
      } else if (error.code === 409) {
        return {
          success: false,
          message: 'Invalid or expired verification link.',
          error: error
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to complete verification',
        error: error
      };
    }
  },

  // Check if user is verified
  async checkVerificationStatus() {
    try {
      const accountService = getAccount();
      const user = await accountService.get();
      
      console.log('🔍 Checking verification status for:', user.email);
      console.log('📧 Email verified:', user.emailVerification);
      
      return {
        success: true,
        isVerified: user.emailVerification,
        user: user
      };
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      
      // Handle authentication errors
      if (error.code === 401 || (error.message && error.message.includes('missing scope'))) {
        return {
          success: false,
          message: 'Authentication required. Please log in first.',
          error: error
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to check verification status',
        error: error
      };
    }
  },

  // Test the verification system
  async testVerificationSystem() {
    try {
      console.log('🧪 Testing Appwrite email verification system...');
      
      // First check if user is authenticated
      const accountService = getAccount();
      
      try {
        const user = await accountService.get();
        console.log('✅ User is authenticated:', user.email);
        console.log('📧 Current verification status:', user.emailVerification);
        
        // Try to send a verification email
        const sendResult = await this.sendVerificationEmail();
        
        if (sendResult.success) {
          console.log('✅ Verification email test successful');
          return {
            success: true,
            message: 'Verification system is working correctly',
            details: 'Check your email for verification link',
            user: user
          };
        } else {
          console.log('❌ Verification email test failed');
          return {
            success: false,
            message: 'Verification system test failed',
            error: sendResult.message
          };
        }
      } catch (authError) {
        if (authError.code === 401 || (authError.message && authError.message.includes('missing scope'))) {
          return {
            success: false,
            message: 'User not authenticated. Please log in first to test verification.',
            error: authError.message
          };
        }
        throw authError;
      }
      
    } catch (error) {
      console.error('❌ Error testing verification system:', error);
      return {
        success: false,
        message: error.message || 'Failed to test verification system',
        error: error
      };
    }
  },

  // Get current user (helper function)
  async getCurrentUser() {
    try {
      const accountService = getAccount();
      const user = await accountService.get();
      return {
        success: true,
        user: user
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
};

export default appwriteEmailVerification;
