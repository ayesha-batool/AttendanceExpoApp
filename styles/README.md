# Design System

This directory contains the comprehensive design system for the React Native application. It provides consistent colors, typography, spacing, icons, and reusable styles across all components.

## 📁 Files

- `designSystem.js` - Main design system with colors, typography, spacing, icons, and common styles
- `usageExample.js` - Examples of how to use the design system
- `README.md` - This documentation file

## 🎨 Design System Overview

### Colors
- **Primary**: `#007AFF` (Blue)
- **Secondary**: `#6C757D` (Gray)
- **Success**: `#28A745` (Green)
- **Warning**: `#FFC107` (Yellow)
- **Danger**: `#FF4444` (Red)
- **Info**: `#17A2B8` (Cyan)

### Typography
- **Font Sizes**: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (28), 4xl (32)
- **Font Weights**: normal (400), medium (500), semibold (600), bold (700), extrabold (800)

### Spacing
- **Scale**: xs (4), sm (8), base (12), md (16), lg (20), xl (24), 2xl (32), 3xl (40), 4xl (48), 5xl (60)

### Border Radius
- **Scale**: none (0), sm (4), base (8), md (12), lg (16), xl (20), 2xl (24), full (9999)

## 🚀 Quick Start

### 1. Import the Design System

```javascript
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  shadows, 
  icons, 
  commonStyles,
  getIconColor,
  getSummaryIconColor,
  getDetailIconColor 
} from '../styles/designSystem';
```

### 2. Use Common Styles

```javascript
import { commonStyles } from '../styles/designSystem';

const MyComponent = () => {
  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>My Page</Text>
        <Text style={commonStyles.headerSubtitle}>Subtitle</Text>
      </View>
      
      <View style={commonStyles.summaryContainer}>
        <View style={commonStyles.summaryCard}>
          <View style={commonStyles.summaryIconContainer}>
            <Ionicons name={icons.totalRecords} size={24} color={getSummaryIconColor('totalRecords')} />
          </View>
          <Text style={commonStyles.summaryLabel}>Total Records</Text>
          <Text style={commonStyles.summaryValue}>25</Text>
        </View>
      </View>
    </View>
  );
};
```

### 3. Use Design System Tokens

```javascript
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';

const customStyles = StyleSheet.create({
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
  button: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    ...shadows.base,
  },
});
```

## 📋 Available Components

### Common Styles

#### Container
- `commonStyles.container` - Main container with background
- `commonStyles.loadingContainer` - Centered loading container

#### Header
- `commonStyles.header` - Page header with white background
- `commonStyles.headerTitle` - Large bold title
- `commonStyles.headerSubtitle` - Subtitle text

#### Summary Cards
- `commonStyles.summaryContainer` - Flex row container for summary cards
- `commonStyles.summaryCard` - Individual summary card
- `commonStyles.summaryIconContainer` - Circular icon container
- `commonStyles.summaryLabel` - Card label text
- `commonStyles.summaryValue` - Card value text

#### Search
- `commonStyles.searchContainer` - Search bar container
- `commonStyles.searchInput` - Search input field

#### Empty States
- `commonStyles.emptyContainer` - Centered empty state
- `commonStyles.emptyTitle` - Empty state title
- `commonStyles.emptyText` - Empty state description

#### Cards
- `commonStyles.recordCard` - Record/employee card
- `commonStyles.recordHeader` - Card header with actions
- `commonStyles.recordActions` - Action buttons container
- `commonStyles.actionButton` - Circular action button

#### Employee Info
- `commonStyles.employeeInfo` - Employee info container
- `commonStyles.employeeAvatar` - Circular avatar
- `commonStyles.employeeDetails` - Employee details container
- `commonStyles.employeeName` - Employee name text
- `commonStyles.employeePhone` - Employee phone text
- `commonStyles.employeePosition` - Employee position text

#### Record Details
- `commonStyles.recordDetails` - Details container
- `commonStyles.detailRow` - Detail row with icon
- `commonStyles.detailLabel` - Detail label
- `commonStyles.detailValue` - Detail value

#### Remarks/Description
- `commonStyles.remarksContainer` - Remarks container
- `commonStyles.remarksLabel` - Remarks label
- `commonStyles.remarksText` - Remarks text
- `commonStyles.seeMoreButton` - See more button
- `commonStyles.seeMoreText` - See more text

#### Modals
- `commonStyles.modalContainer` - Modal overlay
- `commonStyles.modalContent` - Modal content
- `commonStyles.modalHeader` - Modal header
- `commonStyles.modalTitle` - Modal title
- `commonStyles.closeButton` - Close button text
- `commonStyles.formContainer` - Form container

#### Forms
- `commonStyles.formLabel` - Form label
- `commonStyles.errorText` - Error text
- `commonStyles.input` - Input field
- `commonStyles.errorInput` - Input with error
- `commonStyles.employeeSelector` - Employee selector
- `commonStyles.selectedEmployee` - Selected employee text
- `commonStyles.placeholderText` - Placeholder text

