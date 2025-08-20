import UserStorageTest from '@/components/UserStorageTest';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const TestVerificationPage = () => {
  return (
    <View style={styles.container}>
      <UserStorageTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestVerificationPage;

