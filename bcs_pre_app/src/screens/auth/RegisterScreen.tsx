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
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { register } from '../../store/slices/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const { width, height } = Dimensions.get('window');

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
      className="flex-1 bg-gray-200"
    >
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section with Gradient */}
        <View className="bg-gradient-to-b from-blue-600 to-blue-700 pt-16 pb-8 px-8 rounded-b-3xl">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="absolute top-16 left-8 z-10"
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="items-center">
            <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-4 shadow-2xl">
              <Icon name="person-add" size={32} color="#3b82f6" />
            </View>
            <Text className="text-xl font-bold text-blue-500 mb-2 font-bengali">
              নতুন অ্যাকাউন্ট
            </Text>
            <Text className="text-base text-center text-blue-400 font-bengali leading-5">
              হাজারো বিসিএস প্রার্থীর সাথে যুক্ত হোন
            </Text>
          </View>
        </View>

        {/* Registration Form */}
        <View className="flex-1 px-6 -mt-6">
          <View className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
            <View className="space-y-5">
              {/* Name Row */}
              <View className="flex-row space-x-3 gap-1">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2 font-bengali">
                    নাম
                  </Text>
                  <View 
                    className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                      isFocused.first_name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <Icon 
                      name="person-outline" 
                      size={18} 
                      color={isFocused.first_name ? '#3b82f6' : '#9CA3AF'} 
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800 text-base font-bengali"
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
                  <Text className="text-sm font-semibold text-gray-700 mb-2 font-bengali">
                    উপাধি
                  </Text>
                  <View 
                    className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                      isFocused.last_name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-gray-800 text-base font-bengali"
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
                <Text className="text-sm font-semibold text-gray-700 mt-2 mb-2 font-bengali">
                  ব্যবহারকারীর নাম *
                </Text>
                <View 
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                    isFocused.username 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <Icon 
                    name="at-outline" 
                    size={18} 
                    color={isFocused.username ? '#3b82f6' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
                    placeholder="একটি ব্যবহারকারীর নাম নির্বাচন করুন"
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
                <Text className="text-sm font-semibold text-gray-700 mt-2 mb-2 font-bengali">
                  ইমেইল ঠিকানা *
                </Text>
                <View 
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                    isFocused.email 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <Icon 
                    name="mail-outline" 
                    size={18} 
                    color={isFocused.email ? '#3b82f6' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
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
                <Text className="text-sm font-semibold text-gray-700 mt-2 mb-2 font-bengali">
                  পাসওয়ার্ড *
                </Text>
                <View 
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                    isFocused.password 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <Icon 
                    name="lock-closed-outline" 
                    size={18} 
                    color={isFocused.password ? '#3b82f6' : '#9CA3AF'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
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
                <Text className="text-xs text-gray-500 mt-2 font-bengali">
                  পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে
                </Text>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2 font-bengali">
                  পাসওয়ার্ড নিশ্চিত করুন *
                </Text>
                <View 
                  className={`flex-row items-center border-2 rounded-2xl px-4 py-3 bg-white ${
                    isFocused.password2 
                      ? 'border-blue-500 bg-blue-50' 
                      : formData.password2 && formData.password !== formData.password2
                      ? 'border-red-500 bg-red-50'
                      : formData.password2 && formData.password === formData.password2
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon 
                    name="lock-closed-outline" 
                    size={18} 
                    color={
                      isFocused.password2 
                        ? '#3b82f6' 
                        : formData.password2 && formData.password !== formData.password2
                        ? '#ef4444'
                        : formData.password2 && formData.password === formData.password2
                        ? '#10b981'
                        : '#9CA3AF'
                    } 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 text-gray-800 text-base font-bengali"
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
                  <Text className="text-xs text-red-500 mt-2 font-bengali">
                    পাসওয়ার্ড মিলছে না
                  </Text>
                )}
                {formData.password2 && formData.password === formData.password2 && (
                  <Text className="text-xs text-green-500 mt-2 font-bengali">
                    পাসওয়ার্ড মিলেছে
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`rounded-2xl py-4 mt-4 shadow-lg ${
                  isLoading || !isFormValid
                    ? 'bg-gray-400' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600'
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
              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600 font-bengali">ইতিমধ্যে অ্যাকাউন্ট আছে? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-blue-600 font-bold font-bengali">লগইন করুন</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Benefits Section */}
          <View className="mt-8 mb-6">
            <Text className="text-lg font-semibold text-gray-800 text-center mb-4 font-bengali">
              আপনার অ্যাকাউন্ট তৈরি করলে যা পাবেন:
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center bg-blue-50 rounded-2xl p-4 mb-2">
                <Icon name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-gray-700 ml-3 flex-1 font-bengali">
                  সম্পূর্ণ সিলেবাসের অ্যাক্সেস
                </Text>
              </View>
              
              <View className="flex-row items-center bg-green-50 rounded-2xl p-4 mb-2">
                <Icon name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-gray-700 ml-3 flex-1 font-bengali">
                  অসংখ্য মক টেস্ট ও প্র্যাকটিস সেশন
                </Text>
              </View>
              
              <View className="flex-row items-center bg-purple-50 rounded-2xl p-4 mb-2">
                <Icon name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-gray-700 ml-3 flex-1 font-bengali">
                  পারফরম্যান্স ট্র্যাকিং ও বিশ্লেষণ
                </Text>
              </View>
              
              <View className="flex-row items-center bg-orange-50 rounded-2xl p-4">
                <Icon name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-gray-700 ml-3 flex-1 font-bengali">
                  এক্সপার্ট গাইডেন্স ও স্টাডি মেটেরিয়াল
                </Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <View className="mt-4 pb-8">
            <Text className="text-xs text-gray-500 text-center font-bengali leading-4">
              অ্যাকাউন্ট তৈরি করার মাধ্যমে আপনি আমাদের পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতি মেনে নিচ্ছেন
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;