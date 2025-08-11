import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import DatePickerField from './DatePickerField';
import StatCard from './StatCard';

const AttendanceTab = ({ employees = [] }) => {
     const [selectedDate, setSelectedDate] = useState(new Date());
   const [attendanceData, setAttendanceData] = useState({});
   const [showManualTimeModal, setShowManualTimeModal] = useState(false);
   const [selectedEmployee, setSelectedEmployee] = useState(null);
   const [manualCheckInTime, setManualCheckInTime] = useState('');
   const [manualCheckOutTime, setManualCheckOutTime] = useState('');
   
     // Leave management states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [employeeLeaveCount, setEmployeeLeaveCount] = useState('');
  const [employeeLeaveData, setEmployeeLeaveData] = useState({});
  
  // Year selection states
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [tempYear, setTempYear] = useState('');

  // Holidays states
  const [holidays, setHolidays] = useState([]);
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);
  const [showSimpleHolidayModal, setShowSimpleHolidayModal] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayType, setHolidayType] = useState('public');
  const [showHolidayDatePicker, setShowHolidayDatePicker] = useState(false);
  const [tempHolidayDate, setTempHolidayDate] = useState('');

  // Custom toast states
  const [customToast, setCustomToast] = useState(null);

  // Local storage keys
  const HOLIDAYS_STORAGE_KEY = 'employee_holidays';

  // Custom toast function
  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => {
      setCustomToast(null);
    }, 3000);
  };

  // Load attendance data from storage on component mount
  useEffect(() => {
    loadAttendanceData();
    loadLeaveData();
    loadHolidays();
  }, []);

  // Save attendance data whenever it changes
  useEffect(() => {
    saveAttendanceData();
  }, [attendanceData]);

  // Save leave data whenever it changes
  useEffect(() => {
    saveLeaveData();
  }, [employeeLeaveData]);

  const loadAttendanceData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('attendanceData');
      if (savedData) {
        setAttendanceData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const saveAttendanceData = async () => {
    try {
      await AsyncStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    } catch (error) {
      console.error('Error saving attendance data:', error);
    }
  };

  const loadLeaveData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('employeeLeaveData');
      if (savedData) {
        setEmployeeLeaveData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
    }
  };

  const saveLeaveData = async () => {
    try {
      await AsyncStorage.setItem('employeeLeaveData', JSON.stringify(employeeLeaveData));
    } catch (error) {
      console.error('Error saving leave data:', error);
    }
  };

  // Holidays functions
  const loadHolidays = async () => {
    try {
      const storedHolidays = await AsyncStorage.getItem(HOLIDAYS_STORAGE_KEY);
      if (storedHolidays) {
        const parsedHolidays = JSON.parse(storedHolidays);
        setHolidays(parsedHolidays);
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const saveHolidays = async (holidaysList) => {
    try {
      await AsyncStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidaysList));
    } catch (error) {
      console.error('Error saving holidays:', error);
    }
  };

  const saveHoliday = async () => {
    try {
      if (!selectedHolidayDate || !holidayName.trim()) {
        showCustomToast('error', 'Missing Information', 'Please select a date and enter a holiday name');
        return;
      }

      // Check if holiday already exists for this date
      const existingHoliday = holidays.find(h => h.date === selectedHolidayDate);
      if (existingHoliday) {
        showCustomToast('error', 'Holiday Already Exists', `A holiday already exists for ${selectedHolidayDate}`);
        return;
      }

      const newHoliday = {
        id: Date.now().toString(),
        $id: Date.now().toString(),
        date: selectedHolidayDate,
        name: holidayName.trim(),
        type: holidayType,
        createdAt: new Date().toISOString(),
      };

      const updatedHolidays = [...holidays, newHoliday];
      await saveHolidays(updatedHolidays);
      setHolidays(updatedHolidays);
      
      // Reset attendance data for the holiday date
      const dateKey = selectedHolidayDate;
      if (attendanceData[dateKey]) {
        const updatedAttendanceData = { ...attendanceData };
        delete updatedAttendanceData[dateKey];
        setAttendanceData(updatedAttendanceData);
        await saveAttendanceData();
      }
      
      // Reset form
      setSelectedHolidayDate('');
      setHolidayName('');
      setHolidayType('public');
      
      showCustomToast('success', 'Holiday Added', `${newHoliday.name} has been added successfully and attendance data for this date has been reset`);
    } catch (error) {
      console.error('Error saving holiday:', error);
      showCustomToast('error', 'Error', 'Failed to save holiday');
    }
  };

  const deleteHoliday = async (holidayId) => {
    try {
      console.log('Debug - deleteHoliday called with ID:', holidayId);
      console.log('Debug - Current holidays before deletion:', holidays);
      const updatedHolidays = holidays.filter(h => {
        console.log('Debug - Comparing holiday ID:', h.id, 'with:', holidayId, 'types:', typeof h.id, typeof holidayId);
        return h.id !== holidayId;
      });
      console.log('Debug - Updated holidays after filtering:', updatedHolidays);
      await saveHolidays(updatedHolidays);
      console.log('Debug - Holidays saved to storage successfully');
      setHolidays(updatedHolidays);
      console.log('Debug - State updated with new holidays');
      showCustomToast('success', 'Holiday Deleted', 'Holiday has been deleted successfully');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showCustomToast('error', 'Error', 'Failed to delete holiday');
    }
  };

  const removeHolidayForDate = async (date) => {
    console.log('Debug - removeHolidayForDate called with date:', date);
    const holidayId = getHolidayId(date);
    console.log('Debug - holidayId:', holidayId);
    if (holidayId) {
      // For confirmation, we'll use a simple approach - just delete directly
      // You can implement a custom confirmation modal if needed
      console.log('Debug - User confirmed removal, calling deleteHoliday with ID:', holidayId);
      deleteHoliday(holidayId);
    } else {
      console.log('Debug - No holiday ID found for date:', date);
    }
  };

  const handleHolidayDateSelect = () => {
    setTempHolidayDate(selectedHolidayDate || '');
    setShowHolidayDatePicker(true);
  };

  const handleHolidayDateConfirm = () => {
    if (tempHolidayDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(tempHolidayDate)) {
        setSelectedHolidayDate(tempHolidayDate);
        setShowHolidayDatePicker(false);
      } else {
        showCustomToast('error', 'Invalid Date', 'Please enter date in YYYY-MM-DD format');
      }
    } else {
      setShowHolidayDatePicker(false);
    }
  };

  const isHoliday = (date) => {
    if (!date) return false;
    const dateString = formatDate(date);
    return holidays.some(holiday => holiday.date === dateString);
  };

  const getHolidayName = (date) => {
    if (!date) return '';
    const dateString = formatDate(date);
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.name : '';
  };

  const getHolidayId = (date) => {
    if (!date) return null;
    const dateString = formatDate(date);
    const holiday = holidays.find(h => h.date === dateString);
    console.log('Debug - getHolidayId found holiday:', holiday);
    console.log('Debug - getHolidayId holiday.id type:', typeof holiday?.id, 'value:', holiday?.id);
    return holiday ? holiday.id : null;
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

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    return date && date.toDateString() === selectedDate.toDateString();
  };

  const getAttendanceStatus = (employeeId) => {
    const dateKey = formatDate(selectedDate);
    const defaultStatus = { 
      status: 'working_hours', 
      checkInTimes: [], 
      checkOutTimes: [], 
      workingHours: '0h 0m',
      totalWorkingHours: 0
    };
    return attendanceData[dateKey]?.[employeeId] || defaultStatus;
  };

  const markAttendance = (employeeId, status) => {
    const dateKey = formatDate(selectedDate);
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Get existing attendance data for this employee on this date
    const existingAttendance = attendanceData[dateKey]?.[employeeId] || {};
    const previousStatus = existingAttendance.status;
    
    // Handle leave deduction and restoration
    if (status === 'on_leave' && previousStatus !== 'on_leave') {
      // Only deduct leave if employee wasn't already on leave
      const leaveCount = getEmployeeLeaveCount(employeeId);
      if (leaveCount <= 0) {
        showCustomToast('error', 'No Leaves Available', 'This employee has no leaves remaining. Please add leaves first.');
        return;
      }
      
      // Deduct one leave when marking as on_leave for the first time
      setEmployeeLeaveData(prev => ({
        ...prev,
        [employeeId]: Math.max(0, (prev[employeeId] || 0) - 1)
      }));
    } else if (previousStatus === 'on_leave' && status !== 'on_leave') {
      // Restore leave if employee was on leave and is now being marked as something else
      setEmployeeLeaveData(prev => ({
        ...prev,
        [employeeId]: (prev[employeeId] || 0) + 1
      }));
    }
    
    // Reset attendance time if marking as on_leave (anytime, not just on holidays)
    const shouldResetTime = status === 'on_leave';
    
    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...existingAttendance,
          status,
          // Reset check-in/check-out times if on leave
          checkIn: shouldResetTime ? '' : (status === 'present' && !existingAttendance.checkIn ? currentTime : existingAttendance.checkIn),
          checkOut: shouldResetTime ? '' : existingAttendance.checkOut,
          checkInTimes: shouldResetTime ? [] : existingAttendance.checkInTimes,
          checkOutTimes: shouldResetTime ? [] : existingAttendance.checkOutTimes,
          workingHours: shouldResetTime ? '0h 0m' : existingAttendance.workingHours,
          totalWorkingHours: shouldResetTime ? 0 : existingAttendance.totalWorkingHours,
          timestamp: new Date().toISOString()
        }
      }
    }));
  };

  const checkIn = (employeeId) => {
    const dateKey = formatDate(selectedDate);
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Get existing attendance data
    const existingAttendance = attendanceData[dateKey]?.[employeeId] || {};
    const previousStatus = existingAttendance.status;
    
    // Check if employee has checked in but not checked out
    const checkInTimes = existingAttendance.checkInTimes || [];
    const checkOutTimes = existingAttendance.checkOutTimes || [];
    
    // Prevent check-in if employee has checked in but not checked out
    if (checkInTimes.length > checkOutTimes.length) {
      showCustomToast('error', 'Already Checked In', 'Please check out first before checking in again.');
      return;
    }
    
    // Restore leave if employee was on leave and is now checking in
    if (previousStatus === 'on_leave') {
      setEmployeeLeaveData(prev => ({
        ...prev,
        [employeeId]: (prev[employeeId] || 0) + 1
      }));
    }
    
    // Add new check-in time to array
    const newCheckInTimes = [...checkInTimes, currentTime];
    
    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...existingAttendance,
          checkInTimes: newCheckInTimes,
          status: 'present',
          dutyStatus: 'On Duty', // Update duty status to "On Duty"
          timestamp: new Date().toISOString()
        }
      }
    }));
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    
    const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
    
    const checkInMinutes = checkInHour * 60 + checkInMinute;
    const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
    const workingMinutes = checkOutMinutes - checkInMinutes;
    
    if (workingMinutes <= 0) return '';
    
    const hours = Math.floor(workingMinutes / 60);
    const minutes = workingMinutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const calculateTotalWorkingHours = (checkInTimes, checkOutTimes) => {
    let totalMinutes = 0;
    
    // Calculate working hours for each check-in/check-out pair
    for (let i = 0; i < Math.min(checkInTimes.length, checkOutTimes.length); i++) {
      const checkIn = checkInTimes[i];
      const checkOut = checkOutTimes[i];
      
      if (checkIn && checkOut) {
        const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
        const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
        
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
        
        const workingMinutes = checkOutMinutes - checkInMinutes;
        if (workingMinutes > 0) {
          totalMinutes += workingMinutes;
        }
      }
    }
    
    // Format the total working hours
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let formatted;
    if (hours === 0) {
      formatted = `${minutes}m`;
    } else if (minutes === 0) {
      formatted = `${hours}h`;
    } else {
      formatted = `${hours}h ${minutes}m`;
    }
    
    return { formatted, minutes: totalMinutes };
  };

  const checkOut = (employeeId) => {
    const dateKey = formatDate(selectedDate);
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Get existing attendance data
    const existingAttendance = attendanceData[dateKey]?.[employeeId] || {};
    
    // Check if employee has checked in before allowing check-out
    const checkInTimes = existingAttendance.checkInTimes || [];
    const checkOutTimes = existingAttendance.checkOutTimes || [];
    
    // Prevent check-out if employee hasn't checked in
    if (checkInTimes.length === 0) {
      showCustomToast('error', 'No Check-in Record', 'Please check in first before checking out.');
      return;
    }
    
    // Prevent check-out if employee has already checked out (no pending check-in)
    if (checkInTimes.length <= checkOutTimes.length) {
      showCustomToast('error', 'No Active Check-in', 'Please check in first before checking out.');
      return;
    }
    
    // Add new check-out time to array
    const newCheckOutTimes = [...checkOutTimes, currentTime];
    
    // Calculate total working hours from all check-in/check-out pairs
    const totalWorkingHours = calculateTotalWorkingHours(checkInTimes, newCheckOutTimes);
    
    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...existingAttendance,
          checkOutTimes: newCheckOutTimes,
          workingHours: totalWorkingHours.formatted,
          totalWorkingHours: totalWorkingHours.minutes,
          dutyStatus: 'Off Duty', // Update duty status to "Off Duty"
          timestamp: new Date().toISOString()
        }
      }
    }));
  };

     

    const openManualTimeModal = (employee) => {
      setSelectedEmployee(employee);
      const attendance = getAttendanceStatus(employee.id);
      // For manual entry, we'll use the last check-in/check-out times or empty strings
      const lastCheckIn = attendance.checkInTimes?.length > 0 ? attendance.checkInTimes[attendance.checkInTimes.length - 1] : '';
      const lastCheckOut = attendance.checkOutTimes?.length > 0 ? attendance.checkOutTimes[attendance.checkOutTimes.length - 1] : '';
      setManualCheckInTime(lastCheckIn);
      setManualCheckOutTime(lastCheckOut);
      setShowManualTimeModal(true);
    };

    const validateTimeFormat = (time) => {
      if (!time) return true; // Empty time is valid
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    };

    const validateTimeRange = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return true; // If either is empty, it's valid
      
      const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
      const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
      
      const checkInMinutes = checkInHour * 60 + checkInMinute;
      const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
      
      return checkOutMinutes > checkInMinutes;
    };

    const saveManualTime = () => {
      if (!selectedEmployee) return;
      
      // Get current time
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log('Debug - Current time:', currentTime);
      console.log('Debug - Manual check-in time:', manualCheckInTime);
      console.log('Debug - Manual check-out time:', manualCheckOutTime);
      
      // Validate time format
      if (manualCheckInTime && !validateTimeFormat(manualCheckInTime)) {
        showCustomToast('error', 'Invalid Time Format', 'Check-in time must be in HH:MM format (e.g., 09:00)');
        return;
      }
      
      if (manualCheckOutTime && !validateTimeFormat(manualCheckOutTime)) {
        showCustomToast('error', 'Invalid Time Format', 'Check-out time must be in HH:MM format (e.g., 17:00)');
        return;
      }
      
      // Validate current time for check-in (only if both times are provided)
      if (manualCheckInTime && manualCheckOutTime && manualCheckInTime > currentTime) {
        showCustomToast('error', 'Invalid Check-in Time', 'Check-in time must be before or equal to current time');
        return;
      }
      
      // Validate current time for check-out (only if both times are provided)
      if (manualCheckInTime && manualCheckOutTime && manualCheckOutTime > currentTime) {
        showCustomToast('error', 'Invalid Check-out Time', 'Check-out time must be before or equal to current time');
        return;
      }
      
      // Validate time range
      if (manualCheckInTime && manualCheckOutTime && !validateTimeRange(manualCheckInTime, manualCheckOutTime)) {
        showCustomToast('error', 'Invalid Time Range', 'Check-out time must be after check-in time');
        return;
      }
      
      // Validate working hours (4 hours minimum)
      if (manualCheckInTime && manualCheckOutTime) {
        const [checkInHour, checkInMinute] = manualCheckInTime.split(':').map(Number);
        const [checkOutHour, checkOutMinute] = manualCheckOutTime.split(':').map(Number);
        
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
        const workingMinutes = checkOutMinutes - checkInMinutes;
        
        if (workingMinutes < 240) { // 4 hours = 240 minutes
          showCustomToast('error', 'Short Working Hours', 'Working hours are less than 4 hours. Please adjust the times.');
          return;
        }
      }
      
      console.log('Debug - All validations passed, calling saveManualAttendanceData');
      saveManualAttendanceData();
    };

    const saveManualAttendanceData = () => {
      console.log('Debug - saveManualAttendanceData called');
      console.log('Debug - selectedEmployee:', selectedEmployee);
      console.log('Debug - manualCheckInTime:', manualCheckInTime);
      console.log('Debug - manualCheckOutTime:', manualCheckOutTime);
      
      const dateKey = formatDate(selectedDate);
      console.log('Debug - dateKey:', dateKey);
      
      // Get existing attendance data
      const existingAttendance = attendanceData[dateKey]?.[selectedEmployee.id] || {};
      const previousStatus = existingAttendance.status;
      const newStatus = manualCheckInTime ? 'present' : 'working_hours';
      
      // Restore leave if employee was on leave and is now being marked as present
      if (previousStatus === 'on_leave' && newStatus === 'present') {
        setEmployeeLeaveData(prev => ({
          ...prev,
          [selectedEmployee.id]: (prev[selectedEmployee.id] || 0) + 1
        }));
      }
      
      // For manual entry, we'll replace the last check-in/check-out times or add new ones
      const checkInTimes = existingAttendance.checkInTimes || [];
      const checkOutTimes = existingAttendance.checkOutTimes || [];
      
      let newCheckInTimes = [...checkInTimes];
      let newCheckOutTimes = [...checkOutTimes];
      
      if (manualCheckInTime) {
        // If there's a check-in time, add or update it
        if (newCheckInTimes.length > 0) {
          newCheckInTimes[newCheckInTimes.length - 1] = manualCheckInTime;
        } else {
          newCheckInTimes.push(manualCheckInTime);
        }
      }
      
      if (manualCheckOutTime) {
        // If there's a check-out time, add or update it
        if (newCheckOutTimes.length > 0) {
          newCheckOutTimes[newCheckOutTimes.length - 1] = manualCheckOutTime;
        } else {
          newCheckOutTimes.push(manualCheckOutTime);
        }
      }
      
      // Calculate total working hours
      const totalWorkingHours = calculateTotalWorkingHours(newCheckInTimes, newCheckOutTimes);
      
      console.log('Debug - About to update attendance data');
      setAttendanceData(prev => {
        console.log('Debug - Previous attendance data:', prev);
        const newData = {
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            [selectedEmployee.id]: {
              ...prev[dateKey]?.[selectedEmployee.id],
              checkInTimes: newCheckInTimes,
              checkOutTimes: newCheckOutTimes,
              workingHours: totalWorkingHours.formatted,
              totalWorkingHours: totalWorkingHours.minutes,
              status: newStatus,
              timestamp: new Date().toISOString()
            }
          }
        };
        console.log('Debug - New attendance data:', newData);
        return newData;
      });
      
      setShowManualTimeModal(false);
      setSelectedEmployee(null);
      setManualCheckInTime('');
      setManualCheckOutTime('');
      
      console.log('Debug - About to show success toast');
      // Show success toast
      showCustomToast('success', 'Manual Time Saved', `Attendance data saved for ${selectedEmployee?.fullName}`);
      console.log('Debug - Function completed');
    };

  const openLeaveModal = (employee) => {
    setSelectedEmployee(employee);
    const currentLeaveCount = employeeLeaveData[employee.id] || 0;
    setEmployeeLeaveCount(currentLeaveCount.toString());
    setShowLeaveModal(true);
  };

  const saveLeaveCount = () => {
    if (!selectedEmployee) return;
    
    const leaveCount = parseInt(employeeLeaveCount) || 0;
    
    if (leaveCount < 0) {
      showCustomToast('error', 'Invalid Leave Count', 'Leave count cannot be negative');
      return;
    }
    
    setEmployeeLeaveData(prev => ({
      ...prev,
      [selectedEmployee.id]: leaveCount
    }));
    
    setShowLeaveModal(false);
    setSelectedEmployee(null);
    setEmployeeLeaveCount('');
  };

  const getEmployeeLeaveCount = (employeeId) => {
    return employeeLeaveData[employeeId] || 0;
  };

  const checkLeaveAvailability = (employeeId) => {
    const leaveCount = getEmployeeLeaveCount(employeeId);
    return leaveCount > 0;
  };

  const handleYearSelect = () => {
    setTempYear(selectedDate.getFullYear().toString());
    setShowYearPicker(true);
  };

  const handleYearConfirm = () => {
    if (tempYear && !isNaN(tempYear)) {
      const year = parseInt(tempYear);
      if (year >= 2020 && year <= 2030) {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);
        setSelectedDate(newDate);
        setShowYearPicker(false);
      } else {
        showCustomToast('error', 'Invalid Year', 'Please enter a year between 2020 and 2030');
      }
    } else {
      showCustomToast('error', 'Invalid Year', 'Please enter a valid year');
    }
  };

  const getAttendanceStats = () => {
    const dayData = attendanceData[formatDate(selectedDate)] || {};
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    const totalEmployees = activeEmployees.length;
    
    // Check if the selected date is a holiday
    const isSelectedDateHoliday = isHoliday(selectedDate);
    
    if (isSelectedDateHoliday) {
      // If it's a holiday, present and absent should be zero
      return {
        present: 0,
        absent: 0,
        late: 0,
        onLeave: totalEmployees, // All employees are considered on leave during holidays
      };
    }
    
    // Only count attendance for actual employees
    let present = 0;
    let onLeave = 0;
    let late = 0;
    
    activeEmployees.forEach(employee => {
      const employeeAttendance = dayData[employee.id] || dayData[employee.$id];
      if (employeeAttendance) {
        if (employeeAttendance.status === 'present' || employeeAttendance.status === 'working_hours') {
          present++;
        } else if (employeeAttendance.status === 'on_leave') {
          onLeave++;
        } else if (employeeAttendance.status === 'late') {
          late++;
        }
      }
    });
    
    const absent = totalEmployees - present - onLeave - late;

    return {
      present: present,
      absent: Math.max(0, absent),
      late: late,
      onLeave: onLeave,
    };
  };

     const getStatusColor = (status) => {
     switch (status) {
       case 'working_hours': return '#fbbf24';
       case 'on_leave': return '#8b5cf6';
       default: return '#9ca3af';
     }
   };

     const getStatusText = (status) => {
     switch (status) {
       case 'working_hours': return 'Working Hours';
       case 'on_leave': return 'On Leave';
       default: return 'Working Hours';
     }
   };

  const calendarDays = getDaysInMonth(selectedDate);
  const stats = getAttendanceStats();

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Attendance Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Present"
            value={stats.present}
            icon="checkmark-circle"
            iconColor="#22c55e"
          />
          <StatCard
            label="Absent"
            value={stats.absent}
            icon="close-circle"
            iconColor="#ef4444"
          />
          <StatCard
            label="On Leave"
            value={stats.onLeave}
            icon="calendar"
            iconColor="#8b5cf6"
          />
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.daysSliderSection}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
          >
            <Ionicons name="chevron-back" size={12} color="#667eea" />
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
              setSelectedDate(newDate);
            }}
          >
            <Ionicons name="chevron-forward" size={12} color="#667eea" />
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
                key={date ? `day-${date.getTime()}` : `empty-${index}`}
                style={[
                  styles.dayButton,
                  isToday(date) && styles.todayButton,
                  isSelectedDate(date) && styles.selectedDayButton,
                  isHoliday(date) && styles.holidayButton
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayText,
                  isToday(date) && styles.todayText,
                  isSelectedDate(date) && styles.selectedDayText,
                  isHoliday(date) && styles.holidayText
                ]}>
                  {date.getDate()}
                </Text>
                <Text style={[
                  styles.dayLabel,
                  isToday(date) && styles.todayLabel,
                  isSelectedDate(date) && styles.selectedDayLabel,
                  isHoliday(date) && styles.holidayLabel
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                {isHoliday(date) && (
                  <View style={styles.holidayIndicator}>
                    <Ionicons name="star" size={8} color="#22c55e" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Date Info */}
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          {isHoliday(selectedDate) ? (
            <TouchableOpacity
              style={[styles.markHolidayButton, styles.unmarkHolidayButton]}
              onPress={() => {
                const holidayId = getHolidayId(selectedDate);
                if (holidayId) {
                  deleteHoliday(holidayId);
                }
              }}
            >
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={[styles.markHolidayButtonText, styles.unmarkHolidayButtonText]}>Unmark as Holiday</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.markHolidayButton}
              onPress={() => {
                setSelectedHolidayDate(formatDate(selectedDate));
                setHolidayName('');
                setHolidayType('company');
                setShowSimpleHolidayModal(true);
              }}
            >
              <Ionicons name="star" size={16} color="#22c55e" />
              <Text style={styles.markHolidayButtonText}>Mark as Holiday</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Employee List */}
      <ScrollView style={styles.employeeList}>
        {employees
          .filter(employee => employee.status === 'active')
          .map((employee, index) => {
          const attendance = getAttendanceStatus(employee.id);
          const isHolidayDate = isHoliday(selectedDate);
          return (
            <View key={`attendance-${employee.id || employee.$id}-${index}`} style={[
              styles.employeeAttendanceCard,
              isHolidayDate && styles.holidayEmployeeCard
            ]}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.fullName}</Text>
                <Text style={styles.employeeRank}>{employee.rank || 'N/A'}</Text>
                <View style={styles.attendanceStatus}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(attendance.status) }]} />
                  <Text style={styles.statusText}>{getStatusText(attendance.status)}</Text>
                </View>
                {/* Multiple Check-in/Check-out Times */}
                {(attendance.checkInTimes?.length > 0 || attendance.checkOutTimes?.length > 0) && (
                  <View style={styles.timeEntriesContainer}>
                    {attendance.checkInTimes?.map((checkIn, index) => (
                      <View key={`checkin-${index}`} style={styles.timeEntryRow}>
                        <Text style={styles.timeText}>Check-in: {checkIn}</Text>
                        {attendance.checkOutTimes?.[index] && (
                          <Text style={styles.timeText}>Check-out: {attendance.checkOutTimes[index]}</Text>
                        )}
                      </View>
                    ))}
                    {/* Show any remaining check-outs without matching check-ins */}
                    {attendance.checkOutTimes?.slice(attendance.checkInTimes?.length || 0).map((checkOut, index) => (
                      <View key={`checkout-${index}`} style={styles.timeEntryRow}>
                        <Text style={styles.timeText}>Check-out: {checkOut}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {attendance.workingHours && attendance.workingHours !== '0h 0m' && (
                  <Text style={styles.workingHoursText}>Total Working: {attendance.workingHours}</Text>
                )}
                <View style={styles.leaveInfo}>
                  <Text style={styles.leaveCountText}>
                    Leaves: {getEmployeeLeaveCount(employee.id)}
                  </Text>
                  <TouchableOpacity
                    style={styles.leaveManageButton}
                    onPress={() => openLeaveModal(employee)}
                  >
                    <Ionicons name="settings" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
                                 <View style={styles.attendanceActions}>
                 {/* Leave Button */}
                 <TouchableOpacity
                   style={[
                     styles.actionButton, 
                     styles.leaveButton,
                     isHolidayDate && styles.disabledActionButton
                   ]}
                   onPress={() => !isHolidayDate && markAttendance(employee.id, 'on_leave')}
                   disabled={isHolidayDate}
                 >
                   <Ionicons name="bed" size={12} color={isHolidayDate ? "#9ca3af" : "#fff"} />
                 </TouchableOpacity>
                 
                 {/* Check-in Button */}
                 <TouchableOpacity
                   style={[
                     styles.actionButton, 
                     styles.checkinButton,
                     isHolidayDate && styles.disabledActionButton
                   ]}
                   onPress={() => !isHolidayDate && checkIn(employee.id)}
                   disabled={isHolidayDate}
                 >
                   <Ionicons name="log-in" size={12} color={isHolidayDate ? "#9ca3af" : "#fff"} />
                 </TouchableOpacity>
                 
                 {/* Check-out Button */}
                 <TouchableOpacity
                   style={[
                     styles.actionButton, 
                     styles.checkoutButton,
                     isHolidayDate && styles.disabledActionButton
                   ]}
                   onPress={() => !isHolidayDate && checkOut(employee.id)}
                   disabled={isHolidayDate}
                 >
                   <Ionicons name="log-out" size={12} color={isHolidayDate ? "#9ca3af" : "#fff"} />
                 </TouchableOpacity>
                 
                 {/* Manual Time Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      styles.manualTimeButton,
                      isHolidayDate && styles.disabledActionButton
                    ]}
                    onPress={() => !isHolidayDate && openManualTimeModal(employee)}
                    disabled={isHolidayDate}
                  >
                    <Ionicons name="time" size={12} color={isHolidayDate ? "#9ca3af" : "#fff"} />
                  </TouchableOpacity>
               </View>
            </View>
          );
        })}
                 </ScrollView>

      {/* Manual Time Modal */}
      {showManualTimeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom Toast Container */}
            {customToast && (
              <View style={[
                styles.customToastContainer,
                customToast.type === 'error' ? styles.errorToast : styles.successToast
              ]}>
                <Ionicons 
                  name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={customToast.type === 'error' ? '#fff' : '#fff'} 
                />
                <View style={styles.toastContent}>
                  <Text style={styles.toastTitle}>{customToast.title}</Text>
                  <Text style={styles.toastMessage}>{customToast.message}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Time Entry</Text>
              <TouchableOpacity onPress={() => setShowManualTimeModal(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedEmployee?.fullName} - {selectedDate.toLocaleDateString()}
              </Text>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Check-in Time (HH:MM)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={manualCheckInTime}
                  onChangeText={setManualCheckInTime}
                  placeholder="09:00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Check-out Time (HH:MM)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={manualCheckOutTime}
                  onChangeText={setManualCheckOutTime}
                  placeholder="17:00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
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
      )}

      {/* Leave Management Modal */}
      <Modal
        visible={showLeaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom Toast Container */}
            {customToast && (
              <View style={[
                styles.customToastContainer,
                customToast.type === 'error' ? styles.errorToast : styles.successToast
              ]}>
                <Ionicons 
                  name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={customToast.type === 'error' ? '#fff' : '#fff'} 
                />
                <View style={styles.toastContent}>
                  <Text style={styles.toastTitle}>{customToast.title}</Text>
                  <Text style={styles.toastMessage}>{customToast.message}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Leaves</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedEmployee?.fullName}
              </Text>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Total Leave Count</Text>
                <TextInput
                  style={styles.timeInput}
                  value={employeeLeaveCount}
                  onChangeText={setEmployeeLeaveCount}
                  placeholder="Enter number of leaves"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={saveLeaveCount}
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
            {/* Custom Toast Container */}
            {customToast && (
              <View style={[
                styles.customToastContainer,
                customToast.type === 'error' ? styles.errorToast : styles.successToast
              ]}>
                <Ionicons 
                  name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={customToast.type === 'error' ? '#fff' : '#fff'} 
                />
                <View style={styles.toastContent}>
                  <Text style={styles.toastTitle}>{customToast.title}</Text>
                  <Text style={styles.toastMessage}>{customToast.message}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Year</Text>
                <TextInput
                  style={styles.timeInput}
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

      {/* Holidays Management Modal */}
      <Modal
        visible={showHolidaysModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHolidaysModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom Toast Container */}
            {customToast && (
              <View style={[
                styles.customToastContainer,
                customToast.type === 'error' ? styles.errorToast : styles.successToast
              ]}>
                <Ionicons 
                  name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={customToast.type === 'error' ? '#fff' : '#fff'} 
                />
                <View style={styles.toastContent}>
                  <Text style={styles.toastTitle}>{customToast.title}</Text>
                  <Text style={styles.toastMessage}>{customToast.message}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎉 Manage Holidays</Text>
              <TouchableOpacity onPress={() => setShowHolidaysModal(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Add New Holiday Form */}
              <View style={styles.holidayForm}>
                <Text style={styles.formLabel}>Add New Holiday</Text>
                
                {/* Only show date picker if no date is pre-selected */}
                {!selectedHolidayDate && (
                  <>
                    <Text style={styles.formLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={handleHolidayDateSelect}
                    >
                      <Text style={[
                        styles.datePickerButtonText,
                        !selectedHolidayDate && styles.placeholderText
                      ]}>
                        {selectedHolidayDate || 'Select Date'}
                      </Text>
                      <Ionicons name="calendar" size={16} color="#6c757d" />
                    </TouchableOpacity>
                  </>
                )}
                
                {/* Show selected date if pre-selected */}
                {selectedHolidayDate && (
                  <View style={styles.selectedDateDisplay}>
                    <Text style={styles.formLabel}>Selected Date</Text>
                    <View style={styles.dateDisplayBox}>
                      <Text style={styles.dateDisplayText}>{selectedHolidayDate}</Text>
                      <TouchableOpacity
                        style={styles.changeDateButton}
                        onPress={() => setSelectedHolidayDate('')}
                      >
                        <Ionicons name="pencil" size={14} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={styles.formLabel}>Holiday Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={holidayName}
                  onChangeText={setHolidayName}
                  placeholder="Enter holiday name"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      holidayType === 'public' && styles.radioButtonSelected
                    ]}
                    onPress={() => setHolidayType('public')}
                  >
                    <View style={[
                      styles.radioCircle,
                      holidayType === 'public' && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioText}>Public Holiday</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      holidayType === 'company' && styles.radioButtonSelected
                    ]}
                    onPress={() => setHolidayType('company')}
                  >
                    <View style={[
                      styles.radioCircle,
                      holidayType === 'company' && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioText}>Company Holiday</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addHolidayButton}
                  onPress={saveHoliday}
                >
                  <Text style={styles.addHolidayButtonText}>Add Holiday</Text>
                </TouchableOpacity>
              </View>

              {/* Holidays List */}
              <View style={styles.holidaysList}>
                <Text style={styles.formLabel}>Current Holidays</Text>
                {holidays.length === 0 ? (
                  <Text style={styles.noHolidaysText}>No holidays added yet</Text>
                ) : (
                  holidays.map((holiday) => (
                    <View key={holiday.id} style={styles.holidayItem}>
                      <View style={styles.holidayInfo}>
                        <Text style={styles.holidayDate}>{holiday.date}</Text>
                        <Text style={styles.holidayName}>{holiday.name}</Text>
                        <Text style={styles.holidayType}>{holiday.type}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteHolidayButton}
                        onPress={() => deleteHoliday(holiday.id)}
                      >
                        <Ionicons name="trash" size={16} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Holiday Date Picker Modal */}
      <Modal
        visible={showHolidayDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHolidayDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Custom Toast Container */}
            {customToast && (
              <View style={[
                styles.customToastContainer,
                customToast.type === 'error' ? styles.errorToast : styles.successToast
              ]}>
                <Ionicons 
                  name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={customToast.type === 'error' ? '#fff' : '#fff'} 
                />
                <View style={styles.toastContent}>
                  <Text style={styles.toastTitle}>{customToast.title}</Text>
                  <Text style={styles.toastMessage}>{customToast.message}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Holiday Date</Text>
              <TouchableOpacity onPress={() => setShowHolidayDatePicker(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <DatePickerField
                label="Holiday Date"
                value={tempHolidayDate ? new Date(tempHolidayDate) : null}
                onChange={(date) => setTempHolidayDate(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select holiday date"
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowHolidayDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleHolidayDateConfirm}
              >
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Holiday Modal */}
      <Modal
        visible={showSimpleHolidayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSimpleHolidayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎉 Add Holiday</Text>
              <TouchableOpacity onPress={() => setShowSimpleHolidayModal(false)}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.simpleHolidayForm}>
                <Text style={styles.formLabel}>Selected Date</Text>
                <View style={styles.dateDisplayBox}>
                  <Text style={styles.dateDisplayText}>{selectedHolidayDate}</Text>
                </View>

                <Text style={styles.formLabel}>Holiday Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={holidayName}
                  onChangeText={setHolidayName}
                  placeholder="Enter holiday name"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      holidayType === 'public' && styles.radioButtonSelected
                    ]}
                    onPress={() => setHolidayType('public')}
                  >
                    <View style={[
                      styles.radioCircle,
                      holidayType === 'public' && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioText}>Public Holiday</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      holidayType === 'company' && styles.radioButtonSelected
                    ]}
                    onPress={() => setHolidayType('company')}
                  >
                    <View style={[
                      styles.radioCircle,
                      holidayType === 'company' && styles.radioCircleSelected
                    ]} />
                    <Text style={styles.radioText}>Company Holiday</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowSimpleHolidayModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => {
                  saveHoliday();
                  setShowSimpleHolidayModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Add Holiday</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    gap: 12,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  activeTabButton: {
    backgroundColor: '#667eea',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    marginLeft: 3,
  },
  activeTabButtonText: {
    color: '#fff',
  },
     daysSliderSection: {
     backgroundColor: '#fff',
     borderRadius: 20,
     padding: 20,
     marginBottom: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 6 },
     shadowOpacity: 0.12,
     shadowRadius: 12,
     elevation: 4,
     borderWidth: 1,
     borderColor: '#f1f5f9',
   },
   monthNavigation: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 12,
     paddingHorizontal: 8,
   },
   navButton: {
     padding: 8,
     borderRadius: 12,
     backgroundColor: '#f1f5f9',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 4,
     elevation: 1,
   },
   monthYearText: {
     fontSize: 12,
     fontWeight: 'bold',
     color: '#2c3e50',
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
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 4,
     elevation: 1,
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
     shadowColor: '#667eea',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 4,
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
     shadowColor: '#f59e0b',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 4,
   },
   selectedDayText: {
     color: '#fff',
     fontWeight: '700',
   },
   selectedDayLabel: {
     color: '#fff',
     fontWeight: '600',
   },
  selectedDateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  
     attendanceStats: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-around',
     marginBottom: 16,
     gap: 12,
   },
  employeeList: {
    flex: 1,
  },
     employeeAttendanceCard: {
     backgroundColor: '#fff',
     borderRadius: 16,
     padding: 16,
     marginBottom: 12,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.08,
     shadowRadius: 8,
     elevation: 2,
     borderWidth: 1,
     borderColor: '#f1f5f9',
   },
  employeeInfo: {
    marginBottom: 8,
  },
     employeeName: {
     fontSize: 18,
     fontWeight: '700',
     color: '#1e293b',
     marginBottom: 4,
   },
   employeeRank: {
     fontSize: 15,
     color: '#64748b',
     marginBottom: 4,
     fontWeight: '500',
   },
     attendanceStatus: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 6,
     paddingHorizontal: 8,
     paddingVertical: 4,
     backgroundColor: '#f8fafc',
     borderRadius: 8,
     alignSelf: 'flex-start',
   },
   statusDot: {
     width: 6,
     height: 6,
     borderRadius: 3,
     marginRight: 6,
   },
   statusText: {
     fontSize: 14,
     color: '#475569',
     fontWeight: '600',
   },
     timeText: {
     fontSize: 13,
     color: '#64748b',
     fontWeight: '500',
   },
   timeEntriesContainer: {
     marginTop: 8,
   },
   timeEntryRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 6,
     paddingHorizontal: 12,
     paddingVertical: 8,
     backgroundColor: '#f1f5f9',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#e2e8f0',
   },
     workingHoursText: {
     fontSize: 14,
     color: '#667eea',
     fontWeight: '700',
     marginTop: 6,
     paddingHorizontal: 10,
     paddingVertical: 6,
     backgroundColor: '#eff6ff',
     borderRadius: 8,
     alignSelf: 'flex-start',
     borderWidth: 1,
     borderColor: '#dbeafe',
   },
     attendanceActions: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     flexWrap: 'wrap',
     gap: 8,
     marginTop: 12,
     paddingTop: 12,
     borderTopWidth: 1,
     borderTopColor: '#f1f5f9',
   },
   actionButton: {
     width: 32,
     height: 32,
     borderRadius: 16,
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 2,
   },
  presentButton: {
    backgroundColor: '#4ade80',
  },
  absentButton: {
    backgroundColor: '#f87171',
  },
  lateButton: {
    backgroundColor: '#fbbf24',
  },
  leaveButton: {
    backgroundColor: '#8b5cf6',
  },
  checkinButton: {
    backgroundColor: '#06b6d4',
  },
         checkoutButton: {
      backgroundColor: '#667eea',
    },
         
     manualTimeButton: {
       backgroundColor: '#f59e0b',
     },
     modalOverlay: {
       flex: 1,
       backgroundColor: 'rgba(0, 0, 0, 0.5)',
       justifyContent: 'center',
       alignItems: 'center',
       zIndex: 1000,
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
       fontWeight: '500',
     },
     timeInputContainer: {
       marginBottom: 16,
     },
     timeInputLabel: {
       fontSize: 14,
       fontWeight: '600',
       color: '#374151',
       marginBottom: 8,
     },
     timeInput: {
       height: 48,
       borderColor: '#d1d5db',
       borderWidth: 1,
       borderRadius: 12,
       paddingHorizontal: 16,
       fontSize: 16,
       backgroundColor: '#fff',
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.05,
       shadowRadius: 2,
       elevation: 1,
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
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
       elevation: 2,
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
       shadowColor: '#667eea',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 8,
       elevation: 4,
     },
     saveButtonText: {
       color: '#fff',
       fontSize: 16,
       fontWeight: '600',
     },
        leaveInfo: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginTop: 8,
     paddingHorizontal: 10,
     paddingVertical: 8,
     backgroundColor: '#faf5ff',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#e9d5ff',
   },
     leaveCountText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '700',
  },
     leaveManageButton: {
       padding: 6,
       backgroundColor: '#f3e8ff',
       borderRadius: 8,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.1,
       shadowRadius: 2,
       elevation: 1,
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
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 4,
     elevation: 1,
   },
   yearText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#667eea',
     marginRight: 6,
   },
   
   // Holiday styles
   holidayButton: {
     backgroundColor: '#22c55e',
   },
   holidayText: {
     color: '#fff',
     fontWeight: 'bold',
   },
   holidayLabel: {
     color: '#fff',
   },
   holidayIndicator: {
     position: 'absolute',
     top: 2,
     right: 2,
   },
   holidaysSection: {
     marginBottom: 12,
   },
   holidaysButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#22c55e',
     paddingVertical: 8,
     paddingHorizontal: 16,
     borderRadius: 6,
     marginBottom: 8,
   },
   holidaysButtonText: {
     color: '#fff',
     fontSize: 12,
     fontWeight: '600',
     marginLeft: 6,
   },
     holidayInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e',
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  holidayInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     removeHolidayButton: {
     padding: 8,
     minWidth: 32,
     minHeight: 32,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(239, 68, 68, 0.1)',
     borderRadius: 16,
     shadowColor: '#ef4444',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 1,
   },
   holidayInfoText: {
     color: '#22c55e',
     fontSize: 14,
     fontWeight: '700',
     marginLeft: 6,
   },
   holidayForm: {
     marginBottom: 20,
   },
   formLabel: {
     fontSize: 12,
     fontWeight: '600',
     color: '#495057',
     marginBottom: 4,
     marginTop: 8,
   },
   datePickerButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     borderWidth: 1,
     borderColor: '#e9ecef',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 10,
     backgroundColor: '#fff',
     marginBottom: 8,
   },
   datePickerButtonText: {
     fontSize: 14,
     color: '#495057',
   },
   placeholderText: {
     color: '#9ca3af',
   },
   textInput: {
     height: 40,
     borderColor: '#e9ecef',
     borderWidth: 1,
     borderRadius: 6,
     paddingHorizontal: 12,
     fontSize: 14,
     backgroundColor: '#fff',
     marginBottom: 8,
   },
   radioGroup: {
     marginBottom: 12,
   },
   radioButton: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   radioButtonSelected: {
     backgroundColor: '#f8f9fa',
   },
   radioCircle: {
     width: 16,
     height: 16,
     borderRadius: 8,
     borderWidth: 2,
     borderColor: '#e9ecef',
     marginRight: 8,
   },
   radioCircleSelected: {
     borderColor: '#667eea',
     backgroundColor: '#667eea',
   },
   radioText: {
     fontSize: 14,
     color: '#495057',
   },
   addHolidayButton: {
     backgroundColor: '#22c55e',
     paddingVertical: 10,
     paddingHorizontal: 16,
     borderRadius: 6,
     alignItems: 'center',
     marginTop: 8,
   },
   addHolidayButtonText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
   holidaysList: {
     marginTop: 16,
   },
   noHolidaysText: {
     fontSize: 14,
     color: '#9ca3af',
     textAlign: 'center',
     fontStyle: 'italic',
   },
   holidayItem: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     backgroundColor: '#f8f9fa',
     padding: 12,
     borderRadius: 6,
     marginBottom: 8,
   },
   holidayInfo: {
     flex: 1,
   },
   holidayDate: {
     fontSize: 12,
     fontWeight: '600',
     color: '#22c55e',
     marginBottom: 2,
   },
   holidayName: {
     fontSize: 14,
     fontWeight: '600',
     color: '#495057',
     marginBottom: 2,
   },
   holidayType: {
     fontSize: 10,
     color: '#6c757d',
     textTransform: 'capitalize',
   },
   deleteHolidayButton: {
     padding: 4,
   },
   // New styles for holiday functionality
   markHolidayButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f0fdf4',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 10,
     borderWidth: 1,
     borderColor: '#22c55e',
     shadowColor: '#22c55e',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 1,
   },
   markHolidayButtonText: {
     fontSize: 13,
     fontWeight: '600',
     color: '#22c55e',
     marginLeft: 6,
   },
   selectedDateDisplay: {
     marginBottom: 8,
   },
   dateDisplayBox: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     backgroundColor: '#f8f9fa',
     paddingHorizontal: 12,
     paddingVertical: 10,
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#e9ecef',
   },
   dateDisplayText: {
     fontSize: 14,
     color: '#495057',
     fontWeight: '600',
   },
   changeDateButton: {
     padding: 4,
   },
   holidayEmployeeCard: {
     opacity: 0.6,
     backgroundColor: '#f8f9fa',
   },
   disabledActionButton: {
     opacity: 0.5,
     backgroundColor: '#e9ecef',
   },
   simpleHolidayForm: {
     padding: 16,
   },
   // Custom toast styles
   customToastContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 16,
     marginBottom: 12,
     borderRadius: 12,
     marginHorizontal: 20,
     marginTop: 20,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     elevation: 4,
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
 });

export default AttendanceTab; 