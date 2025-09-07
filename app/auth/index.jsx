import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';


const AuthScreen = () => {
  const router = useRouter();
  const { login, loading, isAuthenticated, currentUser, debugAuthState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customToast, setCustomToast] = useState(null);

  // Simple credential check function
  const isAuthorizedUser = (email, password) => {
    // Add your fixed credentials here
    const authorizedEmail = 'abdulhameedzootg@gmail.com';
    const authorizedPassword = '4811186@Police';
    
    return email === authorizedEmail && password === authorizedPassword;
  };

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 4000);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showCustomToast('error', 'Error', 'Please fill in email and password');
      return;
    }

    try {
      // Check if this is the authorized admin user
      if (isAuthorizedUser(email, password)) {
        console.log('🔐 Fixed credentials validated, attempting login...');
        const loginResult = await login(email, password);
        console.log('🔐 Login result:', loginResult);
        
        // Debug current auth state
        debugAuthState();
        
        await AsyncStorage.setItem('hasLoggedInOnce', 'true');
        showCustomToast('success', 'Login successful!');
        setTimeout(() => {
          router.replace('/Dashboard');
        }, 1500);
      } else {
        showCustomToast('error', 'Access Denied', 'Invalid admin credentials. Please check your email and password.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Clean error message
      let cleanErrorMessage = error.message || 'Authentication failed';
      if (cleanErrorMessage.includes('AppwriteException:')) {
        cleanErrorMessage = cleanErrorMessage.split('AppwriteException:')[1]?.trim() || cleanErrorMessage;
      }
      
      // Provide user-friendly error messages for common cases
      let userFriendlyMessage = 'Invalid admin credentials. Please check your username, email, and password.';
      
      if (cleanErrorMessage.toLowerCase().includes('invalid credentials') || 
          cleanErrorMessage.toLowerCase().includes('wrong password')) {
        userFriendlyMessage = 'Invalid admin credentials. Please check your email and password.';
      } else if (cleanErrorMessage.toLowerCase().includes('user not found') || 
                 cleanErrorMessage.toLowerCase().includes('email not found')) {
        userFriendlyMessage = 'Admin account not found. Please check your credentials.';
      } else if (cleanErrorMessage.toLowerCase().includes('email not verified')) {
        userFriendlyMessage = 'Please verify your email before logging in.';
      } else if (cleanErrorMessage.toLowerCase().includes('too many requests')) {
        userFriendlyMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (cleanErrorMessage.toLowerCase().includes('network') || cleanErrorMessage.toLowerCase().includes('connection')) {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        // Show the actual error message for unknown errors with proper formatting
        userFriendlyMessage = `Authentication failed. Please try again.\n\nError: ${cleanErrorMessage}`;
      }
      
      showCustomToast('error', 'Authentication Failed', userFriendlyMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>
      {/* Custom Toast */}
      {customToast && (
        <View style={[
          styles.customToastContainer,
          customToast.type === 'error' ? styles.errorToast : 
          customToast.type === 'success' ? styles.successToast :
          customToast.type === 'warning' ? styles.warningToast :
          styles.infoToast
        ]}>
          <Text style={styles.toastTitle} numberOfLines={2}>{customToast.title}</Text>
          <ScrollView 
            style={styles.toastScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <Text style={styles.toastMessage}>{customToast.message}</Text>
          </ScrollView>
        </View>
      )}

      <LinearGradient
        colors={['#1e40af', '#1e3a8a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="shield" size={60} color="#fff" />
          <Text style={styles.headerTitle}>Police Shield</Text>
          <Text style={styles.headerSubtitle}>
            Welcome Back
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            Admin Sign In
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

      

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter admin password"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.authButton}
            onPress={handleAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name="log-in" 
                  size={20} 
                  color="#fff" 
                />
              )}
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : 'Admin Login'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Debug button */}
        
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Admin Access</Text>
          <Text style={styles.infoText}>
            • This is an admin-only system{'\n'}
            • Use your admin email and password to access the dashboard{'\n'}
            • Contact system administrator for credentials
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customToastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    maxHeight: 200,
  },
  errorToast: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  successToast: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  warningToast: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoToast: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  toastMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  toastScrollView: {
    maxHeight: 120,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  authButton: {
    marginTop: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6b7280',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  clearText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1e40af',
  },
});

export default AuthScreen;
