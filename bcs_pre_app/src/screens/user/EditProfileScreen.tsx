// screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppDispatch, RootState } from '../../store';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<any, 'EditProfile'>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

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
    // try {
    //   await dispatch(updateProfile(formData)).unwrap();
    //   Alert.alert('সফল', 'প্রোফাইল আপডেট করা হয়েছে', [
    //     { text: 'ঠিক আছে', onPress: () => navigation.goBack() }
    //   ]);
    // } catch (error) {
    //   Alert.alert('ত্রুটি', 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
    // } finally {
    //   setIsLoading(false);
    // }
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
    <View className="mb-4">
      <Text className="text-gray-700 font-semibold mb-2 font-bengali">
        {label}
      </Text>
      <View className="flex-row items-center bg-white rounded-xl border border-gray-300 px-3">
        <Icon name={icon} size={20} color="#6b7280" className="mr-3" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          className="flex-1 py-3 font-bengali text-gray-800"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-purple-600 pt-4 pb-4 px-4 shadow-lg">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-white/20 p-2 rounded-xl"
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white text-xl font-bold font-bengali">
            প্রোফাইল সম্পাদনা
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
            className="bg-white/20 p-2 rounded-xl"
          >
            <Text className="text-white font-semibold font-bengali">
              {isLoading ? 'সেভ হচ্ছে...' : 'সেভ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl shadow-lg p-6">
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
            className="bg-blue-600 py-4 rounded-xl mt-4"
          >
            <Text className="text-white text-center font-semibold font-bengali text-lg">
              {isLoading ? 'আপডেট হচ্ছে...' : 'পরিবর্তনসমূহ সেভ করুন'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="border-2 border-gray-300 py-4 rounded-xl mt-3"
          >
            <Text className="text-gray-700 text-center font-semibold font-bengali">
              বাতিল করুন
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;