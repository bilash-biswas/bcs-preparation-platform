// src/screens/quizzes/QuizzesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchQuizzes,
  startQuizAttempt,
} from '../../store/slices/quizSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Quiz, Subject } from '../../types';

type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define proper types for the component
interface FilteredQuiz extends Quiz {
  attempted?: boolean;
  last_attempt_id?: number;
}

const QuizzesScreen = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const { quizzes } = useSelector((state: RootState) => state.quiz);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async (): Promise<void> => {
    try {
      await dispatch(fetchQuizzes()).unwrap();
    } catch (error: any) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadQuizzes();
    setRefreshing(false);
  };

  const handleStartQuiz = async (quizId: number): Promise<void> => {
    try {
      const result = await dispatch(startQuizAttempt(quizId)).unwrap();
      
      if (result.quiz_attempt_id) {
        // Navigate to quiz session screen
        // navigation.navigate('QuizSession', { 
        //   attemptId: result.quiz_attempt_id,
        //   quizId: quizId 
        // });
      } else {
        Alert.alert('সফল', 'কুইজ শুরু হয়েছে!');
      }
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'কুইজ শুরু করতে সমস্যা হয়েছে');
    }
  };

  const handleResumeQuiz = (attemptId: number, quizId: number): void => {
    // navigation.navigate('QuizSession', { 
    //   attemptId: attemptId,
    //   quizId: quizId 
    // });
  };

  const extractQuizzesArray = (data: any): FilteredQuiz[] => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data as FilteredQuiz[];
    }
    
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      return data.results as FilteredQuiz[];
    }
    
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data as FilteredQuiz[];
    }
    
    return [];
  };

  const quizzesArray: FilteredQuiz[] = extractQuizzesArray(quizzes);

  const filteredQuizzes = quizzesArray.filter((quiz: FilteredQuiz) => {
    if (!quiz || typeof quiz !== 'object') return false;

    const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || 
                          quiz.subjects?.some((subject: Subject) => 
                            subject.name === selectedCategory || 
                            subject.category_name === selectedCategory
                          );


    return matchesSearch && matchesCategory;
  });

  const getDifficultyText = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return 'মিশ্র';
    }
  };

  const getSubjectNames = (subjects: Subject[] | undefined): string => {
    if (!Array.isArray(subjects)) return 'সাধারণ';
    return subjects.map((subject: Subject) => subject.name).join(', ') || 'সাধারণ';
  };

  const formatTime = (minutes: number | undefined): string => {
    if (!minutes) return 'সময় সীমা নেই';
    return `${minutes} মিনিট`;
  };

  const QuizCard = ({ quiz, index }: { quiz: FilteredQuiz; index: number }) => (
    <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm shadow-black/5">
      {/* Header */}
      <View className="flex-row items-start mb-3">
        <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
          <Icon name="file-document" size={24} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1">
            {quiz.title || 'কুইজ'}
          </Text>
          <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
            {quiz.description || 'কোন বর্ণনা নেই'}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Icon name="book" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 ml-1.5">
              {getSubjectNames(quiz.subjects)}
            </Text>
          </View>
          <View className="flex-row items-center flex-1">
            <Icon name="clock-outline" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 ml-1.5">
              {formatTime(quiz.time_limit)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between">
          <View className="flex-row items-center flex-1">
            <Icon name="help-circle" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 ml-1.5">
              {quiz.total_questions || 0} প্রশ্ন
            </Text>
          </View>
          <View className="flex-row items-center flex-1">
            <Icon name="star" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 ml-1.5">
              {quiz.total_marks || 0} মার্কস
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center">

        <View className="flex-row">
          {quiz.attempted ? (
            <TouchableOpacity
              className="flex-row items-center bg-emerald-500 px-4 py-2 rounded-lg gap-1.5"
              onPress={() => handleResumeQuiz(quiz.last_attempt_id!, quiz.id)}
            >
              <Icon name="play-circle" size={16} color="white" />
              <Text className="text-white text-sm font-semibold">চালিয়ে যান</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center bg-blue-500 px-4 py-2 rounded-lg gap-1.5"
              onPress={() => handleStartQuiz(quiz.id)}
            >
              <Icon name="play" size={16} color="white" />
              <Text className="text-white text-sm font-semibold">শুরু করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Negative Marking Warning */}
      {quiz.negative_marking && (
        <View className="absolute top-2 right-2 flex-row items-center bg-red-50 px-1.5 py-1 rounded gap-1">
          <Icon name="alert" size={12} color="#ef4444" />
          <Text className="text-red-500 text-xs font-medium">নেগেটিভ মার্কিং</Text>
        </View>
      )}
    </View>
  );

  const categories: string[] = Array.from(
    new Set(
      quizzesArray.flatMap((quiz: FilteredQuiz) => 
        quiz.subjects?.map((subject: Subject) => subject.category_name || subject.name) || []
      )
    )
  ).filter(Boolean) as string[];

  const difficultyLevels: string[] = ['easy', 'medium', 'hard'];

  const LoadingSkeleton = () => (
    <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
      <View className="flex-row items-start mb-3">
        <View className="w-10 h-10 bg-gray-200 rounded-lg mr-3" />
        <View className="flex-1 gap-2">
          <View className="h-5 bg-gray-200 rounded w-3/4" />
          <View className="h-4 bg-gray-200 rounded w-full" />
        </View>
      </View>
      <View className="mb-4 gap-2">
        <View className="flex-row justify-between">
          <View className="h-3.5 bg-gray-200 rounded w-2/5" />
          <View className="h-3.5 bg-gray-200 rounded w-2/5" />
        </View>
        <View className="flex-row justify-between">
          <View className="h-3.5 bg-gray-200 rounded w-2/5" />
          <View className="h-3.5 bg-gray-200 rounded w-2/5" />
        </View>
      </View>
      <View className="flex-row justify-between items-center">
        <View className="h-6 bg-gray-200 rounded w-20" />
        <View className="h-8 bg-gray-200 rounded w-24" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mr-3">
            <Icon name="file-document-multiple" size={24} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">কুইজ সমূহ</Text>
        </View>
        <Text className="text-sm text-gray-600 text-center">
          বিভিন্ন বিষয়ের উপর কুইজ দিন এবং আপনার জ্ঞান পরীক্ষা করুন
        </Text>
      </View>

      {/* Search and Filters */}
      <View className="bg-white px-4 pb-4 border-b border-gray-200">
        {/* Search Box */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 mb-4">
          <Icon name="magnify" size={20} color="#6b7280" />
          <TextInput
            placeholder="কুইজ খুঁজুন..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-2 text-base"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="max-h-28"
        >
          <View className="flex-row">
            {/* Category Filter */}
            <View className="mr-4">
              <Text className="text-xs font-semibold text-gray-700 mb-2">বিষয়</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`px-3 py-1.5 rounded-lg border ${
                      !selectedCategory 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-50 border-gray-50'
                    }`}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text className={`text-xs font-medium ${
                      !selectedCategory ? 'text-white' : 'text-gray-500'
                    }`}>
                      সব
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      className={`px-3 py-1.5 rounded-lg border ${
                        selectedCategory === category 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-gray-50 border-gray-50'
                      }`}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text className={`text-xs font-medium ${
                        selectedCategory === category ? 'text-white' : 'text-gray-500'
                      }`}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Difficulty Filter */}
            <View>
              <Text className="text-xs font-semibold text-gray-700 mb-2">কঠিনতা</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`px-3 py-1.5 rounded-lg border ${
                      !selectedDifficulty 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-50 border-gray-50'
                    }`}
                    onPress={() => setSelectedDifficulty('')}
                  >
                    <Text className={`text-xs font-medium ${
                      !selectedDifficulty ? 'text-white' : 'text-gray-500'
                    }`}>
                      সব
                    </Text>
                  </TouchableOpacity>
                  {difficultyLevels.map((difficulty: string) => (
                    <TouchableOpacity
                      key={difficulty}
                      className={`px-3 py-1.5 rounded-lg border ${
                        selectedDifficulty === difficulty 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-gray-50 border-gray-50'
                      }`}
                      onPress={() => setSelectedDifficulty(difficulty)}
                    >
                      <Text className={`text-xs font-medium ${
                        selectedDifficulty === difficulty ? 'text-white' : 'text-gray-500'
                      }`}>
                        {getDifficultyText(difficulty)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 pt-4"
      >

        {/* Quizzes List */}
        {filteredQuizzes.length === 0 ? (
          // Loading Skeleton
          [...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz: FilteredQuiz, index: number) => (
            <QuizCard key={quiz.id || index} quiz={quiz} index={index} />
          ))
        ) : (
          <View className="bg-white rounded-2xl border border-gray-200 p-8 items-center mt-4">
            <Icon name="file-document-outline" size={64} color="#9ca3af" />
            <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2 text-center">
              {searchTerm || selectedCategory || selectedDifficulty
                ? "কোন কুইজ পাওয়া যায়নি"
                : "এখনও কোন কুইজ নেই"}
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              {searchTerm || selectedCategory || selectedDifficulty
                ? "আপনার সার্চ ক্রাইটেরিয়া মেলে এমন কোন কুইজ নেই"
                : "শীঘ্রই নতুন কুইজ যোগ করা হবে"}
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg gap-1.5"
              onPress={loadQuizzes}
            >
              <Icon name="refresh" size={16} color="#3b82f6" />
              <Text className="text-blue-500 text-sm font-semibold">রিফ্রেশ করুন</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics */}
        <View className="flex-row gap-3 mt-6">
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 items-center">
            <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mb-2">
              <Icon name="file-document" size={20} color="#3b82f6" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-1">
              {quizzesArray.length}
            </Text>
            <Text className="text-xs text-gray-600">মোট কুইজ</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 items-center">
            <View className="w-10 h-10 bg-emerald-50 rounded-lg items-center justify-center mb-2">
              <Icon name="check-circle" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-1">
              {quizzesArray.filter((q: FilteredQuiz) => q.attempted).length}
            </Text>
            <Text className="text-xs text-gray-600">সম্পন্ন</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 items-center">
            <View className="w-10 h-10 bg-amber-50 rounded-lg items-center justify-center mb-2">
              <Icon name="clock" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-1">
              {quizzesArray.filter((q: FilteredQuiz) => !q.attempted).length}
            </Text>
            <Text className="text-xs text-gray-600">বাকি</Text>
          </View>
        </View>

        <View className="h-5" />
      </ScrollView>
    </View>
  );
};

export default QuizzesScreen;