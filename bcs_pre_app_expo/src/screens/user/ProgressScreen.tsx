// src/screens/user/ProgressScreen.jsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import LiveProgressTracker from '../../components/progress/LiveProgressTracker';
import ProgressHistory from '../../components/progress/ProgressHistory';

const ProgressScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useAppTheme();

  // Load user sessions on mount to ensure child components have latest data
  useEffect(() => {
    dispatch(getUserSessions());
  }, [dispatch]);

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
          <Ionicons name="arrow-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali">
            শিক্ষা প্রগতি ও ট্র্যাকিং
          </Text>
          <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
            আপনার লার্নিং জার্নি এবং উন্নতি দেখুন
          </Text>
        </View>
      </View>
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        <View className="gap-6">
          {/* Real progress components */}
          <LiveProgressTracker />
          <ProgressHistory />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressScreen;