import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Reusable Button Component
export const GradientButton = ({ 
  onPress, 
  title, 
  colors = ['#1e40af', '#1e3a8a'], 
  icon, 
  loading = false,
  disabled = false,
  style = {}
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[styles.button, style]}
    disabled={disabled || loading}
  >
    <LinearGradient
      colors={colors}
      style={styles.buttonGradient}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : icon ? (
        <Icon name={icon} size={20} color="#fff" />
      ) : null}
      <Text style={styles.buttonText}>
        {loading ? 'Loading...' : title}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Reusable Card Component
export const Card = ({ children, style = {} }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Reusable Status Card Component
export const StatusCard = ({ 
  type = 'info', 
  title, 
  message, 
  icon 
}) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
      case 'error':
        return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
      case 'warning':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
      default:
        return { bg: '#f1f5f9', border: '#64748b', text: '#374151' };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.statusCard, { 
      backgroundColor: colors.bg, 
      borderLeftColor: colors.border 
    }]}>
      {icon && <Icon name={icon} size={24} color={colors.border} />}
      <View style={styles.statusInfo}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.statusMessage, { color: colors.text }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

// Reusable Header Component
export const Header = ({ title, subtitle, icon = "shield-checkmark" }) => (
  <LinearGradient
    colors={['#1e40af', '#1e3a8a']}
    style={styles.header}
  >
    <Icon name={icon} size={60} color="#fff" />
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
  </LinearGradient>
);

// Reusable User Info Component
export const UserInfo = ({ user }) => (
  <Card style={styles.userCard}>
    <Icon name="person-circle" size={40} color="#1e40af" />
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{user?.name || 'User'}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      {user?.$id && <Text style={styles.userId}>ID: {user.$id}</Text>}
    </View>
  </Card>
);

// Reusable Alert Helper - Removed Alert.alert usage
export const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  // Alert functionality removed - use custom toast or navigation instead
  console.log(`${title}: ${message}`);
};

// Reusable Loading Component
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#1e40af" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    marginTop: 4,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userId: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});
