// src/screens/practice/AllAnswersAnalysisScreen.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState, AppDispatch } from '../../store';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { PracticeSession } from '../../types';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';

type AllAnswersAnalysisScreenNavigationProp = NativeStackNavigationProp<any, 'AllAnswersAnalysis'>;

interface Answer {
  sessionId: number;
  sessionType: 'practice' | 'quiz';
  questionId: number;
  questionText: string;
  subject: string;
  difficulty: string;
  userAnswer: number | null;
  correctAnswer: number | null;
  isCorrect: boolean;
  options: any[];
  timeTaken: string | null;
  answeredAt: string | null;
  marks?: number;
  explanation?: string;
}

interface AnswersStats {
  totalAnswers: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  practiceAnswers: number;
  practiceCorrect: number;
  practiceWrong: number;
  practiceUnanswered: number;
  quizAnswers: number;
  quizCorrect: number;
  quizWrong: number;
  quizUnanswered: number;
  allAnswers: Answer[];
  subjectWiseStats: Record<
    string,
    {
      total: number;
      correct: number;
      wrong: number;
      unanswered: number;
      accuracy: number;
    }
  >;
  difficultyWiseStats: Record<
    string,
    {
      total: number;
      correct: number;
      wrong: number;
      unanswered: number;
      accuracy: number;
    }
  >;
}

const PAGE_SIZE = 20;

const AllAnswersAnalysisScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AllAnswersAnalysisScreenNavigationProp>();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { sessions, isLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [stats, setStats] = useState<AnswersStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');
  const [activeMode, setActiveMode] = useState<'all' | 'practice' | 'quiz'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Pagination page count
  const [currentPage, setCurrentPage] = useState(1);
  const flatListRef = useRef<FlatList>(null);

  // Memoized filtered answers
  const allFilteredAnswers = useMemo(() => {
    if (!stats) return [];

    return stats.allAnswers.filter(answer => {
      const matchesAnswerType =
        activeTab === 'all' ||
        (activeTab === 'correct' && answer.isCorrect) ||
        (activeTab === 'wrong' && answer.isCorrect === false && answer.userAnswer !== null) ||
        (activeTab === 'unanswered' && answer.userAnswer === null);

      const matchesMode =
        activeMode === 'all' || answer.sessionType === activeMode;
      const matchesSubject =
        filterSubject === 'all' || answer.subject === filterSubject;
      const matchesDifficulty =
        filterDifficulty === 'all' || answer.difficulty === filterDifficulty;

      return (
        matchesAnswerType &&
        matchesMode &&
        matchesSubject &&
        matchesDifficulty
      );
    });
  }, [stats, activeTab, activeMode, filterSubject, filterDifficulty]);

  // Paginated answers for current list viewport
  const paginatedAnswers = useMemo(() => {
    const limit = currentPage * PAGE_SIZE;
    return allFilteredAnswers.slice(0, limit);
  }, [allFilteredAnswers, currentPage]);

  const hasMore = paginatedAnswers.length < allFilteredAnswers.length;

  // Reset page count on filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedQuestions([]);
    try {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (err) {
      // ignore
    }
  }, [activeTab, activeMode, filterSubject, filterDifficulty]);

  const loadAllAnswers = useCallback(async () => {
    try {
      setError(null);
      const result = await dispatch(getUserSessions()).unwrap();
      const compiled = compileStats(result || []);
      setStats(compiled);
    } catch (err: any) {
      console.error('Failed to load answers:', err);
      setError('আপনার পূর্ববর্তী সেশন ডেটা লোড করতে ব্যর্থ হয়েছে।');
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAllAnswers();
    }, [loadAllAnswers]),
  );

  const compileStats = (userSessions: PracticeSession[]): AnswersStats => {
    const allAnswers: Answer[] = [];
    let practiceAnswers = 0;
    let practiceCorrect = 0;
    let practiceWrong = 0;
    let practiceUnanswered = 0;

    let quizAnswers = 0;
    let quizCorrect = 0;
    let quizWrong = 0;
    let quizUnanswered = 0;

    const subjectWiseStats: Record<string, { total: number; correct: number; wrong: number; unanswered: number; accuracy: number }> = {};
    const difficultyWiseStats: Record<string, { total: number; correct: number; wrong: number; unanswered: number; accuracy: number }> = {};

    userSessions.forEach(session => {
      const type = 'practice'; // Sessions are primarily practice mode
      if (session.session_questions && Array.isArray(session.session_questions)) {
        session.session_questions.forEach(sq => {
          const correctOption = sq.options?.find((opt: any) => opt.is_correct);
          const answer: Answer = {
            sessionId: session.id,
            sessionType: type,
            questionId: sq.question || sq.id,
            questionText: sq.question_text,
            subject: sq.subject_name || 'অন্যান্য',
            difficulty: sq.difficulty || 'medium',
            userAnswer: sq.user_answer,
            correctAnswer: correctOption?.id || null,
            isCorrect: sq.is_correct,
            options: sq.options || [],
            timeTaken: sq.time_taken,
            answeredAt: null,
            explanation: sq.explanation || '',
          };

          allAnswers.push(answer);

          // Counter aggregation
          if (type === 'practice') {
            practiceAnswers++;
            if (sq.user_answer === null) practiceUnanswered++;
            else if (sq.is_correct) practiceCorrect++;
            else practiceWrong++;
          }

          // Subject Stats
          const sub = sq.subject_name || 'অন্যান্য';
          if (!subjectWiseStats[sub]) {
            subjectWiseStats[sub] = { total: 0, correct: 0, wrong: 0, unanswered: 0, accuracy: 0 };
          }
          subjectWiseStats[sub].total++;
          if (sq.user_answer === null) subjectWiseStats[sub].unanswered++;
          else if (sq.is_correct) subjectWiseStats[sub].correct++;
          else subjectWiseStats[sub].wrong++;

          // Difficulty Stats
          const diff = sq.difficulty || 'medium';
          if (!difficultyWiseStats[diff]) {
            difficultyWiseStats[diff] = { total: 0, correct: 0, wrong: 0, unanswered: 0, accuracy: 0 };
          }
          difficultyWiseStats[diff].total++;
          if (sq.user_answer === null) difficultyWiseStats[diff].unanswered++;
          else if (sq.is_correct) difficultyWiseStats[diff].correct++;
          else difficultyWiseStats[diff].wrong++;
        });
      }
    });

    // Calculate accuracies
    Object.keys(subjectWiseStats).forEach(s => {
      const item = subjectWiseStats[s];
      const answered = item.correct + item.wrong;
      item.accuracy = answered > 0 ? (item.correct / answered) * 100 : 0;
    });

    Object.keys(difficultyWiseStats).forEach(d => {
      const item = difficultyWiseStats[d];
      const answered = item.correct + item.wrong;
      item.accuracy = answered > 0 ? (item.correct / answered) * 100 : 0;
    });

    const totalAnswers = allAnswers.length;
    const totalCorrect = practiceCorrect + quizCorrect;
    const totalWrong = practiceWrong + quizWrong;
    const totalUnanswered = practiceUnanswered + quizUnanswered;

    return {
      totalAnswers,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      practiceAnswers,
      practiceCorrect,
      practiceWrong,
      practiceUnanswered,
      quizAnswers,
      quizCorrect,
      quizWrong,
      quizUnanswered,
      allAnswers,
      subjectWiseStats,
      difficultyWiseStats,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllAnswers();
    setRefreshing(false);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId],
    );
  };

  const clearFilters = () => {
    setActiveMode('all');
    setFilterSubject('all');
    setFilterDifficulty('all');
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30';
      case 'medium': return 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30';
      case 'hard': return 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-600 dark:text-emerald-400';
      case 'medium': return 'text-amber-600 dark:text-amber-400';
      case 'hard': return 'text-rose-600 dark:text-rose-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const renderAnswerItem = ({ item, index }: { item: Answer; index: number }) => {
    const isExpanded = expandedQuestions.includes(item.questionId);
    const correctOption = item.options.find(opt => opt.is_correct);
    const userSelectedOption = item.userAnswer ? item.options.find(opt => opt.id === item.userAnswer) : null;

    let iconName: React.ComponentProps<typeof Icon>['name'] = 'help-circle';
    let iconColor = '#94a3b8';
    let cardBorderColor = 'border-slate-100 dark:border-slate-800/70 border-l-4 border-l-slate-400';

    if (item.userAnswer !== null) {
      if (item.isCorrect) {
        iconName = 'checkmark-circle';
        iconColor = '#10b981';
        cardBorderColor = 'border-slate-100 dark:border-slate-800/70 border-l-4 border-l-emerald-500';
      } else {
        iconName = 'close-circle';
        iconColor = '#f43f5e';
        cardBorderColor = 'border-slate-100 dark:border-slate-800/70 border-l-4 border-l-rose-500';
      }
    }

    return (
      <View className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden mb-4 ${cardBorderColor}`}>
        <TouchableOpacity
          onPress={() => toggleQuestion(item.questionId)}
          className="p-4"
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <View className="flex-row flex-wrap items-center gap-2 mb-2">
                <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 font-bengali">
                  #{index + 1}
                </Text>
                <View className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getDifficultyColor(item.difficulty)}`}>
                  <Text className={`font-bengali text-[9px] ${getDifficultyTextColor(item.difficulty)}`}>
                    {getDifficultyText(item.difficulty)}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold font-bengali">
                    {item.subject}
                  </Text>
                </View>
              </View>

              {item.questionText.includes('\\(') || item.questionText.includes('\\)') || item.questionText.includes('\\[') || item.questionText.includes('\\]') || item.questionText.includes('$') ? (
                <MathDisplay content={item.questionText} />
              ) : (
                <Text className="font-extrabold text-slate-850 dark:text-slate-100 font-bengali leading-5 text-sm">
                  {item.questionText}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-1.5" style={{ marginTop: 2 }}>
              <Icon name={iconName} size={16} color={iconColor} />
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            {/* Options List */}
            <View className="mb-4 gap-2">
              <Text className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 font-bengali mb-1.5 uppercase">
                বিকল্পসমূহ:
              </Text>
              {item.options.map(option => {
                const isCorrectOption = option.is_correct;
                const isUserSelected = item.userAnswer === option.id;

                let optionBorder = 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900';
                let optionTextClass = 'text-slate-700 dark:text-slate-300';
                let checkIcon = null;

                if (isCorrectOption) {
                  optionBorder = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                  optionTextClass = 'text-emerald-800 dark:text-emerald-300 font-extrabold';
                  checkIcon = <Icon name="checkmark-circle" size={16} color="#10b981" className="mr-2" />;
                } else if (isUserSelected) {
                  optionBorder = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20';
                  optionTextClass = 'text-rose-800 dark:text-rose-300 font-extrabold';
                  checkIcon = <Icon name="close-circle" size={16} color="#f43f5e" className="mr-2" />;
                }

                return (
                  <View
                    key={option.id}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${optionBorder}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      {checkIcon}
                      <Text className={`font-bengali text-xs flex-1 ${optionTextClass}`}>
                        {option.option_text}
                      </Text>
                    </View>
                    {isCorrectOption && (
                      <View className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-full">
                        <Text className="text-emerald-800 dark:text-emerald-400 text-[8px] font-bold font-bengali">
                          সঠিক উত্তর
                        </Text>
                      </View>
                    )}
                    {isUserSelected && !isCorrectOption && (
                      <View className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 rounded-full">
                        <Text className="text-rose-800 dark:text-rose-400 text-[8px] font-bold font-bengali">
                          আপনার উত্তর
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Explanation Block */}
            {item.explanation ? (
              <View className="mt-2.5 p-4 bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100/20 rounded-2xl">
                <View className="flex-row items-center mb-1.5">
                  <Icon name="bulb-outline" size={14} color="#7c3aed" />
                  <Text className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 font-bengali uppercase ml-1">
                    ব্যাখ্যা:
                  </Text>
                </View>
                {item.explanation.includes('\\(') || item.explanation.includes('\\)') || item.explanation.includes('\\[') || item.explanation.includes('\\]') || item.explanation.includes('$') ? (
                  <MathDisplay content={item.explanation} />
                ) : (
                  <Text className="text-xs font-bengali leading-5 text-slate-700 dark:text-slate-300">
                    {item.explanation}
                  </Text>
                )}
              </View>
            ) : null}

            {/* Session Footer details */}
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[9px] text-slate-400">
              <Text className="font-bengali">সেশন: #{item.sessionId}</Text>
              {item.timeTaken && <Text className="font-bengali">সময়: {item.timeTaken}</Text>}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    // Segmented layout selector
    return (
      <View className="bg-slate-200/60 dark:bg-slate-900 border border-slate-100/50 dark:border-slate-800 rounded-2xl p-1 flex-row mb-6 mt-1">
        {(['all', 'correct', 'wrong', 'unanswered'] as const).map(tab => {
          const isSelected = activeTab === tab;
          let tabLabel = '';
          if (tab === 'all') tabLabel = 'সব';
          else if (tab === 'correct') tabLabel = 'সঠিক';
          else if (tab === 'wrong') tabLabel = 'ভুল';
          else tabLabel = 'উত্তরহীন';

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-1 rounded-xl items-center justify-center ${
                isSelected ? 'bg-white dark:bg-slate-800 shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-extrabold font-bengali text-center ${
                  isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'
                }`}
              >
                {tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFooter = () => {
    if (hasMore) {
      return (
        <View className="py-6 justify-center items-center">
          <ActivityIndicator size="small" color="#7c3aed" />
        </View>
      );
    }
    return (
      <View className="py-6 justify-center items-center">
        <Text className="text-xs text-slate-400 font-bengali">সকল সেশন বিশ্লেষণ শেষ হয়েছে</Text>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    return (
      <View className="py-20 items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
        <Icon name="folder-open-outline" size={48} color="#cbd5e1" className="mb-3" />
        <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-bengali text-center">
          কোন উত্তর পাওয়া যায়নি
        </Text>
        <Text className="text-slate-400 dark:text-slate-500 text-xs font-bengali text-center px-4 leading-5">
          আপনার প্র্যাকটিস হিস্ট্রিতে ফিল্টারের সাথে মিলে যায় এমন কোনো উত্তর নেই।
        </Text>
      </View>
    );
  };

  if (isLoading && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-550 mt-4 text-sm font-bengali">
          উত্তরসমূহ লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center p-6">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-sm">
          <Icon name="alert-circle" size={48} className="text-red-500 mb-4" />
          <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 font-bengali text-center">
            ত্রুটি
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-center mb-6 font-bengali leading-5 text-xs">
            {error || 'উত্তরসমূহ লোড করতে সমস্যা হয়েছে'}
          </Text>
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={loadAllAnswers}
              className="bg-primary-600 dark:bg-primary-500 py-3 rounded-xl flex-1 shadow-sm"
            >
              <Text className="text-white font-bold font-bengali text-center text-xs">আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-slate-100 dark:bg-slate-800 py-3 rounded-xl flex-1 border border-slate-200/50 dark:border-slate-800"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold font-bengali text-center text-xs">ফিরে যান</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      <StatusBar backgroundColor={isDark ? "#020617" : "#7c3aed"} barStyle="light-content" />

      {/* Premium Header with LinearGradient */}
      <LinearGradient
        colors={isDark ? ["#020617", "#0f172a"] : ["#7c3aed", "#4f46e5"]}
        className="pt-6 pb-6 px-6 rounded-b-[36px] shadow-sm"
      >
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2.5 bg-white/10 dark:bg-slate-800/40 rounded-2xl border border-white/10"
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View className="flex-1 mx-3 items-center">
            <Text className="text-xl font-black text-white font-bengali text-center">
              সকল উত্তর বিশ্লেষণ
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 text-xs font-bengali text-center mt-1">
              আপনার প্র্যাকটিস ও কুইজ সেশনের পর্যালোচনা
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFiltersModal(true)}
            className="p-2.5 bg-white/10 dark:bg-slate-800/40 rounded-2xl border border-white/10"
          >
            <Icon name="filter" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Summary strip */}
        <View className="flex-row justify-between bg-white/10 dark:bg-slate-900/40 rounded-2xl p-4 mt-5 border border-white/10 dark:border-slate-800/30">
          <View className="items-center flex-1">
            <Text className="text-sm font-black text-white">
              {stats.totalAnswers}
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 font-bengali text-[10px] mt-0.5">মোট</Text>
          </View>
          <View className="w-px bg-white/10 dark:bg-slate-800" />
          <View className="items-center flex-1">
            <Text className="text-sm font-black text-emerald-300 dark:text-emerald-400">
              {stats.totalCorrect}
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 font-bengali text-[10px] mt-0.5">সদুপায়</Text>
          </View>
          <View className="w-px bg-white/10 dark:bg-slate-800" />
          <View className="items-center flex-1">
            <Text className="text-sm font-black text-rose-300 dark:text-rose-400">
              {stats.totalWrong}
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 font-bengali text-[10px] mt-0.5">ভুল</Text>
          </View>
          <View className="w-px bg-white/10 dark:bg-slate-800" />
          <View className="items-center flex-1">
            <Text className="text-sm font-black text-blue-300 dark:text-blue-400">
              {stats.totalUnanswered}
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 font-bengali text-[10px] mt-0.5">বাকি</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Answers List */}
      <FlatList
        ref={flatListRef}
        data={paginatedAnswers}
        renderItem={renderAnswerItem}
        keyExtractor={item => `${item.sessionId}-${item.questionId}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      />

      {/* Footer Info strip */}
      {allFilteredAnswers.length > 0 && (
        <View className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-4 py-3" style={{ paddingBottom: insets.bottom || 12 }}>
          <Text className="text-center text-slate-400 dark:text-slate-500 text-xs font-bengali">
            {paginatedAnswers.length} / {allFilteredAnswers.length} টি উত্তর দেখানো হচ্ছে
            {hasMore && ' • নিচে স্ক্রল করুন আরো দেখতে'}
          </Text>
        </View>
      )}

      {/* Filters Modal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        stats={stats}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        filterSubject={filterSubject}
        setFilterSubject={setFilterSubject}
        filterDifficulty={filterDifficulty}
        setFilterDifficulty={setFilterDifficulty}
        clearFilters={clearFilters}
        getDifficultyText={getDifficultyText}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

// Filters Modal Component
const FiltersModal = React.memo(
  ({
    visible,
    onClose,
    stats,
    activeMode,
    setActiveMode,
    filterSubject,
    setFilterSubject,
    filterDifficulty,
    setFilterDifficulty,
    clearFilters,
    getDifficultyText,
    isDark,
  }: {
    visible: boolean;
    onClose: () => void;
    stats: AnswersStats;
    activeMode: string;
    setActiveMode: (mode: 'all' | 'practice' | 'quiz') => void;
    filterSubject: string;
    setFilterSubject: (subject: string) => void;
    filterDifficulty: string;
    setFilterDifficulty: (difficulty: string) => void;
    clearFilters: () => void;
    getDifficultyText: (difficulty: string) => string;
    isDark: boolean;
  }) => {
    const subjects = Object.keys(stats.subjectWiseStats);
    const difficulties = Object.keys(stats.difficultyWiseStats);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
          {/* Header */}
          <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex-row justify-between items-center shadow-xs">
            <TouchableOpacity onPress={onClose} className="p-1">
              <Icon name="close" size={24} className="text-slate-600 dark:text-slate-400" />
            </TouchableOpacity>
            <Text className="text-lg font-black text-slate-850 dark:text-slate-100 font-bengali">
              ফিল্টার
            </Text>
            <TouchableOpacity onPress={clearFilters} className="p-1">
              <Text className="text-primary-600 dark:text-primary-400 font-bold font-bengali text-sm">
                ক্লিয়ার
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={[]}
            renderItem={null}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="p-6">
                {/* Session Type Filter */}
                <View className="mb-6">
                  <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 mb-3 font-bengali uppercase tracking-wider pl-1">
                    সেশন টাইপ
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setActiveMode('all')}
                      className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center ${
                        activeMode === 'all'
                          ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`text-center font-extrabold font-bengali text-xs ${
                          activeMode === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setActiveMode('practice')}
                      className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center ${
                        activeMode === 'practice'
                          ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`text-center font-extrabold font-bengali text-xs ${
                          activeMode === 'practice' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        প্র্যাকটিস ({stats.practiceAnswers})
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setActiveMode('quiz')}
                      className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center ${
                        activeMode === 'quiz'
                          ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`text-center font-extrabold font-bengali text-xs ${
                          activeMode === 'quiz' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        কুইজ ({stats.quizAnswers})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subject Filter */}
                <View className="mb-6">
                  <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 mb-3 font-bengali uppercase tracking-wider pl-1">
                    বিষয়
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => setFilterSubject('all')}
                      className={`px-4.5 py-2.5 rounded-full border ${
                        filterSubject === 'all'
                          ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`font-extrabold font-bengali text-xs ${
                          filterSubject === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    {subjects.map(subject => (
                      <TouchableOpacity
                        key={subject}
                        onPress={() => setFilterSubject(subject)}
                        className={`px-4.5 py-2.5 rounded-full border ${
                          filterSubject === subject
                            ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <Text
                          className={`font-extrabold font-bengali text-xs ${
                            filterSubject === subject ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {subject} ({stats.subjectWiseStats[subject].total})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Difficulty Filter */}
                <View className="mb-6">
                  <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 mb-3 font-bengali uppercase tracking-wider pl-1">
                    কঠিনতা স্তর
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => setFilterDifficulty('all')}
                      className={`px-4.5 py-2.5 rounded-full border ${
                        filterDifficulty === 'all'
                          ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`font-extrabold font-bengali text-xs ${
                          filterDifficulty === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    {difficulties.map(difficulty => (
                      <TouchableOpacity
                        key={difficulty}
                        onPress={() => setFilterDifficulty(difficulty)}
                        className={`px-4.5 py-2.5 rounded-full border ${
                          filterDifficulty === difficulty
                            ? 'bg-primary-600 dark:bg-primary-500 border-primary-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <Text
                          className={`font-extrabold font-bengali text-xs ${
                            filterDifficulty === difficulty ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {getDifficultyText(difficulty)} ({stats.difficultyWiseStats[difficulty].total})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Stats Summary Box */}
                <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs mt-2">
                  <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 font-bengali text-center uppercase tracking-wider">
                    ফিল্টার্ড পরিসংখ্যান
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-xl font-black text-slate-800 dark:text-slate-100">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode = activeMode === 'all' || answer.sessionType === activeMode;
                            const matchesSubject = filterSubject === 'all' || answer.subject === filterSubject;
                            const matchesDifficulty = filterDifficulty === 'all' || answer.difficulty === filterDifficulty;
                            return matchesMode && matchesSubject && matchesDifficulty;
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bengali mt-0.5">মোট</Text>
                    </View>
                    <View className="w-px bg-slate-200 dark:bg-slate-800" />
                    
                    <View className="items-center flex-1">
                      <Text className="text-xl font-black text-emerald-500">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode = activeMode === 'all' || answer.sessionType === activeMode;
                            const matchesSubject = filterSubject === 'all' || answer.subject === filterSubject;
                            const matchesDifficulty = filterDifficulty === 'all' || answer.difficulty === filterDifficulty;
                            return matchesMode && matchesSubject && matchesDifficulty && answer.isCorrect;
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bengali mt-0.5">সঠিক</Text>
                    </View>
                    <View className="w-px bg-slate-200 dark:bg-slate-800" />

                    <View className="items-center flex-1">
                      <Text className="text-xl font-black text-rose-500">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode = activeMode === 'all' || answer.sessionType === activeMode;
                            const matchesSubject = filterSubject === 'all' || answer.subject === filterSubject;
                            const matchesDifficulty = filterDifficulty === 'all' || answer.difficulty === filterDifficulty;
                            return matchesMode && matchesSubject && matchesDifficulty && answer.isCorrect === false && answer.userAnswer !== null;
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bengali mt-0.5">ভুল</Text>
                    </View>
                    <View className="w-px bg-slate-200 dark:bg-slate-800" />

                    <View className="items-center flex-1">
                      <Text className="text-xl font-black text-blue-500">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode = activeMode === 'all' || answer.sessionType === activeMode;
                            const matchesSubject = filterSubject === 'all' || answer.subject === filterSubject;
                            const matchesDifficulty = filterDifficulty === 'all' || answer.difficulty === filterDifficulty;
                            return matchesMode && matchesSubject && matchesDifficulty && answer.userAnswer === null;
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bengali mt-0.5">বাকি</Text>
                    </View>
                  </View>
                </View>
              </View>
            }
          />

          {/* Apply Button */}
          <View className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 p-6">
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary-600 dark:bg-primary-500 py-4 rounded-2xl"
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-extrabold text-xs font-bengali">
                ফিল্টার প্রয়োগ করুন
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

export default AllAnswersAnalysisScreen;
