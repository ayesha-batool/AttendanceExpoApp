import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { customOptionsService, dataService } from '../../services/unifiedDataService';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [cases, setCases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState({ local: null, appwrite: null });

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
          dataService.getItems('employees'),
          dataService.getItems('cases'),
          dataService.getItems('expenses')
        ]);
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      const validCases = casesData.filter(item => item && typeof item === 'object');
      const validExpenses = expensesData.filter(item => item && typeof item === 'object');
      setEmployees(validEmployees);
      setCases(validCases);
      setExpenses(validExpenses);
      
      // Check device IDs
      await checkDeviceIds();
      
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


  const handleInitializeDefaults = async () => {
    try {
      const result = await customOptionsService.initializeDefaultOptions();
      
      Toast.show({
        type: result.success ? 'success' : 'error',
        text1: 'Initialize Defaults',
        text2: result.message || result.error,
      });
    } catch (error) {
      console.error('Initialize failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Initialize Failed',
        text2: error.message,
      });
    }
  };

  const handleCheckDefaultsStatus = async () => {
    try {
      const status = await customOptionsService.checkDefaultOptionsStatus();
      
      Toast.show({
        type: 'info',
        text1: 'Default Options Status',
        text2: 'Check console for details',
      });
    } catch (error) {
      console.error('Status check failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Status Check Failed',
        text2: error.message,
      });
    }
  };



  const getUpcomingHolidaysCount = () => {
    return upcomingHolidays.length;
  };

  const checkDeviceIds = async () => {
    try {
      // Get local device ID from storage
      const localDeviceId = await AsyncStorage.getItem('deviceId');
      
      // Get device ID from Appwrite if online
      let appwriteDeviceId = null;
      try {
        const appwriteData = await dataService.getItems('employees');
        if (appwriteData.length > 0) {
          // Get the first employee's deviceId from Appwrite
          const firstEmployee = appwriteData[0];
          appwriteDeviceId = firstEmployee.deviceId;
        }
      } catch (error) {
        console.log('Could not fetch Appwrite device ID:', error.message);
      }
      
      setDeviceInfo({
        local: localDeviceId,
        appwrite: appwriteDeviceId
      });
      
      console.log('Device IDs:', { local: localDeviceId, appwrite: appwriteDeviceId });
    } catch (error) {
      console.error('Error checking device IDs:', error);
    }
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
          {user && (
            <TouchableOpacity style={styles.userInitialsContainer} onPress={() => router.push('/auth')}>
              <Text style={styles.userInitials}>
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </Text>
            </TouchableOpacity>
          )}
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
  userInitialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  userInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerLeft: { 
    flex: 1 
  },
  titleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
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
   
    flexWrap: 'wrap'
    
  },
  headerSubtitle: { 
    fontSize: screenWidth > 768 ? 16 : 14, 
    color: '#fff', 
    opacity: 0.9 
  },
  kpiSection: { 
    padding: 12,
    
  },
  kpiGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18
  },
  kpiCard: { 
    flex: 1,
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    boxShadowColor: '#000', 
    boxShadowOffset: { width: 0, height: 2 }, 
    boxShadowOpacity: 0.08, 
    boxShadowRadius: 8, 
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
    boxShadowColor: '#000', 
    boxShadowOffset: { width: 0, height: 4 }, 
    boxShadowOpacity: 0.1, 
    boxShadowRadius: 12, 
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
  debugSection: {
    marginTop: 16,
  },
  debugButton: {
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 8,
    elevation: 3,
  },
  debugGradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default DashboardScreen; 