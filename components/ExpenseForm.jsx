import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

import CustomOptionsService from '../services/customOptionsService';
import { CUSTOM_VALIDATORS, formatErrorMessage, validateForm, VALIDATION_SCHEMAS } from '../utils/validation';
import DatePickerField from './DatePickerField';
import SelectDropdown from './SelectDropdown';

const ExpenseForm = ({ visible, onClose, onSave, expense, isEditMode }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
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
        notes: expense.notes || ''
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: '',
        department: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: ''
      });
    }
    setErrors({});
  }, [expense, isEditMode, visible]);

  const validateFormData = () => {
    // Use the validation schema
    const validation = validateForm(formData, VALIDATION_SCHEMAS.expense);
    
    // Add custom validations
    if (formData.amount) {
      const amountError = CUSTOM_VALIDATORS.expenseAmountRange(formData.amount, 0, 10000000);
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
        id: expense?.id || expense?.$id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        $id: expense?.$id || expense?.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: expense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(expenseData);
      
      // Removed success toast
      
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



  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
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
              <Ionicons name="close" size={24} color="#fff" />
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
            <DatePickerField
              label="Date *"
              value={formData.date ? new Date(formData.date) : new Date()}
              onChange={(date) => setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))}
              error={errors.date}
            />

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

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
    backgroundColor: '#8b5cf6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalBody: {
    flex: 1,
    padding: 24,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
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
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
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








});

export default ExpenseForm; 