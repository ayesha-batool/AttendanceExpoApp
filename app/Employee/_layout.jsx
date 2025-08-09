import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';
import { EmployeeProvider, useEmployeeContext } from '../../context/EmployeeContext';

const EmployeeLayoutContent = () => {
  const { headerAction } = useEmployeeContext();

  return (
    <View style={styles.container}>
      <PageHeader
        title="Team Management"
        subtitle="Manage officers & track attendance"
        icon="people"
        gradientColors={['#3b82f6', '#2563eb', '#1d4ed8']}
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

export default function EmployeeLayout() {
  return (
    <EmployeeProvider>
      <EmployeeLayoutContent />
    </EmployeeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 