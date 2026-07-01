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
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState, AppDispatch } from '../../store';
import {
  fetchQuizzes,
  startQuizAttempt,
} from '../../store/slices/quizSlice';
import { Ionicons as Icon } from '@expo/vector-icons';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { Quiz, Subject } from '../../types';
import { useAppTheme } from '../../context/ThemeContext';

type QuizScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface FilteredQuiz extends Quiz {
  attempted?: boolean;
  last_attempt_id?: number;
}

interface QuizzesScreenProps {
  navigation: QuizScreenNavigationProp;
}

const QuizzesScreen = ({ navigation }: QuizzesScreenProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [startingQuizId, setStartingQuizId] = useState<number | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { quizzes, isLoading } = useSelector((state: RootState) => state.quiz);
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

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
      setStartingQuizId(quizId);
      const result = await dispatch(startQuizAttempt(quizId)).unwrap();
      
      if (result.quiz_attempt_id) {
        navigation.navigate('QuizSession', { 
          attemptId: result.quiz_attempt_id,
          quizId: quizId 
        });
      } else {
        Alert.alert('সফল', 'কুইজ সফলভাবে শুরু হয়েছে!');
      }
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'কুইজ শুরু করতে সমস্যা হয়েছে');
    } finally {
      setStartingQuizId(null);
    }
  };

  const handleResumeQuiz = (attemptId: number, quizId: number): void => {
    navigation.navigate('QuizSession', { 
      attemptId: attemptId,
      quizId: quizId 
    });
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
                            subject && (
                              subject.name === selectedCategory || 
                              subject.category_name === selectedCategory
                            )
                          );

    return matchesSearch && matchesCategory;
  });

  const categories: string[] = Array.from(
    new Set(
      quizzesArray.flatMap((quiz: FilteredQuiz) => 
        quiz.subjects?.map((subject: Subject) => subject?.category_name || subject?.name) || []
      )
    )
  ).filter(Boolean) as string[];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <StatusBar backgroundColor={isDark ? "#020617" : "#f5f3ff"} barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Premium Integrated Header banner with responsive light/dark palette */}
      <LinearGradient
        colors={isDark ? ["#020617", "#0f172a"] : ["#f5f3ff", "#ede9fe"]}
        className="pt-6 pb-7 px-6 rounded-b-[40px] shadow-sm border-b border-purple-100 dark:border-slate-850"
      >
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 bg-primary-100 dark:bg-white rounded-2xl items-center justify-center mr-3 border border-primary-200 dark:border-white">
            <Icon name="checkbox-outline" size={22} color={isDark ? "white" : "#7c3aed"} />
          </View>
          <Text className="text-xl font-black text-slate-850 dark:text-white font-bengali">কুইজ সমূহ</Text>
        </View>
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bengali pl-1">
          বিভিন্ন বিষয়ের উপর কুইজ দিয়ে আপনার প্রস্তুতি যাচাই করুন
        </Text>

        {/* Integrated Clean Search Box */}
        <View className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex-row items-center px-4 py-3.5 mt-5 shadow-xs">
          <Icon name="search" size={20} color="#94a3b8" />
          <TextInput
            placeholder="কুইজ খুঁজুন..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-sm text-slate-850 dark:text-slate-150 font-bengali py-1"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
          />
          {searchTerm.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchTerm('')} className="p-1">
              <Icon name="close-circle" size={18} color={isDark ? "rgba(255, 255, 255, 0.6)" : "#cbd5e1"} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Filter Navigation Slider */}
      <View className="px-5 pt-5 pb-1">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          <TouchableOpacity
            className="px-5 py-2.5 rounded-full border shadow-sm"
            style={{
              backgroundColor: !selectedCategory 
                ? (isDark ? '#8b5cf6' : '#7c3aed') 
                : (isDark ? '#0f172a' : '#ffffff'),
              borderColor: !selectedCategory 
                ? (isDark ? '#8b5cf6' : '#7c3aed') 
                : (isDark ? '#334155' : '#e2e8f0'),
            }}
            onPress={() => setSelectedCategory('')}
            activeOpacity={0.85}
          >
            <Text 
              className="text-xs font-black font-bengali"
              style={{
                color: !selectedCategory ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
              }}
            >
              সব বিষয়
            </Text>
          </TouchableOpacity>

          {categories.map((category: string, idx: number) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={idx}
                className="px-5 py-2.5 rounded-full border shadow-sm"
                style={{
                  backgroundColor: isSelected 
                    ? (isDark ? '#8b5cf6' : '#7c3aed') 
                    : (isDark ? '#0f172a' : '#ffffff'),
                  borderColor: isSelected 
                    ? (isDark ? '#8b5cf6' : '#7c3aed') 
                    : (isDark ? '#334155' : '#e2e8f0'),
                }}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.85}
              >
                <Text 
                  className="text-xs font-black font-bengali"
                  style={{
                    color: isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dynamic Count & Clear Filter Indicator */}
      {(searchTerm.length > 0 || selectedCategory.length > 0) && (
        <View className="mx-5 mt-2.5 mb-1.5 flex-row justify-between items-center bg-primary-50 dark:bg-primary-950 border border-primary-100 rounded-2xl px-4 py-2.5">
          <View className="flex-row items-center">
            <Icon name="information-circle-outline" size={14} color="#7c3aed" />
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-bengali ml-1.5">
              {filteredQuizzes.length}টি কুইজ পাওয়া গেছে
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
            className="flex-row items-center"
          >
            <Text className="text-primary-600 dark:text-primary-400 text-xs font-extrabold font-bengali">রিসেট</Text>
            <Icon name="refresh-outline" size={12} color="#7c3aed" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Quizzes List */}
        {isLoading && filteredQuizzes.length === 0 ? (
          [...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz: FilteredQuiz, index: number) => (
            <QuizCard 
              key={quiz.id || index} 
              quiz={quiz} 
              startingQuizId={startingQuizId}
              handleResumeQuiz={handleResumeQuiz}
              handleStartQuiz={handleStartQuiz}
            />
          ))
        ) : (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 items-center mt-2">
            <Icon name="document-text-outline" size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <Text className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-1 text-center font-bengali">
              {searchTerm || selectedCategory
                ? "কোন কুইজ পাওয়া যায়নি"
                : "এখনও কোন কুইজ নেই"}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6 font-bengali leading-5 px-4">
              {searchTerm || selectedCategory
                ? "আপনার সার্চ ক্রাইটেরিয়ার সাথে মিলে যায় এমন কোন কুইজ নেই"
                : "শীঘ্রই নতুন কুইজ যোগ করা হবে"}
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-2xl gap-2"
              onPress={loadQuizzes}
            >
              <Icon name="refresh-outline" size={14} color="#7c3aed" />
              <Text className="text-primary-600 dark:text-primary-400 text-xs font-extrabold font-bengali">রিফ্রেশ করুন</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Global Statistics Summary */}
        {quizzesArray.length > 0 ? (
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 items-center">
              <View className="w-9 h-9 bg-primary-50 dark:bg-primary-950 rounded-xl items-center justify-center mb-2 border border-primary-100">
                <Icon name="document-text-outline" size={18} color="#7c3aed" />
              </View>
              <Text className="text-base font-black text-slate-800 dark:text-slate-200">
                {quizzesArray.length}
              </Text>
              <Text className="text-[10px] text-slate-400 font-bengali">মোট কুইজ</Text>
            </View>
            
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 items-center">
              <View className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950 rounded-xl items-center justify-center mb-2 border border-emerald-100">
                <Icon name="checkmark-done-circle-outline" size={18} color="#10b981" />
              </View>
              <Text className="text-base font-black text-slate-800 dark:text-slate-200">
                {quizzesArray.filter((q: FilteredQuiz) => q.attempted).length}
              </Text>
              <Text className="text-[10px] text-slate-400 font-bengali">সম্পন্ন</Text>
            </View>
            
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 items-center">
              <View className="w-9 h-9 bg-amber-50 dark:bg-amber-950 rounded-xl items-center justify-center mb-2 border border-amber-100">
                <Icon name="hourglass-outline" size={18} color="#f59e0b" />
              </View>
              <Text className="text-base font-black text-slate-800 dark:text-slate-200">
                {quizzesArray.filter((q: FilteredQuiz) => !q.attempted).length}
              </Text>
              <Text className="text-[10px] text-slate-400 font-bengali">বাকি আছে</Text>
            </View>
          </View>
        ) : null}

        <View className="h-5" />
      </ScrollView>
    </View>
  );
};

// --- HOISTED HELPER FUNCTIONS & SUBCOMPONENTS ---

const getSubjectNames = (subjects: Subject[] | undefined): string => {
  if (!Array.isArray(subjects) || subjects.length === 0) return 'সাধারণ';
  return subjects.map((subject: Subject) => subject.name).join(', ') || 'সাধারণ';
};

const formatTime = (minutes: number | undefined): string => {
  if (!minutes) return 'সময় সীমা নেই';
  return `${minutes} মিনিট`;
};

const LoadingSkeleton = () => (
  <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-xs">
    <View className="flex-row items-center mb-4">
      <View className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl mr-3" />
      <View className="flex-1 gap-2">
        <View className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/3" />
        <View className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3" />
      </View>
    </View>
    <View className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl mb-4" />
    <View className="flex-row justify-between items-center">
      <View className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16" />
      <View className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-24" />
    </View>
  </View>
);

interface QuizCardProps {
  quiz: FilteredQuiz;
  startingQuizId: number | null;
  handleResumeQuiz: (attemptId: number, quizId: number) => void;
  handleStartQuiz: (quizId: number) => void;
}

const QuizCard = ({ quiz, startingQuizId, handleResumeQuiz, handleStartQuiz }: QuizCardProps) => {
  const isStarting = startingQuizId === quiz.id;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 mb-4 shadow-xs">
      {/* Header & Badges */}
      <View className="flex-row justify-between items-start mb-3.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-2xl items-center justify-center mr-3 border border-primary-100">
            <Icon name="library-outline" size={20} color="#7c3aed" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-5">
              {quiz.title || 'কুইজ'}
            </Text>
            <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5" numberOfLines={1}>
              {getSubjectNames(quiz.subjects)}
            </Text>
          </View>
        </View>
        
        {quiz.negative_marking ? (
          <View className="flex-row items-center bg-rose-50 dark:bg-rose-950 border border-rose-100 dark:border-rose-900 px-2.5 py-0.5 rounded-full">
            <Icon name="warning-outline" size={10} color="#f43f5e" />
            <Text className="text-[#f43f5e] font-bold text-[8px] font-bengali ml-1 uppercase">নেগেটিভ মার্কিং</Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      {quiz.description ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400 leading-5 font-bengali mb-4 pl-1">
          {quiz.description}
        </Text>
      ) : null}

      {/* Metadata Details Grid */}
      <View className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 mb-4 flex-row justify-between">
        <View className="items-center flex-1">
          <Icon name="time-outline" size={16} color="#94a3b8" />
          <Text className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 font-bengali mt-1.5">
            {formatTime(quiz.time_limit)}
          </Text>
        </View>
        <View className="w-px bg-slate-200 dark:bg-slate-800" />
        <View className="items-center flex-1">
          <Icon name="help-circle-outline" size={16} color="#94a3b8" />
          <Text className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 font-bengali mt-1.5">
            {quiz.total_questions || 0}টি প্রশ্ন
          </Text>
        </View>
        <View className="w-px bg-slate-200 dark:bg-slate-800" />
        <View className="items-center flex-1">
          <Icon name="trophy-outline" size={16} color="#94a3b8" />
          <Text className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 font-bengali mt-1.5">
            {quiz.total_marks || 0} মার্কস
          </Text>
        </View>
      </View>

      {/* Action Row */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center bg-primary-50 dark:bg-primary-950 border border-primary-100 px-2.5 py-1 rounded-full">
          <Icon name="checkbox-outline" size={10} color="#7c3aed" />
          <Text className="text-primary-600 dark:text-primary-400 font-extrabold text-[8px] font-bengali ml-1 uppercase">কুইজ সেশন</Text>
        </View>

        {quiz.attempted ? (
          <TouchableOpacity
            className="flex-row items-center bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-2xl gap-2 shadow-xs"
            onPress={() => handleResumeQuiz(quiz.last_attempt_id!, quiz.id)}
          >
            <Icon name="refresh-outline" size={14} color="white" />
            <Text className="text-white text-xs font-extrabold font-bengali">চালিয়ে যান</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-row items-center bg-primary-600 hover:bg-primary-700 px-5 py-3 rounded-2xl gap-2 shadow-xs"
            onPress={() => handleStartQuiz(quiz.id)}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="play-outline" size={14} color="white" />
                <Text className="text-white text-xs font-extrabold font-bengali">শুরু করুন</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default QuizzesScreen;