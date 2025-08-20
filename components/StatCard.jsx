import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const StatCard = ({ icon, label, value, iconColor = "#667eea" }) => {
  return (
    <View style={styles.statCard}>
              <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={styles.statLabel}>{String(label || '')}</Text>
      <Text style={styles.statValue}>{String(value || '0')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    width: '22%',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 6,
    marginVertical: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 50,
  },
  statLabel: {
    fontSize: 9,
    color: '#6c757d',
    marginTop: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 1,
  },
});

export default StatCard; 