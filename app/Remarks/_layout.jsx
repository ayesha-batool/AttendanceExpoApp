import { Stack } from 'expo-router';

const RemarksLayout = () => (
  <Stack screenOptions={{
    headerTitle: 'Remarks',
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: '#f5f6fa' },
    headerTintColor: '#34495e',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
  }} />
);

export default RemarksLayout; 