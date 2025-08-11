import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePickerField from '../../components/DatePickerField';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import InputField from '../../components/InputField';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useCasesContext } from '../../context/CasesContext';
import { getItems, handleDataDelete, handleDataSubmit, handleDataUpdate } from '../../services/dataHandler';

const CasesScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useCasesContext();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modals, setModals] = useState({ case: false, delete: false, details: false });
  const [selected, setSelected] = useState({ case: null, deleteCase: null, isEdit: false, editCase: null });
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'active', priority: 'medium', 
    assignedOfficer: '', location: '', category: '', evidence: '', notes: '', startDate: '', endDate: ''
  });


  const statusOptions = [
    { label: 'Active', value: 'active' }, { label: 'Under Investigation', value: 'investigation' },
    { label: 'Pending Review', value: 'pending' }, { label: 'Closed', value: 'closed' },
    { label: 'Archived', value: 'archived' }
  ];
  const priorityOptions = [
    { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }, { label: 'Critical', value: 'critical' }
  ];
  const categoryOptions = ['Theft', 'Assault', 'Fraud', 'Drug Related', 'Traffic Violation', 'Domestic Violence', 'Property Crime', 'White Collar Crime', 'Organized Crime', 'Cyber Crime', 'Other'];

  const updateModal = (key, value) => {
    console.log('🔍 updateModal called:', { key, value });
    setModals(prev => {
      const newState = { ...prev, [key]: value };
      console.log('🔍 New modal state:', newState);
      return newState;
    });
  };
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));
  const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

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
      const [casesData, employeesData] = await Promise.all([getItems('cases'), getItems('employees')]);
      const validCases = casesData.filter(item => item && typeof item === 'object');
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      setCases(validCases);
      setFilteredCases(validCases);
      setEmployees(validEmployees);
    } catch (error) {
      console.error('Failed to load cases data:', error);
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
    console.log('🔍 handleAdd called - opening case modal');
    updateSelected('isEdit', false);
    updateSelected('editCase', null);
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 Setting start date to:', today);
    setFormData({
      title: '', description: '', status: '', priority: '', assignedOfficer: '',
      startDate: today, endDate: '',
      location: '', category: '', evidence: '', notes: ''
    });
    updateModal('case', true);
    console.log('🔍 Modal state after update:', { case: true });
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
    if (!formData.title.trim()) { Alert.alert('Error', 'Please enter a case title'); return; }
    if (!formData.status) { Alert.alert('Error', 'Please select a case status'); return; }
    if (!formData.priority) { Alert.alert('Error', 'Please select a priority level'); return; }
    if (!formData.category) { Alert.alert('Error', 'Please select a case category'); return; }
    if (!formData.startDate) { Alert.alert('Error', 'Please select a start date'); return; }
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      Alert.alert('Error', 'End date cannot be before start date'); return;
    }

    try {
      const caseData = { ...formData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (selected.isEdit && selected.editCase) {
        const key = `cases_${selected.editCase.id || selected.editCase.$id}`;
        await handleDataUpdate(key, selected.editCase.id || selected.editCase.$id, caseData, 'cases');
        setCases(prev => prev.map(c => (c.id || c.$id) === (selected.editCase.id || selected.editCase.$id) ? { ...caseData, id: selected.editCase.id || selected.editCase.$id } : c));
        setFilteredCases(prev => prev.map(c => (c.id || c.$id) === (selected.editCase.id || selected.editCase.$id) ? { ...caseData, id: selected.editCase.id || selected.editCase.$id } : c));
        // Case updated successfully
      } else {
        const newCase = await handleDataSubmit(caseData, 'cases');
        setCases(prev => [...prev, newCase]);
        setFilteredCases(prev => [...prev, newCase]);
        // Case added successfully
      }
      updateModal('case', false);
      updateSelected('isEdit', false);
      updateSelected('editCase', null);
      setFormData({ title: '', description: '', status: 'active', priority: 'medium', assignedOfficer: '', location: '', category: '', evidence: '', notes: '', startDate: '', endDate: '' });
    } catch (error) {
      console.error('Failed to save case:', error);
    }
  };

  const confirmDelete = async () => {
    if (!selected.deleteCase) return;
    try {
      const key = `cases_${selected.deleteCase.id || selected.deleteCase.$id}`;
      await handleDataDelete(key, selected.deleteCase.id || selected.deleteCase.$id, 'cases');
      setCases(prev => prev.filter(c => (c.id || c.$id) !== (selected.deleteCase.id || selected.deleteCase.$id)));
      setFilteredCases(prev => prev.filter(c => (c.id || c.$id) !== (selected.deleteCase.id || selected.deleteCase.$id)));
      // Case deleted successfully
    } catch (error) {
      console.error('Failed to delete case:', error);
    } finally {
      updateModal('delete', false);
      updateSelected('deleteCase', null);
    }
  };



  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    closed: cases.filter(c => c.status === 'closed').length,
    high: cases.filter(c => ['high', 'critical'].includes(c.priority)).length
  };

  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { fetchData(); }, []));
  // Remove header action button since we're using floating action button
  // useEffect(() => { setHeaderActionButton({ icon: 'add', onPress: handleAdd }); return () => clearHeaderAction(); }, []);
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
      </View>

      {filteredCases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>{searchQuery ? 'No Cases Found' : 'No Cases'}</Text>
          <Text style={styles.emptyMessage}>{searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first case'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id || item.$id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.caseCard} onPress={() => handleView(item)}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.cardGradient}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.caseTitle}>{item.title}</Text>
                    <View style={styles.caseCategory}>
                      <Text style={styles.caseCategoryText}>{item.category}</Text>
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
                <View style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>{item.assignedOfficer || 'Unassigned'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>{item.location || 'Location not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.infoText}>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No start date'}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
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
        {console.log('🔍 Rendering case modal, visible:', modals.case)}
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected.isEdit ? 'Edit Case' : 'Add New Case'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => updateModal('case', false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <InputField label="Case Title" value={formData.title} onChangeText={(text) => updateFormData('title', text)} placeholder="Enter case title" />
              <InputField label="Description" value={formData.description} onChangeText={(text) => updateFormData('description', text)} placeholder="Enter case description" multiline numberOfLines={3} />
              <SelectDropdown label="Status" selectedValue={formData.status} onValueChange={(value) => updateFormData('status', value)} options={statusOptions} />
              <SelectDropdown label="Priority" selectedValue={formData.priority} onValueChange={(value) => updateFormData('priority', value)} options={priorityOptions} />
              <SelectDropdown label="Category" selectedValue={formData.category} onValueChange={(value) => updateFormData('category', value)} options={categoryOptions.map(cat => ({ label: cat, value: cat }))} />
              <SelectDropdown label="Assigned Officer" selectedValue={formData.assignedOfficer} onValueChange={(value) => updateFormData('assignedOfficer', value)} options={[{ label: 'Unassigned', value: '' }, ...employeeOptions]} />
              <InputField label="Location" value={formData.location} onChangeText={(text) => updateFormData('location', text)} placeholder="Enter case location" />
              
              <DatePickerField
                label="Start Date *"
                value={formData.startDate ? new Date(formData.startDate) : new Date()}
                onChange={(date) => {
                  console.log('🔍 Start date changed to:', date);
                  updateFormData('startDate', date.toISOString().split('T')[0]);
                }}
              />
              
              <DatePickerField
                label="End Date (Optional)"
                value={formData.endDate ? new Date(formData.endDate) : new Date()}
                onChange={(date) => updateFormData('endDate', date.toISOString().split('T')[0])}
                optional={true}
              />
              
              <InputField label="Evidence" value={formData.evidence} onChangeText={(text) => updateFormData('evidence', text)} placeholder="Enter evidence details" multiline numberOfLines={3} />
              <InputField label="Notes" value={formData.notes} onChangeText={(text) => updateFormData('notes', text)} placeholder="Enter additional notes" multiline numberOfLines={3} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => updateModal('case', false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveCase}>
                <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.saveGradient}>
                  <Text style={styles.saveButtonText}>{selected.isEdit ? 'Update' : 'Save'}</Text>
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
        title="Delete Case"
        message="Are you sure you want to delete this case? This action cannot be undone."
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
  stats: { padding: 12, gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  statContent: { flex: 1 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 1 },
  statLabel: { fontSize: 9, color: '#64748b', fontWeight: '500' },
  searchContainer: { paddingHorizontal: 20, padding: 0 },
  casesList: { padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  caseCard: { marginBottom: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  cardGradient: { borderRadius: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleContainer: { flex: 1, marginRight: 12 },
  caseTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  caseCategory: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  caseCategoryText: { fontSize: 12, fontWeight: '600', color: '#475569' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default CasesScreen;