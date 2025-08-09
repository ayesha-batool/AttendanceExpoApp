import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getItems } from '../services/dataHandler';
import DatePickerField from './DatePickerField';
import InputField from './InputField';
import SelectDropdown from './SelectDropdown';

const UniversalModal = ({
  visible,
  onClose,
  title,
  isEditMode = false,
  initialData = {},
  onSubmit,
  fields = [],
  employees = [],
  onEmployeeSelect,
  errors = {},
  setErrors,
  loading = false,
  validateData, // Add this prop for parent validation
}) => {
  const [formData, setFormData] = useState(initialData);
  const [availableEmployees, setAvailableEmployees] = useState(employees);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load employees if not provided
  useEffect(() => {
    if (employees.length === 0) {
      loadEmployees();
    } else {
      setAvailableEmployees(employees);
    }
  }, [employees]);

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Show toast function
  const showModalToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      hideModalToast();
    }, 3000);
  };

  // Hide toast function
  const hideModalToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowToast(false);
    });
  };

  const loadEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      const activeEmployees = employeeData.filter(emp => {
        if (!emp.status) return true;
        if (emp.status !== 'inactive') return true;
        return false;
      });
      setAvailableEmployees(activeEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      showModalToast('Failed to load employees', 'error');
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    if (!employeeId) return;
    
    const selectedEmployee = availableEmployees.find(emp => emp.$id === employeeId);
    if (selectedEmployee) {
      const employeeName = selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName;
      
      setFormData(prev => ({
        ...prev,
        employeeId,
        employeeName
      }));

      // Clear employee selection error
      if (errors.employeeId) {
        setErrors(prev => ({
          ...prev,
          employeeId: ''
        }));
      }

      if (onEmployeeSelect) {
        onEmployeeSelect(employeeId, selectedEmployee);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('📝 Form data before validation:', formData);
      console.log('📝 Current errors state:', errors);
      
      // Use parent validation if provided, otherwise use internal validation
      let validationErrors = {};
      
      if (validateData) {
        // Use parent's validation function only
        console.log('📝 Using parent validation function');
        validationErrors = validateData(formData);
        console.log('📝 Parent validation result:', validationErrors);
      } else {
        // Internal validation for required fields only when no parent validation
        console.log('📝 Using internal validation');
        fields.forEach(field => {
          if (field.required) {
            const value = formData[field.name];
            console.log(`📝 Validating ${field.name}:`, value);
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              // Different error messages for different field types
              if (field.type === 'employee') {
                validationErrors[field.name] = `Please select ${field.label.toLowerCase()}`;
              } else {
                validationErrors[field.name] = `Please enter ${field.label.toLowerCase()}`;
              }
              console.log(`❌ Validation failed for ${field.name}`);
            }
          }
        });
      }

      // Set validation errors in state
      if (Object.keys(validationErrors).length > 0) {
        console.log('❌ Validation errors found, setting errors:', validationErrors);
        setErrors(validationErrors);
        // Show generic toast for validation errors
        showModalToast('Please fix the error', 'error');
        return; // Don't submit if there are validation errors
      }

      // Clear any existing errors since validation passed
      if (Object.keys(errors).length > 0) {
        console.log('✅ Clearing existing errors');
        setErrors({});
      }

      console.log('✅ Validation passed, submitting form data:', formData);
      await onSubmit(formData);
      
      // Show success toast with higher z-index
      showModalToast(isEditMode ? 'Record updated successfully' : 'Record saved successfully', 'success');
      
      // Reset form fields instead of closing modal
      resetFormFields();
    } catch (error) {
      console.error('Submit error:', error);
      
      // Show error toast only for non-validation errors
      if (error.message !== 'Validation failed') {
        showModalToast('Failed to save record', 'error');
      }
      // Don't close modal on error
    }
  };

  const resetFormFields = () => {
    // Reset form data to initial state
    setFormData(initialData);
    // Clear all errors
    setErrors({});
  };

  const renderField = (field) => {
    const { name, label, type = 'text', placeholder, required = false, options = [] } = field;
    const value = formData[name] || '';
    const error = errors[name];

    switch (type) {
      case 'employee':
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <SelectDropdown
              options={availableEmployees.map(emp => ({
                label: emp.fullName || emp.name || emp.employeeName,
                value: emp.$id
              }))}
              selectedValue={value}
              onValueChange={handleEmployeeSelect}
              style={styles.employeeSelector}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'date':
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <DatePickerField
              value={value}
              onChange={(date) => handleFieldChange(name, date)}
              style={styles.datePicker}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'number':
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <InputField
              value={value ? value.toString() : ''}
              onChangeText={(text) => handleFieldChange(name, text)}
              placeholder={placeholder}
              keyboardType="numeric"
              style={styles.inputField}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'textarea':
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <InputField
              value={value}
              onChangeText={(text) => handleFieldChange(name, text)}
              placeholder={placeholder}
              multiline
              numberOfLines={4}
              style={styles.textareaField}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'select':
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <SelectDropdown
              options={options}
              selectedValue={value}
              onValueChange={(selectedValue) => handleFieldChange(name, selectedValue)}
              style={styles.selectField}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      default:
        return (
          <View key={name} style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.formLabel}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
            <InputField
              value={value}
              onChangeText={(text) => handleFieldChange(name, text)}
              placeholder={placeholder}
              style={styles.inputField}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {fields.map(renderField)}
            
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        {showToast && (
          <Animated.View
            style={[
              styles.toastContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.toast,
                toastType === 'success' ? styles.successToast : styles.errorToast,
              ]}
            >
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Much lower than toast z-index
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001, // Much lower than toast z-index
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',

  },
  required: {
    color: '#FF3B30',
  },
  inputField: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 10,
  },
  textareaField: {
    minHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  employeeSelector: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 10,
  },
  datePicker: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 10,
  },
  selectField: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it's above other content
    padding: 20,
  },
  toast: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 8,
  },
  fieldContainer: {
    marginBottom: 15,
  },
});

export default UniversalModal; 