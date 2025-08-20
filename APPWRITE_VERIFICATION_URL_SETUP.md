# 🔗 Appwrite Verification URL Setup Guide

## 🚨 **Current Issue**

The error you're seeing is:
```
Invalid `url` param: Invalid URI. Register your new client (verify) as a new platform on your project console dashboard
```

This happens because Appwrite requires a **valid HTTP/HTTPS URL** for email verification, not a custom deep link scheme like `shelfieclean://verify`.

## 🔧 **Solution Options**

### **Option 1: Use a Web URL (Recommended for Production)**

Set up a web page that can redirect to your app:

1. **Create a web page** (e.g., `https://yourdomain.com/verify`)
2. **Add redirect logic** to your app's deep link
3. **Set environment variable**:
   ```bash
   EXPO_PUBLIC_VERIFICATION_URL=https://yourdomain.com/verify
   ```

### **Option 2: Use Expo's Universal Links (Development)**

For development, you can use Expo's universal link service:

```bash
EXPO_PUBLIC_VERIFICATION_URL=https://expo.dev/--/to-expansion/redirect
```

### **Option 3: Use a Simple Web Service**

Create a simple web service that redirects to your app:

```html
<!-- verify.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Email Verification</title>
    <script>
        // Extract userId and secret from URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');
        
        // Redirect to your app
        if (userId && secret) {
            window.location.href = `shelfieclean://verify?userId=${userId}&secret=${secret}`;
        } else {
            document.body.innerHTML = '<h1>Invalid verification link</h1>';
        }
    </script>
</head>
<body>
    <h1>Verifying your email...</h1>
    <p>Redirecting to app...</p>
</body>
</html>
```

## 🛠 **Implementation Steps**

### **Step 1: Set Environment Variable**

Add this to your `.env` file:

```bash
# For development (using Expo's service)
EXPO_PUBLIC_VERIFICATION_URL=https://expo.dev/--/to-expansion/redirect

# For production (your own domain)
EXPO_PUBLIC_VERIFICATION_URL=https://yourdomain.com/verify
```

### **Step 2: Update Appwrite Configuration**

The verification URL is now properly configured in `services/appwriteEmailVerification.js`:

```javascript
const verificationUrl = process.env.EXPO_PUBLIC_VERIFICATION_URL || 'https://your-app-domain.com/verify';
const response = await accountService.createVerification(verificationUrl);
```

### **Step 3: Test the Configuration**

Use the "Test Configuration" button in the test page to verify your environment variables are set correctly.

## 🔄 **How It Works Now**

1. **User registers** → Appwrite sends verification email
2. **Email contains link** → `https://yourdomain.com/verify?userId=...&secret=...`
3. **Web page loads** → Extracts parameters and redirects to app
4. **App receives deep link** → `shelfieclean://verify?userId=...&secret=...`
5. **App processes verification** → Completes the verification

## 🧪 **Testing**

### **For Development:**
1. Set `EXPO_PUBLIC_VERIFICATION_URL=https://expo.dev/--/to-expansion/redirect`
2. Test the verification flow
3. Check if the redirect works properly

### **For Production:**
1. Deploy a verification web page
2. Set `EXPO_PUBLIC_VERIFICATION_URL=https://yourdomain.com/verify`
3. Test the complete flow

## 📱 **Alternative: Direct Deep Link (Not Recommended)**

If you want to use direct deep links, you'll need to:

1. **Register your app** as a platform in Appwrite console
2. **Configure the deep link scheme** in Appwrite settings
3. **Use the registered platform URL**

However, this is more complex and not recommended for most use cases.

## 🎯 **Recommended Approach**

For your current setup, I recommend:

1. **Use Expo's universal link service** for development
2. **Set up a simple web page** for production
3. **Test thoroughly** before deploying

This approach is simpler, more reliable, and follows Appwrite's requirements.
