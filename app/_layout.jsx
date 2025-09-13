import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { AppProvider } from "../context/AppContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import dataCache from "../services/dataCache";

// Fix font loading timeout issue - removed window code for mobile


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
      </AuthProvider>
    </AppProvider>
  );
};

const AuthenticatedLayout = () => {
  const authContext = useAuth();
  const router = useRouter();
  
  // Safe destructuring with fallbacks
  const currentUser = authContext?.currentUser || null;
  const loading = authContext?.loading || false;
  const isAuthenticated = authContext?.isAuthenticated || false;
  const isOfflineMode = authContext?.isOfflineMode || null;
  
  useEffect(() => {
    try {
    if (!loading) {
      // Log current auth state for debugging
      console.log('🔍 App Layout - Auth State:', {
        isAuthenticated,
        currentUser: currentUser ? {
          id: currentUser.$id,
          email: currentUser.email,
          isOffline: currentUser.isOffline,
          name: currentUser.name
        } : null,
          mode: isOfflineMode ? (typeof isOfflineMode === 'function' ? isOfflineMode() : 'unknown') : 'unknown'
        });
        
        // Initialize data cache from storage
        if (isAuthenticated) {
          console.log('📦 [CACHE] Initializing data cache...');
          dataCache.initializeFromStorage().catch(error => {
            console.warn('Failed to initialize data cache:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error in AuthenticatedLayout useEffect:', error);
    }
  }, [currentUser, loading, isAuthenticated, router, isOfflineMode]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="Dashboard" />
      <Stack.Screen name="Employee" />
      <Stack.Screen name="Cases" />
      <Stack.Screen name="ExpensesManagement" />
      <Stack.Screen name="Attendance" />

      
      {/* Device-based pages */}
      <Stack.Screen name="device-employee" />
      <Stack.Screen name="DataTransfer" />
    </Stack>
  );
};

export default RootLayout;
