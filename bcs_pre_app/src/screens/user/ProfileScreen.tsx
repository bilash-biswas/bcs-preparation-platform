// screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  SafeAreaView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

type ProfileScreenNavigationProp = NativeStackNavigationProp<any, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    streak: 0,
    level: 'Beginner',
  });

  useEffect(() => {
    // Load user stats (you can replace this with actual API call)
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    // Simulate API call to get user stats
    setTimeout(() => {
      setStats({
        totalQuestions: 1250,
        correctAnswers: 890,
        accuracy: 71.2,
        streak: 7,
        level: 'Intermediate',
      });
    }, 1000);
  };

  const handleImagePicker = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets[0].uri) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const handleLogout = () => {
    Alert.alert('লগআউট', 'আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?', [
      {
        text: 'বাতিল',
        style: 'cancel',
      },
      {
        text: 'লগআউট',
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    navigation.navigate('EditProfile');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-emerald-600 bg-emerald-100';
      case 'Intermediate':
        return 'text-blue-600 bg-blue-100';
      case 'Advanced':
        return 'text-purple-600 bg-purple-100';
      case 'Expert':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return 'text-orange-600 bg-orange-100';
    if (streak >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {},
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center py-4 px-4 border-b border-gray-200 ${
        danger ? 'bg-red-50' : 'bg-white'
      }`}
      disabled={showSwitch}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          danger ? 'bg-red-100' : 'bg-blue-100'
        }`}
      >
        <Icon name={icon} size={20} color={danger ? '#dc2626' : '#3b82f6'} />
      </View>

      <View className="flex-1">
        <Text
          className={`font-semibold text-base font-bengali ${
            danger ? 'text-red-700' : 'text-gray-900'
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm font-bengali mt-1">
            {subtitle}
          </Text>
        )}
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={switchValue ? '#3b82f6' : '#f3f4f6'}
        />
      ) : (
        <Icon name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg font-bengali">
          লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pt-5">
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-purple-600 pt-4 pb-6 px-4 shadow-lg">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-xl"
          >
            <Icon name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <Text className="text-gray-500 text-xl font-bold font-bengali">
            প্রোফাইল
          </Text>

          <TouchableOpacity
            onPress={handleEditProfile}
            className="bg-white/20 p-2 rounded-xl"
          >
            <Icon name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View className="items-center">
          <TouchableOpacity onPress={handleImagePicker} className="mb-3">
            <View className="relative">
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : {
                        uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpjRkfdV2CW7Sg2sT7e3zRmUyUUIOh5IW0bw&s',
                      }
                }
                className="w-24 h-24 rounded-full border-4 border-white"
              />
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border-2 border-white">
                <Icon name="camera" size={16} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          <Text className="text-gray-600 text-2xl font-bold font-bengali mb-1">
            {user?.username || 'অতিথি ব্যবহারকারী'}
          </Text>
          <Text className="text-blue-400 font-bengali mb-2">
            {user?.email || 'example@email.com'}
          </Text>

          <View
            className={`px-4 py-1 rounded-full ${getLevelColor(stats.level)}`}
          >
            <Text className="font-semibold font-bengali text-sm">
              {stats.level}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3 font-bengali">
            আপনার পরিসংখ্যান
          </Text>

          <View className="flex-row flex-wrap justify-between gap-3 mb-6">
            <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 min-w-[45%]">
              <View className="flex-row items-center mb-2">
                <View className="bg-green-100 p-2 rounded-lg mr-2">
                  <Icon name="checkmark-circle" size={20} color="#16a34a" />
                </View>
                <Text className="text-gray-500 font-bengali">
                  সঠিক উত্তর
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.correctAnswers}
              </Text>
            </View>

            <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 min-w-[45%]">
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-100 p-2 rounded-lg mr-2">
                  <Icon name="stats-chart" size={20} color="#3b82f6" />
                </View>
                <Text className="text-gray-500 font-bengali">
                  সঠিকতার হার
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.accuracy}%
              </Text>
            </View>

            <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 min-w-[45%]">
              <View className="flex-row items-center mb-2">
                <View className="bg-purple-100 p-2 rounded-lg mr-2">
                  <Icon name="flame" size={20} color="#9333ea" />
                </View>
                <Text className="text-gray-500 font-bengali">
                  স্ট্রীক
                </Text>
              </View>
              <View
                className={`px-2 py-1 rounded-full ${getStreakColor(
                  stats.streak,
                )} self-start`}
              >
                <Text className="font-semibold text-sm">
                  {stats.streak} দিন
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 min-w-[45%]">
              <View className="flex-row items-center mb-2">
                <View className="bg-orange-100 p-2 rounded-lg mr-2">
                  <Icon name="help-circle" size={20} color="#ea580c" />
                </View>
                <Text className="text-gray-500 font-bengali">
                  মোট প্রশ্ন
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.totalQuestions}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="bg-white rounded-t-3xl overflow-hidden">
          {/* Account Section */}
          <View className="pt-4">
            <Text className="text-gray-500 font-bengali text-sm font-semibold px-4 mb-2">
              অ্যাকাউন্ট
            </Text>

            <MenuItem
              icon="person-outline"
              title="প্রোফাইল সম্পাদনা"
              subtitle="আপনার ব্যক্তিগত তথ্য আপডেট করুন"
              onPress={handleEditProfile}
            />

            <MenuItem
              icon="school-outline"
              title="আমার অগ্রগতি"
              subtitle="আপনার শিক্ষার যাত্রা দেখুন"
              onPress={() => navigation.navigate('Progress')}
            />

            <MenuItem
              icon="trophy-outline"
              title="অর্জনসমূহ"
              subtitle="আপনার অর্জন ও ব্যাজ দেখুন"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />

            <MenuItem
              icon="trophy"
              title="সকল উত্তর বিশ্লেষণ"
              subtitle="আপনার সকল প্র্যাকটিস ও কুইজ সেশনের উত্তরসমূহ"
              onPress={() => navigation.navigate('AllAnswerAnalysis')}
            />

            <MenuItem
              icon="history-outline"
              title="প্র্যাকটিস সেশন ইতিহাস"
              subtitle="আপনার পূর্ববর্তী সকল প্র্যাকটিস সেশনের ফলাফল"
              onPress={() => navigation.navigate('PracticeHistory')}
            />

          </View>

          {/* Settings Section */}
          <View className="pt-4">
            <Text className="text-gray-500 font-bengali text-sm font-semibold px-4 mb-2">
              সেটিংস
            </Text>

            <MenuItem
              icon="notifications-outline"
              title="নোটিফিকেশন"
              subtitle="পুশ নোটিফিকেশন সেটিংস"
              showSwitch
              switchValue={notificationsEnabled}
              onSwitchChange={setNotificationsEnabled}
            />

            <MenuItem
              icon="moon-outline"
              title="ডার্ক মোড"
              subtitle="অ্যাপের থিম পরিবর্তন করুন"
              showSwitch
              switchValue={darkModeEnabled}
              onSwitchChange={setDarkModeEnabled}
            />

            <MenuItem
              icon="language-outline"
              title="ভাষা"
              subtitle="অ্যাপের ভাষা পরিবর্তন করুন"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />

            <MenuItem
              icon="lock-closed-outline"
              title="গোপনীয়তা"
              subtitle="গোপনীয়তা সেটিংস"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />
          </View>

          {/* Support Section */}
          <View className="pt-4">
            <Text className="text-gray-500 font-bengali text-sm font-semibold px-4 mb-2">
              সহায়তা
            </Text>

            <MenuItem
              icon="help-circle-outline"
              title="সাহায্য ও সমর্থন"
              subtitle="সহায়তা কেন্দ্র"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />

            <MenuItem
              icon="document-text-outline"
              title="শর্তাবলী ও গোপনীয়তা"
              subtitle="সেবার শর্তাবলী"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />

            <MenuItem
              icon="information-circle-outline"
              title="অ্যাপ সম্পর্কে"
              subtitle="সংস্করণ ও তথ্য"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />

            <MenuItem
              icon="star-outline"
              title="রেট অ্যাপ"
              subtitle="আমাদের অ্যাপ রেট করুন"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
            />
          </View>

          {/* Danger Zone */}
          <View className="pt-4 pb-8">
            <Text className="text-gray-500 font-bengali text-sm font-semibold px-4 mb-2">
              বিপদ এলাকা
            </Text>

            <MenuItem
              icon="log-out-outline"
              title="লগআউট"
              subtitle="আপনার অ্যাকাউন্ট থেকে সাইন আউট করুন"
              onPress={handleLogout}
              danger
            />

            <MenuItem
              icon="trash-outline"
              title="অ্যাকাউন্ট মুছুন"
              subtitle="স্থায়ীভাবে অ্যাকাউন্ট মুছুন"
              onPress={() => Alert.alert('শীঘ্রই আসছে', 'এই বৈশিষ্ট্যটি শীঘ্রই উপলব্ধ হবে')}
              danger
            />
          </View>
        </View>

        {/* App Version */}
        <View className="py-6 items-center">
          <Text className="text-gray-400 text-sm font-bengali">
            সংস্করণ 1.0.0
          </Text>
          <Text className="text-gray-400 text-xs mt-1 font-bengali">
            © ২০২৪ আপনার অ্যাপ
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
