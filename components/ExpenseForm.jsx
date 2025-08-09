import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Image as RNImage,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

import CustomOptionsService from '../services/customOptionsService';
import { CUSTOM_VALIDATORS, formatErrorMessage, formatSuccessMessage, validateForm, VALIDATION_SCHEMAS } from '../utils/validation';
import DatePicker from './DatePicker';
import SelectDropdown from './SelectDropdown';

const ExpenseForm = ({ visible, onClose, onSave, expense, isEditMode }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    receipt: null
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([
    { label: 'Patrol', value: 'patrol' },
    { label: 'Investigation', value: 'investigation' },
    { label: 'Traffic', value: 'traffic' },
    { label: 'Administration', value: 'administration' },
    { label: 'Training', value: 'training' },
    { label: 'Equipment', value: 'equipment' }
  ]);

  // Load category options when component mounts or modal opens
  useEffect(() => {
    if (visible) {
      loadCategoryOptions();
    }
  }, [visible]);

  // Load category options from custom options service
  const loadCategoryOptions = async () => {
    try {
      const allCategories = await CustomOptionsService.getAllOptions('expenseCategories');
      const options = allCategories.map(category => ({
        label: category,
        value: category.toLowerCase().replace(/\s+/g, '_')
      }));
      setCategoryOptions(options);
    } catch (error) {
      console.error('Error loading category options:', error);
      // Fallback to default options
      const defaultOptions = [
        { label: 'Fuel', value: 'fuel' },
        { label: 'Equipment', value: 'equipment' },
        { label: 'Training', value: 'training' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Office Supplies', value: 'office_supplies' },
        { label: 'Travel', value: 'travel' },
        { label: 'Other', value: 'other' }
      ];
      setCategoryOptions(defaultOptions);
    }
  };

  // Handle adding new category
  const handleAddNewCategory = (newOption) => {
    // Update the categoryOptions array with the new option
    setCategoryOptions(prev => [...prev, { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') }]);
    
    // Set the new category as selected
    const newCategoryValue = newOption.toLowerCase().replace(/\s+/g, '_');
    setFormData(prev => ({
      ...prev,
      category: newCategoryValue
    }));
  };

  // Handle adding new department
  const handleAddNewDepartment = (newOption) => {
    // Update the departmentOptions array with the new option
    setDepartmentOptions(prev => [...prev, { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') }]);
    
    // Set the new department as selected
    const newDepartmentValue = newOption.toLowerCase().replace(/\s+/g, '_');
    setFormData(prev => ({
      ...prev,
      department: newDepartmentValue
    }));
  };

  useEffect(() => {
    if (expense && isEditMode) {
      setFormData({
        title: expense.title || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        department: expense.department || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
        notes: expense.notes || '',
        receipt: expense.receipt || null
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: '',
        department: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        receipt: null
      });
    }
    setErrors({});
  }, [expense, isEditMode, visible]);

  const validateFormData = () => {
    // Use the validation schema
    const validation = validateForm(formData, VALIDATION_SCHEMAS.expense);
    
    // Add custom validations
    if (formData.amount) {
      const amountError = CUSTOM_VALIDATORS.expenseAmountRange(formData.amount, 0, 100000);
      if (amountError) {
        validation.errors.amount = amountError;
        validation.isValid = false;
      }
    }

    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    try {
      if (!validateFormData()) {
        const firstError = Object.values(errors)[0];
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: firstError || 'Please fix the errors in the form',
        });
        return;
      }

      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        id: expense?.id || Date.now().toString(),
        createdAt: expense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(expenseData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: formatSuccessMessage(isEditMode ? 'updated' : 'added', 'Expense'),
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatErrorMessage(error),
      });
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate the URI to prevent data URL navigation issues
        if (asset.uri && !asset.uri.startsWith('data:')) {
          setFormData(prev => ({
            ...prev,
            receipt: asset.uri
          }));
          Toast.show({
            type: 'success',
            text1: 'Image Selected',
            text2: 'Receipt image has been attached successfully',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Invalid image format. Please select a valid image file.',
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const removeReceipt = () => {
    setFormData(prev => ({
      ...prev,
      receipt: null
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Expense' : 'Add New Expense'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter expense title"
                placeholderTextColor="#9ca3af"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>

            {/* Category and Department */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Category *</Text>
                <SelectDropdown
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  options={categoryOptions}
                  fieldName="expenseCategories"
                  fieldLabel="Category"
                  onOptionAdded={handleAddNewCategory}
                />
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Department *</Text>
                <SelectDropdown
                  selectedValue={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  options={departmentOptions}
                  fieldName="departments"
                  fieldLabel="Department"
                  onOptionAdded={handleAddNewDepartment}
                />
                {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.date && styles.placeholderText]}>
                  {formData.date ? new Date(formData.date).toLocaleDateString() : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color="#6b7280" />
              </TouchableOpacity>
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter expense description"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Receipt */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt</Text>
              <View style={styles.photoContainer}>
                {formData.receipt && !formData.receipt.startsWith('data:') ? (
                  <View style={styles.photoPreview}>
                    <RNImage
                      source={{ uri: formData.receipt }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={removeReceipt}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="receipt" size={48} color="#8E8E93" />
                    <Text style={styles.photoPlaceholderText}>No receipt selected</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleDocumentPick}>
                  <Ionicons name="cloud-upload" size={24} color="#007AFF" />
                  <Text style={styles.uploadPhotoButtonText}>Upload Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
          setShowDatePicker(false);
        }}
        selectedDate={formData.date ? new Date(formData.date) : new Date()}
      />


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
    width: '90%',
    maxHeight: '90%',
    padding: 0,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    backgroundColor: '#f9fafb',
  },
  uploadText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Photo upload styles (for receipt)
  photoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  photoPreview: {
    position: 'relative',
    marginBottom: 16,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadPhotoButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ExpenseForm; 