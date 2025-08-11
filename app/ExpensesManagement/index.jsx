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
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';

import { useExpensesContext } from '../../context/ExpensesContext';
import CustomOptionsService from '../../services/customOptionsService';
import { getItems, handleDataDelete, handleDataSubmit, handleDataUpdate, removeDuplicateEntries } from '../../services/dataHandler';

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

  // Constants - compressed
  const departmentOptions = [
    { label: 'Patrol', value: 'patrol' }, { label: 'Investigation', value: 'investigation' },
    { label: 'Traffic', value: 'traffic' }, { label: 'Administration', value: 'administration' },
    { label: 'Training', value: 'training' }, { label: 'Equipment', value: 'equipment' }
  ];

  // Utility functions - compressed
  const showToast = (type, text1, text2) => Toast.show({ type, text1, text2 });
  const updateModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));

  // Helper function to get consistent ID
  const getExpenseId = (expense) => {
    return expense?.id || expense?.$id || null;
  };

  // Load category options
  const loadCategoryOptions = async () => {
    try {
      const allCategories = await CustomOptionsService.getAllOptions('expenseCategories');
      const options = allCategories.map(category => ({
        label: category, value: category.toLowerCase().replace(/\s+/g, '_')
      }));
      setCategoryOptions(options);
    } catch (error) {
      setCategoryOptions([
        { label: 'Fuel', value: 'fuel' }, { label: 'Equipment', value: 'equipment' },
        { label: 'Training', value: 'training' }, { label: 'Maintenance', value: 'maintenance' },
        { label: 'Office Supplies', value: 'office_supplies' }, { label: 'Travel', value: 'travel' },
        { label: 'Other', value: 'other' }
      ]);
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching expenses data from local storage...');
      
      // First, clean up any duplicate entries in AsyncStorage
      await removeDuplicateEntries('expenses');
      
      const expensesData = await getItems('expenses');
      console.log('🔍 Raw expenses data:', expensesData);
      
      const validExpenses = expensesData.filter(item => item && typeof item === 'object');
      console.log('🔍 Valid expenses after filtering:', validExpenses.length);
      
      // Remove duplicates based on ID (in-memory deduplication)
      const uniqueExpenses = removeDuplicateExpenses(validExpenses);
      console.log('🔍 Unique expenses after deduplication:', uniqueExpenses.length);
      
      // Only load from local storage, no default data
      setExpenses(uniqueExpenses);
      setFilteredExpenses(uniqueExpenses);
      
      if (uniqueExpenses.length === 0) {
        console.log('🔍 No expenses found in local storage, showing empty state');
      } else {
        console.log('🔍 Loaded expenses from local storage:', uniqueExpenses.length, 'items');
      }
    } catch (error) {
      console.error('❌ Error loading expenses data:', error);
      showToast('error', 'Error', 'Failed to load expenses data');
      // Set empty arrays on error
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
      } else if (id) {
        console.log('🔍 Removing duplicate expense with ID:', id);
      }
    }
    
    return unique;
  };

  // Search logic only
  const applySearch = () => {
    let filtered = [...expenses];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        ['title', 'description', 'department', 'category', 'notes'].some(field =>
          expense[field]?.toLowerCase().includes(query)
        )
      );
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
    
    setIsDeleting(true);
    try {
      console.log('🔍 confirmDelete called for expense:', selected.deleteExpense);
      const expenseId = getExpenseId(selected.deleteExpense);
      
      if (!expenseId) {
        throw new Error('Invalid expense ID');
      }
      
      // Use the correct key format for deletion
      const key = `expenses_${expenseId}`;
      await handleDataDelete(key, expenseId, 'expenses');
      
      // Remove from state
      setExpenses(prev => {
        const filtered = prev.filter(expense => getExpenseId(expense) !== expenseId);
        console.log('🔍 Expenses state after deletion - before:', prev.length, 'after:', filtered.length);
        return filtered;
      });
      
      setFilteredExpenses(prev => {
        const filtered = prev.filter(expense => getExpenseId(expense) !== expenseId);
        console.log('🔍 Filtered expenses state after deletion - before:', prev.length, 'after:', filtered.length);
        return filtered;
      });
      
      console.log('🔍 Expense deleted successfully from state');
      showToast('success', 'Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      showToast('error', 'Error', 'Failed to delete expense');
    } finally {
      // Close modal first, then clear selection to prevent refetch
      updateModal('delete', false);
      // Add a small delay before clearing selection to prevent immediate refetch
      setTimeout(() => {
        updateSelected('deleteExpense', null);
        setIsDeleting(false);
      }, 100);
    }
  };

  const saveExpense = async (expenseData) => {
    console.log('🔍 saveExpense called with:', expenseData);
    console.log('🔍 saveExpense - timestamp:', new Date().toISOString());
    try {
      if (selected.isEdit) {
        const expenseId = getExpenseId(expenseData);
        
        if (!expenseId) {
          throw new Error('Invalid expense ID for update');
        }
        
        // Use the correct key format for update
        const key = `expenses_${expenseId}`;
        await handleDataUpdate(key, expenseId, expenseData, 'expenses');
        
        // Update state with the new data
        const updatedExpense = { ...expenseData, $id: expenseId, id: expenseId };
        
        setExpenses(prev => prev.map(expense => 
          getExpenseId(expense) === expenseId ? updatedExpense : expense
        ));
        setFilteredExpenses(prev => prev.map(expense => 
          getExpenseId(expense) === expenseId ? updatedExpense : expense
        ));
        
        showToast('success', 'Success', 'Expense updated successfully');
      } else {
        const newExpense = await handleDataSubmit(expenseData, 'expenses');
        console.log('🔍 saveExpense - new expense created:', newExpense);
        
        // Ensure the new expense has consistent ID structure
        const expenseWithId = { 
          ...newExpense, 
          id: newExpense.$id || newExpense.id,
          $id: newExpense.$id || newExpense.id 
        };
        
        setExpenses(prev => [...prev, expenseWithId]);
        setFilteredExpenses(prev => [...prev, expenseWithId]);
        
        showToast('success', 'Success', 'Expense added successfully');
      }
      updateModal('add', false);
      updateSelected('isEdit', false);
      updateSelected('editExpense', null);
    } catch (error) {
      console.error('❌ Error saving expense:', error);
      showToast('error', 'Error', 'Failed to save expense');
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredExpenses(expenses);
  };

  // Stats calculations - compressed
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const topCategory = Object.entries(
    expenses.reduce((acc, expense) => {
      const cat = expense.category || 'other';
      acc[cat] = (acc[cat] || 0) + (parseFloat(expense.amount) || 0);
      return acc;
    }, {})
  ).sort(([,a], [,b]) => b - a)[0];

  // Calculate totals
  const calculateTotals = () => {
    const total = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const count = filteredExpenses.length;
    return { total, count };
  };

  const { total, count } = calculateTotals();

  // Effects
  useEffect(() => {
    fetchData();
    loadCategoryOptions();
  }, []);

  useFocusEffect(useCallback(() => {
    // Only refetch data when returning to the screen, not on initial load
    // This prevents double fetching on mount
    if (expenses.length > 0 && !isDeleting) {
      console.log('🔍 useFocusEffect - refetching data due to focus');
      fetchData();
    } else if (isDeleting) {
      console.log('🔍 useFocusEffect - skipping refetch due to ongoing delete operation');
    }
    // Always reload category options as they might have been updated
    loadCategoryOptions();
  }, [selected.deleteExpense, isDeleting]));

  // Remove header action button since we're using floating action button
  // useEffect(() => {
  //   setHeaderActionButton({ icon: 'add', onPress: handleAdd });
  //   return () => clearHeaderAction();
  // }, []);

  useEffect(() => {
    applySearch();
  }, [searchQuery, expenses]);

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
            onChangeText={setSearchQuery}
            placeholder="Search expenses..."
            onClear={() => setSearchQuery('')}
          />
        </View>
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
        isEditMode={selected.isEdit}
      />

      <ExpenseDetailsModal
        visible={modals.details}
        expense={selected.expense}
        onClose={() => { updateModal('details', false); updateSelected('expense', null); }}
        onEdit={() => { updateModal('details', false); handleEdit(selected.expense); }}
        onDelete={() => { updateModal('details', false); handleDelete(selected.expense); }}
      />

      <DeleteConfirmationModal
        visible={modals.delete}
        onConfirm={confirmDelete}
        onClose={() => { updateModal('delete', false); updateSelected('deleteExpense', null); }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
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
  statCard: { flex: 1, minHeight:70, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  fullCard: { flex: 0, width: '100%' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statContent: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  searchFilter: { flexDirection: 'row', alignItems: 'center', gap: 6 },

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default ExpensesManagementScreen;