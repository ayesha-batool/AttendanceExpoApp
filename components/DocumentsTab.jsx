import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FeatureCard from './FeatureCard';

const DocumentsTab = ({ documentOptions, onDocumentPress }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📄 Document Management</Text>
        <Text style={styles.sectionSubtitle}>Manage employee documents and certificates</Text>
      </View>
      
      <View style={styles.documentCategories}>
        {documentOptions.map((doc) => (
          <FeatureCard
            key={doc.id}
            icon={doc.icon}
            label={doc.name}
            subtitle="0 documents"
            onPress={() => onDocumentPress(doc)}
            iconColor="#667eea"
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
  documentCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
});

export default DocumentsTab; 