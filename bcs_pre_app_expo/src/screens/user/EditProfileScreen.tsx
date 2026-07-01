// src/screens/user/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons as Icon } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { useAppTheme } from '../../context/ThemeContext';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<any, 'EditProfile'>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark } = useAppTheme();

  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('ত্রুটি', 'নাম প্রয়োজন');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('ত্রুটি', 'ইমেইল প্রয়োজন');
      return;
    }

    setIsLoading(true);
    // Simulate updating profile
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('সফল', 'প্রোফাইল আপডেট করা হয়েছে', [
        { text: 'ঠিক আছে', onPress: () => navigation.goBack() }
      ]);
    }, 600);
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    multiline = false 
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string;
    multiline?: boolean;
  }) => (
    <View className="mb-5">
      <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-2 font-bengali">
        {label}
      </Text>
      <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-1">
        <Icon name={icon as any} size={18} className="text-slate-400 mr-2.5" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="flex-1 py-3 font-bengali text-slate-850 dark:text-slate-100 text-sm"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-10 pb-6 px-6 border-b border-slate-100 dark:border-slate-800/80 rounded-b-[36px] shadow-sm">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/20"
          >
            <Icon name="arrow-back" size={20} className="text-slate-600 dark:text-slate-300" />
          </TouchableOpacity>
          
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 font-bengali">
            প্রোফাইল সম্পাদনা
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
            className="p-2.5 bg-primary-50 dark:bg-primary-950/20 rounded-2xl border border-primary-200/20"
          >
            <Text className="text-primary-655 dark:text-primary-400 font-bold font-bengali text-xs">
              {isLoading ? 'সেভ হচ্ছে...' : 'সেভ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-6 shadow-sm">
          <InputField
            label="পুরো নাম"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="আপনার পুরো নাম লিখুন"
            icon="person-outline"
          />

          <InputField
            label="ইমেইল ঠিকানা"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="আপনার ইমেইল ঠিকানা"
            icon="mail-outline"
          />

          <InputField
            label="ফোন নম্বর"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="আপনার ফোন নম্বর"
            icon="call-outline"
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="bg-primary-600 dark:bg-primary-500 py-4 rounded-2xl mt-5 shadow-sm active:opacity-95"
          >
            <Text className="text-white text-center font-bold font-bengali text-sm">
              {isLoading ? 'আপডেট হচ্ছে...' : 'পরিবর্তনসমূহ সেভ করুন'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="border border-slate-350 dark:border-slate-800 py-4 rounded-2xl mt-3 active:opacity-95 bg-white dark:bg-slate-900"
          >
            <Text className="text-slate-700 dark:text-slate-300 text-center font-bold font-bengali text-sm">
              বাতিল করুন
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;