import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import PageHeader from '../../components/PageHeader';
const router = useRouter();
const ExpensesLayoutContent = () => {
  return (
    <View style={{ flex: 1 }}>
      <PageHeader 
        title="Expenses Management" 
        icon="card"
        gradientColors={['#10b981', '#059669']}
        showBackButton={true}
        onIconPress={() => router.back()}
      />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Expenses',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default ExpensesLayoutContent; 