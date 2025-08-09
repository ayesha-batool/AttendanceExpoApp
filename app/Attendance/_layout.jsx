import { Stack } from 'expo-router';

const AttendanceLayout = () => (
  <Stack screenOptions={{
    headerTitle: 'Attendance',
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: '#f5f6fa' },
    headerTintColor: '#34495e',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 24 },
  }} />
);

export default AttendanceLayout; 