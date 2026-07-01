// screens/practice/PracticeHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  getUserSessions, 
  clearPracticeCache,
  syncPracticeOfflineAnswers 
} from '../../store/slices/practiceSlice';
import { PracticeSession } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

type PracticeHistoryScreenNavigationProp = NativeStackNavigationProp<
  any,
  'PracticeHistory'
>;

const PracticeHistoryScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<PracticeHistoryScreenNavigationProp>();
  
  const { sessions, isLoading, error, offlineAnswersCount, hasPendingSync } = useSelector(
    (state: RootState) => state.practice
  );

  const [filteredSessions, setFilteredSessions] = useState<PracticeSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'questions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSessionHistory();
    }, [])
  );

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchTerm, sortBy, sortOrder]);

  const loadSessionHistory = async () => {
    try {
      await dispatch(getUserSessions()).unwrap();
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessionHistory();
  };

  const filterAndSortSessions = useCallback(() => {
    let filtered = sessions.filter(
      (session) =>
        session.subject_names?.some((subject) =>
          subject.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (session.difficulty &&
          session.difficulty.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.session_type &&
          session.session_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.completed_at || a.started_at).getTime();
          bValue = new Date(b.completed_at || b.started_at).getTime();
          break;
        case 'score':
          aValue = getSessionScore(a);
          bValue = getSessionScore(b);
          break;
        case 'questions':
          aValue = a.total_questions;
          bValue = b.total_questions;
          break;
        default:
          aValue = new Date(a.completed_at || a.started_at).getTime();
          bValue = new Date(b.completed_at || b.started_at).getTime();
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'তারিখ পাওয়া যায়নি';
    }
  };

  const formatDuration = (duration: string | number | null) => {
    if (duration === null || duration === undefined) {
      return 'সময় পাওয়া যায়নি';
    }

    if (typeof duration === 'number') {
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const minutes = Math.round(duration % 60);
        return `${hours} ঘ ${minutes} মি`;
      } else if (duration >= 1) {
        return `${Math.round(duration)} মিনিট`;
      } else {
        const seconds = Math.round(duration * 60);
        return `${seconds} সেকেন্ড`;
      }
    }

    if (typeof duration === 'string') {
      if (duration.includes(':')) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;

        if (hours > 0) {
          return `${hours} ঘ ${minutes} মি`;
        } else if (minutes > 0) {
          return `${minutes} মিনিট`;
        } else {
          return `${seconds} সেকেন্ড`;
        }
      } else if (duration.startsWith('PT')) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return '0 মিনিট';

        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');

        if (hours > 0) {
          return `${hours} ঘ ${minutes} মি`;
        } else if (minutes > 0) {
          return `${minutes} মিনিট`;
        } else {
          return `${seconds} সেকেন্ড`;
        }
      }
    }

    return '0 মিনিট';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-rose-100';
  };

  const getSessionScore = (session: PracticeSession) => {
    return session.score || 0;
  };

  const deleteSession = async (sessionId: number) => {
    Alert.alert(
      'সেশন ডিলিট',
      'আপনি কি এই সেশনটি ডিলিট করতে চান?',
      [
        {
          text: 'বাতিল',
          style: 'cancel',
        },
        {
          text: 'ডিলিট',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would call your API to delete the session
              // For now, we'll just show a message
              Alert.alert('সফল', 'সেশন ডিলিট করা হয়েছে');
              // Reload sessions after deletion
              loadSessionHistory();
            } catch (error: any) {
              console.error('Failed to delete session:', error);
              Alert.alert('ত্রুটি', 'সেশন ডিলিট করতে সমস্যা হয়েছে');
            }
          },
        },
      ]
    );
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'সব ইতিহাস ডিলিট',
      'আপনি কি সব সেশন ইতিহাস ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।',
      [
        {
          text: 'বাতিল',
          style: 'cancel',
        },
        {
          text: 'ডিলিট',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearPracticeCache()).unwrap();
              Alert.alert('সফল', 'সব সেশন ইতিহাস ডিলিট করা হয়েছে');
            } catch (error: any) {
              console.error('Failed to clear history:', error);
              Alert.alert('ত্রুটি', 'ইতিহাস ডিলিট করতে সমস্যা হয়েছে');
            }
          },
        },
      ]
    );
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  const syncOfflineData = async () => {
    try {
      await dispatch(syncPracticeOfflineAnswers()).unwrap();
      Alert.alert('সফল', 'অফলাইন ডাটা সিঙ্ক করা হয়েছে');
      loadSessionHistory();
    } catch (error) {
      Alert.alert('ত্রুটি', 'ডাটা সিঙ্ক করতে সমস্যা হয়েছে');
    }
  };

  const getSessionStatus = (session: PracticeSession) => {
    if (!session.is_completed) return 'অসম্পূর্ণ';
    const score = getSessionScore(session);
    if (score >= 80) return 'চমৎকার';
    if (score >= 60) return 'ভালো';
    if (score >= 40) return 'মধ্যম';
    return 'প্রয়োজন উন্নতি';
  };

  const getSessionStatusColor = (session: PracticeSession) => {
    if (!session.is_completed) return 'bg-amber-100 text-amber-800';
    const score = getSessionScore(session);
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 60) return 'bg-amber-100 text-amber-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-rose-100 text-rose-800';
  };

  if (isLoading && sessions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg font-bengali">
          সেশন ইতিহাস লোড হচ্ছে...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-purple-600 pt-4 pb-4 px-6">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-blue-500/80 p-2 rounded-xl"
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-white text-xl font-bold font-bengali text-center">
              প্র্যাকটিস সেশন ইতিহাস
            </Text>
            <Text className="text-blue-200 text-sm font-bengali text-center mt-1">
              আপনার পূর্ববর্তী সকল প্র্যাকটিস সেশনের ফলাফল
            </Text>
          </View>
          
          {hasPendingSync && (
            <TouchableOpacity onPress={syncOfflineData} className="p-2">
              <Icon name="sync" size={20} color="#fbbf24" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats */}
        {sessions.length > 0 && (
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-4">
              <View className="items-center">
                <Text className="text-white text-lg font-bold">{sessions.length}</Text>
                <Text className="text-blue-200 text-xs font-bengali">মোট সেশন</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-lg font-bold">
                  {sessions.length > 0
                    ? Math.round(
                        sessions.reduce(
                          (acc, session) => acc + getSessionScore(session),
                          0
                        ) / sessions.length
                      )
                    : 0}%
                </Text>
                <Text className="text-blue-200 text-xs font-bengali">গড় স্কোর</Text>
              </View>
              {offlineAnswersCount > 0 && (
                <View className="items-center">
                  <Text className="text-amber-300 text-lg font-bold">{offlineAnswersCount}</Text>
                  <Text className="text-amber-200 text-xs font-bengali">অফলাইন</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="p-4">
          {error && (
            <View className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <Text className="text-red-700 font-bengali">{error}</Text>
              <TouchableOpacity
                onPress={loadSessionHistory}
                className="mt-2 bg-red-600 py-2 px-4 rounded-lg self-start"
              >
                <Text className="text-white text-sm font-bengali">
                  আবার চেষ্টা করুন
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search and Controls */}
          {sessions.length > 0 && (
            <View className="mb-4 space-y-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                {/* Search */}
                <View className="mb-4">
                  <View className="relative">
                    <Icon
                      name="search"
                      size={20}
                      color="#9ca3af"
                      style={{ position: 'absolute', left: 12, top: 12 }}
                    />
                    <TextInput
                      placeholder="বিষয়, কঠিনতা বা ধরন অনুসন্ধান..."
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-bengali"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Sort and Actions Row */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => setShowSortModal(true)}
                      className="flex-row items-center bg-gray-100 py-2 px-4 rounded-lg"
                    >
                      <Icon name="filter" size={16} color="#4b5563" />
                      <Text className="text-gray-700 ml-2 font-bengali">
                        {sortBy === 'date' ? 'তারিখ' : sortBy === 'score' ? 'স্কোর' : 'প্রশ্ন'} {sortOrder === 'desc' ? '↓' : '↑'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={clearAllHistory}
                      className="bg-rose-600 py-2 px-4 rounded-lg"
                    >
                      <Text className="text-white font-bengali">
                        সব ডিলিট
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <View className="bg-white rounded-2xl shadow-xl p-8 items-center">
              <Text className="text-4xl mb-4">📊</Text>
              <Text className="text-2xl font-bold text-gray-900 mb-4 font-bengali text-center">
                {sessions.length === 0
                  ? 'কোন সেশন পাওয়া যায়নি'
                  : 'কোন মিল পাওয়া যায়নি'}
              </Text>
              <Text className="text-gray-600 mb-6 font-bengali text-center">
                {sessions.length === 0
                  ? 'আপনি এখনো কোন প্র্যাকটিস সেশন সম্পন্ন করেননি'
                  : 'আপনার অনুসন্ধানের সাথে মিলে এমন কোন সেশন পাওয়া যায়নি'}
              </Text>
              {sessions.length === 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Practice')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-8 rounded-xl"
                >
                  <Text className="text-white font-semibold font-bengali">
                    প্রথম সেশন শুরু করুন
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="space-y-3">
              {filteredSessions.map((session) => {
                const sessionScore = getSessionScore(session);
                return (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() => navigation.navigate('PracticeResults', { sessionId: session.id })}
                    className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <View className="flex-row flex-wrap items-center gap-2 mb-2">
                          <Text className="text-sm text-gray-500 font-bengali">
                            {formatDate(session.completed_at || session.started_at)}
                          </Text>
                          <View className={`px-2 py-1 rounded-full ${getSessionStatusColor(session)}`}>
                            <Text className="text-xs font-medium font-bengali">
                              {getSessionStatus(session)}
                            </Text>
                          </View>
                          {session.difficulty && session.difficulty !== 'all' && (
                            <View className="px-2 py-1 rounded-full bg-gray-100">
                              <Text className="text-xs text-gray-800 font-bengali">
                                {getDifficultyText(session.difficulty)}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text className="text-lg font-semibold text-gray-900 mb-2 font-bengali">
                          {session.subject_names?.join(', ') || 'বিষয় পাওয়া যায়নি'}
                        </Text>

                        <View className="flex-row flex-wrap gap-4">
                          <Text className="text-sm text-gray-600 font-bengali">
                            {session.total_questions} টি প্রশ্ন
                          </Text>
                          <Text className="text-sm text-gray-600 font-bengali">
                            {formatDuration(session.duration_minutes || session.time_taken)}
                          </Text>
                          <Text className="text-sm text-gray-600 font-bengali">
                            {session.completed_questions || 0} উত্তর দেওয়া
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => deleteSession(session.id)}
                        className="p-2"
                      >
                        <Icon name="trash-outline" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
                      <View className="flex-row items-center space-x-6">
                        <View className="items-center">
                          <Text className={`text-xl font-bold ${getScoreColor(sessionScore)}`}>
                            {sessionScore.toFixed(1)}%
                          </Text>
                          <Text className="text-xs text-gray-600 font-bengali">স্কোর</Text>
                        </View>
                        
                        <View className="flex-row space-x-4">
                          <View className="items-center">
                            <Text className="text-lg font-bold text-emerald-600">
                              {session.correct_answers || 0}
                            </Text>
                            <Text className="text-xs text-gray-600 font-bengali">সঠিক</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-lg font-bold text-rose-600">
                              {session.wrong_answers || 0}
                            </Text>
                            <Text className="text-xs text-gray-600 font-bengali">ভুল</Text>
                          </View>
                        </View>
                      </View>

                      <Icon name="chevron-forward" size={20} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PracticeHome')}
            className="bg-gray-600 py-4 rounded-xl mt-6"
          >
            <Text className="text-white text-center font-semibold font-bengali">
              প্র্যাকটিস হোম
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold mb-4 font-bengali text-center">
              সাজানোর অপশন
            </Text>
            
            <View className="space-y-4">
              <Text className="font-semibold text-gray-700 font-bengali">সাজানোর ধরন</Text>
              {[
                { value: 'date' as const, label: 'তারিখ' },
                { value: 'score' as const, label: 'স্কোর' },
                { value: 'questions' as const, label: 'প্রশ্ন সংখ্যা' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSortBy(option.value)}
                  className={`flex-row justify-between items-center py-3 ${
                    sortBy === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <Text className="font-bengali text-lg">{option.label}</Text>
                  {sortBy === option.value && (
                    <Icon name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}

              <Text className="font-semibold text-gray-700 font-bengali mt-4">ক্রম</Text>
              {[
                { value: 'desc' as const, label: 'অবরোহী (নতুন থেকে পুরাতন)' },
                { value: 'asc' as const, label: 'আরোহী (পুরাতন থেকে নতুন)' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSortOrder(option.value)}
                  className={`flex-row justify-between items-center py-3 ${
                    sortOrder === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <Text className="font-bengali text-lg">{option.label}</Text>
                  {sortOrder === option.value && (
                    <Icon name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                className="bg-blue-600 py-4 rounded-xl mt-4"
              >
                <Text className="text-white text-center font-semibold font-bengali text-lg">
                  প্রয়োগ করুন
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PracticeHistoryScreen;