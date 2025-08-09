import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import InputField from '../../components/InputField';
import LoadingOverlay from '../../components/LoadingOverlay';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataSubmit, handleDataUpdate, useNetworkStatus } from '../../services/dataHandler';

const { width } = Dimensions.get('window');

const LEAVE_TYPES = [
  { id: 'annual', name: 'Annual Leave', color: '#34C759', icon: 'calendar-outline', description: 'Regular vacation time' },
  { id: 'sick', name: 'Sick Leave', color: '#FF3B30', icon: 'medical-outline', description: 'Health-related absence' },
  { id: 'emergency', name: 'Emergency Leave', color: '#FF9500', icon: 'warning-outline', description: 'Urgent personal matters' },
  { id: 'maternity', name: 'Maternity Leave', color: '#AF52DE', icon: 'heart-outline', description: 'Pregnancy and childbirth' },
  { id: 'paternity', name: 'Paternity Leave', color: '#007AFF', icon: 'people-outline', description: 'Father\'s leave for newborn' },
  { id: 'compensatory', name: 'Compensatory Leave', color: '#5856D6', icon: 'time-outline', description: 'Overtime compensation' },
  { id: 'training', name: 'Training Leave', color: '#FF2D92', icon: 'school-outline', description: 'Professional development' },
  { id: 'official', name: 'Official Duty', color: '#8E8E93', icon: 'briefcase-outline', description: 'Work-related travel' },
  { id: 'bereavement', name: 'Bereavement Leave', color: '#6C757D', icon: 'heart-broken-outline', description: 'Family member death' },
  { id: 'study', name: 'Study Leave', color: '#20C997', icon: 'library-outline', description: 'Educational purposes' }
];

const LEAVE_STATUS = [
  { id: 'pending', name: 'Pending', color: '#FF9500', icon: 'time-outline' },
  { id: 'approved', name: 'Approved', color: '#34C759', icon: 'checkmark-circle-outline' },
  { id: 'rejected', name: 'Rejected', color: '#FF3B30', icon: 'close-circle-outline' },
  { id: 'cancelled', name: 'Cancelled', color: '#8E8E93', icon: 'close-outline' }
];

