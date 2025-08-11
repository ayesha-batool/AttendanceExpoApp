import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';
import { ExpensesProvider, useExpensesContext } from '../../context/ExpensesContext';

const ExpensesManagementLayoutContent = () => {
  const { headerAction } = useExpensesContext();

  return (
    <View style={styles.container}>
      <PageHeader
        title="Expense Management"
        subtitle="Track & manage department expenses"
        icon="card"
        gradientColors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        showBackButton={true}
        actionButton={headerAction}
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
};

export default function ExpensesManagementLayout() {
  return (
    <ExpensesProvider>
      <ExpensesManagementLayoutContent />
    </ExpensesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 