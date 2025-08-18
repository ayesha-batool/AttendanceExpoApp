# 🚀 Appwrite Setup Guide

## ❌ Current Issue
You're getting the error: **"Project with the requested ID could not be found"**

This means your Appwrite project ID is not configured correctly.

## 🔧 Quick Fix

### Step 1: Create Environment File
Create a `.env` file in your project root (same level as `package.json`):

```bash
# Create .env file
touch .env
```

### Step 2: Add Your Appwrite Configuration
Add this to your `.env` file:

```env
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-actual-project-id-here
EXPO_PUBLIC_APPWRITE_DB_ID=shelfie_database
EXPO_PUBLIC_APPWRITE_BUNDLE_ID=com.ayeshabatool.shelfie_clean
```

### Step 3: Get Your Project ID
1. Go to [Appwrite Console](https://console.appwrite.io/)
2. Create a new project or select existing one
3. Copy the **Project ID** from the project settings
4. Replace `your-actual-project-id-here` with your real project ID

### Step 4: Restart Your App
```bash
npm start
# or
expo start
```

## 📋 Complete Setup Instructions

### 1. Appwrite Project Setup
1. **Create Project**: Go to [Appwrite Console](https://console.appwrite.io/)
2. **Get Project ID**: Copy from project settings
3. **Enable Auth**: Go to Auth → Settings → Enable Phone Authentication
4. **Configure SMS**: Set up SMS provider (Appwrite SMS for testing)

### 2. Database Setup
1. **Create Database**: Go to Databases → Create Database
   - Name: `shelfie_database`
   - ID: `shelfie_database`
2. **Create Collections**: Use the collection schemas provided earlier

### 3. Environment Variables
Your `.env` file should look like this:

```env
# Required
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=64a1b2c3d4e5f6789012345

# Optional (will use defaults if not set)
EXPO_PUBLIC_APPWRITE_DB_ID=shelfie_database
EXPO_PUBLIC_APPWRITE_BUNDLE_ID=com.ayeshabatool.shelfie_clean
```

## 🔍 Troubleshooting

### Error: "Project with the requested ID could not be found"
- ✅ Check your project ID is correct
- ✅ Make sure `.env` file exists in project root
- ✅ Restart your app after creating `.env`
- ✅ Verify project ID in Appwrite console

### Error: "Missing scope (account)"
- ✅ Enable Phone Authentication in Appwrite
- ✅ Configure SMS provider
- ✅ Wait 1-2 minutes for changes to propagate

### App Crashes on Startup
- ✅ Check console for environment variable errors
- ✅ Ensure all required variables are set
- ✅ Verify Appwrite project exists and is accessible

## 📱 Testing

1. **Start App**: `npm start`
2. **Check Console**: Look for "✅ Appwrite objects initialized successfully"
3. **Test Auth**: Try logging in with phone number
4. **Test Data**: Try adding/editing employees

## 🆘 Still Having Issues?

1. **Check Console Logs**: Look for detailed error messages
2. **Verify Project**: Make sure project exists in Appwrite console
3. **Test Connection**: Try accessing Appwrite console in browser
4. **Check Permissions**: Ensure project has proper permissions

## 📞 Support

- **Appwrite Docs**: [https://appwrite.io/docs](https://appwrite.io/docs)
- **Appwrite Console**: [https://console.appwrite.io/](https://console.appwrite.io/)
- **Project Issues**: Check the error messages in your app console
