import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CaseDetailsModal = ({ visible, caseData, onClose }) => {
  if (!caseData) return null;

  const getStatusColor = (status) => ({
    active: '#10b981',
    pending: '#f59e0b',
    closed: '#6b7280',
    archived: '#9ca3af'
  }[status] || '#6b7280');

  const getPriorityColor = (priority) => ({
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  }[priority] || '#6b7280');

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#1e40af', '#1e3a8a']}
            style={styles.modalHeader}
          >
            <View style={styles.headerContent}>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.modalTitle}>Case Details</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Case Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Case Title</Text>
              <Text style={styles.caseTitle}>{caseData.title || 'No title'}</Text>
            </View>

            {/* Status and Priority */}
            <View style={styles.row}>
              <View style={styles.halfSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseData.status) }]}>
                  <Text style={styles.statusText}>{caseData.status || 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.halfSection}>
                <Text style={styles.sectionTitle}>Priority</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(caseData.priority) }]}>
                  <Text style={styles.priorityText}>{caseData.priority || 'Unknown'}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            {caseData.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{caseData.description}</Text>
              </View>
            )}

            {/* Category */}
            {caseData.category && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Text style={styles.categoryText}>{caseData.category}</Text>
              </View>
            )}

            {/* Location */}
            {caseData.location && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.locationText}>{caseData.location}</Text>
              </View>
            )}

            {/* Dates */}
            <View style={styles.row}>
              <View style={styles.halfSection}>
                <Text style={styles.sectionTitle}>Start Date</Text>
                <Text style={styles.dateText}>{formatDate(caseData.startDate)}</Text>
              </View>
              <View style={styles.halfSection}>
                <Text style={styles.sectionTitle}>End Date</Text>
                <Text style={styles.dateText}>{formatDate(caseData.endDate)}</Text>
              </View>
            </View>

            {/* Evidence */}
            {caseData.evidence && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Evidence</Text>
                <Text style={styles.evidenceText}>{caseData.evidence}</Text>
              </View>
            )}

            {/* Notes */}
            {caseData.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{caseData.notes}</Text>
              </View>
            )}

            {/* Assigned Officer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assigned Officer</Text>
              <Text style={styles.assignedOfficerText}>
                {caseData.assignedOfficer || 'Unassigned'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6b7280', '#4b5563']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfSection: {
    flex: 0.48,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  categoryText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  evidenceText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  assignedOfficerText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeModalButton: {
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CaseDetailsModal;
