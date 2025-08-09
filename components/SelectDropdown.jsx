import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AddNewOptionModal from './AddNewOptionModal';

const SelectDropdown = ({
  label,
  selectedValue,
  onValueChange,
  options = [],
  optional = false,
  error = null,
  icon = null,
  style = {},
  fieldName = null,
  fieldLabel = null,
  onOptionAdded = null,
  showAddNewOption = true,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddNewOption = () => {
    if (fieldName && fieldLabel) {
      setShowAddModal(true);
    }
  };

  const handleOptionAdded = (newOption) => {
    if (onOptionAdded) {
      onOptionAdded(newOption);
    }
  };

  // Add "Add New Option" to the options list if enabled
  const displayOptions = showAddNewOption && fieldName && fieldLabel 
    ? [...options, { label: `+ Add New ${fieldLabel}`, value: 'add_new_option' }]
    : options;

  const handleValueChange = (value) => {
    if (value === 'add_new_option') {
      handleAddNewOption();
    } else {
      onValueChange(value);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          {icon && <Ionicons name={icon} size={16} color="#667eea" style={styles.labelIcon} />}
          <Text style={styles.label}>
            {label} {optional && <Text style={styles.optionalText}>(optional)</Text>}
          </Text>
        </View>
      )}

      <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={handleValueChange}
          style={styles.picker}
        >
          <Picker.Item label="Select" value="" />
          {displayOptions.map((item, index) => {
            const key = typeof item === 'string' ? item : (item.value || `option_${index}`);
            const isAddNewOption = item.value === 'add_new_option';
            
            return typeof item === 'string' ? (
              <Picker.Item 
                key={key} 
                label={item} 
                value={item}
                color={isAddNewOption ? '#3b82f6' : '#000'}
              />
            ) : (
              <Picker.Item 
                key={key} 
                label={item.label} 
                value={item.value}
                color={isAddNewOption ? '#3b82f6' : '#000'}
              />
            );
          })}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Add New Option Modal */}
      {fieldName && fieldLabel && (
        <AddNewOptionModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleOptionAdded}
          fieldName={fieldName}
          fieldLabel={fieldLabel}
          existingOptions={options}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  optionalText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerContainerError: {
    borderColor: '#ff4d4f',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
  },
  errorText: {
    marginTop: 4,
    color: '#ff4d4f',
    fontSize: 13,
    paddingLeft: 4,
  },
});

export default SelectDropdown;
