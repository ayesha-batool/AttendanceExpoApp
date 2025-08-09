import React from 'react';
import {
    Image as RNImage,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const EmployeeContainer = ({ 
  employee, 
  onPress, 
  onEdit, 
  onDelete, 
  showActions = true,
  showStatus = true 
}) => {
  // Add null check for employee
  if (!employee) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={24} color="#fff" />
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>Officer data not available</Text>
            <Text style={styles.badgeNumber}>Badge: N/A</Text>
          </View>
        </View>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#34C759';
      case 'inactive':
        return '#FF3B30';
      case 'suspended':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'checkmark-circle';
      case 'inactive':
        return 'close-circle';
      case 'suspended':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getDepartmentColor = (department) => {
    switch (department?.toLowerCase()) {
      case 'traffic':
        return '#FF9500';
      case 'investigation':
        return '#AF52DE';
      case 'patrol':
        return '#34C759';
      case 'special ops':
        return '#FF3B30';
      case 'administration':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  // Safe access to employee properties with fallbacks
  const officerName = employee.fullName || employee.name || employee.employeeName || 'Unknown Officer';
  const badgeNumber = employee.employeeId || employee.badgeNumber || 'N/A';
  const department = employee.department || 'Department';
  const rank = employee.rank || '';
  const policeStation = employee.policeStation || '';
  const phone = employee.phone || '';
  const status = employee.status || 'active';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Officer Avatar */}
        <View style={styles.avatarContainer}>
          {employee.photoUrl ? (
            <RNImage 
              source={{ uri: employee.photoUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={24} color="#fff" />
            </View>
          )}
          
          {/* Status Indicator */}
          {showStatus && (
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]}>
              <Icon 
                name={getStatusIcon(status)} 
                size={8} 
                color="#fff" 
              />
            </View>
          )}
        </View>

        {/* Officer Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {officerName}
          </Text>
          
          <Text style={styles.badgeNumber}>
            Badge: {badgeNumber}
          </Text>
          
          <View style={styles.departmentContainer}>
            <View style={[styles.departmentBadge, { backgroundColor: getDepartmentColor(department) }]}>
              <Text style={styles.departmentText}>
                {department}
              </Text>
            </View>
            
            {rank && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>
                  {rank}
                </Text>
              </View>
            )}
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            {policeStation && (
              <Text style={styles.stationText}>
                📍 {policeStation}
              </Text>
            )}
            
            {phone && (
              <Text style={styles.phoneText}>
                📞 {phone}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit && onEdit(employee)}
            >
              <Icon name="create-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete && onDelete(employee)}
            >
              <Icon name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Duty Status (if available) */}
      {employee.dutyStatus && (
        <View style={styles.dutyStatusContainer}>
          <Icon 
            name={employee.dutyStatus === 'On Duty' ? 'checkmark-circle' : 'close-circle'} 
            size={14} 
            color={employee.dutyStatus === 'On Duty' ? '#34C759' : '#FF3B30'} 
          />
          <Text style={[
            styles.dutyStatusText, 
            { color: employee.dutyStatus === 'On Duty' ? '#34C759' : '#FF3B30' }
          ]}>
            {employee.dutyStatus}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  departmentContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  departmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  departmentText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rankBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  additionalInfo: {
    gap: 2,
  },
  stationText: {
    fontSize: 11,
    color: '#666',
  },
  phoneText: {
    fontSize: 11,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  dutyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dutyStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EmployeeContainer; 