# Offline Authentication Implementation Guide

## Overview

This implementation provides a complete offline authentication system that allows users to:
- Sign up when offline (credentials stored locally)
- Login without email verification when offline
- Access the dashboard with offline authentication
- Sync data when connection is restored

## How It Works

### 1. Offline Signup Flow
When a user tries to sign up while offline:
1. **Network Check**: System detects offline status
2. **Local Storage**: Credentials are stored in AsyncStorage with hashed passwords
3. **Immediate Access**: User can immediately login without verification
4. **Pending Sync**: Signup is marked for sync when online

### 2. Offline Login Flow
When a user tries to login while offline:
1. **Local Check**: System checks local storage for credentials
2. **Password Verification**: Uses bcryptjs to verify password
3. **Session Creation**: Creates local session (24-hour expiry)
4. **Dashboard Access**: User is taken directly to dashboard

### 3. Online/Offline Detection
- Uses `expo-network` to detect connectivity
- Automatically switches between online/offline modes
- Shows visual indicator when offline

## Key Components

### 1. OfflineAuthService (`services/offlineAuthService.js`)
Core service handling all offline authentication logic:

```javascript
// Store pending signup
await offlineAuthService.storePendingSignup({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe'
});

// Offline login
const session = await offlineAuthService.offlineLogin({
  email: 'user@example.com',
  password: 'password123'
});

// Check current offline user
const user = await offlineAuthService.getCurrentOfflineUser();
```

### 2. Updated AuthContext (`context/AuthContext.js`)
Enhanced authentication context with offline support:

```javascript
const { 
  login, 
  register, 
  currentUser, 
  isOffline, 
  isEmailVerified 
} = useAuth();
```

### 3. OfflineStatusBar (`components/OfflineStatusBar.jsx`)
Visual indicator showing offline status and authentication mode.

## Usage Examples

### Basic Offline Signup
```javascript
import { useAuth } from '../context/AuthContext';

const { register, isOffline } = useAuth();

const handleSignup = async () => {
  try {
    const result = await register(email, password, name);
    
    if (result.isOffline) {
      console.log('Offline signup successful - stored locally');
      // User can now login immediately
    } else {
      console.log('Online signup - verification email sent');
    }
  } catch (error) {
    console.error('Signup failed:', error);
  }
};
```

### Basic Offline Login
```javascript
const { login, isOffline } = useAuth();

const handleLogin = async () => {
  try {
    const result = await login(email, password);
    
    if (result.isOffline) {
      console.log('Offline login successful');
      // User taken to dashboard immediately
    } else {
      console.log('Online login successful');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Check Authentication Status
```javascript
const { currentUser, isOffline, isEmailVerified } = useAuth();

if (currentUser) {
  if (isOffline && currentUser.isOfflineUser) {
    console.log('User is authenticated offline');
  } else if (isEmailVerified) {
    console.log('User is authenticated online and verified');
  } else {
    console.log('User needs email verification');
  }
}
```

## Security Features

### 1. Password Hashing
- All passwords are hashed using a simple hash function with salt
- Secure comparison for login verification
- No plain text passwords stored
- Compatible with React Native without external dependencies

### 2. Session Management
- 24-hour session expiry for offline users
- Automatic session cleanup
- Secure session storage

### 3. Data Isolation
- Offline users marked with `isOfflineUser: true`
- Separate storage keys for offline data
- No interference with online authentication

## Storage Structure

### AsyncStorage Keys
```javascript
const STORAGE_KEYS = {
  OFFLINE_USERS: 'offline_users',           // Registered offline users
  OFFLINE_SESSIONS: 'offline_sessions',     // Active offline sessions
  PENDING_SIGNUPS: 'pending_signups',       // Signups waiting for sync
  CURRENT_USER: 'current_offline_user'      // Current offline user session
};
```

### Data Format
```javascript
// Offline User
{
  id: 'offline_1234567890_abc123',
  email: 'user@example.com',
  password: '$2b$10$hashedPassword...',
  fullName: 'John Doe',
  createdAt: '2024-01-01T00:00:00.000Z',
  isOfflineUser: true,
  verified: false
}

// Offline Session
{
  userId: 'offline_1234567890_abc123',
  user: { /* user object */ },
  createdAt: '2024-01-01T00:00:00.000Z',
  expiresAt: '2024-01-02T00:00:00.000Z'
}
```

## Testing

### Test Component
Use `OfflineAuthTest` component to test offline functionality:

```javascript
import OfflineAuthTest from '../components/OfflineAuthTest';

// Add to your screen
<OfflineAuthTest />
```

### Manual Testing Steps
1. **Enable Airplane Mode** or disconnect internet
2. **Sign up** with new credentials
3. **Login** with the same credentials
4. **Access dashboard** without verification
5. **Reconnect internet** and test sync

## Error Handling

### Common Error Scenarios
1. **Network Errors**: Automatically falls back to offline mode
2. **Invalid Credentials**: Clear error messages for offline login
3. **Storage Errors**: Graceful degradation with error logging
4. **Sync Failures**: Retry mechanism for pending signups

### Error Messages
```javascript
// Network unavailable
"Device is offline"

// Invalid credentials
"Invalid credentials"

// User not found
"User not found"

// Storage error
"Failed to store data locally"
```

## Integration with Existing Code

### 1. Auth Screens
The existing auth screens will automatically work with offline mode:
- No changes needed to login/signup forms
- Automatic detection of online/offline status
- Seamless user experience

### 2. Dashboard Access
- Offline users bypass email verification
- Direct access to dashboard functionality
- Visual indicators for offline mode

### 3. Data Sync
- Pending signups sync when online
- No data loss during offline periods
- Automatic conflict resolution

## Best Practices

### 1. User Experience
- Always show offline status indicator
- Provide clear feedback about authentication mode
- Allow seamless switching between online/offline

### 2. Security
- Never store plain text passwords
- Implement session expiry
- Clear sensitive data on logout

### 3. Performance
- Minimize storage operations
- Use efficient data structures
- Implement proper cleanup

## Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Check network connectivity
   - Verify environment variables
   - Ensure Appwrite configuration is correct

2. **Offline mode not working**
   - Check AsyncStorage permissions
   - Verify bcryptjs installation
   - Ensure proper error handling

3. **Sync issues**
   - Check network status
   - Verify pending signups exist
   - Review sync logic

### Debug Commands
```javascript
// Check offline data
const offlineUsers = await offlineAuthService.getOfflineUsers();
const pendingSignups = await offlineAuthService.getPendingSignups();

// Clear all offline data
await offlineAuthService.clearAllOfflineData();

// Check network status
const isOnline = await offlineAuthService.isOnline();
```

## Future Enhancements

1. **Data Encryption**: Encrypt sensitive offline data
2. **Biometric Auth**: Add fingerprint/face ID support
3. **Multi-device Sync**: Sync across multiple devices
4. **Conflict Resolution**: Handle data conflicts during sync
5. **Offline Analytics**: Track offline usage patterns

## Conclusion

This offline authentication system provides a robust, secure, and user-friendly solution for handling authentication when the device is offline. It seamlessly integrates with the existing online authentication system while providing a consistent user experience regardless of connectivity status.
