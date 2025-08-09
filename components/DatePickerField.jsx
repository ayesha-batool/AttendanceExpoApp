// components/DatePickerField.js
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DatePickerField = ({ label, mode = 'date', value, onChange, optional = false }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!(date instanceof Date)) return 'Select Date';

    return mode === 'time'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();
  };


  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </Text>
      )}
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>{formatDate(value)}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value}
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
  label: { marginBottom: 4, fontSize: 14, fontWeight: '600', color: '#333' },
  optionalText: { fontSize: 12, fontWeight: 'normal', color: '#888' },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default DatePickerField;
