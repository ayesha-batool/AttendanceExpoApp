import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

        if (file.size && file.size > maxSize) {
          return;
        }

        onUpload(file);
      }
    } catch (error) {
      // Failed to pick file
    }
  };
  const handleRemove = () => {

    if (onRemove && typeof onRemove === 'function') {
      onRemove(); // clear the file in parent
    }
    // handleUpload(); // open file picker immediately
  };
  
  

  const isImageFile = (file) => {
    if (!file) return false;
    if (file.mimeType) {
      return file.mimeType.startsWith('image/');
    }
    if (file.uri) {
      return true;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {value ? (
        isImageFile(value) ? (
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={handleUpload}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: value.uri }}
                style={styles.roundedImage}
              />
            </TouchableOpacity>
            <View style={styles.imageOverlay}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemove}
              >
                <Ionicons name="close-circle" size={28} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {value.name || 'File uploaded'}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )
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
    alignItems: 'center',
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
  roundedImage: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#007AFF',
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 9999,
  },
  removeButton: {
    padding: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});

export default FileUploader;
