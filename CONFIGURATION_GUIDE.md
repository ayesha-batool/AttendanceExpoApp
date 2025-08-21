# 🔧 Centralized Configuration Guide

## 🎯 **Overview**

The app now uses a centralized configuration system that automatically detects the correct development server port and manages all configuration in one place. This eliminates the need to manually update URLs in multiple files.

## 📁 **Configuration File**

All configuration is now managed in `config/appConfig.js`:

```javascript
import appConfig from '../config/appConfig';

// Get verification URL (automatically detects correct port)
const verificationUrl = appConfig.verification.getUrl();

// Get deep link URL
const deepLinkUrl = appConfig.verification.getDeepLinkUrl();

// Get web URL
const webUrl = appConfig.verification.getWebUrl();
```

## 🔄 **Automatic Port Detection**

The system automatically detects the correct development server port:

- **Expo Development Server**: Automatically detects port (8081, 8082, 8083, etc.)
- **Production**: Uses environment variable `EXPO_PUBLIC_VERIFICATION_URL`
- **Fallback**: Uses port 8081 if detection fails

## 🛠 **How to Use**

### **1. Import the Configuration**

```javascript
import { getVerificationUrl, getDeepLinkUrl } from '../config/appConfig';
```

### **2. Use Helper Functions**

```javascript
// Get verification URL (automatically detects port)
const verificationUrl = getVerificationUrl();

// Get deep link URL
const deepLinkUrl = getDeepLinkUrl();

// Get web URL
const webUrl = getWebUrl();
```

### **3. Access Full Configuration**

```javascript
import appConfig from '../config/appConfig';

// Appwrite configuration
const endpoint = appConfig.appwrite.endpoint;
const projectId = appConfig.appwrite.projectId;

// App configuration
const appName = appConfig.app.name;
const appScheme = appConfig.app.scheme;

// Development configuration
const isDev = appConfig.development.isDev;
const devServerPort = appConfig.development.devServerPort;
```

## 🔧 **Environment Variables**

### **Required Variables**

```bash
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DB_ID=your_database_id

# Collection IDs
EXPO_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID=your_employees_collection_id
EXPO_PUBLIC_APPWRITE_CASES_COLLECTION_ID=your_cases_collection_id
EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID=your_expenses_collection_id
EXPO_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION_ID=your_attendance_collection_id
EXPO_PUBLIC_APPWRITE_CUSTOM_OPTIONS_COLLECTION_ID=your_custom_options_collection_id

# Optional: Production verification URL
EXPO_PUBLIC_VERIFICATION_URL=https://your-domain.com/verify
```

### **Optional Variables**

```bash
# Bundle ID (for mobile apps)
EXPO_PUBLIC_APPWRITE_BUNDLE_ID=com.yourcompany.yourapp
```

## 🚀 **Benefits**

### **✅ Automatic Port Detection**
- No more manual URL updates when port changes
- Works with any development server port (8081, 8082, 8083, etc.)
- Automatically adapts to different development environments

### **✅ Centralized Management**
- All configuration in one place
- Easy to update and maintain
- Consistent across all components

### **✅ Environment Awareness**
- Automatically detects development vs production
- Uses appropriate URLs for each environment
- Fallback mechanisms for reliability

### **✅ Type Safety**
- Helper functions provide consistent interface
- Clear documentation of available options
- Easy to extend and modify

## 🔍 **Debugging**

### **Check Current Configuration**

```javascript
import appConfig from '../config/appConfig';

console.log('Current configuration:', {
  verificationUrl: appConfig.verification.getUrl(),
  deepLinkUrl: appConfig.verification.getDeepLinkUrl(),
  devServerPort: appConfig.development.devServerPort,
  isDev: appConfig.development.isDev
});
```

### **Test Configuration**

Use the test page in the app to verify your configuration:

1. Navigate to the test page
2. Click "Test Configuration"
3. Verify all URLs are correct

## 🎯 **Migration Guide**

### **Before (Old Way)**
```javascript
// Hardcoded URLs in multiple files
const verificationUrl = 'http://localhost:8081/verify';
const verificationUrl = 'http://localhost:8082/verify';
const verificationUrl = process.env.EXPO_PUBLIC_VERIFICATION_URL || 'http://localhost:8081/verify';
```

### **After (New Way)**
```javascript
// Centralized configuration
import { getVerificationUrl } from '../config/appConfig';
const verificationUrl = getVerificationUrl();
```

## 🔄 **Files Updated**

The following files now use the centralized configuration:

- ✅ `services/appwriteEmailVerification.js`
- ✅ `services/unifiedDataService.js`
- ✅ `app/_layout.jsx`
- ✅ `components/UserStorageTest.jsx`

## 🎉 **Result**

Now when you start the development server on any port (8081, 8082, 8083, etc.), the verification URLs will automatically update to use the correct port. No more manual updates needed!

**Example:**
- Server starts on port 8083 → Verification URL automatically becomes `http://localhost:8083/verify`
- Server starts on port 8081 → Verification URL automatically becomes `http://localhost:8081/verify`
- Production environment → Uses `EXPO_PUBLIC_VERIFICATION_URL` environment variable
