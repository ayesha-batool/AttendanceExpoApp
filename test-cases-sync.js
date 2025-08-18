import { dataService, syncMonitor } from './services/unifiedDataService';

// Test script to verify cases sync
async function testCasesSync() {
  console.log('🧪 Testing Cases Sync...\n');
  
  try {
    // 1. Check current status
    console.log('📊 Current Status:');
    const status = await dataService.getSyncStatus();
    console.log('Online:', status.online);
    console.log('Pending sync:', status.pendingSync);
    console.log('Local items:', status.storage.total);
    
    // 2. Get local cases
    console.log('\n📦 Local Cases:');
    const localCases = await dataService.getFromLocal('cases');
    console.log(`Found ${localCases.length} cases in local storage`);
    
    if (localCases.length > 0) {
      console.log('Sample case structure:');
      console.log(JSON.stringify(localCases[0], null, 2));
    }
    
    // 3. Force sync all collections
    console.log('\n🔄 Force syncing all collections...');
    const syncResult = await dataService.forceSyncAll();
    console.log('Sync result:', syncResult);
    
    // 4. Check sync health
    console.log('\n🏥 Sync Health Report:');
    const health = await syncMonitor.getSyncHealthReport();
    console.log('Storage health:', health.storageHealth.healthPercentage + '%');
    console.log('Recommendations:', health.recommendations);
    
    // 5. Clean up invalid items if needed
    if (health.storageHealth.invalid > 0) {
      console.log('\n🧹 Cleaning up invalid items...');
      const cleanup = await syncMonitor.cleanupAllInvalidItems();
      console.log('Cleanup result:', cleanup);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCasesSync();
