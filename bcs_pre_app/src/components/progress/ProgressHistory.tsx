// components/progress/ProgressHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface DailyActivity {
  date: string;
  questions_attempted: number;
  correct_answers: number;
  time_spent: string;
  daily_goal_met: boolean;
  accuracy?: number;
}

const ProgressHistory: React.FC = () => {
  const [history, setHistory] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressHistory();
  }, []);

  const fetchProgressHistory = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Mock data - replace with actual API call
      const mockHistory = generateMockHistory();
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching progress history:', error);
      setError('ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMockHistory = (): DailyActivity[] => {
    const history: DailyActivity[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const questionsAttempted = Math.floor(Math.random() * 30) + 5;
      const correctAnswers = Math.floor(questionsAttempted * (0.6 + Math.random() * 0.3));
      
      history.push({
        date: date.toISOString().split('T')[0],
        questions_attempted: questionsAttempted,
        correct_answers: correctAnswers,
        accuracy: Math.round((correctAnswers / questionsAttempted) * 100),
        time_spent: `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
        daily_goal_met: questionsAttempted >= 20
      });
    }
    
    return history;
  };

  const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    try {
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        return hours * 60 + minutes;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const DayItem = ({ day, index }: { day: DailyActivity; index: number }) => (
    <View 
      className={`flex-row items-center justify-between p-4 rounded-xl border mb-3 ${
        day.daily_goal_met
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Date */}
      <View className="flex-row items-center space-x-3 flex-1">
        <View className="w-10 h-10 bg-white rounded-lg border items-center justify-center">
          <MaterialIcons name="event" size={20} color="#6b7280" />
        </View>
        <View>
          <Text className="font-medium text-gray-900">
            {new Date(day.date).toLocaleDateString('bn-BD', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text className="text-sm text-gray-500 font-bengali">
            {day.daily_goal_met ? 'গোল অর্জিত ✅' : 'গোল বাকি ❌'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row items-center space-x-4">
        <View className="items-center">
          <View className="flex-row items-center space-x-1">
            <Icon name="target" size={16} color="#6b7280" />
            <Text className="text-gray-600">{day.questions_attempted}</Text>
          </View>
          <Text className="text-xs text-gray-500 font-bengali">প্রশ্ন</Text>
        </View>

        <View className="items-center">
          <View className="flex-row items-center space-x-1">
            <Icon name="trending-up" size={16} color={
              day.accuracy && day.accuracy >= 80 ? '#16a34a' :
              day.accuracy && day.accuracy >= 60 ? '#d97706' : '#dc2626'
            } />
            <Text className={
              day.accuracy && day.accuracy >= 80 ? 'text-green-600' :
              day.accuracy && day.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
            }>
              {day.accuracy?.toFixed(1)}%
            </Text>
          </View>
          <Text className="text-xs text-gray-500 font-bengali">একুরেসি</Text>
        </View>

        <View className="items-center">
          <View className="flex-row items-center space-x-1">
            <Icon name="time" size={16} color="#6b7280" />
            <Text className="text-gray-600">{Math.round(parseDuration(day.time_spent))}m</Text>
          </View>
          <Text className="text-xs text-gray-500 font-bengali">সময়</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <View className="space-y-4">
          <View className="h-6 bg-gray-200 rounded w-1/3"></View>
          {[...Array(7)].map((_, i) => (
            <View key={i} className="flex-row items-center space-x-4">
              <View className="h-10 bg-gray-200 rounded w-24"></View>
              <View className="flex-1 space-y-2">
                <View className="h-4 bg-gray-200 rounded w-3/4"></View>
                <View className="h-3 bg-gray-200 rounded w-1/2"></View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <View className="items-center py-4">
          <Text className="text-red-600 font-bengali mb-2">{error}</Text>
          <TouchableOpacity 
            onPress={fetchProgressHistory}
            className="px-4 py-2 bg-red-600 rounded-lg"
          >
            <Text className="text-white font-bengali">আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-900 font-bengali">
          গত ৭ দিনের অ্যাক্টিভিটি
        </Text>
        <TouchableOpacity 
          onPress={fetchProgressHistory}
          disabled={refreshing}
          className="flex-row items-center space-x-2"
        >
          <Icon 
            name="refresh" 
            size={16} 
            color="#dc2626" 
            style={refreshing ? { transform: [{ rotate: '360deg' }] } : {}} 
          />
          <Text className="text-red-600 font-bengali text-sm">রিফ্রেশ</Text>
        </TouchableOpacity>
      </View>

      {/* Activity List */}
      <ScrollView>
        <View className="space-y-3">
          {history.map((day, index) => (
            <DayItem key={day.date} day={day} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* Weekly Summary */}
      {history.length > 0 && (
        <View className="mt-6 pt-6 border-t border-gray-200">
          <Text className="font-semibold text-gray-900 mb-3 font-bengali">
            সাপ্তাহিক সামারি
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl font-bold text-gray-900">
                {history.reduce((sum, day) => sum + day.questions_attempted, 0)}
              </Text>
              <Text className="text-sm text-gray-600 font-bengali">মোট প্রশ্ন</Text>
            </View>
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl font-bold text-gray-900">
                {Math.round(
                  history.reduce((sum, day) => sum + (day.accuracy || 0), 0) / history.length
                )}%
              </Text>
              <Text className="text-sm text-gray-600 font-bengali">গড় একুরেসি</Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl font-bold text-gray-900">
                {history.filter(day => day.daily_goal_met).length}
              </Text>
              <Text className="text-sm text-gray-600 font-bengali">গোল অর্জিত</Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl font-bold text-gray-900">
                {Math.round(history.reduce((sum, day) => sum + parseDuration(day.time_spent), 0))}m
              </Text>
              <Text className="text-sm text-gray-600 font-bengali">মোট সময়</Text>
            </View>
          </View>
        </View>
      )}

      {history.length === 0 && (
        <View className="items-center py-8">
          <MaterialIcons name="event" size={48} color="#9ca3af" />
          <Text className="text-gray-500 font-bengali mt-3 text-center">
            কোন অ্যাক্টিভিটি ডেটা পাওয়া যায়নি
          </Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">
            আজকে কিছু প্রশ্ন চেষ্টা করুন!
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProgressHistory;