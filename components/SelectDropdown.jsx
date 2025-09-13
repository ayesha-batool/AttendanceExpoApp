import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { hybridDataService } from '../services/hybridDataService';
import AddNewOptionModal from './AddNewOptionModal';
const SelectDropdown = ({
  label,
  selectedValue,
  onValueChange,
  options = [],
  optional = false,
  error = null,
  icon = null,
  style = {},
  fieldName = null,
  fieldLabel = null,
  onOptionAdded = null,
  onOptionRemoved = null,
  showAddNewOption = true,
  showRemoveOption = true,
  autoSelectFirst = true,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');
  const [customToast, setCustomToast] = useState(null);

  // Auto-select first option if no value is selected
  useEffect(() => {
    if (autoSelectFirst && !selectedValue && options.length > 0) {
      const firstOption = options[0];
      const firstValue = typeof firstOption === 'string' ? firstOption : firstOption.value;
      if (firstValue && firstValue !== 'add_new_option' && firstValue !== 'remove_option') {
        onValueChange(firstValue);
      }
    }
  }, [options, selectedValue, onValueChange, autoSelectFirst]);

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  const handleAddNewOption = () => {
    if (fieldName && fieldLabel) {
      setShowAddModal(true);
    }
  };

  const handleRemoveOption = () => {
    if (fieldName && fieldLabel) {
      setShowRemoveModal(true);
    }
  };

  const handleCloseRemoveModal = useCallback(() => {
    setShowRemoveModal(false);
    setRemoveSearchQuery('');
  }, []);

  const handleOptionAdded = (newOption) => {
    if (onOptionAdded) {
      onOptionAdded(newOption, fieldName);
    }
  };

  const handleOptionRemoved = async (optionToRemove) => {
    try {
      const result = await hybridDataService.removeOption(fieldName, optionToRemove);

      if (result) {
        // Clear the form field if the removed option was selected
        if (selectedValue === optionToRemove) {
          onValueChange('');
        }
        
        // Call the callback to update parent component
        if (onOptionRemoved) {
          onOptionRemoved(optionToRemove, fieldName);
        }
        
        // Clear search query for next operation
        setRemoveSearchQuery('');
        
        // Show success toast
        showCustomToast('success', 'Success', `${optionToRemove} removed successfully`);
      } else {
        showCustomToast('error', 'Error', 'Failed to remove option');
      }
    } catch (error) {
      console.error('Error removing option:', error);
      showCustomToast('error', 'Error', 'Failed to remove option: ' + error.message);
    }
  };

  const displayOptions = [...options];
  if (showAddNewOption && fieldName && fieldLabel) {
    displayOptions.push({
      label: `+ Add New ${fieldLabel}`,
      value: 'add_new_option',
    });
  }
  if (showRemoveOption && fieldName && fieldLabel) {
    displayOptions.push({
      label: `- Remove ${fieldLabel}`,
      value: 'remove_option',
    });
  }

  const handleValueChange = (value) => {
    if (value === 'add_new_option') {
      handleAddNewOption();
    } else if (value === 'remove_option') {
      handleRemoveOption();
    } else {
      onValueChange(value);
    }
  };

  const filteredRemoveOptions = options.filter((option) => {
    const optionLabel =
      typeof option === 'string' ? option : option.label || option.value;
    return (
      optionLabel &&
      optionLabel.toLowerCase().includes(removeSearchQuery.toLowerCase())
    );
  });

  const optionsKey = options
    .map((opt) => (typeof opt === 'string' ? opt : opt?.value || ''))
    .join('|');

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          {icon && (
            <Ionicons
              name={icon}
              size={16}
              color="#667eea"
              style={styles.labelIcon}
            />
          )}
          <Text style={styles.label}>
            {label}{' '}
            {optional && <Text style={styles.optionalText}>(optional)</Text>}
          </Text>
        </View>
      )}

      <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={handleValueChange}
          style={styles.picker}
        >
          {displayOptions.map((item, index) => {
            // Create unique key by combining value and index to avoid duplicates
            const key = typeof item === 'string' 
              ? `${item}-${index}` 
              : `${item?.value || item?.label || 'option'}-${index}`;
            const isAddNewOption = item.value === 'add_new_option';
            const isRemoveOption = item.value === 'remove_option';

            return typeof item === 'string' ? (
              <Picker.Item
                key={key}
                label={item}
                value={item}
                color={
                  isAddNewOption ? '#3b82f6' : isRemoveOption ? '#ef4444' : '#374151'
                }
              />
            ) : (
              <Picker.Item
                key={key}
                label={item.label}
                value={item.value}
                color={
                  isAddNewOption ? '#3b82f6' : isRemoveOption ? '#ef4444' : '#374151'
                }
              />
            );
          })}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{String(error)}</Text>}

      {/* Add New Option Modal */}
      {fieldName && fieldLabel && (
        <AddNewOptionModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleOptionAdded}
          fieldName={fieldName}
          fieldLabel={fieldLabel}
          existingOptions={options}
        />
      )}

      {/* Remove Option Modal */}
      <Modal
        key={`remove-modal-${fieldName}`}
        visible={showRemoveModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseRemoveModal}
      >
        <View style={styles.fullPageModalOverlay}>
          <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.fullPageModalHeader}>
            <View style={styles.fullPageModalHeaderContent}>
              <TouchableOpacity onPress={handleCloseRemoveModal} style={styles.fullPageModalBackButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.fullPageModalHeaderTitle}>Remove {fieldLabel}</Text>
              <View style={styles.fullPageModalHeaderSpacer} />
            </View>
          </LinearGradient>

          <View style={styles.fullPageModalBody}>
            <Text style={styles.fullPageModalSubtitle}>Select an option to remove:</Text>
            
            <TextInput
              style={styles.fullPageModalSearchInput}
              value={removeSearchQuery}
              onChangeText={setRemoveSearchQuery}
              placeholder={`Search ${fieldLabel?.toLowerCase() || 'option'}...`}
              placeholderTextColor="#9ca3af"
            />

            <FlatList
              data={filteredRemoveOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => {
                const optionLabel =
                  typeof item === 'string' ? item : item.label || item.value;
                return (
                  <TouchableOpacity
                    style={styles.fullPageModalRemoveOptionItem}
                    onPress={() => handleOptionRemoved(optionLabel)}
                  >
                    <Text style={styles.fullPageModalRemoveOptionText}>{String(optionLabel)}</Text>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                );
              }}
              style={styles.fullPageModalRemoveOptionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {customToast && (
        <View style={[styles.toastContainer, customToast.type === 'success' ? styles.successToast : styles.errorToast]}>
          <Text style={styles.toastText}>{customToast.title}</Text>
          <Text style={styles.toastMessage}>{customToast.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  optionalText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContainerError: {
    borderColor: '#ff4d4f',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  errorText: {
    marginTop: 4,
    color: '#ff4d4f',
    fontSize: 13,
    paddingLeft: 4,
  },
  // Remove Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  removeOptionsList: {
    flex: 1,
  },
  removeOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  removeOptionText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
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
  // New styles for full-page modal
  fullPageModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8f9fa",
    zIndex: 1000,
  },
  fullPageModalHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  fullPageModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fullPageModalBackButton: {
    padding: 8,
  },
  fullPageModalHeaderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  fullPageModalHeaderSpacer: {
    width: 40,
  },
  fullPageModalBody: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  fullPageModalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  fullPageModalSearchInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  fullPageModalRemoveOptionsList: {
    flex: 1,
  },
  fullPageModalRemoveOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullPageModalRemoveOptionText: {
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
  },
  // Custom Toast Styles
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  toastText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
  },
});

export default SelectDropdown;
