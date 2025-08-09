// Appwrite Configuration
// Uses environment variables from .env file

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
  collectionId: {
    notes: process.env.EXPO_PUBLIC_APPWRITE_COL_NOTES_ID,
  },
  bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID,
};

// 🔧 Environment Variables Required:
// Create a .env file in your project root with:
// EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
// EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-actual-project-id
// EXPO_PUBLIC_APPWRITE_DB_ID=your-database-id (optional)
// EXPO_PUBLIC_APPWRITE_COL_NOTES_ID=your-notes-collection-id (optional)
// EXPO_PUBLIC_APPWRITE_BUNDLE_ID=com.yourcompany.yourapp

// 📱 FOR PHONE AUTHENTICATION:
// 1. In your Appwrite project, go to Auth → Settings
// 2. Enable Phone Authentication
// 3. Configure your SMS provider (Twilio, MessageBird, etc.)
// 4. Save the settings

// 🚨 Make sure your .env file exists and has the correct values! 