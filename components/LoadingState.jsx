import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

const LoadingState = ({ text = "Loading..." }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.loadingText}>{String(text)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default LoadingState; 