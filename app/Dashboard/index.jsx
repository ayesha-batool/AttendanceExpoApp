import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItems } from '../../services/dataHandler';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [cases, setCases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onDutyCount, setOnDutyCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesData, casesData, expensesData] = await Promise.all([
        getItems('employees'),
        getItems('cases'),
        getItems('expenses')
      ]);
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      const validCases = casesData.filter(item => item && typeof item === 'object');
      const validExpenses = expensesData.filter(item => item && typeof item === 'object');
      setEmployees(validEmployees);
      setCases(validCases);
      setExpenses(validExpenses);
      
      // Get real-time on-duty count
      const currentOnDutyCount = await getCurrentlyOnDutyCount();
      setOnDutyCount(currentOnDutyCount);
      
      try {
        const holidaysData = await AsyncStorage.getItem('employee_holidays');
        if (holidaysData) {
          const holidays = JSON.parse(holidaysData);
          const today = new Date();
          const upcoming = holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return holidayDate >= today;
          }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
          setUpcomingHolidays(upcoming);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + (parseFloat(expense.amount) || 0), 0);
  };

  const getActiveCasesCount = () => {
    return cases.filter(caseItem => caseItem.status === 'active' || caseItem.status === 'investigation').length;
  };

  const getOnDutyCount = () => {
    // Count employees who are active and currently on duty
    const activeEmployees = employees.filter(emp => 
      emp.status === 'active' || 
      emp.employmentStatus === 'active'
    );
    
    // For now, return active employees count
    // In a real implementation, you would also check attendance data
    // to see who is actually clocked in/on duty right now
    return activeEmployees.length;
  };

  const getCurrentlyOnDutyCount = async () => {
    try {
      // Get attendance data to see who is actually clocked in today
      const attendanceData = await AsyncStorage.getItem('attendance');
      if (attendanceData) {
        const attendance = JSON.parse(attendanceData);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Count employees who are checked in today and haven't checked out
        let onDutyCount = 0;
        attendance.forEach(record => {
          if (record.date === today && record.status === 'Present' && !record.checkOut) {
            onDutyCount++;
          }
        });
        
        return onDutyCount;
      }
    } catch (error) {
      console.error('Error getting attendance data:', error);
    }
    
    // Fallback to active employees count
    return getOnDutyCount();
  };

  const getUpcomingHolidaysCount = () => {
    return upcomingHolidays.length;
  };

  const getMonthlyExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter expenses for current month and year
    const monthlyExpenses = expenses.filter(expense => {
      if (!expense.date) return false;
      
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    // Calculate total with proper error handling
    const total = monthlyExpenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
    
    return total;
  };

  const getCurrentMonthExpensesBreakdown = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter expenses for current month and year
    const monthlyExpenses = expenses.filter(expense => {
      if (!expense.date) return false;
      
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    // Group by category
    const breakdown = {};
    monthlyExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      const amount = parseFloat(expense.amount) || 0;
      
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += amount;
    });
    
    return breakdown;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={48} color="#1e40af" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      <LinearGradient colors={['#1e40af', '#1e3a8a', '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="shield" size={screenWidth > 768 ? 32 : 24} color="#fff" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.headerTitle}>Police Management System</Text>
                <Text style={styles.headerSubtitle}>Department Overview & Analytics</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.kpiSection}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="people" size={20} color="#1e40af" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{employees.length}</Text>
              <Text style={styles.kpiLabel}>Total Officers</Text>
              <Text style={styles.kpiSubtext}>Department strength</Text>
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{onDutyCount}</Text>
              <Text style={styles.kpiLabel}>On Duty</Text>
              <Text style={styles.kpiSubtext}>Currently clocked in</Text>
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="folder" size={20} color="#dc2626" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{getActiveCasesCount()}</Text>
              <Text style={styles.kpiLabel}>Active Cases</Text>
              <Text style={styles.kpiSubtext}>Ongoing investigations</Text>
            </View>
          </View>
                     <View style={styles.kpiCard}>
             <View style={styles.kpiIconContainer}>
               <Ionicons name="card" size={20} color="#8b5cf6" />
             </View>
             <View style={styles.kpiContent}>
               <Text style={styles.kpiValue}>${getTotalExpenses().toLocaleString()}</Text>
               <Text style={styles.kpiLabel}>Total Expenses</Text>
               <Text style={styles.kpiSubtext}>All time spending</Text>
             </View>
           </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/Employee')}>
            <LinearGradient colors={['#1e40af', '#1e3a8a']} style={styles.actionGradient}>
              <Ionicons name="people" size={32} color="#fff" />
              <Text style={styles.actionTitle}>Manage Team</Text>
              <Text style={styles.actionSubtitle}>Officers & Attendance</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/Cases')}>
            <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.actionGradient}>
              <Ionicons name="folder" size={32} color="#fff" />
              <Text style={styles.actionTitle}>Manage Cases</Text>
              <Text style={styles.actionSubtitle}>Investigations</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/ExpensesManagement')}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionGradient}>
              <Ionicons name="card" size={32} color="#fff" />
              <Text style={styles.actionTitle}>Expenses</Text>
              <Text style={styles.actionSubtitle}>Financial Management</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc' 
  },
  loadingText: { 
    fontSize: 18, 
    color: '#64748b', 
    marginTop: 16, 
    fontWeight: '600' 
  },
  header: { 
    paddingTop: 30, 
    paddingBottom: 12, 
    paddingHorizontal: 16 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerLeft: { 
    flex: 1 
  },
  titleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  headerIconContainer: { 
    width: screenWidth > 768 ? 64 : 48, 
    height: screenWidth > 768 ? 64 : 48, 
    borderRadius: screenWidth > 768 ? 32 : 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  titleTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: { 
    fontSize: screenWidth > 768 ? 28 : 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 4,
    flexWrap: 'wrap'
  },
  headerSubtitle: { 
    fontSize: screenWidth > 768 ? 16 : 14, 
    color: '#fff', 
    opacity: 0.9 
  },
  kpiSection: { 
    padding: 12 
  },
  kpiGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  kpiCard: { 
    width: screenWidth > 768 ? '48%' : '47%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3,
    marginBottom: 8
  },
  kpiIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  kpiContent: { 
    flex: 1 
  },
  kpiValue: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 3 
  },
  kpiLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 2 
  },
  kpiSubtext: { 
    fontSize: 11, 
    color: '#64748b' 
  },
  actionsSection: { 
    padding: 16 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginBottom: 16 
  },
  actionsGrid: { 
    gap: 12 
  },
  actionCard: { 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 4 
  },
  actionGradient: { 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  actionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff', 
    marginTop: 12, 
    marginBottom: 4 
  },
  actionSubtitle: { 
    fontSize: 14, 
    color: '#fff', 
    opacity: 0.9 
  },
});

export default DashboardScreen; 