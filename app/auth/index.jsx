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
import Toast from 'react-native-toast-message';
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
  const router = useRouter();
  const { login, register, currentUser } = useAuth();
  
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
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

    try {
      if (isRegister) {
        await register(email, password, username);
        Toast.show({
          type: 'success',
          text1: 'Registration Successful!',
          text2: 'Please login with your credentials.',
          position: 'top',
          visibilityTime: 3000,
        });
        setIsRegister(false);
      } else {
        await login(email, password);
        Toast.show({
          type: 'success',
          text1: 'Login Successful!',
          text2: 'Welcome to Police Department Management System.',
          position: 'top',
          visibilityTime: 2000,
        });
        router.replace("/Dashboard");
      }
      setError("");
    } catch (err) {
      setError(err?.message || "Authentication failed.");
      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: err?.message || "Please check your credentials and try again.",
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      router.replace("/Dashboard");
    }
  }, [currentUser, router]);

  return (
    <LinearGradient
      colors={['#1e40af', '#1e3a8a', '#1e293b']}
      style={styles.container}
    >
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
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
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
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeButton}
                >
                  <Icon name={showConfirm ? "eye-off" : "eye"} size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}

            {error !== "" && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
              <LinearGradient
                colors={['#1e40af', '#1e3a8a']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isRegister ? "Create Account" : "Sign In"}
                </Text>
                <Icon 
                  name={isRegister ? "person-add" : "log-in"} 
                  size={20} 
                  color="#fff" 
                  style={styles.buttonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>

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
});
