// src/screens/user/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'react-native-image-picker';
import { AppDispatch, RootState } from '../../store';
import { logout, getCurrentUser } from '../../store/slices/authSlice';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { useAppTheme } from '../../context/ThemeContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<any, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { isDark, toggleTheme } = useAppTheme();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load user sessions and current profile details on mount
  useEffect(() => {
    dispatch(getUserSessions());
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Dynamically compute stats from user sessions and authentication data
  const { sessions } = useSelector((state: RootState) => state.practice);
  
  const totalQuestions = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.completed_questions || 0), 0)
    : 0;

  const correctAnswers = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0)
    : 0;

  const accuracy = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const streak = user?.streak || 0;
  
  // Calculate Level dynamically
  let level = 'Beginner';
  if (totalQuestions > 500) {
    level = 'Advanced';
  } else if (totalQuestions > 100) {
    level = 'Intermediate';
  }

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
        Alert.alert('ত্রুটি', 'ছবি নির্বাচন ব্যর্থ হয়েছে');
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
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'Beginner':
        return 'text-emerald-600 bg-emerald-50 dark:text-emerald-450 dark:bg-emerald-950/20';
      case 'Intermediate':
        return 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950/20';
      case 'Advanced':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20';
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-450 dark:bg-slate-800';
    }
  };

  const getStreakColor = (strk: number) => {
    if (strk >= 10) return 'text-amber-600 bg-amber-50 dark:text-amber-450 dark:bg-amber-950/25';
    if (strk >= 5) return 'text-orange-600 bg-orange-50 dark:text-orange-450 dark:bg-orange-950/25';
    return 'text-red-650 bg-red-50 dark:text-red-450 dark:bg-red-950/25';
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
    isLast = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    danger?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center py-4 px-5 ${
        !isLast ? 'border-b border-slate-50 dark:border-slate-800/40' : ''
      }`}
      disabled={showSwitch}
      activeOpacity={0.8}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mr-4 ${
          danger ? 'bg-red-50 dark:bg-red-950/20' : 'bg-primary-50 dark:bg-primary-950/20'
        }`}
      >
        <Icon name={icon as any} size={18} className={danger ? 'text-red-500' : 'text-primary-600 dark:text-primary-400'} />
      </View>

      <View className="flex-1">
        <Text
          className={`font-bold text-xs font-bengali ${
            danger ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-105'
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-slate-400 dark:text-slate-500 text-[9px] font-bengali mt-0.5 leading-4">
            {subtitle}
          </Text>
        )}
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#cbd5e1', true: '#c084fc' }}
          thumbColor={switchValue ? '#7c3aed' : '#f1f5f9'}
        />
      ) : (
        <Icon name="chevron-forward" size={14} color={isDark ? '#475569' : '#cbd5e1'} />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 mt-4 text-xs font-bengali">
          লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar backgroundColor={isDark ? "#0f172a" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-5 pb-5 px-6 border-b border-slate-100 dark:border-slate-800/80 flex-row justify-between items-center shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/20"
        >
          <Icon name="arrow-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>

        <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-bengali">
          প্রোফাইল
        </Text>

        <TouchableOpacity
          onPress={handleEditProfile}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/20"
        >
          <Icon name="create-outline" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card Header Info */}
        <View className="bg-white dark:bg-slate-900 px-6 pb-6 pt-5 mb-5 rounded-b-[36px] border-b border-slate-100 dark:border-slate-800/80 shadow-sm items-center">
          <TouchableOpacity onPress={handleImagePicker} className="mb-4">
            <View className="relative">
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : {
                        uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpjRkfdV2CW7Sg2sT7e3zRmUyUUIOh5IW0bw&s',
                      }
                }
                className="w-20 h-20 rounded-full border-4 border-slate-50 dark:border-slate-800"
              />
              <View className="absolute bottom-0 right-0 bg-primary-650 dark:bg-primary-500 rounded-full p-2 border-2 border-white dark:border-slate-900">
                <Icon name="camera" size={12} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Text className="text-base font-black text-slate-800 dark:text-slate-100">
              {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'অতিথি ব্যবহারকারী'}
            </Text>
            {user?.is_premium && (
              <View className="bg-amber-400 px-2 py-0.5 rounded-md shadow-sm">
                <Text className="text-white text-[8px] font-black tracking-wider">PRO</Text>
              </View>
            )}
          </View>
          
          <Text className="text-slate-400 dark:text-slate-500 text-xs mb-3 font-semibold">
            {user?.email || 'example@email.com'}
          </Text>

          <View className={`px-4 py-1 rounded-full ${getLevelColor(level)}`}>
            <Text className="font-extrabold font-bengali text-[10px]">
              {level === 'Beginner' ? 'নতুন শিক্ষার্থী (Beginner)' : level === 'Intermediate' ? 'মধ্যম স্তর (Intermediate)' : 'উচ্চ স্তর (Advanced)'}
            </Text>
          </View>
        </View>

        {/* Statistics Cards grid layout */}
        <View className="p-6 pt-0">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 font-bengali">
            আপনার পরিসংখ্যান
          </Text>

          <View className="flex-row flex-wrap justify-between gap-3 mb-3">
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="bg-emerald-100 dark:bg-emerald-950/20 p-2 rounded-xl mr-2">
                  <Icon name="checkmark-circle" size={16} color="#10b981" />
                </View>
                <Text className="text-slate-450 dark:text-slate-500 font-bengali text-[9px]">
                  সঠিক উত্তর
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {correctAnswers} টি
              </Text>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="bg-primary-100 dark:bg-primary-950/20 p-2 rounded-xl mr-2">
                  <Icon name="stats-chart" size={16} color="#7c3aed" />
                </View>
                <Text className="text-slate-450 dark:text-slate-500 font-bengali text-[9px]">
                  সঠিকতার হার
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {accuracy}%
              </Text>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="bg-amber-100 dark:bg-amber-950/20 p-2 rounded-xl mr-2">
                  <Icon name="flame" size={16} color="#fbbf24" />
                </View>
                <Text className="text-slate-450 dark:text-slate-500 font-bengali text-[9px]">
                  স্ট্রিক (Streak)
                </Text>
              </View>
              <View className={`px-2.5 py-0.5 rounded-md ${getStreakColor(streak)} self-start`}>
                <Text className="font-extrabold text-[9px]">
                  {streak} দিন
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="bg-cyan-100 dark:bg-cyan-950/20 p-2 rounded-xl mr-2">
                  <Icon name="help-circle" size={16} color="#06b6d4" />
                </View>
                <Text className="text-slate-450 dark:text-slate-500 font-bengali text-[9px]">
                  মোট প্র্যাকটিস
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {totalQuestions} টি
              </Text>
            </View>
          </View>
        </View>

        {/* Grouped Menu Cards (Luxurious iOS/Android Native UI) */}
        <View className="px-6 gap-6">
          
          {/* Account Card Group */}
          <View>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[9px] font-extrabold mb-2 uppercase tracking-wide">
              অ্যাকাউন্ট সেটিংস
            </Text>
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              <MenuItem
                icon="person-outline"
                title="ব্যক্তিগত প্রোফাইল"
                subtitle="আপনার নাম ও ব্যক্তিগত তথ্য পরিবর্তন করুন"
                onPress={handleEditProfile}
              />
              <MenuItem
                icon="card-outline"
                title="সাবস্ক্রিপশন প্ল্যান"
                subtitle="আপনার পেমেন্ট হিস্ট্রি ও মেম্বারশিপ স্ট্যাটাস"
                onPress={() => navigation.navigate('Subscription' as any)}
              />
              <MenuItem
                icon="school-outline"
                title="শিক্ষা অগ্রগতি রিপোর্ট"
                subtitle="আপনার ক্যাটাগরি ও বিষয়ভিত্তিক প্রগ্রেস"
                onPress={() => navigation.navigate('Progress')}
              />
              <MenuItem
                icon="analytics-outline"
                title="উত্তর বিশ্লেষণ রেকর্ড"
                subtitle="সেশন ভিত্তিক ভুল ও সঠিক উত্তর ট্র্যাকিং"
                onPress={() => navigation.navigate('AllAnswerAnalysis')}
              />
              <MenuItem
                icon="time-outline"
                title="প্র্যাকটিস সেশনের ইতিহাস"
                subtitle="আপনার পূর্ববর্তী সকল প্র্যাকটিস হিস্ট্রি"
                onPress={() => navigation.navigate('PracticeHistory')}
                isLast={true}
              />
            </View>
          </View>

          {/* Preferences Card Group */}
          <View>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[9px] font-extrabold mb-2 uppercase tracking-wide">
              অ্যাপ সেটিংস
            </Text>
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              <MenuItem
                icon="notifications-outline"
                title="পুশ নোটিফিকেশন"
                subtitle="ডেইলি রিমাইন্ডার ও আপডেট নোটিফিকেশন সচল করুন"
                showSwitch
                switchValue={notificationsEnabled}
                onSwitchChange={setNotificationsEnabled}
              />
              <MenuItem
                icon="moon-outline"
                title="ডার্ক থিম মোড"
                subtitle="ডার্ক ও লাইট থিমের মধ্যে পরিবর্তন করুন"
                showSwitch
                switchValue={isDark}
                onSwitchChange={toggleTheme}
                isLast={true}
              />
            </View>
          </View>

          {/* Danger Zone Card Group */}
          <View>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[9px] font-extrabold mb-2 uppercase tracking-wide">
              নিরাপত্তা
            </Text>
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              <MenuItem
                icon="lock-closed-outline"
                title="পাসওয়ার্ড পরিবর্তন"
                subtitle="আপনার অ্যাকাউন্টের নিরাপত্তা পাসওয়ার্ড পরিবর্তন করুন"
                onPress={() => navigation.navigate('ChangePassword' as any)}
              />
              <MenuItem
                icon="log-out-outline"
                title="অ্যাকাউন্ট লগআউট"
                subtitle="আপনার সেশন বন্ধ করে লগআউট করুন"
                onPress={handleLogout}
                danger
                isLast={true}
              />
            </View>
          </View>

        </View>

        {/* App Version Info */}
        <View className="mt-8 items-center">
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bengali">
            সংস্করণ ১.০.০ (রিলিজ বিল্ড)
          </Text>
          <Text className="text-slate-450 dark:text-slate-600 text-[8px] mt-1 font-bengali">
            © ২০২৬ বিসিএস প্রস্তুতি ফোরাম। সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
