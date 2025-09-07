import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { getPlatformLocationAdvice } from '../utils/geocoding';

const GPSAccuracyInfo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.title}>GPS Accuracy Information</Text>
      </View>
      
      <Text style={styles.description}>
        GPS coordinates may vary slightly even when stationary due to:
      </Text>
      
      <View style={styles.factorsList}>
        <View style={styles.factor}>
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text style={styles.factorText}>GPS signal interference from buildings</Text>
        </View>
        
        <View style={styles.factor}>
          <Ionicons name="cloud" size={16} color="#6b7280" />
          <Text style={styles.factorText}>Weather conditions and atmospheric effects</Text>
        </View>
        
        <View style={styles.factor}>
          <Ionicons name="cellular" size={16} color="#6b7280" />
          <Text style={styles.factorText}>Satellite positioning and signal quality</Text>
        </View>
        
        <View style={styles.factor}>
          <Ionicons name="phone-portrait" size={16} color="#6b7280" />
          <Text style={styles.factorText}>Device GPS chip accuracy (±3-10 meters)</Text>
        </View>
      </View>
      
      <View style={styles.accuracyInfo}>
        <Text style={styles.accuracyTitle}>Typical GPS Accuracy:</Text>
        <Text style={styles.accuracyText}>• Outdoor: ±3-5 meters</Text>
        <Text style={styles.accuracyText}>• Urban: ±10-20 meters</Text>
        <Text style={styles.accuracyText}>• Indoor: ±20-50 meters</Text>
      </View>
      
      <Text style={styles.note}>
        Our app uses high-accuracy GPS settings and multiple readings to minimize variations.
      </Text>
      
      <View style={styles.platformInfo}>
        <Text style={styles.platformTitle}>Platform: {Platform.OS.toUpperCase()}</Text>
        <Text style={styles.platformAdvice}>
          {getPlatformLocationAdvice()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  factorsList: {
    marginBottom: 12,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  accuracyInfo: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  accuracyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 13,
    color: '#0c4a6e',
    marginBottom: 2,
  },
  note: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  platformInfo: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  platformTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  platformAdvice: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
});

export default GPSAccuracyInfo;
