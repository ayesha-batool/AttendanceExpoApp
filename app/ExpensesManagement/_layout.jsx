import { Stack } from 'expo-router';
import { View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const ExpensesLayoutContent = () => {
  return (
    <View style={{ flex: 1 }}>
      <PageHeader 
        title="Expenses Management" 
        icon="card"
        gradientColors={['#10b981', '#059669']}
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