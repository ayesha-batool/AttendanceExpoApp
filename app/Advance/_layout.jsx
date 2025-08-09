import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const AdvanceLayout = () => {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Advance Management"
        subtitle="Manage salary advances"
        icon="card"
        gradientColors={['#3b82f6', '#2563eb', '#1d4ed8']}
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

export default AdvanceLayout; 