// Import necessary modules from React Native and Appwrite SDK
import { Account, Client, Databases, Storage } from 'appwrite'; // ✅ Fixed import
import { appwriteConfig } from '../appwrite.config.js';

// Debug: Check if environment variables are loaded
console.log('=== APPWRITE ENVIRONMENT CHECK ===');
console.log('Environment variables loaded:', {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
  notesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_COL_NOTES_ID,
  bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID,
});

console.log('Final appwrite config:', appwriteConfig);

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

// Initialize the Databases instance using the configured client
const databases = new Databases(client);

// Initialize Storage for file uploads
const storage = new Storage(client);

// Initialize Account for authentication (includes phone auth)
const account = new Account(client);

// Debug logging
console.log('Appwrite Client Configuration:', {
    endpoint: appwriteConfig.endpoint,
    projectId: appwriteConfig.projectId,
    clientConfig: client.config
});

// Export the setup
export { account, appwriteConfig, client, databases, storage };

