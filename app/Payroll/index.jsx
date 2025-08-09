import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getItems, useNetworkStatus } from '../../services/dataHandler';

const PayrollScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeePayroll, setEmployeePayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Alert.alert('Error', 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async (employee) => {
    try {
      setSelectedEmployee(employee);
      setLoading(true);

      // Fetch attendance records for this employee
      const attendanceRecords = await getItems('attendance');
      const employeeAttendance = attendanceRecords.filter(
        record => record.employeeId === employee.$id
      );

      // Fetch advance records for this employee
      const advanceRecords = await getItems('advances');
      const employeeAdvances = advanceRecords.filter(
        record => record.employeeId === employee.$id
      );

      // Fetch fines/remarks for this employee
      const remarksRecords = await getItems('remarks');
      const employeeRemarks = remarksRecords.filter(
        record => record.employeeId === employee.$id
      );

      // Calculate total hours from attendance
      const totalHours = employeeAttendance.reduce((sum, record) => {
        if (record.status === 'Present') return sum + 8; // 8 hours for full day
        if (record.status === 'Half Day') return sum + 4; // 4 hours for half day
        return sum;
      }, 0);

      // Calculate total advances
      const totalAdvances = employeeAdvances.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);

      // Calculate fines (assuming remarks might contain fine information)
      const totalFines = employeeRemarks.reduce((sum, record) => {
        // This is a simplified calculation - you might want to add a specific fine field
        return sum + 0; // For now, no fines calculation
      }, 0);

      // Calculate salary
      const hourlyRate = parseFloat(employee.salary || employee.hourlyRate || 0) / 160; // Assuming 160 hours per month
      const baseSalary = totalHours * hourlyRate;
      const totalPayableSalary = baseSalary - totalAdvances - totalFines;

      const payrollData = {
        employee: employee,
        attendance: employeeAttendance,
        advances: employeeAdvances,
        remarks: employeeRemarks,
        calculations: {
          totalHours,
          hourlyRate,
          baseSalary,
          totalAdvances,
          totalFines,
          totalPayableSalary
        },
        period: {
          startDate: employee.joiningDate || new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      };

      setEmployeePayroll(payrollData);
      setShowPayrollModal(true);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      Alert.alert('Error', 'Failed to calculate payroll');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="people-outline" size={20} color="#007AFF" />
            </View>
            <Text style={styles.summaryLabel}>Total Employees</Text>
            <Text style={styles.summaryValue}>{employees.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cash-outline" size={20} color="#28a745" />
            </View>
            <Text style={styles.summaryLabel}>Total Salary</Text>
            <Text style={styles.summaryValue}>
              ${employees.reduce((sum, emp) => sum + (parseFloat(emp.salary || emp.hourlyRate || 0)), 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Employee List */}
        {employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Employees Found</Text>
            <Text style={styles.emptyText}>Add employees to calculate payroll</Text>
          </View>
        ) : (
          employees.map((employee) => (
            <TouchableOpacity
              key={employee.$id}
              style={styles.employeeCard}
              onPress={() => calculatePayroll(employee)}
            >
              <View style={styles.employeeInfo}>
                <View style={styles.employeeAvatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeName}>
                    {employee.fullName || employee.name || employee.employeeName}
                  </Text>
                  <Text style={styles.employeeId}>
                    ID: {employee.employeeId || employee.$id}
                  </Text>
                  <Text style={styles.employeeSalary}>
                    Salary: ${employee.salary || employee.hourlyRate || 0}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Payroll Modal */}
      {showPayrollModal && employeePayroll && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay Profile</Text>
              <TouchableOpacity onPress={() => setShowPayrollModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.payrollContent}>
              {/* Employee Info */}
              <View style={styles.employeeSection}>
                <Text style={styles.sectionTitle}>Employee Information</Text>
                <Text style={styles.employeeName}>{employeePayroll.employee.fullName || employeePayroll.employee.name || employeePayroll.employee.employeeName}</Text>
                <Text style={styles.employeeDetails}>
                  ID: {employeePayroll.employee.employeeId || employeePayroll.employee.$id}
                </Text>
                <Text style={styles.employeeDetails}>
                  Joining Date: {employeePayroll.period.startDate}
                </Text>
              </View>

              {/* Pay Period */}
              <View style={styles.periodSection}>
                <Text style={styles.sectionTitle}>Pay Period</Text>
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Start Date:</Text>
                  <Text style={styles.periodValue}>{employeePayroll.period.startDate}</Text>
                </View>
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>End Date:</Text>
                  <Text style={styles.periodValue}>{employeePayroll.period.endDate}</Text>
                </View>
              </View>

              {/* Payroll Details */}
              <View style={styles.payrollSection}>
                <Text style={styles.sectionTitle}>Payroll Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Hours:</Text>
                  <Text style={styles.detailValue}>{employeePayroll.calculations.totalHours} hrs</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hourly Rate:</Text>
                  <Text style={styles.detailValue}>${employeePayroll.calculations.hourlyRate.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Base Salary:</Text>
                  <Text style={styles.detailValue}>${employeePayroll.calculations.baseSalary.toFixed(2)}</Text>
                </View>
              </View>

              {/* Salary Calculation */}
              <View style={styles.calculationSection}>
                <Text style={styles.sectionTitle}>Salary Calculation</Text>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Base Salary:</Text>
                  <Text style={styles.calculationValue}>${employeePayroll.calculations.baseSalary.toFixed(2)}</Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Advances:</Text>
                  <Text style={[styles.calculationValue, styles.deduction]}>
                    -${employeePayroll.calculations.totalAdvances.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Fines:</Text>
                  <Text style={[styles.calculationValue, styles.deduction]}>
                    -${employeePayroll.calculations.totalFines.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.calculationRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Payable Salary:</Text>
                  <Text style={styles.totalValue}>
                    ${employeePayroll.calculations.totalPayableSalary.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Attendance Summary */}
              <View style={styles.attendanceSection}>
                <Text style={styles.sectionTitle}>Attendance Summary</Text>
                <View style={styles.attendanceStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Present</Text>
                    <Text style={styles.statValue}>
                      {employeePayroll.attendance.filter(a => a.status === 'Present').length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Absent</Text>
                    <Text style={styles.statValue}>
                      {employeePayroll.attendance.filter(a => a.status === 'Absent').length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Half Day</Text>
                    <Text style={styles.statValue}>
                      {employeePayroll.attendance.filter(a => a.status === 'Half Day').length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Recent Advances */}
              {employeePayroll.advances.length > 0 && (
                <View style={styles.advancesSection}>
                  <Text style={styles.sectionTitle}>Recent Advances</Text>
                  {employeePayroll.advances.slice(0, 3).map((advance, index) => (
                    <View key={index} style={styles.advanceItem}>
                      <Text style={styles.advanceDate}>{advance.date}</Text>
                      <Text style={styles.advanceAmount}>${advance.amount}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  scrollArea: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  employeeList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  employeeSalary: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  payrollContent: {
    padding: 20
  },
  employeeSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  employeeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  periodSection: {
    marginBottom: 24
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  periodLabel: {
    fontSize: 14,
    color: '#666'
  },
  periodValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  payrollSection: {
    marginBottom: 24
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  calculationSection: {
    marginBottom: 24
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666'
  },
  calculationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  deduction: {
    color: '#ff4444'
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 12
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  attendanceSection: {
    marginBottom: 24
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  advancesSection: {
    marginBottom: 24
  },
  advanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  advanceDate: {
    fontSize: 14,
    color: '#666'
  },
  advanceAmount: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600'
  }
});

export default PayrollScreen; 