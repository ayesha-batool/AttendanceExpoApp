import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const UserStorageTest = () => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { 
    currentUser, 
    checkVerificationStatus, 
    testVerificationSystem,
    sendVerificationEmail 
  } = useAuth();

  const loadVerificationStatus = async () => {
    setLoading(true);
    try {
      const status = await checkVerificationStatus();
      setVerificationStatus(status);
      console.log('📱 Verification status loaded:', status);
    } catch (error) {
      console.error('❌ Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const testVerification = async () => {
    setLoading(true);
    try {
      const result = await testVerificationSystem();
      Alert.alert(
        result.success ? 'Test Successful' : 'Test Failed',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test verification system');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      Alert.alert('Success', 'Verification email sent successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const debugAuthentication = async () => {
    setLoading(true);
    try {
      console.log('🔍 Debugging authentication...');
      console.log('👤 Current user:', currentUser);
      
      if (currentUser) {
        console.log('✅ User is logged in');
        console.log('📧 Email:', currentUser.email);
        console.log('🆔 User ID:', currentUser.$id);
        console.log('📧 Email verified:', currentUser.emailVerification);
        
        Alert.alert('Debug Info', 
          `User: ${currentUser.email}\n` +
          `ID: ${currentUser.$id}\n` +
          `Verified: ${currentUser.emailVerification ? 'Yes' : 'No'}`
        );
      } else {
        console.log('❌ No user logged in');
        Alert.alert('Debug Info', 'No user currently logged in');
      }
    } catch (error) {
      console.error('❌ Debug error:', error);
      Alert.alert('Error', 'Failed to debug authentication');
    } finally {
      setLoading(false);
    }
  };

     const testDeepLink = () => {
     const testUrl = 'shelfieclean://verify?userId=test123&secret=test456';
    console.log('🧪 Testing deep link:', testUrl);
    Alert.alert(
      'Test Deep Link',
      `Testing URL: ${testUrl}\n\nThis should open the verification page with test parameters.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test', 
          onPress: () => {
            // Simulate the deep link handling
            console.log('🧪 Deep link test initiated');
            const urlObj = new URL(testUrl);
            const userId = urlObj.searchParams.get('userId');
            const secret = urlObj.searchParams.get('secret');
            console.log('🆔 Test userId:', userId);
            console.log('🔑 Test secret:', secret);
            Alert.alert('Deep Link Test', `Parameters extracted:\nuserId: ${userId}\nsecret: ${secret}\n\nCheck the console for logs.`);
          }
        }
      ]
    );
  };

  const testConfiguration = () => {
    console.log('🔧 Testing Appwrite configuration...');
    
         const config = {
       endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
       projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
       verificationUrl: process.env.EXPO_PUBLIC_VERIFICATION_URL || 'http://localhost:8081/verify',
       databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID
     };
    
    console.log('🔧 Configuration:', config);
    
    const missingVars = [];
    if (!config.endpoint) missingVars.push('EXPO_PUBLIC_APPWRITE_ENDPOINT');
    if (!config.projectId) missingVars.push('EXPO_PUBLIC_APPWRITE_PROJECT_ID');
    
    if (missingVars.length > 0) {
      Alert.alert(
        'Configuration Error',
        `Missing environment variables:\n${missingVars.join('\n')}\n\nPlease check your .env file.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Configuration OK',
        `All required environment variables are set.\n\nEndpoint: ${config.endpoint}\nProject ID: ${config.projectId}\nVerification URL: ${config.verificationUrl || 'shelfieclean://verify'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const testVerificationFlow = () => {
    console.log('🧪 Testing complete verification flow...');
    
    Alert.alert(
      'Test Verification Flow',
      'This will simulate the complete verification process:\n\n1. Send verification email\n2. Extract userId and secret from email link\n3. Complete verification\n\nWould you like to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Flow', 
          onPress: async () => {
            try {
              console.log('🔄 Step 1: Sending verification email...');
              const sendResult = await sendVerificationEmail();
              
              if (sendResult.success) {
                console.log('✅ Step 1: Verification email sent');
                Alert.alert(
                  'Step 1 Complete',
                  'Verification email sent successfully!\n\nNext: Check your email and click the verification link to test the complete flow.',
                  [{ text: 'OK' }]
                );
              } else {
                console.log('❌ Step 1: Failed to send verification email');
                Alert.alert('Step 1 Failed', sendResult.message, [{ text: 'OK' }]);
              }
            } catch (error) {
              console.error('❌ Test flow error:', error);
              Alert.alert('Test Failed', error.message, [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#1e3a8a']}
        style={styles.header}
      >
        <Icon name="shield-checkmark" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Appwrite Verification Test</Text>
        <Text style={styles.headerSubtitle}>Email Verification System</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Current User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          {currentUser ? (
            <View style={styles.userCard}>
              <Icon name="person-circle" size={24} color="#1e40af" />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUser.name || 'No Name'}</Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
                <Text style={styles.userId}>ID: {currentUser.$id}</Text>
                <Text style={styles.verificationStatus}>
                  Email Verified: {currentUser.emailVerification ? '✅ Yes' : '❌ No'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noUserCard}>
              <Icon name="person-outline" size={24} color="#64748b" />
              <Text style={styles.noUserText}>No user currently logged in</Text>
            </View>
          )}
        </View>

        {/* Verification Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification Status</Text>
            <TouchableOpacity onPress={loadVerificationStatus} style={styles.refreshButton}>
              <Icon name="refresh" size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingCard}>
              <Icon name="refresh" size={24} color="#1e40af" style={styles.spinning} />
              <Text style={styles.loadingText}>Loading verification status...</Text>
            </View>
          ) : verificationStatus ? (
            <View style={styles.statusCard}>
              <Icon 
                name={verificationStatus.success ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={verificationStatus.success ? "#22c55e" : "#ef4444"} 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {verificationStatus.success ? 'System Working' : 'System Error'}
                </Text>
                <Text style={styles.statusMessage}>{verificationStatus.message}</Text>
                {verificationStatus.isVerified !== undefined && (
                  <Text style={styles.verificationStatus}>
                    Email Verified: {verificationStatus.isVerified ? '✅ Yes' : '❌ No'}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noStatusCard}>
              <Icon name="information-circle-outline" size={24} color="#64748b" />
              <Text style={styles.noStatusText}>No verification status available</Text>
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity onPress={loadVerificationStatus} style={styles.actionButton}>
            <LinearGradient
              colors={['#1e40af', '#1e3a8a']}
              style={styles.actionButtonGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Refresh Status</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={testVerification} style={styles.actionButton}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.actionButtonGradient}
            >
              <Icon name="flask" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Test Verification</Text>
            </LinearGradient>
          </TouchableOpacity>

          {currentUser && !currentUser.emailVerification && (
            <TouchableOpacity onPress={resendVerification} style={styles.actionButton}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionButtonGradient}
              >
                <Icon name="mail" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Resend Verification</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={debugAuthentication} style={styles.actionButton}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionButtonGradient}
            >
              <Icon name="bug" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Debug Authentication</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={testDeepLink} style={styles.actionButton}>
            <LinearGradient
              colors={['#4f46e5', '#4338ca']}
              style={styles.actionButtonGradient}
            >
              <Icon name="link" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Test Deep Link</Text>
            </LinearGradient>
          </TouchableOpacity>

                     <TouchableOpacity onPress={testConfiguration} style={styles.actionButton}>
             <LinearGradient
               colors={['#059669', '#047857']}
               style={styles.actionButtonGradient}
             >
               <Icon name="cog" size={20} color="#fff" />
               <Text style={styles.actionButtonText}>Test Configuration</Text>
             </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity onPress={testVerificationFlow} style={styles.actionButton}>
             <LinearGradient
               colors={['#dc2626', '#b91c1c']}
               style={styles.actionButtonGradient}
             >
               <Icon name="play-circle" size={20} color="#fff" />
               <Text style={styles.actionButtonText}>Test Complete Flow</Text>
             </LinearGradient>
           </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • Users register with email and password
            </Text>
            <Text style={styles.infoText}>
              • Appwrite automatically sends verification email
            </Text>
            <Text style={styles.infoText}>
              • User clicks verification link in email
            </Text>
            <Text style={styles.infoText}>
              • Verification page processes userId and secret
            </Text>
            <Text style={styles.infoText}>
              • Account is verified and user can access full features
            </Text>
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Information</Text>
          <View style={styles.debugCard}>
            <Text style={styles.debugText}>
              Current User: {currentUser ? 'Logged In' : 'Not Logged In'}
            </Text>
            <Text style={styles.debugText}>
              User ID: {currentUser?.$id || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Email: {currentUser?.email || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Email Verified: {currentUser?.emailVerification ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Verification Status: {verificationStatus?.success ? 'Working' : 'Error'}
            </Text>
                         <Text style={styles.debugText}>
               Verification URL: {process.env.EXPO_PUBLIC_VERIFICATION_URL || 'http://localhost:8081/verify'}
             </Text>
            <Text style={styles.debugText}>
              App Scheme: shelfieclean
            </Text>
            <Text style={styles.debugText}>
              Project ID: {process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'Not Set'}
            </Text>
          </View>
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
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  userId: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  verificationStatus: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  noUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  noUserText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusMessage: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  noStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  noStatusText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 12,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  debugCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  debugText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default UserStorageTest;

