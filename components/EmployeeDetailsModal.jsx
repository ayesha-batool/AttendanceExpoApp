import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hybridDataService } from '../services/hybridDataService';

const { width: screenWidth } = Dimensions.get('window');

const EmployeeDetailsModal = ({ visible, employee, onClose }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [currentMonthStats, setCurrentMonthStats] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    totalWorkingHours: '0h 0m'
  });
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && employee) {
      loadAttendanceData();
    }
  }, [visible, employee]);

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true);
      const savedData = await hybridDataService.getItems('attendance');
      
      // Filter attendance data for current employee
      const employeeAttendance = savedData.filter(record => 
        record.employeeId === employee.id || record.employeeId === employee.$id
      );
      
      // Store all attendance data for this employee
      setAllAttendanceData(employeeAttendance);
      
      // Load current month data
      await loadAttendanceDataForMonth(selectedDate, employeeAttendance);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarData = (attendanceRecords, targetDate = selectedDate) => {
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    // Create a map of attendance records by date
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      const date = new Date(record.date);
      const dateKey = date.getDate();
      attendanceMap[dateKey] = record.status;
    });

    // Get first day of month and total days
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const totalDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    const calendar = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendar.push({ day: '', status: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      const status = attendanceMap[day];
      calendar.push({ day, status });
    }
    
    setCalendarData(calendar);
  };

  const loadAttendanceDataForMonth = async (targetDate, attendanceData = allAttendanceData) => {
    try {
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      // Filter attendance data for target month from cached data
      const targetMonthAttendance = attendanceData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear;
      });

      // Calculate stats for the target month
      let present = 0, absent = 0, leave = 0, totalHours = 0;
      
      targetMonthAttendance.forEach(record => {
        switch (record.status) {
          case 'present':
            present++;
            break;
          case 'absent':
            absent++;
            break;
          case 'leave':
          case 'onLeave':
            leave++;
            break;
        }
        
        // Calculate total working hours
        if (record.totalWorkingHours) {
          const hoursMatch = record.totalWorkingHours.match(/(\d+)h\s*(\d+)m/);
          if (hoursMatch) {
            totalHours += parseInt(hoursMatch[1]) + (parseInt(hoursMatch[2]) / 60);
          }
        }
      });

      const totalHoursInt = Math.floor(totalHours);
      const totalMinutes = Math.round((totalHours - totalHoursInt) * 60);
      
      setCurrentMonthStats({
        present,
        absent,
        leave,
        totalWorkingHours: `${totalHoursInt}h ${totalMinutes}m`
      });

      // Generate calendar data for target month
      generateCalendarData(targetMonthAttendance, targetDate);
    } catch (error) {
      console.error('Error loading attendance data for month:', error);
    }
  };

  if (!employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateTotalPay = () => {
    const baseSalary = parseFloat(employee.salary || 0);
    const overtimeRate = parseFloat(employee.overtimeRate || 0);
    const overtimeHours = parseFloat(employee.monthlyOvertimeHours || 0);
    const overtimePay = overtimeRate * overtimeHours;
    const totalAdvances = parseFloat(employee.totalAdvances || 0);
    
    return (baseSalary + overtimePay - totalAdvances).toFixed(2);
  };

  const renderSection = (title, data, icon = null) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && <Ionicons name={icon} size={20} color="#007AFF" style={styles.sectionIcon} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {data}
      </View>
    </View>
  );

  const renderField = (label, value, icon = null, isHighlighted = false) => (
    <View style={[styles.field, isHighlighted && styles.highlightedField]}>
      <View style={styles.fieldHeader}>
        {icon && <Ionicons name={icon} size={16} color="#007AFF" style={styles.fieldIcon} />}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <Text style={[styles.fieldValue, isHighlighted && styles.highlightedValue]}>
        {value || 'Not specified'}
      </Text>
    </View>
  );

  const renderStatusBadge = (status, type = 'default') => {
    const getStatusConfig = () => {
      switch (status?.toLowerCase()) {
        case 'active':
          return { color: '#22c55e', bgColor: '#dcfce7', icon: 'checkmark-circle' };
        case 'suspended':
          return { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle' };
        case 'retired':
          return { color: '#f59e0b', bgColor: '#fef3c7', icon: 'time' };
        case 'on leave':
          return { color: '#8b5cf6', bgColor: '#ede9fe', icon: 'calendar' };
        default:
          return { color: '#6b7280', bgColor: '#f3f4f6', icon: 'help-circle' };
      }
    };

    const config = getStatusConfig();
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {status || 'Unknown'}
        </Text>
      </View>
    );
  };

  const renderCalendar = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const getStatusColor = (status) => {
      switch (status) {
        case 'present': return '#22c55e';
        case 'absent': return '#ef4444';
        case 'leave':
        case 'onLeave': return '#8b5cf6';
        default: return 'transparent';
      }
    };

    const getStatusBackground = (status) => {
      switch (status) {
        case 'present': return '#dcfce7';
        case 'absent': return '#fee2e2';
        case 'leave':
        case 'onLeave': return '#ede9fe';
        default: return '#ffffff';
      }
    };

    const navigateMonth = (direction) => {
      const newDate = new Date(selectedDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setSelectedDate(newDate);
      loadAttendanceDataForMonth(newDate, allAttendanceData);
    };

    const navigateYear = (direction) => {
      const newDate = new Date(selectedDate);
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
      setSelectedDate(newDate);
      loadAttendanceDataForMonth(newDate, allAttendanceData);
    };

    return (
      <View style={styles.calendarContainer}>
        {/* Month/Year Navigation */}
        <View style={styles.calendarNavigation}>
          <TouchableOpacity onPress={() => navigateYear('prev')} style={styles.navButton}>
            <Ionicons name="play-back" size={16} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.calendarTitle}>{monthName}</Text>
          
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigateYear('next')} style={styles.navButton}>
            <Ionicons name="play-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.calendarHeaderCell}>
              <Text style={styles.calendarHeaderText}>{day}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              {/* <ActivityIndicator size="small" color="#007AFF" /> */}
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            calendarData.map((item, index) => (
              <View key={index} style={styles.calendarCell}>
                {item.day ? (
                  <View style={[
                    styles.calendarDay, 
                    { 
                      backgroundColor: item.status ? getStatusColor(item.status) : '#ffffff',
                      borderColor: item.status ? getStatusColor(item.status) : '#e2e8f0'
                    }
                  ]}>
                    <Text style={[
                      styles.calendarDayText, 
                      { color: item.status ? '#ffffff' : '#6b7280' }
                    ]}>
                      {item.day}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.calendarEmptyCell} />
                )}
              </View>
            ))
          )}
        </View>
        
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>Leave</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPayrollCard = () => (
    <View style={styles.payrollCard}>
      <View style={styles.payrollHeader}>
        <Ionicons name="cash" size={24} color="#007AFF" />
        <Text style={styles.payrollTitle}>Payroll Summary</Text>
      </View>
      <View style={styles.payrollGrid}>
        <View style={styles.payrollItem}>
          <Text style={styles.payrollLabel}>Base Salary</Text>
          <Text style={styles.payrollAmount}>₹{employee.salary || '0'}</Text>
        </View>
        <View style={styles.payrollItem}>
          <Text style={styles.payrollLabel}>Overtime Rate</Text>
          <Text style={styles.payrollAmount}>{employee.overtimeRate || '1.5'}x</Text>
        </View>
        <View style={styles.payrollItem}>
          <Text style={styles.payrollLabel}>Bonus</Text>
          <Text style={styles.payrollAmount}>₹{employee.bonus || '0'}</Text>
        </View>
        <View style={styles.payrollItem}>
          <Text style={styles.payrollLabel}>Total Pay</Text>
          <Text style={styles.payrollAmount}>₹{calculateTotalPay()}</Text>
        </View>
      </View>
    </View>
  );

  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const renderDocument = (document, title, icon) => {
    if (!document) return null;
    
    return (
      <View style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <Ionicons name={icon} size={20} color="#007AFF" style={styles.documentIcon} />
          <Text style={styles.documentTitle}>{title}</Text>
        </View>
        {isImageFile(document.mimeType) ? (
          <View style={styles.documentImageContainer}>
            <RNImage
              source={{ uri: document.uri }}
              style={styles.documentImage}
            />
          </View>
        ) : (
          <View style={styles.documentInfo}>
            <Ionicons name="document" size={24} color="#6b7280" />
            <Text style={styles.documentName}>{document.name}</Text>
            <Text style={styles.documentSize}>{(document.size / 1024).toFixed(1)} KB</Text>
          </View>
        )}
      </View>
    );
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (onClose) {
          onClose();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        {/* Header */}
        <LinearGradient
          colors={['#007AFF', '#0056CC']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Employee Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          bounces={true}
        >
          {/* Employee Photo & Basic Info */}
          <View style={styles.heroSection}>
            {/* <View style={styles.photoContainer}>
              {employee.photoUrl ? (
                <RNImage
                  source={{ uri: employee.photoUrl }}
                  style={styles.employeePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={48} color="#8E8E93" />
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </View> */}
            
            <View style={styles.heroInfo}>
              <Text style={styles.employeeName}>{String(employee.fullName || 'Unknown Officer')}</Text>
              <Text style={styles.employeeBadge}>Badge: {String(employee.badgeNumber || employee.employeeId || 'N/A')}</Text>
              <Text style={styles.employeeRank}>Rank: {String(employee.rank || 'N/A')}</Text>
              {renderStatusBadge(employee.status)}
            </View>
          </View>

          {/* Payroll Card */}
          {renderPayrollCard()}

          {/* Attendance Information */}
          {renderSection('Current Month Attendance', (
            <>
              <View style={styles.attendanceGrid}>
                <View style={styles.attendanceItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text style={styles.attendanceLabel}>Present</Text>
                  <Text style={styles.attendanceValue}>{currentMonthStats.present}</Text>
                </View>
                <View style={styles.attendanceItem}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                  <Text style={styles.attendanceLabel}>Absent</Text>
                  <Text style={styles.attendanceValue}>{currentMonthStats.absent}</Text>
                </View>
                <View style={styles.attendanceItem}>
                  <Ionicons name="calendar" size={24} color="#8b5cf6" />
                  <Text style={styles.attendanceLabel}>Leave</Text>
                  <Text style={styles.attendanceValue}>{currentMonthStats.leave}</Text>
                </View>
                <View style={styles.attendanceItem}>
                  <Ionicons name="time" size={24} color="#f59e0b" />
                  <Text style={styles.attendanceLabel}>Total Hours</Text>
                  <Text style={styles.attendanceValue}>{currentMonthStats.totalWorkingHours}</Text>
                </View>
              </View>
              
              {/* Calendar View */}
              {renderCalendar()}
            </>
          ), 'time')}

          {/* Basic Information */}
          {renderSection('Basic Information', (
            <>
               {renderField("Father's Name", employee.fatherName, 'person')}
              {renderField('CNIC', employee.cnic, 'card')}
              {renderField('Date of Birth', formatDate(employee.dateOfBirth), 'calendar')}
              {renderField('Gender', employee.gender, 'male-female')}
            </>
          ), 'person')}

          {/* Contact Information */}
          {renderSection('Contact Information', (
            <>
              {renderField('Contact Number', employee.contactNumber || employee.phone, 'call')}
              {renderField('Email', employee.email, 'mail')}
              {renderField('Address', employee.address, 'location')}
            </>
          ), 'call')}

          {/* Employment Information */}
          {renderSection('Employment Information', (
            <>
              {renderField('Joining Date', formatDate(employee.joiningDate), 'calendar')}
              {renderField('Department', employee.department, 'business')}
             {renderField('Posting Station', employee.postingStation, 'location')}
              {renderField('Shift', employee.shift || employee.dutyShift, 'time')}
              {renderField('Service Years', employee.serviceYears, 'time')}
              {renderField('Last Promotion Date', formatDate(employee.lastPromotionDate), 'trending-up')}
            </>
          ), 'business')}

          {/* Payroll Information */}
          {renderSection('Payroll Details', (
            <>
              {renderField('Payment Type', employee.paymentType || 'Monthly', 'cash')}
              {renderField('Working Days', employee.workingDays?.join(', ') || 'Mon-Fri', 'calendar')}
              {renderField('Check-in Time', employee.checkInTime || '09:00', 'time')}
              {renderField('Check-out Time', employee.checkOutTime || '17:00', 'time')}
              {renderField('Overtime Rate', employee.overtimeRate ? `${employee.overtimeRate}x` : '1.5x', 'time')}
            </>
          ), 'cash')}

          {/* Professional Information */}
          {renderSection('Professional Information', (
            <>
              {renderField('Weapon License Number', employee.weaponLicenseNumber, 'shield')}
              {renderField('Driving License Number', employee.drivingLicenseNumber, 'car')}
              {renderField('Training Certifications', employee.trainingCertifications, 'library')}
         
              {renderField('Supervisor', employee.supervisor, 'person')}
              {renderField('Work Location', employee.workLocation, 'location')}
              {renderField('Vehicle Assigned', employee.vehicleAssigned, 'car')}
              {renderField('Equipment Assigned', employee.equipmentAssigned, 'construct')}
              {renderField('Disciplinary Actions', employee.disciplinaryActions, 'warning')}
            </>
          ), 'shield')}

          {/* Documents */}
          {(employee.uploadedDocuments || employee.documents) && renderSection('Documents', (
            <View style={styles.documentsContainer}>
              {renderDocument(employee.uploadedDocuments?.cnicDocument || employee.documents?.cnicDocument, 'CNIC Document', 'id-card')}
              {renderDocument(employee.uploadedDocuments?.educationalCertificate || employee.documents?.educationalCertificate, 'Educational Certificate', 'school')}
              {renderDocument(employee.uploadedDocuments?.weaponLicense || employee.documents?.weaponLicense, 'Weapon License', 'shield')}
              {renderDocument(employee.uploadedDocuments?.drivingLicense || employee.documents?.drivingLicense, 'Driving License', 'car')}
              {renderDocument(employee.uploadedDocuments?.medicalCertificate || employee.documents?.medicalCertificate, 'Medical Certificate', 'medical')}
              {renderDocument(employee.uploadedDocuments?.trainingCertifications || employee.documents?.trainingCertifications, 'Training Certifications', 'library')}
              {renderDocument(employee.uploadedDocuments?.employmentContract || employee.documents?.employmentContract, 'Employment Contract', 'document-text')}
              {renderDocument(employee.uploadedDocuments?.receipt || employee.documents?.receipt, 'Receipt', 'receipt')}
            </View>
          ), 'document')}

          {/* Notes */}
          {employee.notes && renderSection('Notes', (
            <Text style={styles.notesText}>{String(employee.notes || 'No notes available')}</Text>
          ), 'chatbubble')}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
 
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  employeePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  employeeBadge: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  employeeRank: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payrollCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  payrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  payrollTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  payrollGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  payrollItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  payrollLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  payrollAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionContent: {
    gap: 16,
  },
  field: {
    paddingVertical: 8,
  },
  highlightedField: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  highlightedValue: {
    color: '#007AFF',
    fontWeight: '700',
  },
  notesText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  documentsContainer: {
    gap: 16,
  },
  documentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    marginRight: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  documentImageContainer: {
    alignItems: 'center',
  },
  documentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  documentName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  documentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  attendanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attendanceItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 8,
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  calendarContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    // padding: 20,
  
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',

    borderColor: '#e2e8f0',
  },
  calendarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  calendarHeaderText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  calendarCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 2,
  },
  calendarDay: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 36,
    minHeight: 36,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarEmptyCell: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  loadingContainer: {
    gridColumn: '1 / -1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
});

export default EmployeeDetailsModal;

