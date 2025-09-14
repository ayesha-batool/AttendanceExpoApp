import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';


const Index = () => {
  const router = useRouter();
  const {  isAuthenticated, currentUser } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      // Get device ID from storage
      const deviceId = await AsyncStorage.getItem('deviceId');
      setDeviceInfo({ deviceId });
      setLoading(false);
    } catch (error) {
      console.error('Error getting device info:', error);
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      
      const hasLoggedIn = await AsyncStorage.getItem('hasLoggedInOnce');
  console.log('hasLoggedIn', hasLoggedIn);
      if (hasLoggedIn) {
        // User has logged in once and is authenticated, go directly to Dashboard
        router.push('/Dashboard');
      } else {
        // User hasn't logged in once or not authenticated, go to auth page
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      // Fallback to auth page if there's an error
      router.push('/auth');
    }
  };

  const handleDeviceEmployee = () => {
    router.push('/device-employee');
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#1e3a8a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="shield" size={60} color="#fff" />
          <Text style={styles.headerTitle}>Police Shield</Text>
          <Text style={styles.headerSubtitle}>Police Department Management System</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
      

        {/* Access Options */}
        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>Choose Your Access Method</Text>
          
          {/* Email-based Access */}
          <TouchableOpacity 
            style={styles.accessOption}
            onPress={handleEmailLogin}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <Ionicons name="mail" size={32} color="#fff" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Email Login</Text>
                  <Text style={styles.optionSubtitle}>Full dashboard access with email verification</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Device-based Access */}
          <TouchableOpacity 
            style={styles.accessOption}
            onPress={handleDeviceEmployee}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <Ionicons name="person" size={32} color="#fff" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Device Employee</Text>
                  <Text style={styles.optionSubtitle}>Register as employee using device ID</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          
          <View style={styles.instructionItem}>
            <Ionicons name="mail-outline" size={20} color="#3b82f6" />
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>Email Login</Text>
              <Text style={styles.instructionDesc}>
                Use your email and password to access the full dashboard with all features including employee management, cases, expenses, and attendance tracking.
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="phone-portrait-outline" size={20} color="#10b981" />
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>Device Employee</Text>
              <Text style={styles.instructionDesc}>
                Register yourself as an employee using your device ID. You can mark attendance, take photos, and share location without email verification.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Police Shield - Secure, Efficient, Professional
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748b',
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
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },

  accessCard: {
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
  accessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  accessOption: {
    marginBottom: 15,
  },
  optionGradient: {
    borderRadius: 12,
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  instructionsCard: {
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
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
    marginLeft: 15,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 5,
  },
  instructionDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default Index;
