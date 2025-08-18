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

  // Load attendance data
  useEffect(() => {
    loadAttendanceData();
  }, []);

  // Initialize today's attendance
  useEffect(() => {
    initializeTodayAttendance();
  }, [employees, selectedDate]);

  // Save when data changes
  useEffect(() => {
    saveAttendanceData();
  }, [attendanceData]);

  const initializeTodayAttendance = () => {
    const today = formatDate(new Date());
    const selectedDateKey = formatDate(selectedDate);
    
    if (selectedDateKey !== today) return;
    
    const currentAttendance = attendanceData[today] || {};
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    let needsInit = false;
    
    activeEmployees.forEach(employee => {
      const employeeId = employee.id || employee.$id;
      if (!currentAttendance[employeeId]) needsInit = true;
    });
    
    if (needsInit) {
    //   showCustomToast('info', 'Initializing', 'Setting up attendance for today...');
      
      const newData = { ...attendanceData };
      if (!newData[today]) newData[today] = {};
      
      activeEmployees.forEach(employee => {
        const employeeId = employee.id || employee.$id;
        if (!newData[today][employeeId]) {
          newData[today][employeeId] = {
            status: 'absent',
            checkInTimes: [],
            checkOutTimes: [],
            totalWorkingHours: 0,
          };
        }
      });
      
      setAttendanceData(newData);
    //   showCustomToast('success', 'Initialized', `Attendance initialized for ${activeEmployees.length} employees`);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const savedData = await getItems('attendance');
      const attendanceObject = {};
      
      savedData.forEach(record => {
        const dateKey = record.date;
        if (!attendanceObject[dateKey]) attendanceObject[dateKey] = {};
        
        attendanceObject[dateKey][record.employeeId] = {
          status: record.status,
          checkInTimes: record.checkInTimes || [],
          checkOutTimes: record.checkOutTimes || [],
          totalWorkingHours: record.totalWorkingHours || 0,
        };
      });
      
      setAttendanceData(attendanceObject);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const saveAttendanceData = async () => {
    try {
      console.log('💾 Saving attendance data...');
      const attendanceArray = [];
      Object.keys(attendanceData).forEach(dateKey => {
        Object.keys(attendanceData[dateKey]).forEach(employeeId => {
          const record = attendanceData[dateKey][employeeId];
          const employee = employees.find(emp => emp.id === employeeId);
          
          if (employee) {
                        const attendanceRecord = {
              id: `${dateKey}_${employeeId}`,
              employeeId: employeeId,
              employeeName: employee.fullName,
              date: dateKey,
              status: record.status,
             
              totalWorkingHours: record.totalWorkingHours || 0,
              timestamp: record.timestamp,
              deviceId: null // Add deviceId to prevent sync error
            };
            attendanceArray.push(attendanceRecord);
            console.log('📝 Prepared attendance record:', attendanceRecord);
          }
        });
      });
      
      console.log(`💾 Saving ${attendanceArray.length} attendance records...`);
      for (const record of attendanceArray) {
        try {
          await saveData(record, 'attendance');
          console.log('✅ Saved attendance record:', record.id);
        } catch (saveError) {
          console.error('❌ Failed to save attendance record:', record.id, saveError);
        }
      }
      console.log('✅ Attendance data save completed');
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getAttendanceStatus = (employeeId) => {
    const dateKey = formatDate(selectedDate);
    const today = formatDate(new Date());
   
    // 🚫 Block marking if it's not today
    if (dateKey !== today) {
      showCustomToast('error', 'Not Allowed', 'You can only mark attendance for today.');
      return;
    }
    return attendanceData[dateKey]?.[employeeId] || {
      status: 'absent',
      checkInTimes: [],
      checkOutTimes: [],
      totalWorkingHours: 0
    };
  };

  const markAttendance = (employeeId, status) => {
    const dateKey = formatDate(selectedDate);
    const employee = employees.find(emp => emp.id === employeeId);
    const employeeName = employee?.fullName || 'Unknown';
    
    const existingAttendance = attendanceData[dateKey]?.[employeeId] || {};
    const checkInTimes = existingAttendance.checkInTimes || [];
    const checkOutTimes = existingAttendance.checkOutTimes || [];
    
    let finalStatus = status;
    if (status === 'present' && checkInTimes.length > 0 && checkOutTimes.length > 0) {
      finalStatus = 'present';
    } else if (status === 'present') {
      finalStatus = 'absent';
    }
    
    // showCustomToast('info', 'Marking', `Marking ${employeeName} as ${finalStatus}`);
    
    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...existingAttendance,
          status: finalStatus,
          checkInTimes: status === 'leave' || status === 'absent' ? [] : checkInTimes,
          checkOutTimes: status === 'leave' || status === 'absent' ? [] : checkOutTimes,
          totalWorkingHours: status === 'leave' || status === 'absent' ? 0 : existingAttendance.totalWorkingHours,
        }
      }
    }));
    
    // showCustomToast('success', 'Marked', `${employeeName} marked as ${finalStatus}`);
  };

  const calculateTotalHours = (checkInTimes, checkOutTimes) => {
    let totalMinutes = 0;
    for (let i = 0; i < Math.min(checkInTimes.length, checkOutTimes.length); i++) {
      const checkIn = checkInTimes[i];
      const checkOut = checkOutTimes[i];
      
      if (checkIn && checkOut) {
        const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
        const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
        
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
        const workingMinutes = checkOutMinutes - checkInMinutes;
        
        if (workingMinutes > 0) totalMinutes += workingMinutes;
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const openManualTimeModal = (employee) => {
    setSelectedEmployee(employee);
    const employeeId = employee.id || employee.$id;
    const attendance = getAttendanceStatus(employeeId);
    
    const lastCheckIn = attendance.checkInTimes?.length > 0 ? attendance.checkInTimes[attendance.checkInTimes.length - 1] : '';
    const lastCheckOut = attendance.checkOutTimes?.length > 0 ? attendance.checkOutTimes[attendance.checkOutTimes.length - 1] : '';
    
    // Convert 24-hour format to 12-hour format if needed
    const formatTo12Hour = (time) => {
      if (!time) return '';
      if (time.includes('AM') || time.includes('PM')) return time;
      
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    setManualCheckInTime(formatTo12Hour(lastCheckIn));
    setManualCheckOutTime(formatTo12Hour(lastCheckOut));
    setShowManualTimeModal(true);
  };

  const saveManualTime = () => {
    if (!selectedEmployee) return;
  
    // Regex for HH:MM AM/PM (12-hour format)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
  
    // Validate check-in time
    if (manualCheckInTime && !timeRegex.test(manualCheckInTime)) {
    //   showCustomToast('error', 'Invalid Time', 'Check-in time must be in HH:MM AM/PM format (e.g. 09:30 AM)');
      return;
    }
  
    // Validate check-out time
    if (manualCheckOutTime && !timeRegex.test(manualCheckOutTime)) {
    //   showCustomToast('error', 'Invalid Time', 'Check-out time must be in HH:MM AM/PM format (e.g. 06:45 PM)');
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
  
  const saveManualAttendanceData = () => {
    // Validate time format
    const timeFormatRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    
    if (manualCheckInTime && !timeFormatRegex.test(manualCheckInTime.trim())) {
      showCustomToast('error', 'Invalid Format', 'Check-in time must be in HH:MM AM/PM format (e.g., 09:30 AM)');
      return;
    }
    
    if (manualCheckOutTime && !timeFormatRegex.test(manualCheckOutTime.trim())) {
      showCustomToast('error', 'Invalid Format', 'Check-out time must be in HH:MM AM/PM format (e.g., 05:30 PM)');
      return;
    }
    
    // Convert to 24-hour format for comparison
    const convertTo24Hour = (timeStr) => {
      if (!timeStr) return '';
      if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr;
      
      let [time, modifier] = timeStr.trim().toUpperCase().split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);
      
      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    // Validate check-out is after check-in
    if (manualCheckInTime && manualCheckOutTime) {
      const checkIn24 = convertTo24Hour(manualCheckInTime);
      const checkOut24 = convertTo24Hour(manualCheckOutTime);
      
      const checkInMinutes = parseInt(checkIn24.split(':')[0]) * 60 + parseInt(checkIn24.split(':')[1]);
      const checkOutMinutes = parseInt(checkOut24.split(':')[0]) * 60 + parseInt(checkOut24.split(':')[1]);
      
      if (checkOutMinutes <= checkInMinutes) {
        showCustomToast('error', 'Invalid Time', 'Check-out time must be after check-in time');
        return;
      }
    }
    
    const dateKey = formatDate(selectedDate);
    const employeeId = selectedEmployee.id || selectedEmployee.$id;
    const existingAttendance = attendanceData[dateKey]?.[employeeId] || {};
    
    let newCheckInTimes = [...(existingAttendance.checkInTimes || [])];
    let newCheckOutTimes = [...(existingAttendance.checkOutTimes || [])];
    
    if (manualCheckInTime) {
      const convertedCheckIn = convertTo24Hour(manualCheckInTime);
      if (newCheckInTimes.length > 0) {
        newCheckInTimes[newCheckInTimes.length - 1] = convertedCheckIn;
      } else {
        newCheckInTimes.push(convertedCheckIn);
      }
    }
    
    if (manualCheckOutTime) {
      const convertedCheckOut = convertTo24Hour(manualCheckOutTime);
      if (newCheckOutTimes.length > 0) {
        newCheckOutTimes[newCheckOutTimes.length - 1] = convertedCheckOut;
      } else {
        newCheckOutTimes.push(convertedCheckOut);
      }
    }
    
    const totalHours = calculateTotalHours(newCheckInTimes, newCheckOutTimes);
    const newStatus = newCheckInTimes.length > 0 && newCheckOutTimes.length > 0 ? 'present' : 'absent';
    
    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [employeeId]: {
          ...existingAttendance,
          checkInTimes: newCheckInTimes,
          checkOutTimes: newCheckOutTimes,
          totalWorkingHours: totalHours,
          status: newStatus,
          timestamp: new Date().toISOString()
        }
      }
    }));
    
    setShowManualTimeModal(false);
    setSelectedEmployee(null);
    setManualCheckInTime('');
    setManualCheckOutTime('');
    
    showCustomToast('success', 'Saved', `Time saved for ${selectedEmployee?.fullName}`);
  };

  const getAttendanceStats = () => {
    const dayData = attendanceData[formatDate(selectedDate)] || {};
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    
    let present = 0, absent = 0, onLeave = 0, working = 0;
    
    activeEmployees.forEach(employee => {
      const employeeId = employee.id || employee.$id;
      const attendance = dayData[employeeId];
      
      if (attendance) {
        if (attendance.status === 'present') {
          present++;
          if (attendance.checkInTimes?.length > 0 || attendance.checkOutTimes?.length > 0) {
            working++;
          }
        } else if (attendance.status === 'leave') {
          onLeave++;
        } else {
          absent++;
        }
      } else {
        absent++;
      }
    });
    
    return { present, absent, onLeave, working };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#22c55e';
      case 'leave': return '#8b5cf6';
      case 'absent': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'leave': return 'On Leave';
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
          customToast.type === 'info' && styles.infoToast
        ]}>
          <Ionicons 
            name={
              customToast.type === 'error' ? 'close-circle' :
              customToast.type === 'success' ? 'checkmark-circle' :
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
           <StatCard label="Leave" value={stats.onLeave} icon="calendar" iconColor="#8b5cf6" />
           <StatCard label="Working" value={stats.working} icon="time" iconColor="#f59e0b" />
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
            //    showCustomToast('info', 'Month Changed', `Navigated to ${newDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
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
               setSelectedDate(newDate);
            //    showCustomToast('info', 'Month Changed', `Navigated to ${newDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
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
                 key={date ? `day-${date.getTime()}` : `empty-${index}`}
                 style={[
                   styles.dayButton,
                   isToday(date) && styles.todayButton,
                   isSelectedDate(date) && styles.selectedDayButton,
                 ]}
                 onPress={() => {
                   setSelectedDate(date);
                //    showCustomToast('info', 'Date Selected', `Selected ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`);
                 }}
               >
                 <Text style={[
                   styles.dayText,
                   isToday(date) && styles.todayText,
                   isSelectedDate(date) && styles.selectedDayText,
                 ]}>
                   {date.getDate()}
                 </Text>
                 <Text style={[
                   styles.dayLabel,
                   isToday(date) && styles.todayLabel,
                   isSelectedDate(date) && styles.selectedDayLabel,
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
        {employees
          .filter(employee => employee.status === 'active')
          .map((employee, index) => {
            const employeeId = employee.id || employee.$id;
            const attendance = getAttendanceStatus(employeeId);
            const totalHours = calculateTotalHours(attendance.checkInTimes, attendance.checkOutTimes);
            
            return (
              <View key={`${employeeId}-${index}`} style={styles.employeeCard}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.fullName}</Text>
                  <Text style={styles.employeeRank}>{employee.rank || 'N/A'}</Text>
                  
                  <View style={styles.attendanceStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(attendance.status) }]} />
                    <Text style={styles.statusText}>{getStatusText(attendance.status)}</Text>
                  </View>
                  
                  {totalHours !== '0m' && attendance.status !== 'leave' && (
                    <Text style={styles.hoursText}>Total Hours: {totalHours}</Text>
                  )}
                </View>
                
                <View style={styles.actions}>
                 
                  
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
          })}
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
                {selectedEmployee?.fullName} - {selectedDate.toLocaleDateString()}
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
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
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
    marginBottom: 8,
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
