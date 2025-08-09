import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const LeaveManagementLayout = () => {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Leave Management"
        subtitle="Manage employee leaves & holidays"
        icon="calendar"
        gradientColors={['#f59e0b', '#d97706', '#b45309']}
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

export default LeaveManagementLayout; 