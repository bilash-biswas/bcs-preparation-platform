// screens/practice/PracticeResultsScreen.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchSession,
  clearCurrentSession,
} from '../../store/slices/practiceSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { MainStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';

type PracticeResultsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

type RouteParams = {
  sessionId: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SessionQuestion {
  id: number;
  question: number;
  question_text: string;
  subject_name: string;
  difficulty: string;
  options: any[];
  user_answer: number | null;
  is_correct: boolean;
  time_taken: string | null;
  sequence_order: number;
  answered_at?: string;
  explanation?: string;
}

const PracticeResultsScreen = () => {
  const navigation = useNavigation<PracticeResultsScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { sessionId } = route.params as RouteParams;

  const { currentSession, isLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'questions'>('summary');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  useEffect(() => {
    if (sessionId && !currentSession) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, [sessionId, currentSession]);

  const loadSession = async () => {
    try {
      setError(null);
      await dispatch(fetchSession(sessionId)).unwrap();
    } catch (error: any) {
      console.error('Failed to load session results:', error);
      setError('সেশন ফলাফল লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, []);

  // Question Analysis Functions
  const toggleQuestion = useCallback((questionId: number) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const expandAll = useCallback(() => {
    if (currentSession) {
      setExpandedQuestions(currentSession.session_questions.map(sq => sq.question));
    }
  }, [currentSession]);

  const collapseAll = useCallback(() => {
    setExpandedQuestions([]);
  }, []);

  const getQuestionData = useCallback((sq: SessionQuestion) => {
    return {
      id: sq.question,
      question_text: sq.question_text,
      explanation: sq.explanation || '',
      question_type: 'multiple_choice',
      difficulty: sq.difficulty,
      marks: 1,
      subject_name: sq.subject_name,
      options: sq.options || []
    };
  }, []);

  const shareResults = async () => {
    if (!currentSession) return;

    try {
      const score = currentSession.score.toFixed(1);
      const total = currentSession.total_questions;
      const correct = currentSession.correct_answers;
      const accuracy = ((correct / total) * 100).toFixed(1);

      const message =
        `📚 প্র্যাকটিস সেশন ফলাফল\n\n` +
        `⭐ স্কোর: ${score}%\n` +
        `✅ সঠিক উত্তর: ${correct}/${total}\n` +
        `🎯 সঠিকতা: ${accuracy}%\n` +
        `📊 পারফরম্যান্স: ${getPerformanceText(currentSession.score)}\n\n` +
        `#বিসিএস_প্রস্তুতি #প্র্যাকটিস #লার্নিং_অ্যাপ`;

      await Share.share({
        message,
        title: 'আমার প্র্যাকটিস সেশন ফলাফল',
      });
    } catch (error) {
      Alert.alert('ত্রুটি', 'ফলাফল শেয়ার করতে সমস্যা হয়েছে');
    }
  };

  const getPerformanceText = (score: number) => {
    if (score >= 90) return 'অসাধারণ';
    if (score >= 80) return 'চমৎকার';
    if (score >= 70) return 'ভালো';
    if (score >= 60) return 'সন্তোষজনক';
    return 'উন্নয়ন প্রয়োজন';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getPerformanceGradient = (score: number) => {
    if (score >= 80) return ['#10b981', '#059669'];
    if (score >= 60) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#dc2626'];
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return 'trophy';
    if (score >= 60) return 'star';
    return 'alert-circle';
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 border-green-200';
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-200';
    if (percentage >= 40) return 'bg-orange-100 border-orange-200';
    return 'bg-red-100 border-red-200';
  };

  const handleNewPractice = () => {
    dispatch(clearCurrentSession());
    navigation.navigate('Practice');
  };

  const handleReviewAnswers = () => {
    if (currentSession) {
      navigation.navigate('AllAnswerAnalysis');
    }
  };

  const handleGoHome = () => {
    navigation.navigate('TabNavigator', { screen: 'Home' });
  };

  const retryIncorrectQuestions = () => {
    if (!currentSession) return;
    
    const incorrectQuestions = currentSession.session_questions
      .filter(sq => !sq.is_correct && sq.user_answer !== null)
      .map(sq => sq.question);
    
    if (incorrectQuestions.length > 0) {
      Alert.alert(
        'ভুল প্রশ্ন পুনরায় চেষ্টা করুন',
        `${incorrectQuestions.length} টি ভুল প্রশ্ন পুনরায় চেষ্টা করা হবে`,
        [
          { text: 'বাতিল', style: 'cancel' },
          {
            text: 'চালিয়ে যান',
            onPress: () => {
              // Navigate to practice with retry questions
              navigation.navigate('Practice');
            },
          },
        ]
      );
    } else {
      Alert.alert('ভুল প্রশ্ন নেই', 'কোন ভুল প্রশ্ন পাওয়া যায়নি!');
    }
  };

  // Memoized calculations
  const stats = useMemo(() => {
    if (!currentSession) return null;

    return {
      total: currentSession.total_questions,
      correct: currentSession.correct_answers,
      incorrect: currentSession.wrong_answers,
      unanswered: currentSession.total_questions - currentSession.completed_questions,
      score: currentSession.score,
      accuracy: (
        (currentSession.correct_answers / currentSession.total_questions) *
        100
      ).toFixed(1),
    };
  }, [currentSession]);

  const performanceData = useMemo(() => {
    if (!stats) return null;

    return {
      color: getPerformanceColor(stats.score),
      gradient: getPerformanceGradient(stats.score),
      icon: getPerformanceIcon(stats.score),
      text: getPerformanceText(stats.score),
    };
  }, [stats]);

  // Calculate subject-wise and difficulty-wise stats
  const subjectStats = useMemo(() => {
    if (!currentSession) return {};
    return currentSession.session_questions.reduce((acc, sq) => {
      const subjectName = sq.subject_name;
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, correct: 0 };
      }
      acc[subjectName].total++;
      if (sq.is_correct) {
        acc[subjectName].correct++;
      }
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);
  }, [currentSession]);

  const difficultyStats = useMemo(() => {
    if (!currentSession) return {};
    return currentSession.session_questions.reduce((acc, sq) => {
      const difficulty = sq.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, correct: 0 };
      }
      acc[difficulty].total++;
      if (sq.is_correct) {
        acc[difficulty].correct++;
      }
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);
  }, [currentSession]);

  const incorrectQuestionsCount = useMemo(() => {
    if (!currentSession) return 0;
    return currentSession.session_questions.filter(
      sq => !sq.is_correct && sq.user_answer !== null
    ).length;
  }, [currentSession]);

  if (loading || isLoading) {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-50 to-indigo-100 justify-center items-center">
        <StatusBar backgroundColor="#dbeafe" barStyle="dark-content" />
        <View className="items-center">
          <View className="w-16 h-16 bg-white rounded-2xl shadow-lg items-center justify-center mb-4">
            <Icon name="analytics" size={32} color="#3b82f6" />
          </View>
          <Text className="text-gray-700 text-lg font-bengali mb-2">
            ফলাফল লোড হচ্ছে...
          </Text>
          <Text className="text-gray-500 text-sm font-bengali">
            সেশন ID: {sessionId}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !currentSession || !stats || !performanceData) {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-50 to-indigo-100 justify-center items-center p-6">
        <StatusBar backgroundColor="#dbeafe" barStyle="dark-content" />
        <View className="bg-white rounded-3xl p-8 items-center shadow-2xl w-full max-w-sm">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <Icon name="warning" size={40} color="#dc2626" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mt-2 mb-3 font-bengali text-center">
            {error ? 'ত্রুটি' : 'ফলাফল পাওয়া যায়নি'}
          </Text>
          <Text className="text-gray-600 text-center mb-6 font-bengali leading-6">
            {error || 'সেশন ফলাফল লোড করতে সমস্যা হয়েছে'}
          </Text>
          <View className="flex-row space-x-3 w-full">
            <TouchableOpacity
              onPress={loadSession}
              className="flex-1 bg-blue-600 px-4 py-4 rounded-xl shadow-lg"
            >
              <Text className="text-white font-semibold font-bengali text-center">
                আবার চেষ্টা করুন
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNewPractice}
              className="flex-1 bg-gray-600 px-4 py-4 rounded-xl shadow-lg"
            >
              <Text className="text-white font-semibold font-bengali text-center">
                নতুন প্র্যাকটিস
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const renderSummaryView = () => (
    <View className="space-y-6">
      {/* Score Card */}
      <LinearGradient
        colors={performanceData.gradient}
        className="rounded-3xl shadow-2xl p-8"
      >
        <View className="items-center">
          <View className="flex-row items-center justify-center mb-4">
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
              <Icon name={performanceData.icon} size={32} color="white" />
            </View>
          </View>

          <View className="items-center mb-4">
            <Text className="text-6xl font-bold text-white mb-2">
              {stats.score.toFixed(1)}%
            </Text>
            <Text className="text-white/90 text-xl mb-3 font-bengali">
              {performanceData.text}
            </Text>
            <Text className="text-3xl font-bold text-white">
              {stats.correct} / {stats.total}
            </Text>
          </View>

          {/* Performance Message */}
          <View className="bg-white/20 rounded-2xl p-4 w-full">
            <Text className="text-white text-center font-bengali leading-6 text-sm">
              {stats.score >= 80
                ? '🎉 অসাধারণ! আপনি বিষয়টি খুব ভালোভাবে বুঝেছেন। এই ধারা বজায় রাখুন।'
                : stats.score >= 60
                ? '👍 ভালো! আপনার দক্ষতা উন্নয়নশীল। আরও অনুশীলনের মাধ্যমে আরও উন্নতি সম্ভব।'
                : '📚 আরও পড়াশোনা এবং অনুশীলন প্রয়োজন। প্রতিদিন নিয়মিত প্র্যাকটিস করুন।'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards Grid */}
      <View className="flex-row justify-between space-x-3">
        <View className="flex-1 bg-white rounded-2xl shadow-lg p-4 items-center">
          <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
            <Icon name="checkmark-circle" size={24} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-green-600">
            {stats.correct}
          </Text>
          <Text className="text-gray-600 text-xs font-bengali mt-1">
            সঠিক উত্তর
          </Text>
        </View>

        <View className="flex-1 bg-white rounded-2xl shadow-lg p-4 items-center">
          <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-2">
            <Icon name="close-circle" size={24} color="#ef4444" />
          </View>
          <Text className="text-2xl font-bold text-red-600">
            {stats.incorrect}
          </Text>
          <Text className="text-gray-600 text-xs font-bengali mt-1">
            ভুল উত্তর
          </Text>
        </View>

        <View className="flex-1 bg-white rounded-2xl shadow-lg p-4 items-center">
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
            <Icon name="speedometer" size={24} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-bold text-blue-600">
            {stats.accuracy}%
          </Text>
          <Text className="text-gray-600 text-xs font-bengali mt-1">
            সঠিকতা
          </Text>
        </View>
      </View>

      {/* Performance Breakdown */}
      <View className="bg-white rounded-2xl shadow-lg p-6">
        <Text className="text-xl font-semibold text-gray-900 mb-6 font-bengali text-center">
          কঠিনতা অনুযায়ী পারফরম্যান্স
        </Text>
        <View className="space-y-4">
          {['easy', 'medium', 'hard'].map((difficulty) => {
            const diffStats = difficultyStats[difficulty] || { total: 0, correct: 0 };
            const percentage = diffStats.total > 0 ? (diffStats.correct / diffStats.total) * 100 : 0;
            const difficultyText = difficulty === 'easy' ? 'সহজ' : difficulty === 'medium' ? 'মধ্যম' : 'কঠিন';
            const color = difficulty === 'easy' ? 'bg-green-500' : difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <View key={difficulty} className="bg-gray-50 rounded-xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className={`text-lg font-semibold ${
                    difficulty === 'easy' ? 'text-green-600' : 
                    difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  } font-bengali`}>
                    {difficultyText}
                  </Text>
                  <Text className="text-gray-700 font-semibold">
                    {diffStats.correct} / {diffStats.total}
                  </Text>
                </View>
                <View className="w-full bg-gray-200 rounded-full h-2">
                  <View 
                    className={`h-2 rounded-full ${color}`} 
                    style={{ width: `${percentage}%` }}
                  />
                </View>
                <Text className="text-gray-600 text-sm mt-1 text-right">
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Subject-wise Performance */}
      {Object.keys(subjectStats).length > 0 && (
        <View className="bg-white rounded-2xl shadow-lg p-6">
          <Text className="text-xl font-semibold text-gray-900 mb-6 font-bengali text-center">
            বিষয়ভিত্তিক পারফরম্যান্স
          </Text>
          <View className="space-y-4">
            {Object.entries(subjectStats).map(([subject, subjectStat]) => {
              const percentage = subjectStat.total > 0 ? (subjectStat.correct / subjectStat.total) * 100 : 0;
              
              return (
                <View key={subject} className="bg-gray-50 rounded-xl p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-semibold text-gray-800 font-bengali">
                      {subject}
                    </Text>
                    <Text className="text-gray-700 font-semibold">
                      {subjectStat.correct} / {subjectStat.total}
                    </Text>
                  </View>
                  <View className="w-full bg-gray-200 rounded-full h-2">
                    <View 
                      className="h-2 rounded-full bg-blue-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-gray-600 text-sm mt-1 text-right">
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderQuestionsView = () => (
    <View className="bg-white rounded-2xl p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-semibold font-bengali">
          সব প্রশ্নের বিশ্লেষণ
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={expandAll}
            className="px-4 py-2 bg-green-600 rounded-lg"
          >
            <Text className="text-white text-sm font-semibold font-bengali">
              সব খুলুন
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={collapseAll}
            className="px-4 py-2 bg-gray-600 rounded-lg"
          >
            <Text className="text-white text-sm font-semibold font-bengali">
              সব বন্ধ করুন
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="space-y-4">
        {currentSession.session_questions.map((sq, index) => {
          const question = getQuestionData(sq);
          const isExpanded = expandedQuestions.includes(question.id);
          const userSelectedOption = sq.user_answer && question.options 
            ? question.options.find(opt => opt.id === sq.user_answer) 
            : null;

          return (
            <View
              key={sq.id}
              className={`rounded-xl border-2 overflow-hidden ${
                sq.is_correct
                  ? "border-green-200 bg-green-50"
                  : sq.user_answer !== null
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <TouchableOpacity
                onPress={() => toggleQuestion(question.id)}
                className="w-full p-6"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-3 mb-2">
                      <Text className="text-sm text-gray-500 font-bengali">
                        প্রশ্ন {index + 1}
                      </Text>
                      <View className={`px-2 py-1 rounded-full ${
                        sq.is_correct
                          ? "bg-green-100"
                          : sq.user_answer !== null
                          ? "bg-red-100"
                          : "bg-gray-100"
                      }`}>
                        <Text className={`text-xs font-medium ${
                          sq.is_correct
                            ? "text-green-800"
                            : sq.user_answer !== null
                            ? "text-red-800"
                            : "text-gray-800"
                        } font-bengali`}>
                          {sq.is_correct
                            ? "সঠিক"
                            : sq.user_answer !== null
                            ? "ভুল"
                            : "উত্তর দেওয়া হয়নি"}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${
                        question.difficulty === "easy"
                          ? "bg-green-100"
                          : question.difficulty === "medium"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}>
                        <Text className={`text-xs font-medium ${
                          question.difficulty === "easy"
                            ? "text-green-800"
                            : question.difficulty === "medium"
                            ? "text-yellow-800"
                            : "text-red-800"
                        } font-bengali`}>
                          {question.difficulty === "easy"
                            ? "সহজ"
                            : question.difficulty === "medium"
                              ? "মধ্যম"
                              : "কঠিন"}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-semibold text-gray-900 font-bengali leading-6">
                      {question.question_text}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-2 font-bengali">
                      বিষয়: {question.subject_name}
                    </Text>
                  </View>
                  <Icon 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View className="p-6 border-t border-gray-200">
                  {/* Options */}
                  <View className="mb-4">
                    <Text className="font-semibold mb-3 font-bengali">
                      বিকল্পসমূহ:
                    </Text>
                    <View className="space-y-2">
                      {(question.options || []).map((option) => {
                        const isCorrectOption = option.is_correct;
                        const isUserSelected = sq.user_answer === option.id;

                        return (
                          <View
                            key={option.id}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectOption
                                ? "border-green-500 bg-green-50"
                                : isUserSelected
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <View className="flex-row items-center">
                              <View
                                className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                  isCorrectOption
                                    ? "border-green-500 bg-green-500"
                                    : isUserSelected
                                    ? "border-red-500 bg-red-500"
                                    : "border-gray-400 bg-white"
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
                                <View className="px-2 py-1 bg-green-100 rounded-full ml-2">
                                  <Text className="text-green-800 text-xs font-medium font-bengali">
                                    সঠিক উত্তর
                                  </Text>
                                </View>
                              )}
                              {isUserSelected && (
                                <View className="px-2 py-1 bg-blue-100 rounded-full ml-2">
                                  <Text className="text-blue-800 text-xs font-medium font-bengali">
                                    আপনার উত্তর
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Explanation */}
                  {question.explanation && (
                    <View className="mb-4">
                      <Text className="font-semibold mb-2 font-bengali">
                        ব্যাখ্যা:
                      </Text>
                      <View className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Text className="text-gray-700 font-bengali leading-5 text-sm">
                          {question.explanation}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Answer Summary */}
                  <View className="flex-row flex-wrap gap-4">
                    <View>
                      <Text className="text-gray-500 font-bengali text-xs">
                        আপনার উত্তর:
                      </Text>
                      <Text className="font-semibold text-sm">
                        {userSelectedOption
                          ? userSelectedOption.option_text
                          : "উত্তর দেওয়া হয়নি"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 font-bengali text-xs">
                        স্ট্যাটাস:
                      </Text>
                      <Text className={`font-semibold text-sm ${
                        sq.is_correct
                          ? "text-green-600"
                          : sq.user_answer !== null
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}>
                        {sq.is_correct
                          ? "সঠিক"
                          : sq.user_answer !== null
                          ? "ভুল"
                          : "উত্তর দেওয়া হয়নি"}
                      </Text>
                    </View>
                    {sq.time_taken && (
                      <View>
                        <Text className="text-gray-500 font-bengali text-xs">
                          সময় নেওয়া:
                        </Text>
                        <Text className="font-semibold text-sm">
                          {sq.time_taken}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-indigo-100">
      <StatusBar backgroundColor="#dbeafe" barStyle="dark-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        className="pt-12 pb-6 px-6 rounded-b-3xl shadow-2xl"
      >
        <View className="items-center">
          <Text className="text-3xl font-bold text-white mb-2 font-bengali">
            প্র্যাকটিস ফলাফল
          </Text>
          <Text className="text-blue-100 text-center font-bengali text-base">
            আপনি {stats.total} টি প্রশ্নের প্র্যাকটিস সম্পন্ন করেছেন
          </Text>
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row justify-center mt-4">
          <View className="bg-white/20 rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setViewMode('summary')}
              className={`px-6 py-3 rounded-lg ${
                viewMode === 'summary' ? 'bg-white' : ''
              }`}
            >
              <Text className={`font-semibold font-bengali ${
                viewMode === 'summary' ? 'text-blue-600' : 'text-white'
              }`}>
                সারাংশ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('questions')}
              className={`px-6 py-3 rounded-lg ${
                viewMode === 'questions' ? 'bg-white' : ''
              }`}
            >
              <Text className={`font-semibold font-bengali ${
                viewMode === 'questions' ? 'text-blue-600' : 'text-white'
              }`}>
                প্রশ্ন বিশ্লেষণ ({currentSession.total_questions})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
      >
        {viewMode === 'summary' ? renderSummaryView() : renderQuestionsView()}

        {/* Action Buttons */}
        <View className="space-y-4 mt-6">
          <TouchableOpacity
            onPress={handleNewPractice}
            className="bg-gradient-to-r from-blue-600 to-purple-600 py-5 rounded-2xl shadow-2xl"
          >
            <View className="flex-row items-center justify-center">
              <Icon name="refresh" size={22} color="white" />
              <Text className="text-white text-center font-semibold text-lg ml-3 font-bengali">
                নতুন প্র্যাকটিস শুরু করুন
              </Text>
            </View>
          </TouchableOpacity>

          {incorrectQuestionsCount > 0 && (
            <TouchableOpacity
              onPress={retryIncorrectQuestions}
              className="bg-gradient-to-r from-orange-500 to-red-600 py-5 rounded-2xl shadow-2xl"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="refresh" size={22} color="white" />
                <Text className="text-white text-center font-semibold text-lg ml-3 font-bengali">
                  ভুল প্রশ্ন আবার চেষ্টা করুন ({incorrectQuestionsCount})
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={shareResults}
            className="border-2 border-green-500 bg-white py-5 rounded-2xl shadow-lg"
          >
            <View className="flex-row items-center justify-center">
              <Icon name="share-social" size={22} color="#10b981" />
              <Text className="text-green-600 text-center font-semibold text-lg ml-3 font-bengali">
                ফলাফল শেয়ার করুন
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoHome}
            className="border-2 border-gray-400 bg-white py-5 rounded-2xl shadow-lg"
          >
            <View className="flex-row items-center justify-center">
              <Icon name="home" size={22} color="#6b7280" />
              <Text className="text-gray-700 text-center font-semibold text-lg ml-3 font-bengali">
                হোম পেজে ফিরুন
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mt-6 border-l-4 border-amber-400 shadow-lg">
          <View className="flex-row items-center justify-center mb-4">
            <Icon name="bulb" size={24} color="#f59e0b" />
            <Text className="font-bold text-amber-800 ml-2 font-bengali text-lg">
              উন্নতির টিপস
            </Text>
          </View>
          <View className="space-y-3">
            {stats.score < 60 && (
              <View className="flex-row items-start">
                <Text className="text-amber-700 text-lg mr-2">•</Text>
                <Text className="text-amber-700 font-bengali text-sm flex-1 leading-5">
                  প্রতিদিন নিয়মিত ৩০ মিনিট পড়াশোনা করুন
                </Text>
              </View>
            )}
            {stats.score < 70 && (
              <View className="flex-row items-start">
                <Text className="text-amber-700 text-lg mr-2">•</Text>
                <Text className="text-amber-700 font-bengali text-sm flex-1 leading-5">
                  প্রতিটি ভুল উত্তরের কারণ বিশ্লেষণ করুন
                </Text>
              </View>
            )}
            <View className="flex-row items-start">
              <Text className="text-amber-700 text-lg mr-2">•</Text>
              <Text className="text-amber-700 font-bengali text-sm flex-1 leading-5">
                ভুল উত্তরের কারণগুলো বুঝতে চেষ্টা করুন
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-amber-700 text-lg mr-2">•</Text>
              <Text className="text-amber-700 font-bengali text-sm flex-1 leading-5">
                বিভিন্ন বিষয়ে ব্যালেন্সড প্র্যাকটিস করুন
              </Text>
            </View>
            {stats.score >= 80 && (
              <View className="flex-row items-start">
                <Text className="text-amber-700 text-lg mr-2">•</Text>
                <Text className="text-amber-700 font-bengali text-sm flex-1 leading-5">
                  এই ধারা বজায় রাখতে নিয়মিত রিভিশন দিন
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Session Info */}
        <View className="bg-white/80 rounded-2xl p-4 mt-4 shadow-inner">
          <Text className="text-gray-600 text-sm font-bengali text-center">
            সেশন ID: {sessionId} • তারিখ: {new Date().toLocaleDateString('bn-BD')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default PracticeResultsScreen;