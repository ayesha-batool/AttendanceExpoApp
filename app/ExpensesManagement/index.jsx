import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EmptyState from '../../components/EmptyState';
import ExpenseCard from '../../components/ExpenseCard';
import ExpenseDetailsModal from '../../components/ExpenseDetailsModal';
import ExpenseForm from '../../components/ExpenseForm';
import LoadingOverlay from '../../components/LoadingOverlay';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';

import { useExpensesContext } from '../../context/ExpensesContext';
import { customOptionsService, dataService } from '../../services/unifiedDataService';

const ExpensesManagementScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useExpensesContext();
  
  // State management - compressed
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modals, setModals] = useState({
    add: false, delete: false, details: false
  });
  const [selected, setSelected] = useState({
    expense: null, editExpense: null, deleteExpense: null, isEdit: false
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'paid', 'unpaid'

  // Utility functions - compressed
  const showToast = (type, text1, text2) => Toast.show({ type, text1, text2 });
  const updateModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));

  // Helper function to get consistent ID
  const getExpenseId = (expense) => {
    return expense?.id || expense?.$id || null;
  };

  // Tab Navigation Component
  const TabNavigation = () => {
    const tabs = [
      { key: 'all', label: 'All', icon: 'list' },
      { key: 'paid', label: 'Paid', icon: 'checkmark-circle' },
      { key: 'unpaid', label: 'Unpaid', icon: 'time' }
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? '#fff' : '#667eea'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Load dropdown options
  const loadDropdownOptions = async () => {
    try {
      const [categories, departments] = await Promise.all([
        customOptionsService.getOptions('expense_categories'),
        customOptionsService.getOptions('departments')
      ]);
      
      const categoryOptions = categories.map(category => ({
        label: category, value: category.toLowerCase().replace(/\s+/g, '_')
      }));
      
      const departmentOptions = departments.map(department => ({
        label: department, value: department.toLowerCase().replace(/\s+/g, '_')
      }));
      
      setCategoryOptions(categoryOptions);
      setDepartmentOptions(departmentOptions);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const expensesData = await dataService.getItems('expenses');
      
      const validExpenses = expensesData.filter(item => item && typeof item === 'object');
      
      // Remove duplicates based on ID (in-memory deduplication)
      const uniqueExpenses = removeDuplicateExpenses(validExpenses);
      
      setExpenses(uniqueExpenses);
      setFilteredExpenses(uniqueExpenses);
    
    } catch (error) {
      console.error('Failed to load expenses data:', error);
      showToast('error', 'Error', 'Failed to load expenses data');
      setExpenses([]);
      setFilteredExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove duplicate expenses based on ID
  const removeDuplicateExpenses = (expenses) => {
    const seen = new Set();
    const unique = [];
    
    for (const expense of expenses) {
      const id = getExpenseId(expense);
      if (id && !seen.has(id)) {
        seen.add(id);
        unique.push(expense);
      } else if (!id) {
        // If no ID, still include the expense but with a warning
        console.warn('Expense without ID found:', expense);
        unique.push(expense);
      }
    }
    
    return unique;
  };

  // Search and filter expenses
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    let filtered = expenses;
    
    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(expense => 
        expense.title?.toLowerCase().includes(query.toLowerCase()) ||
        expense.category?.toLowerCase().includes(query.toLowerCase()) ||
        expense.department?.toLowerCase().includes(query.toLowerCase()) ||
        expense.description?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by payment status
    if (activeTab === 'paid') {
      filtered = filtered.filter(expense => expense.status === 'paid');
    } else if (activeTab === 'unpaid') {
      filtered = filtered.filter(expense => expense.status !== 'paid');
    }
    
    setFilteredExpenses(filtered);
  };

  // CRUD operations - compressed
  const handleAdd = () => {
    updateSelected('isEdit', false);
    updateSelected('editExpense', null);
    updateModal('add', true);
  };

  const handleEdit = (expense) => {
    updateSelected('isEdit', true);
    updateSelected('editExpense', expense);
    updateModal('add', true);
  };

  const handleDelete = (expense) => {
    updateSelected('deleteExpense', expense);
    updateModal('delete', true);
  };

  const handleView = (expense) => {
    updateSelected('expense', expense);
    updateModal('details', true);
  };

  const confirmDelete = async () => {
    if (!selected.deleteExpense) return;
    
    try {
      setIsDeleting(true);
      
      const expenseId = getExpenseId(selected.deleteExpense);
      
      if (!expenseId) {
        throw new Error('Invalid expense ID');
      }
      
      const key = `expenses_${expenseId}`;
              await dataService.deleteData(key, expenseId, 'expenses');
      
      // Remove from state
      setExpenses(prev => prev.filter(expense => getExpenseId(expense) !== expenseId));
      setFilteredExpenses(prev => prev.filter(expense => getExpenseId(expense) !== expenseId));
      
      showToast('success', 'Success', 'Expense deleted successfully');
      
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('error', 'Error', error.message || 'Failed to delete expense');
    } finally {
      updateModal('delete', false);
      updateSelected('deleteExpense', null);
      setIsDeleting(false);
    }
  };

  const saveExpense = async (expenseData) => {
    if (isSaving) {
      showToast('error', 'Error', 'Please wait, saving in progress...');
      return;
    }

    // Handle option refresh requests
    if (expenseData.refreshOptions && expenseData.fieldName) {
      await loadDropdownOptions();
      return;
    }

    try {
      setIsSaving(true);
      
      if (selected.isEdit && selected.editExpense) {
        const expenseId = getExpenseId(selected.editExpense);
        
        if (!expenseId) {
          throw new Error('Invalid expense ID for update');
        }
        
        const key = `expenses_${expenseId}`;
        await dataService.updateData(key, expenseId, expenseData, 'expenses');
        
        const updatedExpense = { ...expenseData, $id: expenseId, id: expenseId };
        
        setExpenses(prev => prev.map(expense => 
          getExpenseId(expense) === expenseId ? updatedExpense : expense
        ));
        setFilteredExpenses(prev => prev.map(expense => 
          getExpenseId(expense) === expenseId ? updatedExpense : expense
        ));
        
        showToast('success', 'Success', 'Expense updated successfully');
      } else {
        const newExpense = await dataService.saveData(expenseData, 'expenses');
        
        const expenseWithId = { 
          ...newExpense, 
          id: newExpense.$id || newExpense.id,
          $id: newExpense.$id || newExpense.id 
        };
        
        setExpenses(prev => [...prev, expenseWithId]);
        setFilteredExpenses(prev => [...prev, expenseWithId]);
        
        showToast('success', 'Success', 'Expense added successfully');
      }
      
      // Close modal and reset state
      updateModal('add', false);
      updateSelected('isEdit', false);
      updateSelected('editExpense', null);
      
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('error', 'Error', error.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredExpenses(expenses);
  };

  // Stats calculations - compressed
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const topCategory = Object.entries(
    expenses.reduce((acc, expense) => {
      const cat = expense.category || 'other';
      acc[cat] = (acc[cat] || 0) + (parseFloat(expense.amount) || 0);
      return acc;
    }, {})
  ).sort(([,a], [,b]) => b - a)[0];

  // Calculate totals
  const calculateTotals = () => {
    const total = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const count = expenses.length;
    const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const filteredCount = filteredExpenses.length;
    return { total, count, filteredTotal, filteredCount };
  };

  const { total, count, filteredTotal, filteredCount } = calculateTotals();

  // Effects
  useEffect(() => {
    fetchData();
    loadDropdownOptions();
  }, []);

  useFocusEffect(useCallback(() => {
    // Only refetch data when returning to the screen, not on initial load
    // This prevents double fetching on mount
    if (expenses.length > 0 && !isDeleting) {
      fetchData();
    } else if (isDeleting) {
      }
    // Always reload dropdown options as they might have been updated
    loadDropdownOptions();
  }, [selected.deleteExpense, isDeleting]));

  // Remove header action button since we're using floating action button
  // useEffect(() => {
  //   setHeaderActionButton({ icon: 'add', onPress: handleAdd });
  //   return () => clearHeaderAction();
  // }, []);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, expenses, activeTab]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      {/* Stats and Search Section */}
      <View style={styles.stats}>
        <View style={styles.statRow}>
          <StatCard icon="wallet" color="#10b981" value={`$${total.toFixed(2)}`} label="Total Expenses" />
          <StatCard icon="receipt" color="#8b5cf6" value={count.toString()} label="Total Count" />
        </View>
        
        {/* Search Only */}
        <View style={styles.searchFilter}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search expenses..."
            onClear={() => setSearchQuery('')}
          />
          
        </View>
          <TabNavigation />
      </View>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={searchQuery ? 'No Expenses Found' : 'No Expenses'}
          message={searchQuery ? 'Try adjusting your search' : 'Start by adding your first expense'}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => getExpenseId(item)}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={() => handleView(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Other Modals */}
      <ExpenseForm
        visible={modals.add}
        onClose={() => { updateModal('add', false); updateSelected('isEdit', false); updateSelected('editExpense', null); }}
        onSave={saveExpense}
        expense={selected.editExpense}
        isEdit={selected.isEdit}
        categoryOptions={categoryOptions}
        departmentOptions={departmentOptions}
      />

      <ExpenseDetailsModal
        visible={modals.details}
        expense={selected.expense}
        onClose={() => { 
          updateModal('details', false); 
          updateSelected('expense', null); 
        }}
        onEdit={() => { 
          updateModal('details', false); 
          handleEdit(selected.expense); 
        }}
        onDelete={() => { 
          updateModal('details', false); 
          handleDelete(selected.expense); 
        }}
      />

      <DeleteConfirmationModal
        visible={modals.delete}
        onConfirm={confirmDelete}
        onClose={() => { updateModal('delete', false); updateSelected('deleteExpense', null); }}
        itemName={selected.deleteExpense?.title || 'this expense'}
      />

      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={isSaving || isDeleting} 
        message={
          isSaving ? 'Saving expense...' : 
          isDeleting ? 'Deleting expense...' : 
          'Processing...'
        }
        type={
          isSaving ? 'save' : 
          isDeleting ? 'delete' : 
          'default'
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Stat Card Component
const StatCard = ({ icon, color, value, label, full = false }) => (
  <View style={[styles.statCard, full && styles.fullCard]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  stats: { 
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  statRow: { 
    flexDirection: 'row',
    gap: 6
  },
  statRow: { flexDirection: 'row', gap: 6 },
  statCard: { flex: 1, minHeight:70, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', boxShadowColor: '#000', boxShadowOffset: { width: 0, height: 4 }, boxShadowOpacity: 0.15, boxShadowRadius: 12, elevation: 8 },
  fullCard: { flex: 0, width: '100%' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statContent: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  searchFilter: { flexDirection: 'row', alignItems: 'center', gap: 6 ,width:'100%'},

  list: { padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '95%', maxHeight: '85%', minHeight: '60%', padding: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  modalBody: { flex: 1, padding: 24, paddingBottom: 32 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 16 },
  clearBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6b7280', alignItems: 'center' },
  clearText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 1, borderRadius: 12 },
  applyGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggleSubtext: {
    marginTop: 5,
    marginLeft: 30,
    fontSize: 12,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  activeTabText: {
    color: '#fff',
  },
});

export default ExpensesManagementScreen;