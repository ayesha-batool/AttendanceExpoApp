import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const PhoneInputField = ({
  label,
  value,
  onChangeText,
  placeholder = "3001234567",
  optional = false,
  error,
  style,
  disabled = false,
}) => {
  const handlePhoneChange = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits (Pakistani mobile number format)
    if (cleaned.length <= 10) {
      onChangeText(cleaned);
    }
  };

  const formatDisplayValue = (phoneNumber) => {
    if (!phoneNumber) return '';
    return `+92 ${phoneNumber}`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </Text>
      )}
      <View style={styles.inputContainer}>
        <View style={styles.prefixContainer}>
          <Text style={styles.prefixText}>+92</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          editable={!disabled}
          style={[
            styles.input,
            error && styles.errorInput,
            style,
          ]}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{String(error)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginTop: 8,
    marginBottom: 16,
  },
  label: { 
    marginBottom: 4, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  optionalText: { 
    fontSize: 14, 
    fontWeight: 'normal', 
    color: '#888' 
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  prefixContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  errorInput: {
    borderColor: '#dc3545',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  errorContainer: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PhoneInputField;
