import { Stack } from 'expo-router';

const LeaveLayout = () => (
  <Stack screenOptions={{
    headerShown: false, // Hide header since we're redirecting
  }} />
);

export default LeaveLayout; 