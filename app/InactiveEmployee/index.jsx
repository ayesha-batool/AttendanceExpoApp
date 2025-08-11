import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import SearchBar from '../../components/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataUpdate, useNetworkStatus } from '../../services/dataHandler';

const InactiveEmployeeScreen = () => {
  const [inactiveEmployees, setInactiveEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchInactiveEmployees();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchInactiveEmployees();
    }, [])
  );

  const fetchInactiveEmployees = async () => {
    try {
      const allEmployees = await getItems('employees');
      const inactive = allEmployees.filter(emp => emp.status === 'inactive' || emp.inactive);
      console.log('📦 Fetched inactive employees:', inactive);
      setInactiveEmployees(inactive);
    } catch (error) {
      console.error('Error fetching inactive employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = inactiveEmployees.filter(employee => {
    const matchesSearch = !searchQuery || 
      employee.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || employee.inactiveReason === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleEmployeePress = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const restoreEmployee = async (employee) => {
    Alert.alert(
      'Restore Employee',
      `Are you sure you want to restore ${employee.fullName || employee.name || employee.employeeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            try {
              const key = `employees_${employee.$id}`;
              await handleDataUpdate(key, employee.$id, {
                ...employee,
                status: 'active',
                inactive: false,
                inactiveReason: null,
                inactiveDate: null
              }, 'employees');

              // Removed success toast

              fetchInactiveEmployees();
            } catch (error) {
              console.error('Error restoring employee:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to restore employee'
              });
            }
          }
        }
      ]
    );
  };

  const permanentlyDeleteEmployee = async (employee) => {
    Alert.alert(
      'Permanently Delete Employee',
      `Are you sure you want to permanently delete ${employee.fullName || employee.name || employee.employeeName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const key = `employees_${employee.$id}`;
              await handleDataDelete(key, employee.$id, 'employees');

              // Removed success toast

              fetchInactiveEmployees();
            } catch (error) {
              console.error('Error deleting employee:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete employee'
              });
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (reason) => {
    switch (reason) {
      case 'retired':
        return '#e74c3c';
      case 'resigned':
        return '#f39c12';
      case 'terminated':
        return '#c0392b';
      case 'transferred':
        return '#3498db';
      case 'medical':
        return '#9b59b6';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (reason) => {
    switch (reason) {
      case 'retired':
        return 'person-remove-outline';
      case 'resigned':
        return 'log-out-outline';
      case 'terminated':
        return 'close-circle-outline';
      case 'transferred':
        return 'swap-horizontal-outline';
      case 'medical':
        return 'medical-outline';
      default:
        return 'help-circle-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading inactive employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inactive Employees</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="people-outline" size={24} color="#e74c3c" />
          </View>
          <Text style={styles.summaryLabel}>Total Inactive</Text>
          <Text style={styles.summaryValue}>{inactiveEmployees.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="refresh-outline" size={24} color="#27ae60" />
          </View>
          <Text style={styles.summaryLabel}>Can Restore</Text>
          <Text style={styles.summaryValue}>
            {inactiveEmployees.filter(emp => emp.inactiveReason !== 'terminated').length}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search inactive employees..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearch}
      />

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'retired' && styles.filterChipActive]}
            onPress={() => setStatusFilter('retired')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'retired' && styles.filterChipTextActive]}>
              Retired
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'resigned' && styles.filterChipActive]}
            onPress={() => setStatusFilter('resigned')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'resigned' && styles.filterChipTextActive]}>
              Resigned
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'terminated' && styles.filterChipActive]}
            onPress={() => setStatusFilter('terminated')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'terminated' && styles.filterChipTextActive]}>
              Terminated
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'transferred' && styles.filterChipActive]}
            onPress={() => setStatusFilter('transferred')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'transferred' && styles.filterChipTextActive]}>
              Transferred
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Inactive Employees Found' : 'No Inactive Employees'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search terms' : 'All employees are currently active'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
          {filteredEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.$id}
              style={styles.employeeCard}
              onPress={() => handleEmployeePress(employee)}
              activeOpacity={0.7}
            >
              <View style={styles.employeeInfo}>
                <View style={styles.employeeAvatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeName}>
                    {employee.fullName || employee.name || employee.employeeName || "No Name"}
                  </Text>
                  <Text style={styles.employeePosition}>
                    {employee.position || employee.designation || "No Position"}
                  </Text>
                  <Text style={styles.employeeDepartment}>
                    {employee.department || "No Department"}
                  </Text>
                </View>
              </View>

              <View style={styles.employeeStatus}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.inactiveReason) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(employee.inactiveReason)} 
                    size={16} 
                    color={getStatusColor(employee.inactiveReason)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(employee.inactiveReason) }]}>
                    {employee.inactiveReason || 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                {employee.inactiveReason !== 'terminated' && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      restoreEmployee(employee);
                    }}
                    style={styles.restoreBtn}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#27ae60" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    permanentlyDeleteEmployee(employee);
                  }}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Employee Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Employee Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedEmployee && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.employeeDetailCard}>
                  <View style={styles.detailAvatar}>
                    <Ionicons name="person" size={40} color="#fff" />
                  </View>
                  <Text style={styles.detailName}>
                    {selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName || "No Name"}
                  </Text>
                  <Text style={styles.detailPosition}>
                    {selectedEmployee.position || selectedEmployee.designation || "No Position"}
                  </Text>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedEmployee.inactiveReason) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(selectedEmployee.inactiveReason)} 
                      size={20} 
                      color={getStatusColor(selectedEmployee.inactiveReason)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(selectedEmployee.inactiveReason) }]}>
                      {selectedEmployee.inactiveReason || 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Personal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Employee ID:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.employeeId || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Department:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.department || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joining Date:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.joiningDate || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Inactive Date:</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.inactiveDate || 'N/A'}</Text>
                  </View>
                  {selectedEmployee.inactiveReason && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.detailValue}>{selectedEmployee.inactiveReason}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {selectedEmployee.inactiveReason !== 'terminated' && (
                    <TouchableOpacity
                      style={styles.restoreButton}
                      onPress={() => {
                        setShowDetailsModal(false);
                        restoreEmployee(selectedEmployee);
                      }}
                    >
                      <Ionicons name="refresh-outline" size={20} color="#fff" />
                      <Text style={styles.restoreButtonText}>Restore Employee</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setShowDetailsModal(false);
                      permanentlyDeleteEmployee(selectedEmployee);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete Permanently</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  employeeList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  employeeCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#999',
  },
  employeeStatus: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  restoreBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  modalBody: {
    padding: 20,
  },
  employeeDetailCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailPosition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalActions: {
    gap: 12,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InactiveEmployeeScreen; 