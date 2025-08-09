import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import InputField from './InputField';

const DatePicker = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title = "Select Date",
  currentValue = '',
  placeholder = "YYYY-MM-DD"
}) => {
  const [tempDate, setTempDate] = useState(currentValue);

  const handleConfirm = () => {
    if (tempDate) {
      // Basic date validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(tempDate)) {
        onConfirm(tempDate);
        onClose();
      } else {
        Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format');
      }
    } else {
      onClose();
    }
  };

  const handleInputChange = (text) => {
    // Only allow numbers, hyphens, and backspace
    const filteredText = text.replace(/[^0-9-]/g, '');
    setTempDate(filteredText);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          <InputField
            label="Date"
            value={tempDate}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            style={{ marginBottom: 16 }}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#667eea',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default DatePicker; 