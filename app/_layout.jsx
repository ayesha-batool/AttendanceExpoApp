import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { AppProvider } from "../context/AppContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Fix font loading timeout issue
if (typeof window !== 'undefined') {
  // Increase font loading timeout for web
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = (callback, delay, ...args) => {
    if (delay === 6000 && callback.toString().includes('fontfaceobserver')) {
      // Increase timeout for font loading
      return originalSetTimeout(callback, 10000, ...args);
    }
    return originalSetTimeout(callback, delay, ...args);
  };

  // Handle font loading errors gracefully
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('fontfaceobserver')) {
      console.warn('Font loading timeout handled gracefully');
      event.preventDefault();
    }
  });
}


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
  const { currentUser, loading, isAuthenticated, isOfflineMode } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
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
        mode: isOfflineMode ? isOfflineMode() : 'unknown'
      });
      
      // Don't automatically redirect - let users see the main index page
      // They can manually navigate to Dashboard when needed
    }
  }, [currentUser, loading, isAuthenticated, router, isOfflineMode]);

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

      
      {/* Device-based pages */}
      <Stack.Screen name="device-employee" />
      <Stack.Screen name="DataTransfer" />
    </Stack>
  );
};

export default RootLayout;
