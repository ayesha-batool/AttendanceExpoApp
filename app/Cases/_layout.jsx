import { Stack } from 'expo-router';
import { View } from 'react-native';
import PageHeader from '../../components/PageHeader';

const CasesLayoutContent = () => {
  return (
    <View style={{ flex: 1 }}>
      <PageHeader 
        title="Cases Management" 
        icon="document-text"
        gradientColors={['#ef4444', '#dc2626']}
        showBackButton={true}
      />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Cases',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default CasesLayoutContent; 