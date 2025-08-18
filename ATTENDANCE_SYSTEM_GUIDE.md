# Attendance System Implementation Guide

## Overview
This guide explains how to implement a comprehensive attendance management system with leave management and holiday tracking using Appwrite as the backend.

## Appwrite Collections Setup

### 1. Attendance Collection (`attendance`)

**Collection ID:** `attendance`

**Attributes:**
```json
{
  "employeeId": {
    "type": "string",
    "required": true,
    "array": false
  },
  "employeeName": {
    "type": "string", 
    "required": true,
    "array": false
  },
  "date": {
    "type": "string",
    "required": true,
    "array": false,
    "format": "date"
  },
  "status": {
    "type": "string",
    "required": true,
    "array": false,
    "enum": ["Present", "Absent", "Half Day", "Leave", "Holiday", "Not Set"]
  },
  "checkIn": {
    "type": "string",
    "required": false,
    "array": false,
    "format": "datetime"
  },
  "checkOut": {
    "type": "string", 
    "required": false,
    "array": false,
    "format": "datetime"
  },
  "workingHours": {
    "type": "double",
    "required": false,
    "array": false,
    "default": 0
  },
  "overtimeHours": {
    "type": "double",
    "required": false,
    "array": false,
    "default": 0
  },
  "remarks": {
    "type": "string",
    "required": false,
    "array": false
  },
  "deviceId": {
    "type": "string",
    "required": false,
    "array": false
  },
  "updatedAt": {
    "type": "string",
    "required": false,
    "array": false,
    "format": "datetime"
  }
}
```

**Indexes:**
- `employeeId_date` (Composite index on employeeId + date)
- `date` (Index on date for date-based queries)
- `status` (Index on status for filtering)
- `employeeId` (Index on employeeId for employee-based queries)

### 2. Holidays Collection (`holidays`)

**Collection ID:** `holidays`

**Attributes:**
```json
{
  "title": {
    "type": "string",
    "required": true,
    "array": false
  },
  "date": {
    "type": "string",
    "required": true,
    "array": false,
    "format": "date"
  },
  "description": {
    "type": "string",
    "required": false,
    "array": false
  },
  "type": {
    "type": "string",
    "required": true,
    "array": false,
    "enum": ["public", "company", "optional"],
    "default": "public"
  },
  "isRecurring": {
    "type": "boolean",
    "required": false,
    "array": false,
    "default": false
  },
  "deviceId": {
    "type": "string",
    "required": false,
    "array": false
  }
}
```

**Indexes:**
- `date` (Index on date for date-based queries)
- `type` (Index on type for filtering)
- `isRecurring` (Index on isRecurring for recurring holidays)

## Implementation Steps

### Step 1: Create Collections in Appwrite Console

1. Go to your Appwrite Console
2. Navigate to Databases → Your Database
3. Create the two collections: `attendance`, `holidays`
4. Add all the attributes as specified above
5. Create the indexes for optimal query performance

### Step 2: Update Environment Variables

Add these to your `.env` file:
```env
EXPO_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION_ID=attendance
EXPO_PUBLIC_APPWRITE_HOLIDAYS_COLLECTION_ID=holidays
```

### Step 3: Update the Attendance Screen

The attendance screen has been updated to use the unified data service instead of AsyncStorage directly. Key changes:

1. **Import the data service:**
```javascript
import { dataService } from '../../services/unifiedDataService';
```

2. **Replace AsyncStorage calls with dataService:**
```javascript
// Instead of AsyncStorage.getItem('attendance')
const attendanceData = await dataService.getItems('attendance');

// Instead of AsyncStorage.setItem('attendance', data)
await dataService.saveData(attendanceRecord, 'attendance');
```

### Step 4: Key Features Implemented

#### Attendance Management
- **Mark attendance** for employees (Present, Absent, Half Day)
- **Check-in/Check-out** timestamps
- **Working hours calculation**
- **Daily attendance summary**
- **Search and filter employees**

#### Holiday Management
- **Add/Remove holidays**
- **Holiday types** (Public, Company, Optional)
- **Recurring holidays support**
- **Holiday calendar view**

### Step 5: Data Synchronization

The system automatically:
- **Saves to local storage** first (offline capability)
- **Syncs to Appwrite** when online
- **Handles conflicts** between local and cloud data
- **Background sync** every 2 minutes

### Step 6: Advanced Features

#### Working Hours Calculation
```javascript
const calculateWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(0, hours);
};
```

#### Overtime Calculation
```javascript
const calculateOvertime = (workingHours, standardHours = 8) => {
  return Math.max(0, workingHours - standardHours);
};
```

#### Holiday Detection
```javascript
const isHoliday = (date, holidays) => {
  return holidays.some(holiday => holiday.date === date);
};
```

## Usage Examples

### Marking Attendance
```javascript
const markAttendance = async (employeeId, status) => {
  const attendanceRecord = {
    employeeId,
    employeeName: employee.fullName,
    date: new Date().toISOString().split('T')[0],
    status,
    checkIn: status === 'Present' ? new Date().toISOString() : null,
    checkOut: null,
    workingHours: 0,
    remarks: ''
  };
  
  await dataService.saveData(attendanceRecord, 'attendance');
};
```



### Adding Holiday
```javascript
const addHoliday = async (holidayData) => {
  const holidayRecord = {
    title: holidayData.title,
    date: holidayData.date,
    description: holidayData.description,
    type: holidayData.type,
    isRecurring: holidayData.isRecurring || false
  };
  
  await dataService.saveData(holidayRecord, 'holidays');
};
```

## Benefits of This Implementation

1. **Offline-First**: Works without internet connection
2. **Automatic Sync**: Syncs data when online
3. **Scalable**: Can handle large number of employees
4. **Flexible**: Easy to add new leave types or attendance statuses
5. **Real-time**: Updates reflect immediately in the UI
6. **Secure**: Uses Appwrite's built-in security features
7. **No 4-hour limit**: Manual work entries without time restrictions

## Troubleshooting

### Common Issues

1. **Collection not found**: Ensure collection IDs match exactly
2. **Permission denied**: Check Appwrite permissions for the collections
3. **Sync failures**: Verify network connectivity and Appwrite configuration
4. **Data not appearing**: Check if data is being saved to the correct collection

### Debug Commands

```javascript
// Check sync status
const status = await dataService.getSyncStatus();
console.log('Sync status:', status);

// Get storage stats
const stats = await dataService.getStorageStats();
console.log('Storage stats:', stats);

// Manual sync
const result = await dataService.manualSync();
console.log('Manual sync result:', result);
```

This implementation provides a robust, scalable attendance management system that works both online and offline, with automatic synchronization to Appwrite.
