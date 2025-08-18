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
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  // useEffect(() => {
  //   // Initialize hybrid storage when app starts
  //   initHybridStorage();
  // }, []);
  
  useEffect(() => {
    if (!loading && !currentUser) {
      if (router.canGoBack()) {
        router.replace("/auth");
      }
    }

  }, [currentUser, loading, router]);
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
      {/* <Stack.Screen name="VehicleManagement" /> */}
      {/* <Stack.Screen name="Payroll" /> */}
      <Stack.Screen name="Attendance" />
      {/* <Stack.Screen name="Leave" /> */}
      {/* <Stack.Screen name="OverTime" /> */}
      {/* <Stack.Screen name="Holidays" /> */}
      {/* <Stack.Screen name="Fines" /> */}
      {/* <Stack.Screen name="Advance" /> */}
      {/* <Stack.Screen name="Remarks" /> */}
      {/* <Stack.Screen name="InactiveEmployee" /> */}
      {/* <Stack.Screen name="EmployeeDocuments" /> */}
     
      {/* <Stack.Screen name="phone" /> */}
    </Stack>
  );
};

export default RootLayout;
