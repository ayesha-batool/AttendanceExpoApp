// Test Appwrite Connection
// Run this with: node test-appwrite-connection.js

import { Client, Databases } from 'appwrite';

const testAppwriteConnection = async () => {
  console.log('🧪 Testing Appwrite Connection...\n');
  
  // Check environment variables
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
  
  console.log('📋 Configuration:');
  console.log('📍 Endpoint:', endpoint);
  console.log('🆔 Project ID:', projectId || '❌ NOT SET');
  console.log('🗄️ Database ID:', databaseId || '❌ NOT SET');
  console.log('');
  
  if (!projectId) {
    console.error('❌ EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set!');
    console.error('💡 Please create a .env file with your Appwrite project ID');
    return;
  }
  
  try {
    // Initialize client
    const client = new Client();
    client
      .setEndpoint(endpoint)
      .setProject(projectId);
    
    const databases = new Databases(client);
    
    console.log('🔗 Testing connection...');
    
    // Try to list databases to test connection
    const databaseList = await databases.list();
    console.log('✅ Connection successful!');
    console.log('📊 Available databases:', databaseList.databases.length);
    
    if (databaseId) {
      try {
        // Try to access the specific database
        const database = await databases.get(databaseId);
        console.log('✅ Database access successful!');
        console.log('📁 Database name:', database.name);
        
        // Try to list collections
        const collections = await databases.listCollections(databaseId);
        console.log('📂 Available collections:', collections.collections.length);
        
        collections.collections.forEach(collection => {
          console.log(`  - ${collection.name} (${collection.$id})`);
        });
        
      } catch (dbError) {
        console.error('❌ Database access failed:', dbError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('project with requested id could not be found')) {
      console.error('\n🚨 This means your Project ID is incorrect!');
      console.error('💡 Please check your Appwrite project settings and update EXPO_PUBLIC_APPWRITE_PROJECT_ID');
    }
  }
};

// Run the test
testAppwriteConnection().catch(console.error);
