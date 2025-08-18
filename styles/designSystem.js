import { StyleSheet } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA3FF',
  
  // Secondary Colors
  secondary: '#6C757D',
  secondaryDark: '#495057',
  secondaryLight: '#ADB5BD',
  
  // Success Colors
  success: '#28A745',
  successDark: '#1E7E34',
  successLight: '#5CB85C',
  
  // Warning Colors
  warning: '#FFC107',
  warningDark: '#E0A800',
  warningLight: '#FFD54F',
  
  // Danger Colors
  danger: '#FF4444',
  dangerDark: '#DC3545',
  dangerLight: '#FF6B6B',
  
  // Info Colors
  info: '#17A2B8',
  infoDark: '#138496',
  infoLight: '#5BC0DE',
  
  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  gray: '#E9ECEF',
  darkGray: '#6C757D',
  darkerGray: '#495057',
  black: '#2C3E50',
  
  // Background Colors
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  modalBackground: 'rgba(0, 0, 0, 0.5)',
  
  // Border Colors
  border: '#E9ECEF',
  borderLight: '#F1F3F4',
  borderDark: '#DEE2E6',
  
  // Text Colors
  textPrimary: '#2C3E50',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textMuted: '#6C757D',
  
  // boxShadow Colors
  boxShadow: '#000000',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  
  // Font Weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  
  // Line Heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 60,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ============================================================================
// boxShadowS
// ============================================================================

export const boxShadows = {
  sm: {
    boxShadowColor: colors.boxShadow,
    boxShadowOffset: { width: 0, height: 1 },
    boxShadowOpacity: 0.05,
    boxShadowRadius: 2,
    elevation: 1,
  },
  base: {
    boxShadowColor: colors.boxShadow,
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 4,
    elevation: 2,
  },
  md: {
    boxShadowColor: colors.boxShadow,
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 8,
    elevation: 4,
  },
  lg: {
    boxShadowColor: colors.boxShadow,
    boxShadowOffset: { width: 0, height: 6 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 12,
    elevation: 6,
  },
  xl: {
    boxShadowColor: colors.boxShadow,
    boxShadowOffset: { width: 0, height: 8 },
    boxShadowOpacity: 0.2,
    boxShadowRadius: 16,
    elevation: 8,
  },
};

// ============================================================================
// ICONS
// ============================================================================

export const icons = {
  // Navigation Icons
  back: 'arrow-back',
  forward: 'arrow-forward',
  close: 'close',
  menu: 'menu',
  search: 'search-outline',
  filter: 'filter-outline',
  
  // Action Icons
  add: 'add',
  edit: 'pencil-outline',
  delete: 'trash-outline',
  save: 'checkmark-outline',
  cancel: 'close-outline',
  refresh: 'refresh-outline',
  share: 'share-outline',
  
  // Status Icons
  check: 'checkmark-circle-outline',
  warning: 'warning-outline',
  error: 'close-circle-outline',
  info: 'information-circle-outline',
  
  // Business Icons
  people: 'people-outline',
  person: 'person',
  personAdd: 'person-add-outline',
  calendar: 'calendar-outline',
  time: 'time-outline',
  cash: 'cash-outline',
  calculator: 'calculator-outline',
  document: 'document-outline',
  documentText: 'document-text-outline',
  chatbubble: 'chatbubble-outline',
  chatbubbleText: 'chatbubble-text-outline',
  
  // Summary Card Icons
  totalRecords: 'document-text-outline',
  totalEmployees: 'people-outline',
  totalAmount: 'cash-outline',
  totalHours: 'time-outline',
  pending: 'time-outline',
  active: 'person-add-outline',
  remarks: 'chatbubble-text-outline',
  thisMonth: 'calendar-outline',
  
  // Detail Row Icons
  date: 'calendar-outline',
  hours: 'time-outline',
  rate: 'cash-outline',
  amount: 'calculator-outline',
  document: 'document-outline',
  phone: 'call-outline',
  email: 'mail-outline',
  position: 'briefcase-outline',
  
  // Avatar Icons
  avatar: 'person',
  
  // Floating Action Button
  floatingAdd: 'add',
};

// ============================================================================
// COMMON STYLES
// ============================================================================

export const commonStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  
  // Summary Card Styles
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    ...boxShadows.sm,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...boxShadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: typography.sm,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  
  // List Container Styles
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  
  // Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...boxShadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  // Record Card Styles
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...boxShadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recordActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Employee Info Styles
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  employeePhone: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  
  // Record Details Styles
  recordDetails: {
    gap: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    minWidth: 80,
  },
  detailValue: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    fontWeight: typography.medium,
  },
  
  // Remarks/Description Styles
  remarksContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: 5,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  remarksLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
    paddingHorizontal: 5,
  },
  remarksText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    paddingHorizontal: 5,
    lineHeight: 20,
  },
  seeMoreButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 5,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  seeMoreText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.base,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: typography.xl,
    color: colors.textSecondary,
    fontWeight: typography.bold,
  },
  formContainer: {
    padding: spacing.lg,
  },
  
  // Form Styles
  formLabel: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
  
  // Button Styles
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  
  // Floating Action Button
  floatingAddButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...boxShadows.lg,
  },
  
  // Input Styles
  input: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.sm,
    padding: spacing.base,
    fontSize: typography.base,
    backgroundColor: colors.lightGray,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  
  // Select Dropdown Styles
  employeeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.sm,
    padding: spacing.base,
    backgroundColor: colors.lightGray,
  },
  selectedEmployee: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  placeholderText: {
    fontSize: typography.base,
    color: colors.textLight,
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getIconColor = (type) => {
  const iconColors = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    secondary: colors.secondary,
  };
  return iconColors[type] || colors.primary;
};

export const getSummaryIconColor = (type) => {
  const summaryIconColors = {
    totalRecords: colors.primary,
    totalEmployees: colors.primary,
    totalAmount: colors.warning,
    totalHours: colors.success,
    pending: colors.primary,
    active: colors.success,
    remarks: colors.primary,
    thisMonth: colors.success,
  };
  return summaryIconColors[type] || colors.primary;
};

export const getDetailIconColor = () => colors.textSecondary;

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadows,
  icons,
  commonStyles,
  getIconColor,
  getSummaryIconColor,
  getDetailIconColor,
}; 