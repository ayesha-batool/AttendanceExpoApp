import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const VerifyPage = () => {
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const { completeVerification, checkVerificationStatus, getUser } = useAuth();

  // Get userId and secret from URL parameters
  const { userId, secret } = params;

  useEffect(() => {
    console.log('🔍 Verification page loaded');
    console.log('📱 All params:', params);
    console.log('🆔 userId:', userId);
    console.log('🔑 secret:', secret);
    
    if (userId && secret) {
      console.log('✅ Parameters found, starting verification...');
      handleVerification();
    } else {
      console.log('❌ Missing parameters');
      console.log('Expected: userId and secret');
      console.log('Received:', { userId, secret });
      setVerificationStatus('error');
      setErrorMessage('Invalid verification link. Missing required parameters. Please check your email and click the verification link again.');
    }
  }, [userId, secret]);

  const handleVerification = async () => {
    setVerifying(true);
    
    try {
      console.log('🔍 Processing verification with:', { userId, secret });
      
      const result = await completeVerification(userId, secret);
      
      if (result.success) {
        setVerificationStatus('success');
        console.log('✅ Email verification completed successfully');
        
        // Refresh user data to update verification status
        try {
          await getUser();
          console.log('✅ User data refreshed after verification');
        } catch (error) {
          console.error('❌ Error refreshing user data:', error);
        }
        
        // Show success message and redirect after a delay
        setTimeout(() => {
          router.replace('/Dashboard');
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      setVerificationStatus('error');
      setErrorMessage(error.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      // This would typically redirect to a page where user can request new verification
      Alert.alert(
        'Resend Verification',
        'Please go back to the app and use the "Resend Verification" option.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('❌ Error resending verification:', error);
    }
  };

  const handleGoToApp = () => {
    router.replace('/auth');
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.title}>Verifying Your Email</Text>
            <Text style={styles.subtitle}>Please wait while we verify your email address...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.content}>
            <View style={styles.successIcon}>
              <Icon name="checkmark-circle" size={80} color="#22c55e" />
            </View>
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.subtitle}>
              Your email has been successfully verified. You will be redirected to the app shortly.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleGoToApp}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Go to App</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.content}>
            <View style={styles.errorIcon}>
              <Icon name="close-circle" size={80} color="#ef4444" />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.subtitle}>
              {errorMessage || 'Something went wrong. Please try again.'}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleResendVerification}>
                <LinearGradient
                  colors={['#1e40af', '#1e3a8a']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Resend Verification</Text>
                  <Icon name="refresh" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGoToApp}>
                <Text style={styles.secondaryButtonText}>Go to App</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={['#1e40af', '#1e3a8a', '#1e293b']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Icon name="shield-checkmark" size={60} color="#fff" />
        <Text style={styles.appTitle}>Police Department</Text>
        <Text style={styles.appSubtitle}>Email Verification</Text>
      </View>

      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {verificationStatus === 'pending' 
            ? 'Verifying your email address...' 
            : verificationStatus === 'success'
            ? 'Redirecting to app...'
            : 'Please try again or contact support'
          }
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1e40af',
  },
  secondaryButtonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default VerifyPage;
