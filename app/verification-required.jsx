import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const VerificationRequired = () => {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link to complete your registration.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#1e3a8a']}
        style={styles.header}
      >
        <Icon name="mail-unread" size={60} color="#fff" />
        <Text style={styles.headerTitle}>Email Verification Required</Text>
        <Text style={styles.headerSubtitle}>Please verify your email to continue</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* User Info */}
        <View style={styles.userCard}>
          <Icon name="person-circle" size={40} color="#1e40af" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{currentUser?.email}</Text>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.statusCard}>
          <Icon name="warning" size={30} color="#f59e0b" />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Email Not Verified</Text>
            <Text style={styles.statusMessage}>
              Your email address needs to be verified before you can access the dashboard.
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Verify Your Email:</Text>
          <View style={styles.instructionStep}>
            <Icon name="mail" size={20} color="#1e40af" />
            <Text style={styles.instructionText}>
              Check your email inbox for a verification link
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <Icon name="link" size={20} color="#1e40af" />
            <Text style={styles.instructionText}>
              Click the verification link in the email
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <Icon name="checkmark-circle" size={20} color="#1e40af" />
            <Text style={styles.instructionText}>
              Return to the app and refresh to access dashboard
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={handleResendVerification} 
            style={styles.actionButton}
            disabled={loading}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.actionButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Icon name="mail" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.actionButtonGradient}
            >
              <Icon name="log-out" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Icon name="information-circle" size={20} color="#64748b" />
          <Text style={styles.helpText}>
            If you don't see the verification email, check your spam folder or try resending it.
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
  header: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  statusMessage: {
    fontSize: 14,
    color: '#a16207',
    marginTop: 4,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default VerificationRequired;
