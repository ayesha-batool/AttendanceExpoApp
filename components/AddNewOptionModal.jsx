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
import Toast from 'react-native-toast-message';
import CustomOptionsService from '../services/customOptionsService';

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

  const handleSubmit = async () => {
    if (!newOption.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid option name',
      });
      return;
    }

    // Check if option already exists
    if (existingOptions.some(option => 
      (typeof option === 'string' ? option : option.label || option.value).toLowerCase() === newOption.toLowerCase()
    )) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'This option already exists',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await CustomOptionsService.addCustomOption(fieldName, newOption.trim());
      if (result.success) {
        // Removed success toast
        onSuccess(newOption.trim());
        setNewOption('');
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to add new option',
        });
      }
    } catch (error) {
      console.error('Error adding new option:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add new option',
      });
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
            <Text style={styles.modalTitle}>Add New {fieldLabel}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>New {fieldLabel} Name</Text>
            <TextInput
              style={styles.textInput}
              value={newOption}
              onChangeText={setNewOption}
              placeholder={`Enter new ${fieldLabel.toLowerCase()} name`}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
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
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
});

export default AddNewOptionModal;
