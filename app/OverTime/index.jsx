import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import EmployeeContainer from '../../components/EmployeeContainer';
import LoadingOverlay from '../../components/LoadingOverlay';
import SearchBar from '../../components/SearchBar';
import UniversalModal from '../../components/UniversalModal';
import { useAuth } from '../../context/AuthContext';
import { deleteLocal, getItems, handleDataSubmit, handleDataUpdate, updateLocal } from '../../services/dataHandler';

// Constants
const OVERTIME_FIELDS = [
  {
    name: 'employeeId',
    label: 'Employee',
    type: 'employee',
    required: true,
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'hours',
    label: 'Hours',
    type: 'number',
    placeholder: 'Enter hours (max 12)',
    required: true,
  },
  {
    name: 'hourlyWage',
    label: 'Hourly Wage',
    type: 'number',
    placeholder: 'Enter hourly wage',
    required: true,
  },
  {
    name: 'remarks',
    label: 'Remarks (Optional)',
    type: 'textarea',
    placeholder: 'Enter remarks (min 10 characters if provided)',
    required: false,
  },
];

const INITIAL_FORM_DATA = {
  employeeId: '',
  employeeName: '',
  date: new Date(),
  hours: '',
  hourlyWage: '',
  remarks: ''
};

const OverTimeScreen = () => {
  // State
  const [employees, setEmployees] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Hooks
  const { currentUser } = useAuth();
  const router = useRouter();

  // Computed values
  const filteredOvertimeRecords = overtimeRecords.filter(record =>
    record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.date?.includes(searchQuery) ||
    record.hours?.toString().includes(searchQuery)
  );

  const totalHours = overtimeRecords.reduce((sum, record) => sum + (parseFloat(record.hours) || 0), 0);
  const summaryTotalAmount = overtimeRecords.reduce((sum, record) => sum + (parseFloat(record.totalAmount) || 0), 0);

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Data loading functions
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchOvertimeRecords()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      const activeEmployees = employeeData.filter(emp => 
        !emp.status || emp.status !== 'inactive'
      );
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Get available employees for the add modal (exclude those who already have overtime records)
  const getAvailableEmployees = () => {
    if (!showModal || isEditMode) {
      return employees; // Show all employees when editing
    }

    // Get the current date from the modal form
    const currentDate = new Date().toISOString().split('T')[0]; // Default to today if no date selected
    
    // Filter out employees who already have overtime records for the current date
    const employeesWithOvertime = overtimeRecords
      .filter(record => record.date === currentDate)
      .map(record => record.employeeId);

    console.log('📅 Current date for filtering:', currentDate);
    console.log('📅 Employees with overtime today:', employeesWithOvertime);
    console.log('📅 Total employees:', employees.length);
    console.log('📅 Available employees for new overtime:', employees.length - employeesWithOvertime.length);

    return employees.filter(emp => !employeesWithOvertime.includes(emp.$id));
  };

  const fetchOvertimeRecords = async () => {
    try {
      console.log('📥 Fetching overtime records...');
      const records = await getItems('overtime');
      console.log('📥 Raw overtime records from getItems:', records);
      console.log('📥 Number of records:', records.length);
      
      // Log each record's structure
      records.forEach((record, index) => {
        console.log(`📥 Record ${index + 1}:`, {
          keys: Object.keys(record),
          values: record,
          id: record.$id || record.id || record._id,
          employeeName: record.employeeName,
          date: record.date,
          hours: record.hours,
          hourlyWage: record.hourlyWage,
          totalAmount: record.totalAmount,
          remarks: record.remarks
        });
      });
      
      setOvertimeRecords(records);
      console.log('✅ Overtime records set to state');
    } catch (error) {
      console.error('❌ Error fetching overtime records:', error);
    }
  };

  // Check if employee already has overtime record for a specific date
  const hasExistingOvertimeRecord = (employeeId, date) => {
    const dateString = date.toISOString().split('T')[0];
    return overtimeRecords.some(record => 
      record.employeeId === employeeId && 
      record.date === dateString
    );
  };

  // Validation functions
  const validateOvertimeData = (formData) => {
    console.log('🔍 validateOvertimeData called with:', formData);
    const newErrors = {};

    // Employee validation
    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
      console.log('❌ Employee validation failed: employeeId is empty');
    } else {
      // Check for duplicate overtime record (only for new records, not edits)
      if (!isEditMode && hasExistingOvertimeRecord(formData.employeeId, formData.date)) {
        const dateString = formData.date.toISOString().split('T')[0];
        newErrors.employeeId = `Employee already has an overtime record for ${dateString}. Please edit the existing record instead.`;
        console.log('❌ Duplicate overtime record validation failed');
      }
    }

    // Hours validation
    if (!formData.hours) {
      newErrors.hours = 'Please enter hours';
      console.log('❌ Hours validation failed: hours is empty');
    } else if (isNaN(parseFloat(formData.hours))) {
      newErrors.hours = 'Hours must be a valid number';
      console.log('❌ Hours validation failed: not a valid number');
    } else if (parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
      console.log('❌ Hours validation failed: hours <= 0');
    } else if (parseFloat(formData.hours) > 12) {
      newErrors.hours = 'Overtime hours cannot exceed 12 hours';
      console.log('❌ Hours validation failed: hours > 12');
    }

    // Hourly wage validation
    if (!formData.hourlyWage) {
      newErrors.hourlyWage = 'Please enter hourly wage';
      console.log('❌ Hourly wage validation failed: hourlyWage is empty');
    } else if (isNaN(parseFloat(formData.hourlyWage))) {
      newErrors.hourlyWage = 'Hourly wage must be a valid number';
      console.log('❌ Hourly wage validation failed: not a valid number');
    } else if (parseFloat(formData.hourlyWage) <= 0) {
      newErrors.hourlyWage = 'Hourly wage must be greater than 0';
      console.log('❌ Hourly wage validation failed: hourlyWage <= 0');
    }

    // Total amount validation - show error under hourlyWage field
    const hours = parseFloat(formData.hours) || 0;
    const hourlyWage = parseFloat(formData.hourlyWage) || 0;
    const totalAmount = hours * hourlyWage;
    
    if (totalAmount > 9999000000000) {
      newErrors.hourlyWage = 'No more overtime allowed - amount exceeds limit';
      console.log('❌ Total amount validation failed: amount exceeds limit');
    }

    // Remarks validation (optional)
    if (formData.remarks && formData.remarks.trim() && formData.remarks.trim().length < 10) {
      newErrors.remarks = 'Remarks must be at least 10 characters if provided';
      console.log('❌ Remarks validation failed: too short');
    }

    console.log('🔍 Validation result:', newErrors);
    return newErrors;
  };

  // CRUD operations
  const saveOvertime = async (formData) => {
    console.log('💾 Starting saveOvertime with formData:', formData);
    
    const validationErrors = validateOvertimeData(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Validation errors found:', validationErrors);
      // Don't set errors here - let UniversalModal handle validation
      throw new Error('Validation failed');
    }

    try {
      const overtimeData = {
        ...formData,
        date: formData.date.toISOString().split('T')[0],
        totalAmount: parseFloat(formData.hours) * parseFloat(formData.hourlyWage)
      };
      
      console.log('💾 Processed overtimeData:', overtimeData);
      console.log('💾 Data structure keys:', Object.keys(overtimeData));
      console.log('💾 Data structure values:', overtimeData);

      // Check for existing overtime record for the same employee and date
      const existingRecord = overtimeRecords.find(record => 
        record.employeeId === formData.employeeId && 
        record.date === overtimeData.date
      );

      if (existingRecord && !isEditMode) {
        console.log('❌ Duplicate overtime record found for employee:', formData.employeeId, 'on date:', overtimeData.date);
        throw new Error(`Employee already has an overtime record for ${overtimeData.date}. Please edit the existing record instead.`);
      }

      if (isEditMode && editingRecord) {
        console.log('💾 Editing existing record:', editingRecord);
        const recordId = editingRecord.$id || editingRecord.id || editingRecord._id;
        if (!recordId) {
          throw new Error('Record ID is missing. Cannot update record.');
        }
        
        if (recordId.startsWith('local_') || !editingRecord.synced) {
          const key = `overtime_${recordId}`;
          console.log('💾 Updating local record with key:', key);
          await updateLocal(key, { ...overtimeData, $id: recordId, synced: false });
        } else {
          const key = `overtime_${recordId}`;
          console.log('💾 Updating synced record with key:', key);
          await handleDataUpdate(key, recordId, overtimeData, 'overtime');
        }
      } else {
        console.log('💾 Creating new record');
        await handleDataSubmit(overtimeData, 'overtime');
      }
      
      console.log('💾 Record saved successfully, fetching updated records');
      await fetchOvertimeRecords();
      // Removed resetForm() call - modal will stay open
    } catch (error) {
      console.error('❌ Error saving overtime:', error);
      throw error;
    }
  };

  const editOvertime = (record) => {
    setIsEditMode(true);
    setEditingRecord(record);
    setErrors({});
    setShowModal(true);
  };

  const deleteOvertime = async (record) => {
    try {
      console.log('🗑️ Delete overtime called with record:', record);
      console.log('🗑️ Record keys:', Object.keys(record));
      console.log('🗑️ Full record object:', JSON.stringify(record, null, 2));
      
      const recordId = record.$id || record.id || record._id;
      console.log('🗑️ Record ID found:', recordId);
      console.log('🗑️ Record ID type:', typeof recordId);
      console.log('🗑️ Record ID length:', recordId ? recordId.length : 0);
      
      if (!recordId) {
        console.error('❌ Record missing ID. Available fields:', Object.keys(record));
        console.error('❌ All field values:', record);
        Alert.alert('Error', 'Record ID is missing. Cannot delete record.');
        return;
      }
      
      const key = `overtime_${recordId}`;
      console.log('🗑️ Deleting with key:', key);
      console.log('🗑️ Key type:', typeof key);
      console.log('🗑️ Key length:', key.length);
      
      // Use the deleteLocal function from dataHandler service
      await deleteLocal(key);
      console.log('✅ Record deleted successfully using deleteLocal service');
      
      await fetchOvertimeRecords();
      console.log('✅ Records refreshed after delete');
      
      // Show success message
      Alert.alert('Success', 'Overtime record deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting overtime:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', 'Failed to delete overtime record');
    }
  };

  const confirmDelete = (record) => {
    console.log('🗑️ Confirm delete for employee:', record.employeeName);
    
    Alert.alert(
      'Delete Overtime Record',
      `Are you sure you want to delete the overtime record for ${record.employeeName}?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log('❌ User cancelled delete');
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('✅ User confirmed delete for:', record.employeeName);
            deleteOvertime(record);
          }
        }
      ]
    );
  };

  // UI helper functions
  const resetForm = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingRecord(null);
    setErrors({});
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingRecord(null);
    setErrors({});
    setShowModal(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Debug function to show all local storage data
  const debugLocalStorage = async () => {
    try {
      console.log('🔍 === DEBUG: ALL LOCAL STORAGE DATA ===');
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', keys);
      
      const overtimeKeys = keys.filter(key => key.startsWith('overtime_'));
      console.log('🔍 Overtime keys:', overtimeKeys);
      
      if (overtimeKeys.length > 0) {
        const overtimeData = await AsyncStorage.multiGet(overtimeKeys);
        console.log('🔍 Raw overtime data from AsyncStorage:', overtimeData);
        
        overtimeData.forEach(([key, value], index) => {
          const parsedValue = JSON.parse(value);
          console.log(`🔍 Overtime item ${index + 1}:`, {
            key,
            parsedValue,
            keys: Object.keys(parsedValue),
            hasId: !!parsedValue.$id,
            idValue: parsedValue.$id
          });
        });
      }
      
      console.log('🔍 === END DEBUG ===');
    } catch (error) {
      console.error('🔍 Debug error:', error);
    }
  };

  // Render functions
  const renderSummaryCard = (icon, label, value, color = '#007AFF') => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const renderOvertimeRecord = (record) => {
    const details = [
      { icon: 'calendar-outline', label: 'Date', value: record.date },
      { icon: 'time-outline', label: 'Hours', value: `${record.hours} hrs` },
      { icon: 'cash-outline', label: 'Hourly Wage', value: record.hourlyWage, isCurrency: true },
      { icon: 'calculator-outline', label: 'Total Amount', value: record.totalAmount, isCurrency: true }
    ];

    return (
      <EmployeeContainer
        key={record.$id || `${record.employeeName}-${record.date}-${record.hours}`}
        record={record}
        onEdit={editOvertime}
        onDelete={confirmDelete}
        details={details}
        showRemarks={true}
        remarksField="remarks"
        avatarIcon="time-outline"
        avatarColor="#007AFF"
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Records Found' : 'No Overtime Records'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first overtime record'}
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
          {renderSummaryCard('list-outline', 'Total Records', filteredOvertimeRecords.length, '#007AFF')}
          {renderSummaryCard('time-outline', 'Total Hours', totalHours.toFixed(1), '#28a745')}
          {renderSummaryCard('cash-outline', 'Total Amount', '', '#ffc107')}
        </View>

        {/* Available Employees Summary */}
        <View style={styles.availableEmployeesContainer}>
          <Text style={styles.availableEmployeesText}>
            Available for New Overtime: {getAvailableEmployees().length} / {employees.length} employees
          </Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search overtime records..."
          onClear={clearSearch}
        />

        {/* Debug Button */}
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={debugLocalStorage}
        >
          <Text style={styles.debugButtonText}>🔍 Debug Local Storage</Text>
        </TouchableOpacity>

        {/* Employee Filtering Debug Button */}
            <TouchableOpacity 
          style={[styles.debugButton, { backgroundColor: '#9B59B6', marginTop: 5 }]} 
          onPress={() => {
            const availableEmployees = getAvailableEmployees();
            const employeesWithOvertime = employees.filter(emp => 
              !availableEmployees.some(available => available.$id === emp.$id)
            );
            
            Alert.alert(
              'Employee Filtering Info',
              `Total employees: ${employees.length}\n\n` +
              `Available for new overtime: ${availableEmployees.length}\n\n` +
              `Already have overtime today: ${employeesWithOvertime.length}\n\n` +
              `Filtering: Employees who already have overtime records for today are excluded from the add modal.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.debugButtonText}>👥 Employee Filtering Info</Text>
            </TouchableOpacity>

        {/* Overtime Records List */}
        {filteredOvertimeRecords.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredOvertimeRecords.map(renderOvertimeRecord)
        )}
      </ScrollView>

      {/* Universal Modal */}
      <UniversalModal
        visible={showModal}
        onClose={resetForm}
        title={isEditMode ? 'Edit Overtime Record' : 'Add New Overtime Record'}
        isEditMode={isEditMode}
        initialData={editingRecord ? {
          employeeId: editingRecord.employeeId || '',
          employeeName: editingRecord.employeeName || '',
          date: new Date(editingRecord.date),
          hours: editingRecord.hours?.toString() || '',
          hourlyWage: editingRecord.hourlyWage?.toString() || '',
          remarks: editingRecord.remarks || '',
        } : INITIAL_FORM_DATA}
        onSubmit={saveOvertime}
        fields={OVERTIME_FIELDS}
        employees={getAvailableEmployees()}
        errors={errors}
        setErrors={setErrors}
        validateData={validateOvertimeData}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingAddButton} onPress={openAddModal}>
        <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollArea: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  debugButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableEmployeesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableEmployeesText: {
    fontSize: 14,
    color: '#3498db',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default OverTimeScreen; 