import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FileUploader = ({ 
  label, 
  value, 
  onUpload, 
  onRemove, 
  placeholder = "Upload file",
  required = false,
  acceptTypes = ['*/*'],
  maxSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
          return;
        }
        
        onUpload(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleRemove = () => {
    console.log('🔍 FileUploader: handleRemove called');
    console.log('🔍 FileUploader: onRemove prop:', onRemove);
    console.log('🔍 FileUploader: current value:', value);
    console.log('🔍 FileUploader: onRemove type:', typeof onRemove);
    
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          console.log('🔍 FileUploader: Remove confirmed, calling onRemove');
          console.log('🔍 FileUploader: onRemove is function?', typeof onRemove === 'function');
          if (onRemove && typeof onRemove === 'function') {
            console.log('🔍 FileUploader: Calling onRemove function');
            onRemove();
            console.log('🔍 FileUploader: onRemove function called successfully');
          } else {
            console.error('🔍 FileUploader: onRemove is not a function:', onRemove);
            console.error('🔍 FileUploader: onRemove type:', typeof onRemove);
          }
        }}
      ]
    );
  };

  const isImageFile = (file) => {
    if (!file) return false;
    // Check if it has mimeType property
    if (file.mimeType) {
      return file.mimeType.startsWith('image/');
    }
    // If no mimeType, check if it has uri (for existing images)
    if (file.uri) {
      return true; // Assume it's an image if it has uri
    }
    return false;
  };

  const getFileIcon = (file) => {
    if (!file || !file.mimeType) return 'document-outline';
    
    const mimeType = file.mimeType.toLowerCase();
    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType.includes('pdf')) return 'document-text-outline';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document-outline';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'grid-outline';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'easel-outline';
    if (mimeType.includes('text')) return 'text-outline';
    
    return 'document-outline';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      {value ? (
        <View style={styles.fileContainer}>
          {isImageFile(value) ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: value.uri }} style={styles.fileImage} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={handleRemove}
                  onPressIn={() => console.log('🔍 FileUploader: Remove button pressed')}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.fileInfo}>
              <Ionicons name={getFileIcon(value)} size={24} color="#007AFF" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {value.name || 'File uploaded'}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(value.size)}
                </Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>{placeholder}</Text>
          <Text style={styles.uploadSubtext}>
            Tap to select a file
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadSubtext: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '400',
  },
  fileContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  fileImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default FileUploader;
