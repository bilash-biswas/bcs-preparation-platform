// src/screens/leaderboard/LeaderboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchLeaderboard } from '../../store/slices/leaderboardSlice';
import { LeaderboardEntry } from '../../types';

const LeaderboardScreen = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { leaderboard, loading, error } = useSelector((state: RootState) => state.leaderboard);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      await dispatch(fetchLeaderboard(timeframe)).unwrap();
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      Alert.alert('ত্রুটি', 'লিডারবোর্ড লোড করতে সমস্যা হয়েছে');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-50 border-yellow-200';
    if (index === 1) return 'bg-gray-50 border-gray-200';
    if (index === 2) return 'bg-orange-50 border-orange-200';
    return 'bg-white border-gray-200';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return (index + 1).toString();
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-500';
    if (index === 2) return 'bg-orange-500';
    return 'bg-gray-200';
  };

  const getMedalTextColor = (index: number) => {
    return index < 3 ? 'text-white' : 'text-gray-700';
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-gradient-to-b from-red-50 to-orange-100 justify-center items-center">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="text-gray-600 mt-4 font-bengali">লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-b from-red-50 to-orange-100">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <View className="text-center mb-8">
            <Text className="text-4xl font-bold text-gray-900 mb-4 font-bengali">
              লিডারবোর্ড
            </Text>
            <Text className="text-gray-600 mb-6 font-bengali text-center">
              শীর্ষ প্রতিযোগীদের সাথে আপনার দক্ষতা তুলনা করুন
            </Text>
            
            {/* Timeframe Selector */}
            <View className="flex-row bg-white rounded-xl p-1 shadow-sm border self-center">
              <TouchableOpacity
                onPress={() => setTimeframe('weekly')}
                className={`px-6 py-3 rounded-lg font-semibold font-bengali ${
                  timeframe === 'weekly'
                    ? 'bg-red-600'
                    : 'bg-transparent'
                }`}
              >
                <Text className={
                  timeframe === 'weekly'
                    ? 'text-white font-semibold'
                    : 'text-gray-600 font-semibold'
                }>
                  সাপ্তাহিক
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimeframe('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold font-bengali ${
                  timeframe === 'monthly'
                    ? 'bg-red-600'
                    : 'bg-transparent'
                }`}
              >
                <Text className={
                  timeframe === 'monthly'
                    ? 'text-white font-semibold'
                    : 'text-gray-600 font-semibold'
                }>
                  মাসিক
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <Text className="text-red-700 font-bengali text-center">{error}</Text>
              <TouchableOpacity
                onPress={loadLeaderboard}
                className="mt-2 bg-red-600 rounded-lg py-2"
              >
                <Text className="text-white text-center font-bengali">
                  আবার চেষ্টা করুন
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Leaderboard Content */}
          {!loading && leaderboard && leaderboard.length > 0 && (
            <View className="space-y-3">
              {leaderboard.map((entry: LeaderboardEntry, index: number) => (
                <View
                  key={entry.id}
                  className={`flex-row items-center p-6 rounded-2xl border-2 ${getRankColor(index)} mb-3`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: index < 3 ? 0.1 : 0.05,
                    shadowRadius: index < 3 ? 8 : 4,
                    elevation: index < 3 ? 4 : 2,
                  }}
                >
                  {/* Rank Badge */}
                  <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${getMedalColor(index)}`}>
                    <Text className={`font-bold text-lg ${getMedalTextColor(index)}`}>
                      {getRankIcon(index)}
                    </Text>
                  </View>

                  {/* User Info */}
                  <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-900 mb-1">
                      {entry.username.toUpperCase()}
                    </Text>
                    <View className="flex-row flex-wrap">
                      <Text className="text-sm text-gray-600 font-bengali mr-4">
                        {entry.total_attempts}টি অ্যাটেম্পট
                      </Text>
                      <Text className="text-sm text-gray-600 font-bengali">
                        {entry.average_accuracy}% সঠিকতা
                      </Text>
                    </View>
                  </View>

                  {/* Score */}
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-red-600">
                      {Math.round(entry.total_score)}
                    </Text>
                    <Text className="text-sm text-gray-500 font-bengali">
                      স্কোর
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loading && (!leaderboard || leaderboard.length === 0) && (
            <View className="items-center py-16 bg-white rounded-2xl border mt-8">
              <Text className="text-gray-400 text-6xl mb-6">🏆</Text>
              <Text className="text-2xl font-bold text-gray-600 mb-4 font-bengali text-center">
                এখনো কোন স্কোর নেই
              </Text>
              <Text className="text-gray-500 mb-6 font-bengali text-center">
                প্রথম কুইজ দিন এবং লিডারবোর্ডে আপনার নাম দেখুন
              </Text>
              <TouchableOpacity
                onPress={() => {/* Navigate to practice */}}
                className="bg-red-600 rounded-xl px-8 py-4"
              >
                <Text className="text-white font-semibold font-bengali">
                  কুইজ শুরু করুন
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default LeaderboardScreen;