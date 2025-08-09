import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const PayrollLayout = () => {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Overtime Management"
        subtitle="Track & manage overtime hours"
        icon="time"
        gradientColors={['#ef4444', '#dc2626', '#b91c1c']}
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