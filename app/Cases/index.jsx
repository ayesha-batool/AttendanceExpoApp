import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePickerField from '../../components/DatePickerField';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EmptyState from '../../components/EmptyState';
import InputField from '../../components/InputField';
import LoadingOverlay from '../../components/LoadingOverlay';
import LoadingState from '../../components/LoadingState';
import OfflineStatus from '../../components/OfflineStatus';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import dataCache from '../../services/dataCache';
import { hybridDataService } from '../../services/hybridDataService';
import { validateForm, VALIDATION_SCHEMAS } from '../../utils/validation';

const CasesScreen = () => {
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
      const health = await hybridDataService.getAppwriteHealth();
      setSyncStatus({
        hasPendingItems: !health.healthy,
        pendingCount: health.healthy ? 0 : 1
      });
    } catch (error) {
      console.error('Error checking sync status:', error);
      setSyncStatus({
        hasPendingItems: true,
        pendingCount: 1
      });
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [statusOptions, priorityOptions, categoryOptions] = await Promise.all([
        hybridDataService.getOptions('case_status'),
        hybridDataService.getOptions('case_priority'),
        hybridDataService.getOptions('case_categories')
      ]);

      // Format options to match the expected structure
      setStatusOptions(statusOptions.map(status => ({ label: status, value: status.toLowerCase().replace(/\s+/g, '_') })));
      setPriorityOptions(priorityOptions.map(priority => ({ label: priority, value: priority.toLowerCase() })));
      setCategoryOptions(categoryOptions.map(category => ({ label: category, value: category })));
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      // Set default options if loading fails
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
        description: formData.description || "",
        location: formData.location || "",
        startDate: formData.startDate || new Date().toISOString().split('T')[0]
        // category is optional - not included in validation
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
        dataCache.getData('cases'),
        dataCache.getData('employees')
      ]);
      
    
      const validCases = casesData.filter(item => item && typeof item === 'object');
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      
      setCases(validCases);
      setFilteredCases(validCases);
      setEmployees(validEmployees);
      
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
       // Redirect to auth page
        router.replace('/auth');
        return;
      }
      
      // Check if it's a network-related error
      const errorMessage = error.message?.toLowerCase() || '';
      const isNetworkError = errorMessage.includes('bad gateway') || 
                           errorMessage.includes('network') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('timeout') ||
                           errorMessage.includes('502') ||
                           errorMessage.includes('503') ||
                           errorMessage.includes('504');
      
      if (isNetworkError) {
        console.error('❌ Network error loading cases data:', error);
        showCustomToast('error', 'Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
      } else {
        console.error('❌ Failed to load cases data:', error);
        showCustomToast('error', 'Error', 'Failed to load data. Please try again.');
      }
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
        
        await hybridDataService.updateData(key, caseId, caseData, 'cases');
        
        const updatedCase = { ...caseData, id: caseId, $id: caseId };
        setCases(prev => prev.map(c => (c.id || c.$id) === caseId ? updatedCase : c));
        setFilteredCases(prev => prev.map(c => (c.id || c.$id) === caseId ? updatedCase : c));
        showCustomToast('success', 'Success', 'Case updated successfully');
        setTimeout(() => setCustomToast(null), 3000);
      } else {
        // Check for duplicates before saving and show warning if found
        const existingCase = cases.find(caseItem => 
          caseItem.title && caseData.title && 
          caseItem.title.toLowerCase() === caseData.title.toLowerCase()
        );
        
        if (existingCase) {
          showCustomToast('warning', 'Duplicate Title', `Title "${caseData.title}" already exists. Saving anyway with unique ID.`);
        }
        
        const newCase = await hybridDataService.saveData(caseData, 'cases');
        
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
        router.replace('/auth');
        return;
      }
      
      // Handle duplicate errors specifically
      if (error.message && error.message.includes('already exists')) {
        console.log('Duplicate detected, showing toast but allowing operation to continue');
        showCustomToast('warning', 'Duplicate Title', error.message);
        // Don't return here - let the operation continue
      } else {
      console.error('Failed to save case:', error);
      showCustomToast('error', 'Error', error.message || 'Failed to save case');
      }
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
      
              await hybridDataService.deleteData(key, caseId, 'cases');
      
      setCases(prev => prev.filter(c => (c.id || c.$id) !== caseId));
      setFilteredCases(prev => prev.filter(c => (c.id || c.$id) !== caseId));
      showCustomToast('success', 'Success', 'Case deleted successfully');
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
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
      const result = await hybridDataService.manualSync();
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
      {/* Offline Status */}
      <OfflineStatus />
      
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
              <LinearGradient colors={['#ffffff', '#fefefe']} style={styles.cardGradient}>
                {/* Priority Indicator Bar */}
                <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
                
                {/* Header Section */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.caseTitle} numberOfLines={2}>{String(item.title || 'Untitled Case')}</Text>
                    <View style={styles.caseMetaRowLeft}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                        <Text style={styles.priorityText}>{String(item.priority || 'Medium').toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{String(item.status || 'Unknown').toUpperCase()}</Text>
                      </View>
                      <View style={styles.caseMeta}>
                        <Ionicons name="folder-outline" size={10} color="#6366f1" />
                        <Text style={styles.caseCategoryText}>{String(item.category || 'General')}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEdit(item); }}>
                      <Ionicons name="create-outline" size={16} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={(e) => { e.stopPropagation(); handleDelete(item); }}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Simplified Content Section */}
                <View style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="person-outline" size={14} color="#6366f1" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Officer</Text>
                      <Text style={styles.infoValue}>{String(item.assignedOfficer || 'Unassigned')}</Text>
                    </View>
                  </View>
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
                  label="Category (Optional)" 
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
                  required={false}
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
                <Ionicons name="close" size={24} color="#fff" />
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
  casesList: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  caseCard: { 
    marginBottom: 12, 
    borderRadius: 12, 
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardGradient: { 
    borderRadius: 12, 
    padding: 0,
    overflow: 'hidden',
  },
  priorityBar: {
    height: 4,
    width: '100%',
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    padding: 12,
    paddingBottom: 8,
  },
  cardTitleContainer: { 
    flex: 1,
    marginRight: 12 
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 20,
  },
  caseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseMetaRowLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  caseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  caseCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 3,
  },
  cardActions: { 
    flexDirection: 'row', 
    gap: 8 
  },
  actionButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  cardContent: { 
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 18,
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 6,
  },
  statusBadge: { 
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: '#fff', 
    letterSpacing: 0.3,
  },
  priorityBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 3, 
    borderRadius: 5,
  },
  priorityText: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: '#fff',
    letterSpacing: 0.3,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
    marginRight: 3,
  },
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
});

export default CasesScreen;