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
  userInitials,
  onUserInitialsPress,
  gradientColors = ['#1e40af', '#1e3a8a', '#1e293b'],
  showBackButton = true 
}) => {
  const router = useRouter();

  const handleIconPress = () => {
    // Removed navigation toast as requested
    
    if (onIconPress) {
      try {
        onIconPress();
      } catch (error) {
        console.error('Error in onIconPress:', error);
      }
    } else if (showBackButton) {
      try {
        // Try to go back first
        if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
          router.back();
        } else if (router && typeof router.push === 'function') {
          // If can't go back, navigate to dashboard
          router.push("/Dashboard");
        }
      } catch (error) {
        console.error('Navigation error in PageHeader:', error);
        // Fallback - try to navigate to dashboard
        try {
          if (router && typeof router.push === 'function') {
            router.push("/Dashboard");
          }
        } catch (fallbackError) {
          console.error('Fallback navigation also failed:', fallbackError);
        }
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
            <Text style={styles.headerTitle}>{String(title || '')}</Text>
            {subtitle && <Text style={styles.headerSubtitle}>{String(subtitle)}</Text>}
          </View>
          </View>
          <View style={styles.rightSection}>
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
                {actionButton.label && (
                  <Text style={styles.actionButtonLabel}>{actionButton.label}</Text>
                )}
              </TouchableOpacity>
            )}
            {userInitials && (
              <TouchableOpacity 
                style={styles.userInitialsButton} 
                onPress={onUserInitialsPress}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.userInitialsText}>{userInitials}</Text>
              </TouchableOpacity>
            )}
          </View>
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
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '400',
  },
  inlineActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInitialsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 56,
    minHeight: 56,
  },
  userInitialsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default PageHeader; 