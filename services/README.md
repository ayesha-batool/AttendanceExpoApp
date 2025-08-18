# Unified Data Service

This is a unified data management service that consolidates all data operations across the application, eliminating code duplication and providing a single source of truth for all data operations.

## Overview

The `unifiedDataService.js` file contains all the data management functionality that was previously scattered across multiple files:
- `dataHandler.js` (deleted)
- `appwrite.js` (deleted) 
- `customOptionsService.js` (now re-exports from unified service)
- `authService.js` (now re-exports from unified service)

## Services

### 1. Data Service (`dataService`)

Main data operations for CRUD operations on collections:

```javascript
import { dataService } from '../services/unifiedDataService';

// Get items with sync
const items = await dataService.getItems('employees');

// Save new data
const newItem = await dataService.saveData(data, 'employees');

// Update existing data
const updatedItem = await dataService.updateData(key, documentId, data, 'employees');

// Delete data
const result = await dataService.deleteData(key, documentId, 'employees');

// Manual sync
const syncResult = await dataService.manualSync();

// Get pending sync status
const pendingCount = await dataService.getPendingSyncCount();
const pendingItems = await dataService.getPendingSync();
```

### 2. Custom Options Service (`customOptionsService`)

Manage custom dropdown options:

```javascript
import { customOptionsService } from '../services/unifiedDataService';

// Load options
const options = await customOptionsService.loadCustomOptions('departments');

// Add new option
const result = await customOptionsService.addCustomOption('departments', 'New Department');

// Remove option
const result = await customOptionsService.removeCustomOption('departments', 'Old Department');
```

### 3. Authentication Service (`authService`)

User authentication operations:

```javascript
import { authService } from '../services/unifiedDataService';

// Login
const session = await authService.login(email, password);

// Register
const user = await authService.register(email, password, name);

// Get current user
const user = await authService.getUser();

// Logout
await authService.logout();
```

## Key Features

### 🔄 Sophisticated Sync Strategy
- **Local First**: All data is saved to local storage first
- **Local → Appwrite**: Local data is always synced to Appwrite when online
- **Device Aware**: Uses device IDs to handle multi-device scenarios
- **Smart Cleanup**: Removes Appwrite data that belongs to the current device when local is empty

### 🛡️ Error Handling
- **Rate Limiting**: Handles Appwrite rate limits gracefully with batching and delays
- **Invalid Document Structure**: Retries with cleaned data
- **Document Not Found**: Creates new documents or assumes deletion
- **Network Failures**: Falls back to local storage
- **Smart Batching**: Processes items in small batches to avoid rate limits

### 📱 Device Management
- **Unique Device IDs**: Generated using timestamp and random strings
- **Persistent Storage**: Device ID is stored and reused
- **Cross-Platform**: Works on all platforms without device-specific APIs

### 🔧 Configuration
- **Environment Variables**: Uses environment variables for Appwrite configuration
- **Fallbacks**: Provides sensible defaults when environment variables are missing
- **Collection Mapping**: Maps collection names to IDs

## Migration Guide

### Old Code:
```javascript
import { getItems, handleDataSubmit, handleDataUpdate, handleDataDelete } from '../services/dataHandler';
import CustomOptionsService from '../services/customOptionsService';
import { authService } from '../services/authService';

const items = await getItems('employees');
const newItem = await handleDataSubmit(data, 'employees');
const options = await CustomOptionsService.loadCustomOptions('departments');
```

### New Code:
```javascript
import { dataService, customOptionsService, authService } from '../services/unifiedDataService';

const items = await dataService.getItems('employees');
const newItem = await dataService.saveData(data, 'employees');
const options = await customOptionsService.loadCustomOptions('departments');
```

## Backward Compatibility

The old service files (`customOptionsService.js` and `authService.js`) still exist but now re-export from the unified service, ensuring backward compatibility while eliminating code duplication.

## Rate Limiting & Sync Management

The service includes sophisticated rate limiting to handle Appwrite's API limits:

### 🔄 Smart Batching
- **Batch Size**: Processes 2-3 items at a time
- **Delays**: 2-3 second delays between batches
- **Automatic Queuing**: Failed operations are queued for retry
- **Progress Tracking**: Detailed logging of sync progress

### 📊 Sync Monitoring
```javascript
import { syncMonitor } from '../services/syncMonitor';

// Get sync status
const status = await syncMonitor.getStatus();
console.log('Pending items:', status.pendingCount);

// Get detailed statistics
const stats = await syncMonitor.getDetailedStats();
console.log('Sync recommendations:', stats.recommendations);

// Retry sync with custom settings
const result = await syncMonitor.retrySync({
  maxRetries: 3,
  delayBetweenRetries: 5000
});
```

### 🛠️ Troubleshooting Rate Limits
1. **Check pending sync**: Use `dataService.getPendingSyncCount()` to see pending items
2. **Manual retry**: Use `dataService.manualSync()` to retry failed operations
3. **Clear old items**: Use `syncMonitor.clearPendingSync()` if needed (with caution)
4. **Monitor progress**: Check console logs for detailed sync progress

## Benefits

1. **No Code Duplication**: Single source of truth for all data operations
2. **Consistent Error Handling**: Unified approach to handling Appwrite errors
3. **Better Maintainability**: Changes only need to be made in one place
4. **Improved Performance**: Optimized sync strategy and reduced overhead
5. **Enhanced Reliability**: Robust error handling and fallback mechanisms
6. **Rate Limit Protection**: Smart batching and queuing to avoid API limits
