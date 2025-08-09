import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageHeader from '../../components/PageHeader';
import { CasesProvider, useCasesContext } from '../../context/CasesContext';

const CasesLayoutContent = () => {
  const { headerAction } = useCasesContext();

  return (
    <View style={styles.container}>
      <PageHeader
        title="Case Management"
        subtitle="Track investigations & manage cases"
        icon="folder-open"
        gradientColors={['#dc2626', '#b91c1c', '#991b1b']}
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

export default function CasesLayout() {
  return (
    <CasesProvider>
      <CasesLayoutContent />
    </CasesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 