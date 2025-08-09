import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FeatureCard = ({ icon, label, subtitle, onPress, iconColor = "#667eea" }) => {
  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <Icon name={icon} size={32} color={iconColor} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureSubtext}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  featureCard: {
    width: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor:"red"
  },
  featureLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  featureSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
});

export default FeatureCard; 