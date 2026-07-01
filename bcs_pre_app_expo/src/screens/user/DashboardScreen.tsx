import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState, AppDispatch } from '../../store';
import { useAppTheme } from '../../context/ThemeContext';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { getCurrentUser } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useAppTheme();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { sessions = [], isLoading } = useSelector((state: RootState) => state.practice);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getUserSessions());
    dispatch(getCurrentUser());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getUserSessions()),
      dispatch(getCurrentUser())
    ]).catch(err => console.error('Refresh failed:', err));
    setRefreshing(false);
  };

  // Helper calculation logic
  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];

  const totalQuestionsAnswered = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.completed_questions || 0), 0)
    : 0;

  const totalCorrect = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0)
    : 0;

  const overallAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  // Level Logic
  const getLevelInfo = (qCount: number) => {
    if (qCount < 50) return { title: 'নতুন শিক্ষার্থী (Beginner)', current: 'Beginner', next: 50, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' };
    if (qCount < 200) return { title: 'মধ্যম স্তর (Intermediate)', current: 'Intermediate', next: 200, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    return { title: 'উচ্চ স্তর (Advanced)', current: 'Advanced', next: null, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
  };

  const levelInfo = getLevelInfo(totalQuestionsAnswered);
  const levelProgress = levelInfo.next 
    ? Math.min(Math.round((totalQuestionsAnswered / levelInfo.next) * 100), 100) 
    : 100;

  // Streak logic (calculating from sessions)
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

  const streak = user?.streak || calculateStreak(sessions);
  const coins = user?.coins || 0;

  // Quick stats card layout
  const StatCard = ({ icon, color, label, value, bg }: { icon: string, color: string, label: string, value: string | number, bg: string }) => (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex-1 shadow-sm">
      <View className="flex-row items-center mb-2">
        <View className={`${bg} p-2 rounded-xl mr-2.5`}>
          <Icon name={icon as any} size={16} color={color} />
        </View>
        <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[10px] font-bold">
          {label}
        </Text>
      </View>
      <Text className="text-lg font-black text-slate-800 dark:text-slate-100">
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar
        backgroundColor={isDark ? "#0f172a" : "#ffffff"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header Bar */}
      <View className="px-6 py-4 flex-row items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/20 mr-4"
          >
            <Icon name="arrow-back" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
          </TouchableOpacity>
          <View>
            <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali">
              ড্যাশবোর্ড
            </Text>
            <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
              প্রস্তুতি ও প্রগতির মূল কেন্দ্রবিন্দু
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleRefresh}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/20"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#7c3aed" />
          ) : (
            <Icon name="refresh" size={18} color={isDark ? '#cbd5e1' : '#475569'} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* User Card */}
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {/* Initial Avatar */}
            <View className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-950/40 items-center justify-center border-2 border-primary-500/20 mr-4">
              <Text className="text-primary-600 dark:text-primary-400 text-lg font-black uppercase">
                {user?.first_name ? user.first_name[0] : user?.username?.[0] || 'U'}
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Text className="text-base font-black text-slate-800 dark:text-slate-100">
                  {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'পরীক্ষার্থী'}
                </Text>
                {user?.is_premium && (
                  <View className="bg-amber-400 px-1.5 py-0.5 rounded-md shadow-sm">
                    <Text className="text-white text-[8px] font-black tracking-wider">PRO</Text>
                  </View>
                )}
              </View>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali font-bold">
                {user?.email || 'email@example.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Level Section */}
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-400 font-bengali">
              বর্তমান যোগ্যতা লেভেল
            </Text>
            <View className={`px-2.5 py-0.5 rounded-full ${levelInfo.color}`}>
              <Text className="font-extrabold text-[9px] font-bengali">
                {levelInfo.current}
              </Text>
            </View>
          </View>
          
          <Text className="text-sm font-black text-slate-800 dark:text-slate-100 font-bengali mb-3">
            {levelInfo.title}
          </Text>

          {/* Progress bar */}
          <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
            <View 
              style={{ width: `${levelProgress}%` }}
              className="h-full bg-primary-500 rounded-full"
            />
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
              মোট কুইজ প্রশ্ন উত্তর: {totalQuestionsAnswered}
            </Text>
            {levelInfo.next && (
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
                পরবর্তী লেভেল: {levelInfo.next} উত্তর ({levelProgress}%)
              </Text>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 font-bengali uppercase tracking-wider">
          পরিসংখ্যান রিপোর্ট
        </Text>
        
        <View className="flex-row gap-3 mb-3">
          <StatCard 
            icon="help-circle-outline" 
            color="#06b6d4" 
            label="মোট প্র্যাকটিস" 
            value={`${totalQuestionsAnswered} টি`} 
            bg="bg-cyan-100/10 dark:bg-cyan-950/20"
          />
          <StatCard 
            icon="checkmark-circle-outline" 
            color="#10b981" 
            label="সঠিক উত্তর" 
            value={`${totalCorrect} টি`} 
            bg="bg-emerald-100/10 dark:bg-emerald-950/20"
          />
        </View>

        <View className="flex-row gap-3 mb-5">
          <StatCard 
            icon="trending-up-outline" 
            color="#7c3aed" 
            label="সঠিকতার হার" 
            value={`${overallAccuracy}%`} 
            bg="bg-primary-100/10 dark:bg-primary-950/20"
          />
          <StatCard 
            icon="flame-outline" 
            color="#f97316" 
            label="স্ট্রিক ধারাবাহিকতা" 
            value={`${streak} দিন`} 
            bg="bg-orange-100/10 dark:bg-orange-950/20"
          />
          <StatCard 
            icon="gift-outline" 
            color="#eab308" 
            label="অর্জিত কয়েন" 
            value={`${coins}`} 
            bg="bg-yellow-100/10 dark:bg-yellow-950/20"
          />
        </View>

        {/* Premium Upgrade banner */}
        {!user?.is_premium && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Subscription' as any)}
            className="mb-5 rounded-3xl overflow-hidden shadow-md"
          >
            <LinearGradient
              colors={['#db2777', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-black font-bengali">
                  বিসিএস প্রস্তুতি প্রো-তে আপগ্রেড করুন!
                </Text>
                <Text className="text-white/80 text-[10px] font-bengali mt-1 leading-4">
                  সীমাহীন কাস্টম প্র্যাকটিস, অ্যাডভান্সড রিপোর্ট ও লাইভ ড্যাশবোর্ডের সব ফিচার আনলক করুন মাত্র ৯৯ টাকা থেকে।
                </Text>
              </View>
              <View className="bg-white/10 dark:bg-white/20 p-2.5 rounded-2xl">
                <Icon name="chevron-forward" size={18} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Session History */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 font-bengali uppercase tracking-wider">
              সাম্প্রতিক প্রস্তুতি সেশন
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PracticeHistory' as any)}>
              <Text className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 font-bengali">
                সবগুলো দেখুন
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#7c3aed" className="py-8" />
          ) : recentSessions.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 items-center">
              <Icon name="chatbox-ellipses-outline" size={24} className="text-slate-400 dark:text-slate-600 mb-2" />
              <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-bengali">
                কোন পূর্ববর্তী প্র্যাকটিস সেশন পাওয়া যায়নি।
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Categories' as any)}
                className="mt-3 bg-primary-100 dark:bg-primary-950/20 px-4 py-2 rounded-xl"
              >
                <Text className="text-primary-600 dark:text-primary-400 font-extrabold text-[10px] font-bengali">
                  আজই শুরু করুন
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              {recentSessions.map((session, index) => {
                const dateStr = session.completed_at || session.started_at;
                const formattedDate = dateStr 
                  ? new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '';
                
                const correctCount = session.correct_answers || 0;
                const qCount = session.completed_questions || 0;
                const accuracy = qCount > 0 ? Math.round((correctCount / qCount) * 100) : 0;

                return (
                  <View 
                    key={session.id}
                    className={`p-4 flex-row items-center justify-between ${
                      index !== recentSessions.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/70' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 items-center justify-center mr-3">
                        <Icon name="document-text-outline" size={18} color="#7c3aed" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                          সেশন #{session.id} ({session.subject_names?.join(', ') || 'সাধারণ জ্ঞান'})
                        </Text>
                        <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
                          তারিখ: {formattedDate}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end ml-4">
                      <Text className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {correctCount}/{qCount} সঠিক
                      </Text>
                      <Text className={`text-[9px] font-black mt-0.5 ${
                        accuracy >= 70 ? 'text-emerald-500' : accuracy >= 40 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        সঠিকতা: {accuracy}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Action Shortcuts */}
        <View className="flex-row justify-between gap-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('Categories' as any)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 items-center shadow-sm"
          >
            <Icon name="book" size={20} color="#7c3aed" className="mb-2" />
            <Text className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-bengali">
              বিষয়ভিত্তিক প্রস্তুতি
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Quizzes' as any)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 items-center shadow-sm"
          >
            <Icon name="timer" size={20} color="#ec4899" className="mb-2" />
            <Text className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-bengali">
              মডেল টেস্ট ও কুইজ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Leaderboard' as any)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 items-center shadow-sm"
          >
            <Icon name="trophy" size={20} color="#eab308" className="mb-2" />
            <Text className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-bengali">
              লিডারবোর্ড
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;