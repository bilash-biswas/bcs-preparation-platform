import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import AuthService from '../../services/authService';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword.trim()) {
      Alert.alert('ত্রুটি', 'পুরাতন পাসওয়ার্ড প্রয়োজন');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('ত্রুটি', 'নতুন পাসওয়ার্ড প্রয়োজন');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('ত্রুটি', 'নতুন পাসওয়ার্ড অবশ্যই কমপক্ষে ৮ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('ত্রুটি', 'নতুন পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মেলেনি');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setIsLoading(false);
      Alert.alert('সফল', 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', [
        { text: 'ঠিক আছে', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      console.log('Password change error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.error || 
                       error?.response?.data?.new_password?.[0] || 
                       error?.response?.data?.non_field_errors?.[0] || 
                       'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে। পুরাতন পাসওয়ার্ড সঠিক কিনা তা পুনরায় যাচাই করুন।';
      Alert.alert('ত্রুটি', errorMsg);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    onToggleShow,
    showPassword,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry: boolean;
    onToggleShow: () => void;
    showPassword: boolean;
  }) => (
    <View className="mb-5">
      <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-2 font-bengali">
        {label}
      </Text>
      <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
        <Icon name="key-outline" size={18} className="text-slate-400 mr-2.5" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          className="flex-1 py-3 font-bengali text-slate-850 dark:text-slate-100 text-sm"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggleShow} className="p-1">
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar
        backgroundColor={isDark ? "#0f172a" : "#ffffff"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header Bar */}
      <View className="px-6 py-4 flex-row items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/20 mr-4"
        >
          <Icon name="arrow-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali">
            পাসওয়ার্ড পরিবর্তন
          </Text>
          <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
            নিরাপদ পাসওয়ার্ড ব্যবহারের জন্য আপডেট করুন
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <InputField
          label="পুরাতন পাসওয়ার্ড"
          value={formData.oldPassword}
          onChangeText={(text) => setFormData({ ...formData, oldPassword: text })}
          placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
          secureTextEntry={!showOld}
          onToggleShow={() => setShowOld(!showOld)}
          showPassword={showOld}
        />

        <InputField
          label="নতুন পাসওয়ার্ড"
          value={formData.newPassword}
          onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
          placeholder="কমপক্ষে ৮ অক্ষরের নতুন পাসওয়ার্ড"
          secureTextEntry={!showNew}
          onToggleShow={() => setShowNew(!showNew)}
          showPassword={showNew}
        />

        <InputField
          label="নতুন পাসওয়ার্ড নিশ্চিত করুন"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
          secureTextEntry={!showConfirm}
          onToggleShow={() => setShowConfirm(!showConfirm)}
          showPassword={showConfirm}
        />

        {/* Info card */}
        <View className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start mb-2">
            <Icon name="information-circle-outline" size={16} color="#7c3aed" className="mr-2 mt-0.5" />
            <Text className="text-xs font-extrabold text-primary-700 dark:text-primary-400 font-bengali flex-1">
              পাসওয়ার্ড সুরক্ষার পরামর্শ:
            </Text>
          </View>
          <Text className="text-[10px] text-primary-600 dark:text-primary-400 font-bengali leading-4 pl-6">
            ১. পাসওয়ার্ডটি কমপক্ষে ৮টি অক্ষরের হতে হবে।{'\n'}
            ২. সুরক্ষিত করতে ইংরেজি বড় হাতের অক্ষর (A-Z), ছোট হাতের অক্ষর (a-z), সংখ্যা (0-9) এবং বিশেষ চিহ্ন (যেমন- @, #, $, %) ব্যবহার করুন।{'\n'}
            ৩. আপনার অ্যাকাউন্টের সুরক্ষার জন্য পাসওয়ার্ড কারো সাথে শেয়ার করা থেকে বিরত থাকুন।
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className="bg-primary-600 dark:bg-primary-500 rounded-2xl py-4 flex-row justify-center items-center shadow-md mb-10"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="shield-checkmark-outline" size={18} color="white" className="mr-2" />
              <Text className="text-white font-extrabold text-sm font-bengali">
                পাসওয়ার্ড পরিবর্তন করুন
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;