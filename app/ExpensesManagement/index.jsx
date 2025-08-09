import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EmptyState from '../../components/EmptyState';
import ExpenseCard from '../../components/ExpenseCard';
import ExpenseDetailsModal from '../../components/ExpenseDetailsModal';
import ExpenseForm from '../../components/ExpenseForm';
import LoadingState from '../../components/LoadingState';
import SearchBar from '../../components/SearchBar';
import SelectDropdown from '../../components/SelectDropdown';
import { useExpensesContext } from '../../context/ExpensesContext';
import CustomOptionsService from '../../services/customOptionsService';
import { getItems, handleDataDelete, handleDataSubmit, handleDataUpdate } from '../../services/dataHandler';

const ExpensesManagementScreen = () => {
  const { setHeaderActionButton, clearHeaderAction } = useExpensesContext();
  
  // State management - compressed
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ department: '', category: '', dateRange: '' });
  const [modals, setModals] = useState({
    add: false, delete: false, details: false, filter: false
  });
  const [selected, setSelected] = useState({
    expense: null, editExpense: null, deleteExpense: null, isEdit: false
  });
  const [categoryOptions, setCategoryOptions] = useState([]);

  // Constants - compressed
  const departmentOptions = [
    { label: 'Patrol', value: 'patrol' }, { label: 'Investigation', value: 'investigation' },
    { label: 'Traffic', value: 'traffic' }, { label: 'Administration', value: 'administration' },
    { label: 'Training', value: 'training' }, { label: 'Equipment', value: 'equipment' }
  ];

  const dateRangeOptions = [
    { label: 'This Week', value: 'this_week' }, { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' }, { label: 'Last 3 Months', value: 'last_3_months' },
    { label: 'This Year', value: 'this_year' }
  ];

  // Sample data - compressed
  const sampleExpenses = [
    { title: 'Fuel for Patrol Vehicles', amount: 250.00, category: 'Fuel', department: 'Patrol', date: new Date().toISOString(), description: 'Monthly fuel expense', notes: 'Regular expense' },
    { title: 'New Equipment Purchase', amount: 1200.00, category: 'Equipment', department: 'Investigation', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'Investigation equipment', notes: 'One-time purchase' },
    { title: 'Training Workshop', amount: 500.00, category: 'Training', department: 'Administration', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), description: 'Officer training expenses', notes: 'Quarterly training' }
  ];

  // Utility functions - compressed
  const showToast = (type, text1, text2) => Toast.show({ type, text1, text2 });
  const updateModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));
  const updateSelected = (key, value) => setSelected(prev => ({ ...prev, [key]: value }));
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

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
      const expensesData = await getItems('expenses');
      const validExpenses = expensesData.filter(item => item && typeof item === 'object');
      
      if (validExpenses.length === 0) {
        for (const expense of sampleExpenses) {
          await handleDataSubmit(expense, 'expenses');
        }
        const updatedData = await getItems('expenses');
        const updatedValid = updatedData.filter(item => item && typeof item === 'object');
        setExpenses(updatedValid);
        setFilteredExpenses(updatedValid);
      } else {
        setExpenses(validExpenses);
        setFilteredExpenses(validExpenses);
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to load expenses data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic - compressed
  const applyFiltering = () => {
    let filtered = [...expenses];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        ['title', 'description', 'department', 'category', 'notes'].some(field =>
          expense[field]?.toLowerCase().includes(query)
        )
      );
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'dateRange') {
          filtered = filterByDateRange(filtered, value);
        } else {
          filtered = filtered.filter(expense => expense[key] === value);
        }
      }
    });
    
    setFilteredExpenses(filtered);
  };

  // Date filtering helper
  const filterByDateRange = (data, range) => {
    const now = new Date();
    const getDateFilter = () => {
      switch (range) {
        case 'this_week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'this_month': return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'last_month': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) };
        case 'last_3_months': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'this_year': return new Date(now.getFullYear(), 0, 1);
        default: return null;
      }
    };
    
    const filter = getDateFilter();
    if (!filter) return data;
    
    return data.filter(expense => {
      const expenseDate = new Date(expense.date);
      return filter.start ? 
        expenseDate >= filter.start && expenseDate <= filter.end :
        expenseDate >= filter;
    });
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
      const key = `expenses_${selected.deleteExpense.id || selected.deleteExpense.$id}`;
      await handleDataDelete(key, selected.deleteExpense.id || selected.deleteExpense.$id, 'expenses');
      setExpenses(prev => prev.filter(expense => (expense.id || expense.$id) !== (selected.deleteExpense.id || selected.deleteExpense.$id)));
      setFilteredExpenses(prev => prev.filter(expense => (expense.id || expense.$id) !== (selected.deleteExpense.id || selected.deleteExpense.$id)));
      showToast('success', 'Success', 'Expense deleted successfully');
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete expense');
    } finally {
      updateModal('delete', false);
      updateSelected('deleteExpense', null);
    }
  };

  const saveExpense = async (expenseData) => {
    try {
      if (selected.isEdit) {
        const key = `expenses_${expenseData.id || expenseData.$id}`;
        await handleDataUpdate(key, expenseData.id || expenseData.$id, expenseData, 'expenses');
        setExpenses(prev => prev.map(expense => (expense.id || expense.$id) === (expenseData.id || expenseData.$id) ? expenseData : expense));
        setFilteredExpenses(prev => prev.map(expense => (expense.id || expense.$id) === (expenseData.id || expenseData.$id) ? expenseData : expense));
        showToast('success', 'Success', 'Expense updated successfully');
      } else {
        const newExpense = await handleDataSubmit(expenseData, 'expenses');
        setExpenses(prev => [...prev, newExpense]);
        setFilteredExpenses(prev => [...prev, newExpense]);
        showToast('success', 'Success', 'Expense added successfully');
      }
      updateModal('add', false);
      updateSelected('isEdit', false);
      updateSelected('editExpense', null);
    } catch (error) {
      showToast('error', 'Error', 'Failed to save expense');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ department: '', category: '', dateRange: '' });
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

  // Effects
  useEffect(() => {
    fetchData();
    loadCategoryOptions();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchData();
    loadCategoryOptions();
  }, []));

  useEffect(() => {
    setHeaderActionButton({ icon: 'add', onPress: handleAdd });
    return () => clearHeaderAction();
  }, []);

  useEffect(() => {
    applyFiltering();
  }, [searchQuery, expenses, filters]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      {/* Stats Section - compressed */}
      <View style={styles.stats}>
        <View style={styles.statRow}>
          <StatCard icon="card" color="#8b5cf6" value={`$${totalExpenses.toLocaleString()}`} label="Total Expenses" />
          <StatCard icon="trending-up" color="#10b981" value={`$${filteredTotal.toLocaleString()}`} label="Filtered Total" />
        </View>
        <StatCard icon="analytics" color="#ef4444" value={topCategory ? topCategory[0].replace('_', ' ').toUpperCase() : 'N/A'} label="Top Category" full />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilter}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search expenses..."
          onClear={() => setSearchQuery('')}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => updateModal('filter', true)}>
          <Ionicons name="filter" size={25} color="#8b5cf6" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={searchQuery || Object.values(filters).some(f => f) ? 'No Expenses Found' : 'No Expenses'}
          message={searchQuery || Object.values(filters).some(f => f) ? 'Try adjusting your search or filters' : 'Start by adding your first expense'}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id || item.$id}
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

      {/* Filter Modal */}
      <Modal visible={modals.filter} animationType="slide" transparent onRequestClose={() => updateModal('filter', false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Expenses</Text>
              <TouchableOpacity onPress={() => updateModal('filter', false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <SelectDropdown label="Department" selectedValue={filters.department} onValueChange={(value) => updateFilter('department', value)} options={departmentOptions} />
              <SelectDropdown label="Category" selectedValue={filters.category} onValueChange={(value) => updateFilter('category', value)} options={categoryOptions} />
              <SelectDropdown label="Date Range" selectedValue={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)} options={dateRangeOptions} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => { applyFiltering(); updateModal('filter', false); }}>
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.applyGradient}>
                  <Text style={styles.applyText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        onCancel={() => { updateModal('delete', false); updateSelected('deleteExpense', null); }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
      />
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
    paddingHorizontal: 20, // keep left/right space
    paddingVertical: 10,    // remove extra top/bottom space
    gap: 6,

height:187,
    alignContent: 'stretch'  // ensures cards fill vertically
  },
  statRow: { 
    flexDirection: 'row',
    gap: 6
  },
  statRow: { flexDirection: 'row', gap: 6 },
  statCard: { flex: 1, minHeight:70, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  fullCard: { flex: 0, width: '100%' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statContent: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  searchFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 6 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6', marginLeft: 6 ,minWidth:55},
  list: { padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '90%', maxHeight: '80%', padding: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  modalBody: { flex: 1, padding: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
  clearBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6b7280', alignItems: 'center' },
  clearText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 1, borderRadius: 12 },
  applyGradient: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default ExpensesManagementScreen;