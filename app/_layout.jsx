import * as Linking from 'expo-linking';
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { AppProvider } from "../context/AppContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { EmployeeProvider } from "../context/EmployeeContext";
// import { initHybridStorage } from "../services/appwrite";


const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: '#fff',
        zIndex: 999999,
        elevation: 999999,
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        boxShadowColor: '#000',
        boxShadowOffset: { width: 0, height: 4 },
        boxShadowOpacity: 0.3,
        boxShadowRadius: 8,
        minHeight: 60,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#F44336',
        backgroundColor: '#fff',
        zIndex: 999999,
        elevation: 999999,
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        boxShadowColor: '#000',
        boxShadowOffset: { width: 0, height: 4 },
        boxShadowOpacity: 0.3,
        boxShadowRadius: 8,
        minHeight: 60,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
};

const RootLayout = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <EmployeeProvider>
          <AuthenticatedLayout />
          <Toast 
            config={toastConfig} 
            position="top"
            topOffset={50}
            visibilityTime={4000}
            style={{
              zIndex: 999999,
              elevation: 999999,
            }}
          />
        </EmployeeProvider>
      </AuthProvider>
    </AppProvider>
  );
};

const AuthenticatedLayout = () => {
  const { currentUser, loading, isEmailVerified } = useAuth();
  const router = useRouter();
  
  // useEffect(() => {
  //   // Initialize hybrid storage when app starts
  //   initHybridStorage();
  // }, []);
  
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // No user logged in, redirect to auth
        if (router.canGoBack()) {
          router.replace("/auth");
        }
      } else if (!isEmailVerified && !currentUser?.isOfflineUser) {
        // User is logged in but email is not verified (and not offline), redirect to verification required
        router.replace("/verification-required");
      }
      // If user is logged in and email is verified (or offline), they can access the dashboard
    }

  }, [currentUser, loading, isEmailVerified, router]);

  // Handle deep linking for email verification
  useEffect(() => {
    const handleDeepLink = (event) => {
      console.log('🔗 Deep link received:', event.url);
      
      // Parse the URL to extract userId and secret
      const url = event.url;
      if (url.includes('localhost:8081://verify')) {
        console.log('📧 Verification deep link detected');
        
        // Extract query parameters
        const urlObj = new URL(url);
        const userId = urlObj.searchParams.get('userId');
        const secret = urlObj.searchParams.get('secret');
        
        console.log('🆔 userId:', userId);
        console.log('🔑 secret:', secret);
        
        if (userId && secret) {
          console.log('✅ Valid verification parameters, navigating to verify page');
          router.push(`/verify?userId=${userId}&secret=${secret}`);
        } else {
          console.log('❌ Missing verification parameters');
          router.push('/verify?error=missing_params');
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial deep link URL:', url);
        handleDeepLink({ url });
      }
    });

    // Listen for deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, [router]);
  return (
    <Stack
        screenOptions={{
          headerShown: false, // Hide the root header
          contentStyle: {
            paddingTop: 0,
            paddingHorizontal: 0,
            paddingBottom: 0,
          },
        }}
      >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="Dashboard" />
      <Stack.Screen name="Employee" />
      <Stack.Screen name="Cases" />
      <Stack.Screen name="ExpensesManagement" />
     
      <Stack.Screen name="Attendance" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="verification-required" />
      <Stack.Screen name="test-verification" />
    
    </Stack>
  );
};

export default RootLayout;
