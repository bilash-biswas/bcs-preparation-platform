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
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchLeaderboard } from '../../store/slices/leaderboardSlice';
import { LeaderboardEntry } from '../../types';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

const LeaderboardScreen = ({ navigation }: any) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useAppTheme();
  
  const dispatch = useDispatch<AppDispatch>();
  const { leaderboard, loading, error } = useSelector((state: RootState) => state.leaderboard);
  const { user } = useSelector((state: RootState) => state.auth);

  const isCurrentUserInLeaderboard = leaderboard && Array.isArray(leaderboard) && user
    ? leaderboard.some(entry => entry.username.toLowerCase() === user.username.toLowerCase())
    : false;

  const currentUserRank = leaderboard && Array.isArray(leaderboard) && user
    ? leaderboard.findIndex(entry => entry.username.toLowerCase() === user.username.toLowerCase())
    : -1;

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      await dispatch(fetchLeaderboard(timeframe)).unwrap();
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      Alert.alert('ত্রুটি', 'লিডারবোর্ড লোড করতে সমস্যা হয়েছে');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'border-amber-400 bg-amber-500/5 dark:bg-amber-400/5';
    if (index === 1) return 'border-slate-300 bg-slate-400/5 dark:bg-slate-300/5';
    if (index === 2) return 'border-orange-400 bg-orange-500/5 dark:bg-orange-400/5';
    return 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'bg-amber-500';
    if (index === 1) return 'bg-slate-400 dark:bg-slate-500';
    if (index === 2) return 'bg-orange-500';
    return 'bg-slate-100 dark:bg-slate-800 border border-slate-200/20';
  };

  const getMedalTextColor = (index: number) => {
    return index < 3 ? 'text-white' : 'text-slate-500 dark:text-slate-400';
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 mt-4 font-bengali text-sm font-bold">লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-14 pb-6 px-6 border-b border-slate-100 dark:border-slate-800/80 rounded-b-[36px] shadow-sm">
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali text-center">
          লিডারবোর্ড
        </Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1 leading-5 font-bengali">
          শীর্ষ প্রতিযোগীদের সাথে আপনার স্কোর ও সঠিকতা তুলনা করুন
        </Text>
        
        {/* Timeframe Selector Button Row */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#020617' : '#f8fafc',
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            borderRadius: 16,
            padding: 4,
            marginTop: 20,
            alignSelf: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setTimeframe('weekly')}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: timeframe === 'weekly' ? (isDark ? '#8b5cf6' : '#7c3aed') : 'transparent',
              shadowColor: timeframe === 'weekly' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: timeframe === 'weekly' ? 0.15 : 0,
              shadowRadius: 2,
              elevation: timeframe === 'weekly' ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSansBengali',
                fontWeight: timeframe === 'weekly' ? '900' : 'bold',
                fontSize: 12,
                color: timeframe === 'weekly' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              সাপ্তাহিক
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeframe('monthly')}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: timeframe === 'monthly' ? (isDark ? '#8b5cf6' : '#7c3aed') : 'transparent',
              shadowColor: timeframe === 'monthly' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: timeframe === 'monthly' ? 0.15 : 0,
              shadowRadius: 2,
              elevation: timeframe === 'monthly' ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSansBengali',
                fontWeight: timeframe === 'monthly' ? '900' : 'bold',
                fontSize: 12,
                color: timeframe === 'monthly' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              মাসিক
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7c3aed']}
            tintColor="#7c3aed"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
      >
        {/* Error Message */}
        {error && (
          <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4.5 mb-5 flex-row items-center justify-between">
            <Text className="text-red-700 dark:text-red-400 font-bengali text-xs flex-1 pr-2">{error}</Text>
            <TouchableOpacity
              onPress={loadLeaderboard}
              className="bg-red-500 px-3.5 py-2 rounded-xl"
            >
              <Text className="text-white text-xs font-bold font-bengali">পুনরায় চেষ্টা</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Podium for Top 3 */}
        {!loading && leaderboard && leaderboard.length > 0 && (
          <View className="flex-row items-end justify-center mb-8 pt-6">
            {/* Rank 2 (Left) */}
            {leaderboard[1] && (
              <View className="items-center flex-1">
                <View className="relative items-center mb-2">
                  <View className="w-15 h-15 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-300 items-center justify-center shadow">
                    <Text className="text-xl font-bold text-slate-700 dark:text-slate-200">
                      {leaderboard[1].username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="absolute top-[-12px] bg-slate-400 px-2 py-0.5 rounded-full shadow">
                    <Text className="text-white text-[8px] font-black font-bengali">🥈 ২য়</Text>
                  </View>
                </View>
                <Text className="font-extrabold text-xs text-slate-700 dark:text-slate-300 text-center max-w-[80px]" numberOfLines={1}>
                  {leaderboard[1].username.toUpperCase()}
                </Text>
                <Text className="text-[10px] font-black text-primary-600 dark:text-primary-400 mt-0.5">
                  {Math.round(leaderboard[1].total_score)}
                </Text>
              </View>
            )}

            {/* Rank 1 (Middle) - Tallest */}
            {leaderboard[0] && (
              <View className="items-center flex-1 z-10 scale-110 pb-2">
                <View className="relative items-center mb-3">
                  <View className="w-18 h-18 rounded-full bg-amber-50 dark:bg-amber-950/20 border-4 border-amber-400 items-center justify-center shadow-lg">
                    <Text className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {leaderboard[0].username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="absolute top-[-16px] bg-amber-400 px-2.5 py-0.5 rounded-full shadow flex-row items-center gap-0.5">
                    <Text className="text-white text-[8px] font-black font-bengali">👑 ১ম</Text>
                  </View>
                </View>
                <Text className="font-black text-sm text-slate-800 dark:text-slate-100 text-center max-w-[90px]" numberOfLines={1}>
                  {leaderboard[0].username.toUpperCase()}
                </Text>
                <Text className="text-xs font-black text-primary-600 dark:text-primary-400 mt-0.5">
                  {Math.round(leaderboard[0].total_score)}
                </Text>
              </View>
            )}

            {/* Rank 3 (Right) */}
            {leaderboard[2] && (
              <View className="items-center flex-1">
                <View className="relative items-center mb-2">
                  <View className="w-15 h-15 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-orange-400/80 items-center justify-center shadow">
                    <Text className="text-xl font-bold text-orange-700 dark:text-orange-400">
                      {leaderboard[2].username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="absolute top-[-12px] bg-orange-400 px-2 py-0.5 rounded-full shadow">
                    <Text className="text-white text-[8px] font-black font-bengali">🥉 ৩য়</Text>
                  </View>
                </View>
                <Text className="font-extrabold text-xs text-slate-700 dark:text-slate-300 text-center max-w-[80px]" numberOfLines={1}>
                  {leaderboard[2].username.toUpperCase()}
                </Text>
                <Text className="text-[10px] font-black text-primary-600 dark:text-primary-400 mt-0.5">
                  {Math.round(leaderboard[2].total_score)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Leaderboard Entries List (Rank 4 onwards) */}
        {!loading && leaderboard && leaderboard.length > 3 && (
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-5 shadow-sm">
            <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 px-2 font-bengali uppercase tracking-wider">
              🏆 অন্য প্রতিযোগীবৃন্দ
            </Text>
            <View className="gap-3">
              {leaderboard.slice(3).map((entry: LeaderboardEntry, subIndex: number) => {
                const actualIndex = subIndex + 3;
                return (
                  <View
                    key={entry.id}
                    className="flex-row items-center py-3.5 px-3.5 rounded-2xl border border-slate-50 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-950/20"
                  >
                    {/* Rank Badge Indicator */}
                    <View className="w-8 h-8 rounded-xl items-center justify-center mr-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/20">
                      <Text className="font-black text-xs text-slate-500 dark:text-slate-400">
                        #{actualIndex + 1}
                      </Text>
                    </View>

                    {/* User Profile Info */}
                    <View className="flex-1 pr-2">
                      <Text className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-0.5">
                        {entry.username.toUpperCase()}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                          <Icon name="checkbox-outline" size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                          <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
                            {entry.total_attempts}টি সেশন
                          </Text>
                        </View>
                        <View className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <View className="flex-row items-center gap-1">
                          <Icon name="speedometer-outline" size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                          <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
                            {entry.average_accuracy}% সঠিকতা
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Total Score Output */}
                    <View className="items-end bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60 shadow-xs">
                      <Text className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                        {Math.round(entry.total_score)}
                      </Text>
                      <Text className="text-[8px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
                        স্কোর
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && (!leaderboard || leaderboard.length === 0) && (
          <View className="items-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl px-8 shadow-sm">
            <Text className="text-slate-400 text-6xl mb-4">🏆</Text>
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 font-bengali text-center">
              এখনো কোন স্কোর নেই
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-center text-xs mb-6 font-bengali leading-5">
              প্রথম প্র্যাকটিস বা কুইজ সেশন সম্পন্ন করে লিডারবোর্ডে নিজের অবস্থান অর্জন করুন।
            </Text>
            <TouchableOpacity
              onPress={loadLeaderboard}
              className="bg-primary-600 dark:bg-primary-500 rounded-2xl px-6 py-3.5 shadow-sm"
            >
              <Text className="text-white font-bold font-bengali text-sm">
                লিডারবোর্ড রিফ্রেশ করুন
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom User Card */}
      {!loading && leaderboard && leaderboard.length > 0 && user && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Practice' as any)}
          className="bg-primary-600 dark:bg-primary-500 p-4.5 rounded-t-[32px] shadow-2xl flex-row items-center border-t border-primary-500/30"
        >
          <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center mr-3 border border-white/10">
            <Text className="text-white font-extrabold text-xs">
              {currentUserRank !== -1 ? `#${currentUserRank + 1}` : `#${leaderboard.length + 1}+`}
            </Text>
          </View>
          
          <View className="flex-1 pr-2">
            <Text className="font-extrabold text-sm text-white mb-0.5">
              {user.username.toUpperCase()} (আপনি)
            </Text>
            <Text className="text-[10px] text-primary-100 font-bengali">
              {currentUserRank !== -1 
                ? `${leaderboard[currentUserRank].total_attempts}টি সেশন • ${leaderboard[currentUserRank].average_accuracy}% সঠিকতা`
                : 'লিডারবোর্ডে যুক্ত হতে সেশন বা কুইজ সম্পন্ন করুন'}
            </Text>
          </View>
          
          <View className="bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/25">
            <Text className="text-xs font-black text-white font-bengali">
              {currentUserRank !== -1 
                ? `${Math.round(leaderboard[currentUserRank].total_score)} স্কোর`
                : 'শুরু করুন'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LeaderboardScreen;