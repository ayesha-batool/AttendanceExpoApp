// components/DatePickerField.js
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DatePickerField = ({ label, mode = 'date', value, onChange, optional = false, error = null }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Select Date';

    return mode === 'time'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();
  };

  // Ensure we have a valid date for the DateTimePicker
  const getPickerValue = () => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    return new Date();
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </Text>
      )}
      <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.button, error && styles.buttonError]}>
        <Text style={styles.buttonText}>{formatDate(value)}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{String(error)}</Text>}
      {showPicker && (
        <DateTimePicker
          value={getPickerValue()}
          mode={mode}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
      label: { marginBottom: 4, fontSize: 16, fontWeight: '600', color: '#333' },
    optionalText: { fontSize: 14, fontWeight: 'normal', color: '#888' },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
          fontSize: 18,
    color: '#333',
  },
  buttonError: {
    borderColor: '#ff4d4f',
    backgroundColor: '#fff2f0',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    marginTop: 4,
  },
});

export default DatePickerField;
