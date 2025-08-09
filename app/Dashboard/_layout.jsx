import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // adjust path if needed

const DashboardLayout = () => {
  const { currentUser } = useAuth();
  
  // Get the username from the authenticated user
  const username = currentUser?.user?.username || currentUser?.username;
  
  // Extract initials from the authenticated username
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2); // Limit to 2 characters
  };

  const userInitials = getInitials(username);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the header completely to avoid duplication
      }}
    />
  );
};

export default DashboardLayout;
