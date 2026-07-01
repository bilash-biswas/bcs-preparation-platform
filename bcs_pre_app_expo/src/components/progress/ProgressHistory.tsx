// src/components/progress/ProgressHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Ionicons as Icon } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { useAppTheme } from '../../context/ThemeContext';

interface DailyActivity {
  date: string;
  questions_attempted: number;
  correct_answers: number;
  time_spent: string;
  daily_goal_met: boolean;
  accuracy?: number;
}

const ProgressHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, isLoading } = useSelector((state: RootState) => state.practice);
  const { isDark } = useAppTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<DailyActivity[]>([]);

  useEffect(() => {
    calculateHistoryData();
  }, [sessions]);

  const calculateHistoryData = () => {
    const dailyMap: { [key: string]: DailyActivity } = {};
    const today = new Date();
    
    // Initialize the last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyMap[dateStr] = {
        date: dateStr,
        questions_attempted: 0,
        correct_answers: 0,
        time_spent: '0:00',
        daily_goal_met: false,
        accuracy: 0,
      };
    }

    // Populate data from real sessions in Redux
    const activeSessions = sessions || [];
    let timeSpentSecondsMap: { [key: string]: number } = {};
    
    activeSessions.forEach(s => {
      const sessionDateStr = (s.completed_at || s.started_at)?.split('T')[0];
      
      if (sessionDateStr && dailyMap[sessionDateStr]) {
        dailyMap[sessionDateStr].questions_attempted += (s.completed_questions || 0);
        dailyMap[sessionDateStr].correct_answers += (s.correct_answers || 0);
        
        // Parse session duration time
        let secs = 0;
        if (s.time_taken) {
          if (s.time_taken.includes(':')) {
            const parts = s.time_taken.split(':').map(Number);
            if (parts.length === 3) {
              secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              secs = parts[0] * 60 + parts[1];
            }
          } else {
            secs = parseInt(s.time_taken) || 0;
          }
        }
        timeSpentSecondsMap[sessionDateStr] = (timeSpentSecondsMap[sessionDateStr] || 0) + secs;
      }
    });

    // Finalize accuracy and formatting
    const updatedHistory: DailyActivity[] = Object.keys(dailyMap).sort().map(dateKey => {
      const item = dailyMap[dateKey];
      const secs = timeSpentSecondsMap[dateKey] || 0;
      const hours = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      
      item.time_spent = hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:00` : `0:${mins.toString().padStart(2, '0')}:00`;
      item.accuracy = item.questions_attempted > 0 ? (item.correct_answers / item.questions_attempted) * 100 : 0;
      item.daily_goal_met = item.questions_attempted >= 20; // Goal is 20 questions
      
      return item;
    });

    setHistory(updatedHistory);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(getUserSessions()).unwrap();
    } catch (error) {
      console.error('Error refreshing progress history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const parseDurationMins = (duration: string): number => {
    if (!duration) return 0;
    try {
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 60 + minutes;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const DayItem = ({ day }: { day: DailyActivity }) => (
    <View 
      className={`flex-row items-center justify-between p-4 rounded-2xl border mb-3 shadow-sm ${
        day.daily_goal_met
          ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30'
          : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800/80'
      }`}
    >
      {/* Date */}
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/30 items-center justify-center mr-3">
          <MaterialIcons name="event" size={18} color={isDark ? '#a78bfa' : '#6b7280'} />
        </View>
        <View>
          <Text className="text-xs font-black text-slate-800 dark:text-slate-100 font-bengali">
            {new Date(day.date).toLocaleDateString('bn-BD', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text className="text-[9px] text-slate-450 dark:text-slate-500 font-bengali mt-0.5">
            {day.daily_goal_met ? 'ডেইলি গোল অর্জিত 🎉' : 'ডেইলি গোল বাকি ⌛'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row items-center gap-4">
        <View className="items-center">
          <View className="flex-row items-center">
            <Icon name="checkmark-done-outline" size={14} color={isDark ? '#cbd5e1' : '#475569'} style={{ marginRight: 2 }} />
            <Text className="text-xs font-black text-slate-850 dark:text-slate-100">{day.questions_attempted}</Text>
          </View>
          <Text className="text-[8px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">প্রশ্ন</Text>
        </View>

        <View className="items-center">
          <View className="flex-row items-center">
            <Icon 
              name="trending-up-outline" 
              size={14} 
              color={
                day.accuracy && day.accuracy >= 80 ? '#10b981' :
                day.accuracy && day.accuracy >= 60 ? '#f59e0b' : '#ef4444'
              } 
              style={{ marginRight: 2 }}
            />
            <Text className={`text-xs font-black ${
              day.accuracy && day.accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              day.accuracy && day.accuracy >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-455'
            }`}>
              {day.accuracy ? `${day.accuracy.toFixed(0)}%` : '০%'}
            </Text>
          </View>
          <Text className="text-[8px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">সঠিকতা</Text>
        </View>

        <View className="items-center">
          <View className="flex-row items-center">
            <Icon name="time-outline" size={14} color={isDark ? '#cbd5e1' : '#475569'} style={{ marginRight: 2 }} />
            <Text className="text-xs font-black text-slate-850 dark:text-slate-100">{Math.round(parseDurationMins(day.time_spent))}মি.</Text>
          </View>
          <Text className="text-[8px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">সময়</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && sessions.length === 0) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 items-center justify-center min-h-[250px]">
        <ActivityIndicator size="small" color="#7c3aed" />
        <Text className="text-slate-400 mt-2 font-bengali text-xs">গত ৭ দিনের প্রগতি এনালাইসিস করা হচ্ছে...</Text>
      </View>
    );
  }

  const validDays = history.filter(h => h.questions_attempted > 0);
  const averageAccuracy = validDays.length > 0 
    ? Math.round(validDays.reduce((sum, d) => sum + (d.accuracy || 0), 0) / validDays.length) 
    : 0;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-xs font-black text-slate-800 dark:text-slate-100 font-bengali">
          গত ৭ দিনের লার্নিং অ্যাক্টিভিটি
        </Text>
        <TouchableOpacity 
          onPress={handleRefresh}
          disabled={refreshing}
          className="flex-row items-center"
        >
          <Icon 
            name="refresh" 
            size={14} 
            color="#7c3aed" 
            style={refreshing ? { transform: [{ rotate: '360deg' }] } : {}} 
          />
          <Text className="text-primary-655 dark:text-primary-400 font-bold font-bengali text-[10px] ml-1.5">রিফ্রেশ</Text>
        </TouchableOpacity>
      </View>

      {/* Activity List */}
      <View className="mb-2">
        {history.map((day) => (
          <DayItem key={day.date} day={day} />
        ))}
      </View>

      {/* Weekly Summary */}
      {history.length > 0 && (
        <View className="mt-4 pt-5 border-t border-slate-50 dark:border-slate-800/40">
          <Text className="text-[10px] font-black text-slate-800 dark:text-slate-100 mb-4 font-bengali">
            সাপ্তাহিক সংক্ষিপ্ত বিবরণী
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="items-center w-1/2 mb-4">
              <Text className="text-base font-black text-slate-800 dark:text-slate-105">
                {history.reduce((sum, day) => sum + day.questions_attempted, 0)} টি
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">মোট প্রশ্ন সমাধান</Text>
            </View>
            <View className="items-center w-1/2 mb-4">
              <Text className="text-base font-black text-slate-800 dark:text-slate-105">
                {averageAccuracy}%
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">গড় সঠিকতার হার</Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-base font-black text-slate-800 dark:text-slate-105">
                {history.filter(day => day.daily_goal_met).length} দিন
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">ডেইলি গোল অর্জিত</Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-base font-black text-slate-800 dark:text-slate-105">
                {Math.round(history.reduce((sum, day) => sum + parseDurationMins(day.time_spent), 0))} মি.
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">মোট ব্যয়কৃত সময়</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProgressHistory;