import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import {
    Alert,
    Modal,
    Image as RNImage,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const ExpenseDetailsModal = ({ visible, expense, onClose, onEdit, onDelete }) => {
  if (!expense) return null;

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
    const extension = filePath.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(extension);
  };

  const handleOpenReceipt = async () => {
    try {
      if (!expense.receipt) {
        Alert.alert('No Receipt', 'No receipt file is attached to this expense.');
        return;
      }

      const receiptUrl = expense.receipt;

      // Check if it's a URL (web link)
      if (receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://')) {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        } else {
          Alert.alert('Error', 'Cannot open this type of file.');
        }
        return;
      }

      // Check if it's a local file path
      if (receiptUrl.startsWith('file://')) {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        } else {
          Alert.alert('Error', 'Cannot open this type of file.');
        }
        return;
      }

      // For other file paths, try to open them directly
      const supported = await Linking.canOpenURL(receiptUrl);
      if (supported) {
        await Linking.openURL(receiptUrl);
      } else {
        // If direct opening fails, show file info
        Alert.alert(
          'File Information',
          `File: ${receiptUrl.split('/').pop()}\nType: ${getFileType(receiptUrl)}\n\nThis file type may not be supported for direct opening.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }

    } catch (error) {
      console.error('Error opening receipt:', error);
      Alert.alert('Error', 'Failed to open receipt file. Please try again.');
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
            <Text style={styles.modalTitle}>Expense Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Expense Header */}
            <View style={styles.expenseHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(expense.category) }]}>
                <Ionicons name={getCategoryIcon(expense.category)} size={24} color="#fff" />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseCategory}>
                  {expense.category?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                ${parseFloat(expense.amount || 0).toLocaleString()}
              </Text>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(expense.date).toLocaleDateString()}
                </Text>
              </View>

              {expense.department && (
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Department:</Text>
                  <Text style={styles.detailValue}>{expense.department}</Text>
                </View>
              )}

              {expense.description && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{expense.description}</Text>
                </View>
              )}

              {expense.receipt && (
                <View style={styles.receiptSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="receipt" size={16} color="#6b7280" />
                    <Text style={styles.detailLabel}>Receipt:</Text>
                  </View>
                  
                  {/* Show image preview if it's an image file */}
                  {isImageFile(expense.receipt) && !expense.receipt.startsWith('data:') ? (
                    <View style={styles.receiptImageContainer}>
                      <RNImage
                        source={{ uri: expense.receipt }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                        <View style={styles.receiptButtonContent}>
                          <Ionicons name="open-outline" size={20} color="#3b82f6" />
                          <Text style={styles.receiptButtonText}>Open Receipt</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.receiptButton} onPress={handleOpenReceipt}>
                      <View style={styles.receiptButtonContent}>
                        <Ionicons name="document-text" size={20} color="#3b82f6" />
                        <View style={styles.receiptInfo}>
                          <Text style={styles.receiptFileName}>
                            {expense.receipt.split('/').pop() || 'Receipt File'}
                          </Text>
                          <Text style={styles.receiptFileType}>
                            {getFileType(expense.receipt)}
                          </Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#3b82f6" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Additional Info */}
            {expense.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{expense.notes}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash" size={20} color="#fff" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  receiptSection: {
    marginTop: 8,
  },
  receiptButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  receiptButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiptFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  receiptFileType: {
    fontSize: 12,
    color: '#6b7280',
  },
  receiptLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  receiptImageContainer: {
    marginTop: 8,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExpenseDetailsModal; 