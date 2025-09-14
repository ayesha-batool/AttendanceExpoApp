import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import PageHeader from '../../components/PageHeader';


const EmployeeLayoutContent = () => {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <PageHeader 
        title="Employee Management" 
        icon="people"
        gradientColors={['#3b82f6', '#1d4ed8', '#1e40af']}
        showBackButton={true}
        onIconPress={() => router.back()}
      />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Employees',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default EmployeeLayoutContent; 