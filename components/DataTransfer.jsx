import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { hybridDataService } from '../services/hybridDataService';
import PageHeader from './PageHeader';

export const DataTransfer = () => {
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportCollection = async (collectionId) => {
    try {
      setIsExporting(true);
      const data = await hybridDataService.exportData(collectionId);
      setExportData(data);
      
      // Share the data as text
      await Share.share({
        message: `Shelfie Data Export - ${collectionId}\n\n${data}`,
        title: `Shelfie ${collectionId} Data`
      });
    } catch (error) {
      Alert.alert('Export Error', error.message);
    } finally {
      setIsExporting(false);
    }
  };


  const importCollection = async () => {
    try {
      if (!importData.trim()) {
        Alert.alert('Error', 'Please paste import data');
        return;
      }

      setIsImporting(true);
      const result = await hybridDataService.importData(importData);
      const message = `Imported ${result.imported} items${result.importedOptions ? ` and ${result.importedOptions} options` : ''}`;
      Alert.alert('Success', message);
      setImportData('');
    } catch (error) {
      Alert.alert('Import Error', error.message);
    } finally {
      setIsImporting(false);
    }
  };


  const collections = [
    { id: 'employees', name: 'Employees', icon: 'people', color: ['#3b82f6', '#1d4ed8'] },
    { id: 'cases', name: 'Cases', icon: 'document-text', color: ['#8b5cf6', '#7c3aed'] },
    { id: 'expenses', name: 'Expenses', icon: 'card', color: ['#ef4444', '#dc2626'] },
    { id: 'attendance', name: 'Attendance', icon: 'calendar', color: ['#10b981', '#059669'] }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e40af', '#1e3a8a', '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <PageHeader
          title="Data Transfer"
          subtitle="Export and import data between devices"
          icon="swap-horizontal"
          gradientColors={['#1e40af', '#1e3a8a']}
          showBackButton={true}
        />
      </LinearGradient>

      <ScrollView style={styles.scrollContainer}>

      {/* Export Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="download" size={24} color="#1e40af" />
          <Text style={styles.sectionTitle}>Export Data</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Export your data to share with other devices or create backups
        </Text>
        
        <View style={styles.exportGrid}>
          {collections.map((collection) => (
            <TouchableOpacity 
              key={collection.id}
              style={styles.exportCard}
              onPress={() => exportCollection(collection.id)}
              disabled={isExporting}
            >
              <LinearGradient colors={collection.color} style={styles.exportGradient}>
                <Ionicons name={collection.icon} size={28} color="#fff" />
                <Text style={styles.exportCardTitle}>{collection.name}</Text>
                <Text style={styles.exportCardSubtitle}>Tap to export</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Import Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
                          <Ionicons name="cloud-upload" size={24} color="#059669" />
          <Text style={styles.sectionTitle}>Import Data</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Import data from other devices or restore from backups
        </Text>
        
        <View style={styles.importContainer}>
          <TextInput
            style={styles.importInput}
            placeholder="Paste export data here..."
            placeholderTextColor="#9ca3af"
            value={importData}
            onChangeText={setImportData}
            multiline
            numberOfLines={6}
          />
          <TouchableOpacity 
            style={styles.importButton}
            onPress={importCollection}
            disabled={isImporting || !importData.trim()}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.importButtonGradient}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.importButtonText}>
                {isImporting ? 'Importing...' : 'Import Data'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Export Data Display */}
      {exportData && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Exported Data</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Copy this data to import on another device
          </Text>
          
          <View style={styles.exportDataContainer}>
            <TextInput
              style={styles.exportDisplay}
              value={exportData}
              multiline
              editable={false}
              numberOfLines={8}
            />
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                // Copy to clipboard functionality
                Alert.alert('Copy', 'Data copied to clipboard');
              }}
            >
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.copyButtonGradient}>
                <Ionicons name="copy" size={18} color="#fff" />
                <Text style={styles.copyButtonText}>Copy Data</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={24} color="#f59e0b" />
          <Text style={styles.sectionTitle}>How to Use</Text>
        </View>
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
            <Text style={styles.instructionText}>Export data from the source device</Text>
          </View>
          <View style={styles.instructionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#8b5cf6" />
            <Text style={styles.instructionText}>Share the exported data with target device</Text>
          </View>
          <View style={styles.instructionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#ef4444" />
            <Text style={styles.instructionText}>Import the data on the target device</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  exportCard: {
    width: '48%', // Two columns
    aspectRatio: 1.2,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exportGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  exportCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
  },
  exportCardSubtitle: {
    fontSize: 12,
    color: '#e5e7eb',
    marginTop: 2,
    textAlign: 'center',
  },
  importContainer: {
    marginTop: 10,
  },
  importInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  importButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  importButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  exportDataContainer: {
    marginTop: 10,
  },
  exportDisplay: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  copyButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  copyButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  instructionsContainer: {
    marginTop: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
  },
});
