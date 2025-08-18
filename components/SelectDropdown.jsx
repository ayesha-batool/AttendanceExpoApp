import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { customOptionsService } from '../services/unifiedDataService';
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
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');

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

  const handleOptionAdded = (newOption) => {
    if (onOptionAdded) {
      onOptionAdded(newOption, fieldName);
    }
  };

  const handleOptionRemoved = async (optionToRemove) => {
    try {
      const result = await customOptionsService.removeOption(fieldName, optionToRemove);
      
      if (result.success) {
        // If the removed option was selected, clear the selection
        if (selectedValue === optionToRemove) {
          onValueChange('');
        }
        
        // Call the callback to refresh options
        if (onOptionRemoved) {
          onOptionRemoved(optionToRemove, fieldName);
        }
        
        // Close the modal after successful removal
        setShowRemoveModal(false);
        
        // Clear search query
        setRemoveSearchQuery('');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to remove option',
        });
      }
    } catch (error) {
      console.error('Error removing option:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove option: ' + error.message,
      });
    }
  };

  // Add "Add New Option" and "Remove Option" to the options list if enabled
  const displayOptions = [...options];
  
  if (showAddNewOption && fieldName && fieldLabel) {
    displayOptions.push({ label: `+ Add New ${fieldLabel}`, value: 'add_new_option' });
  }
  
  if (showRemoveOption && fieldName && fieldLabel) {
    displayOptions.push({ label: `- Remove ${fieldLabel}`, value: 'remove_option' });
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

  // Filter options for removal based on search query
  const filteredRemoveOptions = options.filter(option => {
    const optionLabel = typeof option === 'string' ? option : option.label || option.value;
    return optionLabel && optionLabel.toLowerCase().includes(removeSearchQuery.toLowerCase());
  });

  // Create a key based on options to force re-render when options change
  const optionsKey = options.map(opt => {
    if (typeof opt === 'string') return opt;
    return opt?.value || '';
  }).join('|');
  
  return (
    <View style={[styles.container, style]} key={optionsKey}>
      {label && (
        <View style={styles.labelContainer}>
          {icon && <Ionicons name={icon} size={16} color="#667eea" style={styles.labelIcon} />}
          <Text style={styles.label}>
            {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
          </Text>
        </View>
      )}

      <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={handleValueChange}
          style={styles.picker}
        >
          <Picker.Item label="Select" value="" />
          {displayOptions.map((item, index) => {
            const key = typeof item === 'string' ? item : (item.value || `option_${index}`);
            const isAddNewOption = item.value === 'add_new_option';
            const isRemoveOption = item.value === 'remove_option';
            
            return typeof item === 'string' ? (
              <Picker.Item 
                key={key} 
                label={item} 
                value={item}
                color={isAddNewOption ? '#3b82f6' : isRemoveOption ? '#ef4444' : '#000'}
              />
            ) : (
              <Picker.Item 
                key={key} 
                label={item.label} 
                value={item.value}
                color={isAddNewOption ? '#3b82f6' : isRemoveOption ? '#ef4444' : '#000'}
              />
            );
          })}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

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
        visible={showRemoveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRemoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove {fieldLabel}</Text>
              <TouchableOpacity onPress={() => setShowRemoveModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Select an option to remove:</Text>
              
              <TextInput
                style={styles.searchInput}
                value={removeSearchQuery}
                onChangeText={setRemoveSearchQuery}
                placeholder={`Search ${fieldLabel?.toLowerCase() || 'option'}...`}
                placeholderTextColor="#9ca3af"
              />

              <FlatList
                data={filteredRemoveOptions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  const optionLabel = typeof item === 'string' ? item : item.label || item.value;
                  return (
                    <TouchableOpacity
                      style={styles.removeOptionItem}
                      onPress={() => handleOptionRemoved(optionLabel)}
                    >
                      <Text style={styles.removeOptionText}>{optionLabel}</Text>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  );
                }}
                style={styles.removeOptionsList}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowRemoveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerContainerError: {
    borderColor: '#ff4d4f',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
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
});

export default SelectDropdown;
