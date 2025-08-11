import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AttendanceTab from './AttendanceTab';

const AttendanceModal = ({ visible, onClose, employees }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.attendanceModalContainer}>
        <View style={styles.attendanceModalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.attendanceModalTitle}>📅 Attendance Management</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <AttendanceTab employees={employees} />
      </View>
    </Modal>
  );
};

const styles = {
  attendanceModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  attendanceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  attendanceModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
};

export default AttendanceModal; 