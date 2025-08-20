import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
          {/* {employee.photoUrl ? (
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
          )} */}

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

             {/* {employee.department && (
              <View style={[styles.departmentIndicator, { backgroundColor: getDepartmentColor(employee.department) }]} />
            )} */}
          </View>
        </View>

        {/* Action Buttons */}
      
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  employeeCard: {
    marginBottom: 12,
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.06,
    boxShadowRadius: 20,
    elevation: 3,
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#fff',
 
  },
  inactiveEmployeeCard: {
    opacity: 0.6,
  },
  employeeCardGradient: {
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 6,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 2,
    elevation: 1,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginRight: 12

  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.08,
    boxShadowRadius: 2,
    elevation: 1,
 
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
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginBottom: 3,
  },
  inactiveEmployeeName: {
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.08,
    boxShadowRadius: 1,
    elevation: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  employeeId: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  inactiveEmployeeText: {
    color: '#94a3b8',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    minWidth: '45%',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 5,
    fontWeight: '500',
  },
  departmentIndicator: {
    position: 'absolute',
    left: -16,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginHorizontal: 5
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
 
    marginHorizontal:12,
    gap: 8,
 
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 2,
    elevation: 1,
  },
  activateBtn: {
    backgroundColor: '#dcfce7',
  },
  deactivateBtn: {
    backgroundColor: '#fef3c7',
  },
  editBtn: {
    backgroundColor: '#dbeafe',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
  },
});

export default EmployeeCard; 