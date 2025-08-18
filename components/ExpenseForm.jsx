import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

    if (!form.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!form.category) {
      newErrors.category = 'Category is required';
    }

    if (!form.department) {
      newErrors.department = 'Department is required';
    }

    if (!form.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date.toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(expenseData);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEdit) {
      Alert.alert(
        'Cancel Edit',
        'Are you sure you want to cancel? All changes will be lost.',
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: () => {
            resetForm();
            onClose();
          }}
        ]
      );
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
        {/* Custom Toast Container */}
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
        
        <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
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
            label="Title *"
            value={form.title}
            onChangeText={(text) => updateForm('title', text)}
            placeholder="Enter expense title"
            error={errors.title}
            required
          />

          <InputField
            label="Amount *"
            value={form.amount}
            onChangeText={(text) => updateForm('amount', text)}
            placeholder="Enter amount"
            keyboardType="numeric"
            error={errors.amount}
            required
          />

          <SelectDropdown
            label="Category *"
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
            label="Department *"
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
            label="Date *"
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
            <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.saveGradient}>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 8,
    elevation: 4,
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
