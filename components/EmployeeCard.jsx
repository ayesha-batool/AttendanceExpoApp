import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image as RNImage, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EmployeeCard = ({ 
  employee, 
  onPress, 
  onEdit, 
  onDelete, 
  onToggleStatus
}) => {
  const isActive = employee.status?.toLowerCase() !== 'inactive';
  
  const getDepartmentColor = (department) => {
    const colors = {
      'Traffic': '#FF9500',
      'Investigation': '#AF52DE',
      'Patrol': '#34C759',
      'Special Ops': '#FF3B30',
      'Administration': '#007AFF',
      'Cyber Crime': '#5856D6',
      'Narcotics': '#FF2D92',
      'Forensic': '#8E8E93'
    };
    return colors[department] || '#6c757d';
  };

  const getStatusColor = (status) => {
    return status?.toLowerCase() === 'active' ? '#34C759' : '#FF9500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.employeeCard,
        !isActive && styles.inactiveEmployeeCard
      ]}
      onPress={() => onPress(employee)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isActive ? ['#fff', '#f8f9fa'] : ['#f8f9fa', '#e9ecef']}
        style={styles.employeeCardGradient}
      >


        <View style={styles.employeeInfo}>
          {/* Avatar */}
          {employee.photoUrl ? (
            <RNImage 
              source={{ uri: employee.photoUrl }} 
              style={styles.employeeAvatar}
            />
          ) : (
            <LinearGradient
              colors={isActive ? ['#667eea', '#764ba2'] : ['#6c757d', '#495057']}
              style={styles.employeeAvatar}
            >
              <Ionicons name="person" size={16} color="#fff" />
            </LinearGradient>
          )}

          {/* Employee Details */}
          <View style={styles.employeeDetails}>
            <View style={styles.nameRow}>
              <Text style={[
                styles.employeeName,
                !isActive && styles.inactiveEmployeeName
              ]}>
                {employee.fullName || "No Name"}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status) }]}>
                <Text style={styles.statusBadgeText}>
                  {employee.status || 'Unknown'}
                </Text>
              </View>
            </View>

            <Text style={[
              styles.employeeId,
              !isActive && styles.inactiveEmployeeText
            ]}>
              ID: {employee.employeeId || employee.policeId || 'N/A'}
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="business" size={12} color="#6c757d" />
                <Text style={[
                  styles.infoText,
                  !isActive && styles.inactiveEmployeeText
                ]}>
                  {employee.department || 'No Department'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="shield" size={12} color="#6c757d" />
                <Text style={[
                  styles.infoText,
                  !isActive && styles.inactiveEmployeeText
                ]}>
                  {employee.rank || 'No Rank'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="call" size={12} color="#6c757d" />
                <Text style={[
                  styles.infoText,
                  !isActive && styles.inactiveEmployeeText
                ]}>
                  {employee.phone || 'No Phone'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={12} color="#6c757d" />
                <Text style={[
                  styles.infoText,
                  !isActive && styles.inactiveEmployeeText
                ]}>
                  Joined: {formatDate(employee.dateOfJoining)}
                </Text>
              </View>
            </View>

            {/* Department Color Indicator */}
            {employee.department && (
              <View style={[styles.departmentIndicator, { backgroundColor: getDepartmentColor(employee.department) }]} />
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => onToggleStatus(employee)}
            style={[
              styles.actionButton,
              isActive ? styles.deactivateBtn : styles.activateBtn
            ]}
          >
            <Ionicons 
              name={isActive ? "pause-circle-outline" : "play-circle-outline"} 
              size={16} 
              color={isActive ? "#f59e0b" : "#10b981"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onEdit(employee)}
            style={[styles.actionButton, styles.editBtn]}
          >
            <Ionicons name="pencil-outline" size={16} color="#667eea" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(employee)}
            style={[styles.actionButton, styles.deleteBtn]}
          >
            <Ionicons name="trash-outline" size={16} color="#f5576c" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  employeeCard: {
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveEmployeeCard: {
    opacity: 0.7,
  },
  employeeCardGradient: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
   
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',

  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 30
  },
  employeeDetails: {
    flex: 1,
    position: 'relative',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  inactiveEmployeeName: {
    color: '#6c757d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  employeeId: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  inactiveEmployeeText: {
    color: '#adb5bd',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  departmentIndicator: {
    position: 'absolute',
    left: -16,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activateBtn: {
    backgroundColor: '#d1fae5',
  },
  deactivateBtn: {
    backgroundColor: '#fef3c7',
  },
  editBtn: {
    backgroundColor: '#e0e7ff',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
  },
});

export default EmployeeCard; 