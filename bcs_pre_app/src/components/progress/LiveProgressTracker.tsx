// components/progress/LiveProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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

  const [progress, setProgress] = useState<LiveProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchLiveProgress();
    
    const interval = setInterval(fetchLiveProgress, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: Math.min((progress.questions_today / 20) * 100, 100),
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  const fetchLiveProgress = async () => {
    try {
      setRefreshing(true);
      
      // Mock data for demonstration - replace with actual API calls
      const mockProgress: LiveProgressData = {
        current_streak: Math.floor(Math.random() * 10) + 1,
        daily_goal_met: Math.random() > 0.5,
        questions_today: Math.floor(Math.random() * 25),
        accuracy_today: Math.floor(Math.random() * 40) + 60,
        time_spent_today: Math.floor(Math.random() * 120) + 10,
        recent_achievements: []
      };

      // Check for achievements
      checkAchievements(mockProgress);
      
      setProgress(mockProgress);
    } catch (error) {
      console.error('Error fetching live progress:', error);
      // Fallback to basic mock data
      setProgress({
        current_streak: 3,
        daily_goal_met: false,
        questions_today: 15,
        accuracy_today: 75,
        time_spent_today: 45,
        recent_achievements: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkAchievements = (progressData: LiveProgressData) => {
    // Check for daily goal
    if (progressData.questions_today >= 20 && !progressData.daily_goal_met) {
      triggerNotification('ডেইলি গোল অর্জিত! 🎉 ২০টি প্রশ্ন সম্পূর্ণ করেছেন।');
    }

    // Check for streak milestones
    if (progressData.current_streak === 7) {
      triggerNotification('১ সপ্তাহ স্ট্রীক অর্জন! 🔥 চালিয়ে যান!');
    }

    // Check for accuracy achievement
    if (progressData.accuracy_today >= 90) {
      triggerNotification('৯০%+ একুরেসি! 🎯 অসাধারণ পারফরমেন্স!');
    }
  };

  const triggerNotification = (message: string) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
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
    <View className={`flex-1 p-4 rounded-2xl border ${color} items-center mx-1`}>
      <Icon name={icon} size={24} color={getColorValue(color)} />
      <Text className="text-2xl font-bold mt-2" style={{ color: getColorValue(color) }}>
        {value}
      </Text>
      <Text className="text-sm font-bengali mt-1" style={{ color: getColorValue(color) }}>
        {label}
      </Text>
    </View>
  );

  const getColorValue = (colorClass: string) => {
    switch (colorClass) {
      case 'bg-orange-50 border-orange-200': return '#ea580c';
      case 'bg-blue-50 border-blue-200': return '#3b82f6';
      case 'bg-green-50 border-green-200': return '#16a34a';
      case 'bg-purple-50 border-purple-200': return '#9333ea';
      default: return '#6b7280';
    }
  };

  if (loading && !progress) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <View className="animate-pulse">
          <View className="h-6 bg-gray-200 rounded w-1/2 mb-6"></View>
          <View className="flex-row justify-between">
            {[...Array(4)].map((_, i) => (
              <View key={i} className="flex-1 items-center p-4 bg-gray-100 rounded-xl mx-1">
                <View className="h-6 bg-gray-200 rounded w-6 mb-2"></View>
                <View className="h-6 bg-gray-200 rounded w-12 mb-1"></View>
                <View className="h-4 bg-gray-200 rounded w-16"></View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (!progress) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <View className="items-center py-4">
          <Icon name="refresh" size={32} color="#dc2626" />
          <Text className="text-gray-500 font-bengali mt-2 text-center">
            লাইভ প্রগ্রেস লোড করতে সমস্যা হচ্ছে
          </Text>
          <TouchableOpacity 
            onPress={fetchLiveProgress}
            className="mt-3 px-4 py-2 bg-red-600 rounded-lg"
          >
            <Text className="text-white font-bengali">আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="mb-6">
      {/* Achievement Notification */}
      {showNotification && (
        <View className="absolute top-4 right-4 left-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg z-50 p-4">
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

      {/* Progress Tracker */}
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg font-semibold text-gray-900 font-bengali">
            আজকের প্রগ্রেস
          </Text>
          <View className="flex-row items-center space-x-2">
            <View className="w-2 h-2 bg-green-500 rounded-full"></View>
            <Text className="text-xs text-gray-500 font-bengali">লাইভ</Text>
            <TouchableOpacity 
              onPress={fetchLiveProgress}
              disabled={refreshing}
            >
              <Icon 
                name="refresh" 
                size={16} 
                color="#dc2626" 
                style={refreshing ? { transform: [{ rotate: '360deg' }] } : {}} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-6 -mx-1">
          <StatCard
            icon="flash"
            value={progress.current_streak}
            label="স্ট্রীক"
            color="bg-orange-50 border-orange-200"
          />
          <StatCard
            icon="target"
            value={`${progress.questions_today}/20`}
            label="প্রশ্ন"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            icon="trending-up"
            value={`${progress.accuracy_today.toFixed(1)}%`}
            label="একুরেসি"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            icon="time"
            value={progress.time_spent_today}
            label="মিনিট"
            color="bg-purple-50 border-purple-200"
          />
        </View>

        {/* Daily Goal Progress */}
        <View className="mb-6">
          <View className="flex-row justify-between text-sm mb-2">
            <Text className="text-gray-600 font-bengali">ডেইলি গোল প্রগ্রেস</Text>
            <Text className="text-gray-600">{progress.questions_today}/20 প্রশ্ন</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-3">
            <Animated.View 
              style={{
                width: progressWidth,
                height: 12,
                borderRadius: 6,
                backgroundColor: progress.daily_goal_met 
                  ? '#10b981' 
                  : '#f59e0b',
              }}
            />
          </View>
        </View>

        {/* Streak Progress */}
        <View>
          <View className="flex-row justify-between text-sm mb-2">
            <Text className="text-gray-600 font-bengali">স্ট্রীক মাইলস্টোন</Text>
            <Text className="text-gray-600">{progress.current_streak} দিন</Text>
          </View>
          <View className="flex-row space-x-1">
            {[7, 14, 21, 30].map((milestone) => (
              <View
                key={milestone}
                className={`flex-1 h-2 rounded-full ${
                  progress.current_streak >= milestone
                    ? 'bg-orange-500'
                    : progress.current_streak >= milestone - 3
                    ? 'bg-orange-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </View>
          <View className="flex-row justify-between text-xs text-gray-500 mt-1">
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