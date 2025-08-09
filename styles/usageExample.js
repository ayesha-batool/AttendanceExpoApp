import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
    borderRadius,
    colors,
    commonStyles,
    getDetailIconColor,
    getIconColor,
    getSummaryIconColor,
    icons,
    shadows,
    spacing,
    typography
} from './designSystem';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Using the design system in a component
export const ExampleComponent = () => {
  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Example Page</Text>
        <Text style={commonStyles.headerSubtitle}>This is an example</Text>
      </View>

      {/* Summary Cards */}
      <View style={commonStyles.summaryContainer}>
        <View style={commonStyles.summaryCard}>
          <View style={commonStyles.summaryIconContainer}>
            <Ionicons 
              name={icons.totalRecords} 
              size={24} 
              color={getSummaryIconColor('totalRecords')} 
            />
          </View>
          <Text style={commonStyles.summaryLabel}>Total Records</Text>
          <Text style={commonStyles.summaryValue}>25</Text>
        </View>
        
        <View style={commonStyles.summaryCard}>
          <View style={commonStyles.summaryIconContainer}>
            <Ionicons 
              name={icons.totalAmount} 
              size={24} 
              color={getSummaryIconColor('totalAmount')} 
            />
          </View>
          <Text style={commonStyles.summaryLabel}>Total Amount</Text>
          <Text style={commonStyles.summaryValue}>$1,250</Text>
        </View>
      </View>

      {/* Record Card */}
      <View style={commonStyles.recordCard}>
        <View style={commonStyles.recordHeader}>
          <View style={commonStyles.employeeInfo}>
            <View style={commonStyles.employeeAvatar}>
              <Ionicons name={icons.avatar} size={20} color={colors.white} />
            </View>
            <Text style={commonStyles.employeeName}>John Doe</Text>
          </View>
          <View style={commonStyles.recordActions}>
            <TouchableOpacity style={commonStyles.actionButton}>
              <Ionicons name={icons.edit} size={18} color={getIconColor('primary')} />
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.actionButton}>
              <Ionicons name={icons.delete} size={18} color={getIconColor('danger')} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={commonStyles.recordDetails}>
          <View style={commonStyles.detailRow}>
            <Ionicons name={icons.date} size={16} color={getDetailIconColor()} />
            <Text style={commonStyles.detailLabel}>Date:</Text>
            <Text style={commonStyles.detailValue}>2024-01-15</Text>
          </View>
          <View style={commonStyles.detailRow}>
            <Ionicons name={icons.amount} size={16} color={getDetailIconColor()} />
            <Text style={commonStyles.detailLabel}>Amount:</Text>
            <Text style={commonStyles.detailValue}>$500</Text>
          </View>
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={commonStyles.floatingAddButton}>
        <Ionicons name={icons.floatingAdd} size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

// Example 2: Custom styles using design system tokens
export const CustomComponent = () => {
  const customStyles = {
    container: {
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    },
    title: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: typography.base,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      ...shadows.base,
    },
    buttonText: {
      color: colors.white,
      fontSize: typography.base,
      fontWeight: typography.semibold,
    },
  };

  return (
    <View style={customStyles.container}>
      <Text style={customStyles.title}>Custom Component</Text>
      <Text style={customStyles.subtitle}>Using design system tokens</Text>
      <TouchableOpacity style={customStyles.button}>
        <Text style={customStyles.buttonText}>Custom Button</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 3: Icon usage with proper colors
export const IconExamples = () => {
  return (
    <View style={{ padding: spacing.md }}>
      {/* Summary Card Icons */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <Ionicons name={icons.totalRecords} size={24} color={getSummaryIconColor('totalRecords')} />
        <Ionicons name={icons.totalAmount} size={24} color={getSummaryIconColor('totalAmount')} />
        <Ionicons name={icons.totalHours} size={24} color={getSummaryIconColor('totalHours')} />
        <Ionicons name={icons.pending} size={24} color={getSummaryIconColor('pending')} />
      </View>

      {/* Action Icons */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <Ionicons name={icons.add} size={24} color={getIconColor('primary')} />
        <Ionicons name={icons.edit} size={24} color={getIconColor('primary')} />
        <Ionicons name={icons.delete} size={24} color={getIconColor('danger')} />
        <Ionicons name={icons.save} size={24} color={getIconColor('success')} />
      </View>

      {/* Detail Row Icons */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Ionicons name={icons.date} size={16} color={getDetailIconColor()} />
        <Ionicons name={icons.time} size={16} color={getDetailIconColor()} />
        <Ionicons name={icons.cash} size={16} color={getDetailIconColor()} />
        <Ionicons name={icons.calculator} size={16} color={getDetailIconColor()} />
      </View>
    </View>
  );
};

// Example 4: How to import and use in existing components
export const ImportExample = () => {
  // Import what you need
  // import { colors, typography, spacing, commonStyles, icons, getIconColor } from '../styles/designSystem';
  
  return (
    <View style={commonStyles.container}>
      <Text style={{
        fontSize: typography.lg,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        padding: spacing.md,
      }}>
        This component uses the design system
      </Text>
      
      <TouchableOpacity style={{
        backgroundColor: colors.primary,
        padding: spacing.base,
        borderRadius: borderRadius.sm,
        margin: spacing.md,
      }}>
        <Text style={{
          color: colors.white,
          fontSize: typography.base,
          fontWeight: typography.semibold,
          textAlign: 'center',
        }}>
          Design System Button
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/*
HOW TO MIGRATE EXISTING COMPONENTS:

1. Import the design system:
   import { colors, typography, spacing, commonStyles, icons, getIconColor } from '../styles/designSystem';

2. Replace hardcoded colors:
   OLD: color: '#007AFF'
   NEW: color: colors.primary

3. Replace hardcoded spacing:
   OLD: padding: 16
   NEW: padding: spacing.md

4. Replace hardcoded typography:
   OLD: fontSize: 18, fontWeight: 'bold'
   NEW: fontSize: typography.lg, fontWeight: typography.bold

5. Use common styles:
   OLD: Create your own styles
   NEW: Use commonStyles.container, commonStyles.header, etc.

6. Use icon constants:
   OLD: name="people-outline"
   NEW: name={icons.people}

7. Use color functions:
   OLD: color="#007AFF"
   NEW: color={getIconColor('primary')}

EXAMPLE MIGRATION:

OLD:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
});

NEW:
import { commonStyles } from '../styles/designSystem';

// Use commonStyles.container, commonStyles.header, commonStyles.headerTitle
// Or create custom styles using design system tokens:

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  header: {
    ...commonStyles.header,
  },
  headerTitle: {
    ...commonStyles.headerTitle,
  },
});
*/ 