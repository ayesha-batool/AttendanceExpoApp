// Components
import DatePickerField from './DatePickerField';
import InputField from './InputField';
import PhoneNumberField from './PhoneNumberField';
import SelectDropdown from './SelectDropdown';

// External Libraries
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

// Contexts & Services
import { useAuth } from '../context/AuthContext';
import {
  getItems,
  handleDataSubmit,
  handleDataUpdate
} from '../services/dataHandler';
import { CUSTOM_VALIDATORS, formatErrorMessage, formatSuccessMessage, validateForm, VALIDATION_SCHEMAS } from '../utils/validation';

const { width: screenWidth } = Dimensions.get('window');

// Police-specific constants
const POLICE_DEPARTMENTS = [
  { label: 'Traffic', value: 'Traffic', color: '#FF9500', icon: 'car-outline' },
  { label: 'Investigation', value: 'Investigation', color: '#AF52DE', icon: 'search-outline' },
  { label: 'Patrol', value: 'Patrol', color: '#34C759', icon: 'shield-outline' },
  { label: 'Special Ops', value: 'Special Ops', color: '#FF3B30', icon: 'flash-outline' },
  { label: 'Administration', value: 'Administration', color: '#007AFF', icon: 'business-outline' },
  { label: 'Cyber Crime', value: 'Cyber Crime', color: '#5856D6', icon: 'laptop-outline' },
  { label: 'Narcotics', value: 'Narcotics', color: '#FF2D92', icon: 'medical-outline' },
  { label: 'Forensic', value: 'Forensic', color: '#8E8E93', icon: 'flask-outline' }
];

const POLICE_RANKS = [
  { label: 'Constable', value: 'Constable' },
  { label: 'Head Constable', value: 'Head Constable' },
  { label: 'Assistant Sub Inspector', value: 'Assistant Sub Inspector' },
  { label: 'Sub Inspector', value: 'Sub Inspector' },
  { label: 'Inspector', value: 'Inspector' },
  { label: 'Senior Inspector', value: 'Senior Inspector' },
  { label: 'Deputy Superintendent', value: 'Deputy Superintendent' },
  { label: 'Superintendent', value: 'Superintendent' },
  { label: 'Senior Superintendent', value: 'Senior Superintendent' },
  { label: 'Deputy Commissioner', value: 'Deputy Commissioner' },
  { label: 'Commissioner', value: 'Commissioner' }
];

const DUTY_SHIFTS = [
  { label: 'Morning Shift (6 AM - 2 PM)', value: 'morning' },
  { label: 'Evening Shift (2 PM - 10 PM)', value: 'evening' },
  { label: 'Night Shift (10 PM - 6 AM)', value: 'night' },
  { label: 'General Duty (8 AM - 6 PM)', value: 'general' }
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' }
];

const EMPLOYMENT_STATUS = [
  { label: 'Active', value: 'Active' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Retired', value: 'Retired' },
  { label: 'Transferred', value: 'Transferred' }
];

const SHIFT_OPTIONS = [
  { label: 'Morning', value: 'Morning' },
  { label: 'Evening', value: 'Evening' },
  { label: 'Night', value: 'Night' }
];

const BLOOD_GROUPS = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' }
];

const EDUCATION_LEVELS = [
  { label: 'High School', value: 'High School' },
  { label: 'Associate Degree', value: 'Associate Degree' },
  { label: 'Bachelor\'s Degree', value: 'Bachelor\'s Degree' },
  { label: 'Master\'s Degree', value: 'Master\'s Degree' },
  { label: 'Doctorate', value: 'Doctorate' },
  { label: 'Police Academy', value: 'Police Academy' },
  { label: 'Other', value: 'Other' }
];

const MARITAL_STATUS = [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
  { label: 'Widowed', value: 'Widowed' }
];

const PERFORMANCE_RATINGS = [
  { label: 'Excellent', value: 'Excellent' },
  { label: 'Good', value: 'Good' },
  { label: 'Satisfactory', value: 'Satisfactory' },
  { label: 'Needs Improvement', value: 'Needs Improvement' },
  { label: 'Unsatisfactory', value: 'Unsatisfactory' }
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Urdu',
  'Bengali',
  'Other'
];

