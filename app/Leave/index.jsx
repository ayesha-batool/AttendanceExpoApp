import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LeaveScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Holidays page which handles both holidays and leave
    router.replace('/Holidays');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to Leave Management...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    fontSize: 16,
    color: '#6c757d',
  },
}); 