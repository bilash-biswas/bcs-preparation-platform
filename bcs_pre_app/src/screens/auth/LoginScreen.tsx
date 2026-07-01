// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { login } from '../../store/slices/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false,
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে ব্যবহারকারীর নাম এবং পাসওয়ার্ড দিন');
      return;
    }

    try {
      await dispatch(login({ username, password })).unwrap();
    } catch (error: any) {
      Alert.alert(
        'লগইন ব্যর্থ',
        error?.message ||
          'ভুল ব্যবহারকারীর নাম বা পাসওয়ার্ড। আবার চেষ্টা করুন।',
      );
    }
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-200"
    >
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section with Gradient */}
        <View className="bg-gradient-to-b from-blue-600 to-blue-700 pt-16 pb-12 px-8 rounded-b-3xl">
          <View className="items-center">
            <View className="w-24 h-24 bg-white rounded-2xl items-center justify-center mb-6 shadow-2xl">
              <Icon name="school" size={40} color="#3b82f6" />
            </View>
            <Text className="text-3xl font-bold text-white mb-3 font-bengali">
              বিসিএস প্রস্তুতি
            </Text>
            <Text className="text-lg text-center text-blue-100 font-bengali leading-6">
              আপনার সফলতার যাত্রা শুরু করুন
            </Text>
          </View>
        </View>

        {/* Login Form */}
        <View className="flex-1 px-8 -mt-8">
          <View className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2 font-bengali">
              লগইন করুন
            </Text>
            <Text className="text-gray-500 text-center mb-8 font-bengali">
              আপনার অ্যাকাউন্টে অ্যাক্সেস করুন
            </Text>

            <View className="space-y-6">
              {/* Username Input */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-3 font-bengali">
                  ব্যবহারকারীর নাম
                </Text>
                <View
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-4 bg-white shadow-sm ${
                    isFocused.username
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon
                    name="person-outline"
                    size={20}
                    color={isFocused.username ? '#3b82f6' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
                    placeholder="আপনার ব্যবহারকারীর নাম লিখুন"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => handleFocus('username')}
                    onBlur={() => handleBlur('username')}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mt-3 mb-3 font-bengali">
                  পাসওয়ার্ড
                </Text>
                <View
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-4 bg-white shadow-sm ${
                    isFocused.password
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon
                    name="lock-closed-outline"
                    size={20}
                    color={isFocused.password ? '#3b82f6' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="self-end">
                <Text className="text-blue-600 mt-3 font-semibold text-sm font-bengali">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                className={`rounded-2xl py-4 mt-4 shadow-lg ${
                  isLoading || !username || !password
                    ? 'bg-gray-400'
                    : 'bg-blue-600' // Use solid color instead of gradient during loading
                }`}
                onPress={handleLogin}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text className="text-white font-bold text-lg ml-3 font-bengali">
                      লগইন হচ্ছে...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Icon name="log-in-outline" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2 font-bengali">
                      লগইন করুন
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500 text-sm font-bengali">
                  অথবা
                </Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Register Link */}
              <View className="flex-row justify-center">
                <Text className="text-gray-600 font-bengali">
                  অ্যাকাউন্ট নেই?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text className="text-blue-600 font-bold font-bengali">
                    রেজিস্টার করুন
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View className="mt-12 mb-8">
            <Text className="text-lg font-semibold text-gray-800 text-center mb-6 font-bengali">
              কেন আমাদের অ্যাপ ব্যবহার করবেন?
            </Text>

            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] items-center mb-6">
                <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-3">
                  <Icon name="book-outline" size={24} color="#3b82f6" />
                </View>
                <Text className="text-sm font-semibold text-gray-800 text-center font-bengali">
                  সমগ্র সিলেবাস
                </Text>
              </View>

              <View className="w-[48%] items-center mb-6">
                <View className="w-16 h-16 bg-green-100 rounded-2xl items-center justify-center mb-3">
                  <Icon name="stats-chart-outline" size={24} color="#10b981" />
                </View>
                <Text className="text-sm font-semibold text-gray-800 text-center font-bengali">
                  বিস্তারিত অ্যানালাইসিস
                </Text>
              </View>

              <View className="w-[48%] items-center">
                <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center mb-3">
                  <Icon name="time-outline" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-sm font-semibold text-gray-800 text-center font-bengali">
                  সময় ব্যবস্থাপনা
                </Text>
              </View>

              <View className="w-[48%] items-center">
                <View className="w-16 h-16 bg-orange-100 rounded-2xl items-center justify-center mb-3">
                  <Icon name="trophy-outline" size={24} color="#f59e0b" />
                </View>
                <Text className="text-sm font-semibold text-gray-800 text-center font-bengali">
                  সাফল্যের ট্র্যাকিং
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center pb-8">
            <Text className="text-gray-500 text-xs text-center font-bengali leading-5">
              বিসিএস পরীক্ষার জন্য সর্বোচ্চ প্রস্তুতি নিন
            </Text>
            <Text className="text-gray-500 text-xs text-center font-bengali leading-5">
              সম্পূর্ণ সিলেবাস, মক টেস্ট এবং এক্সপার্ট গাইডেন্স
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
