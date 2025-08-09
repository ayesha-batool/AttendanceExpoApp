import React, { useEffect, useState } from 'react';
import { Picker, StyleSheet, Text, TextInput, View } from 'react-native';

const countries = [
  { name: 'Pakistan', code: '92', flag: '🇵🇰' },
  { name: 'India', code: '91', flag: '🇮🇳' },
  { name: 'United States', code: '1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '44', flag: '🇬🇧' },
  { name: 'Saudi Arabia', code: '966', flag: '🇸🇦' },
  { name: 'China', code: '86', flag: '🇨🇳' },
  { name: 'Germany', code: '49', flag: '🇩🇪' },
  { name: 'France', code: '33', flag: '🇫🇷' },
  { name: 'UAE', code: '971', flag: '🇦🇪' },
];

const PhoneNumberField = ({
  label = 'Phone Number',
  optional = false,
  value,
  onChange = () => { },
  error = null,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [localNumber, setLocalNumber] = useState('');

  // Sync local number with full value
  useEffect(() => {
    if (value?.startsWith(`+${selectedCountry.code}`)) {
      const stripped = value.replace(`+${selectedCountry.code}`, '');
      setLocalNumber(stripped);
    }
  }, [value, selectedCountry]);

  const handlePhoneChange = (text) => {
    setLocalNumber(text);
    onChange(`+${selectedCountry.code}${text}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {optional && <Text style={styles.optional}>(optional)</Text>}
      </Text>

      <View style={[styles.inputWrapper, error && { borderColor: '#ff4d4f' }]}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCountry.code}
            onValueChange={(itemValue) => {
              const country = countries.find((c) => c.code === itemValue);
              setSelectedCountry(country);
              onChange(`+${itemValue}${localNumber}`);
            }}
            style={styles.picker}
            mode="dropdown"
          >
            {countries.map((country) => (
              <Picker.Item
                key={country.code}
                label={`${country.flag} +${country.code}`}
                value={country.code}
              />
            ))}
          </Picker>
        </View>

        <TextInput
          value={localNumber}
          onChangeText={handlePhoneChange}
          placeholder="Enter number"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
          style={styles.input}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optional: {
    fontSize: 12,
    color: '#999',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerContainer: {
    width: 85,
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    borderWidth: 0,
    paddingHorizontal: 8,
    color: '#333',
  },
  input: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderLeftWidth: 1,
    fontSize: 16,
    borderColor: '#ccc',
    color: '#333',

  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 13,
    marginTop: 6,
    paddingLeft: 4,
  },
});


export default PhoneNumberField;


