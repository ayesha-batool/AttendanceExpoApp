import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import DatePickerField from '../../components/DatePickerField';
import InputField from '../../components/InputField';
import NumberFormatter from '../../components/NumberFormatter';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataSubmit, saveToLocal, useNetworkStatus } from '../../services/dataHandler';
import {
    colors,
    getDetailIconColor,
    getIconColor,
    getSummaryIconColor,
    icons
} from '../../styles/designSystem';

const AdvanceScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [advanceRecords, setAdvanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [errors, setErrors] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdvance, setNewAdvance] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date(),
    amount: '',
    description: '',
    documentUrl: ''
  });

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    fetchAdvanceRecords();
  }, []);

  // Refresh data when returning to the page
  useFocusEffect(
    React.useCallback(() => {
      fetchAdvanceRecords();
    }, [])
  );

  // Filter advance records based on search query
  const filteredAdvanceRecords = advanceRecords.filter(record => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.employeeName?.toLowerCase().includes(query) ||
      record.date?.toLowerCase().includes(query) ||
      record.amount?.toString().includes(query) ||
      record.description?.toLowerCase().includes(query) ||
      record.documentName?.toLowerCase().includes(query)
    );
  });

  // Debug: Log employees state
  console.log('🔍 Current employees state:', employees);
  console.log('🔍 Employees length:', employees.length);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const fetchEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      console.log('📦 Fetched employees for advance:', employeeData);
      
      // If no employees found, load sample employees
      if (!employeeData || employeeData.length === 0) {
        console.log('📦 No employees found, loading sample employees...');
        await loadSampleEmployees();
        // Fetch again after loading sample data
        const updatedEmployeeData = await getItems('employees');
        setEmployees(updatedEmployeeData);
      } else {
      setEmployees(employeeData);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch employees'
      });
    }
  };

  const loadSampleEmployees = async () => {
    try {
      const sampleEmployees = [
        {
          $id: 'emp_1',
          fullName: 'Ali',
          name: 'Ali',
          employeeName: 'Ali',
          position: 'Manager',
          phone: '+923001234567',
          email: 'ali@example.com',
          salary: '80000',
          department: 'Management',
          designation: 'Manager',
          joiningDate: new Date().toISOString(),
          synced: false
        },
        {
          $id: 'emp_2',
          fullName: 'Zain',
          name: 'Zain',
          employeeName: 'Zain',
          position: 'Accountant',
          phone: '+923001234568',
          email: 'zain@example.com',
          salary: '60000',
          department: 'Finance',
          designation: 'Accountant',
          joiningDate: new Date().toISOString(),
          synced: false
        },
        {
          $id: 'emp_3',
          fullName: 'Ayesha Batool',
          name: 'Ayesha Batool',
          employeeName: 'Ayesha Batool',
          position: 'Developer',
          phone: '+923260764834',
          email: 'batoolayesha123456@gmail.com',
          salary: '50000',
          department: 'Engineering',
          designation: 'Developer',
          joiningDate: new Date().toISOString(),
          synced: false
        }
      ];

      // Save sample employees to local storage
      for (const employee of sampleEmployees) {
        const key = `employees_${employee.$id}`;
        await saveToLocal(key, employee);
      }
      
      console.log('📦 Sample employees loaded successfully');
    } catch (error) {
      console.error('Error loading sample employees:', error);
    }
  };

  const loadSampleAdvanceRecords = async () => {
    try {
      const sampleAdvanceRecords = [
        {
          $id: 'adv_1',
          employeeId: 'emp_1',
          employeeName: 'Ali',
          date: '2024-01-15',
          amount: '50000',
          description: 'This is a very long description for testing the see more functionality. The description should be longer than 100 characters to trigger the see more button. This advance request is for office equipment and supplies needed for the upcoming project. The employee has requested funds for purchasing new laptops, software licenses, and other necessary equipment to ensure smooth project execution. The total amount requested is reasonable and within the company budget limits.',
          documentName: 'Advance_Request_Ali.pdf',
          synced: false,
          createdAt: new Date().toISOString()
        },
        {
          $id: 'adv_2',
          employeeId: 'emp_2',
          employeeName: 'Zain',
          date: '2024-01-20',
          amount: '30000',
          description: 'Short description for testing.',
          documentName: 'Advance_Request_Zain.pdf',
          synced: false,
          createdAt: new Date().toISOString()
        },
        {
          $id: 'adv_3',
          employeeId: 'emp_3',
          employeeName: 'Ayesha Batool',
          date: '2024-01-25',
          amount: '75000',
          description: 'Another long description to test the see more functionality. This advance is for travel expenses and conference attendance. The employee needs to attend an important industry conference in another city. The advance covers airfare, accommodation, meals, and conference registration fees. This is an excellent opportunity for professional development and networking. The conference will provide valuable insights into the latest industry trends and technologies.',
          documentName: 'Travel_Advance_Ayesha.pdf',
          synced: false,
          createdAt: new Date().toISOString()
        }
      ];

      // Save sample advance records to local storage
      for (const record of sampleAdvanceRecords) {
        const key = `advances_${record.$id}`;
        await saveToLocal(key, record);
      }
      
      console.log('📦 Sample advance records loaded successfully');
    } catch (error) {
      console.error('Error loading sample advance records:', error);
    }
  };

  const fetchAdvanceRecords = async () => {
    try {
      const records = await getItems('advances');
      console.log('📦 Fetched advance records:', records);
      
      // If no advance records found, load sample records
      if (!records || records.length === 0) {
        console.log('📦 No advance records found, loading sample records...');
        await loadSampleAdvanceRecords();
        // Fetch again after loading sample data
        const updatedRecords = await getItems('advances');
        setAdvanceRecords(updatedRecords);
      } else {
      setAdvanceRecords(records);
      }
    } catch (error) {
      console.error('Error fetching advance records:', error);
      setAdvanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    const selectedEmployee = employees.find(emp => emp.$id === employeeId);
    if (selectedEmployee) {
    setNewAdvance(prev => ({
      ...prev,
        employeeId: selectedEmployee.$id,
        employeeName: selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName
      }));
      if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: null }));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedDocument(asset);
        setNewAdvance(prev => ({
          ...prev,
          documentUrl: asset.uri,
          documentName: asset.name
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick document'
      });
    }
  };

  const validateForm = () => {
    console.log('🔍 Validating form...');
    console.log('🔍 newAdvance:', newAdvance);
    
    const newErrors = {};

    // Employee validation
    if (!newAdvance.employeeId) {
      newErrors.employeeId = 'Please select an employee';
      console.log('❌ Employee validation failed');
    }

    // Amount validation
    if (!newAdvance.amount) {
      newErrors.amount = 'Please enter amount';
      console.log('❌ Amount validation failed - empty');
    } else if (isNaN(parseFloat(newAdvance.amount))) {
      newErrors.amount = 'Amount must be a valid number';
      console.log('❌ Amount validation failed - not a number');
    } else if (parseFloat(newAdvance.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
      console.log('❌ Amount validation failed - not greater than 0');
    }

    console.log('🔍 Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 Form is valid:', isValid);
    return isValid;
  };

  const saveAdvance = async () => {
    console.log('🔍 Save advance called');
    console.log('🔍 Current newAdvance:', newAdvance);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    try {
      const advanceData = {
        ...newAdvance,
        date: newAdvance.date.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        userId: currentUser?.$id || 'local'
      };
      
      console.log('🔍 Advance data to save:', advanceData);

      if (isEditMode && editingRecord) {
        // Update existing record
        console.log('🔍 Updating existing record');
        await handleDataDelete(editingRecord.$id, 'advances');
        await handleDataSubmit(advanceData, 'advances');
        
        // Removed success toast
      } else {
        // Create new record
        console.log('🔍 Creating new record');
        await handleDataSubmit(advanceData, 'advances');

      // Removed success toast
      }

      setShowAddModal(false);
      setNewAdvance({
        employeeId: '',
        employeeName: '',
        date: new Date(),
        amount: '',
        description: '',
        documentUrl: ''
      });
      setSelectedDocument(null);
      setErrors({});
      setIsEditMode(false);
      setEditingRecord(null);
      fetchAdvanceRecords();
    } catch (error) {
      console.error('Error saving advance:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save advance record'
      });
    }
  };

  const editAdvance = (record) => {
    setIsEditMode(true);
    setEditingRecord(record);
    setNewAdvance({
      employeeId: record.employeeId || '',
      employeeName: record.employeeName || '',
      date: new Date(record.date),
      amount: record.amount || '',
      description: record.description || '',
      documentUrl: record.documentUrl || ''
    });
    setSelectedDocument(record.documentName ? { name: record.documentName } : null);
    setShowAddModal(true);
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const deleteAdvance = async () => {
    try {
      const recordId = recordToDelete.$id;
      const key = `advances_${recordId}`;
      await handleDataDelete(key, recordId, 'advances');
              
              // Removed success toast
      
      setShowDeleteModal(false);
      setRecordToDelete(null);
      fetchAdvanceRecords();
            } catch (error) {
              console.error('Error deleting advance:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete advance record'
              });
            }
  };

  const toggleDescriptionExpansion = (recordId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const renderDescription = (description, recordId) => {
    if (!description) return null;
    
    console.log('🔍 Rendering description for record:', recordId);
    console.log('🔍 Description length:', description.length);
    console.log('🔍 Description text:', description);
    console.log('🔍 Should show see more:', description.length > 100);
    console.log('🔍 Expanded state:', expandedDescriptions[recordId]);
    
    return (
      <View style={styles.remarksContainer}>
        <Text style={styles.remarksLabel}>Description:</Text>
        <Text 
          style={styles.remarksText} 
          numberOfLines={expandedDescriptions[recordId] ? undefined : 3} 
          ellipsizeMode="tail"
        >
          {description}
        </Text>
        {description.length > 100 && (
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => toggleDescriptionExpansion(recordId)}
          >
            <Text style={styles.seeMoreText}>
              {expandedDescriptions[recordId] ? 'See less' : 'See more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Calculate totals
  const totalAmount = filteredAdvanceRecords.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);
  const pendingRecords = filteredAdvanceRecords.filter(record => !record.synced || record.status === 'pending').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading advance records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.pending} size={20} color={getSummaryIconColor('pending')} />
          </View>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>{pendingRecords}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.totalRecords} size={20} color={getSummaryIconColor('totalRecords')} />
          </View>
          <Text style={styles.summaryLabel}>Total Records</Text>
          <Text style={styles.summaryValue}>{filteredAdvanceRecords.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.totalAmount} size={20} color={getSummaryIconColor('totalAmount')} />
          </View>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <NumberFormatter value={totalAmount} type="currency" style={styles.summaryValue} />
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearch}
        placeholder="Search advance records..."
      />

      {/* Records List */}
        {filteredAdvanceRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={icons.document} size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Records Found' : 'No Advance Records'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first advance record'}
            </Text>
          </View>
        ) : (
          filteredAdvanceRecords.map((record) => (
            <View key={record.$id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <Ionicons name={icons.avatar} size={20} color={colors.white} />
                  </View>
                <Text style={styles.employeeName}>{record.employeeName}</Text>
                </View>
                <View style={styles.recordActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editAdvance(record)}>
                    <Ionicons name={icons.edit} size={18} color={getIconColor('primary')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(record)}>
                    <Ionicons name={icons.delete} size={18} color={getIconColor('danger')} />
                </TouchableOpacity>
                </View>
              </View>
              <View style={styles.recordDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.date} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{record.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.amount} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <NumberFormatter value={record.amount} type="currency" style={styles.detailValue} />
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.description} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{record.description}</Text>
                </View>
                {record.documentName && (
                  <View style={styles.detailRow}>
                    <Ionicons name={icons.document} size={16} color={getDetailIconColor()} />
                    <Text style={styles.detailLabel}>Document:</Text>
                    <Text style={styles.detailValue}>{record.documentName}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Advance Record' : 'Add New Advance Record'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formLabel}>Employee</Text>
              <SelectDropdown
                data={employees.map(emp => ({
                  label: emp.fullName || emp.name || emp.employeeName,
                  value: emp.$id
                }))}
                onSelect={handleEmployeeSelect}
                placeholder="Select employee"
                defaultValue={newAdvance.employeeId}
                style={[styles.employeeSelector, errors.employeeId && styles.errorInput]}
              />
              {errors.employeeId && <Text style={styles.errorText}>{errors.employeeId}</Text>}

              <Text style={styles.formLabel}>Date</Text>
              <DatePickerField
                value={newAdvance.date}
                onChange={(date) => setNewAdvance(prev => ({ ...prev, date }))}
                style={styles.datePicker}
              />

              <Text style={styles.formLabel}>Amount</Text>
              <InputField
                value={newAdvance.amount}
                onChangeText={(text) => setNewAdvance(prev => ({ ...prev, amount: text }))}
                placeholder="Enter amount"
                keyboardType="numeric"
                style={[styles.amountInput, errors.amount && styles.errorInput]}
              />
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

              <Text style={styles.formLabel}>Description</Text>
              <InputField
                value={newAdvance.description}
                onChangeText={(text) => setNewAdvance(prev => ({ ...prev, description: text }))}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
                style={[styles.descriptionInput, errors.description && styles.errorInput]}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

              <Text style={styles.formLabel}>Document (Optional)</Text>
              <TouchableOpacity style={styles.documentPicker} onPress={pickDocument}>
                <Ionicons name="document-outline" size={24} color="#333" />
                <Text style={styles.documentPickerText}>
                  {selectedDocument ? selectedDocument.name : 'Pick a document'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveAdvance}>
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Update Record' : 'Save Record'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Delete</Text>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.modalText}>
                Are you sure you want to delete this advance record? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#dc3545' }]}
                  onPress={deleteAdvance}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
      </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => {
          setIsEditMode(false);
          setEditingRecord(null);
          setNewAdvance({
            employeeId: '',
            employeeName: '',
            date: new Date(),
            amount: '',
            description: '',
            documentUrl: ''
          });
          setSelectedDocument(null);
          setErrors({});
          setShowAddModal(true);
        }}
      >
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
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
  recordsContainer: {
    flex: 1,
    padding: 16,
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
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  remarksContainer: {
    marginTop: 8,
    paddingHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  remarksLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    paddingHorizontal: 5,
  },
  remarksText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 5,
    lineHeight: 20,
  },
  seeMoreButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginTop: 4,
    marginBottom: 4,
  },
  seeMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  employeeSelector: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  errorInput: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  datePicker: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  amountInput: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  descriptionInput: {
    height: 80,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  documentPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 8,
  },
  documentPickerText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvanceScreen; 