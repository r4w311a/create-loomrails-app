import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from './stores/useAuth';
import { Link } from 'react-router-dom';
// expo-router Link
import { Link as ExpoLink } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const handleRegister = async () => {
    if (!email || !password) return;
    setError('');
    try {
      await register(email, password);
    } catch (e) {
      setError('Failed to create account.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-slate-900"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-white mb-2">Create Account</Text>
          <Text className="text-base text-slate-400">Join LoomRails today</Text>
        </View>

        {error ? (
          <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        ) : null}

        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-slate-200 text-sm font-medium">Email</Text>
            <TextInput
              className="bg-white/5 border border-white/10 p-4 rounded-xl text-white text-base"
              placeholder="name@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="gap-2">
            <Text className="text-slate-200 text-sm font-medium">Password</Text>
            <TextInput
              className="bg-white/5 border border-white/10 p-4 rounded-xl text-white text-base"
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            className={`bg-emerald-500 p-4 rounded-xl items-center mt-2 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-slate-400 text-sm">Already have an account? </Text>
          <ExpoLink href="/login" asChild>
            <TouchableOpacity>
              <Text className="text-emerald-400 font-medium text-sm">Sign in</Text>
            </TouchableOpacity>
          </ExpoLink>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
