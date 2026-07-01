// screens/practice/PracticeAnalysisScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getUserSessions } from '../../store/slices/practiceSlice';
import { PracticeSession, PracticeSessionQuestion } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

type PracticeAnalysisScreenNavigationProp = NativeStackNavigationProp<
  any,
  'PracticeAnalysis'
>;

interface QuestionAnalysis {
  sessionId: number;
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
}

interface AnalysisStats {
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  totalQuestions: number;
  accuracy: number;
  correctAnswers: QuestionAnalysis[];
  wrongAnswers: QuestionAnalysis[];
  unansweredQuestions: QuestionAnalysis[];
  subjectWiseStats: Record<
    string,
    {
      correct: number;
      wrong: number;
      unanswered: number;
      total: number;
      accuracy: number;
    }
  >;
  difficultyWiseStats: Record<
    string,
    {
      correct: number;
      wrong: number;
      unanswered: number;
      total: number;
      accuracy: number;
    }
  >;
}

const PracticeAnalysisScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<PracticeAnalysisScreenNavigationProp>();

  const { sessions, isLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [analysis, setAnalysis] = useState<AnalysisStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'correct' | 'wrong' | 'unanswered'
  >('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadAnalysis();
    }, []),
  );

  useEffect(() => {
    if (sessions.length > 0) {
      processSessionsAnalysis(sessions);
    }
  }, [sessions]);

  const loadAnalysis = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await dispatch(getUserSessions()).unwrap();
    } catch (error: any) {
      console.error('Failed to load analysis:', error);
      setError('বিশ্লেষণ লোড করতে সমস্যা হয়েছে');
    } finally {
      setRefreshing(false);
    }
  };

  const processSessionsAnalysis = (sessions: PracticeSession[]) => {
    const analysisData: AnalysisStats = {
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      totalQuestions: 0,
      accuracy: 0,
      correctAnswers: [],
      wrongAnswers: [],
      unansweredQuestions: [],
      subjectWiseStats: {},
      difficultyWiseStats: {},
    };

    sessions.forEach(session => {
      if (
        session.session_questions &&
        Array.isArray(session.session_questions)
      ) {
        session.session_questions.forEach((sq: any) => {
          analysisData.totalQuestions++;

          // Find correct answer from options
          const correctOption = sq.options?.find((opt: any) => opt.is_correct);
          const correctAnswerId = correctOption?.id || null;

          const questionAnalysis: QuestionAnalysis = {
            sessionId: session.id,
            questionId: sq.question || sq.id,
            questionText: sq.question_text,
            subject: sq.subject_name,
            difficulty: sq.difficulty,
            userAnswer: sq.user_answer,
            correctAnswer: correctAnswerId,
            isCorrect: sq.is_correct,
            options: sq.options || [],
            timeTaken: sq.time_taken,
            answeredAt: sq.answered_at,
          };

          // Update subject-wise stats
          if (!analysisData.subjectWiseStats[sq.subject_name]) {
            analysisData.subjectWiseStats[sq.subject_name] = {
              correct: 0,
              wrong: 0,
              unanswered: 0,
              total: 0,
              accuracy: 0,
            };
          }
          analysisData.subjectWiseStats[sq.subject_name].total++;

          // Update difficulty-wise stats
          if (!analysisData.difficultyWiseStats[sq.difficulty]) {
            analysisData.difficultyWiseStats[sq.difficulty] = {
              correct: 0,
              wrong: 0,
              unanswered: 0,
              total: 0,
              accuracy: 0,
            };
          }
          analysisData.difficultyWiseStats[sq.difficulty].total++;

          if (sq.user_answer === null) {
            analysisData.totalUnanswered++;
            analysisData.unansweredQuestions.push(questionAnalysis);
            analysisData.subjectWiseStats[sq.subject_name].unanswered++;
            analysisData.difficultyWiseStats[sq.difficulty].unanswered++;
          } else if (sq.is_correct) {
            analysisData.totalCorrect++;
            analysisData.correctAnswers.push(questionAnalysis);
            analysisData.subjectWiseStats[sq.subject_name].correct++;
            analysisData.difficultyWiseStats[sq.difficulty].correct++;
          } else {
            analysisData.totalWrong++;
            analysisData.wrongAnswers.push(questionAnalysis);
            analysisData.subjectWiseStats[sq.subject_name].wrong++;
            analysisData.difficultyWiseStats[sq.difficulty].wrong++;
          }
        });
      }
    });

    // Calculate accuracy and subject/difficulty accuracies
    analysisData.accuracy =
      analysisData.totalQuestions > 0
        ? (analysisData.totalCorrect /
            (analysisData.totalCorrect + analysisData.totalWrong)) *
          100
        : 0;

    // Calculate subject-wise accuracy
    Object.keys(analysisData.subjectWiseStats).forEach(subject => {
      const stats = analysisData.subjectWiseStats[subject];
      const answered = stats.correct + stats.wrong;
      stats.accuracy = answered > 0 ? (stats.correct / answered) * 100 : 0;
    });

    // Calculate difficulty-wise accuracy
    Object.keys(analysisData.difficultyWiseStats).forEach(difficulty => {
      const stats = analysisData.difficultyWiseStats[difficulty];
      const answered = stats.correct + stats.wrong;
      stats.accuracy = answered > 0 ? (stats.correct / answered) * 100 : 0;
    });

    setAnalysis(analysisData);
  };

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId],
    );
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-100';
    if (percentage >= 60) return 'bg-amber-100';
    if (percentage >= 40) return 'bg-orange-100';
    return 'bg-rose-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-600 bg-emerald-100';
      case 'medium':
        return 'text-amber-600 bg-amber-100';
      case 'hard':
        return 'text-rose-600 bg-rose-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'সহজ';
      case 'medium':
        return 'মধ্যম';
      case 'hard':
        return 'কঠিন';
      default:
        return difficulty;
    }
  };

  const getTabQuestions = () => {
    if (!analysis) return [];

    switch (activeTab) {
      case 'correct':
        return analysis.correctAnswers;
      case 'wrong':
        return analysis.wrongAnswers;
      case 'unanswered':
        return analysis.unansweredQuestions;
      default:
        return [];
    }
  };

  const filteredQuestions = getTabQuestions().filter(
    q =>
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.difficulty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading && !analysis) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg font-bengali">
          বিশ্লেষণ লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !analysis) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center shadow-xl">
          <Icon name="alert-circle" size={64} color="#dc2626" />
          <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2 font-bengali text-center">
            ত্রুটি
          </Text>
          <Text className="text-gray-600 text-center mb-6 font-bengali">
            {error || 'বিশ্লেষণ লোড করতে সমস্যা হয়েছে'}
          </Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={loadAnalysis}
              className="bg-blue-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold font-bengali">
                আবার চেষ্টা করুন
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Practice')}
              className="bg-gray-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold font-bengali">
                প্র্যাকটিস হোম
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />

      {/* Header */}
      <View className="bg-gradient-to-r from-purple-600 to-pink-600 pt-4 pb-4 px-6 shadow-lg">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-purple-500/80 p-2 rounded-xl"
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View className="flex-1 mx-4">
            <Text className="text-white text-xl font-bold font-bengali text-center">
              প্রশ্ন বিশ্লেষণ
            </Text>
            <Text className="text-purple-200 text-sm font-bengali text-center mt-1">
              আপনার সকল প্র্যাকটিস সেশনের সম্পূর্ণ বিশ্লেষণ
            </Text>
          </View>
          <View className="w-8" /> {/* Spacer for balance */}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAnalysis} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="p-4">
          {/* Overview Stats */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Text className="text-2xl font-bold text-emerald-600">
                {analysis.totalCorrect}
              </Text>
              <Text className="text-gray-600 font-bengali text-sm">
                সঠিক উত্তর
              </Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Text className="text-2xl font-bold text-rose-600">
                {analysis.totalWrong}
              </Text>
              <Text className="text-gray-600 font-bengali text-sm">
                ভুল উত্তর
              </Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Text className="text-2xl font-bold text-blue-600">
                {analysis.totalUnanswered}
              </Text>
              <Text className="text-gray-600 font-bengali text-sm">
                উত্তর দেওয়া হয়নি
              </Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Text
                className={`text-2xl font-bold ${getScoreColor(
                  analysis.accuracy,
                )}`}
              >
                {analysis.accuracy.toFixed(1)}%
              </Text>
              <Text className="text-gray-600 font-bengali text-sm">
                সঠিকতার হার
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View className="bg-white rounded-2xl shadow-xl p-1 mb-6">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-3 rounded-lg ${
                  activeTab === 'overview' ? 'bg-blue-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold font-bengali ${
                    activeTab === 'overview' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  সারাংশ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('correct')}
                className={`flex-1 px-4 py-3 rounded-lg ${
                  activeTab === 'correct' ? 'bg-emerald-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold font-bengali ${
                    activeTab === 'correct' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  সঠিক ({analysis.correctAnswers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('wrong')}
                className={`flex-1 px-4 py-3 rounded-lg ${
                  activeTab === 'wrong' ? 'bg-rose-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold font-bengali ${
                    activeTab === 'wrong' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  ভুল ({analysis.wrongAnswers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('unanswered')}
                className={`flex-1 px-4 py-3 rounded-lg ${
                  activeTab === 'unanswered' ? 'bg-blue-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold font-bengali ${
                    activeTab === 'unanswered' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  উত্তরহীন ({analysis.unansweredQuestions.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search for non-overview tabs */}
          {activeTab !== 'overview' && (
            <View className="mb-4">
              <View className="relative">
                <Icon
                  name="search"
                  size={20}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 12, top: 12 }}
                />
                <TextInput
                  placeholder="বিষয়, কঠিনতা বা প্রশ্ন অনুসন্ধান..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-bengali"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          )}

          {/* Tab Content */}
          <View className="bg-white rounded-2xl shadow-xl p-6">
            {activeTab === 'overview' && <OverviewTab analysis={analysis} />}

            {activeTab !== 'overview' && (
              <QuestionListTab
                questions={filteredQuestions}
                type={activeTab}
                expandedQuestions={expandedQuestions}
                onToggleQuestion={toggleQuestion}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-4 justify-center mt-6">
            <TouchableOpacity
              onPress={() => navigation.navigate('Practice')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-6 rounded-xl flex-1"
            >
              <Text className="text-white text-center font-semibold font-bengali">
                নতুন প্র্যাকটিস শুরু করুন
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('PracticeHistory')}
              className="border-2 border-gray-300 py-3 px-6 rounded-xl flex-1"
            >
              <Text className="text-gray-700 text-center font-semibold font-bengali">
                সেশন ইতিহাস
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Overview Tab Component
const OverviewTab = ({ analysis }: { analysis: AnalysisStats }) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-100';
    if (percentage >= 60) return 'bg-amber-100';
    if (percentage >= 40) return 'bg-orange-100';
    return 'bg-rose-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-600 bg-emerald-100';
      case 'medium':
        return 'text-amber-600 bg-amber-100';
      case 'hard':
        return 'text-rose-600 bg-rose-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'সহজ';
      case 'medium':
        return 'মধ্যম';
      case 'hard':
        return 'কঠিন';
      default:
        return difficulty;
    }
  };
  return (
    <View className="space-y-6">
      {/* Subject-wise Performance */}
      <View>
        <Text className="text-xl font-bold text-gray-900 mb-4 font-bengali">
          বিষয়ভিত্তিক পারফরম্যান্স
        </Text>
        <View className="space-y-3">
          {Object.entries(analysis.subjectWiseStats).map(([subject, stats]) => (
            <View key={subject} className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-gray-900 font-bengali">
                  {subject}
                </Text>
                <Text
                  className={`font-semibold ${getScoreColor(stats.accuracy)}`}
                >
                  {stats.accuracy.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between text-sm">
                <Text className="text-gray-600 font-bengali">
                  সঠিক:{' '}
                  <Text className="font-semibold text-emerald-600">
                    {stats.correct}
                  </Text>
                </Text>
                <Text className="text-gray-600 font-bengali">
                  ভুল:{' '}
                  <Text className="font-semibold text-rose-600">
                    {stats.wrong}
                  </Text>
                </Text>
                <Text className="text-gray-600 font-bengali">
                  মোট: <Text className="font-semibold">{stats.total}</Text>
                </Text>
              </View>
              <View className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <View
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${stats.accuracy}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Difficulty-wise Performance */}
      <View>
        <Text className="text-xl font-bold text-gray-900 mb-4 font-bengali">
          কঠিনতা অনুযায়ী পারফরম্যান্স
        </Text>
        <View className="grid grid-cols-3 gap-3">
          {Object.entries(analysis.difficultyWiseStats).map(
            ([difficulty, stats]) => (
              <View
                key={difficulty}
                className="bg-gray-50 rounded-xl p-4 text-center"
              >
                <View
                  className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${getDifficultyColor(
                    difficulty,
                  )}`}
                >
                  <Text className="font-bengali">
                    {getDifficultyText(difficulty)}
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                  {stats.correct}/{stats.total}
                </Text>
                <Text
                  className={`text-sm font-semibold ${getScoreColor(
                    stats.accuracy,
                  )}`}
                >
                  {stats.accuracy.toFixed(1)}%
                </Text>
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );
};

// Question List Tab Component
interface QuestionListTabProps {
  questions: QuestionAnalysis[];
  type: 'correct' | 'wrong' | 'unanswered';
  expandedQuestions: number[];
  onToggleQuestion: (id: number) => void;
}

const QuestionListTab = ({
  questions,
  type,
  expandedQuestions,
  onToggleQuestion,
}: QuestionListTabProps) => {
  const getTypeColor = () => {
    switch (type) {
      case 'correct':
        return 'border-emerald-200 bg-emerald-50';
      case 'wrong':
        return 'border-rose-200 bg-rose-50';
      case 'unanswered':
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeText = () => {
    switch (type) {
      case 'correct':
        return 'সঠিক';
      case 'wrong':
        return 'ভুল';
      case 'unanswered':
        return 'উত্তর দেওয়া হয়নি';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-600 bg-emerald-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'hard': return 'text-rose-600 bg-rose-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  if (questions.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-4xl mb-4">
          {type === 'correct' ? '✅' : type === 'wrong' ? '❌' : '❓'}
        </Text>
        <Text className="text-xl font-bold text-gray-900 mb-2 font-bengali text-center">
          কোন {getTypeText()} প্রশ্ন পাওয়া যায়নি
        </Text>
        <Text className="text-gray-600 font-bengali text-center">
          {type === 'correct'
            ? 'আপনার এখনো কোন সঠিক উত্তর নেই'
            : type === 'wrong'
            ? 'আপনার এখনো কোন ভুল উত্তর নেই'
            : 'আপনার এখনো কোন উত্তরহীন প্রশ্ন নেই'}
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <Text className="text-xl font-bold text-gray-900 mb-4 font-bengali">
        {getTypeText()} প্রশ্নসমূহ ({questions.length})
      </Text>

      {questions.map((q, index) => {
        const isExpanded = expandedQuestions.includes(q.questionId);
        const userSelectedOption = q.userAnswer
          ? q.options.find(opt => opt.id === q.userAnswer)
          : null;
        const correctOption = q.options.find(opt => opt.is_correct);

        return (
          <View
            key={`${q.sessionId}-${q.questionId}`}
            className={`rounded-xl border-2 overflow-hidden ${getTypeColor()}`}
          >
            <TouchableOpacity
              onPress={() => onToggleQuestion(q.questionId)}
              className="w-full text-left p-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2 mb-2">
                    <Text className="text-sm text-gray-500 font-bengali">
                      প্রশ্ন {index + 1}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        q.difficulty,
                      )}`}
                    >
                      <Text className="font-bengali">
                        {getDifficultyText(q.difficulty)}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100">
                      <Text className="text-blue-800 font-bengali">
                        {q.subject}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-semibold text-gray-900 font-bengali leading-5">
                    {q.questionText}
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
              <View className="p-4 border-t border-gray-200 bg-white">
                {/* Options */}
                <View className="mb-4">
                  <Text className="font-semibold mb-3 font-bengali">
                    বিকল্পসমূহ:
                  </Text>
                  <View className="space-y-2">
                    {q.options.map(option => {
                      const isCorrectOption = option.is_correct;
                      const isUserSelected = q.userAnswer === option.id;

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
                                <Text className="text-white text-sm">✓</Text>
                              )}
                              {isUserSelected && !isCorrectOption && (
                                <Text className="text-white text-sm">✗</Text>
                              )}
                            </View>
                            <Text className="font-bengali flex-1">
                              {option.option_text}
                            </Text>
                            {isCorrectOption && (
                              <View className="px-2 py-1 bg-emerald-100 rounded-full">
                                <Text className="text-emerald-800 text-xs font-medium font-bengali">
                                  সঠিক উত্তর
                                </Text>
                              </View>
                            )}
                            {isUserSelected && (
                              <View className="px-2 py-1 bg-blue-100 rounded-full">
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

                {/* Additional Info */}
                <View className="grid grid-cols-2 gap-4">
                  <View>
                    <Text className="text-gray-500 font-bengali text-sm">
                      বিষয়:
                    </Text>
                    <Text className="font-semibold">{q.subject}</Text>
                  </View>
                  <View>
                    <Text className="text-gray-500 font-bengali text-sm">
                      কঠিনতা:
                    </Text>
                    <Text className="font-semibold">
                      {getDifficultyText(q.difficulty)}
                    </Text>
                  </View>
                  {q.timeTaken && (
                    <View>
                      <Text className="text-gray-500 font-bengali text-sm">
                        সময় নেওয়া:
                      </Text>
                      <Text className="font-semibold">{q.timeTaken}</Text>
                    </View>
                  )}
                  <View>
                    <Text className="text-gray-500 font-bengali text-sm">
                      সেশন:
                    </Text>
                    <Text className="font-semibold">#{q.sessionId}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default PracticeAnalysisScreen;
