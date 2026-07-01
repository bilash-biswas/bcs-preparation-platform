import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store';
import { fetchAvailableQuizzes } from '../store/slices/quizSlice';
import { getUserSessions } from '../store/slices/practiceSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { quizzes = [] } = useSelector((state: RootState) => state.quiz); 
  const { sessions = [] } = useSelector((state: RootState) => state.practice); 
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAvailableQuizzes()),
        dispatch(getUserSessions()),
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

  // Safe array slicing with fallbacks
  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];
  const availableQuizzes = Array.isArray(quizzes) ? quizzes.slice(0, 3) : [];

  const quickActions = [
    {
      title: 'প্র্যাকটিস শুরু করুন',
      subtitle: 'নিজের গতি অনুযায়ী প্র্যাকটিস করুন',
      icon: '🎯',
      screen: 'Practice' as keyof RootStackParamList,
      color: 'bg-red-500',
    },
    {
      title: 'কুইজ দিন',
      subtitle: 'সময়ের মধ্যে কুইজ সম্পন্ন করুন',
      icon: '📝',
      screen: 'Quizzes' as keyof RootStackParamList,
      color: 'bg-green-500',
    },
    {
      title: 'প্রগতি দেখুন',
      subtitle: 'আপনার উন্নতি বিশ্লেষণ করুন',
      icon: '📊',
      screen: 'Progress' as keyof RootStackParamList,
      color: 'bg-blue-500',
    },
    {
      title: 'লিডারবোর্ড',
      subtitle: 'অন্যান্য প্রতিযোগীদের সাথে প্রতিযোগিতা করুন',
      icon: '🏆',
      screen: 'Leaderboard' as keyof RootStackParamList,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar backgroundColor="#f9fafb" barStyle="dark-content" />
      
      {/* Header Section */}
      <View className="bg-white pt-12 pb-6 px-6 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900 font-bengali">
              স্বাগতম, {user?.username || 'ব্যবহারকারী'}!
            </Text>
            <Text className="text-gray-600 mt-1 font-bengali">
              আপনার বিসিএস প্রস্তুতি যাত্রা অব্যাহত রাখুন
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile' as any)}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-6">
        {/* Stats Cards */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-4">
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mr-2">
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold text-red-600">7</Text>
                <Text className="text-lg ml-2">🔥</Text>
              </View>
              <Text className="text-sm text-gray-600 mt-1 font-bengali">দিন স্ট্রীক</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-2">
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold text-green-600">85%</Text>
                <Text className="text-lg ml-2">🎯</Text>
              </View>
              <Text className="text-sm text-gray-600 mt-1 font-bengali">সঠিকতা</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 ml-2">
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold text-yellow-600">42</Text>
                <Text className="text-lg ml-2">❓</Text>
              </View>
              <Text className="text-sm text-gray-600 mt-1 font-bengali">প্রশ্ন</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4 font-bengali">দ্রুত একশন</Text>
          <View className="space-y-3">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className={`${action.color} rounded-xl p-4 shadow-sm mb-3`}
                onPress={() => navigation.navigate(action.screen as any)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg font-bengali">
                      {action.title}
                    </Text>
                    <Text className="text-white text-opacity-90 text-sm mt-1 font-bengali">
                      {action.subtitle}
                    </Text>
                  </View>
                  <Text className="text-3xl">{action.icon}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-900 font-bengali">সাম্প্রতিক সেশন</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PracticeHistory' as any)}>
              <Text className="text-red-600 font-semibold font-bengali">সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          {recentSessions.length > 0 ? (
            <View className="space-y-3">
              {recentSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3"
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-semibold text-gray-900 font-bengali capitalize">
                        {session.session_type} সেশন
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1 font-bengali">
                        স্কোর: {session.score?.toFixed(2) || '0'}% • প্রশ্ন: {session.completed_questions || 0}/{session.total_questions || 0}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${
                      (session.score || 0) >= 80 ? 'bg-green-100' : 
                      (session.score || 0) >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Text className={`text-sm font-semibold ${
                        (session.score || 0) >= 80 ? 'text-green-800' : 
                        (session.score || 0) >= 60 ? 'text-yellow-800' : 'text-red-800'
                      }`}>
                        {(session.score || 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-xl p-6 items-center">
              <Text className="text-4xl mb-2">📊</Text>
              <Text className="text-gray-600 text-center font-bengali">
                এখনো কোন সেশন সম্পন্ন করা হয়নি
              </Text>
              <TouchableOpacity 
                className="mt-3 bg-red-600 px-4 py-2 rounded-lg"
                onPress={() => navigation.navigate('Practice' as any)}
              >
                <Text className="text-white font-semibold font-bengali">প্রথম সেশন শুরু করুন</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Available Quizzes */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 font-bengali">উপলব্ধ কুইজ</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Quizzes' as any)}>
              <Text className="text-red-600 font-semibold font-bengali">সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          {availableQuizzes.length > 0 ? (
            <View className="space-y-3">
              {availableQuizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3"
                >
                  <Text className="font-semibold text-gray-900 font-bengali">{quiz.title}</Text>
                  <Text className="text-gray-600 text-sm mt-1 font-bengali">
                    {quiz.total_questions || 0} প্রশ্ন • {quiz.time_limit || 0} মিনিট
                  </Text>
                  <View className="flex-row justify-between items-center mt-2">
                    <View className="flex-row space-x-2">
                      <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-blue-800 text-xs font-bengali">কুইজ</Text>
                      </View>
                      {quiz.attempted && (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <Text className="text-green-800 text-xs font-bengali">সম্পন্ন</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity className="bg-red-600 px-3 py-1 rounded-lg">
                      <Text className="text-white text-sm font-semibold font-bengali">
                        {quiz.attempted ? 'পুনরায় দিন' : 'শুরু করুন'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-xl p-6 items-center">
              <Text className="text-4xl mb-2">📝</Text>
              <Text className="text-gray-600 text-center font-bengali">
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