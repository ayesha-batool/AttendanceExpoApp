import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const checkNetworkStatus = async () => {
    try {
      setIsChecking(true);
      const state = await Network.getNetworkStateAsync();
      const wasOnline = isOnline;
      setIsOnline(state.isConnected);
      
      // Animate the status change
      if (wasOnline !== state.isConnected) {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error checking network status:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkNetworkStatus();
    
    // Check network status every 10 seconds
    const interval = setInterval(checkNetworkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={isChecking ? "sync" : "cloud-offline"} 
          size={16} 
          color="#fff" 
          style={isChecking ? styles.spinning : null}
        />
        <Text style={styles.text}>
          {isChecking ? 'Checking connection...' : 'You\'re offline'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});

export default OfflineStatus;
