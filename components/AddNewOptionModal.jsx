import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { hybridDataService } from '../services/hybridDataService';
const AddNewOptionModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  fieldName, 
  fieldLabel,
  existingOptions = [] 
}) => {
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [customToast, setCustomToast] = useState(null);

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!newOption.trim()) {
      showCustomToast('error', 'Error', 'Please enter a valid option name');
      return;
    }

    // Check if option already exists
    if (existingOptions && existingOptions.some(option => {
      const optionValue = typeof option === 'string' ? option : (option?.label || option?.value || '');
      return optionValue.toLowerCase() === newOption.toLowerCase();
    })) {
      showCustomToast('error', 'Error', 'This option already exists');
      return;
    }

    setLoading(true);
    try {
      const result = await hybridDataService.addOption(fieldName, newOption.trim());
      if (result) {
        // Call onSuccess to update parent component
        onSuccess(newOption.trim());
        
        // Clear the input field for next entry
        setNewOption('');
        
        // Don't close the modal - allow multiple additions
        // onClose();
        
        // Show success toast
        showCustomToast('success', 'Success', `${newOption.trim()} added successfully`);
      } else {
        showCustomToast('error', 'Error', result.message || 'Failed to add new option');
      }
    } catch (error) {
      console.error('Error adding new option:', error);
      showCustomToast('error', 'Error', 'Failed to add new option');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewOption('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#1d4ed8']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Add New {fieldLabel || 'Option'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>New {fieldLabel || 'Option'} Name</Text>
            <TextInput
              style={styles.textInput}
              value={newOption}
              onChangeText={setNewOption}
              placeholder={`Enter new ${(fieldLabel || 'option').toLowerCase()} name`}
              placeholderTextColor="#9ca3af"
              autoFocus={true}
              maxLength={50}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={loading || !newOption.trim()}
            >
              <LinearGradient 
                colors={loading || !newOption.trim() ? ['#9ca3af', '#6b7280'] : ['#3b82f6', '#2563eb']} 
                style={styles.submitGradient}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Option'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {customToast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, { backgroundColor: customToast.type === 'success' ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.toastText}>{customToast.title}</Text>
            <Text style={styles.toastMessage}>{customToast.message}</Text>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    minHeight: 300,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 10 },
    boxShadowOpacity: 0.25,
    boxShadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalBody: {
    padding: 24,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    boxShadowColor: '#3b82f6',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 4,
  },
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    padding: 15,
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  toastMessage: {
    fontSize: 14,
  },
});

export default AddNewOptionModal;
