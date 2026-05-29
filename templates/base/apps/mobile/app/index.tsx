import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../stores/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-200">
        <Text className="text-xl font-bold text-indigo-600">LoomRails</Text>
        <TouchableOpacity 
          className="px-4 py-2 border border-slate-300 rounded-lg"
          onPress={() => logout()}
        >
          <Text className="text-slate-500 font-medium">Sign out</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-6">
        <View className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <Text className="text-2xl font-bold text-slate-900 mb-2">Welcome, {user?.email}</Text>
          <Text className="text-base text-slate-500 mb-8">
            You have successfully authenticated via JWT SecureStore.
          </Text>
          
          <View className="flex-row gap-4">
            <View className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <Text className="text-xl font-bold text-indigo-600 mb-1">JSON</Text>
              <Text className="text-sm text-slate-500 font-medium">Delivery</Text>
            </View>
            <View className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <Text className="text-xl font-bold text-indigo-600 mb-1">Bearer</Text>
              <Text className="text-sm text-slate-500 font-medium">Strategy</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
