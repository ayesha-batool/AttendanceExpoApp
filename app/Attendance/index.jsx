import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

// Import components
import AddButton from '../../components/AddButton';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SummaryCard from '../../components/SummaryCard';

const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
  NOT_SET: "Not Set",
};

const LEAVE_TYPES = [
  { id: 'annual', name: 'Annual Leave', color: '#34C759', icon: 'calendar-outline' },
  { id: 'sick', name: 'Sick Leave', color: '#FF3B30', icon: 'medical-outline' },
  { id: 'emergency', name: 'Emergency Leave', color: '#FF9500', icon: 'warning-outline' },
  { id: 'maternity', name: 'Maternity Leave', color: '#AF52DE', icon: 'heart-outline' },
  { id: 'paternity', name: 'Paternity Leave', color: '#007AFF', icon: 'people-outline' },
  { id: 'compensatory', name: 'Compensatory Leave', color: '#5856D6', icon: 'time-outline' },
  { id: 'training', name: 'Training Leave', color: '#FF2D92', icon: 'school-outline' },
  { id: 'official', name: 'Official Duty', color: '#8E8E93', icon: 'briefcase-outline' },
  { id: 'bereavement', name: 'Bereavement Leave', color: '#6C757D', icon: 'heart-broken-outline' },
  { id: 'study', name: 'Study Leave', color: '#20C997', icon: 'library-outline' }
];

