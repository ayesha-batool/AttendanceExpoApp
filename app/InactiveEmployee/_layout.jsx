import { Stack } from 'expo-router';

const InactiveEmployeeLayout = () => (
  <Stack screenOptions={{
    headerTitle: 'Inactive Employees',
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: '#f5f6fa' },
    headerTintColor: '#34495e',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
  }} />
);

export default InactiveEmployeeLayout; 