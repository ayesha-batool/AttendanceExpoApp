import Constants from 'expo-constants';

// Get the current development server port
const getDevServerPort = () => {
  // Try to get port from Expo's development server
  if (Constants.expoConfig?.hostUri) {
    const portMatch = Constants.expoConfig.hostUri.match(/:(\d+)/);
    if (portMatch) {
      return portMatch[1];
    }
  }
  
  // Fallback to common development ports
  return '8081';
};

// Get the current development server URL
const getDevServerUrl = () => {
  const port = getDevServerPort();
  return `http://localhost:${port}`;
};

// App Configuration
export const appConfig = {
  // Appwrite Configuration
  appwrite: {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID || 'shelfie_database',
    collections: {
      employees: process.env.EXPO_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID || '689ca41b00061e94a51f',
      cases: process.env.EXPO_PUBLIC_APPWRITE_CASES_COLLECTION_ID || 'cases',
      expenses: process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID || 'expenses',
      attendance: process.env.EXPO_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION_ID || 'attendance',
      customOptions: process.env.EXPO_PUBLIC_APPWRITE_CUSTOM_OPTIONS_COLLECTION_ID || 'customOptions'
    }
  },

  // App Configuration
  app: {
    name: 'Police Department Management System',
    scheme: 'shelfieclean',
    bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID || 'com.ayeshabatool.shelfieclean'
  },

  // Verification Configuration
  verification: {
    // Automatically detect the correct verification URL based on environment
    getUrl: () => {
      // For production, use the environment variable
      if (process.env.EXPO_PUBLIC_VERIFICATION_URL) {
        return process.env.EXPO_PUBLIC_VERIFICATION_URL;
      }
      
      // For development, use the current dev server
      const devUrl = getDevServerUrl();
      return `${devUrl}/verify`;
    },
    
    // Get the deep link URL for the app
    getDeepLinkUrl: () => {
      return `${appConfig.app.scheme}://verify`;
    },
    
    // Get the web URL for verification (used by Appwrite)
    getWebUrl: () => {
      return appConfig.verification.getUrl();
    }
  },

  // Development Configuration
  development: {
    isDev: __DEV__,
    devServerPort: getDevServerPort(),
    devServerUrl: getDevServerUrl(),
    enableLogs: __DEV__
  },

  // Network Configuration
  network: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3
  }
};

// Helper function to get verification URL
export const getVerificationUrl = () => appConfig.verification.getUrl();

// Helper function to get deep link URL
export const getDeepLinkUrl = () => appConfig.verification.getDeepLinkUrl();

// Helper function to get web URL
export const getWebUrl = () => appConfig.verification.getWebUrl();

// Export the configuration
export default appConfig;
