// src/screens/auth/RegisterScreen.tsx
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
import { register } from '../../store/slices/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    email: false,
    password: false,
    password2: false,
    first_name: false,
    last_name: false,
  });
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const { isDark } = useAppTheme();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি ব্যবহারকারীর নাম দিন');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি ইমেইল ঠিকানা দিন');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি বৈধ ইমেইল ঠিকানা দিন');
      return false;
    }
    if (!formData.password) {
      Alert.alert('ত্রুটি', 'দয়া করে একটি পাসওয়ার্ড দিন');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('ত্রুটি', 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে');
      return false;
    }
    if (formData.password !== formData.password2) {
      Alert.alert('ত্রুটি', 'পাসওয়ার্ড মিলছে না');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(register(formData)).unwrap();
      Alert.alert(
        'সফল',
        'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! লগইন করতে এগিয়ে যান।',
        [{ text: 'ঠিক আছে', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert(
        'রেজিস্ট্রেশন ব্যর্থ',
        error?.message || 'রেজিস্ট্রেশনের সময় একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।'
      );
    }
  };

  const isFormValid = formData.username && formData.email && formData.password && formData.password2;

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
        {/* Header Section with Back Arrow */}
        <View className="bg-primary-600 dark:bg-primary-950 pt-20 pb-12 px-8 rounded-b-[40px] items-center shadow-lg">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="absolute top-16 left-6 z-10 p-2 rounded-full bg-white/10 dark:bg-slate-900/40"
          >
            <Icon name="arrow-back" size={24} className="text-white" />
          </TouchableOpacity>
          
          <View 
            className="w-16 h-16 bg-white/10 dark:bg-slate-900/40 rounded-2xl items-center justify-center mb-4 border border-white/20"
          >
            <Icon name="person-add" size={32} className="text-white" />
          </View>
          <Text className="text-2xl font-extrabold text-white mb-1 font-bengali">
            নতুন অ্যাকাউন্ট
          </Text>
          <Text className="text-sm text-center text-primary-100 dark:text-primary-300 font-bengali leading-5">
            হাজারো বিসিএস প্রার্থীর সাথে যুক্ত হোন
          </Text>
        </View>

        {/* Registration Form Panel */}
        <View className="flex-1 px-6 -mt-8">
          <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800/80">
            <View className="space-y-4">
              {/* Name Row */}
              <View className="flex-row space-x-3 gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                    নাম
                  </Text>
                  <View 
                    className={`flex-row items-center border rounded-2xl px-3 py-3 bg-slate-50 dark:bg-slate-950 ${
                      isFocused.first_name 
                        ? 'border-primary-500 bg-white dark:bg-slate-950' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                      placeholder="আপনার নাম"
                      placeholderTextColor="#9CA3AF"
                      value={formData.first_name}
                      onChangeText={(value) => handleInputChange('first_name', value)}
                      onFocus={() => handleFocus('first_name')}
                      onBlur={() => handleBlur('first_name')}
                    />
                  </View>
                </View>
                
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                    উপাধি
                  </Text>
                  <View 
                    className={`flex-row items-center border rounded-2xl px-3 py-3 bg-slate-50 dark:bg-slate-950 ${
                      isFocused.last_name 
                        ? 'border-primary-500 bg-white dark:bg-slate-950' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                      placeholder="আপনার উপাধি"
                      placeholderTextColor="#9CA3AF"
                      value={formData.last_name}
                      onChangeText={(value) => handleInputChange('last_name', value)}
                      onFocus={() => handleFocus('last_name')}
                      onBlur={() => handleBlur('last_name')}
                    />
                  </View>
                </View>
              </View>

              {/* Username */}
              <View>
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                  ব্যবহারকারীর নাম *
                </Text>
                <View 
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 ${
                    isFocused.username 
                      ? 'border-primary-500 bg-white dark:bg-slate-950' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon 
                    name="at-outline" 
                    size={18} 
                    color={isFocused.username ? '#7c3aed' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                    placeholder="ব্যবহারকারীর নাম নির্বাচন করুন"
                    placeholderTextColor="#9CA3AF"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    onFocus={() => handleFocus('username')}
                    onBlur={() => handleBlur('username')}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                  ইমেইল ঠিকানা *
                </Text>
                <View 
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 ${
                    isFocused.email 
                      ? 'border-primary-500 bg-white dark:bg-slate-950' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon 
                    name="mail-outline" 
                    size={18} 
                    color={isFocused.email ? '#7c3aed' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                    placeholder="আপনার ইমেইল ঠিকানা"
                    placeholderTextColor="#9CA3AF"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                  পাসওয়ার্ড *
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
                    size={18} 
                    color={isFocused.password ? '#7c3aed' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                    placeholder="একটি পাসওয়ার্ড তৈরি করুন"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    <Icon 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={18} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bengali">
                  পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে
                </Text>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 font-bengali">
                  পাসওয়ার্ড নিশ্চিত করুন *
                </Text>
                <View 
                  className={`flex-row items-center border rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 ${
                    isFocused.password2 
                      ? 'border-primary-500 bg-white dark:bg-slate-950' 
                      : formData.password2 && formData.password !== formData.password2
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : formData.password2 && formData.password === formData.password2
                      ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon 
                    name="lock-closed-outline" 
                    size={18} 
                    color={
                      isFocused.password2 
                        ? '#7c3aed' 
                        : formData.password2 && formData.password !== formData.password2
                        ? '#ef4444'
                        : formData.password2 && formData.password === formData.password2
                        ? '#12b886'
                        : '#9CA3AF'
                    } 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-slate-800 dark:text-slate-100 text-base font-bengali"
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password2}
                    onChangeText={(value) => handleInputChange('password2', value)}
                    onFocus={() => handleFocus('password2')}
                    onBlur={() => handleBlur('password2')}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-2"
                  >
                    <Icon 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={18} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
                {formData.password2 && formData.password !== formData.password2 && (
                  <Text className="text-xs text-red-500 mt-1 font-bengali">
                    পাসওয়ার্ড মিলছে না
                  </Text>
                )}
                {formData.password2 && formData.password === formData.password2 && (
                  <Text className="text-xs text-secondary-500 mt-1 font-bengali">
                    পাসওয়ার্ড মিলেছে
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`rounded-2xl py-4 mt-6 shadow-md ${
                  isLoading || !isFormValid
                    ? 'bg-slate-300 dark:bg-slate-800' 
                    : 'bg-primary-600 dark:bg-primary-500'
                }`}
                onPress={handleRegister}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-lg ml-3 font-bengali">
                      অ্যাকাউন্ট তৈরি হচ্ছে...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Icon name="person-add-outline" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2 font-bengali">
                      অ্যাকাউন্ট তৈরি করুন
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center mt-4">
                <Text className="text-slate-500 dark:text-slate-400 font-bengali">ইতিমধ্যে অ্যাকাউন্ট আছে? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-primary-600 dark:text-primary-400 font-extrabold font-bengali">লগইন করুন</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Benefits Section */}
          <View className="mt-8 mb-6">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-200 text-center mb-4 font-bengali">
              অ্যাকাউন্ট তৈরি করলে যা পাবেন:
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-2 shadow-sm">
                <Icon name="checkmark-circle" size={20} className="text-secondary-600 dark:text-secondary-500" />
                <Text className="text-slate-700 dark:text-slate-300 ml-3 flex-1 font-bengali text-sm">
                  সম্পূর্ণ সিলেবাসের অ্যাক্সেস
                </Text>
              </View>
              
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-2 shadow-sm">
                <Icon name="checkmark-circle" size={20} className="text-secondary-600 dark:text-secondary-500" />
                <Text className="text-slate-700 dark:text-slate-300 ml-3 flex-1 font-bengali text-sm">
                  অসংখ্য মক টেস্ট ও প্র্যাকটিস সেশন
                </Text>
              </View>
              
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-2 shadow-sm">
                <Icon name="checkmark-circle" size={20} className="text-secondary-600 dark:text-secondary-500" />
                <Text className="text-slate-700 dark:text-slate-300 ml-3 flex-1 font-bengali text-sm">
                  পারফরম্যান্স ট্র্যাকিং ও বিশ্লেষণ
                </Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <View className="mt-4 pb-8">
            <Text className="text-xs text-slate-400 dark:text-slate-500 text-center font-bengali leading-4">
              অ্যাকাউন্ট তৈরি করার মাধ্যমে আপনি আমাদের পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতি মেনে নিচ্ছেন
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;