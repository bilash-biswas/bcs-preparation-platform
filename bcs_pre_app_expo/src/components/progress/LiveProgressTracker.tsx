// src/components/progress/LiveProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Ionicons as Icon } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { useAppTheme } from '../../context/ThemeContext';

interface LiveProgressData {
  current_streak: number;
  daily_goal_met: boolean;
  questions_today: number;
  accuracy_today: number;
  time_spent_today: number;
  recent_achievements: Array<{
    name: string;
    description: string;
  }>;
}

const LiveProgressTracker: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sessions, isLoading } = useSelector((state: RootState) => state.practice);
  const { isDark } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');
  const [progressAnim] = useState(new Animated.Value(0));

  // Dynamically calculate stats for today (local time)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = (sessions || []).filter(s => {
    const sDate = (s.completed_at || s.started_at)?.split('T')[0];
    return sDate === todayStr;
  });

  const questionsToday = todaySessions.reduce((sum, s) => sum + (s.completed_questions || 0), 0);
  const correctToday = todaySessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
  const accuracyToday = questionsToday > 0 ? (correctToday / questionsToday) * 100 : 0;

  let timeSpentTodaySeconds = 0;
  todaySessions.forEach(s => {
    if (s.time_taken) {
      if (s.time_taken.includes(':')) {
        const parts = s.time_taken.split(':').map(Number);
        if (parts.length === 3) {
          timeSpentTodaySeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          timeSpentTodaySeconds += parts[0] * 60 + parts[1];
        }
      } else {
        timeSpentTodaySeconds += parseInt(s.time_taken) || 0;
      }
    }
  });
  const timeSpentToday = Math.round(timeSpentTodaySeconds / 60);

  const currentStreak = user?.streak || 0;
  const dailyGoalMet = questionsToday >= 20;

  useEffect(() => {
    // Animate progress bar based on questions today (daily goal is 20 questions)
    Animated.timing(progressAnim, {
      toValue: Math.min((questionsToday / 20) * 100, 100),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [questionsToday]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(getUserSessions()).unwrap();
    } catch (err) {
      console.log('Failed to refresh progress sessions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ 
    icon, 
    value, 
    label, 
    color 
  }: {
    icon: string;
    value: string | number;
    label: string;
    color: string;
  }) => (
    <View className={`flex-1 p-3 rounded-2xl border ${color} items-center mx-1 shadow-sm`}>
      <Icon name={icon as any} size={20} color={getColorValue(color)} />
      <Text className="text-base font-black mt-1" style={{ color: getColorValue(color) }}>
        {value}
      </Text>
      <Text className="text-[9px] font-bengali mt-0.5 text-slate-500 font-bold" style={{ color: getColorValue(color) }}>
        {label}
      </Text>
    </View>
  );

  const getColorValue = (colorClass: string) => {
    switch (colorClass) {
      case 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30': return '#ea580c';
      case 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30': return '#2563eb';
      case 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30': return '#059669';
      case 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 items-center justify-center min-h-[180px]">
        <ActivityIndicator size="small" color="#7c3aed" />
        <Text className="text-slate-400 mt-2 font-bengali text-xs">আজকের অগ্রগতি প্রসেস করা হচ্ছে...</Text>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="mb-2">
      {/* Achievement Notification */}
      {showNotification && (
        <View className="absolute top-4 right-4 left-4 bg-emerald-600 rounded-2xl shadow-lg z-50 p-4">
          <View className="flex-row items-center space-x-3">
            <MaterialIcons name="emoji-events" size={24} color="white" />
            <View className="flex-1">
              <Text className="text-white font-medium font-bengali">
                {notification}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Progress Tracker Card */}
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm">
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
            <Text className="text-xs font-black text-slate-800 dark:text-slate-100 font-bengali">
              আজকের রিয়েল-টাইম প্রগ্রেস
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleRefresh}
            disabled={refreshing}
            className="p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <Icon name="refresh" size={14} color="#7c3aed" />
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-5 -mx-1">
          <StatCard
            icon="flame"
            value={currentStreak}
            label="স্ট্রিক"
            color="bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30"
          />
          <StatCard
            icon="checkmark-done"
            value={`${questionsToday}/২০`}
            label="প্রশ্ন সমাধান"
            color="bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30"
          />
          <StatCard
            icon="trending-up"
            value={`${accuracyToday.toFixed(0)}%`}
            label="সঠিকতা"
            color="bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
          />
          <StatCard
            icon="time"
            value={`${timeSpentToday}মি.`}
            label="সময় ব্যাপ্তিকাল"
            color="bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30"
          />
        </View>

        {/* Daily Goal Progress Bar */}
        <View className="mb-5">
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-550 dark:text-slate-400 font-bold font-bengali text-[10px]">আজকের লক্ষ্যমাত্রা (ডেইলি গোল)</Text>
            <Text className="text-slate-600 dark:text-slate-300 font-extrabold text-[10px]">{questionsToday}/২০টি প্রশ্ন</Text>
          </View>
          <View className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <Animated.View 
              style={{
                width: progressWidth,
                height: 10,
                borderRadius: 5,
                backgroundColor: dailyGoalMet ? '#10b981' : '#fbbf24',
              }}
            />
          </View>
        </View>

        {/* Streak Milestone Track */}
        <View className="border-t border-slate-50 dark:border-slate-800/40 pt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-550 dark:text-slate-400 font-bold font-bengali text-[10px]">স্ট্রিক মাইলস্টোন</Text>
            <Text className="text-slate-600 dark:text-slate-300 font-extrabold text-[10px]">{currentStreak} দিন সচল</Text>
          </View>
          <View className="flex-row space-x-1.5">
            {[7, 14, 21, 30].map((milestone) => (
              <View
                key={milestone}
                className={`flex-1 h-1.5 rounded-full ${
                  currentStreak >= milestone
                    ? 'bg-orange-500'
                    : currentStreak >= milestone - 3
                    ? 'bg-orange-300'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </View>
          <View className="flex-row justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold font-bengali">
            <Text>৭ দিন</Text>
            <Text>১৪ দিন</Text>
            <Text>২১ দিন</Text>
            <Text>৩০ দিন</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LiveProgressTracker;