#### Buttons
- `commonStyles.button` - Primary button
- `commonStyles.buttonText` - Button text
- `commonStyles.saveButton` - Save button
- `commonStyles.saveButtonText` - Save button text
- `commonStyles.floatingAddButton` - Floating action button

## 🎯 Icons

### Available Icon Constants

#### Navigation
- `icons.back` - Back arrow
- `icons.forward` - Forward arrow
- `icons.close` - Close icon
- `icons.menu` - Menu icon
- `icons.search` - Search icon
- `icons.filter` - Filter icon

#### Actions
- `icons.add` - Add icon
- `icons.edit` - Edit icon
- `icons.delete` - Delete icon
- `icons.save` - Save icon
- `icons.cancel` - Cancel icon
- `icons.refresh` - Refresh icon
- `icons.share` - Share icon

#### Status
- `icons.check` - Check icon
- `icons.warning` - Warning icon
- `icons.error` - Error icon
- `icons.info` - Info icon

#### Business
- `icons.people` - People icon
- `icons.person` - Person icon
- `icons.personAdd` - Person add icon
- `icons.calendar` - Calendar icon
- `icons.time` - Time icon
- `icons.cash` - Cash icon
- `icons.calculator` - Calculator icon
- `icons.document` - Document icon
- `icons.documentText` - Document text icon
- `icons.chatbubble` - Chat bubble icon
- `icons.chatbubbleText` - Chat bubble text icon

#### Summary Cards
- `icons.totalRecords` - Total records icon
- `icons.totalEmployees` - Total employees icon
- `icons.totalAmount` - Total amount icon
- `icons.totalHours` - Total hours icon
- `icons.pending` - Pending icon
- `icons.active` - Active icon
- `icons.remarks` - Remarks icon
- `icons.thisMonth` - This month icon

#### Detail Rows
- `icons.date` - Date icon
- `icons.hours` - Hours icon
- `icons.rate` - Rate icon
- `icons.amount` - Amount icon
- `icons.document` - Document icon
- `icons.phone` - Phone icon
- `icons.email` - Email icon
- `icons.position` - Position icon

#### Avatar
- `icons.avatar` - Avatar icon

#### Floating Action
- `icons.floatingAdd` - Floating add icon

### Icon Color Functions

```javascript
// Get icon color by type
getIconColor('primary')    // Returns primary color
getIconColor('success')    // Returns success color
getIconColor('danger')     // Returns danger color
getIconColor('warning')    // Returns warning color
getIconColor('info')       // Returns info color
getIconColor('secondary')  // Returns secondary color

// Get summary icon color by type
getSummaryIconColor('totalRecords')  // Returns primary color
getSummaryIconColor('totalAmount')   // Returns warning color
getSummaryIconColor('totalHours')    // Returns success color
getSummaryIconColor('pending')       // Returns primary color

// Get detail icon color
getDetailIconColor()  // Returns secondary color
```

## 🔄 Migration Guide

### Step 1: Import Design System
```javascript
// OLD
import { StyleSheet } from 'react-native';

// NEW
import { colors, typography, spacing, commonStyles, icons, getIconColor } from '../styles/designSystem';
```

### Step 2: Replace Hardcoded Values
```javascript
// OLD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
});

// NEW
const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: spacing.md,
  },
  title: {
    ...commonStyles.headerTitle,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
  },
});
```

### Step 3: Use Icon Constants
```javascript
// OLD
<Ionicons name="people-outline" size={24} color="#007AFF" />

// NEW
<Ionicons name={icons.people} size={24} color={getIconColor('primary')} />
```

### Step 4: Use Common Styles
```javascript
// OLD
<View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
  <View style={{ backgroundColor: '#fff', padding: 20 }}>
    <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Title</Text>
  </View>
</View>

// NEW
<View style={commonStyles.container}>
  <View style={commonStyles.header}>
    <Text style={commonStyles.headerTitle}>Title</Text>
  </View>
</View>
```

## 📝 Best Practices

1. **Always import from design system** instead of hardcoding values
2. **Use common styles** when available instead of creating new ones
3. **Use icon constants** instead of hardcoded icon names
4. **Use color functions** for consistent icon colors
5. **Extend common styles** when you need custom variations
6. **Keep components consistent** by using the same design tokens

## 🎨 Customization

To customize the design system:

1. **Modify colors** in `designSystem.js`
2. **Add new icons** to the `icons` object
3. **Extend common styles** for new components
4. **Create new utility functions** for specific use cases

## 📚 Examples

See `usageExample.js` for comprehensive examples of how to use the design system in different scenarios.

## 🔧 Maintenance

- Keep the design system up to date with new components
- Add new icons as needed
- Maintain consistency across all pages
- Update documentation when adding new features 