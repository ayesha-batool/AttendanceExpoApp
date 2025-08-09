import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataUpdate, useNetworkStatus } from '../../services/dataHandler';
import {
    colors,
    getDetailIconColor,
    getIconColor,
    getSummaryIconColor,
    icons
} from '../../styles/designSystem';

const FinesScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [finesRecords, setFinesRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newFine, setNewFine] = useState({
    businessName: '',
    date: new Date(),
    fineType: '',
    amount: '',
    reason: '',
    status: 'pending'
  });

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchFinesRecords();
  }, []);

  // Refresh data when returning to the page
  useFocusEffect(
    React.useCallback(() => {
      fetchFinesRecords();
    }, [])
  );

  // Filter fines records based on search query and status
  const filteredFinesRecords = finesRecords.filter(record => {
    const matchesSearch = !searchQuery || 
      record.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.fineType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.amount?.toString().includes(searchQuery) ||
      record.date?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearSearch = () => {
    setSearchQuery('');
  };



  const fetchFinesRecords = async () => {
    try {
      const records = await getItems('fines');
      console.log('📦 Fetched fines records:', records);
      setFinesRecords(records);
    } catch (error) {
      console.error('Error fetching fines records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessNameChange = (text) => {
    setNewFine(prev => ({
      ...prev,
      businessName: text
    }));
    setErrors(prev => ({ ...prev, businessName: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newFine.businessName || newFine.businessName.trim() === '') {
      newErrors.businessName = 'Please enter business name';
    }

    if (!newFine.fineType || newFine.fineType.trim() === '') {
      newErrors.fineType = 'Please enter fine type';
    }

    if (!newFine.amount || newFine.amount.trim() === '') {
      newErrors.amount = 'Please enter amount';
    } else if (isNaN(parseFloat(newFine.amount)) || parseFloat(newFine.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!newFine.reason || newFine.reason.trim() === '') {
      newErrors.reason = 'Please enter reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveFine = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const fineData = {
        ...newFine,
        date: newFine.date.toISOString().split('T')[0],
        amount: parseFloat(newFine.amount),
        createdAt: new Date().toISOString(),
        synced: isConnected,
        userId: currentUser?.$id || 'unknown'
      };

      console.log('📦 Saving fine:', fineData);

      if (isEditMode && editingRecord) {
        // Update existing record
        await handleDataUpdate(`Fines_${editingRecord.$id}`, editingRecord.$id, 'fines', fineData);
        setFinesRecords(prev => prev.map(record => 
          record.$id === editingRecord.$id ? { ...record, ...fineData } : record
        ));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Fine updated successfully'
        });
      } else {
        // Create new record
        const newFineRecord = {
          $id: Date.now().toString(),
          ...fineData
        };
        setFinesRecords(prev => [newFineRecord, ...prev]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Fine added successfully'
        });
      }

      setShowAddModal(false);
      setNewFine({
        employeeId: '',
        employeeName: '',
        date: new Date(),
        fineType: '',
        amount: '',
        reason: '',
        status: 'pending'
      });
      setErrors({});
      setIsEditMode(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving fine:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save fine'
      });
    }
  };

  const editFine = (record) => {
    console.log('📦 Editing fine:', record);
    setIsEditMode(true);
    setEditingRecord(record);
    setNewFine({
      businessName: record.businessName || record.employeeName || '',
      date: new Date(record.date),
      fineType: record.fineType,
      amount: record.amount.toString(),
      reason: record.reason,
      status: record.status
    });
    setErrors({});
    setShowAddModal(true);
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const deleteFine = async () => {
    if (!recordToDelete) return;

    try {
      console.log('📦 Deleting fine:', recordToDelete.$id);
      
      await handleDataDelete(`Fines_${recordToDelete.$id}`, recordToDelete.$id, 'fines');
      
      setFinesRecords(prev => prev.filter(record => record.$id !== recordToDelete.$id));
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Fine deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting fine:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete fine'
      });
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const updateFineStatus = (recordId, newStatus) => {
    setFinesRecords(prev => prev.map(record => 
      record.$id === recordId ? { ...record, status: newStatus } : record
    ));
  };

  // Calculate totals
  const totalFines = filteredFinesRecords.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);
  const pendingFines = filteredFinesRecords.filter(record => record.status === 'pending').length;
  const paidFines = filteredFinesRecords.filter(record => record.status === 'paid').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading fines records...</Text>
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
              <Ionicons name={icons.totalAmount} size={20} color={getSummaryIconColor('totalAmount')} />
            </View>
            <Text style={styles.summaryLabel}>Total Fines</Text>
            <NumberFormatter value={totalFines} type="currency" style={styles.summaryValue} />
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.pending} size={20} color={getSummaryIconColor('pending')} />
            </View>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{pendingFines}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.paid} size={20} color={getSummaryIconColor('paid')} />
            </View>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>{paidFines}</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={clearSearch}
          placeholder="Search fines..."
        />

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Status:</Text>
          <View style={styles.filterButtons}>
            {['all', 'pending', 'paid', 'waived'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  statusFilter === status && styles.activeFilterButton
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.activeFilterButtonText
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fines Records List */}
        {filteredFinesRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={icons.warning} size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>
              {searchQuery || statusFilter !== 'all' ? 'No Records Found' : 'No Fines Records'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Start by adding your first fine record'}
            </Text>
          </View>
        ) : (
          filteredFinesRecords.map((record) => (
            <View key={record.$id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <Ionicons name="business-outline" size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.employeeName}>{record.businessName || record.employeeName}</Text>
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                </View>
                <View style={styles.recordActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editFine(record)}>
                    <Ionicons name={icons.edit} size={18} color={getIconColor('primary')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(record)}>
                    <Ionicons name={icons.delete} size={18} color={getIconColor('danger')} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.recordDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.category} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{record.fineType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.amount} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <NumberFormatter value={record.amount} type="currency" style={styles.detailValue} />
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.description} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{record.reason}</Text>
                </View>
              </View>
              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusButtons}>
                  {['pending', 'paid', 'waived'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        record.status === status && styles.activeStatusButton,
                        record.status === status && styles[`${status}StatusButton`]
                      ]}
                      onPress={() => updateFineStatus(record.$id, status)}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        record.status === status && styles.activeStatusButtonText
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                {isEditMode ? 'Edit Fine Record' : 'Add New Fine Record'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Business Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Name *</Text>
                <InputField
                  value={newFine.businessName}
                  onChangeText={handleBusinessNameChange}
                  placeholder="Enter business name"
                  error={errors.businessName}
                  style={styles.businessNameInput}
                />
              </View>

              {/* Date Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <DatePickerField
                  value={newFine.date}
                  onChange={(date) => setNewFine(prev => ({ ...prev, date }))}
                  style={styles.datePicker}
                />
              </View>

              {/* Fine Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fine Type *</Text>
                <InputField
                  value={newFine.fineType}
                  onChangeText={(text) => setNewFine(prev => ({ ...prev, fineType: text }))}
                  placeholder="Enter fine type"
                  error={errors.fineType}
                  style={styles.fineTypeInput}
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount *</Text>
                <InputField
                  value={newFine.amount}
                  onChangeText={(text) => setNewFine(prev => ({ ...prev, amount: text }))}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  isAmount={true}
                  error={errors.amount}
                  style={styles.amountInput}
                />
              </View>

              {/* Reason */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reason *</Text>
                <InputField
                  value={newFine.reason}
                  onChangeText={(text) => setNewFine(prev => ({ ...prev, reason: text }))}
                  placeholder="Enter reason for fine"
                  multiline
                  numberOfLines={3}
                  error={errors.reason}
                  style={styles.reasonInput}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={saveFine}>
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
                Are you sure you want to delete this fine record? This action cannot be undone.
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
                  onPress={deleteFine}
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
          setNewFine({
            businessName: '',
            date: new Date(),
            fineType: '',
            amount: '',
            reason: '',
            status: 'pending'
          });
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
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
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  activeFilterButtonText: {
    color: '#fff',
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
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeStatusButton: {
    borderColor: '#007AFF',
  },
  pendingStatusButton: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  paidStatusButton: {
    backgroundColor: '#d1edff',
    borderColor: '#28a745',
  },
  waivedStatusButton: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  activeStatusButtonText: {
    color: '#007AFF',
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
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  businessNameInput: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  errorInput: {
    borderColor: '#dc3545',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
  datePicker: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  fineTypeInput: {
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
  reasonInput: {
    height: 80,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
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
});

export default FinesScreen; 