import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get('window');

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customToast, setCustomToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { 
    login, 
    register, 
    currentUser, 
    verificationSent,
    sendVerificationEmail,
    checkVerificationStatus
  } = useAuth();

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };
  
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
  };

  const handleAuth = async () => {
    if (!email || !password || (isRegister && (!confirmPassword || !username))) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isRegister) {
        console.log('🔐 Starting registration process...');
        const result = await register(email, password, username);
        
        if (result.success) {
          if (result.requiresVerification) {
            showCustomToast('success', 'Registration Successful!', 'Please check your email for verification link. You can now log in.');
            // Clear form after successful registration
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setUsername("");
            setIsRegister(false); // Switch to login mode
          } else {
            showCustomToast('success', 'Registration Successful!', 'Welcome to Police Department Management System.');
            router.replace("/Dashboard");
          }
        } else {
          throw new Error(result.message || 'Registration failed');
        }
      } else {
        console.log('🔐 Starting login process...');
        await login(email, password);
        
        // Check if user needs email verification
        const verificationStatus = await checkVerificationStatus();
        if (verificationStatus.success && !verificationStatus.isVerified) {
          showCustomToast('warning', 'Email Not Verified', 'Please verify your email address to access all features.');
        } else {
          showCustomToast('success', 'Login Successful!', 'Welcome to Police Department Management System.');
        }
        
        router.replace("/Dashboard");
      }
    } catch (err) {
      // Extract clean error message from Appwrite error format
      let cleanErrorMessage = err?.message || '';
      if (cleanErrorMessage.includes('AppwriteException:')) {
        cleanErrorMessage = cleanErrorMessage.split('AppwriteException:')[1]?.trim() || cleanErrorMessage;
      }
      console.log('❌ Authentication error:', cleanErrorMessage);
      
      // Use the user-friendly error message
      const errorMessage = err?.message || "Authentication failed. Please try again.";
      setError(errorMessage);
      showCustomToast('error', 'Authentication Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      console.log('📧 Attempting to resend verification email...');
      await sendVerificationEmail();
      showCustomToast('success', 'Verification Email Sent!', 'Please check your inbox for the verification link.');
    } catch (error) {
      console.log('❌ Failed to resend verification:', error.message);
      showCustomToast('error', 'Failed to Send', error.message || 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Check if user needs email verification
      if (currentUser.emailVerification === false) {
        // Redirect to verification required page instead of showing error
        router.replace("/verification-required");
      } else {
        router.replace("/Dashboard");
      }
    }
  }, [currentUser, router]);

  return (
    <LinearGradient
      colors={['#1e40af', '#1e3a8a', '#1e293b']}
      style={styles.container}
    >
      {/* Custom Toast */}
      {customToast && (
        <View style={[
          styles.customToastContainer,
          customToast.type === 'error' ? styles.errorToast : 
          customToast.type === 'success' ? styles.successToast :
          customToast.type === 'warning' ? styles.warningToast :
          styles.infoToast
        ]}>
          <Icon 
            name={
              customToast.type === 'error' ? 'close-circle' :
              customToast.type === 'success' ? 'checkmark-circle' :
              customToast.type === 'warning' ? 'warning' :
              'information-circle'
            }
            size={20}
            color="#fff"
          />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>{customToast.title}</Text>
            <Text style={styles.toastMessage}>{customToast.message}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Icon name="shield-checkmark" size={80} color="#fff" />
          </View>
          <Text style={styles.appTitle}>Police Department</Text>
          <Text style={styles.appSubtitle}>Management System</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
            style={styles.formBox}
          >
            <Text style={styles.formHeader}>
              {isRegister ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.formSubheader}>
              {isRegister ? "Join our team today" : "Sign in to continue"}
            </Text>

            {isRegister && (
              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  autoCapitalize="words"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {isRegister && (
              <View style={styles.inputContainer}>
                <Icon name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  style={styles.passwordInput}
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeButton}
                  disabled={isLoading}
                >
                  <Icon name={showConfirm ? "eye-off" : "eye"} size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}

            {error !== "" && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{String(error)}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
              onPress={handleAuth}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1e40af', '#1e3a8a']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Icon name="refresh" size={20} color="#fff" style={styles.spinning} />
                    <Text style={styles.buttonText}>
                      {isRegister ? "Creating Account..." : "Signing In..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {isRegister ? "Create Account" : "Sign In"}
                    </Text>
                    <Icon 
                      name={isRegister ? "person-add" : "log-in"} 
                      size={20} 
                      color="#fff" 
                      style={styles.buttonIcon}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Verification Button */}
            {verificationSent && (
              <TouchableOpacity 
                style={[styles.resendButton, isLoading && styles.resendButtonDisabled]} 
                onPress={handleResendVerification}
                disabled={isLoading}
              >
                <Text style={styles.resendButtonText}>
                  Resend Verification Email
                </Text>
                <Icon name="mail" size={16} color="#1e40af" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isRegister
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text style={styles.toggleLink}>
                  {isRegister ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Secure • Reliable • Professional</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    boxboxShadowColor: '#000',
    boxboxShadowOffset: { width: 0, height: 4 },
    boxboxShadowOpacity: 0.3,
    boxboxShadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  formBox: {
    borderRadius: 24,
    padding: 32,
    boxboxShadowColor: '#000',
    boxboxShadowOffset: { width: 0, height: 10 },
    boxboxShadowOpacity: 0.25,
    boxboxShadowRadius: 20,
    elevation: 10,
  },
  formHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubheader: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    boxboxShadowColor: '#000',
    boxboxShadowOffset: { width: 0, height: 2 },
    boxboxShadowOpacity: 0.05,
    boxboxShadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1e293b',
  },
  passwordInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  authButton: {
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    boxboxShadowColor: '#000',
    boxboxShadowOffset: { width: 0, height: 4 },
    boxboxShadowOpacity: 0.2,
    boxboxShadowRadius: 8,
    elevation: 6,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.2)',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  toggleContainer: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  toggleLink: {
    color: '#1e40af',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  customToastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    elevation: 9999,
  },
  errorToast: {
    backgroundColor: '#f44336',
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  warningToast: {
    backgroundColor: '#FFC107',
  },
  infoToast: {
    backgroundColor: '#2196F3',
  },
  toastContent: {
    marginLeft: 12,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
});
