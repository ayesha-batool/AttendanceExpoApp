import { Stack } from 'expo-router';

const EmployeeDocumentsLayout = () => (
  <Stack screenOptions={{
    headerTitle: 'Employee Documents',
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: '#f5f6fa' },
    headerTintColor: '#34495e',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
  }} />
);

export default EmployeeDocumentsLayout; 