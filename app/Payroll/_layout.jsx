import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const PayrollLayout = () => {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Payroll Management"
        subtitle="Manage salaries & payments"
        icon="cash"
        gradientColors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        showBackButton={true}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PayrollLayout; 