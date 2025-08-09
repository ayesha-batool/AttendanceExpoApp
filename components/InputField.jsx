// components/InputField.js
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  optional = false,
  error,
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = 'center',
  style,
  isAmount = false,
}) => {
  const handleAmountChange = (text) => {
    if (isAmount) {
      // Remove all non-numeric characters except decimal point
      const cleaned = text.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = cleaned.split('.');
      if (parts.length > 2) return;
      
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) return;
      
      // Check if value exceeds 1 trillion
      const numValue = parseFloat(cleaned);
      if (numValue > 1000000000000) return;
      
      onChangeText(cleaned);
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={handleAmountChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={textAlignVertical}
        style={[
          styles.input,
          multiline && styles.textarea,
          error && styles.errorInput,
          style,
        ]}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333' 
  },
  optionalText: { 
    fontSize: 12, 
    fontWeight: 'normal', 
    color: '#888' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20,
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
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InputField;
