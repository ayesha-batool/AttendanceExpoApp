# Appwrite Phone Authentication Setup

This project now uses Appwrite for phone authentication instead of Firebase. Follow these steps to set up Appwrite:

## 1. Create an Appwrite Project

1. Go to [Appwrite Console](https://console.appwrite.io/)
2. Create a new project or use an existing one
3. Note down your Project ID

## 2. Enable Phone Authentication (IMPORTANT!)

**This is the most critical step to fix the "missing scope (account)" error:**

1. In your Appwrite project, go to **Auth** → **Settings**
2. **Enable Phone Authentication** by toggling the switch
3. Configure your SMS provider:
   - **For testing**: Use "Appwrite SMS" (free tier, limited)
   - **For production**: Set up Twilio, MessageBird, or other providers
4. Set up phone number format (e.g., +1234567890)
5. **Save the settings**

## 3. Configure Authentication Settings

1. Go to **Auth** → **Settings**
2. Make sure these settings are enabled:
   - ✅ Phone Authentication
   - ✅ Phone verification
   - ✅ Phone session creation
3. Set appropriate session duration (e.g., 30 days)

## 4. Update Configuration

Edit `appwrite.config.js` and replace the placeholder values with your actual Appwrite project details:

```javascript
export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1', // Keep this as is
  projectId: 'your-actual-project-id', // Replace with your Project ID
  databaseId: 'your-database-id', // Optional - only if using databases
  collectionId: {
    notes: 'your-notes-collection-id', // Optional - only if using databases
  },
  bundleId: 'com.yourcompany.yourapp', // Your app bundle ID
};
```

## 5. Test the Implementation

1. Run your app: `npm start`
2. Navigate to the phone login screen
3. Enter a phone number and test the OTP functionality

## 6. Troubleshooting

### "User (role: guests) missing scope (account)" Error

This error occurs when phone authentication is not properly enabled. To fix:

1. **Go to Auth → Settings** in your Appwrite console
2. **Enable Phone Authentication** (toggle switch)
3. **Configure SMS Provider**:
   - For testing: Use "Appwrite SMS"
   - For production: Set up Twilio/MessageBird
4. **Save settings**
5. **Wait 1-2 minutes** for changes to propagate

### Common Issues:

1. **"Invalid phone number"**: Make sure your phone number includes the country code
2. **"OTP not received"**: Check your SMS provider configuration
3. **"Session expired"**: OTP sessions have a time limit, try sending a new one
4. **"Missing scope"**: Phone authentication not enabled in project settings

### Debug Steps:

1. Check the browser console for error messages
2. Verify your Appwrite configuration in `appwrite.config.js`
3. Ensure phone authentication is enabled in Appwrite console
4. Check your SMS provider settings in Appwrite console

## 7. Features Implemented

- ✅ Phone number input with country selection
- ✅ OTP sending via Appwrite
- ✅ OTP verification
- ✅ Session management
- ✅ Error handling

## 8. Next Steps

After successful setup, you can:
- Customize the UI/UX
- Add additional authentication methods
- Implement user profile management
- Add database integration for user data

## Support

For Appwrite-specific issues, refer to the [Appwrite Documentation](https://appwrite.io/docs). 