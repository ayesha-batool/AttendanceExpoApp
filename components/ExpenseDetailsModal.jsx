import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import {
    Modal,
    Image as RNImage,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const ExpenseDetailsModal = ({ visible, expense, onClose, onEdit, onDelete }) => {
  // Safety checks to prevent crashes
  if (!expense || !visible || typeof expense !== 'object') return null;
  
  // Ensure required props are functions
  if (typeof onClose !== 'function' || typeof onEdit !== 'function' || typeof onDelete !== 'function') {
    return null;
  }

  const getCategoryColor = (category) => {
    const colors = {
      fuel: '#f59e0b',
      equipment: '#3b82f6',
      training: '#8b5cf6',
      maintenance: '#ef4444',
      office_supplies: '#10b981',
      travel: '#06b6d4',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fuel: 'car',
      equipment: 'construct',
      training: 'school',
      maintenance: 'build',
      office_supplies: 'document',
      travel: 'airplane',
      other: 'ellipsis-horizontal'
    };
    return icons[category] || 'ellipsis-horizontal';
  };

  const getFileType = (filePath) => {
    if (!filePath || typeof filePath !== 'string') return 'File';
    const extension = filePath.split('.').pop()?.toLowerCase();
    const fileTypes = {
      'pdf': 'PDF Document',
      'jpg': 'JPEG Image',
      'jpeg': 'JPEG Image',
      'png': 'PNG Image',
      'gif': 'GIF Image',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'txt': 'Text File'
    };
    return fileTypes[extension] || 'File';
  };

  const isImageFile = (filePath) => {
    if (!filePath || typeof filePath !== 'string') return false;
    const extension = filePath.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(extension);
  };

  const handleOpenReceipt = async () => {
    try {
      if (!expense.receipt || typeof expense.receipt !== 'string') {
        return;
      }

      const receiptUrl = expense.receipt;

      // Check if it's a URL (web link)
      if (receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://')) {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        } else {
          // Try to open in browser
          await Linking.openURL(receiptUrl);
        }
        return;
      }

      // Check if it's a local file path
      if (receiptUrl.startsWith('file://')) {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        }
        return;
      }

      // For other file paths, try to open them directly
      try {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        }
      } catch (linkError) {
        // If direct linking fails, try to construct a file:// URL
        const fileUrl = `file://${receiptUrl}`;
        await Linking.openURL(fileUrl);
      }

    } catch (error) {
      console.error('Failed to open receipt:', error);
      // You could show an alert here to inform the user
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
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(expense.category) }]}>
                <Ionicons name={getCategoryIcon(expense.category)} size={20} color="#fff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Expense Details</Text>
                <Text style={styles.expenseSubtitle}>
                  {(expense.category || 'other')?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Expense Amount Card */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>
                ${(parseFloat(expense.amount || 0) || 0).toLocaleString()}
              </Text>
            </View>

            {/* Expense Title */}
            <View style={styles.titleSection}>
              <Text style={styles.expenseTitle}>{String(expense.title || 'Untitled Expense')}</Text>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={18} color="#8b5cf6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                    {expense.date ? new Date(expense.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'No date specified'}
                </Text>
                </View>
              </View>

              {expense.department && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="business" size={18} color="#06b6d4" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Department</Text>
                    <Text style={styles.detailValue}>{String(expense.department)}</Text>
                  </View>
                </View>
              )}

              {expense.description && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="document-text" size={18} color="#10b981" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{String(expense.description)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Receipt Section */}
              {expense.receipt && (
                <View style={styles.receiptSection}>
                <Text style={styles.sectionTitle}>Receipt</Text>
                  
                  {/* Show image preview if it's an image file */}
                  {isImageFile(expense.receipt) && expense.receipt && !expense.receipt.startsWith('data:') ? (
                    <View style={styles.receiptImageContainer}>
                      <RNImage
                        source={{ uri: expense.receipt }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                        onError={() => {
                          // Handle image loading errors silently
                        }}
                      />
                      <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                        <View style={styles.receiptButtonContent}>
                        <Ionicons name="open-outline" size={18} color="#3b82f6" />
                          <Text style={styles.receiptButtonText}>Open Receipt</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                      <View style={styles.receiptButtonContent}>
                      <Ionicons name="document-text" size={18} color="#3b82f6" />
                        <View style={styles.receiptInfo}>
                          <Text style={styles.receiptFileName}>
                            {expense.receipt && typeof expense.receipt === 'string' ? expense.receipt.split('/').pop() || 'Receipt File' : 'Receipt File'}
                          </Text>
                          <Text style={styles.receiptFileType}>
                            {getFileType(expense.receipt)}
                          </Text>
                        </View>
                      <Ionicons name="open-outline" size={18} color="#3b82f6" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

            {/* Notes Section */}
            {expense.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <View style={styles.notesCard}>
                  <Text style={styles.notesText}>{String(expense.notes)}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="create" size={18} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '92%',
    maxHeight: '90%',
    minHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  modalBody: {
    flex: 1,
    padding: 24,
    paddingBottom: 20,
  },
  amountCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#059669',
  },
  titleSection: {
    marginBottom: 24,
  },
  expenseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 28,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
  },
  receiptSection: {
    marginBottom: 24,
  },
  receiptButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 16,
  },
  receiptFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  receiptFileType: {
    fontSize: 14,
    color: '#64748b',
  },
  receiptImageContainer: {
    marginTop: 8,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  receiptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 12,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExpenseDetailsModal; 