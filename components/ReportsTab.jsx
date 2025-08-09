import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FeatureCard from './FeatureCard';

const ReportsTab = ({ onReportPress }) => {
  const reports = [
    {
      id: 'performance',
      icon: 'bar-chart',
      label: 'Employee Performance',
      subtitle: 'View detailed reports',
      color: '#667eea'
    },
    {
      id: 'department',
      icon: 'pie-chart',
      label: 'Department Stats',
      subtitle: 'Department-wise analysis',
      color: '#f093fb'
    },
    {
      id: 'attendance',
      icon: 'calendar',
      label: 'Attendance Report',
      subtitle: 'Monthly attendance data',
      color: '#f5576c'
    },
    {
      id: 'payroll',
      icon: 'cash',
      label: 'Payroll Report',
      subtitle: 'Salary and payment reports',
      color: '#10b981'
    }
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Reports & Analytics</Text>
        <Text style={styles.sectionSubtitle}>View employee statistics and reports</Text>
      </View>
      
      <View style={styles.reportCards}>
        {reports.map((report) => (
          <FeatureCard
            key={report.id}
            icon={report.icon}
            label={report.label}
            subtitle={report.subtitle}
            onPress={() => onReportPress(report)}
            iconColor={report.color}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  reportCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
});

export default ReportsTab; 