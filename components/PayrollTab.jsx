import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { dataService } from '../services/unifiedDataService';

const PayrollTab = ({ employees }) => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSampleDataButton, setShowSampleDataButton] = useState(true);
  const [customToast, setCustomToast] = useState(null);

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  useEffect(() => {
    calculatePayrollData();
  }, [employees, selectedMonth, selectedYear]);

  const calculatePayrollData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance records
      const attendanceRecords = await dataService.getItems('attendance');
      
      // Fetch advance records
      const advanceRecords = await dataService.getItems('advances');
      
      const calculatedPayroll = employees.map(employee => {
        // Filter attendance for current month/year
        const employeeAttendance = attendanceRecords.filter(record => {
          if (record.employeeId !== employee.id && record.employeeId !== employee.$id) return false;
          
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        });

        // Filter advances for current month/year
        const employeeAdvances = advanceRecords.filter(record => {
          if (record.employeeId !== employee.id && record.employeeId !== employee.$id) return false;
          
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        });

        // Calculate total hours from attendance
        const totalHours = employeeAttendance.reduce((sum, record) => {
          if (record.status === 'Present') return sum + 8; // 8 hours for full day
          if (record.status === 'Half Day') return sum + 4; // 4 hours for half day
          return sum;
        }, 0);

        // Calculate overtime hours (assuming 160 hours per month is standard)
        const standardHours = 160;
        const overtimeHours = Math.max(0, totalHours - standardHours);
        const regularHours = Math.min(totalHours, standardHours);

        // Get employee salary and overtime rate
        const baseSalary = parseFloat(employee.salary || 0);
        const overtimeRate = parseFloat(employee.overtimeRate || 0);
        const totalAdvances = parseFloat(employee.totalAdvances || 0);

        // Calculate pay components
        const hourlyRate = baseSalary / standardHours;
        // If no overtime rate is set, use 1.5x hourly rate as default
        const defaultOvertimeRate = overtimeRate || (hourlyRate * 1.5);
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * defaultOvertimeRate;
        const totalAdvancesThisMonth = employeeAdvances.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);
        
        // Calculate total pay
        const totalPay = regularPay + overtimePay + totalAdvancesThisMonth;

        return {
          employee,
          attendance: employeeAttendance,
          advances: employeeAdvances,
          calculations: {
            totalHours,
            regularHours,
            overtimeHours,
            baseSalary,
            hourlyRate,
            regularPay,
            overtimePay,
            totalAdvancesThisMonth,
            totalAdvances,
            totalPay
          }
        };
      });

      setPayrollData(calculatedPayroll);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      showCustomToast('error', 'Error', 'Failed to calculate payroll data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const addSamplePayrollData = async () => {
    try {
      const updatedEmployees = employees.map(employee => ({
        ...employee,
        overtimeRate: (parseFloat(employee.salary || 0) / 160 * 1.5).toString(), // 1.5x hourly rate
        monthlyOvertimeHours: '20', // 20 hours per month
        totalAdvances: '15000', // $15,000 total advances
        lastAdvanceDate: new Date().toISOString(),
        benefits: 'Health Insurance, Housing Allowance',
        allowances: 'Transport Allowance, Meal Allowance'
      }));

      // Update each employee with new data
      for (const employee of updatedEmployees) {
        const { dataService } = await import('../services/unifiedDataService');
        await handleDataUpdate(`employees_${employee.id || employee.$id}`, employee.id || employee.$id, employee, 'employees');
      }

      // Removed success toast

      setShowSampleDataButton(false);
      calculatePayrollData(); // Refresh the data
    } catch (error) {
      console.error('Error adding sample payroll data:', error);
      showCustomToast('error', 'Error', 'Failed to add sample payroll data');
    }
  };

  const renderPayrollCard = ({ item }) => {
    const { employee, calculations } = item;
    
    return (
      <View style={styles.payrollCard}>
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{String(employee.fullName || employee.employeeName || 'Unknown')}</Text>
            <Text style={styles.employeeRank}>{String(employee.rank || employee.department || 'N/A')}</Text>
          </View>
          <View style={styles.totalPayContainer}>
            <Text style={styles.totalPayLabel}>Total Pay</Text>
            <Text style={styles.totalPayAmount}>{String(formatCurrency(calculations.totalPay))}</Text>
          </View>
        </View>

        <View style={styles.payrollDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Base Salary:</Text>
            <Text style={styles.detailValue}>{String(formatCurrency(calculations.baseSalary))}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Regular Hours:</Text>
            <Text style={styles.detailValue}>{String(calculations.regularHours)}h</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Regular Pay:</Text>
            <Text style={styles.detailValue}>{String(formatCurrency(calculations.regularPay))}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Overtime Hours:</Text>
            <Text style={styles.detailValue}>{String(calculations.overtimeHours)}h</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Overtime Pay:</Text>
            <Text style={styles.detailValue}>{String(formatCurrency(calculations.overtimePay))}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Advances This Month:</Text>
            <Text style={styles.detailValue}>{String(formatCurrency(calculations.totalAdvancesThisMonth))}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Advances:</Text>
            <Text style={styles.detailValue}>{String(formatCurrency(calculations.totalAdvances))}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Net Pay This Month:</Text>
          <Text style={styles.summaryAmount}>{String(formatCurrency(calculations.totalPay))}</Text>
        </View>
      </View>
    );
  };

  const renderSummaryCard = () => {
    const totalPayroll = payrollData.reduce((sum, item) => sum + item.calculations.totalPay, 0);
    const totalOvertime = payrollData.reduce((sum, item) => sum + item.calculations.overtimePay, 0);
    const totalAdvances = payrollData.reduce((sum, item) => sum + item.calculations.totalAdvancesThisMonth, 0);

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={24} color="#10b981" />
          <Text style={styles.summaryLabel}>Total Payroll</Text>
          <Text style={styles.summaryValue}>{String(formatCurrency(totalPayroll))}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={24} color="#f59e0b" />
          <Text style={styles.summaryLabel}>Total Overtime</Text>
          <Text style={styles.summaryValue}>{String(formatCurrency(totalOvertime))}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="card-outline" size={24} color="#ef4444" />
          <Text style={styles.summaryLabel}>Total Advances</Text>
          <Text style={styles.summaryValue}>{String(formatCurrency(totalAdvances))}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculating payroll...</Text>
      </View>
    );
  }

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month/Year Selector */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodTitle}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>

        {/* Summary Cards */}
        {renderSummaryCard()}

        {/* Sample Data Button */}
        {showSampleDataButton && employees.length > 0 && (
          <View style={styles.sampleDataContainer}>
            <TouchableOpacity style={styles.sampleDataButton} onPress={addSamplePayrollData}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.sampleDataGradient}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.sampleDataButtonText}>Add Sample Payroll Data</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Payroll List */}
        {payrollData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Payroll Data</Text>
            <Text style={styles.emptyMessage}>
              No payroll data available for {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
        ) : (
          <FlatList
            data={payrollData}
            keyExtractor={(item) => item.employee.id || item.employee.$id}
            renderItem={renderPayrollCard}
            scrollEnabled={false}
            contentContainerStyle={styles.payrollList}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  periodSelector: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  periodTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  summaryContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  summaryCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', boxShadowColor: '#000', boxShadowOffset: { width: 0, height: 2 }, boxShadowOpacity: 0.05, boxShadowRadius: 4, elevation: 2 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 8, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  payrollList: { padding: 20 },
  payrollCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadowColor: '#000', boxShadowOffset: { width: 0, height: 4 }, boxShadowOpacity: 0.1, boxShadowRadius: 8, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  employeeRank: { fontSize: 14, color: '#6b7280' },
  totalPayContainer: { alignItems: 'flex-end' },
  totalPayLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  totalPayAmount: { fontSize: 20, fontWeight: '700', color: '#10b981' },
  payrollDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 2, borderTopColor: '#e2e8f0' },
  summaryLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  sampleDataContainer: { padding: 20 },
  sampleDataButton: { borderRadius: 12, boxShadowColor: '#10b981', boxShadowOffset: { width: 0, height: 4 }, boxShadowOpacity: 0.3, boxShadowRadius: 8, elevation: 4 },
  sampleDataGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  sampleDataButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  customToastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    zIndex: 9999,
    elevation: 9999,
  },
  errorToast: { backgroundColor: '#ef4444' },
  successToast: { backgroundColor: '#10b981' },
  warningToast: { backgroundColor: '#f59e0b' },
  infoToast: { backgroundColor: '#3b82f6' },
  toastContent: { marginLeft: 12 },
  toastTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  toastMessage: { fontSize: 14, color: '#fff', marginTop: 4 }
});

export default PayrollTab; 