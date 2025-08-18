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
    // Removed navigation toast as requested
    
    if (onIconPress) {
      onIconPress();
    } else if (showBackButton) {
      try {
        // Try to go back first
        if (router.canGoBack()) {
          router.back();
        } else {
          // If can't go back, navigate to dashboard
          router.push("/Dashboard");
        }
      } catch (error) {
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
          
            {icon && (
              <View style={styles.headerIconContainer}>
                <Ionicons name={icon} size={24} color="#fff" />
              </View>
            )}
          <View style={styles.titleAndActionContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
          </View>
          {actionButton && (
            <TouchableOpacity 
              style={styles.inlineActionButton} 
              onPress={() => {
                actionButton.onPress();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
    paddingTop:40,
    paddingBottom:20,
    paddingHorizontal:20,
  },
  headerContent: {
    flexDirection: 'column',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginRight: 8,
  },
  titleAndActionContainer: {
    // display: 'flex',
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginLeft: 16,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PageHeader; 