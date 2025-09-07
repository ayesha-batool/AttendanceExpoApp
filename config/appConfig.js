
// Helper function to clean environment variables
const cleanEnvVar = (value) => {
  if (!value) return value;
  // Remove extra quotes, commas, and URL encoding that might be added by environment variable parsing
  let cleaned = value.replace(/^["']|["'],?$/g, '').trim();
  // Decode URL encoding if present
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {
    // If decodeURIComponent fails, use the original cleaned value
  }
  return cleaned;
};

// Simple configuration - all environment variables in one place
export const appConfig = {
  appwrite: {
    endpoint: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) ,
    projectId: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID),
    databaseId: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_DB_ID) ,
    collections: {
      employees: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID) ,
      cases: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_CASES_COLLECTION_ID) ,
      expenses: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) ,
      attendance: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION_ID) ,
      customOptions: cleanEnvVar(process.env.EXPO_PUBLIC_APPWRITE_CUSTOM_OPTIONS_COLLECTION_ID)
    }
  },

  app: {
    scheme: 'policeshield',
    bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID || 'com.police.shield'
  }
};

// Export individual parts for easy access
export const { appwrite, app } = appConfig;

// Helper function to validate configuration (less strict for development)
export const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Only show errors for critical missing values
  if (!appConfig.appwrite.projectId) {
    if (__DEV__) {
      warnings.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set (will use fallback values)');
    } else {
      errors.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set');
    }
  }
  
  if (!appConfig.appwrite.endpoint) {
    warnings.push('EXPO_PUBLIC_APPWRITE_ENDPOINT is not set (using default)');
  }
  
  // Log warnings in development but don't fail
  if (__DEV__ && warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
