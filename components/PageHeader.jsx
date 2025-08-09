import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon, 
  iconName = 'arrow-back',
  onIconPress,
  actionButton,
  gradientColors = ['#1e40af', '#1e3a8a', '#1e293b'],
  showBackButton = true 
}) => {
  const router = useRouter();

  const handleIconPress = () => {
    console.log('Back button pressed');
    console.log('Router state:', { canGoBack: router.canGoBack() });
    
    // Add visual feedback
    Toast.show({
      type: 'info',
      text1: 'Navigation',
      text2: router.canGoBack() ? 'Going back...' : 'Navigating to Dashboard...',
      position: 'top',
    });
    
    if (onIconPress) {
      console.log('Using custom onIconPress');
      onIconPress();
    } else if (showBackButton) {
      console.log('Using default back navigation');
      try {
        // Try to go back first
        if (router.canGoBack()) {
          console.log('Can go back, calling router.back()');
          router.back();
        } else {
          console.log('Cannot go back, navigating to Dashboard');
          // If can't go back, navigate to dashboard
          router.push("/Dashboard");
        }
      } catch (error) {
        console.log('Navigation error:', error);
        // Fallback to dashboard
        router.push("/Dashboard");
      }
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleIconPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={iconName} size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {icon && (
              <View style={styles.headerIconContainer}>
                <Ionicons name={icon} size={24} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.titleAndActionContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
          {actionButton && (
            <TouchableOpacity 
              style={styles.inlineActionButton} 
              onPress={actionButton.onPress}
            >
              <Ionicons name={actionButton.icon} size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingRight: 24,
  },
  headerContent: {
    flexDirection: 'column',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    
    borderRadius: 12,
    // marginRight: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleAndActionContainer: {
    // display: 'flex',
    flex: 1,
    marginLeft: 16,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '400',
  },
  inlineActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginLeft: 16,
  },
});

export default PageHeader; 