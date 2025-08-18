// Test script to check Appwrite configuration and data storage
import { Client, Databases } from 'appwrite';
import { cleanupExistingData } from './services/dataHandler.js';


// Check environment variables
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID || 'shelfie_database';


if (!projectId) {
    console.error('❌ EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set!');
    console.error('❌ Appwrite will not work without this configuration.');
    console.error('❌ Please create a .env file with your Appwrite project ID.');
    process.exit(1);
}

// Test Appwrite connection
try {
    
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId);
    
    const databases = new Databases(client);
    
    
    // Test database access
    const database = await databases.get(databaseId);
    
    // Test collection access
    const collections = await databases.listCollections(databaseId);
    
    collections.collections.forEach(collection => {
    });
    
    // Test data creation

    const testData = {
        fullName: 'Test Employee',
        badgeNumber: 'TEST001',
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    const testDocument = await databases.createDocument(
        databaseId,
        '689ca41b00061e94a51f', // EMPLOYEES collection ID
        'test_employee_001',
        testData
    );
    
    
    // Clean up test data
    await databases.deleteDocument(
        databaseId,
        '689ca41b00061e94a51f',
        testDocument.$id
    );
    
} catch (error) {
    console.error('❌ Appwrite test failed:', error.message);
    console.error('❌ Error details:', error);
    
    if (error.code === 404) {
        console.error('❌ Project or database not found. Check your project ID and database ID.');
    } else if (error.code === 401) {
        console.error('❌ Authentication failed. Check your project ID.');
    } else if (error.code === 403) {
        console.error('❌ Permission denied. Check your database and collection permissions.');
    }
}

// Clean up existing data to fix sync errors
const runCleanup = async () => {
  console.log('🧹 Starting data cleanup...');
  
  try {
    // Clean up employees data
    await cleanupExistingData('employees');
    console.log('✅ Employees cleanup completed');
    
    // Clean up cases data
    await cleanupExistingData('cases');
    console.log('✅ Cases cleanup completed');
    
    // Clean up expenses data
    await cleanupExistingData('expenses');
    console.log('✅ Expenses cleanup completed');
    
    console.log('🎉 All cleanup operations completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Run cleanup
runCleanup();

