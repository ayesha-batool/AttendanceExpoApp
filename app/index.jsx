import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const handleDashboardPress = () => {
    if (currentUser) {
      router.push("/Dashboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <View style={styles.container}>
      {/* Beautiful Hero Section */}
      <LinearGradient
        colors={['#1a237e', '#3949ab', '#5c6bc0']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <Icon name="shield-checkmark" size={80} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Police Department</Text>
          <Text style={styles.heroSubtitle}>Management System</Text>
          <Text style={styles.tagline}>
            Serving and Protecting Our Community
          </Text>
          
          {/* Dashboard Button */}
          <TouchableOpacity 
            style={styles.dashboardButton}
            onPress={handleDashboardPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.buttonGradient}
            >
              <Icon name="stats-chart" size={24} color="#1a237e" />
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  heroSection: {
    flex: 1,
    paddingTop: screenHeight * 0.1,
    paddingBottom: screenHeight * 0.1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
   
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 500,
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  heroTitle: {
    fontSize: screenWidth > 768 ? 36 : 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: screenWidth > 768 ? 24 : 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 40,
  },
  dashboardButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
