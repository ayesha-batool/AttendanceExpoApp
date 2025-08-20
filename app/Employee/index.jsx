import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AddOfficerModal from '../../components/AddOfficerModal';
import AttendanceTab from '../../components/AttendanceTab';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EmployeeCard from '../../components/EmployeeCard';
import EmployeeDetailsModal from '../../components/EmployeeDetailsModal';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useEmployeeContext } from '../../context/EmployeeContext';
import { customOptionsService, dataService } from '../../services/unifiedDataService';

const EmployeeScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useEmployeeContext();
  
  // State management
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [customOptions, setCustomOptions] = useState({ departments: [], ranks: [], employment_status: [] });
  const [filters, setFilters] = useState({ department: '', rank: '', status: '' });
  const [modals, setModals] = useState({ filter: false, addOfficer: false, delete: false, details: false });
  const [selected, setSelected] = useState({ employee: null, deleteEmployee: null, editEmployee: null });
  const [customToast, setCustomToast] = useState(null);

  // Utility functions
  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };
  const updateModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [employeesData, departmentsData, ranksData, statusData] = await Promise.all([
        dataService.getItems('employees'),
        customOptionsService.getOptions('departments'),
customOptionsService.getOptions('ranks'),
customOptionsService.getOptions('employment_status')
      ]);
      
      const optionsData = {
        departments: departmentsData,
        ranks: ranksData,
        employment_status: statusData
      };
      
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      
      setEmployees(validEmployees);
      setFilteredEmployees(validEmployees);
      setCustomOptions(optionsData);
      
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const applyFiltering = () => {
    let filtered = [...employees];
    
    // Filter by active tab
    if (activeTab === 'active') {
      filtered = filtered.filter(emp => {
        const status = emp.status?.toLowerCase();
        return status === 'active';
      });
    } else if (activeTab === 'other') {
      filtered = filtered.filter(emp => {
        const status = emp.status?.toLowerCase();
        return status !== 'active';
      });
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(employee =>
        ['fullName', 'name', 'badgeNumber', 'employeeId', 'email', 'phone', 'contactNumber', 'rank', 'department', 'postingStation']
          .some(field => employee[field]?.toLowerCase().includes(query))
      );
    }
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const fieldMap = { 
          department: 'department', 
          rank: 'rank', 
          status: 'status' 
        };
        const fieldName = fieldMap[key];
        
        if (fieldName) {
          filtered = filtered.filter(employee => 
            employee[fieldName]?.toLowerCase() === value.toLowerCase()
          );
        }
      }
    });
    
    setFilteredEmployees(filtered);
  };

  // CRUD operations
  const handleAdd = () => {
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
      const updatedEmployee = { 
        ...employee, 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      const employeeId = employee.id || employee.$id;
      const key = `employees_${employeeId}`;
      
      // Update in storage
      await dataService.updateData(key, employeeId, updatedEmployee, 'employees');
      
      // Update local state
      setEmployees(prev => {
        const updated = prev.map(emp => 
          (emp.id || emp.$id) === employeeId ? updatedEmployee : emp
        );
        return updated;
      });
      
      setFilteredEmployees(prev => {
        const updated = prev.map(emp => 
          (emp.id || emp.$id) === employeeId ? updatedEmployee : emp
        );
        return updated;
      });
          
    } catch (error) {
      showCustomToast('error', 'Error', 'Failed to update employee status: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!selected.deleteEmployee) return;
    
    try {
      const employeeId = selected.deleteEmployee.id || selected.deleteEmployee.$id;
      const key = `employees_${employeeId}`;
      
      // Delete from storage
      await dataService.deleteData(key, employeeId, 'employees');
      
      // Update local state
      setEmployees(prev => {
        const updated = prev.filter(emp => (emp.id || emp.$id) !== employeeId);
        return updated;
      });
      
      setFilteredEmployees(prev => {
        const updated = prev.filter(emp => (emp.id || emp.$id) !== employeeId);
        return updated;
      });
      
      showCustomToast('success', 'Success', 'Employee deleted successfully');
      
    } catch (error) {
      showCustomToast('error', 'Error', 'Failed to delete employee: ' + error.message);
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
    setFilters({ department: '', rank: '', status: '' });
    setSearchQuery('');
    applyFiltering();
  };

  // Effects
  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { 
    fetchData(); 
  }, []));
  useEffect(() => { applyFiltering(); }, [activeTab, employees, searchQuery, filters]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      {/* Custom Toast */}
      {customToast && (
        <View style={[
          styles.customToastContainer,
          customToast.type === 'error' ? styles.errorToast : 
          customToast.type === 'success' ? styles.successToast :
          customToast.type === 'warning' ? styles.warningToast :
          styles.infoToast
        ]}>
          <Ionicons 
            name={
              customToast.type === 'error' ? 'close-circle' :
              customToast.type === 'success' ? 'checkmark-circle' :
              customToast.type === 'warning' ? 'warning' :
              'information-circle'
            }
            size={20}
            color="#fff"
          />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>{customToast.title}</Text>
            <Text style={styles.toastMessage}>{customToast.message}</Text>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
          <View style={styles.tabSliderContainer}>
            {[
              { key: 'active', icon: 'people', label: 'Active Employees' },
              { key: 'other', icon: 'person-remove', label: 'Other Employees' },
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
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search ${activeTab} ...`}
                onClear={() => setSearchQuery('')}
              />
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={() => updateModal('filter', true)}>
              <Ionicons name="filter" size={18} color="#1e40af" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Employee List */}
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name={activeTab === 'employees' ? 'people-outline' : 'person-remove-outline'} size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>
                {searchQuery || Object.values(filters).some(f => f) ? `No ${activeTab} Found` : `No ${activeTab} Employees`}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filter criteria'
                  : activeTab === 'employees' ? 'Start by adding your first employee' : ''}
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
          <Modal visible={modals.filter} animationType="slide" onRequestClose={() => updateModal('filter', false)}>
            <View style={styles.fullScreenModal}>
              <View style={styles.fullScreenModalHeader}>
                <Text style={styles.fullScreenModalTitle}>Filter Employees</Text>
                <TouchableOpacity style={styles.fullScreenCloseButton} onPress={() => updateModal('filter', false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.fullScreenModalBody}>
                <SelectDropdown 
                  label="Department" 
                  selectedValue={filters.department} 
                  onValueChange={(value) => updateFilter('department', value)} 
                  options={[{ label: 'All Departments', value: '' }, ...customOptions.departments.map(dept => ({ label: dept, value: dept }))]} 
                  showRemoveOption={false} 
                />
                <SelectDropdown 
                  label="Rank" 
                  selectedValue={filters.rank} 
                  onValueChange={(value) => updateFilter('rank', value)} 
                  options={[{ label: 'All Ranks', value: '' }, ...customOptions.ranks.map(rank => ({ label: rank, value: rank }))]} 
                  showRemoveOption={false} 
                />
                <SelectDropdown 
                  label="Status" 
                  selectedValue={filters.status} 
                  onValueChange={(value) => updateFilter('status', value)} 
                  options={[{ label: 'All Status', value: '' }, ...customOptions.employment_status.map(status => ({ label: status, value: status }))]} 
                  showRemoveOption={false} 
                />
              </ScrollView>
              <View style={styles.fullScreenModalFooter}>
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
          </Modal>
        </>
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        visible={modals.delete}
        onConfirm={confirmDelete}
        onClose={() => { updateModal('delete', false); updateSelected('deleteEmployee', null); }}
        itemName={selected.deleteEmployee?.fullName || 'this employee'}
      />

      <AddOfficerModal
        visible={modals.addOfficer}
        onClose={() => { 
          updateModal('addOfficer', false); 
          updateSelected('editEmployee', null); 
        }}
        onSuccess={() => { 
          fetchData();
          setTimeout(() => {
            fetchData(); 
          }, 1000);
        }}
        editingOfficer={selected.editEmployee}
      />

      <EmployeeDetailsModal
        visible={modals.details}
        employee={selected.employee}
        onClose={() => { 
          updateModal('details', false); 
          updateSelected('employee', null); 
        }}
        onEmployeeUpdate={() => { 
          fetchData();
          setTimeout(() => {
            fetchData(); 
          }, 1000);
        }}
      />

                {/* Add Default Options Button - Remove after use */}
          
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
  container: { flex: 1, backgroundColor: '#f8fafc',paddingBottom:20},
  tabContainer: { 
    backgroundColor: '#fff', 
    paddingVertical: 6, 
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 2,
    elevation: 1,
  },
  tabScrollContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 4,
  },
  tabSliderContainer: { 
    flexDirection: 'row', 
    height: 40, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 10, 
    padding: 3, 
    marginHorizontal: 4, 
    minWidth: 320,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 2,
    elevation: 1,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 7, minWidth: 80 },
  activeTab: { backgroundColor: '#1e40af' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b', marginLeft: 5 },
  activeTabText: { color: '#fff' },
  searchFilterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchContainer: {
    flex: 1,
    minWidth: '40%',
  },
  filterButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 4, 
    paddingVertical: 12, 
    backgroundColor: '#f8fafc', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 2,
    elevation: 1,

  },
  filterButtonText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#1e40af', 
    marginLeft: 5 
  },
  employeesList: { 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    paddingBottom: 100,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginTop: 20, 
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: { 
    fontSize: 15, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 22,
  },
  fullScreenModal: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  fullScreenModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#1e40af',
  },
  fullScreenModalTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#fff' 
  },
  fullScreenCloseButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)' 
  },
  fullScreenModalBody: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff',
  },
  fullScreenModalFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    gap: 12,
    backgroundColor: '#fff',
  },
  clearButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6b7280', alignItems: 'center' },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applyButton: { flex: 1, borderRadius: 12 },
  applyGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 6 },
    boxShadowOpacity: 0.25,
    boxShadowRadius: 12,
    elevation: 10,
  },
  customToastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 9999,
    zIndex: 9999,
  },
  errorToast: {
    backgroundColor: '#ef4444',
  },
  successToast: {
    backgroundColor: '#10b981',
  },
  warningToast: {
    backgroundColor: '#f59e0b',
  },
  infoToast: {
    backgroundColor: '#3b82f6',
  },
  toastContent: {
    marginLeft: 10,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
});

export default EmployeeScreen;