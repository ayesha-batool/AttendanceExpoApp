import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const EmployeeDetailsModal = ({ visible, employee, onClose }) => {
  if (!employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateTotalPay = () => {
    const baseSalary = parseFloat(employee.salary || 0);
    const overtimeRate = parseFloat(employee.overtimeRate || 0);
    const overtimeHours = parseFloat(employee.monthlyOvertimeHours || 0);
    const overtimePay = overtimeRate * overtimeHours;
    const totalAdvances = parseFloat(employee.totalAdvances || 0);
    
    return (baseSalary + overtimePay - totalAdvances).toFixed(2);
  };

  const renderSection = (title, data) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {data}
      </View>
    </View>
  );

  const renderField = (label, value, icon = null) => (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        {icon && <Ionicons name={icon} size={16} color="#007AFF" style={styles.fieldIcon} />}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
    </View>
  );

  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const renderDocument = (document, title, icon) => {
    if (!document) return null;
    
    return (
      <View style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <Ionicons name={icon} size={20} color="#007AFF" style={styles.documentIcon} />
          <Text style={styles.documentTitle}>{title}</Text>
        </View>
        {isImageFile(document.mimeType) ? (
          <View style={styles.documentImageContainer}>
            <RNImage
              source={{ uri: document.uri }}
              style={styles.documentImage}
            />
          </View>
        ) : (
          <View style={styles.documentInfo}>
            <Ionicons name="document" size={24} color="#6b7280" />
            <Text style={styles.documentName}>{document.name}</Text>
            <Text style={styles.documentSize}>{(document.size / 1024).toFixed(1)} KB</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        console.log('Modal onRequestClose triggered');
        if (onClose) {
          onClose();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1} 
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
          {/* Header */}
          <LinearGradient
            colors={['#007AFF', '#0056CC']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('Close button pressed');
                  if (onClose) {
                    onClose();
                  } else {
                    console.log('onClose function is not provided');
                  }
                }} 
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Employee Details</Text>
              <View style={styles.headerSpacer} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Employee Photo */}
            <View style={styles.photoSection}>
              {employee.photoUrl ? (
                <RNImage
                  source={{ uri: employee.photoUrl }}
                  style={styles.employeePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={48} color="#8E8E93" />
                  <Text style={styles.photoPlaceholderText}>No Photo</Text>
                </View>
              )}
              <Text style={styles.employeeName}>{employee.fullName || 'Unknown Officer'}</Text>
              <Text style={styles.employeeBadge}>Badge: {employee.badgeNumber || employee.employeeId || 'N/A'}</Text>
            </View>

            {/* Basic Information */}
            {renderSection('Basic Information', (
              <>
                {renderField('Badge Number', employee.badgeNumber || employee.employeeId, 'id-card')}
                {renderField('Full Name', employee.fullName, 'person')}
                {renderField("Father's Name", employee.fatherName, 'person')}
                {renderField('CNIC', employee.cnic, 'card')}
                {renderField('Date of Birth', formatDate(employee.dateOfBirth), 'calendar')}
                {renderField('Gender', employee.gender, 'male-female')}
              </>
            ))}

            {/* Contact Information */}
            {renderSection('Contact Information', (
              <>
                {renderField('Contact Number', employee.contactNumber || employee.phone, 'call')}
                {renderField('Email', employee.email, 'mail')}
                {renderField('Address', employee.address, 'location')}
              </>
            ))}

            {/* Employment Information */}
            {renderSection('Employment Information', (
              <>
                {renderField('Joining Date', formatDate(employee.joiningDate || employee.dateOfJoining), 'calendar')}
                {renderField('Department', employee.department, 'business')}
                {renderField('Rank', employee.rank, 'ribbon')}
                {renderField('Posting Station', employee.postingStation || employee.policeStation, 'location')}
                {renderField('Shift', employee.shift || employee.dutyShift, 'time')}
                {renderField('Employment Status', employee.employmentStatus || employee.status, 'checkmark-circle')}
                {renderField('Service Years', employee.serviceYears, 'time')}
                {renderField('Last Promotion Date', formatDate(employee.lastPromotionDate), 'trending-up')}
              </>
            ))}

            {/* Personal Information */}
            {renderSection('Personal Information', (
              <>
                {renderField('Blood Group', employee.bloodGroup, 'medical')}
                {renderField('Is Armed Officer', employee.isArmed ? 'Yes' : 'No', 'shield')}
                {renderField('Education Level', employee.education, 'school')}
                {renderField('Marital Status', employee.maritalStatus, 'heart')}
                {renderField('Spouse Name', employee.spouseName, 'person')}
                {renderField('Children', employee.children, 'people')}
                {renderField('Languages Known', employee.languages, 'language')}
                {renderField('Medical Conditions', employee.medicalConditions, 'medical')}
                {renderField('Allergies', employee.allergies, 'warning')}
              </>
            ))}

            {/* Professional Information */}
            {renderSection('Professional Information', (
              <>
                {renderField('Weapon License Number', employee.weaponLicenseNumber, 'shield')}
                {renderField('Driving License Number', employee.drivingLicenseNumber, 'car')}
                {renderField('Training Certifications', employee.trainingCertifications, 'library')}
                {renderField('Specializations', employee.specializations, 'star')}
                {renderField('Performance Rating', employee.performanceRating, 'star')}
                {renderField('Supervisor', employee.supervisor, 'person')}
                {renderField('Work Location', employee.workLocation, 'location')}
                {renderField('Vehicle Assigned', employee.vehicleAssigned, 'car')}
                {renderField('Equipment Assigned', employee.equipmentAssigned, 'construct')}
                {renderField('Last Evaluation Date', formatDate(employee.lastEvaluationDate), 'calendar')}
                {renderField('Disciplinary Actions', employee.disciplinaryActions, 'warning')}
              </>
            ))}

            {/* Payroll Information */}
            {renderSection('Payroll Information', (
              <>
                {renderField('Base Salary', employee.salary ? `$${employee.salary}` : 'Not specified', 'cash')}
                {renderField('Overtime Rate', employee.overtimeRate ? `$${employee.overtimeRate}/hour` : 'Not specified', 'time')}
                {renderField('Monthly Overtime Hours', employee.monthlyOvertimeHours, 'time')}
                {renderField('Total Advances', employee.totalAdvances ? `$${employee.totalAdvances}` : 'Not specified', 'card')}
                {renderField('Last Advance Date', formatDate(employee.lastAdvanceDate), 'calendar')}
                {renderField('Benefits', employee.benefits, 'gift')}
                {renderField('Allowances', employee.allowances, 'card')}
                {renderField('Total Pay (After Advances)', `$${calculateTotalPay()}`, 'calculator')}
              </>
            ))}

            {/* Emergency Contact */}
            {renderSection('Emergency Contact', (
              <>
                {renderField('Emergency Contact', employee.emergencyContact, 'call')}
                {renderField('Emergency Contact Phone', employee.emergencyContactPhone, 'call')}
              </>
            ))}

            {/* Documents */}
            {(employee.uploadedDocuments || employee.documents) && renderSection('Documents', (
              <View style={styles.documentsContainer}>
                {renderDocument(employee.uploadedDocuments?.cnicDocument || employee.documents?.cnicDocument, 'CNIC Document', 'id-card')}
                {renderDocument(employee.uploadedDocuments?.educationalCertificate || employee.documents?.educationalCertificate, 'Educational Certificate', 'school')}
                {renderDocument(employee.uploadedDocuments?.weaponLicense || employee.documents?.weaponLicense, 'Weapon License', 'shield')}
                {renderDocument(employee.uploadedDocuments?.drivingLicense || employee.documents?.drivingLicense, 'Driving License', 'car')}
                {renderDocument(employee.uploadedDocuments?.medicalCertificate || employee.documents?.medicalCertificate, 'Medical Certificate', 'medical')}
                {renderDocument(employee.uploadedDocuments?.trainingCertifications || employee.documents?.trainingCertifications, 'Training Certifications', 'library')}
                {renderDocument(employee.uploadedDocuments?.employmentContract || employee.documents?.employmentContract, 'Employment Contract', 'document-text')}
                {renderDocument(employee.uploadedDocuments?.receipt || employee.documents?.receipt, 'Receipt', 'receipt')}
              </View>
            ))}

            {/* Notes */}
            {employee.notes && renderSection('Notes', (
              <Text style={styles.notesText}>{employee.notes}</Text>
            ))}
                     </ScrollView>
           </TouchableOpacity>
         </TouchableOpacity>
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
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    width: '95%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  employeePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  employeeBadge: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingBottom: 8,
  },
  sectionContent: {
    gap: 12,
  },
  field: {
    marginBottom: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 24,
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Document styles
  documentsContainer: {
    gap: 16,
  },
  documentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    marginRight: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  documentImageContainer: {
    alignItems: 'center',
  },
  documentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  documentName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  documentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
});

export default EmployeeDetailsModal;