const AddOfficerModal = ({ visible, onClose, onSuccess, editingOfficer = null }) => {
  const { currentUser } = useAuth();
  const currentDate = new Date();
  const defaultJoiningDate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000)); // 1 day ago
  
  const [form, setForm] = useState({
    // Basic Information
    badgeNumber: '',
    fullName: '',
    fatherName: '',
    cnic: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // Contact Information
    contactNumber: '',
    email: '',
    address: '',
    
    // Employment Information
    joiningDate: defaultJoiningDate,
    rank: '',
    department: '',
    postingStation: '',
    shift: '',
    employmentStatus: 'Active',
    
    // Additional Information
    isArmed: false,
    bloodGroup: '',
    serviceYears: '',
    performanceRating: '',
    lastPromotionDate: new Date(),
    disciplinaryActions: '',
    trainingCertifications: '',
    
    // Documents
    trainingCertificationsDoc: '',
    weaponLicenseDoc: '',
    drivingLicenseDoc: '',
    medicalCertificateDoc: '',
    performanceEvaluationDoc: '',
    disciplinaryRecordDoc: '',
    educationalCertificateDoc: '',
    cnicDocumentDoc: '',
    employmentContractDoc: '',
    
    // Payroll & Benefits
    salary: '',
    overtimeRate: '',
    monthlyOvertimeHours: '',
    totalAdvances: '',
    lastAdvanceDate: new Date(),
    benefits: '',
    allowances: '',
    
    // Legacy fields for backward compatibility
    employeeId: '',
    policeStation: '',
    phone: '',
    dateOfJoining: defaultJoiningDate,
    weaponLicenseNumber: '',
    drivingLicenseNumber: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    dutyShift: '',
    status: 'active',
    education: '',
    specializations: '',
    languages: '',
    maritalStatus: '',
    spouseName: '',
    children: '',
    medicalConditions: '',
    allergies: '',
    supervisor: '',
    workLocation: '',
    vehicleAssigned: '',
    equipmentAssigned: '',
    lastEvaluationDate: new Date(),
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'contact', 'personal', 'professional', 'additional'
  const [photoUri, setPhotoUri] = useState(null);

  const [errors, setErrors] = useState({});
  const [modalToast, setModalToast] = useState(null);
  const [existingEmployees, setExistingEmployees] = useState([]);

  useEffect(() => {
    if (editingOfficer) {
      setIsEditing(true);
      loadOfficerData();
    } else {
      setIsEditing(false);
      resetForm();
    }
    // Load existing employees for duplicate checking
    loadExistingEmployees();
  }, [editingOfficer, visible]);

  const loadSampleData = () => {
    const sampleDate = new Date('1990-05-15');
    const sampleJoiningDate = new Date('2015-03-01');
    const samplePromotionDate = new Date('2020-06-15');
    const sampleAdvanceDate = new Date('2023-01-10');
    const sampleEvaluationDate = new Date('2023-12-01');
    
    setForm({
      // Basic Information
      badgeNumber: 'P-2024-001',
      fullName: 'Ahmed Khan',
      fatherName: 'Muhammad Khan',
      cnic: '35202-1234567-8',
      dateOfBirth: sampleDate,
      gender: 'Male',
      
      // Contact Information
      contactNumber: '+92-300-1234567',
      email: 'ahmed.khan@police.gov.pk',
      address: 'House #123, Street #5, Gulberg III, Lahore',
      
      // Employment Information
      joiningDate: sampleJoiningDate,
      rank: 'Inspector',
      department: 'Investigation',
      postingStation: 'Central Police Station',
      shift: 'Morning',
      employmentStatus: 'Active',
      
      // Additional Information
      photoUrl: '',
      isArmed: true,
      bloodGroup: 'B+',
      serviceYears: '9',
      performanceRating: 'Excellent',
      lastPromotionDate: samplePromotionDate,
      disciplinaryActions: 'None',
      trainingCertifications: 'Advanced Investigation, Firearms Training, Cyber Crime Investigation',
      
      // Documents
      trainingCertificationsDoc: '',
      weaponLicenseDoc: '',
      drivingLicenseDoc: '',
      medicalCertificateDoc: '',
      performanceEvaluationDoc: '',
      disciplinaryRecordDoc: '',
      educationalCertificateDoc: '',
      cnicDocumentDoc: '',
      employmentContractDoc: '',
      
      // Payroll & Benefits
      salary: '85000',
      overtimeRate: '500',
      monthlyOvertimeHours: '20',
      totalAdvances: '50000',
      lastAdvanceDate: sampleAdvanceDate,
      benefits: 'Health Insurance, Housing Allowance, Transport Allowance',
      allowances: 'Risk Allowance: 5000, Special Duty Allowance: 3000',
      
      // Legacy fields for backward compatibility
      employeeId: 'EMP-2024-001',
      policeStation: 'Central Police Station',
      phone: '+92-300-1234567',
      dateOfJoining: sampleJoiningDate,
      weaponLicenseNumber: 'WL-2020-001',
      drivingLicenseNumber: 'DL-2015-001',
      emergencyContact: 'Fatima Khan (Wife)',
      emergencyContactPhone: '+92-300-7654321',
      dutyShift: 'Morning',
      status: 'active',
      education: 'Bachelor\'s Degree in Criminal Justice',
      specializations: 'Homicide Investigation, Digital Forensics',
      languages: 'Urdu, English, Punjabi',
      maritalStatus: 'Married',
      spouseName: 'Fatima Khan',
      children: '2',
      medicalConditions: 'None',
      allergies: 'None',
      supervisor: 'Senior Inspector Muhammad Ali',
      workLocation: 'Central Police Station, Investigation Wing',
      vehicleAssigned: 'Toyota Corolla (Police Vehicle #CP-123)',
      equipmentAssigned: 'Body Camera, Radio, Laptop, Firearm',
      lastEvaluationDate: sampleEvaluationDate,
      notes: 'Excellent performance in recent high-profile cases. Recommended for promotion.'
    });
    setActiveTab('basic');
    setPhotoUri(null);

    
    Toast.show({
      type: 'success',
      text1: 'Sample Data Loaded',
      text2: 'Form has been populated with sample officer data',
    });
  };

  const resetForm = () => {
    setForm({
      // Basic Information
      badgeNumber: '',
      fullName: '',
      fatherName: '',
      cnic: '',
      dateOfBirth: new Date(),
      gender: '',
      
      // Contact Information
      contactNumber: '',
      email: '',
      address: '',
      
      // Employment Information
      joiningDate: defaultJoiningDate,
      rank: '',
      department: '',
      postingStation: '',
      shift: '',
      employmentStatus: 'Active',
      
      // Additional Information
      photoUrl: '',
      isArmed: false,
      bloodGroup: '',
      serviceYears: '',
      performanceRating: '',
      lastPromotionDate: new Date(),
      disciplinaryActions: '',
      trainingCertifications: '',
      
      // Documents
      trainingCertificationsDoc: '',
      weaponLicenseDoc: '',
      drivingLicenseDoc: '',
      medicalCertificateDoc: '',
      performanceEvaluationDoc: '',
      disciplinaryRecordDoc: '',
      educationalCertificateDoc: '',
      cnicDocumentDoc: '',
      employmentContractDoc: '',
      
      // Payroll & Benefits
      salary: '',
      overtimeRate: '',
      monthlyOvertimeHours: '',
      totalAdvances: '',
      lastAdvanceDate: new Date(),
      benefits: '',
      allowances: '',
      
      // Legacy fields for backward compatibility
      employeeId: '',
      policeStation: '',
      phone: '',
      dateOfJoining: defaultJoiningDate,
      weaponLicenseNumber: '',
      drivingLicenseNumber: '',
      emergencyContact: '',
      emergencyContactPhone: '',
      dutyShift: '',
      status: 'active',
      salary: '',
      education: '',
      specializations: '',
      languages: '',
      maritalStatus: '',
      spouseName: '',
      children: '',
      medicalConditions: '',
      allergies: '',
      supervisor: '',
      workLocation: '',
      vehicleAssigned: '',
      equipmentAssigned: '',
      lastEvaluationDate: new Date(),
      notes: ''
    });
    setActiveTab('basic');
    setPhotoUri(null);

    
    Toast.show({
      type: 'info',
      text1: 'Form Cleared',
      text2: 'All form fields have been reset',
    });
  };

  const loadOfficerData = async () => {
    if (!editingOfficer) return;
    
    console.log('Loading officer data for editing:', editingOfficer);
    console.log('Editing officer ID:', editingOfficer.id);
    console.log('Editing officer structure:', Object.keys(editingOfficer));
    
    try {
      setForm({
        // Basic Information
        badgeNumber: editingOfficer.badgeNumber || editingOfficer.employeeId || '',
        fullName: editingOfficer.fullName || '',
        fatherName: editingOfficer.fatherName || '',
        cnic: editingOfficer.cnic || '',
        dateOfBirth: editingOfficer.dateOfBirth ? new Date(editingOfficer.dateOfBirth) : new Date(),
        gender: editingOfficer.gender || '',
        
        // Contact Information
        contactNumber: editingOfficer.contactNumber || editingOfficer.phone || '',
        email: editingOfficer.email || '',
        address: editingOfficer.address || '',
        
        // Employment Information
        joiningDate: editingOfficer.joiningDate ? new Date(editingOfficer.joiningDate) : (editingOfficer.dateOfJoining ? new Date(editingOfficer.dateOfJoining) : defaultJoiningDate),
        rank: editingOfficer.rank || '',
        department: editingOfficer.department || '',
        postingStation: editingOfficer.postingStation || editingOfficer.policeStation || '',
        shift: editingOfficer.shift || editingOfficer.dutyShift || '',
        employmentStatus: editingOfficer.employmentStatus || editingOfficer.status || 'Active',
        
        // Additional Information
        photoUrl: editingOfficer.photoUrl || '',
        isArmed: editingOfficer.isArmed || false,
        bloodGroup: editingOfficer.bloodGroup || '',
        serviceYears: editingOfficer.serviceYears || '',
        performanceRating: editingOfficer.performanceRating || '',
        lastPromotionDate: editingOfficer.lastPromotionDate ? new Date(editingOfficer.lastPromotionDate) : new Date(),
        disciplinaryActions: editingOfficer.disciplinaryActions || '',
        trainingCertifications: editingOfficer.trainingCertifications || '',
        
        // Payroll & Benefits
        salary: editingOfficer.salary || '',
        overtimeRate: editingOfficer.overtimeRate || '',
        monthlyOvertimeHours: editingOfficer.monthlyOvertimeHours || '',
        totalAdvances: editingOfficer.totalAdvances || '',
        lastAdvanceDate: editingOfficer.lastAdvanceDate ? new Date(editingOfficer.lastAdvanceDate) : new Date(),
        benefits: editingOfficer.benefits || '',
        allowances: editingOfficer.allowances || '',
        
        // Legacy fields for backward compatibility
        employeeId: editingOfficer.employeeId || '',
        policeStation: editingOfficer.policeStation || '',
        phone: editingOfficer.phone || '',
        dateOfJoining: editingOfficer.dateOfJoining ? new Date(editingOfficer.dateOfJoining) : defaultJoiningDate,
        weaponLicenseNumber: editingOfficer.weaponLicenseNumber || '',
        drivingLicenseNumber: editingOfficer.drivingLicenseNumber || '',
        emergencyContact: editingOfficer.emergencyContact || '',
        emergencyContactPhone: editingOfficer.emergencyContactPhone || '',
        dutyShift: editingOfficer.dutyShift || '',
        status: editingOfficer.status || 'active',
        education: editingOfficer.education || '',
        specializations: editingOfficer.specializations || '',
        languages: editingOfficer.languages || '',
        maritalStatus: editingOfficer.maritalStatus || '',
        spouseName: editingOfficer.spouseName || '',
        children: editingOfficer.children || '',
        medicalConditions: editingOfficer.medicalConditions || '',
        allergies: editingOfficer.allergies || '',
        supervisor: editingOfficer.supervisor || '',
        workLocation: editingOfficer.workLocation || '',
        vehicleAssigned: editingOfficer.vehicleAssigned || '',
        equipmentAssigned: editingOfficer.equipmentAssigned || '',
        lastEvaluationDate: editingOfficer.lastEvaluationDate ? new Date(editingOfficer.lastEvaluationDate) : new Date(),
        notes: editingOfficer.notes || ''
      });
    } catch (error) {
      console.error('Error loading officer data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load officer data',
      });
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const showModalToast = (type, title, message) => {
    setModalToast({ type, title, message });
    setTimeout(() => {
      setModalToast(null);
    }, 4000);
  };

  const loadExistingEmployees = async () => {
    try {
      console.log('🔍 Starting to load existing employees...');
      const employeesData = await getItems('employees');
      console.log('🔍 Raw employees data from getItems:', employeesData);
      console.log('🔍 Type of employeesData:', typeof employeesData);
      console.log('🔍 Is employeesData an array?', Array.isArray(employeesData));
      console.log('🔍 Length of employeesData:', employeesData?.length);
      
      if (employeesData && Array.isArray(employeesData)) {
        console.log('🔍 First employee data:', employeesData[0]);
        console.log('🔍 Keys of first employee:', employeesData[0] ? Object.keys(employeesData[0]) : 'No first employee');
      }
      
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      console.log('🔍 Valid employees after filtering:', validEmployees);
      console.log('🔍 Number of valid employees:', validEmployees.length);
      
      // Remove duplicates based on badgeNumber or employeeId
      const uniqueEmployees = validEmployees.filter((employee, index, self) => {
        const badgeNumber = employee.badgeNumber || employee.employeeId || '';
        const isDuplicate = index !== self.findIndex(emp => 
          (emp.badgeNumber || emp.employeeId || '') === badgeNumber
        );
        if (isDuplicate) {
          console.log('🔍 Found duplicate employee:', employee);
        }
        return !isDuplicate;
      });
      
      console.log('🔍 Unique employees after deduplication:', uniqueEmployees);
      console.log('🔍 Number of unique employees:', uniqueEmployees.length);
      
      // Log each employee's badge number for verification
      uniqueEmployees.forEach((emp, index) => {
        console.log(`🔍 Employee ${index + 1}:`, {
          badgeNumber: emp.badgeNumber,
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          id: emp.id,
          $id: emp.$id
        });
      });
      
      setExistingEmployees(uniqueEmployees);
      console.log('🔍 Set existingEmployees state with:', uniqueEmployees.length, 'employees');
    } catch (error) {
      console.error('❌ Error loading existing employees:', error);
      console.error('❌ Error stack:', error.stack);
    }
  };

  const validateFormData = () => {
    try {
      console.log('Starting validation...');
      console.log('Current form state:', form);
      
      // Create a clean form object with only the fields we want to validate
      const formToValidate = {
        badgeNumber: form.badgeNumber || '',
        fullName: form.fullName || '',
        cnic: form.cnic || '',
        contactNumber: form.contactNumber || '',
        email: form.email || '',
        address: form.address || '',
        department: form.department || '',
        rank: form.rank || '',
        shift: form.shift || '',
        employmentStatus: form.employmentStatus || '',
        salary: form.salary || '',
        dateOfBirth: form.dateOfBirth || '',
        joiningDate: form.joiningDate || ''
      };

      console.log('Form to validate:', formToValidate);
      console.log('Validation schema:', VALIDATION_SCHEMAS.officer);

      // Use the validation schema for basic fields
      const validation = validateForm(formToValidate, VALIDATION_SCHEMAS.officer);
      console.log('Initial validation result:', validation);
      
      // Add custom validations
      if (form.dateOfBirth) {
        const ageError = CUSTOM_VALIDATORS.minimumAge(form.dateOfBirth, 18);
        if (ageError) {
          validation.errors.dateOfBirth = ageError;
          validation.isValid = false;
        }
      }

      if (form.salary) {
        const salaryError = CUSTOM_VALIDATORS.salaryRange(form.salary, 0, 1000000);
        if (salaryError) {
          validation.errors.salary = salaryError;
          validation.isValid = false;
        }
      }

      // Additional validations for fields not in schema
      if (!form.gender) {
        validation.errors.gender = 'Gender is required';
        validation.isValid = false;
      }

      if (!form.postingStation?.trim()) {
        validation.errors.postingStation = 'Posting station is required';
        validation.isValid = false;
      }

      // Check for duplicate badge number (only for new officers, not when editing)
      if (!isEditing && form.badgeNumber?.trim()) {
        console.log('🔍 Checking for duplicate badge number:', form.badgeNumber);
        console.log('🔍 Existing employees to check against:', existingEmployees);
        
        const badgeExists = existingEmployees.some(emp => {
          const empBadgeNumber = emp.badgeNumber || emp.employeeId || '';
          const isDuplicate = empBadgeNumber.toLowerCase() === form.badgeNumber.toLowerCase();
          if (isDuplicate) {
            console.log('🔍 Found duplicate badge number:', empBadgeNumber, 'in employee:', emp);
          }
          return isDuplicate;
        });
        
        if (badgeExists) {
          validation.errors.badgeNumber = 'Badge number already exists';
          validation.isValid = false;
          console.log('🔍 Duplicate badge number detected:', form.badgeNumber);
        }
      }

      console.log('Final validation result:', validation);
      setErrors(validation.errors);
      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'Validation failed due to an unexpected error' });
      return false;
    }
  };

  const onSubmit = async () => {
    try {
      console.log('Starting form submission...');
      console.log('Form data:', form);
      console.log('Is editing:', isEditing);
      console.log('Editing officer:', editingOfficer);
      
      const validationResult = validateFormData();
      if (!validationResult.isValid) {
        console.log('Validation failed:', validationResult.errors);
        
        // Show only the first validation error in the modal toast
        const errorMessages = Object.values(validationResult.errors).filter(error => error && error.trim() !== '');
        const firstError = errorMessages.length > 0 ? errorMessages[0] : 'Please fix the errors in the form';
        
        showModalToast('error', 'Validation Error', firstError);
        return;
      }

      setLoading(true);
      
      const officerData = {
        ...form,
        dateOfBirth: form.dateOfBirth.toISOString(),
        joiningDate: form.joiningDate.toISOString(),
        lastPromotionDate: form.lastPromotionDate.toISOString(),
        // Legacy field mapping for backward compatibility
        employeeId: form.badgeNumber,
        phone: form.contactNumber,
        policeStation: form.postingStation,
        dateOfJoining: form.joiningDate.toISOString(),
        dutyShift: form.shift,
        status: form.employmentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.uid || 'system'
      };

      console.log('Prepared officer data:', officerData);

      if (isEditing) {
        console.log('Updating existing officer...');
        const key = `employees_${editingOfficer.id}`;
        console.log('Update key:', key);
        console.log('Officer ID:', editingOfficer.id);
        
        try {
          const result = await handleDataUpdate(key, editingOfficer.id, officerData, 'employees');
          console.log('Update result:', result);
          
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: formatSuccessMessage('updated', 'Officer')
          });
          
          console.log('Update operation completed successfully');
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          }
          onClose();
        } catch (updateError) {
          console.error('Update operation failed:', updateError);
          throw updateError;
        }
      } else {
        console.log('Adding new officer...');
        try {
          const result = await handleDataSubmit(officerData, 'employees');
          console.log('Submit result:', result);
          
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: formatSuccessMessage('added', 'Officer')
          });
          
          console.log('Add operation completed successfully');
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          }
          onClose();
        } catch (submitError) {
          console.error('Submit operation failed:', submitError);
          throw submitError;
        }
      }
    } catch (error) {
      console.error('Error saving officer:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (department) => {
    const dept = POLICE_DEPARTMENTS.find(d => d.value === department);
    return dept ? dept.color : '#8E8E93';
  };

  // Photo upload function using document picker
  const pickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        setPhotoUri(photo.uri);
        updateForm('photoUrl', photo.uri);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Photo uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload photo',
      });
    }
  };



  const renderBasicInfoTab = () => (
    <View style={styles.tabContent}>
      <InputField
        label="Badge Number *"
        value={form.badgeNumber}
        onChangeText={(text) => updateForm('badgeNumber', text)}
        placeholder="Enter official badge number"
        required
        error={errors.badgeNumber}
      />
      
      <InputField
        label="Full Name *"
        value={form.fullName}
        onChangeText={(text) => updateForm('fullName', text)}
        placeholder="Enter officer's full legal name"
        required
        error={errors.fullName}
      />
      
      <InputField
        label="Father's Name"
        value={form.fatherName}
        onChangeText={(text) => updateForm('fatherName', text)}
        placeholder="Enter father's name for background checks"
      />
      
      <InputField
        label="CNIC *"
        value={form.cnic}
        onChangeText={(text) => updateForm('cnic', text)}
        placeholder="Enter CNIC number (00000-0000000-0)"
        required
        error={errors.cnic}
      />
      
      <DatePickerField
        label="Date of Birth *"
        value={form.dateOfBirth}
        onDateChange={(date) => updateForm('dateOfBirth', date)}
        placeholder="Select date of birth"
        required
        error={errors.dateOfBirth}
      />
      
      <SelectDropdown
        label="Gender *"
        selectedValue={form.gender}
        onValueChange={(value) => updateForm('gender', value)}
        options={GENDER_OPTIONS}
        fieldName="gender"
        fieldLabel="Gender"
        error={errors.gender}
        onOptionAdded={(newOption) => {
          // Update the GENDER_OPTIONS array with the new option
          GENDER_OPTIONS.push({ label: newOption, value: newOption });
        }}
      />
      
      <SelectDropdown
        label="Department *"
        selectedValue={form.department}
        onValueChange={(value) => updateForm('department', value)}
        options={POLICE_DEPARTMENTS}
        fieldName="departments"
        fieldLabel="Department"
        onOptionAdded={(newOption) => {
          // Update the POLICE_DEPARTMENTS array with the new option
          POLICE_DEPARTMENTS.push({ label: newOption, value: newOption, color: '#6b7280', icon: 'business-outline' });
        }}
      />
      
      <SelectDropdown
        label="Rank *"
        selectedValue={form.rank}
        onValueChange={(value) => updateForm('rank', value)}
        options={POLICE_RANKS}
        fieldName="ranks"
        fieldLabel="Rank"
        onOptionAdded={(newOption) => {
          // Update the POLICE_RANKS array with the new option
          POLICE_RANKS.push({ label: newOption, value: newOption });
        }}
      />
      
      <InputField
        label="Posting Station"
        value={form.postingStation}
        onChangeText={(text) => updateForm('postingStation', text)}
        placeholder="Enter current police station or region"
      />
      
      <SelectDropdown
        label="Shift *"
        selectedValue={form.shift}
        onValueChange={(value) => updateForm('shift', value)}
        options={SHIFT_OPTIONS}
        fieldName="shifts"
        fieldLabel="Shift"
        onOptionAdded={(newOption) => {
          // Update the SHIFT_OPTIONS array with the new option
          SHIFT_OPTIONS.push({ label: newOption, value: newOption });
        }}
      />
      
      <SelectDropdown
        label="Employment Status *"
        selectedValue={form.employmentStatus}
        onValueChange={(value) => updateForm('employmentStatus', value)}
        options={EMPLOYMENT_STATUS}
        fieldName="employment_status"
        fieldLabel="Employment Status"
        onOptionAdded={(newOption) => {
          // Update the EMPLOYMENT_STATUS array with the new option
          EMPLOYMENT_STATUS.push({ label: newOption, value: newOption });
        }}
      />

            {/* Photo Upload Section */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>Profile Photo</Text>
        <View style={styles.photoContainer}>
          {photoUri || form.photoUrl ? (
            <View style={styles.photoPreview}>
              <RNImage
                source={{ uri: photoUri || form.photoUrl }}
                style={styles.photoImage}
              />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => {
                  setPhotoUri(null);
                  updateForm('photoUrl', '');
                }}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={48} color="#8E8E93" />
              <Text style={styles.photoPlaceholderText}>No photo selected</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadPhotoButton} onPress={pickPhoto}>
            <Ionicons name="cloud-upload" size={24} color="#007AFF" />
            <Text style={styles.uploadPhotoButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <PhoneNumberField
        label="Contact Number *"
        value={form.contactNumber}
        onChange={(text) => updateForm('contactNumber', text)}
        placeholder="Enter personal or duty number"
        required
        error={errors.contactNumber}
      />
      
      <InputField
        label="Email"
        value={form.email}
        onChangeText={(text) => updateForm('email', text)}
        placeholder="Enter official/internal email"
        keyboardType="email-address"
        error={errors.email}
      />
      
      <InputField
        label="Address *"
        value={form.address}
        onChangeText={(text) => updateForm('address', text)}
        placeholder="Enter residential address"
        multiline
        numberOfLines={3}
        required
        error={errors.address}
      />
      
      <DatePickerField
        label="Joining Date *"
        value={form.joiningDate}
        onDateChange={(date) => updateForm('joiningDate', date)}
        placeholder="Select date of entry into force"
        required
        error={errors.joiningDate}
      />
      
      <InputField
        label="Service Years"
        value={form.serviceYears}
        onChangeText={(text) => updateForm('serviceYears', text)}
        placeholder="Enter years of service"
        keyboardType="numeric"
      />
      
      <DatePickerField
        label="Last Promotion Date"
        value={form.lastPromotionDate}
        onDateChange={(date) => updateForm('lastPromotionDate', date)}
        placeholder="Select last promotion date"
      />
    </View>
  );

  const renderPersonalTab = () => (
    <View style={styles.tabContent}>
      <SelectDropdown
        label="Blood Group"
        selectedValue={form.bloodGroup}
        onValueChange={(value) => updateForm('bloodGroup', value)}
        options={BLOOD_GROUPS}
        fieldName="blood_groups"
        fieldLabel="Blood Group"
        onOptionAdded={(newOption) => {
          // Update the BLOOD_GROUPS array with the new option
          BLOOD_GROUPS.push({ label: newOption, value: newOption });
        }}
      />
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Is Armed Officer</Text>
        <TouchableOpacity
          style={[styles.switch, form.isArmed && styles.switchActive]}
          onPress={() => updateForm('isArmed', !form.isArmed)}
        >
          <View style={[styles.switchThumb, form.isArmed && styles.switchThumbActive]} />
        </TouchableOpacity>
      </View>
      
      <InputField
        label="Performance Rating"
        value={form.performanceRating}
        onChangeText={(text) => updateForm('performanceRating', text)}
        placeholder="Enter performance rating (0.00-5.00)"
        keyboardType="decimal-pad"
      />
      

      
      <InputField
        label="Disciplinary Actions"
        value={form.disciplinaryActions}
        onChangeText={(text) => updateForm('disciplinaryActions', text)}
        placeholder="Enter brief notes on disciplinary actions"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderProfessionalTab = () => (
    <View style={styles.tabContent}>
      <InputField
        label="Weapon License Number"
        value={form.weaponLicenseNumber}
        onChangeText={(text) => updateForm('weaponLicenseNumber', text)}
        placeholder="Enter weapon license number"
      />
      
      <InputField
        label="Driving License Number"
        value={form.drivingLicenseNumber}
        onChangeText={(text) => updateForm('drivingLicenseNumber', text)}
        placeholder="Enter driving license number"
      />
      


      <InputField
        label="Training Certifications"
        value={form.trainingCertifications}
        onChangeText={(text) => updateForm('trainingCertifications', text)}
        placeholder="Enter training certifications"
        multiline
        numberOfLines={2}
      />

      <InputField
        label="Specializations"
        value={form.specializations}
        onChangeText={(text) => updateForm('specializations', text)}
        placeholder="Enter specializations"
        multiline
        numberOfLines={2}
      />

      <InputField
        label="Vehicle Assigned"
        value={form.vehicleAssigned}
        onChangeText={(text) => updateForm('vehicleAssigned', text)}
        placeholder="Enter assigned vehicle details"
      />

      <InputField
        label="Equipment Assigned"
        value={form.equipmentAssigned}
        onChangeText={(text) => updateForm('equipmentAssigned', text)}
        placeholder="Enter assigned equipment"
      />

      <InputField
        label="Supervisor"
        value={form.supervisor}
        onChangeText={(text) => updateForm('supervisor', text)}
        placeholder="Enter supervisor name"
      />

      <InputField
        label="Work Location"
        value={form.workLocation}
        onChangeText={(text) => updateForm('workLocation', text)}
        placeholder="Enter work location/beat"
      />

      <DatePickerField
        label="Last Evaluation Date"
        value={form.lastEvaluationDate}
        onDateChange={(date) => updateForm('lastEvaluationDate', date)}
        placeholder="Select last evaluation date"
      />
    </View>
  );

  const renderAdditionalTab = () => (
    <View style={styles.tabContent}>
      <InputField
        label="Medical Conditions"
        value={form.medicalConditions}
        onChangeText={(text) => updateForm('medicalConditions', text)}
        placeholder="Enter medical conditions"
        multiline
        numberOfLines={2}
      />

      <InputField
        label="Allergies"
        value={form.allergies}
        onChangeText={(text) => updateForm('allergies', text)}
        placeholder="Enter allergies"
        multiline
        numberOfLines={2}
      />

      <SelectDropdown
        label="Education Level"
        selectedValue={form.education}
        onValueChange={(value) => updateForm('education', value)}
        options={EDUCATION_LEVELS}
        fieldName="education_levels"
        fieldLabel="Education Level"
        onOptionAdded={(newOption) => {
          // Update the EDUCATION_LEVELS array with the new option
          EDUCATION_LEVELS.push({ label: newOption, value: newOption });
        }}
      />

      <SelectDropdown
        label="Marital Status"
        selectedValue={form.maritalStatus}
        onValueChange={(value) => updateForm('maritalStatus', value)}
        options={MARITAL_STATUS}
        fieldName="marital_status"
        fieldLabel="Marital Status"
        onOptionAdded={(newOption) => {
          // Update the MARITAL_STATUS array with the new option
          MARITAL_STATUS.push({ label: newOption, value: newOption });
        }}
      />

      <InputField
        label="Spouse Name"
        value={form.spouseName}
        onChangeText={(text) => updateForm('spouseName', text)}
        placeholder="Enter spouse name"
      />

      <InputField
        label="Children"
        value={form.children}
        onChangeText={(text) => updateForm('children', text)}
        placeholder="Enter number of children"
        keyboardType="numeric"
      />

      <InputField
        label="Languages Known"
        value={form.languages}
        onChangeText={(text) => updateForm('languages', text)}
        placeholder="Enter languages (e.g., English, Spanish)"
      />
    </View>
  );

  const renderPayrollTab = () => (
    <View style={styles.tabContent}>
      <InputField
        label="Base Salary"
        value={form.salary}
        onChangeText={(text) => updateForm('salary', text)}
        placeholder="Enter base salary amount"
        keyboardType="numeric"
      />

      <InputField
        label="Overtime Rate (per hour)"
        value={form.overtimeRate}
        onChangeText={(text) => updateForm('overtimeRate', text)}
        placeholder="Enter overtime rate per hour"
        keyboardType="numeric"
      />

      <InputField
        label="Monthly Overtime Hours"
        value={form.monthlyOvertimeHours}
        onChangeText={(text) => updateForm('monthlyOvertimeHours', text)}
        placeholder="Enter monthly overtime hours"
        keyboardType="numeric"
      />

      <InputField
        label="Total Advances"
        value={form.totalAdvances}
        onChangeText={(text) => updateForm('totalAdvances', text)}
        placeholder="Enter total advances taken"
        keyboardType="numeric"
      />

      <DatePickerField
        label="Last Advance Date"
        value={form.lastAdvanceDate}
        onDateChange={(date) => updateForm('lastAdvanceDate', date)}
        placeholder="Select last advance date"
      />

      <InputField
        label="Benefits"
        value={form.benefits}
        onChangeText={(text) => updateForm('benefits', text)}
        placeholder="Enter benefits (e.g., health insurance, housing allowance)"
        multiline
        numberOfLines={2}
      />

      <InputField
        label="Allowances"
        value={form.allowances}
        onChangeText={(text) => updateForm('allowances', text)}
        placeholder="Enter allowances (e.g., transport, meal allowance)"
        multiline
        numberOfLines={2}
      />
    </View>
  );



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
          <LinearGradient
            colors={['#007AFF', '#0056CC']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Officer' : 'Add New Officer'}
              </Text>
              {/* {!isEditing && (
                <View style={styles.headerButtons}>
                  <TouchableOpacity onPress={loadSampleData} style={styles.sampleDataButton}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.sampleDataButtonText}>Sample Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetForm} style={styles.clearFormButton}>
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.clearFormButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )} */}
            </View>
          </LinearGradient>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContainer}
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
                onPress={() => setActiveTab('basic')}
              >
                <Ionicons 
                  name="person" 
                  size={16} 
                  color={activeTab === 'basic' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
                  Basic Info
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
                onPress={() => setActiveTab('contact')}
              >
                <Ionicons 
                  name="call" 
                  size={16} 
                  color={activeTab === 'contact' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
                  Contact
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
                onPress={() => setActiveTab('personal')}
              >
                <Ionicons 
                  name="card" 
                  size={16} 
                  color={activeTab === 'personal' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
                  Personal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'professional' && styles.activeTab]}
                onPress={() => setActiveTab('professional')}
              >
                <Ionicons 
                  name="shield" 
                  size={16} 
                  color={activeTab === 'professional' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'professional' && styles.activeTabText]}>
                  Professional
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'additional' && styles.activeTab]}
                onPress={() => setActiveTab('additional')}
              >
                <Ionicons 
                  name="medical" 
                  size={16} 
                  color={activeTab === 'additional' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'additional' && styles.activeTabText]}>
                  Additional
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'payroll' && styles.activeTab]}
                onPress={() => setActiveTab('payroll')}
              >
                <Ionicons 
                  name="cash" 
                  size={16} 
                  color={activeTab === 'payroll' ? '#007AFF' : '#8E8E93'} 
                />
                <Text style={[styles.tabText, activeTab === 'payroll' && styles.activeTabText]}>
                  Payroll
                </Text>
              </TouchableOpacity>


            </ScrollView>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {activeTab === 'basic' && renderBasicInfoTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'professional' && renderProfessionalTab()}
            {activeTab === 'additional' && renderAdditionalTab()}
            {activeTab === 'payroll' && renderPayrollTab()}

          </ScrollView>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={onSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#007AFF', '#0056CC']}
                style={styles.submitGradient}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : (isEditing ? 'Update Officer' : 'Add Officer')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Modal Toast */}
        {modalToast && (
          <View style={styles.modalToastContainer}>
            <View style={[
              styles.modalToast,
              modalToast.type === 'error' ? styles.modalToastError : styles.modalToastSuccess
            ]}>
              <Ionicons 
                name={modalToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                size={20} 
                color={modalToast.type === 'error' ? '#fff' : '#fff'} 
              />
              <View style={styles.modalToastContent}>
                <Text style={styles.modalToastTitle}>{modalToast.title}</Text>
                <Text style={styles.modalToastMessage}>{modalToast.message}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalToast(null)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    width: '95%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sampleDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sampleDataButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  clearFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  clearFormButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#F2F8FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    gap: 16,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  submitButton: {
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#3b82f6',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  // Photo upload styles
  photoSection: {
    marginTop: 16,
  },
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
  // Document upload styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  documentSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  documentSize: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  // Image preview styles for documents
  imagePreview: {
    position: 'relative',
    flex: 1,
    marginRight: 12,
  },
  documentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
  },
  // Receipt specific styles
  receiptImageContainer: {
    position: 'relative',
    flex: 1,
    marginRight: 12,
  },
  receiptImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  receiptName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  receiptSize: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
  },
  // Modal Toast Styles
  modalToastContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  modalToast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalToastError: {
    backgroundColor: '#FF3B30',
  },
  modalToastSuccess: {
    backgroundColor: '#34C759',
  },
  modalToastContent: {
    flex: 1,
    marginLeft: 12,
  },
  modalToastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  modalToastMessage: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});

export default AddOfficerModal; 