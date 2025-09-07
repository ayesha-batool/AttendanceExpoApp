import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const ExpenseCard = ({ expense, onPress, onEdit, onDelete }) => {
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(expense.category) }]}>
            <Ionicons name={getCategoryIcon(expense.category)} size={16} color="#fff" />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.title}
            </Text>
            <Text style={styles.category}>
              {expense.category?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${parseFloat(expense.amount || 0).toLocaleString()}</Text>
          {expense.status && (
            <View style={[
              styles.statusBadge, 
              { backgroundColor: expense.status === 'paid' ? '#dcfce7' : '#fef3c7' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: expense.status === 'paid' ? '#166534' : '#92400e' }
              ]}>
                {expense.status === 'paid' ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {new Date(expense.date).toLocaleDateString()}
          </Text>
        </View>
        
        {expense.department && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={14} color="#6b7280" />
            <Text style={styles.infoText}>
              {expense.department}
            </Text>
          </View>
        )}

        {expense.receipt && (
          <View style={styles.infoRow}>
            <Ionicons name="receipt" size={14} color="#6b7280" />
            <Text style={styles.infoText}>
              Receipt attached
            </Text>
          </View>
        )}

        {expense.status && (
          <View style={styles.infoRow}>
            <Ionicons 
              name={expense.status === 'paid' ? 'checkmark-circle' : 'time'} 
              size={14} 
              color={expense.status === 'paid' ? '#10b981' : '#f59e0b'} 
            />
            <Text style={[
              styles.infoText, 
              { color: expense.status === 'paid' ? '#10b981' : '#f59e0b' }
            ]}>
              {expense.status === 'paid' ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Ionicons name="create" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.08,
    boxShadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteText: {
    color: '#ef4444',
  },
});

export default ExpenseCard; 