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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { login } from '../../store/slices/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

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
  const { isDark } = useAppTheme();

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
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <StatusBar 
        backgroundColor={isDark ? "#020617" : "#7c3aed"} 
        barStyle="light-content" 
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section with Custom Gradient Style */}
        <View className="bg-primary-600 dark:bg-primary-950 pt-20 pb-16 px-8 rounded-b-[40px] items-center shadow-lg">
          <View 
            className="w-20 h-20 bg-white/10 dark:bg-slate-900/40 rounded-3xl items-center justify-center mb-6 border border-white/20"
            style={{
              elevation: 4,
            }}
          >
            <Icon name="school" size={40} className="text-white" />
          </View>
          <Text className="text-3xl font-extrabold text-white mb-2 font-bengali">
            বিসিএস প্রস্তুতি
          </Text>
          <Text className="text-base text-center text-primary-100 dark:text-primary-300 font-bengali leading-6">
            আপনার সফলতার যাত্রা শুরু করুন
          </Text>
        </View>

        {/* Login Form Panel */}
        <View className="flex-1 px-6 -mt-10">
          <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800/80">
            <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-1 font-bengali">
              লগইন করুন
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-center mb-6 font-bengali text-sm">
              আপনার অ্যাকাউন্টে অ্যাক্সেস করুন
            </Text>

            <View className="space-y-5">
              {/* Username Input */}
              <View>
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                  ব্যবহারকারীর নাম
                </Text>
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 ${
                    isFocused.username
                      ? 'border-primary-500 bg-white dark:bg-slate-950'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon
                    name="person-outline"
                    size={20}
                    color={isFocused.username ? '#7c3aed' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
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
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-2 mb-2 font-bengali">
                  পাসওয়ার্ড
                </Text>
                <View
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 ${
                    isFocused.password
                      ? 'border-primary-500 bg-white dark:bg-slate-950'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon
                    name="lock-closed-outline"
                    size={20}
                    color={isFocused.password ? '#7c3aed' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
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
              <TouchableOpacity className="self-end mt-1">
                <Text className="text-primary-600 dark:text-primary-400 font-semibold text-sm font-bengali">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                className={`rounded-2xl py-4 mt-6 shadow-md ${
                  isLoading || !username || !password
                    ? 'bg-slate-300 dark:bg-slate-800'
                    : 'bg-primary-600 dark:bg-primary-500'
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
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <Text className="mx-4 text-slate-400 dark:text-slate-500 text-xs font-bengali">
                  অথবা
                </Text>
                <View className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </View>

              {/* Register Link */}
              <View className="flex-row justify-center pb-2">
                <Text className="text-slate-500 dark:text-slate-400 font-bengali">
                  অ্যাকাউন্ট নেই?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text className="text-primary-600 dark:text-primary-400 font-extrabold font-bengali">
                    রেজিস্টার করুন
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features Grid */}
          <View className="mt-8 mb-6">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-200 text-center mb-6 font-bengali">
              কেন আমাদের অ্যাপ ব্যবহার করবেন?
            </Text>

            <View className="flex-row flex-wrap justify-between">
              <View className="w-[47%] items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4 shadow-sm">
                <View className="w-12 h-12 bg-primary-100 dark:bg-primary-950/40 rounded-xl items-center justify-center mb-3">
                  <Icon name="book-outline" size={22} className="text-primary-600 dark:text-primary-400" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center font-bengali">
                  সমগ্র সিলেবাস
                </Text>
              </View>

              <View className="w-[47%] items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4 shadow-sm">
                <View className="w-12 h-12 bg-secondary-100 dark:bg-secondary-950/40 rounded-xl items-center justify-center mb-3">
                  <Icon name="stats-chart-outline" size={22} className="text-secondary-600 dark:text-secondary-400" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center font-bengali">
                  বিশ্লেষণ
                </Text>
              </View>

              <View className="w-[47%] items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4 shadow-sm">
                <View className="w-12 h-12 bg-purple-100 dark:bg-purple-950/40 rounded-xl items-center justify-center mb-3">
                  <Icon name="time-outline" size={22} className="text-purple-600 dark:text-purple-400" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center font-bengali">
                  সময় ব্যবস্থাপনা
                </Text>
              </View>

              <View className="w-[47%] items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4 shadow-sm">
                <View className="w-12 h-12 bg-accent-100 dark:bg-accent-950/40 rounded-xl items-center justify-center mb-3">
                  <Icon name="trophy-outline" size={22} className="text-accent-600 dark:text-accent-400" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center font-bengali">
                  সাফল্য ট্র্যাকিং
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="my-4 items-center pb-8">
            <Text className="text-slate-400 dark:text-slate-500 text-xs text-center font-bengali leading-5">
              বিসিএস পরীক্ষার জন্য সর্বোচ্চ প্রস্তুতি নিন
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs text-center font-bengali leading-5">
              সম্পূর্ণ সিলেবাস, মক টেস্ট এবং এক্সপার্ট গাইডেন্স
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
