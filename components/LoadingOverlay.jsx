import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

const LoadingOverlay = ({ visible, message = 'Loading...', type = 'default' }) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'save':
        return 'save-outline';
      case 'delete':
        return 'trash-outline';
      case 'sync':
        return 'sync-outline';
      case 'upload':
        return 'cloud-upload-outline';
      case 'download':
        return 'cloud-download-outline';
      default:
        return 'refresh-outline';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'save':
        return '#10b981';
      case 'delete':
        return '#ef4444';
      case 'sync':
        return '#3b82f6';
      case 'upload':
        return '#8b5cf6';
      case 'download':
        return '#f59e0b';
      default:
        return '#1e40af';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getIcon()} 
              size={32} 
              color={getColor()} 
            />
          </View>
          <ActivityIndicator 
            size="large" 
            color={getColor()} 
            style={styles.spinner}
          />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>
            Please wait while we process your request...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 10 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default LoadingOverlay;


