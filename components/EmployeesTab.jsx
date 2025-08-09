import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AddButton from './AddButton';
import EmployeeCard from './EmployeeCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SearchBar from './SearchBar';
import SummaryCard from './SummaryCard';

const EmployeesTab = ({ 
  employees, 
  isLoading, 
  searchQuery, 
  onSearchChange, 
  onAddEmployee, 
  onEmployeePress, 
  onEditEmployee, 
  onDeleteEmployee 
}) => {
  return (
    <View style={styles.tabContent}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <SummaryCard 
          icon="people-outline" 
          label="Total Employees" 
          value={employees.length}
          colors={['#667eea', '#764ba2']}
        />
        <SummaryCard 
          icon="person-add-outline" 
          label="Active" 
          value={employees.filter(item => item.status !== 'inactive').length}
          colors={['#f093fb', '#f5576c']}
        />
      </View>

      {/* Search Bar */}
      <SearchBar 
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="🔍 Search employees..."
      />

      {/* Add Employee Button */}
      <AddButton 
        onPress={onAddEmployee}
        text="Add New Employee"
        icon="add-circle"
      />

      {/* Employee List */}
      {isLoading ? (
        <LoadingState text="Loading employees..." />
      ) : employees.length === 0 ? (
        <EmptyState 
          icon="people-outline"
          title={searchQuery ? 'No Employees Found' : 'No Employees'}
          subtitle={searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first employee'}
        />
      ) : (
        <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
          {employees.map((employee, index) => {
            const key = employee.id || employee.$id || index;
            return (
              <EmployeeCard
                key={key}
                employee={employee}
                onPress={onEmployeePress}
                onEdit={onEditEmployee}
                onDelete={onDeleteEmployee}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  employeeList: {
    flex: 1,
  },
});

export default EmployeesTab; 