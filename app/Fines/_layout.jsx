import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const FinesLayout = () => {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Fines Management"
        subtitle="Track & manage employee fines"
        icon="warning"
        gradientColors={['#dc2626', '#b91c1c', '#991b1b']}
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

export default FinesLayout; 