// Custom Bottom Bar Component
const AttendanceBottomBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { icon: "calendar-outline", label: "Attendance", key: "attendance" },
    { icon: "time-outline", label: "Leave", key: "leave" },
    { icon: "sunny-outline", label: "Holidays", key: "holidays" },
  ];

  return (
    <View style={styles.bottomBar}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          onPress={() => onTabPress(tab.key)}
        >
          {tab.key === activeTab && <View style={styles.activeIndicator} />}
          <Icon
            name={tab.icon}
            size={20}
            color={tab.key === activeTab ? "#4a90e2" : "#8e8e93"}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: tab.key === activeTab ? "#4a90e2" : "#8e8e93" },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function AttendanceScreen() {
  // State management
  const [activeTab, setActiveTab] = useState('attendance');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Leave state
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    employeeName: '',
    leaveType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'pending',
    remarks: ''
  });
  
  // Holiday state
  const [holidays, setHolidays] = useState([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'public'
  });

  // Load data on focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load employees
      const employeesData = await AsyncStorage.getItem('employees');
      if (employeesData) {
        const parsedEmployees = JSON.parse(employeesData);
        setEmployees(parsedEmployees);
        console.log('📦 Loaded employees from storage:', parsedEmployees.length);
      } else {
        // If no employees exist, create some sample data
        const sampleEmployees = [
          {
            id: '1',
            fullName: 'John Doe',
            phone: '+1234567890',
            email: 'john.doe@company.com',
            department: 'Engineering',
            rank: 'Senior Developer',
            employeeId: 'EMP001',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            fullName: 'Jane Smith',
            phone: '+1234567891',
            email: 'jane.smith@company.com',
            department: 'Marketing',
            rank: 'Marketing Manager',
            employeeId: 'EMP002',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            fullName: 'Mike Johnson',
            phone: '+1234567892',
            email: 'mike.johnson@company.com',
            department: 'Sales',
            rank: 'Sales Executive',
            employeeId: 'EMP003',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        
        await AsyncStorage.setItem('employees', JSON.stringify(sampleEmployees));
        setEmployees(sampleEmployees);
        console.log('📦 Created sample employees:', sampleEmployees.length);
        
        Toast.show({
          type: 'info',
          text1: 'Sample Data Created',
          text2: 'Added sample employees for testing'
        });
      }

      // Load attendance records
      const attendanceData = await AsyncStorage.getItem('attendance');
      if (attendanceData) {
        setAttendanceRecords(JSON.parse(attendanceData));
      }

      // Load leaves
      const leavesData = await AsyncStorage.getItem('leaves');
      if (leavesData) {
        setLeaves(JSON.parse(leavesData));
      }

      // Load holidays
      const holidaysData = await AsyncStorage.getItem('holidays');
      if (holidaysData) {
        setHolidays(JSON.parse(holidaysData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tab navigation
  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
  };

  // Attendance functions
  const markAttendance = async (employeeId, status) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Check if attendance already exists for today
      const existingRecordIndex = attendanceRecords.findIndex(record => 
        record.employeeId === employeeId && record.date === today
      );

      let updatedRecords;
      if (existingRecordIndex >= 0) {
        // Update existing record
        const existingRecord = attendanceRecords[existingRecordIndex];
        const updatedRecord = {
          ...existingRecord,
          status,
          checkIn: status === ATTENDANCE_STATUS.PRESENT ? new Date().toISOString() : existingRecord.checkIn,
          checkOut: status !== ATTENDANCE_STATUS.PRESENT ? new Date().toISOString() : existingRecord.checkOut,
          updatedAt: new Date().toISOString()
        };
        
        updatedRecords = [...attendanceRecords];
        updatedRecords[existingRecordIndex] = updatedRecord;
      } else {
        // Create new record
        const attendanceRecord = {
          id: Date.now().toString(),
          employeeId,
          employeeName: employee.fullName,
          date: today,
          status,
          checkIn: status === ATTENDANCE_STATUS.PRESENT ? new Date().toISOString() : null,
          checkOut: null,
          workingHours: 0,
          remarks: '',
          createdAt: new Date().toISOString()
        };

        updatedRecords = [...attendanceRecords, attendanceRecord];
      }

      await AsyncStorage.setItem('attendance', JSON.stringify(updatedRecords));
      setAttendanceRecords(updatedRecords);

      // Removed success toast
    } catch (error) {
      console.error('Error marking attendance:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark attendance'
      });
    }
  };

  // Leave functions
  const addLeave = async () => {
    try {
      if (!newLeave.employeeId || !newLeave.leaveType || !newLeave.startDate || !newLeave.endDate) {
        Alert.alert('Required Fields', 'Please fill in all required fields');
        return;
      }

      const employee = employees.find(emp => emp.id === newLeave.employeeId);
      if (!employee) {
        Alert.alert('Error', 'Employee not found');
        return;
      }

      const leaveRecord = {
        ...newLeave,
        id: Date.now().toString(),
        employeeName: employee.fullName,
        createdAt: new Date().toISOString()
      };

      const updatedLeaves = [...leaves, leaveRecord];
      await AsyncStorage.setItem('leaves', JSON.stringify(updatedLeaves));
      setLeaves(updatedLeaves);
      setShowLeaveModal(false);
      setNewLeave({
        employeeId: '',
        employeeName: '',
        leaveType: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'pending',
        remarks: ''
      });

      // Removed success toast
    } catch (error) {
      console.error('Error adding leave:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add leave'
      });
    }
  };

  const updateLeaveStatus = async (leaveId, status) => {
    try {
      const updatedLeaves = leaves.map(leave => 
        leave.id === leaveId ? { ...leave, status } : leave
      );
      await AsyncStorage.setItem('leaves', JSON.stringify(updatedLeaves));
      setLeaves(updatedLeaves);

      // Removed success toast
    } catch (error) {
      console.error('Error updating leave status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update status'
      });
    }
  };

  // Holiday functions
  const addHoliday = async () => {
    try {
      if (!newHoliday.title || !newHoliday.date) {
        Alert.alert('Required Fields', 'Please fill in title and date');
        return;
      }

      const holidayRecord = {
        ...newHoliday,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedHolidays = [...holidays, holidayRecord];
      await AsyncStorage.setItem('holidays', JSON.stringify(updatedHolidays));
      setHolidays(updatedHolidays);
      setShowHolidayModal(false);
      setNewHoliday({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'public'
      });

      // Removed success toast
    } catch (error) {
      console.error('Error adding holiday:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add holiday'
      });
    }
  };

  const deleteHoliday = async (holidayId) => {
    try {
      const updatedHolidays = holidays.filter(holiday => holiday.id !== holidayId);
      await AsyncStorage.setItem('holidays', JSON.stringify(updatedHolidays));
      setHolidays(updatedHolidays);

      // Removed success toast
    } catch (error) {
      console.error('Error deleting holiday:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete holiday'
      });
    }
  };

  // Get filtered data
  const getFilteredEmployees = () => {
    if (!searchQuery) return employees;
    return employees.filter(emp => 
      emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredLeaves = () => {
    if (!searchQuery) return leaves;
    return leaves.filter(leave => 
      leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leaveType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredHolidays = () => {
    if (!searchQuery) return holidays;
    return holidays.filter(holiday => 
      holiday.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holiday.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get attendance statistics
  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    
    return {
      present: todayRecords.filter(record => record.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: todayRecords.filter(record => record.status === ATTENDANCE_STATUS.ABSENT).length,
      halfDay: todayRecords.filter(record => record.status === ATTENDANCE_STATUS.HALF_DAY).length,
      onLeave: todayRecords.filter(record => record.status === ATTENDANCE_STATUS.LEAVE).length
    };
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
    return (
          <View style={styles.tabContent}>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <SummaryCard 
                icon="checkmark-circle" 
                label="Present Today" 
                value={getAttendanceStats().present}
                colors={['#34C759', '#30D158']}
              />
              <SummaryCard 
                icon="close-circle" 
                label="Absent Today" 
                value={getAttendanceStats().absent}
                colors={['#FF3B30', '#FF453A']}
              />
              <SummaryCard 
                icon="time" 
                label="Half Day" 
                value={getAttendanceStats().halfDay}
                colors={['#FF9500', '#FF9F0A']}
              />
              <SummaryCard 
                icon="calendar" 
                label="On Leave" 
                value={getAttendanceStats().onLeave}
                colors={['#AF52DE', '#BF5AF2']}
              />
      </View>

            {/* Search Bar */}
            <SearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="🔍 Search employees..."
            />

            {/* Employee List for Attendance */}
            {isLoading ? (
              <LoadingState text="Loading employees..." />
            ) : getFilteredEmployees().length === 0 ? (
              <EmptyState 
                icon="people-outline"
                title="No Employees Found"
                subtitle="Add employees to mark attendance"
              />
            ) : (
              <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
                {getFilteredEmployees().map((employee) => {
                  const todayRecord = attendanceRecords.find(record => 
                    record.employeeId === employee.id && 
                    record.date === new Date().toISOString().split('T')[0]
                  );

  return (
                    <View key={`attendance-${employee.id || employee.$id}-${index}`} style={styles.employeeAttendanceCard}>
                      <View style={styles.employeeInfo}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.employeeAvatar}
                        >
                          <Icon name="person" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={styles.employeeDetails}>
                          <Text style={styles.employeeName}>{employee.fullName}</Text>
                          <Text style={styles.employeePosition}>{employee.department}</Text>
                          <Text style={styles.attendanceStatus}>
                            Status: {todayRecord ? todayRecord.status : 'Not Marked'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.attendanceActions}>
            <TouchableOpacity
                          style={[styles.attendanceBtn, styles.presentBtn]}
                          onPress={() => markAttendance(employee.id, ATTENDANCE_STATUS.PRESENT)}
                        >
                          <Icon name="checkmark" size={16} color="#fff" />
                          <Text style={styles.attendanceBtnText}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
                          style={[styles.attendanceBtn, styles.absentBtn]}
                          onPress={() => markAttendance(employee.id, ATTENDANCE_STATUS.ABSENT)}
            >
                          <Icon name="close" size={16} color="#fff" />
                          <Text style={styles.attendanceBtnText}>Absent</Text>
            </TouchableOpacity>
              <TouchableOpacity
                          style={[styles.attendanceBtn, styles.halfDayBtn]}
                          onPress={() => markAttendance(employee.id, ATTENDANCE_STATUS.HALF_DAY)}
                        >
                          <Icon name="time" size={16} color="#fff" />
                          <Text style={styles.attendanceBtnText}>Half Day</Text>
              </TouchableOpacity>
                      </View>
                    </View>
            );
          })}
        </ScrollView>
            )}
          </View>
        );

      case 'leave':
        return (
          <View style={styles.tabContent}>
            {/* Summary Cards */}
        <View style={styles.summaryContainer}>
              <SummaryCard 
                icon="time-outline" 
                label="Pending Leaves" 
                value={leaves.filter(leave => leave.status === 'pending').length}
                colors={['#FF9500', '#FF9F0A']}
              />
              <SummaryCard 
                icon="checkmark-circle" 
                label="Approved" 
                value={leaves.filter(leave => leave.status === 'approved').length}
                colors={['#34C759', '#30D158']}
              />
              <SummaryCard 
                icon="close-circle" 
                label="Rejected" 
                value={leaves.filter(leave => leave.status === 'rejected').length}
                colors={['#FF3B30', '#FF453A']}
              />
            </View>

            {/* Search Bar */}
            <SearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="🔍 Search leaves..."
            />

            {/* Add Leave Button */}
            <AddButton 
              onPress={() => setShowLeaveModal(true)}
              text="Add Leave Request"
              icon="add-circle"
            />

            {/* Leave List */}
            {isLoading ? (
              <LoadingState text="Loading leaves..." />
            ) : getFilteredLeaves().length === 0 ? (
              <EmptyState 
                icon="time-outline"
                title="No Leave Requests"
                subtitle="Add leave requests to get started"
              />
            ) : (
              <ScrollView style={styles.leaveList} showsVerticalScrollIndicator={false}>
                {getFilteredLeaves().map((leave) => (
                  <View key={leave.id} style={styles.leaveCard}>
                    <View style={styles.leaveHeader}>
                      <Text style={styles.leaveEmployeeName}>{leave.employeeName}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: leave.status === 'approved' ? '#34C759' : 
                                         leave.status === 'rejected' ? '#FF3B30' : '#FF9500' }
                      ]}>
                        <Text style={styles.statusText}>{leave.status}</Text>
            </View>
            </View>
                    <View style={styles.leaveDetails}>
                      <Text style={styles.leaveType}>{leave.leaveType}</Text>
                      <Text style={styles.leaveDates}>
                        {leave.startDate} to {leave.endDate}
              </Text>
                      <Text style={styles.leaveReason}>{leave.reason}</Text>
            </View>
                    {leave.status === 'pending' && (
                      <View style={styles.leaveActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => updateLeaveStatus(leave.id, 'approved')}
                        >
                          <Icon name="checkmark" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => updateLeaveStatus(leave.id, 'rejected')}
                        >
                          <Icon name="close" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
          </View>
                    )}
        </View>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'holidays':
        return (
          <View style={styles.tabContent}>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <SummaryCard 
                icon="sunny-outline" 
                label="Total Holidays" 
                value={holidays.length}
                colors={['#FF9500', '#FF9F0A']}
              />
              <SummaryCard 
                icon="calendar-outline" 
                label="This Month" 
                value={holidays.filter(holiday => {
                  const holidayDate = new Date(holiday.date);
                  const now = new Date();
                  return holidayDate.getMonth() === now.getMonth() && 
                         holidayDate.getFullYear() === now.getFullYear();
                }).length}
                colors={['#AF52DE', '#BF5AF2']}
              />
            </View>

            {/* Search Bar */}
            <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
              placeholder="🔍 Search holidays..."
            />

            {/* Add Holiday Button */}
            <AddButton 
              onPress={() => setShowHolidayModal(true)}
              text="Add Holiday"
              icon="add-circle"
            />

            {/* Holiday List */}
            {isLoading ? (
              <LoadingState text="Loading holidays..." />
            ) : getFilteredHolidays().length === 0 ? (
              <EmptyState 
                icon="sunny-outline"
                title="No Holidays"
                subtitle="Add holidays to get started"
              />
            ) : (
              <ScrollView style={styles.holidayList} showsVerticalScrollIndicator={false}>
                {getFilteredHolidays().map((holiday) => (
                  <View key={holiday.id} style={styles.holidayCard}>
                    <View style={styles.holidayHeader}>
                      <Icon name="sunny" size={24} color="#FF9500" />
                      <Text style={styles.holidayTitle}>{holiday.title}</Text>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          Alert.alert(
                            'Delete Holiday',
                            'Are you sure you want to delete this holiday?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', onPress: () => deleteHoliday(holiday.id), style: 'destructive' }
                            ]
                          );
                        }}
                      >
                        <Icon name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
                    <Text style={styles.holidayDate}>{holiday.date}</Text>
                    {holiday.description && (
                      <Text style={styles.holidayDescription}>{holiday.description}</Text>
                    )}
                    <View style={styles.holidayType}>
                      <Text style={styles.typeText}>{holiday.type}</Text>
          </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );

      default:
        return null;
    }
            };

            return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>📅 Attendance Management</Text>
              <Text style={styles.headerSubtitle}>Track employee attendance and time</Text>
                  </View>
            <View style={styles.headerRight}>
              <Icon name="calendar" size={40} color="#fff" />
                  </View>
          </View>
        </LinearGradient>
                </View>

      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Bottom Bar */}
      <AttendanceBottomBar activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Add Leave Modal */}
      <Modal
        visible={showLeaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>➕ Add Leave Request</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formLabel}>👤 Employee *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>
                  {newLeave.employeeId ? 
                    employees.find(emp => emp.id === newLeave.employeeId)?.fullName : 
                    'Select Employee'
                  }
                      </Text>
                    <TouchableOpacity
                  style={styles.pickerButton}
                      onPress={() => {
                    Alert.alert(
                      'Select Employee',
                      'Choose an employee',
                      employees.map(emp => ({
                        text: emp.fullName,
                        onPress: () => setNewLeave(prev => ({ 
                          ...prev,
                          employeeId: emp.id,
                          employeeName: emp.fullName 
                        }))
                      }))
                    );
                  }}
                >
                  <Icon name="chevron-down" size={20} color="#667eea" />
                    </TouchableOpacity>
                  </View>

              <Text style={styles.formLabel}>📅 Leave Type *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>
                  {newLeave.leaveType || 'Select Leave Type'}
                      </Text>
                    <TouchableOpacity
                  style={styles.pickerButton}
                      onPress={() => {
                    Alert.alert(
                      'Select Leave Type',
                      'Choose leave type',
                      LEAVE_TYPES.map(type => ({
                        text: type.name,
                        onPress: () => setNewLeave(prev => ({ ...prev, leaveType: type.name }))
                      }))
                    );
                  }}
                >
                  <Icon name="chevron-down" size={20} color="#667eea" />
                    </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>📅 Start Date *</Text>
              <TextInput
                style={styles.formInput}
                value={newLeave.startDate}
                onChangeText={(text) => setNewLeave(prev => ({ ...prev, startDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>📅 End Date *</Text>
              <TextInput
                style={styles.formInput}
                value={newLeave.endDate}
                onChangeText={(text) => setNewLeave(prev => ({ ...prev, endDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>📝 Reason</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newLeave.reason}
                onChangeText={(text) => setNewLeave(prev => ({ ...prev, reason: text }))}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>📝 Remarks</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newLeave.remarks}
                onChangeText={(text) => setNewLeave(prev => ({ ...prev, remarks: text }))}
                placeholder="Additional remarks"
                multiline
                numberOfLines={2}
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity style={styles.saveButton} onPress={addLeave}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Add Leave Request</Text>
                </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal
        visible={showHolidayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHolidayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>➕ Add Holiday</Text>
              <TouchableOpacity onPress={() => setShowHolidayModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formLabel}>🎉 Holiday Title *</Text>
              <TextInput
                style={styles.formInput}
                value={newHoliday.title}
                onChangeText={(text) => setNewHoliday(prev => ({ ...prev, title: text }))}
                placeholder="Enter holiday title"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>📅 Date *</Text>
              <TextInput
                style={styles.formInput}
                value={newHoliday.date}
                onChangeText={(text) => setNewHoliday(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>📝 Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newHoliday.description}
                onChangeText={(text) => setNewHoliday(prev => ({ ...prev, description: text }))}
                placeholder="Enter holiday description"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>🏷️ Type</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>
                  {newHoliday.type || 'Select Type'}
                </Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Type',
                      'Choose holiday type',
                      [
                        { text: 'Public Holiday', onPress: () => setNewHoliday(prev => ({ ...prev, type: 'public' })) },
                        { text: 'Company Holiday', onPress: () => setNewHoliday(prev => ({ ...prev, type: 'company' })) },
                        { text: 'Optional Holiday', onPress: () => setNewHoliday(prev => ({ ...prev, type: 'optional' })) }
                      ]
                    );
                  }}
                >
                  <Icon name="chevron-down" size={20} color="#667eea" />
                </TouchableOpacity>
          </View>

              <TouchableOpacity style={styles.saveButton} onPress={addHoliday}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Add Holiday</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  employeeList: {
    flex: 1,
  },
  leaveList: {
    flex: 1,
  },
  holidayList: {
    flex: 1,
  },
  employeeAttendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  attendanceStatus: {
    fontSize: 12,
    color: '#9ca3af',
  },
  attendanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  presentBtn: {
    backgroundColor: '#34C759',
  },
  absentBtn: {
    backgroundColor: '#FF3B30',
  },
  halfDayBtn: {
    backgroundColor: '#FF9500',
  },
  attendanceBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveEmployeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  leaveDetails: {
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
    marginBottom: 4,
  },
  leaveDates: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  leaveReason: {
    fontSize: 12,
    color: '#9ca3af',
  },
  leaveActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  approveBtn: {
    backgroundColor: '#34C759',
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  holidayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  holidayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginLeft: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  holidayDate: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 4,
  },
  holidayDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  holidayType: {
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 1.5,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pickerButton: {
    padding: 4,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
