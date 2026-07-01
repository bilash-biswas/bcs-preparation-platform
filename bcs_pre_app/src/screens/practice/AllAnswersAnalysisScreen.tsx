// screens/analysis/AllAnswersAnalysisScreen.tsx
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
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
  SafeAreaView,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { PracticeSession } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

type AllAnswersAnalysisScreenNavigationProp = NativeStackNavigationProp<
  any,
  'AllAnswersAnalysis'
>;

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

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const PAGE_SIZE = 20; // Number of items per page

const AllAnswersAnalysisScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AllAnswersAnalysisScreenNavigationProp>();

  const { sessions, isLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [stats, setStats] = useState<AnswersStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'all' | 'correct' | 'wrong' | 'unanswered'
  >('all');
  const [activeMode, setActiveMode] = useState<'all' | 'practice' | 'quiz'>(
    'all',
  );
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    hasMore: false,
    isLoadingMore: false,
  });

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const allFilteredAnswersRef = useRef<Answer[]>([]);

  // Memoized filtered answers (all matches, not paginated)
  const allFilteredAnswers = useMemo(() => {
    if (!stats) return [];

    const filtered = stats.allAnswers.filter(answer => {
      const matchesAnswerType =
        activeTab === 'all' ||
        (activeTab === 'correct' && answer.isCorrect) ||
        (activeTab === 'wrong' &&
          !answer.isCorrect &&
          answer.userAnswer !== null) ||
        (activeTab === 'unanswered' && answer.userAnswer === null);

      const matchesMode =
        activeMode === 'all' || answer.sessionType === activeMode;
      const matchesSubject =
        filterSubject === 'all' || answer.subject === filterSubject;
      const matchesDifficulty =
        filterDifficulty === 'all' || answer.difficulty === filterDifficulty;

      return (
        matchesAnswerType && matchesMode && matchesSubject && matchesDifficulty
      );
    });

    // Cache the results
    allFilteredAnswersRef.current = filtered;

    // Update pagination info
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: filtered.length,
      hasMore: filtered.length > PAGE_SIZE,
    }));

    return filtered;
  }, [stats, activeTab, activeMode, filterSubject, filterDifficulty]);

  // Paginated answers for current page
  const paginatedAnswers = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return allFilteredAnswers.slice(0, endIndex);
  }, [allFilteredAnswers, pagination.currentPage, pagination.pageSize]);

  // Load more data
  const loadMoreAnswers = useCallback(() => {
    if (pagination.isLoadingMore || !pagination.hasMore) return;

    setPagination(prev => ({
      ...prev,
      isLoadingMore: true,
    }));

    // Simulate API call delay
    setTimeout(() => {
      setPagination(prev => {
        const nextPage = prev.currentPage + 1;
        const hasMore = allFilteredAnswers.length > nextPage * prev.pageSize;

        return {
          ...prev,
          currentPage: nextPage,
          hasMore,
          isLoadingMore: false,
        };
      });
    }, 500);
  }, [pagination.isLoadingMore, pagination.hasMore, allFilteredAnswers.length]);

  // Handle scroll for infinite scrolling
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      if (isCloseToBottom && pagination.hasMore && !pagination.isLoadingMore) {
        loadMoreAnswers();
      }
    },
    [pagination.hasMore, pagination.isLoadingMore, loadMoreAnswers],
  );

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));

    // Scroll to top when filters change
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeTab, activeMode, filterSubject, filterDifficulty]);

  // Data loading
  useFocusEffect(
    useCallback(() => {
      loadAllAnswers();
    }, []),
  );

  useEffect(() => {
    if (sessions.length > 0) {
      processAllAnswers(sessions, []);
    }
  }, [sessions]);

  const loadAllAnswers = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await dispatch(getUserSessions()).unwrap();
    } catch (error: any) {
      console.error('Failed to load answers:', error);
      setError('উত্তরসমূহ লোড করতে সমস্যা হয়েছে');
    } finally {
      setRefreshing(false);
    }
  };

  const processAllAnswers = (
    practiceSessions: PracticeSession[],
    quizSessions: any[] = [],
  ) => {
    const statsData: AnswersStats = {
      totalAnswers: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      practiceAnswers: 0,
      practiceCorrect: 0,
      practiceWrong: 0,
      practiceUnanswered: 0,
      quizAnswers: 0,
      quizCorrect: 0,
      quizWrong: 0,
      quizUnanswered: 0,
      allAnswers: [],
      subjectWiseStats: {},
      difficultyWiseStats: {},
    };

    // Process practice sessions
    for (let i = 0; i < practiceSessions.length; i++) {
      const session = practiceSessions[i];
      if (
        session.session_questions &&
        Array.isArray(session.session_questions)
      ) {
        for (let j = 0; j < session.session_questions.length; j++) {
          const sq = session.session_questions[j];
          const correctOption = sq.options?.find((opt: any) => opt.is_correct);
          const answer: Answer = {
            sessionId: session.id,
            sessionType: 'practice',
            questionId: sq.question || sq.id,
            questionText: sq.question_text,
            subject: sq.subject_name,
            difficulty: sq.difficulty,
            userAnswer: sq.user_answer,
            correctAnswer: correctOption?.id || null,
            isCorrect: sq.is_correct,
            options: sq.options || [],
            timeTaken: sq.time_taken,
            answeredAt: null,
            explanation: sq.explanation,
          };

          statsData.allAnswers.push(answer);
          statsData.totalAnswers++;
          statsData.practiceAnswers++;

          updateSubjectStats(statsData, sq.subject_name, answer);
          updateDifficultyStats(statsData, sq.difficulty, answer);

          if (sq.user_answer === null) {
            statsData.totalUnanswered++;
            statsData.practiceUnanswered++;
          } else if (sq.is_correct) {
            statsData.totalCorrect++;
            statsData.practiceCorrect++;
          } else {
            statsData.totalWrong++;
            statsData.practiceWrong++;
          }
        }
      }
    }

    // Process quiz sessions
    for (let i = 0; i < quizSessions.length; i++) {
      const session = quizSessions[i];
      if (session.questions && Array.isArray(session.questions)) {
        for (let j = 0; j < session.questions.length; j++) {
          const q = session.questions[j];
          const correctOption = q.options?.find((opt: any) => opt.is_correct);
          const answer: Answer = {
            sessionId: session.id,
            sessionType: 'quiz',
            questionId: q.id,
            questionText: q.question_text,
            subject: q.subject_name || q.category,
            difficulty: q.difficulty || 'medium',
            userAnswer: q.user_answer,
            correctAnswer: correctOption?.id || null,
            isCorrect: q.is_correct,
            options: q.options || [],
            timeTaken: q.time_taken,
            answeredAt: q.answered_at,
            marks: q.marks,
            explanation: q.explanation,
          };

          statsData.allAnswers.push(answer);
          statsData.totalAnswers++;
          statsData.quizAnswers++;

          updateSubjectStats(statsData, q.subject_name || q.category, answer);
          updateDifficultyStats(statsData, q.difficulty || 'medium', answer);

          if (q.user_answer === null) {
            statsData.totalUnanswered++;
            statsData.quizUnanswered++;
          } else if (q.is_correct) {
            statsData.totalCorrect++;
            statsData.quizCorrect++;
          } else {
            statsData.totalWrong++;
            statsData.quizWrong++;
          }
        }
      }
    }

    calculateAccuracies(statsData);
    setStats(statsData);
  };

  const updateSubjectStats = (
    stats: AnswersStats,
    subject: string,
    answer: Answer,
  ) => {
    if (!stats.subjectWiseStats[subject]) {
      stats.subjectWiseStats[subject] = {
        total: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        accuracy: 0,
      };
    }
    stats.subjectWiseStats[subject].total++;

    if (answer.userAnswer === null) {
      stats.subjectWiseStats[subject].unanswered++;
    } else if (answer.isCorrect) {
      stats.subjectWiseStats[subject].correct++;
    } else {
      stats.subjectWiseStats[subject].wrong++;
    }
  };

  const updateDifficultyStats = (
    stats: AnswersStats,
    difficulty: string,
    answer: Answer,
  ) => {
    if (!stats.difficultyWiseStats[difficulty]) {
      stats.difficultyWiseStats[difficulty] = {
        total: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        accuracy: 0,
      };
    }
    stats.difficultyWiseStats[difficulty].total++;

    if (answer.userAnswer === null) {
      stats.difficultyWiseStats[difficulty].unanswered++;
    } else if (answer.isCorrect) {
      stats.difficultyWiseStats[difficulty].correct++;
    } else {
      stats.difficultyWiseStats[difficulty].wrong++;
    }
  };

  const calculateAccuracies = (stats: AnswersStats) => {
    Object.keys(stats.subjectWiseStats).forEach(subject => {
      const subjectStats = stats.subjectWiseStats[subject];
      const answered = subjectStats.correct + subjectStats.wrong;
      subjectStats.accuracy =
        answered > 0 ? (subjectStats.correct / answered) * 100 : 0;
    });

    Object.keys(stats.difficultyWiseStats).forEach(difficulty => {
      const difficultyStats = stats.difficultyWiseStats[difficulty];
      const answered = difficultyStats.correct + difficultyStats.wrong;
      difficultyStats.accuracy =
        answered > 0 ? (difficultyStats.correct / answered) * 100 : 0;
    });
  };

  // Helper functions (memoized)
  const getDifficultyText = useCallback((difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'সহজ';
      case 'medium':
        return 'মধ্যম';
      case 'hard':
        return 'কঠিন';
      default:
        return difficulty || 'অজানা';
    }
  }, []);

  const getDifficultyColor = useCallback((difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-100 border-emerald-200';
      case 'medium':
        return 'bg-amber-100 border-amber-200';
      case 'hard':
        return 'bg-rose-100 border-rose-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  }, []);

  const getDifficultyTextColor = useCallback((difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-emerald-800';
      case 'medium':
        return 'text-amber-800';
      case 'hard':
        return 'text-rose-800';
      default:
        return 'text-gray-800';
    }
  }, []);

  const getSessionTypeColor = useCallback(
    (type: 'practice' | 'quiz'): string => {
      return type === 'practice'
        ? 'bg-blue-100 border-blue-200'
        : 'bg-purple-100 border-purple-200';
    },
    [],
  );

  const getSessionTypeTextColor = useCallback(
    (type: 'practice' | 'quiz'): string => {
      return type === 'practice' ? 'text-blue-800' : 'text-purple-800';
    },
    [],
  );

  const getSessionTypeText = useCallback(
    (type: 'practice' | 'quiz'): string => {
      return type === 'practice' ? 'প্র্যাকটিস' : 'কুইজ';
    },
    [],
  );

  const getAnswerTypeColor = useCallback((answer: Answer): string => {
    if (answer.userAnswer === null) {
      return 'border-gray-200 bg-gray-50';
    } else if (answer.isCorrect) {
      return 'border-emerald-200 bg-emerald-50';
    } else {
      return 'border-rose-200 bg-rose-50';
    }
  }, []);

  const getAnswerTypeIcon = useCallback((answer: Answer): string => {
    if (answer.userAnswer === null) {
      return '❓';
    } else if (answer.isCorrect) {
      return '✅';
    } else {
      return '❌';
    }
  }, []);

  const getTabCount = useCallback(
    (tab: string, mode: string = 'all') => {
      if (!stats) return 0;

      let count = 0;
      for (const answer of stats.allAnswers) {
        const matchesMode = mode === 'all' || answer.sessionType === mode;

        if (matchesMode) {
          if (tab === 'all') count++;
          else if (tab === 'correct' && answer.isCorrect) count++;
          else if (
            tab === 'wrong' &&
            !answer.isCorrect &&
            answer.userAnswer !== null
          )
            count++;
          else if (tab === 'unanswered' && answer.userAnswer === null) count++;
        }
      }

      return count;
    },
    [stats],
  );

  const toggleQuestion = useCallback((questionId: number) => {
    setExpandedQuestions(prev => {
      const isExpanded = prev.includes(questionId);
      if (isExpanded) {
        return prev.filter(id => id !== questionId);
      } else {
        if (prev.length >= 3) {
          return [questionId];
        }
        return [...prev, questionId];
      }
    });
  }, []);

  const retryWrongAnswers = useCallback(() => {
    if (!stats) return;

    const wrongQuestionIds = stats.allAnswers
      .filter(answer => !answer.isCorrect && answer.userAnswer !== null)
      .map(answer => answer.questionId);

    if (wrongQuestionIds.length > 0) {
      Alert.alert(
        'ভুল উত্তর পুনরায় চেষ্টা',
        `${wrongQuestionIds.length} টি ভুল উত্তর পুনরায় চেষ্টা করা হবে`,
        [
          { text: 'বাতিল', style: 'cancel' },
          {
            text: 'চালিয়ে যান',
            onPress: () => {
              navigation.navigate('Practice', {
                screen: 'PracticeScreen',
                params: { retryQuestions: wrongQuestionIds },
              });
            },
          },
        ],
      );
    } else {
      Alert.alert('ভুল উত্তর নেই', 'কোন ভুল উত্তর পাওয়া যায়নি!');
    }
  }, [stats, navigation]);

  const clearFilters = useCallback(() => {
    setActiveTab('all');
    setActiveMode('all');
    setFilterSubject('all');
    setFilterDifficulty('all');
    setShowFiltersModal(false);
  }, []);

  // Memoized components
  const AnswerItem = React.memo(
    ({
      answer,
      index,
      isExpanded,
      onToggle,
    }: {
      answer: Answer;
      index: number;
      isExpanded: boolean;
      onToggle: () => void;
    }) => {
      const userSelectedOption = answer.userAnswer
        ? answer.options.find(opt => opt.id === answer.userAnswer)
        : null;
      const correctOption = answer.options.find(
        opt => opt.id === answer.correctAnswer,
      );

      return (
        <View
          className={`rounded-xl border-2 overflow-hidden mb-3 ${getAnswerTypeColor(
            answer,
          )}`}
        >
          <TouchableOpacity onPress={onToggle} className="w-full p-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-1 mb-2">
                  <Text className="text-xs text-gray-500 font-bengali">
                    #{(pagination.currentPage - 1) * PAGE_SIZE + index + 1}
                  </Text>
                  <View
                    className={`px-2 py-1 rounded-full ${getSessionTypeColor(
                      answer.sessionType,
                    )}`}
                  >
                    <Text
                      className={`text-xs font-medium font-bengali ${getSessionTypeTextColor(
                        answer.sessionType,
                      )}`}
                    >
                      {getSessionTypeText(answer.sessionType)}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${getDifficultyColor(
                      answer.difficulty,
                    )}`}
                  >
                    <Text
                      className={`text-xs font-medium font-bengali ${getDifficultyTextColor(
                        answer.difficulty,
                      )}`}
                    >
                      {getDifficultyText(answer.difficulty)}
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-full bg-gray-100">
                    <Text className="text-gray-800 text-xs font-medium font-bengali">
                      {answer.subject}
                    </Text>
                  </View>
                  <Text className="text-sm">{getAnswerTypeIcon(answer)}</Text>
                </View>
                <Text className="font-semibold text-gray-900 font-bengali leading-5">
                  {answer.questionText}
                </Text>
              </View>
              <Icon
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <AnswerDetails
              answer={answer}
              userSelectedOption={userSelectedOption}
              correctOption={correctOption}
            />
          )}
        </View>
      );
    },
  );

  const AnswerDetails = React.memo(
    ({
      answer,
      userSelectedOption,
      correctOption,
    }: {
      answer: Answer;
      userSelectedOption: any;
      correctOption: any;
    }) => (
      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="mb-4">
          <Text className="font-semibold mb-2 font-bengali">বিকল্পসমূহ:</Text>
          <View className="space-y-2">
            {answer.options.map(option => {
              const isCorrectOption = option.id === answer.correctAnswer;
              const isUserSelected = option.id === answer.userAnswer;

              return (
                <View
                  key={option.id}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrectOption
                      ? 'border-emerald-500 bg-emerald-50'
                      : isUserSelected
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        isCorrectOption
                          ? 'border-emerald-500 bg-emerald-500'
                          : isUserSelected
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-gray-400 bg-white'
                      }`}
                    >
                      {isCorrectOption && (
                        <Text className="text-white text-xs">✓</Text>
                      )}
                      {isUserSelected && !isCorrectOption && (
                        <Text className="text-white text-xs">✗</Text>
                      )}
                    </View>
                    <Text className="font-bengali flex-1 text-sm leading-5">
                      {option.option_text}
                    </Text>
                    {isCorrectOption && (
                      <View className="px-2 py-1 bg-emerald-100 rounded-full ml-2">
                        <Text className="text-emerald-800 text-xs font-medium font-bengali">
                          সঠিক
                        </Text>
                      </View>
                    )}
                    {isUserSelected && !isCorrectOption && (
                      <View className="px-2 py-1 bg-blue-100 rounded-full ml-2">
                        <Text className="text-blue-800 text-xs font-medium font-bengali">
                          আপনার
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {answer.explanation && (
          <View className="mb-4">
            <Text className="font-semibold mb-2 font-bengali">ব্যাখ্যা:</Text>
            <View className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Text className="text-gray-700 font-bengali leading-5 text-sm">
                {answer.explanation}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row flex-wrap gap-4">
          <View>
            <Text className="text-gray-500 font-bengali text-xs">বিষয়:</Text>
            <Text className="font-semibold text-sm">{answer.subject}</Text>
          </View>
          <View>
            <Text className="text-gray-500 font-bengali text-xs">কঠিনতা:</Text>
            <Text className="font-semibold text-sm">
              {getDifficultyText(answer.difficulty)}
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 font-bengali text-xs">সেশন:</Text>
            <Text className="font-semibold text-sm">#{answer.sessionId}</Text>
          </View>
          {answer.timeTaken && (
            <View>
              <Text className="text-gray-500 font-bengali text-xs">সময়:</Text>
              <Text className="font-semibold text-sm">{answer.timeTaken}</Text>
            </View>
          )}
          {answer.marks && (
            <View>
              <Text className="text-gray-500 font-bengali text-xs">
                মার্কস:
              </Text>
              <Text className="font-semibold text-sm">{answer.marks}</Text>
            </View>
          )}
        </View>
      </View>
    ),
  );

  const renderAnswerItem = useCallback(
    ({ item, index }: { item: Answer; index: number }) => {
      const isExpanded = expandedQuestions.includes(item.questionId);

      return (
        <AnswerItem
          answer={item}
          index={index}
          isExpanded={isExpanded}
          onToggle={() => toggleQuestion(item.questionId)}
        />
      );
    },
    [expandedQuestions, toggleQuestion],
  );

  const keyExtractor = useCallback(
    (item: Answer, index: number) =>
      `${item.sessionId}-${item.questionId}-${index}`,
    [],
  );

  const renderFooter = useCallback(() => {
    if (!pagination.isLoadingMore) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-gray-500 text-sm mt-2 font-bengali">
          আরো উত্তর লোড হচ্ছে...
        </Text>
      </View>
    );
  }, [pagination.isLoadingMore]);

  const renderHeader = useCallback(
    () => (
      <View className="p-4">
        {/* Mode Breakdown */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl shadow-lg p-4">
            <Text className="text-blue-600 font-bold mb-2 font-bengali text-center">
              প্র্যাকটিস
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-lg font-bold">
                  {stats?.practiceAnswers || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">মোট</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-emerald-600">
                  {stats?.practiceCorrect || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">সঠিক</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-rose-600">
                  {stats?.practiceWrong || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">ভুল</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-2xl shadow-lg p-4">
            <Text className="text-purple-600 font-bold mb-2 font-bengali text-center">
              কুইজ
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-lg font-bold">
                  {stats?.quizAnswers || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">মোট</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-emerald-600">
                  {stats?.quizCorrect || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">সঠিক</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-rose-600">
                  {stats?.quizWrong || 0}
                </Text>
                <Text className="text-gray-600 text-xs font-bengali">ভুল</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Answer Type Tabs */}
        <View className="bg-white rounded-2xl shadow-lg p-1 mb-4">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              className={`flex-1 px-2 py-3 rounded-lg ${
                activeTab === 'all' ? 'bg-blue-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold font-bengali text-xs ${
                  activeTab === 'all' ? 'text-white' : 'text-gray-600'
                }`}
              >
                সব ({getTabCount('all')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('correct')}
              className={`flex-1 px-2 py-3 rounded-lg ${
                activeTab === 'correct' ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold font-bengali text-xs ${
                  activeTab === 'correct' ? 'text-white' : 'text-gray-600'
                }`}
              >
                সঠিক ({getTabCount('correct')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('wrong')}
              className={`flex-1 px-2 py-3 rounded-lg ${
                activeTab === 'wrong' ? 'bg-rose-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold font-bengali text-xs ${
                  activeTab === 'wrong' ? 'text-white' : 'text-gray-600'
                }`}
              >
                ভুল ({getTabCount('wrong')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('unanswered')}
              className={`flex-1 px-2 py-3 rounded-lg ${
                activeTab === 'unanswered' ? 'bg-gray-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold font-bengali text-xs ${
                  activeTab === 'unanswered' ? 'text-white' : 'text-gray-600'
                }`}
              >
                উত্তরহীন ({getTabCount('unanswered')})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Display */}
        {(activeMode !== 'all' ||
          filterSubject !== 'all' ||
          filterDifficulty !== 'all') && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {activeMode !== 'all' && (
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-800 text-xs font-bengali">
                  {activeMode === 'practice' ? 'প্র্যাকটিস' : 'কুইজ'}
                </Text>
              </View>
            )}
            {filterSubject !== 'all' && (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-800 text-xs font-bengali">
                  {filterSubject}
                </Text>
              </View>
            )}
            {filterDifficulty !== 'all' && (
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-800 text-xs font-bengali">
                  {getDifficultyText(filterDifficulty)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {stats && stats.totalWrong > 0 && (
          <View className="mb-4">
            <TouchableOpacity
              onPress={retryWrongAnswers}
              className="bg-rose-600 py-3 rounded-xl shadow-lg"
            >
              <Text className="text-white text-center font-semibold font-bengali">
                ভুল উত্তর আবার চেষ্টা করুন ({stats.totalWrong})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Header */}
        <View className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-2 font-bengali">
            {activeTab === 'all' && 'সকল উত্তর'}
            {activeTab === 'correct' && 'সঠিক উত্তরসমূহ'}
            {activeTab === 'wrong' && 'ভুল উত্তরসমূহ'}
            {activeTab === 'unanswered' && 'উত্তরহীন প্রশ্নসমূহ'}(
            {allFilteredAnswers.length})
          </Text>
          <Text className="text-sm text-gray-600 font-bengali">
            দেখানো হচ্ছে {paginatedAnswers.length} টি উত্তর{' '}
            {allFilteredAnswers.length > PAGE_SIZE ? `${PAGE_SIZE} টি করে` : ''}
          </Text>
        </View>
      </View>
    ),
    [
      stats,
      activeTab,
      activeMode,
      filterSubject,
      filterDifficulty,
      paginatedAnswers.length,
      allFilteredAnswers.length,
    ],
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View className="py-8 items-center">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2 font-bengali text-center">
          {stats?.totalAnswers === 0
            ? 'কোন উত্তর নেই!'
            : 'কোন মিল পাওয়া যায়নি'}
        </Text>
        <Text className="text-gray-600 font-bengali text-center mb-4 leading-5">
          {stats?.totalAnswers === 0
            ? 'আপনি এখনো কোন প্রশ্নের উত্তর দেননি।'
            : 'বর্তমান ফিল্টারের সাথে মিলে এমন কোন উত্তর পাওয়া যায়নি।'}
        </Text>
        {stats?.totalAnswers === 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Practice')}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold font-bengali">
              নতুন প্র্যাকটিস শুরু করুন
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [stats, navigation],
  );

  if (isLoading && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg font-bengali">
          উত্তরসমূহ লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center shadow-lg w-full max-w-sm">
          <Icon name="alert-circle" size={64} color="#dc2626" />
          <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2 font-bengali text-center">
            ত্রুটি
          </Text>
          <Text className="text-gray-600 text-center mb-6 font-bengali leading-5">
            {error || 'উত্তরসমূহ লোড করতে সমস্যা হয়েছে'}
          </Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={loadAllAnswers}
              className="bg-blue-600 px-6 py-3 rounded-xl flex-1"
            >
              <Text className="text-white font-semibold font-bengali text-center">
                আবার চেষ্টা করুন
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-gray-600 px-6 py-3 rounded-xl flex-1"
            >
              <Text className="text-white font-semibold font-bengali text-center">
                ফিরে যান
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 mt-9">
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />

      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="pl-2 rounded-xl"
          >
            <Icon name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text className="text-gray-400 text-xl font-bold font-bengali text-center">
              সকল উত্তর বিশ্লেষণ
            </Text>
            <Text className="text-blue-200 text-xs font-bengali text-center">
              আপনার সকল প্র্যাকটিস ও কুইজ সেশনের উত্তরসমূহ
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowFiltersModal(true)}
            className="bg-white/20 pr-2 rounded-xl"
          >
            <Icon name="filter" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-lg p-3">
          <View className="items-center">
            <Text className="text-white text-lg font-bold">
              {stats.totalAnswers}
            </Text>
            <Text className="text-blue-200 text-xs font-bengali">মোট</Text>
          </View>
          <View className="items-center">
            <Text className="text-emerald-300 text-lg font-bold">
              {stats.totalCorrect}
            </Text>
            <Text className="text-blue-200 text-xs font-bengali">সঠিক</Text>
          </View>
          <View className="items-center">
            <Text className="text-rose-300 text-lg font-bold">
              {stats.totalWrong}
            </Text>
            <Text className="text-blue-200 text-xs font-bengali">ভুল</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-300 text-lg font-bold">
              {stats.totalUnanswered}
            </Text>
            <Text className="text-blue-200 text-xs font-bengali">উত্তরহীন</Text>
          </View>
        </View>
      </View>

      {/* Answers List with Pagination */}
      <FlatList
        ref={flatListRef}
        data={paginatedAnswers}
        renderItem={renderAnswerItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAllAnswers} />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={
          paginatedAnswers.length === 0 ? { flexGrow: 1 } : {}
        }
      />

      {/* Pagination Info Footer */}
      {allFilteredAnswers.length > 0 && (
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <Text className="text-center text-gray-600 text-sm font-bengali">
            {paginatedAnswers.length} / {allFilteredAnswers.length} টি উত্তর
            দেখানো হচ্ছে
            {pagination.hasMore && ' • নিচে স্ক্রল করুন আরো দেখতে'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row space-x-3 gap-2 mb-2">
          <TouchableOpacity
            onPress={() => navigation.navigate('Practice')}
            className="border-2 border-gray-300 py-3 px-4 rounded-xl flex-1"
          >
            <Text className="text-gray-700 text-center font-semibold font-bengali">
              নতুন প্র্যাকটিস
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PracticeHistory')}
            className="border-2 border-gray-300 py-3 px-4 rounded-xl flex-1"
          >
            <Text className="text-gray-700 text-center font-semibold font-bengali">
              ইতিহাস
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Modal - Keep existing implementation */}
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
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity onPress={onClose} className="p-2">
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900 font-bengali">
                ফিল্টার
              </Text>
              <TouchableOpacity onPress={clearFilters} className="p-2">
                <Text className="text-blue-600 font-semibold font-bengali">
                  ক্লিয়ার
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <View className="p-4">
                {/* Session Type Filter */}
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3 font-bengali">
                    সেশন টাইপ
                  </Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => setActiveMode('all')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        activeMode === 'all'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold font-bengali ${
                          activeMode === 'all' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveMode('practice')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        activeMode === 'practice'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold font-bengali ${
                          activeMode === 'practice'
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        প্র্যাকটিস ({stats.practiceAnswers})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveMode('quiz')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        activeMode === 'quiz'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold font-bengali ${
                          activeMode === 'quiz' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        কুইজ ({stats.quizAnswers})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subject Filter */}
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3 font-bengali">
                    বিষয়
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => setFilterSubject('all')}
                      className={`px-4 py-2 rounded-full border ${
                        filterSubject === 'all'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-medium font-bengali ${
                          filterSubject === 'all'
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    {subjects.map(subject => (
                      <TouchableOpacity
                        key={subject}
                        onPress={() => setFilterSubject(subject)}
                        className={`px-4 py-2 rounded-full border ${
                          filterSubject === subject
                            ? 'bg-green-600 border-green-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`font-medium font-bengali ${
                            filterSubject === subject
                              ? 'text-white'
                              : 'text-gray-700'
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
                  <Text className="text-lg font-bold text-gray-900 mb-3 font-bengali">
                    কঠিনতা
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => setFilterDifficulty('all')}
                      className={`px-4 py-2 rounded-full border ${
                        filterDifficulty === 'all'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-medium font-bengali ${
                          filterDifficulty === 'all'
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        সব ({stats.totalAnswers})
                      </Text>
                    </TouchableOpacity>
                    {difficulties.map(difficulty => (
                      <TouchableOpacity
                        key={difficulty}
                        onPress={() => setFilterDifficulty(difficulty)}
                        className={`px-4 py-2 rounded-full border ${
                          filterDifficulty === difficulty
                            ? 'bg-orange-600 border-orange-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`font-medium font-bengali ${
                            filterDifficulty === difficulty
                              ? 'text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          {getDifficultyText(difficulty)} (
                          {stats.difficultyWiseStats[difficulty].total})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Stats Summary */}
                <View className="bg-white rounded-2xl p-4 border border-gray-200">
                  <Text className="text-lg font-bold text-gray-900 mb-3 font-bengali text-center">
                    ফিল্টার্ড পরিসংখ্যান
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode =
                              activeMode === 'all' ||
                              answer.sessionType === activeMode;
                            const matchesSubject =
                              filterSubject === 'all' ||
                              answer.subject === filterSubject;
                            const matchesDifficulty =
                              filterDifficulty === 'all' ||
                              answer.difficulty === filterDifficulty;
                            return (
                              matchesMode && matchesSubject && matchesDifficulty
                            );
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-gray-600 text-xs font-bengali">
                        মোট
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-emerald-600">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode =
                              activeMode === 'all' ||
                              answer.sessionType === activeMode;
                            const matchesSubject =
                              filterSubject === 'all' ||
                              answer.subject === filterSubject;
                            const matchesDifficulty =
                              filterDifficulty === 'all' ||
                              answer.difficulty === filterDifficulty;
                            return (
                              matchesMode &&
                              matchesSubject &&
                              matchesDifficulty &&
                              answer.isCorrect
                            );
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-gray-600 text-xs font-bengali">
                        সঠিক
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-rose-600">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode =
                              activeMode === 'all' ||
                              answer.sessionType === activeMode;
                            const matchesSubject =
                              filterSubject === 'all' ||
                              answer.subject === filterSubject;
                            const matchesDifficulty =
                              filterDifficulty === 'all' ||
                              answer.difficulty === filterDifficulty;
                            return (
                              matchesMode &&
                              matchesSubject &&
                              matchesDifficulty &&
                              !answer.isCorrect &&
                              answer.userAnswer !== null
                            );
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-gray-600 text-xs font-bengali">
                        ভুল
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-gray-600">
                        {(() => {
                          const filtered = stats.allAnswers.filter(answer => {
                            const matchesMode =
                              activeMode === 'all' ||
                              answer.sessionType === activeMode;
                            const matchesSubject =
                              filterSubject === 'all' ||
                              answer.subject === filterSubject;
                            const matchesDifficulty =
                              filterDifficulty === 'all' ||
                              answer.difficulty === filterDifficulty;
                            return (
                              matchesMode &&
                              matchesSubject &&
                              matchesDifficulty &&
                              answer.userAnswer === null
                            );
                          }).length;
                          return filtered;
                        })()}
                      </Text>
                      <Text className="text-gray-600 text-xs font-bengali">
                        উত্তরহীন
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            }
          />

          {/* Apply Button */}
          <View className="bg-white border-t border-gray-200 p-4">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl"
            >
              <Text className="text-white text-center font-semibold text-lg font-bengali">
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
