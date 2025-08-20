# Email Verification System Guide

This guide explains the complete email verification system implemented in the Police Department Management System.

## Overview

The email verification system ensures that users can only register with valid email addresses by requiring them to verify their email before completing registration. The system includes:

- **Email verification code generation and sending**
- **Verification code validation**
- **Local storage management for users**
- **Resend verification code functionality**
- **User existence checking**

## How It Works

### 1. Registration Flow

1. **User fills registration form** with email, password, username
2. **System checks** if user already exists in local storage
3. **Verification code is generated** (6-digit random number)
4. **Code is stored** in local storage with expiration time (15 minutes)
5. **Verification modal appears** asking user to enter the code
6. **User enters code** in the verification modal
7. **Code is validated** against stored code
8. **If valid**: User account is created in Appwrite and stored locally
9. **If invalid**: Error message shown, user can retry or resend code

### 2. Login Flow

1. **User enters email and password**
2. **System checks** if user exists in local storage first
3. **If found**: Attempts login with Appwrite
4. **If successful**: Updates user data in local storage
5. **If not found**: Shows error message

### 3. Local Storage Management

- **Users are stored** with key format: `user_{userId}`
- **Verification codes** are stored with key format: `verification_{email}`
- **Data persists** across app restarts
- **Automatic cleanup** of expired verification codes

## Components

### 1. VerificationModal (`components/VerificationModal.jsx`)

A beautiful modal component that handles:
- 6-digit verification code input
- Auto-focus and navigation between input fields
- Resend code functionality with 60-second timer
- Loading states and error handling
- Modern UI with gradients and animations

### 2. VerificationService (`services/verificationService.js`)

Core service that handles:
- Verification code generation and storage
- Email sending (simulated for now)
- Code validation and expiration checking
- Local storage user management
- Attempt tracking and rate limiting

### 3. Updated AuthContext (`context/AuthContext.js`)

Enhanced authentication context with:
- Email verification integration
- Local storage user checking
- Pending registration management
- Verification status tracking

### 4. Updated Auth Screen (`app/auth/index.jsx`)

Enhanced authentication screen with:
- Integration with verification modal
- Loading states and error handling
- Success/error toast notifications
- Form validation and user feedback

## Key Features

### 🔐 Security Features

- **6-digit verification codes** for email verification
- **15-minute expiration** for verification codes
- **5-attempt limit** before requiring new code
- **Rate limiting** on resend functionality
- **Local storage validation** before Appwrite operations

### 📱 User Experience

- **Beautiful verification modal** with modern design
- **Auto-focus** on verification code inputs
- **Real-time validation** and error feedback
- **Loading states** and progress indicators
- **Toast notifications** for success/error messages
- **Resend functionality** with countdown timer

### 💾 Data Management

- **Local storage integration** for offline capability
- **User data persistence** across app sessions
- **Automatic cleanup** of expired data
- **Duplicate prevention** for email addresses
- **Data synchronization** between local storage and Appwrite

## Usage Examples

### Basic Registration with Verification

```javascript
import { useAuth } from '@/context/AuthContext';

const { register, verifyAndCompleteRegistration } = useAuth();

// Start registration
const handleRegister = async () => {
  try {
    const result = await register(email, password, username);
    if (result.requiresVerification) {
      // Show verification modal
      setShowVerificationModal(true);
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Complete verification
const handleVerification = async (code) => {
  try {
    const result = await verifyAndCompleteRegistration(code);
    if (result.success) {
      // Registration complete, navigate to dashboard
      router.replace('/Dashboard');
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }
};
```

### Check User in Local Storage

```javascript
import { useAuth } from '@/context/AuthContext';

const { checkUserInLocalStorage, getAllLocalUsers } = useAuth();

// Check if specific user exists
const checkUser = async (email) => {
  const result = await checkUserInLocalStorage(email);
  if (result.exists) {
    console.log('User found:', result.user);
  }
};

// Get all local users
const getUsers = async () => {
  const users = await getAllLocalUsers();
  console.log('All local users:', users);
};
```

## Testing the System

### 1. Test Page

Navigate to `/test-verification` to access the test page that shows:
- Current logged-in user
- All users in local storage
- Actions to refresh and clear data
- System information

### 2. Manual Testing

1. **Register a new user** with email verification
2. **Check console logs** for verification code (in development)
3. **Enter the verification code** in the modal
4. **Verify user is stored** in local storage
5. **Test login** with the verified user
6. **Test duplicate registration** prevention

### 3. Console Logs

The system provides detailed console logs:
- `📧 Sending verification email to: user@example.com`
- `🔑 Verification code: 123456`
- `✅ Verification code stored for: user@example.com`
- `🔍 Verifying code for: user@example.com`
- `✅ User stored in local storage: user@example.com`

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:
```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### Verification Settings

You can modify these settings in `verificationService.js`:
- **Code expiration time**: 15 minutes (900,000 ms)
- **Max attempts**: 5 attempts per code
- **Resend timer**: 60 seconds
- **Code length**: 6 digits

## Email Integration

Currently, the system simulates email sending. To integrate with real email services:

### Option 1: Appwrite Email Service
```javascript
// In verificationService.js
const sendVerificationEmail = async (email, code) => {
  // Use Appwrite's built-in email service
  // Configure in Appwrite console
};
```

### Option 2: Third-party Email Services
```javascript
// Integrate with SendGrid, Mailgun, AWS SES, etc.
const sendVerificationEmail = async (email, code) => {
  // Send email via your preferred service
};
```

## Error Handling

The system handles various error scenarios:
- **Invalid verification codes**
- **Expired verification codes**
- **Too many attempts**
- **Network failures**
- **Storage errors**
- **Duplicate email addresses**

## Security Considerations

1. **Verification codes are temporary** and expire automatically
2. **Rate limiting** prevents abuse of resend functionality
3. **Local storage is encrypted** on most devices
4. **User data is validated** before storage
5. **Duplicate prevention** ensures data integrity

## Troubleshooting

### Common Issues

1. **Verification code not working**
   - Check if code has expired (15 minutes)
   - Verify code is exactly 6 digits
   - Check console for error messages

2. **User not found in local storage**
   - Ensure user completed verification process
   - Check if local storage was cleared
   - Verify user data format

3. **Registration fails**
   - Check if email already exists
   - Verify network connectivity
   - Check Appwrite configuration

### Debug Commands

```javascript
// Clear all verification data
await clearVerificationData();

// Get all local users
const users = await getAllLocalUsers();

// Check verification status
const status = await getVerificationStatus(email);
```

## Future Enhancements

1. **Real email integration** with SMTP or email services
2. **SMS verification** as alternative to email
3. **Two-factor authentication** (2FA)
4. **Biometric authentication** support
5. **Social login** integration
6. **Password reset** functionality
7. **Account recovery** options

## Support

For issues or questions about the email verification system:
1. Check the console logs for detailed error messages
2. Verify your Appwrite configuration
3. Test with the provided test page
4. Review the error handling section above

---

This verification system provides a robust, secure, and user-friendly way to ensure email validity during user registration while maintaining excellent user experience and data integrity.

