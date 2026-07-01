// src/screens/HomeScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store';
import { fetchAvailableQuizzes } from '../store/slices/quizSlice';
import { getUserSessions } from '../store/slices/practiceSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { quizzes = [] } = useSelector((state: RootState) => state.quiz); 
  const { sessions = [] } = useSelector((state: RootState) => state.practice); 
  const { isDark, toggleTheme } = useAppTheme();
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAvailableQuizzes()),
        dispatch(getUserSessions()),
        dispatch(getCurrentUser()),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    onRefresh();
  }, []);

  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];
  const availableQuizzes = Array.isArray(quizzes) ? quizzes.slice(0, 3) : [];

  const calculateStreak = (sessionsList: any[]): number => {
    if (!sessionsList || sessionsList.length === 0) return 0;
    const dates = sessionsList
      .map(s => {
        const dateStr = s.completed_at || s.started_at;
        return dateStr ? dateStr.split('T')[0] : null;
      })
      .filter(Boolean) as string[];
    const uniqueSortedDates = Array.from(new Set(dates)).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    if (uniqueSortedDates.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (uniqueSortedDates[0] !== todayStr && uniqueSortedDates[0] !== yesterdayStr) {
      return 0;
    }
    let streakCount = 0;
    let expectedDate = new Date(uniqueSortedDates[0]);
    for (let i = 0; i < uniqueSortedDates.length; i++) {
      const d = new Date(uniqueSortedDates[i]);
      const diffTime = Math.abs(expectedDate.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streakCount++;
        expectedDate = d;
      } else {
        break;
      }
    }
    return streakCount;
  };

  const totalQuestionsAnswered = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.completed_questions || 0), 0)
    : 0;

  const totalCorrect = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0)
    : 0;

  const overallAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  const quickActions = [
    {
      title: 'প্র্যাকটিস শুরু করুন',
      subtitle: 'নিজের গতিতে অনুশীলন',
      icon: 'rocket-outline' as any,
      screen: 'Practice' as keyof RootStackParamList,
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: 'কুইজ দিন',
      subtitle: 'টাইমড কুইজে অংশ নিন',
      icon: 'time-outline' as any,
      screen: 'Quizzes' as keyof RootStackParamList,
      color: 'from-secondary-500 to-secondary-600',
    },
    {
      title: 'প্রশ্নব্যাংক',
      subtitle: 'সকল প্রশ্ন ও উত্তর',
      icon: 'book-outline' as any,
      screen: 'Questions' as keyof RootStackParamList,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'বিষয়সমূহ',
      subtitle: 'বিষয়ভিত্তিক প্রস্তুতি',
      icon: 'library-outline' as any,
      screen: 'Categories' as keyof RootStackParamList,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'প্রগতি দেখুন',
      subtitle: 'উন্নতি বিশ্লেষণ',
      icon: 'pie-chart-outline' as any,
      screen: 'Progress' as keyof RootStackParamList,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'লিডারবোর্ড',
      subtitle: 'র‌্যাংক ও স্কোর',
      icon: 'trophy-outline' as any,
      screen: 'Leaderboard' as keyof RootStackParamList,
      color: 'from-accent-500 to-accent-600',
    },
  ];

  return (
    <ScrollView 
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar 
        backgroundColor={isDark ? "#0f172a" : "#ffffff"} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header Section */}
      <View className="bg-white dark:bg-slate-900 pt-14 pb-8 px-6 shadow-sm rounded-b-[36px] border-b border-slate-100 dark:border-slate-800/80">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali">
              স্বাগতম, {user?.first_name || user?.username || 'ব্যবহারকারী'}!
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 mt-1 font-bengali text-sm">
              Your BCS Preparation Accelerator
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {/* Theme Toggle Button */}
            <TouchableOpacity 
              onPress={toggleTheme}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"
            >
              <Ionicons 
                name={isDark ? "sunny-outline" : "moon-outline"} 
                size={20} 
                color={isDark ? '#cbd5e1' : '#334155'} 
              />
            </TouchableOpacity>
            
            {/* Profile Avatar */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile' as any)}
              className="w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center border border-primary-200"
            >
              <Text className="text-white font-extrabold text-lg">
                {(user?.first_name || user?.username)?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="p-6">
        {/* Stats Grid */}
        <View className="mb-6">
          <View className="flex-row justify-between gap-3">
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm flex-1 border border-slate-100 dark:border-slate-800/50 items-center">
              <View className="w-10 h-10 bg-red-100 dark:bg-red-950/20 rounded-full justify-center items-center mb-2">
                <Ionicons name="flame-outline" size={20} color="#ef4444" />
              </View>
              <Text className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {user?.streak || 0}
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali">স্ট্রিক (Streak)</Text>
            </View>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm flex-1 border border-slate-100 dark:border-slate-800/50 items-center">
              <View className="w-10 h-10 bg-secondary-100 dark:bg-secondary-950/20 rounded-full justify-center items-center mb-2">
                <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              </View>
              <Text className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {overallAccuracy}%
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali">সঠিকতার হার</Text>
            </View>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm flex-1 border border-slate-100 dark:border-slate-800/50 items-center">
              <View className="w-10 h-10 bg-primary-100 dark:bg-primary-950/20 rounded-full justify-center items-center mb-2">
                <Ionicons name="help-circle-outline" size={20} color="#7c3aed" />
              </View>
              <Text className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {totalQuestionsAnswered}
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali">মোট প্র্যাকটিস</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-6">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 font-bengali">দ্রুত অ্যাকশন</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className={`w-[48%] rounded-2xl p-5 shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60`}
                onPress={() => navigation.navigate(action.screen as any)}
              >
                <View className="w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-xl items-center justify-center mb-4">
                  <Ionicons name={action.icon} size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
                </View>
                <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-base font-bengali">
                  {action.title}
                </Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-bengali">
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-black text-slate-800 dark:text-slate-100 font-bengali">সাম্প্রতিক সেশন</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PracticeHistory' as any)}>
              <Text className="text-primary-600 dark:text-primary-400 font-bold font-bengali text-sm">সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          {recentSessions.length > 0 ? (
            <View className="gap-3">
              {recentSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800/50"
                  onPress={() => navigation.navigate('PracticeResults' as any, { sessionId: session.id })}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-bold text-slate-800 dark:text-slate-100 font-bengali capitalize text-base">
                        {session.session_type} সেশন
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-bengali">
                        স্কোর: {session.score?.toFixed(1) || '0'}% • প্রশ্ন: {session.completed_questions || 0}/{session.total_questions || 0}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-xl ${
                      (session.score || 0) >= 80 ? 'bg-secondary-50 dark:bg-secondary-950/20' : 
                      (session.score || 0) >= 60 ? 'bg-accent-50 dark:bg-accent-950/20' : 'bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <Text className={`text-xs font-bold ${
                        (session.score || 0) >= 80 ? 'text-secondary-600 dark:text-secondary-400' : 
                        (session.score || 0) >= 60 ? 'text-accent-600 dark:text-accent-400' : 'text-red-500'
                      }`}>
                        {(session.score || 0).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center border border-slate-100 dark:border-slate-800/50">
              <View className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full justify-center items-center mb-3">
                <Ionicons name="bar-chart-outline" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
              <Text className="text-slate-400 dark:text-slate-500 text-center font-bengali text-sm mb-4">
                এখনো কোন সেশন সম্পন্ন করা হয়নি
              </Text>
              <TouchableOpacity 
                className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl"
                onPress={() => navigation.navigate('Practice' as any)}
              >
                <Text className="text-white font-bold font-bengali text-sm">প্রথম সেশন শুরু করুন</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Available Quizzes */}
        <View className="pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-black text-slate-800 dark:text-slate-100 font-bengali">উপলব্ধ কুইজ</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Quizzes' as any)}>
              <Text className="text-primary-600 dark:text-primary-400 font-bold font-bengali text-sm">সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          {availableQuizzes.length > 0 ? (
            <View className="gap-3">
              {availableQuizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800/50"
                  onPress={() => navigation.navigate('Quizzes' as any)}
                >
                  <Text className="font-bold text-slate-800 dark:text-slate-100 font-bengali text-base">{quiz.title}</Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-bengali">
                    {quiz.total_questions || 0} প্রশ্ন • {quiz.time_limit || 0} মিনিট
                  </Text>
                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                    <View className="flex-row gap-2">
                      <View className="bg-primary-50 dark:bg-primary-950/20 px-2.5 py-1 rounded-lg">
                        <Text className="text-primary-600 dark:text-primary-400 text-xs font-bold font-bengali">কুইজ</Text>
                      </View>
                      {quiz.attempted && (
                        <View className="bg-secondary-50 dark:bg-secondary-950/20 px-2.5 py-1 rounded-lg">
                          <Text className="text-secondary-600 dark:text-secondary-400 text-xs font-bold font-bengali">সম্পন্ন</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      className="bg-primary-600 dark:bg-primary-500 px-4 py-2 rounded-xl"
                      onPress={() => navigation.navigate('Quizzes' as any)}
                    >
                      <Text className="text-white text-xs font-bold font-bengali">
                        {quiz.attempted ? 'পুনরায় দিন' : 'শুরু করুন'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center border border-slate-100 dark:border-slate-800/50">
              <View className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full justify-center items-center mb-3">
                <Ionicons name="document-text-outline" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
              <Text className="text-slate-400 dark:text-slate-500 text-center font-bengali text-sm">
                এখনো কোন কুইজ উপলব্ধ নেই
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;