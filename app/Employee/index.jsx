import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import AddOfficerModal from '../../components/AddOfficerModal';
import AttendanceTab from '../../components/AttendanceTab';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EmployeeCard from '../../components/EmployeeCard';
import EmployeeDetailsModal from '../../components/EmployeeDetailsModal';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useEmployeeContext } from '../../context/EmployeeContext';
import { getCustomOptions } from '../../services/customOptionsService';
import { getItems, handleDataDelete, handleDataUpdate } from '../../services/dataHandler';

const EmployeeScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useEmployeeContext();
  
  // State management - compressed
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('employees');
  const [customOptions, setCustomOptions] = useState({ stations: [], ranks: [], shifts: [] });
  const [filters, setFilters] = useState({ station: '', rank: '', shift: '', status: '' });
  const [modals, setModals] = useState({ filter: false, addOfficer: false, delete: false, details: false });
  const [selected, setSelected] = useState({ employee: null, deleteEmployee: null, editEmployee: null });

  // Constants - compressed
  const departments = [
    { label: 'Traffic', value: 'Traffic' }, { label: 'Investigation', value: 'Investigation' },
    { label: 'Patrol', value: 'Patrol' }, { label: 'Special Ops', value: 'Special Ops' },
    { label: 'Administration', value: 'Administration' }, { label: 'Cyber Crime', value: 'Cyber Crime' },
    { label: 'Narcotics', value: 'Narcotics' }, { label: 'Forensic', value: 'Forensic' }
  ];

  const ranks = [
    { label: 'Constable', value: 'Constable' }, { label: 'Head Constable', value: 'Head Constable' },
    { label: 'Assistant Sub Inspector', value: 'Assistant Sub Inspector' }, { label: 'Sub Inspector', value: 'Sub Inspector' },
    { label: 'Inspector', value: 'Inspector' }, { label: 'Senior Inspector', value: 'Senior Inspector' },
    { label: 'Deputy Superintendent', value: 'Deputy Superintendent' }, { label: 'Superintendent', value: 'Superintendent' },
    { label: 'Senior Superintendent', value: 'Senior Superintendent' }, { label: 'Deputy Commissioner', value: 'Deputy Commissioner' },
    { label: 'Commissioner', value: 'Commissioner' }
  ];

  const shifts = [
    { label: 'Morning Shift (6 AM - 2 PM)', value: 'morning' }, { label: 'Evening Shift (2 PM - 10 PM)', value: 'evening' },
    { label: 'Night Shift (10 PM - 6 AM)', value: 'night' }, { label: 'General Duty (8 AM - 6 PM)', value: 'general' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'Active' }, { label: 'Suspended', value: 'Suspended' },
    { label: 'Retired', value: 'Retired' }, { label: 'Transferred', value: 'Transferred' }
  ];

  // Utility functions
  const showToast = (type, text1, text2, duration = 2000) => Toast.show({ type, text1, text2, visibilityTime: duration });
  const updateModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Data fetching
  const fetchData = async () => {
    console.log('🔍 fetchData called');
    console.log('🔍 fetchData - timestamp:', new Date().toISOString());
    try {
      setLoading(true);
      const [employeesData, optionsData] = await Promise.all([getItems('employees'), getCustomOptions()]);
      console.log('🔍 Raw employees data:', employeesData);
      console.log('🔍 Number of raw employees:', employeesData?.length);
      
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      console.log('🔍 Valid employees:', validEmployees);
      console.log('🔍 Number of valid employees:', validEmployees.length);
      
      // Log each employee's details to debug
      validEmployees.forEach((emp, index) => {
        console.log(`🔍 Employee ${index + 1}:`, {
          name: emp.fullName,
          status: emp.status,
          employmentStatus: emp.employmentStatus,
          photoUrl: emp.photoUrl ? 'Has photo' : 'No photo',
          id: emp.$id || emp.id
        });
      });
      
      // Log employees with photoUrl
      const employeesWithPhoto = validEmployees.filter(emp => emp.photoUrl);
      console.log('🔍 Employees with photoUrl:', employeesWithPhoto.length);
      employeesWithPhoto.forEach((emp, index) => {
        console.log(`🔍 Employee ${index + 1} with photo:`, {
          name: emp.fullName,
          photoUrl: emp.photoUrl,
          photoUrlLength: emp.photoUrl?.length,
          status: emp.status,
          employmentStatus: emp.employmentStatus
        });
      });
      
      // Log employees without photoUrl for comparison
      const employeesWithoutPhoto = validEmployees.filter(emp => !emp.photoUrl);
      console.log('🔍 Employees without photoUrl:', employeesWithoutPhoto.length);
      employeesWithoutPhoto.forEach((emp, index) => {
        console.log(`🔍 Employee ${index + 1} without photo:`, {
          name: emp.fullName,
          status: emp.status,
          employmentStatus: emp.employmentStatus
        });
      });
      
      console.log('🔍 Setting employees in state:', validEmployees.length);
      console.log('🔍 Total employees in system:', validEmployees.length);
      console.log('🔍 Employees with photoUrl:', validEmployees.filter(emp => emp.photoUrl).length);
      console.log('🔍 Employees without photoUrl:', validEmployees.filter(emp => !emp.photoUrl).length);
      console.log('🔍 Active employees:', validEmployees.filter(emp => emp.status?.toLowerCase() === 'active').length);
      console.log('🔍 Inactive employees:', validEmployees.filter(emp => emp.status?.toLowerCase() === 'inactive').length);
      console.log('🔍 Employees with undefined status:', validEmployees.filter(emp => !emp.status).length);
      setEmployees(validEmployees);
      setFilteredEmployees(validEmployees);
      setCustomOptions(optionsData);
      
      if (validEmployees.length > 0) {
        const names = validEmployees.map(emp => emp.fullName || emp.name || 'Unknown').join(', ');
        const message = validEmployees.length === 1 ? `Loaded employee: ${names}` : `Loaded ${validEmployees.length} employees: ${names}`;
        // showToast('success', 'Employees Loaded', message, 4000);
      } else {
        // showToast('info', 'No Employees', 'No employees found in the system');
      }
    } catch (error) {
      // showToast('error', 'Error', 'Failed to load employees data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
    const applyFiltering = () => {
    let filtered = [...employees];
    console.log('🔍 Starting filtering with', filtered.length, 'employees');
    console.log('🔍 Current filters state:', filters);
    console.log('🔍 Current search query:', searchQuery);
    console.log('🔍 Active tab:', activeTab);
    console.log('🔍 Filters object keys:', Object.keys(filters));
    console.log('🔍 Filters object values:', Object.values(filters));
    console.log('🔍 Any active filters:', Object.values(filters).some(f => f));
      console.log('🔍 Employees before filtering:', filtered.map(emp => ({
        name: emp.fullName,
        status: emp.status,
        employmentStatus: emp.employmentStatus,
        hasStatus: !!emp.status,
        hasEmploymentStatus: !!emp.employmentStatus
      })));
    
    // Filter by active tab
    if (activeTab === 'employees') {
      const beforeStatusFilter = filtered.length;
      console.log('🔍 Before status filter - employees:', filtered.map(emp => ({ name: emp.fullName, status: emp.status, employmentStatus: emp.employmentStatus })));
      filtered = filtered.filter(emp => {
        const status = emp.status?.toLowerCase();
        const employmentStatus = emp.employmentStatus?.toLowerCase();
        const isInactive = status === 'inactive' || employmentStatus === 'inactive';
        console.log(`🔍 Employee ${emp.fullName}: status=${status}, employmentStatus=${employmentStatus}, isInactive=${isInactive}`);
        
        // Show all employees except inactive ones
        return !isInactive;
      });
      console.log('🔍 After status filter (all except inactive):', beforeStatusFilter, '->', filtered.length);
      console.log('🔍 After status filter - remaining employees:', filtered.map(emp => ({ 
        name: emp.fullName, 
        status: emp.status, 
        employmentStatus: emp.employmentStatus,
        hasStatus: !!emp.status,
        hasEmploymentStatus: !!emp.employmentStatus
      })));
      
      // Log employees with photoUrl
      const employeesWithPhoto = filtered.filter(emp => emp.photoUrl);
      console.log('🔍 Employees with photoUrl:', employeesWithPhoto.length);
      console.log('🔍 Employees without photoUrl:', filtered.filter(emp => !emp.photoUrl).length);
    } else if (activeTab === 'inactive') {
      const beforeStatusFilter = filtered.length;
      filtered = filtered.filter(emp => {
        const status = emp.status?.toLowerCase();
        const employmentStatus = emp.employmentStatus?.toLowerCase();
        return status === 'inactive' || employmentStatus === 'inactive';
      });
      console.log('🔍 After status filter (inactive):', beforeStatusFilter, '->', filtered.length);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const beforeSearchFilter = filtered.length;
      const query = searchQuery.toLowerCase();
      console.log('🔍 Applying search filter with query:', query);
      console.log('🔍 Employees before search filter:', filtered.map(emp => ({
        name: emp.fullName,
        badgeNumber: emp.badgeNumber,
        email: emp.email,
        phone: emp.phone,
        rank: emp.rank,
        station: emp.station
      })));
      filtered = filtered.filter(employee =>
        ['fullName', 'name', 'badgeNumber', 'email', 'phone', 'rank', 'station']
          .some(field => employee[field]?.toLowerCase().includes(query))
      );
      console.log('🔍 After search filter:', beforeSearchFilter, '->', filtered.length, '(query:', searchQuery, ')');
      if (filtered.length === 0 && beforeSearchFilter > 0) {
        console.log('🔍 WARNING: All employees filtered out by search!');
      }
    }
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const beforeFilter = filtered.length;
        const fieldMap = { station: 'station', rank: 'rank', shift: 'shift', status: 'status' };
        const fieldName = fieldMap[key];
        console.log(`🔍 Applying ${key} filter with value: ${value}, field: ${fieldName}`);
        console.log(`🔍 Employees before ${key} filter:`, filtered.map(emp => ({ 
          name: emp.fullName, 
          [fieldName]: emp[fieldName],
          hasField: !!emp[fieldName]
        })));
        filtered = filtered.filter(employee => employee[fieldName] === value);
        console.log(`🔍 After ${key} filter:`, beforeFilter, '->', filtered.length, `(value: ${value})`);
        console.log(`🔍 Employees after ${key} filter:`, filtered.map(emp => ({ 
          name: emp.fullName, 
          [fieldName]: emp[fieldName]
        })));
      }
    });
    
    console.log('🔍 Final filtered employees:', filtered.length);
    console.log('🔍 Employees being shown in list:', filtered.length);
    console.log('🔍 Employee names in list:', filtered.map(emp => emp.fullName || emp.name || 'Unknown').join(', '));
    setFilteredEmployees(filtered);
  };

  // CRUD operations
  const handleAdd = () => {
    console.log('Add button pressed!');
    updateSelected('editEmployee', null);
    updateModal('addOfficer', true);
  };

  const handleEdit = (employee) => {
    updateSelected('editEmployee', employee);
    updateModal('addOfficer', true);
  };

  const handleDelete = (employee) => {
    updateSelected('deleteEmployee', employee);
    updateModal('delete', true);
  };

  const handleView = (employee) => {
    updateSelected('employee', employee);
    updateModal('details', true);
  };

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = employee.status?.toLowerCase() === 'active' ? 'inactive' : 'active';
      const updatedEmployee = { ...employee, status: newStatus };
      const key = `employees_${employee.id || employee.$id}`;
      await handleDataUpdate(key, employee.id || employee.$id, updatedEmployee, 'employees');
      
      setEmployees(prev => prev.map(emp => 
        (emp.id || emp.$id) === (employee.id || employee.$id) ? updatedEmployee : emp
      ));
      setFilteredEmployees(prev => prev.map(emp => 
        (emp.id || emp.$id) === (employee.id || employee.$id) ? updatedEmployee : emp
      ));
      
      // Removed success toast for status update
    } catch (error) {
      showToast('error', 'Error', 'Failed to update employee status');
    }
  };

  const confirmDelete = async () => {
    if (!selected.deleteEmployee) return;
    try {
      const key = `employees_${selected.deleteEmployee.id || selected.deleteEmployee.$id}`;
      await handleDataDelete(key, selected.deleteEmployee.id || selected.deleteEmployee.$id, 'employees');
      setEmployees(prev => prev.filter(emp => (emp.id || emp.$id) !== (selected.deleteEmployee.id || selected.deleteEmployee.$id)));
      setFilteredEmployees(prev => prev.filter(emp => (emp.id || emp.$id) !== (selected.deleteEmployee.id || selected.deleteEmployee.$id)));
      // Removed success toast for delete operation
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete employee');
    } finally {
      updateModal('delete', false);
      updateSelected('deleteEmployee', null);
    }
  };

  // Filter management
  const applyFilters = () => {
    applyFiltering();
    updateModal('filter', false);
  };

  const clearFilters = () => {
    setFilters({ station: '', rank: '', shift: '', status: '' });
    setSearchQuery('');
    applyFiltering();
  };

  // Effects
  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { 
    console.log('🔍 Employee screen focused - timestamp:', new Date().toISOString());
    fetchData(); 
  }, []));
  // Remove header action button since we're using floating action button
  // useEffect(() => { setHeaderActionButton({ icon: 'add', onPress: handleAdd }); return () => clearHeaderAction(); }, []);
  useEffect(() => { applyFiltering(); }, [activeTab, employees, searchQuery, filters]);

  if (loading) return <LoadingState />;

  // Log final display counts
  console.log('🔍 === FINAL DISPLAY COUNTS ===');
  console.log('🔍 Active tab:', activeTab);
  console.log('🔍 Total employees in system:', employees.length);
  console.log('🔍 Total filtered employees:', filteredEmployees.length);
  console.log('🔍 Employees being shown in UI:', filteredEmployees.length);
  console.log('🔍 ===============================');

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
          <View style={styles.tabSliderContainer}>
            {[
              { key: 'employees', icon: 'people', label: 'All Employees' },
              { key: 'inactive', icon: 'person-remove', label: 'Inactive' },
              { key: 'attendance', icon: 'calendar', label: 'Attendance' }
            ].map(tab => (
              <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
                <Ionicons name={tab.icon} size={20} color={activeTab === tab.key ? '#fff' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {activeTab === 'attendance' ? (
        <AttendanceTab employees={employees} />
      ) : (
        <>
          {/* Search and Filter */}
          <View style={styles.searchFilterContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${activeTab} employees...`}
              onClear={() => setSearchQuery('')}
            />
            {activeTab === 'employees' && (
              <TouchableOpacity style={styles.filterButton} onPress={() => updateModal('filter', true)}>
                <Ionicons name="filter" size={20} color="#1e40af" />
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>
            )}
          </View>



          {/* Employee List */}
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name={activeTab === 'employees' ? 'people-outline' : 'person-remove-outline'} size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>
                {searchQuery || Object.values(filters).some(f => f) ? `No ${activeTab} Employees Found` : `No ${activeTab} Employees`}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filter criteria'
                  : activeTab === 'employees' ? 'Start by adding your first employee' : 'No inactive employees found'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id || item.$id}
              renderItem={({ item }) => (
                <EmployeeCard
                  employee={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                  onToggleStatus={() => handleToggleStatus(item)}
                  onPress={() => handleView(item)}
                />
              )}
              contentContainerStyle={styles.employeesList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Filter Modal */}
          <Modal visible={modals.filter} animationType="slide" transparent onRequestClose={() => updateModal('filter', false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter Employees</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => updateModal('filter', false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <SelectDropdown label="Department" selectedValue={filters.station} onValueChange={(value) => updateFilter('station', value)} options={[{ label: 'All Departments', value: '' }, ...departments]} />
                  <SelectDropdown label="Rank" selectedValue={filters.rank} onValueChange={(value) => updateFilter('rank', value)} options={[{ label: 'All Ranks', value: '' }, ...ranks]} />
                  <SelectDropdown label="Shift" selectedValue={filters.shift} onValueChange={(value) => updateFilter('shift', value)} options={[{ label: 'All Shifts', value: '' }, ...shifts]} />
                  <SelectDropdown label="Status" selectedValue={filters.status} onValueChange={(value) => updateFilter('status', value)} options={[{ label: 'All Status', value: '' }, ...statusOptions]} />
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                    <LinearGradient colors={['#1e40af', '#1e3a8a']} style={styles.applyGradient}>
                      <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        visible={modals.delete}
        onConfirm={confirmDelete}
        onCancel={() => { updateModal('delete', false); updateSelected('deleteEmployee', null); }}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
      />

      <AddOfficerModal
        visible={modals.addOfficer}
        onClose={() => { updateModal('addOfficer', false); updateSelected('editEmployee', null); }}
        onSuccess={() => { 
          console.log('🔍 onSuccess called, fetching data...');
          setTimeout(() => {
            console.log('🔍 Fetching data after delay...');
            fetchData(); 
          }, 500); // Add 500ms delay to ensure data is saved
        }}
        editingOfficer={selected.editEmployee}
      />

      <EmployeeDetailsModal
        visible={modals.details}
        employee={selected.employee}
        onClose={() => { updateModal('details', false); updateSelected('employee', null); }}
        onEmployeeUpdate={() => { 
          console.log('🔍 Employee updated, fetching data...');
          setTimeout(() => {
            console.log('🔍 Fetching data after employee update...');
            fetchData(); 
          }, 500); // Add 500ms delay to ensure data is saved
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient colors={['#1e40af', '#1e3a8a']} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: { backgroundColor: '#fff', padding:1, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabScrollContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4,margin:"auto" },
  tabSliderContainer: { flexDirection: 'row', height: 48, backgroundColor: 'white', borderRadius: 12, padding: 4, marginHorizontal: 4, minWidth: 320 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8, minWidth: 80 },
  activeTab: { backgroundColor: '#1e40af' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b', marginLeft: 6 },
  activeTabText: { color: '#fff' },
  searchFilterContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  filterButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#1e40af', marginLeft: 6 },
  employeesList: { padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '90%', maxHeight: '80%', padding: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  closeButton: { padding: 8, borderRadius: 8, backgroundColor: '#f8fafc' },
  modalBody: { flex: 1, padding: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
  clearButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6b7280', alignItems: 'center' },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applyButton: { flex: 1, borderRadius: 12 },
  applyGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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

export default EmployeeScreen;