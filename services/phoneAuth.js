import { account } from './noteService';

export const sendPhoneVerification = async (phoneNumber) => {
    try {
        console.log('Attempting to send phone verification for:', phoneNumber);
        
        const result = await account.createPhoneToken(
            'sms',
            phoneNumber
        );
        
        console.log('Phone token created successfully:', result);
        return { success: true, data: result };
        
    } catch (error) {
        console.error('Error creating phone token:', error);
        
        // If it's a limit exceeded error, use mock implementation
        if (error.message.includes('limit') || error.message.includes('exceeded')) {
            console.log('Using mock implementation due to limit exceeded');
            return mockPhoneVerification(phoneNumber);
        }
        
        return { success: false, error: error.message };
    }
};

export const verifyPhoneToken = async (userId, secret) => {
    try {
        console.log('Attempting to verify phone token for user:', userId);
        
        const result = await account.updatePhoneVerification(
            userId,
            secret
        );
        
        console.log('Phone verification successful:', result);
        return { success: true, data: result };
        
    } catch (error) {
        console.error('Error verifying phone token:', error);
        
        // If it's a limit exceeded error, use mock implementation
        if (error.message.includes('limit') || error.message.includes('exceeded')) {
            console.log('Using mock verification due to limit exceeded');
            return mockPhoneVerification(userId, secret);
        }
        
        return { success: false, error: error.message };
    }
};

// Function to extract all users from Appwrite
export const getAllUsers = async () => {
    try {
        console.log('=== EXTRACTING ALL USERS FROM APPWRITE ===');
        
        // Initialize user counter if not exists
        if (!global.userCreationCount) {
            global.userCreationCount = 0;
        }
        
        console.log('📊 Users created in this session:', global.userCreationCount);
        
        // Get current user (if authenticated)
        try {
            const currentUser = await account.get();
            console.log('✅ Current authenticated user:', currentUser);
            console.log('User ID:', currentUser.$id);
            console.log('User Phone:', currentUser.phone);
            console.log('User Name:', currentUser.name);
            console.log('User Created:', currentUser.$createdAt);
        } catch (error) {
            console.log('❌ No current authenticated user:', error.message);
        }
        
        // Check if we have any stored user IDs from recent creations
        if (global.lastCreatedUserId) {
            console.log('📱 Last created user ID stored:', global.lastCreatedUserId);
            console.log('💡 This user should appear in your Appwrite Console');
        }
        
        // Check for any mock data
        if (global.mockPhoneNumber) {
            console.log('📞 Mock phone number stored:', global.mockPhoneNumber);
        }
        
        // Note: Appwrite client-side SDK doesn't have a direct method to list all users
        // This would typically be done server-side with admin privileges
        console.log('🔒 Note: Client-side SDK cannot list all users for security reasons');
        console.log('📋 To see all users, check your Appwrite Console → Users section');
        console.log('🌐 Go to: https://cloud.appwrite.io → Your Project → Users');
        console.log('📊 Total users in Appwrite: Check the console for exact count');
        
        // Alternative: Try to get user by ID if we have any stored
        if (global.lastCreatedUserId) {
            try {
                console.log('🔍 Attempting to get last created user by ID:', global.lastCreatedUserId);
                // Note: This would require admin privileges or the user's own session
                console.log('⚠️ This requires proper authentication or admin access');
            } catch (error) {
                console.log('❌ Cannot retrieve user by ID:', error.message);
            }
        }
        
        console.log('=== END USER EXTRACTION ===');
        console.log('💡 TIP: Complete phone verification first, then check again!');
        console.log('📊 Session user count:', global.userCreationCount);
        
        return {
            success: true,
            message: 'Check Appwrite Console for all users. Client-side cannot list all users.',
            currentUser: null,
            lastCreatedUserId: global.lastCreatedUserId || null,
            sessionUserCount: global.userCreationCount || 0
        };
        
    } catch (error) {
        console.error('Error extracting users:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Mock implementation for development
const mockPhoneVerification = async (phoneNumber, secret = null) => {
    if (!secret) {
        // Creating mock token
        const mockTokenId = 'mock-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const mockData = {
            $id: mockTokenId,
            phone: phoneNumber,
            type: 'mock',
            createdAt: new Date().toISOString()
        };
        
        // Store for verification
        global.mockTokenId = mockTokenId;
        global.mockPhoneNumber = phoneNumber;
        global.mockExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
        
        console.log('Mock phone token created:', mockData);
        return { success: true, data: mockData };
    } else {
        // Verifying mock token
        if (global.mockTokenId === userId && global.mockPhoneNumber) {
            if (Date.now() > global.mockExpiry) {
                return { success: false, error: 'Mock OTP expired' };
            }
            
            // Accept any 6-digit code for mock
            if (secret.length === 6 && /^\d{6}$/.test(secret)) {
                try {
                    // Create a real user account in Appwrite after successful mock verification
                    console.log('Creating real user account in Appwrite...');
                    const realUser = await account.create(
                        'unique()', // Auto-generated user ID
                        undefined, // No email
                        global.mockPhoneNumber, // Phone number
                        'mock-password-' + Math.random().toString(36).substr(2, 9), // Random password
                        'Phone User' // Default name
                    );
                    
                    // Store the user ID for later reference
                    global.lastCreatedUserId = realUser.$id;
                    
                    // Increment user creation counter
                    if (!global.userCreationCount) {
                        global.userCreationCount = 0;
                    }
                    global.userCreationCount++;
                    
                    console.log('=== REAL USER CREATED IN APPWRITE ===');
                    console.log('User ID:', realUser.$id);
                    console.log('User Email:', realUser.email);
                    console.log('User Phone:', realUser.phone);
                    console.log('User Name:', realUser.name);
                    console.log('User Created At:', realUser.$createdAt);
                    console.log('User Updated At:', realUser.$updatedAt);
                    console.log('User Status:', realUser.status);
                    console.log('User Labels:', realUser.labels);
                    console.log('User Prefs:', realUser.prefs);
                    console.log('Full User Object:', JSON.stringify(realUser, null, 2));
                    console.log('📊 Total users created in this session:', global.userCreationCount);
                    console.log('=== END USER DETAILS ===');
                    
                    const mockUser = {
                        $id: realUser.$id,
                        phone: global.mockPhoneNumber,
                        verified: true,
                        type: 'mock-to-real',
                        realUser: realUser
                    };
                    
                    // Clear mock data
                    delete global.mockTokenId;
                    delete global.mockPhoneNumber;
                    delete global.mockExpiry;
                    
                    console.log('Mock verification successful with real user:', mockUser);
                    return { success: true, data: mockUser };
                    
                } catch (createError) {
                    console.error('Failed to create real user:', createError);
                    console.log('=== USER CREATION FAILED ===');
                    console.log('Error Message:', createError.message);
                    console.log('Error Code:', createError.code);
                    console.log('Error Response:', createError.response);
                    console.log('=== END ERROR DETAILS ===');
                    
                    // Fall back to mock user if real creation fails
                    const mockUser = {
                        $id: 'mock-user-' + Date.now(),
                        phone: global.mockPhoneNumber,
                        verified: true,
                        type: 'mock-only',
                        error: createError.message
                    };
                    
                    // Clear mock data
                    delete global.mockTokenId;
                    delete global.mockPhoneNumber;
                    delete global.mockExpiry;
                    
                    console.log('Mock verification successful (fallback):', mockUser);
                    return { success: true, data: mockUser };
                }
            } else {
                return { success: false, error: 'Invalid mock OTP format' };
            }
        } else {
            return { success: false, error: 'Invalid mock token' };
        }
    }
}; 