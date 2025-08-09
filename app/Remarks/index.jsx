import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import DatePickerField from '../../components/DatePickerField';
import InputField from '../../components/InputField';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { getItems, useNetworkStatus } from '../../services/dataHandler';
import {
    colors,
    commonStyles,
    getIconColor,
    getSummaryIconColor,
    icons,
    spacing,
    typography
} from '../../styles/designSystem';

const RemarksScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [remarksRecords, setRemarksRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [newRemark, setNewRemark] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date(),
    remarks: ''
  });

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    fetchRemarksRecords();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeeData = await getItems('employees');
      console.log('📦 Fetched employees for remarks:', employeeData);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch employees'
      });
    }
  };

  const fetchRemarksRecords = async () => {
    try {
      const records = await getItems('remarks');
      console.log('📦 Fetched remarks records:', records);
      setRemarksRecords(records);
    } catch (error) {
      console.error('Error fetching remarks records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    const selectedEmployee = employees.find(emp => emp.$id === employeeId);
    if (selectedEmployee) {
      console.log('📦 Selected employee:', selectedEmployee);
      setNewRemark(prev => ({
        ...prev,
        employeeId: selectedEmployee.$id,
        employeeName: selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName
      }));
      // Clear employee error when selected
      setErrors(prev => ({ ...prev, employeeId: null }));
      console.log('📦 Updated remark state:', {
        employeeId: selectedEmployee.$id,
        employeeName: selectedEmployee.fullName || selectedEmployee.name || selectedEmployee.employeeName
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Employee validation
    if (!newRemark.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    // Remarks validation
    if (!newRemark.remarks || newRemark.remarks.trim() === '') {
      newErrors.remarks = 'Please enter remarks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRemark = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const remarkData = {
        ...newRemark,
        date: newRemark.date.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        synced: isConnected,
        userId: currentUser?.$id || 'unknown'
      };

      console.log('📦 Saving remark:', remarkData);

      // Here you would normally save to your backend/local storage
      // For now, just add to local state
      const newRemarkRecord = {
        $id: Date.now().toString(),
        ...remarkData
      };

      setRemarksRecords(prev => [newRemarkRecord, ...prev]);
      setShowAddModal(false);
      setNewRemark({
        employeeId: '',
        employeeName: '',
        date: new Date(),
        remarks: ''
      });
      setErrors({});

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Remark added successfully'
      });
    } catch (error) {
      console.error('Error saving remark:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save remark'
      });
    }
  };

  const deleteRemark = async (recordId) => {
    Alert.alert(
      'Delete Remark',
      'Are you sure you want to delete this remark?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('📦 Deleting remark:', recordId);
              
              // Remove from local state
              setRemarksRecords(prev => prev.filter(record => record.$id !== recordId));
              
              // Here you would normally delete from local storage
              // For now, just log the action
              console.log('📦 Deleted remark:', recordId);
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Remark deleted successfully'
              });
            } catch (error) {
              console.error('Error deleting remark:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete remark'
              });
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading remarks...</Text>
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
              <Ionicons name={icons.totalEmployees} size={20} color={getSummaryIconColor('totalEmployees')} />
          </View>
          <Text style={styles.summaryLabel}>All Employees</Text>
          <Text style={styles.summaryValue}>{employees.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.thisMonth} size={20} color={getSummaryIconColor('thisMonth')} />
          </View>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryValue}>
            {remarksRecords.filter(record => {
              const recordDate = new Date(record.date);
              const currentDate = new Date();
              return recordDate.getMonth() === currentDate.getMonth() && 
                     recordDate.getFullYear() === currentDate.getFullYear();
            }).length}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
              <Ionicons name={icons.remarks} size={20} color={getSummaryIconColor('remarks')} />
          </View>
          <Text style={styles.summaryLabel}>Total Remarks</Text>
          <Text style={styles.summaryValue}>
            {remarksRecords.length}
          </Text>
        </View>
      </View>

      {/* Remarks List */}
        {remarksRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={icons.chatbubble} size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Remarks Records</Text>
            <Text style={styles.emptyText}>Start by adding your first remark</Text>
          </View>
        ) : (
          remarksRecords.map((record) => (
            <View key={record.$id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <Ionicons name={icons.avatar} size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.employeeName}>{record.employeeName}</Text>
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                </View>
                <View style={styles.recordActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => deleteRemark(record.$id)}>
                    <Ionicons name={icons.delete} size={18} color={getIconColor('danger')} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.remarksContainer}>
                <Text style={styles.remarksLabel}>Remarks:</Text>
                <Text style={styles.remarksText}>{record.remarks}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Remark Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Remark</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Employee</Text>
              <SelectDropdown
                data={employees.map(emp => ({
                  label: emp.fullName || emp.name || emp.employeeName,
                  value: emp.$id
                }))}
                onSelect={handleEmployeeSelect}
                placeholder="Select employee"
                style={[styles.employeeSelector, errors.employeeId && styles.errorInput]}
              />
              {errors.employeeId && <Text style={styles.errorText}>{errors.employeeId}</Text>}

              <Text style={styles.formLabel}>Date</Text>
              <DatePickerField
                value={newRemark.date}
                onChange={(date) => setNewRemark(prev => ({ ...prev, date }))}
                style={styles.datePicker}
              />

              <Text style={styles.formLabel}>Remarks</Text>
              <InputField
                value={newRemark.remarks}
                onChangeText={(text) => setNewRemark(prev => ({ ...prev, remarks: text }))}
                placeholder="Enter remarks..."
                multiline
                numberOfLines={4}
                style={[styles.remarksInput, errors.remarks && styles.errorInput]}
              />
              {errors.remarks && <Text style={styles.errorText}>{errors.remarks}</Text>}

              <TouchableOpacity style={styles.saveButton} onPress={saveRemark}>
                <Text style={styles.saveButtonText}>Save Remark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollArea: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  summaryContainer: {
    ...commonStyles.summaryContainer,
  },
  summaryCard: {
    ...commonStyles.summaryCard,
  },
  summaryIconContainer: {
    ...commonStyles.summaryIconContainer,
  },
  summaryLabel: {
    ...commonStyles.summaryLabel,
  },
  summaryValue: {
    ...commonStyles.summaryValue,
  },
  emptyContainer: {
    ...commonStyles.emptyContainer,
  },
  emptyTitle: {
    ...commonStyles.emptyTitle,
  },
  emptyText: {
    ...commonStyles.emptyText,
  },
  recordCard: {
    ...commonStyles.recordCard,
  },
  recordHeader: {
    ...commonStyles.recordHeader,
  },
  employeeInfo: {
    ...commonStyles.employeeInfo,
  },
  employeeAvatar: {
    ...commonStyles.employeeAvatar,
  },
  employeeName: {
    ...commonStyles.employeeName,
  },
  recordDate: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  recordActions: {
    ...commonStyles.recordActions,
  },
  actionButton: {
    ...commonStyles.actionButton,
  },
  remarksContainer: {
    ...commonStyles.remarksContainer,
  },
  remarksLabel: {
    ...commonStyles.remarksLabel,
  },
  remarksText: {
    ...commonStyles.remarksText,
  },
  modalContainer: {
    ...commonStyles.modalContainer,
  },
  modalContent: {
    ...commonStyles.modalContent,
  },
  modalHeader: {
    ...commonStyles.modalHeader,
  },
  modalTitle: {
    ...commonStyles.modalTitle,
  },
  formContainer: {
    ...commonStyles.formContainer,
  },
  formLabel: {
    ...commonStyles.formLabel,
  },
  employeeSelector: {
    ...commonStyles.employeeSelector,
  },
  errorInput: {
    ...commonStyles.errorInput,
  },
  errorText: {
    ...commonStyles.errorText,
  },
  datePicker: {
    marginBottom: spacing.md,
  },
  remarksInput: {
    marginBottom: spacing.md,
  },
  saveButton: {
    ...commonStyles.saveButton,
  },
  saveButtonText: {
    ...commonStyles.saveButtonText,
  },
  floatingAddButton: {
    ...commonStyles.floatingAddButton,
  }
});

export default RemarksScreen; 