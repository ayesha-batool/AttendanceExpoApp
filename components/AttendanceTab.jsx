import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getItems, saveData } from '../services/unifiedDataService';
import StatCard from './StatCard';

const AttendanceTab = ({ employees = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [showManualTimeModal, setShowManualTimeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [manualCheckInTime, setManualCheckInTime] = useState('09:00');
  const [manualCheckOutTime, setManualCheckOutTime] = useState('17:00');
  const [customToast, setCustomToast] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [tempYear, setTempYear] = useState('');

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };




  // Load attendance data when component mounts and when date changes
  useEffect(() => {
    try {

      const loadData = async () => {
        await loadAttendanceData();
      };
      loadData();
    } catch (error) {
      console.error('❌ Error loading attendance:', error);
    }
  }, [selectedDate]); // Reload when date changes

  // Initialize attendance for selected date when employees change
  useEffect(() => {
    if (employees.length > 0) {
      // Only initialize if we don't have any data for this date yet
      const selectedDateKey = formatDate(selectedDate);
      const currentAttendance = attendanceData[selectedDateKey] || {};
      const hasDataForThisDate = Object.keys(currentAttendance).length > 0;

      if (!hasDataForThisDate) {
        console.log(`📅 Initializing attendance for date: ${selectedDateKey}`);
        initializeAttendanceForDate();
      }
    }
  }, [employees]); // Only when employees change, not when date changes



  // Remove automatic saving to prevent infinite loops
  // Data will be saved manually when user makes changes

  const initializeAttendanceForDate = () => {
    const selectedDateKey = formatDate(selectedDate);

    const currentAttendance = attendanceData[selectedDateKey] || {};
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    let needsInit = false;

    activeEmployees.forEach(employee => {
      const employeeId = employee.id || employee.$id;
      if (!currentAttendance[employeeId]) needsInit = true;
    });

    if (needsInit) {
      const newData = { ...attendanceData };
      if (!newData[selectedDateKey]) newData[selectedDateKey] = {};

      activeEmployees.forEach(employee => {
        const employeeId = employee.id || employee.$id;
        // Only initialize if no attendance data exists for this employee on this date
        if (!newData[selectedDateKey][employeeId]) {
          newData[selectedDateKey][employeeId] = {
            status: 'absent',
            checkInTimes: [],
            checkOutTimes: [],
            totalWorkingHours: "0h 0m",
          };
        }
      });

      setAttendanceData(newData);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const selectedDateKey = formatDate(selectedDate);
      console.log(`📥 Loading attendance data for date: ${selectedDateKey}`);

      const savedData = await getItems('attendance');
      console.log(`📥 Loaded ${savedData.length} total attendance records from storage`);

      const attendanceObject = {};

      savedData.forEach(record => {
        console.log("record:", record);
        const dateKey = record.date.split('T')[0];
        // const dateKeyForLoad = dateKey.split('T')[0];
        if (!attendanceObject[dateKey]) attendanceObject[dateKey] = {};

        attendanceObject[dateKey][record.employeeId] = {
          status: record.status || 'absent',
          checkInTimes: record.checkInTimes || [],
          checkOutTimes: record.checkOutTimes || [],
          totalWorkingHours: record.totalWorkingHours || "0h 0m",
          timestamp: record.timestamp,
        };


        // Debug: Log data for current date
        if (dateKey === selectedDateKey) {
          const employee = employees.find(emp => emp.id === record.employeeId);
          if (employee) {
            console.log(`📥 Loaded ${employee.fullName}: status=${record.status}, hours=${record.totalWorkingHours}`);
          }
        }
      });

      console.log(`📥 Setting attendance data to state for ${Object.keys(attendanceObject).length} dates`);
      setAttendanceData(attendanceObject);
      console.log("attendanceObject:", attendanceObject);
      // Check if we have data for current date

      const currentDateData = attendanceObject[selectedDateKey] || {};
      console.log("currentDateData:", currentDateData);
      const currentDateRecords = Object.keys(currentDateData).length;
      console.log("currentDateRecords:", currentDateRecords);
      console.log(`📥 Current date (${selectedDateKey}) has ${currentDateRecords} attendance records`);

      if (currentDateRecords === 0) {
        console.log(`📥 No data found for ${selectedDateKey}, will initialize if needed`);
      }

      console.log('📥 Attendance data loaded successfully!');
    } catch (error) {
      console.error('❌ Error loading attendance:', error);
      // Initialize empty attendance data if loading fails
      setAttendanceData({});
    }
  };



  const formatDate = (date) => {
    // Use local timezone to avoid date shifting issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAttendanceStatus = (employeeId) => {
    const dateKey = formatDate(selectedDate);

    // Always return a valid attendance object
    return attendanceData[dateKey]?.[employeeId] || {
      status: 'absent',
      checkInTimes: [],
      checkOutTimes: [],
      totalWorkingHours: 0
    };
  };

  const markAttendance = async (employeeId, status) => {
    const dateKey = formatDate(selectedDate);
    const today = formatDate(new Date());

    // Prevent marking attendance for future dates
    if (dateKey > today) {
      showCustomToast('error', 'Future Date', 'Cannot mark attendance for future dates');
      return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    const employeeName = employee?.fullName || 'Unknown';

    // Check if attendance already exists for this employee on this date
    const existingAttendance = attendanceData[dateKey]?.[employeeId];

    // Only update if status is different or no attendance exists
    if (!existingAttendance || existingAttendance.status !== status) {
      setAttendanceData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [employeeId]: {
            ...existingAttendance, // Preserve existing data
            status: status,
            checkInTimes: status === 'absent' || status === 'leave' ? [] : (existingAttendance?.checkInTimes || []),
            checkOutTimes: status === 'absent' || status === 'leave' ? [] : (existingAttendance?.checkOutTimes || []),
            totalWorkingHours: status === 'absent' || status === 'leave' ? "0h 0m" : (existingAttendance?.totalWorkingHours || "0h 0m"),
            timestamp: new Date().toISOString(),
          }
        }
      }));

      showCustomToast('success', 'Marked', `${employeeName} marked as ${status}`);

      // Debug: Log when marking leave for Farhan
      if (employeeName.toLowerCase().includes('farhan') && status === 'leave') {
        console.log(`🎯 MARK ATTENDANCE: Marked Farhan as LEAVE`);
        console.log(`🎯 MARK ATTENDANCE: Current attendance data:`, attendanceData[dateKey]);
      }

      // Immediately save this individual attendance record
      const dateOnly = dateKey.replace(/-/g, '');
      const validId = `${dateOnly}_${employeeId}`;

      const attendanceRecord = {
        id: validId,
        employeeId: employeeId,
        employeeName: employeeName,
        date: dateKey,
        status: status,
        checkInTimes: status === 'absent' || status === 'leave' ? [] : (existingAttendance?.checkInTimes || []),
        checkOutTimes: status === 'absent' || status === 'leave' ? [] : (existingAttendance?.checkOutTimes || []),
        totalWorkingHours: status === 'absent' || status === 'leave' ? "0h 0m" : (existingAttendance?.totalWorkingHours || "0h 0m"),
        timestamp: new Date().toISOString(),
        deviceId: null
      };

      try {
        console.log(`💾 Immediately saving ${employeeName} as ${status}...`);
        await saveData(attendanceRecord, 'attendance');
        console.log(`✅ Successfully saved ${employeeName} as ${status}`);
      } catch (error) {
        console.error(`❌ Failed to save ${employeeName}:`, error);
      }


    } else {
      showCustomToast('info', 'Already Marked', `${employeeName} is already marked as ${status}`);
    }
  };

  const calculateTotalHours = (checkInTimes, checkOutTimes) => {
    if (!checkInTimes?.[0] || !checkOutTimes?.[0]) return "0h 0m";

    const [inHour, inMin] = checkInTimes[0].split(':').map(Number);
    const [outHour, outMin] = checkOutTimes[0].split(':').map(Number);
    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);

    if (totalMinutes <= 0) return "0h 0m";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const openManualTimeModal = (employee) => {
    setSelectedEmployee(employee);
    const employeeId = employee.id || employee.$id;
    const dateKey = formatDate(selectedDate);
    const attendance = attendanceData[dateKey]?.[employeeId];

    // Convert 24-hour to 12-hour format
    const formatTo12Hour = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Show previous times if they exist
    const prevCheckIn = attendance?.checkInTimes?.[0] || '';
    const prevCheckOut = attendance?.checkOutTimes?.[0] || '';

    setManualCheckInTime(formatTo12Hour(prevCheckIn));
    setManualCheckOutTime(formatTo12Hour(prevCheckOut));
    setShowManualTimeModal(true);
  };

  const saveManualTime = () => {
    if (!selectedEmployee) return;

    // Regex for HH:MM AM/PM (12-hour format) - more flexible
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

    // Validate check-in time
    if (manualCheckInTime && !timeRegex.test(manualCheckInTime.trim())) {
      showCustomToast('error', 'Invalid Time', 'Check-in time must be in HH:MM AM/PM format (e.g. 12:07 AM)');
      return;
    }

    // Validate check-out time
    if (manualCheckOutTime && !timeRegex.test(manualCheckOutTime.trim())) {
      showCustomToast('error', 'Invalid Time', 'Check-out time must be in HH:MM AM/PM format (e.g. 06:07 PM)');
      return;
    }

    // Function to convert "HH:MM AM/PM" → minutes since midnight
    const convertToMinutes = (timeStr) => {
      if (!timeStr) return null;
      let [time, modifier] = timeStr.trim().toUpperCase().split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    };

    const checkInMinutes = convertToMinutes(manualCheckInTime);
    const checkOutMinutes = convertToMinutes(manualCheckOutTime);

    // Validate check-out > check-in
    if (checkInMinutes !== null && checkOutMinutes !== null && checkOutMinutes <= checkInMinutes) {
      showCustomToast('error', 'Invalid Time', 'Check-out must be after check-in');
      return;
    }

    // If all good, save
    saveManualAttendanceData();
  };

  const saveManualAttendanceData = async () => {
    const currentDateKey = formatDate(selectedDate);
    const today = formatDate(new Date());

    // Prevent saving time for future dates
    if (currentDateKey > today) {
      showCustomToast('error', 'Future Date', 'Cannot save time for future dates');
      return;
    }

    const currentEmployeeId = selectedEmployee.id || selectedEmployee.$id;
    const existingAttendance = attendanceData[currentDateKey]?.[currentEmployeeId];

    // Convert 12-hour to 24-hour format
    const convertTo24Hour = (timeStr) => {
      if (!timeStr) return '';
      let [time, modifier] = timeStr.trim().toUpperCase().split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const checkInTime = manualCheckInTime ? convertTo24Hour(manualCheckInTime) : '';
    const checkOutTime = manualCheckOutTime ? convertTo24Hour(manualCheckOutTime) : '';

    // Calculate total hours
    let totalHours = "0h 0m";
    if (checkInTime && checkOutTime) {
      const [inHour, inMin] = checkInTime.split(':').map(Number);
      const [outHour, outMin] = checkOutTime.split(':').map(Number);
      const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);

      if (totalMinutes > 0) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        totalHours = `${hours}h ${minutes}m`;
      }
    }

    // Check if times are the same as existing
    const existingCheckIn = existingAttendance?.checkInTimes?.[0] || '';
    const existingCheckOut = existingAttendance?.checkOutTimes?.[0] || '';

    if (checkInTime === existingCheckIn && checkOutTime === existingCheckOut && existingAttendance?.status === 'present') {
      showCustomToast('info', 'No Changes', 'Times are already saved for this employee');
      setShowManualTimeModal(false);
      setSelectedEmployee(null);
      setManualCheckInTime('');
      setManualCheckOutTime('');
      return;
    }

    setAttendanceData(prev => ({
      ...prev,
      [currentDateKey]: {
        ...prev[currentDateKey],
        [currentEmployeeId]: {
          ...existingAttendance, // Preserve any existing data
          status: 'present',
          checkInTimes: checkInTime ? [checkInTime] : [],
          checkOutTimes: checkOutTime ? [checkOutTime] : [],
          totalWorkingHours: totalHours,
          timestamp: new Date().toISOString()
        }
      }
    }));

    setShowManualTimeModal(false);
    setSelectedEmployee(null);
    setManualCheckInTime('');
    setManualCheckOutTime('');

    // Immediately save the manual time entry
    const dateOnly = currentDateKey.replace(/-/g, '');
    const validId = `${dateOnly}_${currentEmployeeId}`;

    const attendanceRecord = {
      id: validId,
      employeeId: currentEmployeeId,
      employeeName: selectedEmployee.fullName,
      date: currentDateKey,
      status: 'present',
      checkInTimes: checkInTime ? [checkInTime] : [],
      checkOutTimes: checkOutTime ? [checkOutTime] : [],
      totalWorkingHours: totalHours,
      timestamp: new Date().toISOString(),
      deviceId: null
    };

    try {
      console.log(`💾 Immediately saving manual time for ${selectedEmployee.fullName}...`);
      await saveData(attendanceRecord, 'attendance');
      console.log(`✅ Successfully saved manual time for ${selectedEmployee.fullName}`);
      showCustomToast('success', 'Time Saved', `Time saved for ${selectedEmployee?.fullName || 'Employee'}`);
    } catch (error) {
      console.error(`❌ Failed to save manual time for ${selectedEmployee?.fullName}:`, error);
      showCustomToast('error', 'Save Failed', `Failed to save time for ${selectedEmployee?.fullName || 'Employee'}`);
    }

    // Don't refresh UI - let the state update handle it
    console.log(`✅ UI updated for manual time entry for ${selectedEmployee.fullName}`);
  };

    const getAttendanceStats = () => {
    const dayData = attendanceData[formatDate(selectedDate)] || {};
    
    // Filter employees by both active status and joining date
    const activeEmployees = employees.filter(emp => {
      // Check if employee is active
      if (emp.status !== 'active') return false;
      
      // Check if employee has joined before or on the selected date
      if (!emp.joiningDate) return true; // If no joining date, show them
      
      const joiningDate = new Date(emp.joiningDate);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      joiningDate.setHours(0, 0, 0, 0);
      
      return joiningDate <= selectedDateOnly;
    });
    
    let present = 0, absent = 0, leave = 0, working = 0;
    
    activeEmployees.forEach(employee => {
      const employeeId = employee.id || employee.$id;
      const attendance = dayData[employeeId];

      if (attendance) {
        if (attendance?.status === 'present') {
          present++;
          if (attendance?.checkInTimes?.length > 0 || attendance?.checkOutTimes?.length > 0) {
            working++;
          }
        } else if (attendance?.status === 'leave' || attendance?.status === 'onLeave') {
          leave++;
        } else {
          absent++;
        }
      } else {
        absent++;
      }
    });

    return { present, absent, leave, working, total: activeEmployees.length };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#22c55e';
      case 'leave':
      case 'onLeave': return '#8b5cf6';
      case 'absent': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'leave':
      case 'onLeave': return 'On Leave';
      case 'absent': return 'Absent';
      default: return 'Unknown';
    }
  };

  // Generate calendar days for current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    return date && date.toDateString() === selectedDate.toDateString();
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    return date && date > today;
  };

  const handleYearSelect = () => {
    setTempYear(selectedDate.getFullYear().toString());
    setShowYearPicker(true);
  };

  const handleYearConfirm = () => {
    if (tempYear && !isNaN(tempYear)) {
      const year = parseInt(tempYear);
      if (year >= 2000 && year <= 2030) {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);
        setSelectedDate(newDate);
        setShowYearPicker(false);
        showCustomToast('success', 'Year Changed', `Changed to year ${year}`);
      } else {
        showCustomToast('error', 'Invalid Year', 'Please enter a year between 2020 and 2030');
      }
    } else {
      showCustomToast('error', 'Invalid Year', 'Please enter a valid year');
    }
  };

  const stats = getAttendanceStats();

  return (
    <ScrollView style={styles.container}>
      {/* Toast */}
      {customToast && (
        <View style={[
          styles.toast,
          customToast.type === 'error' && styles.errorToast,
          customToast.type === 'success' && styles.successToast,
          customToast.type === 'warning' && styles.warningToast,
          customToast.type === 'info' && styles.infoToast
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

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Attendance Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Present" value={stats.present} icon="checkmark-circle" iconColor="#22c55e" />
          <StatCard label="Absent" value={stats.absent} icon="close-circle" iconColor="#ef4444" />
          <StatCard label="Leave" value={stats.leave} icon="calendar" iconColor="#8b5cf6" />
          <StatCard label="Available" value={stats.total} icon="people" iconColor="#06b6d4" />
        </View>



      </View>

      {/* Date Navigation */}
      <View style={styles.dateSection}>

        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
          >
            <Ionicons name="chevron-back" size={16} color="#667eea" />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Text style={styles.monthText}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long' })}
            </Text>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={handleYearSelect}
            >
              <Text style={styles.yearText}>
                {selectedDate.getFullYear()}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#667eea" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);

              // Prevent navigating to future months
              const today = new Date();
              if (newDate.getFullYear() > today.getFullYear() ||
                (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())) {
                showCustomToast('error', 'Future Date', 'Cannot navigate to future months');
                return;
              }

              setSelectedDate(newDate);
            }}
          >
            <Ionicons name="chevron-forward" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Days Slider */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysSlider}
          contentContainerStyle={styles.daysSliderContent}
        >
          {getDaysInMonth(selectedDate).map((date, index) => {
            if (!date) return null;
            return (
              <TouchableOpacity
                key={date ? `day-${String(date.getTime())}` : `empty-${index}`}
                style={[
                  styles.dayButton,
                  isToday(date) && styles.todayButton,
                  isSelectedDate(date) && styles.selectedDayButton,
                  isFutureDate(date) && styles.futureDayButton,
                ]}
                onPress={() => {
                  // Prevent selecting future dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date > today) {
                    showCustomToast('error', 'Future Date', 'Cannot select future dates');
                    return;
                  }

                  setSelectedDate(date);
                  //    showCustomToast('info', 'Date Selected', `Selected ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`);
                }}
              >
                <Text style={[
                  styles.dayText,
                  isToday(date) && styles.todayText,
                  isSelectedDate(date) && styles.selectedDayText,
                  isFutureDate(date) && styles.futureDayText,
                ]}>
                  {date.getDate()}
                </Text>
                <Text style={[
                  styles.dayLabel,
                  isToday(date) && styles.todayLabel,
                  isSelectedDate(date) && styles.selectedDayLabel,
                  isFutureDate(date) && styles.futureDayLabel,
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.selectedDateText}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Employee List */}
      <View style={styles.employeeList}>
        {(() => {
          const filteredEmployees = employees.filter(employee => {
            // Check if employee is active
            if (employee.status !== 'active') return false;
            
            // Only show employees who have joined before or on the selected date
            if (!employee.joiningDate) return true; // If no joining date, show them

            const joiningDate = new Date(employee.joiningDate);
            const selectedDateOnly = new Date(selectedDate);
            selectedDateOnly.setHours(0, 0, 0, 0);
            joiningDate.setHours(0, 0, 0, 0);

            const shouldShow = joiningDate <= selectedDateOnly;
            
            // Debug logging
            console.log(`🔍 Employee Filter: ${employee.fullName}`, {
              status: employee.status,
              joiningDate: employee.joiningDate ? joiningDate.toLocaleDateString() : 'No joining date',
              selectedDate: selectedDateOnly.toLocaleDateString(),
              shouldShow: shouldShow
            });

            return shouldShow;
          });

          if (filteredEmployees.length === 0) {
            return (
              <View style={styles.noEmployeesContainer}>
                <Text style={styles.noEmployeesText}>
                  No employees available for {selectedDate.toLocaleDateString()}
                </Text>
                <Text style={styles.noEmployeesSubtext}>
                  Employees will appear here once their joining date has passed
                </Text>
              </View>
            );
          }

          return filteredEmployees.map((employee, index) => {
            const employeeId = employee.id || employee.$id;
            const attendance = getAttendanceStatus(employeeId);

            return (
              <View key={`${String(employeeId)}-${index}`} style={styles.employeeCard}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.fullName || 'Unknown'}</Text>
                  <Text style={styles.employeeRank}>{employee.rank || 'N/A'}</Text>
                  {employee.joiningDate && (
                    <Text style={styles.joiningDateText}>
                      Joined: {new Date(employee.joiningDate).toLocaleDateString()}
                    </Text>
                  )}

                  <View style={styles.attendanceStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(attendance?.status || 'absent') }]} />
                    <Text style={styles.statusText}>{getStatusText(attendance?.status || 'absent')}</Text>
                  </View>
                  <View>

                    {attendance?.totalWorkingHours && attendance.totalWorkingHours !== "0h 0m" && (
                      <Text style={styles.hoursText}>Total Hours: {attendance.totalWorkingHours}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.presentButton]}
                    onPress={() => markAttendance(employeeId, 'present')}
                  >
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.absentButton]}
                    onPress={() => markAttendance(employeeId, 'absent')}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.timeButton]}
                    onPress={() => openManualTimeModal(employee)}
                  >
                    <Ionicons name="time" size={12} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.leaveButton]}
                    onPress={() => markAttendance(employeeId, 'leave')}
                  >
                    <Ionicons name="calendar" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          });
        })()}
      </View>

      {/* Manual Time Modal */}
      <Modal
        visible={showManualTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Time Entry</Text>
              <TouchableOpacity onPress={() => setShowManualTimeModal(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedEmployee?.fullName ? `${selectedEmployee.fullName} - ${selectedDate.toLocaleDateString()}` : selectedDate.toLocaleDateString()}
              </Text>

              <Text style={styles.helperText}>
                Enter times in HH:MM AM/PM format (e.g., 09:30 AM, 05:45 PM)
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Check-in Time (HH:MM AM/PM)</Text>
                <TextInput
                  style={styles.input}
                  value={manualCheckInTime}
                  onChangeText={setManualCheckInTime}
                  placeholder="09:00 AM"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default" // use default so user can type letters (AM/PM)
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Check-out Time (HH:MM AM/PM)</Text>
                <TextInput
                  style={styles.input}
                  value={manualCheckOutTime}
                  onChangeText={setManualCheckOutTime}
                  placeholder="05:00 PM"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowManualTimeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveManualTime}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={tempYear}
                  onChangeText={setTempYear}
                  placeholder="2024"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowYearPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleYearConfirm}
              >
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f8fafc',
    padding: 16,
    paddingBottom: 100
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  warningToast: {
    backgroundColor: '#f59e0b',
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
  },
  infoToast: {
    backgroundColor: '#3b82f6',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
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
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  testSyncButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  testSyncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  markAttendanceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bigMarkAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bigMarkAttendanceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  monthYearContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 6,
  },
  daysSlider: {
    marginBottom: 8,
  },
  daysSliderContent: {
    paddingHorizontal: 8,
  },
  dayButton: {
    width: 48,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8fafc',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  dayLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: '#667eea',
  },
  todayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedDayButton: {
    backgroundColor: '#f59e0b',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  selectedDayLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  futureDayButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7,
  },
  futureDayText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  futureDayLabel: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  employeeList: {
    flex: 1,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeInfo: {
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  employeeRank: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  joiningDateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  noEmployeesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noEmployeesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  noEmployeesSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  hoursText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  presentButton: {
    backgroundColor: '#22c55e',
  },
  absentButton: {
    backgroundColor: '#ef4444',
  },
  timeButton: {
    backgroundColor: '#f59e0b',
  },
  leaveButton: {
    backgroundColor: '#8b5cf6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceTab;
