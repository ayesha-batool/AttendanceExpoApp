import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import AddNewOptionModal from './AddNewOptionModal';
import DatePickerField from './DatePickerField';
import InputField from './InputField';
import SelectDropdown from './SelectDropdown';

const ExpenseForm = ({ 
  visible, 
  onClose, 
  onSave, 
  expense = null, 
  categoryOptions = [], 
  departmentOptions = [],
  existingExpenses = [],
  isEdit = false 
}) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    department: '',
    date: new Date(),
    description: '',
    notes: '',
    status: 'unpaid' // 'paid' or 'unpaid'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [addOptionField, setAddOptionField] = useState('');
  const [customToast, setCustomToast] = useState(null);

  useEffect(() => {
    if (expense && isEdit) {
      setForm({
        title: expense.title || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        department: expense.department || '',
        date: expense.date ? new Date(expense.date) : new Date(),
        description: expense.description || '',
        notes: expense.notes || '',
        status: expense.status || 'unpaid'
      });
    } else {
      resetForm();
    }
  }, [expense, isEdit, visible]);

  const resetForm = () => {
    setForm({
      title: '',
      amount: '',
      category: '',
      department: '',
      date: new Date(),
      description: '',
      notes: '',
      status: 'unpaid'
    });
    setErrors({});
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleOptionRemoved = async (removedOption, fieldName) => {
    setCustomToast({
      type: 'success',
      title: 'Success',
      message: `${fieldName.replace('_', ' ')} removed successfully`
    });
    setTimeout(() => setCustomToast(null), 3000);
    
    // Refresh options by calling the parent component's refresh function
    if (onSave) {
      // Trigger a refresh of options
      onSave({ refreshOptions: true, fieldName });
    }
  };

  const handleOptionAdded = async (newOption, fieldName) => {
    setCustomToast({
      type: 'success',
      title: 'Success',
      message: `New ${fieldName.replace('_', ' ')} added successfully`
    });
    setTimeout(() => setCustomToast(null), 3000);
    
    // Refresh options by calling the parent component's refresh function
    if (onSave) {
      // Trigger a refresh of options
      onSave({ refreshOptions: true, fieldName });
    }
  };

  const validateForm = () => {
    const newErrors = {};
const duplicate = existingExpenses.filter(expense => expense.title === form.title);
    // Title validation
    if (!form.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }

    // Amount validation
    if (!form.amount || form.amount.toString().trim() === '') {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(form.amount);
      if (isNaN(amount)) {
        newErrors.amount = 'Amount must be a valid number';
      } else if (amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (amount > 999999999) {
        newErrors.amount = 'Amount is too large';
      }
    }
if (duplicate.length > 0) {
  newErrors.title = 'Title already exists';
}
    // Category validation (optional but if provided should be valid)
    if (form.category && !categoryOptions.some(opt => opt.value === form.category)) {
      newErrors.category = 'Please select a valid category';
    }

    // Department validation (optional but if provided should be valid)
    if (form.department && !departmentOptions.some(opt => opt.value === form.department)) {
      newErrors.department = 'Please select a valid department';
    }

    // Date validation
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      newErrors.date = 'Please select a valid date';
    }

    setErrors(newErrors);
    
    // Show validation toast if there are errors
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors)[0];
      setCustomToast({
        type: 'error',
        title: 'Validation Error',
        message: errorMessages
      });
      setTimeout(() => setCustomToast(null), 5000);
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare expense data with proper formatting
      const expenseData = {
        ...form,
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        date: form.date.toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure we have default values for optional fields
        category: form.category || '',
        department: form.department || '',
        description: form.description || '',
        notes: form.notes || '',
        status: form.status || 'unpaid'
      };

      console.log('🔍 [EXPENSE FORM] Saving expense data:', expenseData);

      await onSave(expenseData);
      
      // Show success message
      setCustomToast({
        type: 'success',
        title: 'Success',
        message: isEdit ? 'Expense updated successfully!' : 'Expense added successfully!'
      });
      
      // Close modal after brief delay to show success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [EXPENSE FORM] Save error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to save expense';
      let errorTitle = 'Save Failed';
      
      if (error.message) {
        if (error.message.includes('Missing required attribute')) {
          const match = error.message.match(/Missing required attribute "(\w+)"/);
          const field = match ? match[1] : 'field';
          errorMessage = `Missing required field: ${field}`;
          errorTitle = 'Required Field Missing';
        } else if (error.message.includes('already exists')) {
          errorMessage = error.message;
          errorTitle = 'Duplicate Entry';
        } else if (error.message.includes('Invalid document structure')) {
          errorMessage = 'Invalid data format. Please check your entries.';
          errorTitle = 'Data Format Error';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
          errorTitle = 'Connection Error';
        } else {
          errorMessage = error.message;
        }
      }
      
      setCustomToast({
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });
      setTimeout(() => setCustomToast(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEdit) {
     
      setTimeout(() => setCustomToast(null), 3000);
      
      // Reset form and close after showing warning
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } else {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        {/* Custom Toast Container - Absolutely positioned */}
        {customToast && (
          <View style={[
            styles.customToastContainer,
            customToast.type === 'error' ? styles.errorToast : styles.successToast
          ]}>
            <Ionicons 
              name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
              size={20} 
              color="#fff" 
            />
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle}>{customToast.title}</Text>
              <Text style={styles.toastMessage}>{customToast.message}</Text>
            </View>
          </View>
        )}
        
        <LinearGradient colors={['#059669', '#047857']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Expense' : 'Add New Expense'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <InputField
            label="Title"
            value={form.title}
            onChangeText={(text) => updateForm('title', text)}
            placeholder="Enter expense title"
            error={errors.title}
            required
          />

          <InputField
            label="Amount"
            value={form.amount}
            onChangeText={(text) => updateForm('amount', text)}
            placeholder="Enter amount"
            keyboardType="numeric"
            error={errors.amount}
            required
          />

          <SelectDropdown
            label="Category"
            selectedValue={form.category}
            onValueChange={(value) => updateForm('category', value)}
            options={categoryOptions}
            fieldName="expense_categories"
            fieldLabel="Category"
            onOptionRemoved={(removedOption) => handleOptionRemoved(removedOption, 'expense_categories')}
            onOptionAdded={(newOption) => handleOptionAdded(newOption, 'expense_categories')}
            showAddNewOption={true}
            showRemoveOption={true}
            error={errors.category}
            required
          />

          <SelectDropdown
            label="Department"
            selectedValue={form.department}
            onValueChange={(value) => updateForm('department', value)}
            options={departmentOptions}
            fieldName="departments"
            fieldLabel="Department"
            onOptionRemoved={(removedOption) => handleOptionRemoved(removedOption, 'departments')}
            onOptionAdded={(newOption) => handleOptionAdded(newOption, 'departments')}
            showAddNewOption={true}
            showRemoveOption={true}
            error={errors.department}
            required
          />

          <DatePickerField
            label="Date"
            value={form.date}
            onChange={(date) => updateForm('date', date)}
            placeholder="Select date"
            error={errors.date}
            required
          />

          <InputField
            label="Description"
            value={form.description}
            onChangeText={(text) => updateForm('description', text)}
            placeholder="Enter description"
            multiline
            numberOfLines={3}
          />

          <InputField
            label="Notes"
            value={form.notes}
            onChangeText={(text) => updateForm('notes', text)}
            placeholder="Additional notes"
            multiline
            numberOfLines={3}
          />

          <SelectDropdown
            label="Payment Status"
            selectedValue={form.status}
            onValueChange={(value) => updateForm('status', value)}
            options={[
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Paid', value: 'paid' }
            ]}
            placeholder="Select payment status"
            showAddNewOption={false}
            showRemoveOption={false}
            error={errors.status}
          />

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient colors={['#059669', '#047857']} style={styles.saveGradient}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add New Option Modal */}
      <AddNewOptionModal
        visible={showAddOptionModal}
        fieldName={addOptionField}
        onClose={() => {
          setShowAddOptionModal(false);
          setAddOptionField('');
        }}
        onSuccess={(newOption) => {
          handleOptionAdded(newOption, addOptionField);
          setShowAddOptionModal(false);
          setAddOptionField('');
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#059669',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    
    
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Custom toast styles
  customToastContainer: {
    position: 'absolute',
    top: 60, // Position below status bar
    left: 20,
    right: 20,
    zIndex: 9999, // Very high z-index to appear above everything
    elevation: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 8,
  },
  errorToast: {
    backgroundColor: '#ef4444',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  successToast: {
    backgroundColor: '#22c55e',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  toastContent: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
  },
});

export default ExpenseForm;