const PoliceLeaveManagementScreen = () => {
  const [leaves, setLeaves] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState('startDate');
  const [activeTab, setActiveTab] = useState('all');

  const [newLeave, setNewLeave] = useState({
    officerId: '',
    officerName: '',
    leaveType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'pending',
    approvedBy: '',
    remarks: '',
    emergencyContact: '',
    handoverTo: '',
    department: '',
    badgeNumber: '',
    contactNumber: '',
    address: '',
    priority: 'normal'
  });

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaveData, officerData] = await Promise.all([
        getItems('leaves'),
        getItems('employees')
      ]);
      
      // Sort leaves by start date (newest first)
      const sortedLeaves = leaveData.filter(l => l && l !== null).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setLeaves(sortedLeaves);
      setOfficers(officerData.filter(o => o && o !== null));
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const dateString = date.toISOString().split('T')[0];
      setNewLeave(prev => ({ ...prev, [dateField]: dateString }));
    }
  };

  const openDatePicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const saveLeave = async () => {
    if (!newLeave.officerId) {
      Alert.alert('Error', 'Please select an officer');
      return;
    }

    if (!newLeave.leaveType) {
      Alert.alert('Error', 'Please select leave type');
      return;
    }

    if (!newLeave.startDate) {
      Alert.alert('Error', 'Please select start date');
      return;
    }

    if (!newLeave.endDate) {
      Alert.alert('Error', 'Please select end date');
      return;
    }

    if (new Date(newLeave.startDate) > new Date(newLeave.endDate)) {
      Alert.alert('Error', 'End date cannot be before start date');
      return;
    }

    if (!newLeave.reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for leave');
      return;
    }

    try {
      const leaveData = {
        ...newLeave,
        daysRequested: calculateDays(newLeave.startDate, newLeave.endDate),
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser?.$id,
        lastModified: new Date().toISOString()
      };

      if (selectedLeave) {
        await handleDataUpdate('leaves', selectedLeave.$id, leaveData, 'leaves');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Leave request updated successfully'
        });
      } else {
        await handleDataSubmit('leaves', leaveData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Leave request submitted successfully'
        });
      }

      setShowAddModal(false);
      setSelectedLeave(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving leave:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save leave request'
      });
    }
  };

  const resetForm = () => {
    setNewLeave({
      officerId: '',
      officerName: '',
      leaveType: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'pending',
      approvedBy: '',
      remarks: '',
      emergencyContact: '',
      handoverTo: '',
      department: '',
      badgeNumber: '',
      contactNumber: '',
      address: '',
      priority: 'normal'
    });
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const deleteLeave = async (leaveId) => {
    Alert.alert(
      'Delete Leave Request',
      'Are you sure you want to delete this leave request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleDataDelete('leaves', leaveId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Leave request deleted successfully'
              });
              fetchData();
            } catch (error) {
              console.error('Error deleting leave:', error);
              Alert.alert('Error', 'Failed to delete leave request');
            }
          }
        }
      ]
    );
  };

  const handleLeavePress = (leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const handleEditLeave = (leave) => {
    setSelectedLeave(leave);
    setNewLeave({
      officerId: leave.officerId || '',
      officerName: leave.officerName || '',
      leaveType: leave.leaveType || '',
      startDate: leave.startDate || new Date().toISOString().split('T')[0],
      endDate: leave.endDate || new Date().toISOString().split('T')[0],
      reason: leave.reason || '',
      status: leave.status || 'pending',
      approvedBy: leave.approvedBy || '',
      remarks: leave.remarks || '',
      emergencyContact: leave.emergencyContact || '',
      handoverTo: leave.handoverTo || '',
      department: leave.department || '',
      badgeNumber: leave.badgeNumber || '',
      contactNumber: leave.contactNumber || '',
      address: leave.address || '',
      priority: leave.priority || 'normal'
    });
    setShowAddModal(true);
  };

  const updateLeaveStatus = async (leaveId, newStatus) => {
    try {
      await handleDataUpdate('leaves', leaveId, {
        status: newStatus,
        approvedBy: currentUser?.$id,
        lastModified: new Date().toISOString()
      }, 'leaves');
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Leave request ${newStatus} successfully`
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating leave status:', error);
      Alert.alert('Error', 'Failed to update leave status');
    }
  };

  const filterLeaves = () => {
    let filtered = leaves.filter(leave => leave !== null && leave !== undefined);

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(leave => 
        (leave.officerName && leave.officerName.toLowerCase().includes(query)) ||
        (leave.reason && leave.reason.toLowerCase().includes(query)) ||
        (leave.leaveType && leave.leaveType.toLowerCase().includes(query)) ||
        (leave.badgeNumber && leave.badgeNumber.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(leave => leave.leaveType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }

    // Filter by active tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(leave => leave.status === 'pending');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(leave => leave.status === 'approved');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(leave => leave.status === 'rejected');
    }

    return filtered;
  };

  const getLeaveStats = () => {
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l && l.status === 'pending').length,
      approved: leaves.filter(l => l && l.status === 'approved').length,
      rejected: leaves.filter(l => l && l.status === 'rejected').length,
      thisMonth: leaves.filter(l => {
        if (!l || !l.startDate) return false;
        const leaveDate = new Date(l.startDate);
        const now = new Date();
        return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
      }).length
    };
    return stats;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusObj = LEAVE_STATUS.find(s => s.id === status);
    return statusObj ? statusObj.color : '#8E8E93';
  };

  const getTypeColor = (type) => {
    const typeObj = LEAVE_TYPES.find(t => t.name === type);
    return typeObj ? typeObj.color : '#8E8E93';
  };

  const stats = getLeaveStats();
  const filteredLeaves = filterLeaves();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Management</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.summaryGradient}>
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.total}</Text>
                <Text style={styles.summaryLabel}>Total Requests</Text>
              </LinearGradient>
            </View>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#FF9500', '#FF6B00']} style={styles.summaryGradient}>
                <Ionicons name="time" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.pending}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </LinearGradient>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#34C759', '#28A745']} style={styles.summaryGradient}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.approved}</Text>
                <Text style={styles.summaryLabel}>Approved</Text>
              </LinearGradient>
            </View>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#AF52DE', '#8E44AD']} style={styles.summaryGradient}>
                <Ionicons name="calendar-outline" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.thisMonth}</Text>
                <Text style={styles.summaryLabel}>This Month</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Status Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={activeTab === 'all' ? '#fff' : '#007AFF'} 
              />
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All ({stats.total})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
              onPress={() => setActiveTab('pending')}
            >
              <Ionicons 
                name="time" 
                size={20} 
                color={activeTab === 'pending' ? '#fff' : '#FF9500'} 
              />
              <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                Pending ({stats.pending})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
              onPress={() => setActiveTab('approved')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={activeTab === 'approved' ? '#fff' : '#34C759'} 
              />
              <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
                Approved ({stats.approved})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
              onPress={() => setActiveTab('rejected')}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={activeTab === 'rejected' ? '#fff' : '#FF3B30'} 
              />
              <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
                Rejected ({stats.rejected})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <InputField
            placeholder="Search by officer name, reason, or type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, typeFilter === 'all' && styles.activeFilterChip]}
                onPress={() => setTypeFilter('all')}
              >
                <Text style={[styles.filterChipText, typeFilter === 'all' && styles.activeFilterChipText]}>
                  All Types
                </Text>
              </TouchableOpacity>
              {LEAVE_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.filterChip, typeFilter === type.name && styles.activeFilterChip]}
                  onPress={() => setTypeFilter(type.name)}
                >
                  <Ionicons name={type.icon} size={16} color={typeFilter === type.name ? '#fff' : type.color} />
                  <Text style={[styles.filterChipText, typeFilter === type.name && styles.activeFilterChipText]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Leave Requests List */}
        <View style={styles.leavesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📋 Leave Requests ({filteredLeaves.length})
            </Text>
          </View>

          {filteredLeaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {searchQuery || typeFilter !== 'all' ? 'No Leave Requests Found' : 'No Leave Requests'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Submit the first leave request to get started'
                }
              </Text>
              {!searchQuery && typeFilter === 'all' && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addFirstButtonText}>Submit First Request</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredLeaves.map((leave) => (
              <TouchableOpacity
                key={leave.$id}
                style={styles.leaveCard}
                onPress={() => handleLeavePress(leave)}
                activeOpacity={0.7}
              >
                <View style={styles.leaveHeader}>
                  <View style={styles.leaveInfo}>
                    <View style={styles.officerInfo}>
                      <Ionicons name="person-circle" size={24} color="#007AFF" />
                      <View style={styles.officerDetails}>
                        <Text style={styles.officerName}>{leave.officerName || 'Unknown Officer'}</Text>
                        {leave.badgeNumber && (
                          <Text style={styles.badgeNumber}>Badge: {leave.badgeNumber}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.leaveTypeContainer}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(leave.leaveType) }]}>
                        <Ionicons name={LEAVE_TYPES.find(t => t.name === leave.leaveType)?.icon || 'calendar'} size={12} color="#fff" />
                        <Text style={styles.typeText}>{leave.leaveType}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(leave.status) }]}>
                        <Text style={styles.statusText}>{leave.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.leaveActions}>
                    <TouchableOpacity onPress={() => handleEditLeave(leave)}>
                      <Ionicons name="pencil-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteLeave(leave.$id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.leaveDetails}>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.dateText}>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </Text>
                    <Text style={styles.daysText}>({leave.daysRequested || calculateDays(leave.startDate, leave.endDate)} days)</Text>
                  </View>
                  
                  {leave.reason && (
                    <View style={styles.reasonContainer}>
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={styles.reasonText} numberOfLines={2}>
                        {leave.reason}
                      </Text>
                    </View>
                  )}

                  {leave.emergencyContact && (
                    <View style={styles.emergencyContainer}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.emergencyText}>
                        Emergency: {leave.emergencyContact}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Leave Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedLeave ? 'Edit Leave Request' : 'Submit Leave Request'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSelectedLeave(null);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formContainer}>
                {/* Officer Information */}
                <Text style={styles.formSectionTitle}>👮 Officer Information</Text>
                
                <SelectDropdown
                  label="Select Officer *"
                  value={newLeave.officerId}
                  onValueChange={(value) => {
                    const officer = officers.find(o => o.$id === value);
                    setNewLeave(prev => ({
                      ...prev,
                      officerId: value,
                      officerName: officer ? (officer.fullName || officer.name) : '',
                      badgeNumber: officer ? (officer.badgeNumber || '') : '',
                      department: officer ? (officer.department || '') : '',
                      contactNumber: officer ? (officer.phone || '') : ''
                    }));
                  }}
                  items={officers.map(officer => ({
                    label: `${officer.fullName || officer.name} (${officer.badgeNumber || 'No Badge'})`,
                    value: officer.$id
                  }))}
                  placeholder="Select officer"
                />

                {/* Leave Details */}
                <Text style={styles.formSectionTitle}>📋 Leave Details</Text>
                
                <SelectDropdown
                  label="Leave Type *"
                  value={newLeave.leaveType}
                  onValueChange={(value) => setNewLeave(prev => ({ ...prev, leaveType: value }))}
                  items={LEAVE_TYPES.map(type => ({
                    label: type.name,
                    value: type.name
                  }))}
                  placeholder="Select leave type"
                />

                <View style={styles.dateRow}>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('startDate')}
                  >
                    <Text style={styles.dateLabel}>Start Date *</Text>
                    <Text style={styles.dateValue}>
                      {newLeave.startDate ? formatDate(newLeave.startDate) : 'Select Date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('endDate')}
                  >
                    <Text style={styles.dateLabel}>End Date *</Text>
                    <Text style={styles.dateValue}>
                      {newLeave.endDate ? formatDate(newLeave.endDate) : 'Select Date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>

                {newLeave.startDate && newLeave.endDate && (
                  <View style={styles.daysInfo}>
                    <Ionicons name="time" size={16} color="#007AFF" />
                    <Text style={styles.daysInfoText}>
                      Total Days: {calculateDays(newLeave.startDate, newLeave.endDate)} days
                    </Text>
                  </View>
                )}

                <InputField
                  label="Reason for Leave *"
                  value={newLeave.reason}
                  onChangeText={(text) => setNewLeave(prev => ({ ...prev, reason: text }))}
                  placeholder="Please provide a detailed reason for your leave request"
                  multiline={true}
                  numberOfLines={4}
                />

                {/* Contact Information */}
                <Text style={styles.formSectionTitle}>📞 Contact Information</Text>
                
                <InputField
                  label="Emergency Contact"
                  value={newLeave.emergencyContact}
                  onChangeText={(text) => setNewLeave(prev => ({ ...prev, emergencyContact: text }))}
                  placeholder="Emergency contact number"
                  keyboardType="phone-pad"
                />

                <InputField
                  label="Handover To"
                  value={newLeave.handoverTo}
                  onChangeText={(text) => setNewLeave(prev => ({ ...prev, handoverTo: text }))}
                  placeholder="Officer to handover duties to"
                />

                <InputField
                  label="Address During Leave"
                  value={newLeave.address}
                  onChangeText={(text) => setNewLeave(prev => ({ ...prev, address: text }))}
                  placeholder="Address where you can be reached"
                  multiline={true}
                  numberOfLines={3}
                />

                {/* Additional Information */}
                <Text style={styles.formSectionTitle}>📝 Additional Information</Text>
                
                <InputField
                  label="Remarks"
                  value={newLeave.remarks}
                  onChangeText={(text) => setNewLeave(prev => ({ ...prev, remarks: text }))}
                  placeholder="Any additional remarks or special requests"
                  multiline={true}
                  numberOfLines={3}
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={saveLeave}>
                  <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.submitGradient}>
                    <Text style={styles.submitButtonText}>
                      {selectedLeave ? 'Update Request' : 'Submit Request'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leave Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedLeave ? (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Leave Request Details</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.leaveHeader}>
                    <View style={styles.leaveIcon}>
                      <Ionicons name="calendar" size={40} color="#007AFF" />
                    </View>
                    <Text style={styles.leaveTitle}>{selectedLeave.officerName}</Text>
                    <Text style={styles.leaveSubtitle}>
                      {selectedLeave.leaveType} • {selectedLeave.daysRequested || calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
                    </Text>
                    <View style={styles.leaveTypeContainer}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedLeave.leaveType) }]}>
                        <Ionicons name={LEAVE_TYPES.find(t => t.name === selectedLeave.leaveType)?.icon || 'calendar'} size={16} color="#fff" />
                        <Text style={styles.typeText}>{selectedLeave.leaveType}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedLeave.status) }]}>
                        <Text style={styles.statusText}>{selectedLeave.status}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>📅 Leave Period</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#007AFF" />
                      <Text style={styles.detailLabel}>Start Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedLeave.startDate)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#007AFF" />
                      <Text style={styles.detailLabel}>End Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedLeave.endDate)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#007AFF" />
                      <Text style={styles.detailLabel}>Total Days:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLeave.daysRequested || calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>👮 Officer Information</Text>
                    
                    {selectedLeave.badgeNumber && (
                      <View style={styles.detailRow}>
                        <Ionicons name="shield" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Badge Number:</Text>
                        <Text style={styles.detailValue}>{selectedLeave.badgeNumber}</Text>
                      </View>
                    )}
                    
                    {selectedLeave.department && (
                      <View style={styles.detailRow}>
                        <Ionicons name="business" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Department:</Text>
                        <Text style={styles.detailValue}>{selectedLeave.department}</Text>
                      </View>
                    )}
                    
                    {selectedLeave.contactNumber && (
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Contact:</Text>
                        <Text style={styles.detailValue}>{selectedLeave.contactNumber}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>💬 Reason</Text>
                    <Text style={styles.reasonText}>{selectedLeave.reason}</Text>
                  </View>
                  
                  {selectedLeave.emergencyContact && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📞 Emergency Contact</Text>
                      <Text style={styles.detailValue}>{selectedLeave.emergencyContact}</Text>
                    </View>
                  )}
                  
                  {selectedLeave.handoverTo && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>🔄 Handover</Text>
                      <Text style={styles.detailValue}>{selectedLeave.handoverTo}</Text>
                    </View>
                  )}
                  
                  {selectedLeave.address && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📍 Address During Leave</Text>
                      <Text style={styles.detailValue}>{selectedLeave.address}</Text>
                    </View>
                  )}
                  
                  {selectedLeave.remarks && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📝 Remarks</Text>
                      <Text style={styles.remarksText}>{selectedLeave.remarks}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>📊 Request Information</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#007AFF" />
                      <Text style={styles.detailLabel}>Submitted:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLeave.submittedAt ? formatDate(selectedLeave.submittedAt) : 'N/A'}
                      </Text>
                    </View>
                    
                    {selectedLeave.approvedBy && (
                      <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Approved By:</Text>
                        <Text style={styles.detailValue}>{selectedLeave.approvedBy}</Text>
                      </View>
                    )}
                    
                    {selectedLeave.lastModified && (
                      <View style={styles.detailRow}>
                        <Ionicons name="refresh" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Last Modified:</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(selectedLeave.lastModified)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.modalActions}>
                  {selectedLeave.status === 'pending' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          updateLeaveStatus(selectedLeave.$id, 'approved');
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          updateLeaveStatus(selectedLeave.$id, 'rejected');
                        }}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setShowDetailsModal(false);
                      handleEditLeave(selectedLeave);
                    }}
                  >
                    <Ionicons name="create" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit Request</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => {
                      setShowDetailsModal(false);
                      deleteLeave(selectedLeave.$id);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete Request</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>No Leave Request Selected</Text>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    height: 80,
    marginHorizontal: 4,
  },
  summaryGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  leavesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  leaveCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leaveInfo: {
    flex: 1,
  },
  officerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  officerDetails: {
    marginLeft: 10,
  },
  officerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  badgeNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  leaveActions: {
    flexDirection: 'row',
    gap: 12,
  },
  leaveDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  daysText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  emergencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  modalScroll: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9eb',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  daysInfoText: {
    fontSize: 14,
    color: '#67c23a',
    fontWeight: '600',
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  leaveHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leaveIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  leaveSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  remarksText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  approveButtonText: {
    color: '#fff',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  rejectButtonText: {
    color: '#fff',
  },
  deleteActionButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  deleteActionText: {
    color: '#fff',
  },
});

export default PoliceLeaveManagementScreen; 