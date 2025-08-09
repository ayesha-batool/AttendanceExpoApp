import { Stack } from 'expo-router';

const FleetManagementLayout = () => (
  <Stack screenOptions={{
    headerTitle: 'Fleet Management',
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: '#007AFF' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
  }} />
);

export default FleetManagementLayout; 