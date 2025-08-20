import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SummaryCard = ({ title, value, icon, color = "#667eea" }) => {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.summaryValue}>{String(value || '0')}</Text>
      <Text style={styles.summaryTitle}>{String(title || '')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 4,
    elevation: 3,
  },
  summaryCardGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
    
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default SummaryCard; 