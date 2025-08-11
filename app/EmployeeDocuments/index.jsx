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
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataUpdate, useNetworkStatus } from '../../services/dataHandler';
import {
    colors,
    getDetailIconColor,
    getIconColor,
    getSummaryIconColor,
    icons
} from '../../styles/designSystem';

const EmployeeDocumentsScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [documentRecords, setDocumentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newDocument, setNewDocument] = useState({
    employeeId: '',
    employeeName: '',
    documentType: '',
    documentName: '',
    documentUrl: '',
    issueDate: new Date(),
    expiryDate: null,
    description: '',
    status: 'active'
  });

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  const documentTypes = [
    'ID Card', 'Passport', 'Driver License', 'Work Permit', 
    'Contract', 'Certificate', 'Medical Report', 'Background Check', 
    'Reference Letter', 'Other'
  ];

  useEffect(() => {
    fetchEmployees();
    fetchDocumentRecords();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDocumentRecords();
    }, [])
  );

  const filteredDocumentRecords = documentRecords.filter(record => {
    const matchesSearch = !searchQuery || 
      record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clearSearch = () => {
    setSearchQuery('');
  };

  const fetchEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      
      if (!employeeData || employeeData.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Employees',
          text2: 'No employees found. Please add employees first.'
        });
        setEmployees([]);
        return;
      }
      
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch employees'
      });
      setEmployees([]);
    }
  };

  const fetchDocumentRecords = async () => {
    try {
      const records = await getItems('employeeDocuments');
      setDocumentRecords(records);
    } catch (error) {
      console.error('Error fetching document records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    const selectedEmployee = employees.find(emp => emp.$id === employeeId);
    if (selectedEmployee) {
      setNewDocument(prev => ({
        ...prev,
        employeeId: selectedEmployee.$id,
        employeeName: selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName
      }));
      setErrors(prev => ({ ...prev, employeeId: null }));
    }
  };

  const handleDocumentTypeSelect = (documentType) => {
    setNewDocument(prev => ({ ...prev, documentType }));
    setErrors(prev => ({ ...prev, documentType: null }));
  };

  const pickDocument = async () => {
    // Temporarily disabled due to DocumentPicker issues
    Toast.show({
      type: 'info',
      text1: 'Upload Disabled',
      text2: 'Document upload is temporarily disabled. Please contact support.',
      position: 'top',
    });
    
    // Original code commented out:
    // try {
    //   const result = await DocumentPicker.getDocumentAsync({
    //     type: '*/*',
    //     copyToCacheDirectory: true,
    //   });

    //   if (!result.canceled && result.assets[0]) {
    //     const document = result.assets[0];
    //     setSelectedDocument(document);
    //     setNewDocument(prev => ({
    //       ...prev,
    //       documentUrl: document.uri,
    //       documentName: document.name
    //     }));
    //     setErrors(prev => ({ ...prev, documentName: null }));
    //   }
    // } catch (error) {
    //   console.error('Error picking document:', error);
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'Failed to pick document'
    //   });
    // }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newDocument.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    if (!newDocument.documentType || newDocument.documentType.trim() === '') {
      newErrors.documentType = 'Please select document type';
    }

    if (!newDocument.documentName || newDocument.documentName.trim() === '') {
      newErrors.documentName = 'Please upload a document';
    }

    if (!newDocument.description || newDocument.description.trim() === '') {
      newErrors.description = 'Please enter description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDocument = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const documentData = {
        ...newDocument,
        issueDate: newDocument.issueDate.toISOString().split('T')[0],
        expiryDate: newDocument.expiryDate ? newDocument.expiryDate.toISOString().split('T')[0] : null,
        createdAt: new Date().toISOString(),
        synced: isConnected,
        userId: currentUser?.$id || 'unknown'
      };

      if (isEditMode && editingRecord) {
        await handleDataUpdate(`EmployeeDocuments_${editingRecord.$id}`, editingRecord.$id, 'employeeDocuments', documentData);
        setDocumentRecords(prev => prev.map(record => 
          record.$id === editingRecord.$id ? { ...record, ...documentData } : record
        ));
        // Removed success toast
      } else {
        const newDocumentRecord = {
          $id: Date.now().toString(),
          ...documentData
        };
        setDocumentRecords(prev => [newDocumentRecord, ...prev]);
        // Removed success toast
      }

      setShowAddModal(false);
      setNewDocument({
        employeeId: '',
        employeeName: '',
        documentType: '',
        documentName: '',
        documentUrl: '',
        issueDate: new Date(),
        expiryDate: null,
        description: '',
        status: 'active'
      });
      setSelectedDocument(null);
      setErrors({});
      setIsEditMode(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving document:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save document'
      });
    }
  };

  const editDocument = (record) => {
    setIsEditMode(true);
    setEditingRecord(record);
    setNewDocument({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      documentType: record.documentType,
      documentName: record.documentName,
      documentUrl: record.documentUrl,
      issueDate: new Date(record.issueDate),
      expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
      description: record.description,
      status: record.status
    });
    setSelectedDocument(record.documentName ? { name: record.documentName } : null);
    setErrors({});
    setShowAddModal(true);
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const deleteDocument = async () => {
    if (!recordToDelete) return;

    try {
      await handleDataDelete(`EmployeeDocuments_${recordToDelete.$id}`, recordToDelete.$id, 'employeeDocuments');
      setDocumentRecords(prev => prev.filter(record => record.$id !== recordToDelete.$id));
      // Removed success toast
    } catch (error) {
      console.error('Error deleting document:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete document'
      });
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const updateDocumentStatus = (recordId, newStatus) => {
    setDocumentRecords(prev => prev.map(record => 
      record.$id === recordId ? { ...record, status: newStatus } : record
    ));
  };

  const getDocumentIcon = (documentType) => {
    switch (documentType?.toLowerCase()) {
      case 'id card':
        return 'card-outline';
      case 'passport':
        return 'passport-outline';
      case 'driver license':
        return 'car-outline';
      case 'work permit':
        return 'briefcase-outline';
      case 'contract':
        return 'document-text-outline';
      case 'certificate':
        return 'ribbon-outline';
      case 'medical report':
        return 'medical-outline';
      case 'background check':
        return 'shield-checkmark-outline';
      case 'reference letter':
        return 'mail-outline';
      default:
        return 'document-outline';
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const totalDocuments = filteredDocumentRecords.length;
  const activeDocuments = filteredDocumentRecords.filter(record => record.status === 'active').length;
  const expiredDocuments = filteredDocumentRecords.filter(record => isExpired(record.expiryDate)).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading document records...</Text>
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
              <Ionicons name={icons.totalRecords} size={20} color={getSummaryIconColor('totalRecords')} />
            </View>
            <Text style={styles.summaryLabel}>Total Documents</Text>
            <Text style={styles.summaryValue}>{totalDocuments}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.active} size={20} color={getSummaryIconColor('active')} />
            </View>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={styles.summaryValue}>{activeDocuments}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.expired} size={20} color={getSummaryIconColor('expired')} />
            </View>
            <Text style={styles.summaryLabel}>Expired</Text>
            <Text style={styles.summaryValue}>{expiredDocuments}</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={clearSearch}
          placeholder="Search documents..."
        />

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Status:</Text>
          <View style={styles.filterButtons}>
            {['all', 'active', 'inactive'].map((status) => (
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

        {/* Document Records List */}
        {filteredDocumentRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={icons.document} size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>
              {searchQuery || statusFilter !== 'all' ? 'No Records Found' : 'No Document Records'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Start by adding your first document record'}
            </Text>
          </View>
        ) : (
          filteredDocumentRecords.map((record) => (
            <View key={record.$id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <Ionicons name={icons.avatar} size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.employeeName}>{record.employeeName}</Text>
                    <Text style={styles.recordDate}>Issue: {record.issueDate}</Text>
                  </View>
                </View>
                <View style={styles.recordActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editDocument(record)}>
                    <Ionicons name={icons.edit} size={18} color={getIconColor('primary')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(record)}>
                    <Ionicons name={icons.delete} size={18} color={getIconColor('danger')} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.recordDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name={getDocumentIcon(record.documentType)} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{record.documentType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.document} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>File:</Text>
                  <Text style={styles.detailValue}>{record.documentName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name={icons.description} size={16} color={getDetailIconColor()} />
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{record.description}</Text>
                </View>
                {record.expiryDate && (
                  <View style={styles.detailRow}>
                    <Ionicons 
                      name={isExpired(record.expiryDate) ? icons.expired : isExpiringSoon(record.expiryDate) ? icons.warning : icons.calendar} 
                      size={16} 
                      color={isExpired(record.expiryDate) ? '#dc3545' : isExpiringSoon(record.expiryDate) ? '#ffc107' : getDetailIconColor()} 
                    />
                    <Text style={styles.detailLabel}>Expiry:</Text>
                    <Text style={[
                      styles.detailValue,
                      isExpired(record.expiryDate) && styles.expiredText,
                      isExpiringSoon(record.expiryDate) && styles.expiringSoonText
                    ]}>
                      {record.expiryDate}
                      {isExpired(record.expiryDate) && ' (Expired)'}
                      {isExpiringSoon(record.expiryDate) && ' (Expiring Soon)'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusButtons}>
                  {['active', 'inactive'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        record.status === status && styles.activeStatusButton,
                        record.status === status && styles[`${status}StatusButton`]
                      ]}
                      onPress={() => updateDocumentStatus(record.$id, status)}
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
                {isEditMode ? 'Edit Document Record' : 'Add New Document Record'}
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
                placeholder={employees.length === 0 ? "No employees available" : "Select employee"}
                defaultValue={newDocument.employeeId}
                style={[styles.employeeSelector, errors.employeeId && styles.errorInput]}
              />
              {errors.employeeId && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.employeeId}</Text>
                </View>
              )}
              {employees.length === 0 && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={16} color="#ffc107" />
                  <Text style={styles.warningText}>No employees found. Please add employees first.</Text>
                </View>
              )}

              <Text style={styles.formLabel}>Document Type</Text>
              <SelectDropdown
                data={documentTypes.map(type => ({
                  label: type,
                  value: type
                }))}
                onSelect={handleDocumentTypeSelect}
                placeholder="Select document type"
                defaultValue={newDocument.documentType}
                style={[styles.documentTypeSelector, errors.documentType && styles.errorInput]}
              />
              {errors.documentType && <Text style={styles.errorText}>{errors.documentType}</Text>}

              <Text style={styles.formLabel}>Issue Date</Text>
              <DatePickerField
                value={newDocument.issueDate}
                onChange={(date) => setNewDocument(prev => ({ ...prev, issueDate: date }))}
                style={styles.issueDatePicker}
              />

              <Text style={styles.formLabel}>Expiry Date (Optional)</Text>
              <DatePickerField
                value={newDocument.expiryDate}
                onChange={(date) => setNewDocument(prev => ({ ...prev, expiryDate: date }))}
                style={styles.expiryDatePicker}
              />

              <Text style={styles.formLabel}>Document File</Text>
              <TouchableOpacity style={styles.documentPicker} onPress={pickDocument}>
                <Ionicons name="document-outline" size={24} color="#333" />
                <Text style={styles.documentPickerText}>
                  {selectedDocument ? selectedDocument.name : 'Pick a document'}
                </Text>
              </TouchableOpacity>
              {errors.documentName && <Text style={styles.errorText}>{errors.documentName}</Text>}

              <Text style={styles.formLabel}>Description</Text>
              <InputField
                value={newDocument.description}
                onChangeText={(text) => setNewDocument(prev => ({ ...prev, description: text }))}
                placeholder="Enter document description"
                multiline
                numberOfLines={3}
                error={errors.description}
                style={styles.descriptionInput}
              />

              <TouchableOpacity style={styles.saveButton} onPress={saveDocument}>
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
                Are you sure you want to delete this document record? This action cannot be undone.
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
                  onPress={deleteDocument}
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
          setNewDocument({
            employeeId: '',
            employeeName: '',
            documentType: '',
            documentName: '',
            documentUrl: '',
            issueDate: new Date(),
            expiryDate: null,
            description: '',
            status: 'active'
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
  expiredText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  expiringSoonText: {
    color: '#ffc107',
    fontWeight: '600',
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
  activeStatusButton: {
    backgroundColor: '#d1edff',
    borderColor: '#28a745',
  },
  inactiveStatusButton: {
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
  documentTypeSelector: {
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
    color: '#721c24',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  warningContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  issueDatePicker: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  expiryDatePicker: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
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

export default EmployeeDocumentsScreen; 