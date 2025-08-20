import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePickerField from '../../components/DatePickerField';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import InputField from '../../components/InputField';
import LoadingOverlay from '../../components/LoadingOverlay';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { useCasesContext } from '../../context/CasesContext';
import { backgroundSyncService, customOptionsService, dataService, syncMonitor } from '../../services/unifiedDataService';
import { validateForm, VALIDATION_SCHEMAS } from '../../utils/validation';

const CasesScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useCasesContext();
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modals, setModals] = useState({ case: false, delete: false, details: false });
  const [selected, setSelected] = useState({ case: null, deleteCase: null, isEdit: false, editCase: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'active', priority: 'medium', 
    assignedOfficer: '', location: '', category: '', evidence: '', notes: '', startDate: '', endDate: ''
  });
  const [errors, setErrors] = useState({});

  const [statusOptions, setStatusOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [customToast, setCustomToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ hasPendingItems: false, pendingCount: 0 });

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  const updateModal = (key, value) => {
    setModals(prev => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  };
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));
  const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  // Load dropdown options from custom options service
  const checkSyncStatus = async () => {
    try {
      const status = await syncMonitor.getStatus();
      setSyncStatus({
        hasPendingItems: status.hasPendingItems,
        pendingCount: status.pendingCount
      });
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      // First, try to initialize default options if they don't exist
      const status = await customOptionsService.checkDefaultOptionsStatus();
      const needsInitialization = Object.values(status).some(item => !item.hasLocal);
      if (needsInitialization) {
        console.log('Initializing default options...');
        await customOptionsService.initializeDefaultOptions();
      }

      const [statusData, priorityData, categoryData] = await Promise.all([
        customOptionsService.getOptions('case_status'),
        customOptionsService.getOptions('case_priority'),
        customOptionsService.getOptions('case_categories')
      ]);

      console.log('Loaded options:', { statusData, priorityData, categoryData });

      // Check if arrays are valid
      const validStatusData = Array.isArray(statusData) ? statusData : [];
      const validPriorityData = Array.isArray(priorityData) ? priorityData : [];
      const validCategoryData = Array.isArray(categoryData) ? categoryData : [];

      console.log('Valid options:', { validStatusData, validPriorityData, validCategoryData });

      setStatusOptions(validStatusData.map(status => ({ label: status, value: status.toLowerCase().replace(/\s+/g, '_') })));
      setPriorityOptions(validPriorityData.map(priority => ({ label: priority, value: priority.toLowerCase() })));
      setCategoryOptions(validCategoryData.map(category => ({ label: category, value: category })));
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      // Set default options if loading fails
      setStatusOptions([
        { label: 'Active', value: 'active' },
        { label: 'Under Investigation', value: 'under_investigation' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Closed', value: 'closed' }
      ]);
      setPriorityOptions([
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ]);
      setCategoryOptions([
        { label: 'Theft', value: 'theft' },
        { label: 'Assault', value: 'assault' },
        { label: 'Fraud', value: 'fraud' },
        { label: 'Other', value: 'other' }
      ]);
    }
  };

  const handleOptionAdded = (newOption, fieldName) => {
    showCustomToast('success', 'Success', `New ${fieldName.replace('_', ' ')} added successfully`);
    setTimeout(() => setCustomToast(null), 3000);
    loadDropdownOptions(); // Refresh options
  };

  const handleOptionRemoved = (removedOption, fieldName) => {
    showCustomToast('success', 'Success', `${fieldName.replace('_', ' ')} removed successfully`);
    setTimeout(() => setCustomToast(null), 3000);
    loadDropdownOptions(); // Refresh options
  };

  const validateFormData = () => {
    try {
      const formToValidate = {
        title: formData.title || "",
        status: formData.status || "",
        priority: formData.priority || "",
        category: formData.category || "",
        description: formData.description || "",
        location: formData.location || "",
        startDate: formData.startDate || new Date().toISOString().split('T')[0]
      };

      const validation = validateForm(formToValidate, VALIDATION_SCHEMAS.case);

      // Custom validations
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate < startDate) {
          validation.errors.endDate = "End date cannot be before start date";
          validation.isValid = false;
        }
      }

      setErrors(validation.errors);
      return validation.isValid;
    } catch (error) {
      setErrors({ general: "Validation failed due to an unexpected error" });
      return false;
    }
  };

  const handleDeleteCancel = () => { updateModal('delete', false); updateSelected('deleteCase', null); };

  const getStatusColor = (status) => ({
    active: '#10b981', investigation: '#f59e0b', pending: '#3b82f6',
    closed: '#6b7280', archived: '#9ca3af'
  }[status] || '#6b7280');

  const getPriorityColor = (priority) => ({
    low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626'
  }[priority] || '#6b7280');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [casesData, employeesData] = await Promise.all([
        dataService.getItems('cases'),
        dataService.getItems('employees')
      ]);
      
    
      const validCases = casesData.filter(item => item && typeof item === 'object');
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      
      setCases(validCases);
      setFilteredCases(validCases);
      setEmployees(validEmployees);
      
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        console.log('🔐 Authentication required, redirecting to auth page');
        // Redirect to auth page
        router.replace('/auth');
        return;
      }
      console.error('❌ Failed to load cases data:', error);
      showCustomToast('error', 'Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchQuery.trim()) {
      setFilteredCases(cases);
      return;
    }
    const filtered = cases.filter(caseItem =>
      ['title', 'description', 'category', 'status', 'priority', 'location', 'assignedOfficer', 'evidence', 'notes']
        .some(field => caseItem[field]?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredCases(filtered);
  };

  const handleAdd = () => {
    updateSelected('isEdit', false);
    updateSelected('editCase', null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '', description: '', status: 'active', priority: 'medium', assignedOfficer: '',
      startDate: today, endDate: '',
      location: '', category: '', evidence: '', notes: ''
    });
    updateModal('case', true);
  };

  const handleEdit = (caseItem) => {
    updateSelected('isEdit', true);
    updateSelected('editCase', caseItem);
    setFormData({ ...caseItem });
    updateModal('case', true);
  };

  const handleDelete = (caseItem) => {
    updateSelected('deleteCase', caseItem);
    updateModal('delete', true);
  };

  const handleView = (caseItem) => {
    updateSelected('case', caseItem);
    updateModal('details', true);
  };

  const saveCase = async () => {
    if (isSaving) {
      showCustomToast('error', 'Error', 'Please wait, saving in progress...');
      return;
    }

    // Validate form data
    const isValid = validateFormData();
    if (!isValid) {
      // Get the first error from the current errors state
      const errorMessages = Object.values(errors).filter(error => error && error.trim() !== '');
      const firstError = errorMessages.length > 0 ? errorMessages[0] : 'Please check the form and try again';
      
      showCustomToast('error', 'Validation Error', firstError);
      setTimeout(() => setCustomToast(null), 4000);
      return;
    }

    try {
      setIsSaving(true);
      
      const caseData = { 
        ...formData, 
      
      };
      
      if (selected.isEdit && selected.editCase) {
        const caseId = selected.editCase.id || selected.editCase.$id;
        const key = `cases_${caseId}`;
        
        await dataService.updateData(key, caseId, caseData, 'cases');
        
        const updatedCase = { ...caseData, id: caseId, $id: caseId };
        setCases(prev => prev.map(c => (c.id || c.$id) === caseId ? updatedCase : c));
        setFilteredCases(prev => prev.map(c => (c.id || c.$id) === caseId ? updatedCase : c));
        showCustomToast('success', 'Success', 'Case updated successfully');
        setTimeout(() => setCustomToast(null), 3000);
      } else {
        const newCase = await dataService.saveData(caseData, 'cases');
        
        const caseWithId = { ...newCase, id: newCase.$id || newCase.id, $id: newCase.$id || newCase.id };
        setCases(prev => [...prev, caseWithId]);
        setFilteredCases(prev => [...prev, caseWithId]);
        showCustomToast('success', 'Success', 'Case added successfully');
        setTimeout(() => setCustomToast(null), 3000);
      }
      
      // Close modal and reset state
      updateModal('case', false);
      updateSelected('isEdit', false);
      updateSelected('editCase', null);
      setFormData({ title: '', description: '', status: 'active', priority: 'medium', assignedOfficer: '', location: '', category: '', evidence: '', notes: '', startDate: '', endDate: '' });
      
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        console.log('🔐 Authentication required, redirecting to auth page');
        router.replace('/auth');
        return;
      }
      console.error('Failed to save case:', error);
      showCustomToast('error', 'Error', error.message || 'Failed to save case');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selected.deleteCase) return;
    
    try {
      setIsDeleting(true);
      
      const caseId = selected.deleteCase.id || selected.deleteCase.$id;
      const key = `cases_${caseId}`;
      
              await dataService.deleteData(key, caseId, 'cases');
      
      setCases(prev => prev.filter(c => (c.id || c.$id) !== caseId));
      setFilteredCases(prev => prev.filter(c => (c.id || c.$id) !== caseId));
      showCustomToast('success', 'Success', 'Case deleted successfully');
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        console.log('🔐 Authentication required, redirecting to auth page');
        router.replace('/auth');
        return;
      }
      console.error('Failed to delete case:', error);
      showCustomToast('error', 'Error', error.message || 'Failed to delete case');
    } finally {
      updateModal('delete', false);
      updateSelected('deleteCase', null);
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await dataService.manualSync();
      if (result.success) {
        showCustomToast('success', 'Success', 'Sync completed successfully');
        // Refresh data after sync
        await fetchData();
      } else {
        showCustomToast('error', 'Error', result.message);
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      showCustomToast('error', 'Error', 'Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    closed: cases.filter(c => c.status === 'closed').length,
    high: cases.filter(c => ['high', 'critical'].includes(c.priority)).length
  };

  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { 
    fetchData(); 
    loadDropdownOptions();
    checkSyncStatus();
  }, []));
  useEffect(() => { applySearch(); }, [searchQuery, cases]);

  if (loading) return <LoadingState />;

  const employeeOptions = employees.map(emp => ({ label: `${emp.fullName} (${emp.rank || 'N/A'})`, value: emp.fullName, id: emp.id }));

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <View style={styles.statRow}>
          <StatCard icon="folder" color="#dc2626" value={stats.total} label="Total Cases" />
          <StatCard icon="alert-circle" color="#f59e0b" value={stats.active} label="Active Cases" />
        </View>
        <View style={styles.statRow}>
          <StatCard icon="checkmark-circle" color="#10b981" value={stats.closed} label="Closed Cases" />
          <StatCard icon="warning" color="#ef4444" value={stats.high} label="High Priority" />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search cases..." onClear={() => setSearchQuery('')} />
        <TouchableOpacity 
          style={styles.initButton} 
          onPress={async () => {
            try {
              await customOptionsService.initializeDefaultOptions();
              await loadDropdownOptions();
              showCustomToast('success', 'Success', 'Options initialized successfully');
            } catch (error) {
              showCustomToast('error', 'Error', 'Failed to initialize options');
            }
          }}
        >
          <Text style={styles.initButtonText}>Init Options</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.syncButton, syncStatus.hasPendingItems && styles.syncButtonPending]} 
          onPress={async () => {
            try {
              const result = await backgroundSyncService.syncPendingChanges(currentUser);
              if (result.success) {
                showCustomToast('success', 'Sync Complete', result.message);
                await fetchData(); // Reload cases after sync
                await checkSyncStatus(); // Update sync status
              } else {
                showCustomToast('error', 'Sync Failed', result.message);
              }
            } catch (error) {
              if (error.code === 'AUTH_REQUIRED') {
                console.log('🔐 Authentication required, redirecting to auth page');
                router.replace('/auth');
                return;
              }
              showCustomToast('error', 'Sync Error', error.message);
            }
          }}
        >
          <Text style={styles.syncButtonText}>
            {syncStatus.hasPendingItems ? `Sync (${syncStatus.pendingCount})` : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredCases.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          title={String(searchQuery ? 'No Cases Found' : 'No Cases')}
          message={String(searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first case')}
        />
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id || item.$id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.caseCard} onPress={() => handleView(item)}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.cardGradient}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <View style={styles.caseInfo}>
                      <Text style={styles.caseTitle}>{String(item.title || 'Untitled')}</Text>
                      <View style={styles.caseMeta}>
                        <Text style={styles.caseCategoryText}>{String(item.category || 'Uncategorized')}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEdit(item); }}>
                      <Ionicons name="create-outline" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleDelete(item); }}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.caseDetails}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{String(item.assignedOfficer || 'Unassigned')}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{String(item.location || 'Location not specified')}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{String(item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No start date')}</Text>
                  </View>
                </View>
                
                <View style={styles.caseStatus}>
                  <Text style={styles.statusText}>{String(item.status || 'Unknown')}</Text>
                  <Text style={styles.priorityText}>{String(item.priority || 'Unknown')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.casesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={modals.case} animationType="fade" transparent={false} onRequestClose={() => updateModal('case', false)}>
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
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected.isEdit ? 'Edit Case' : 'Add New Case'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => updateModal('case', false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
                              <InputField 
                  label="Case Title" 
                  value={formData.title} 
                  onChangeText={(text) => updateFormData('title', text)} 
                  placeholder="Enter case title" 
                  error={errors.title}
                  required
                />
              <InputField label="Description" value={formData.description} onChangeText={(text) => updateFormData('description', text)} placeholder="Enter case description" multiline numberOfLines={3} />
                              <SelectDropdown 
                  label="Status" 
                  selectedValue={formData.status} 
                  onValueChange={(value) => updateFormData('status', value)} 
                  options={statusOptions}
                  error={errors.status}
                  required
                  fieldName="case_status"
                  fieldLabel="Status"
                  onOptionAdded={handleOptionAdded}
                  onOptionRemoved={handleOptionRemoved}
                  showAddNewOption={true}
                  showRemoveOption={true}
                />
                              <SelectDropdown 
                  label="Priority" 
                  selectedValue={formData.priority} 
                  onValueChange={(value) => updateFormData('priority', value)} 
                  options={priorityOptions}
                  error={errors.priority}
                  required
                  fieldName="case_priority"
                  fieldLabel="Priority"
                  onOptionAdded={handleOptionAdded}
                  onOptionRemoved={handleOptionRemoved}
                  showAddNewOption={true}
                  showRemoveOption={true}
                />
                <SelectDropdown 
                  label="Category" 
                  selectedValue={formData.category} 
                  onValueChange={(value) => updateFormData('category', value)} 
                  options={categoryOptions}
                  error={errors.category}
                  fieldName="case_categories"
                  fieldLabel="Category"
                  onOptionAdded={handleOptionAdded}
                  onOptionRemoved={handleOptionRemoved}
                  showAddNewOption={true}
                  showRemoveOption={true}
                />
              <SelectDropdown label="Assigned Officer" selectedValue={formData.assignedOfficer} onValueChange={(value) => updateFormData('assignedOfficer', value)} options={[{ label: 'Unassigned', value: '' }, ...employeeOptions]} />
              <InputField label="Location" value={formData.location} onChangeText={(text) => updateFormData('location', text)} placeholder="Enter case location" />
              
              <DatePickerField
                label="Start Date"
                value={formData.startDate ? new Date(formData.startDate) : new Date()}
                onChange={(date) => {
                  updateFormData('startDate', date.toISOString().split('T')[0]);
                }}
                error={errors.startDate}
                required
              />
              
              <DatePickerField
                label="End Date (Optional)"
                value={formData.endDate ? new Date(formData.endDate) : new Date()}
                onChange={(date) => updateFormData('endDate', date.toISOString().split('T')[0])}
                error={errors.endDate}
                optional={true}
              />
              
              <InputField label="Evidence" value={formData.evidence} onChangeText={(text) => updateFormData('evidence', text)} placeholder="Enter evidence details" multiline numberOfLines={3} />
              <InputField label="Notes" value={formData.notes} onChangeText={(text) => updateFormData('notes', text)} placeholder="Enter additional notes" multiline numberOfLines={3} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => updateModal('case', false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={saveCase}
                disabled={isSaving}
              >
                <LinearGradient colors={isSaving ? ['#9ca3af', '#6b7280'] : ['#dc2626', '#b91c1c']} style={styles.saveGradient}>
                  <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
                    {isSaving ? 'Saving...' : (selected.isEdit ? 'Update' : 'Save')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modals.details} animationType="fade" transparent={false} onRequestClose={() => updateModal('details', false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Case Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => updateModal('details', false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selected.case && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>{selected.case.title}</Text>
                    <View style={styles.detailBadges}>
                      <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selected.case.status) }]}>
                        <Text style={styles.detailStatusText}>{selected.case.status}</Text>
                      </View>
                      <View style={[styles.detailPriorityBadge, { backgroundColor: getPriorityColor(selected.case.priority) }]}>
                        <Text style={styles.detailPriorityText}>{selected.case.priority}</Text>
                      </View>
                    </View>
                  </View>
                  {[
                    { label: 'Description', value: selected.case.description || 'No description provided' },
                    { label: 'Category', value: selected.case.category || 'Not specified' },
                    { label: 'Assigned Officer', value: selected.case.assignedOfficer || 'Unassigned' },
                    { label: 'Location', value: selected.case.location || 'Location not specified' },
                    { label: 'Start Date', value: selected.case.startDate ? new Date(selected.case.startDate).toLocaleDateString() : 'Not specified' },
                    ...(selected.case.endDate ? [{ label: 'End Date', value: new Date(selected.case.endDate).toLocaleDateString() }] : []),
                    { label: 'Evidence', value: selected.case.evidence || 'No evidence details provided' },
                    { label: 'Notes', value: selected.case.notes || 'No notes provided' }
                  ].map((item, index) => (
                    <View key={index} style={styles.detailSection}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => updateModal('details', false)}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => { updateModal('details', false); handleEdit(selected.case); }}>
                <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.editGradient}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DeleteConfirmationModal
        visible={modals.delete}
        onConfirm={confirmDelete}
        onClose={handleDeleteCancel}
        itemName={selected.deleteCase?.title || 'this case'}
      />

      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={isSaving || isDeleting || isSyncing} 
        message={
          isSaving ? 'Saving case...' : 
          isDeleting ? 'Deleting case...' : 
          isSyncing ? 'Syncing data...' : 
          'Processing...'
        }
        type={
          isSaving ? 'save' : 
          isDeleting ? 'delete' : 
          isSyncing ? 'sync' : 
          'default'
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const StatCard = ({ icon, color, value, label }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  stats: { padding: 12, gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', boxShadowColor: '#000', boxShadowOffset: { width: 0, height: 1 }, boxShadowOpacity: 0.06, boxShadowRadius: 4, elevation: 2 },
  statIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  statContent: { flex: 1 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 1 },
  statLabel: { fontSize: 9, color: '#64748b', fontWeight: '500' },
  searchContainer: { paddingHorizontal: 20, padding: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  initButton: { padding: 8, borderRadius: 8, backgroundColor: '#3b82f6' },
  initButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  syncButton: { padding: 8, borderRadius: 8, backgroundColor: '#10b981' },
  syncButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  syncButtonPending: { backgroundColor: '#f59e0b' },
  syncButton: { padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  syncButtonDisabled: { opacity: 0.5 },
  casesList: { padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  caseCard: { marginBottom: 16, borderRadius: 16, boxShadowColor: '#000', boxShadowOffset: { width: 0, height: 4 }, boxShadowOpacity: 0.1, boxShadowRadius: 12, elevation: 4 },
  cardGradient: { borderRadius: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleContainer: { flex: 1, marginRight: 12 },
  caseInfo: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  caseMeta: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  caseCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, borderRadius: 8, backgroundColor: '#f8fafc' },
  cardContent: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#64748b', flex: 1, marginLeft: 8 },
  cardFooter: { flexDirection: 'row', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8f9fa', zIndex: 1000 },
  modalContent: { flex: 1, backgroundColor: '#f8f9fa' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#dc2626', backgroundColor: '#dc2626' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  closeButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  modalBody: { flex: 1, padding: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6b7280', alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { flex: 1, borderRadius: 12 },
  saveGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonTextDisabled: { color: '#d1d5db' },
  editButton: { flex: 1, borderRadius: 12 },
  editGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  detailSection: { marginBottom: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  detailBadges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailStatusText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  detailPriorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailPriorityText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  detailLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  detailValue: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 8,
  },
  caseDetails: {
    marginBottom: 12,
  },
  caseStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

export default CasesScreen;