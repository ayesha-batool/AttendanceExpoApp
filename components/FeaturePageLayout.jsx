import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const FeaturePageLayout = ({ title, buttonText, onButtonPress }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Button title={buttonText} onPress={onButtonPress} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});

export default FeaturePageLayout; 