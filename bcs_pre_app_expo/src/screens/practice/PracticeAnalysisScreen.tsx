// src/screens/practice/PracticeAnalysisScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  explanation?: string;
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
  const { isDark } = useAppTheme();

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
    } catch (err: any) {
      console.error('Failed to load analysis:', err);
      setError('বিশ্লেষণ লোড করতে সমস্যা হয়েছে');
    } finally {
      setRefreshing(false);
    }
  };

  const processSessionsAnalysis = (sessionsData: PracticeSession[]) => {
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

    sessionsData.forEach(session => {
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
            explanation: sq.explanation || sq.question_details?.explanation || '',
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
      analysisData.totalCorrect + analysisData.totalWrong > 0
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
    if (percentage >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (percentage >= 60) return 'text-amber-500 dark:text-amber-400';
    if (percentage >= 40) return 'text-orange-500 dark:text-orange-400';
    return 'text-rose-500 dark:text-rose-400';
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
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-650 dark:text-slate-400 mt-4 text-sm font-bengali">
          বিশ্লেষণ লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !analysis) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center p-6">
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 items-center shadow-md">
          <Icon name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 font-bengali text-center">
            ত্রুটি
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center mb-6 font-bengali text-xs leading-5">
            {error || 'বিশ্লেষণ লোড করতে সমস্যা হয়েছে'}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={loadAnalysis}
              className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl"
            >
              <Text className="text-white font-extrabold font-bengali text-xs">
                আবার চেষ্টা করুন
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Practice')}
              className="bg-slate-200 dark:bg-slate-800 px-6 py-3 rounded-2xl"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-extrabold font-bengali text-xs">
                প্র্যাকটিস হোম
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-55 dark:bg-slate-950">
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
              প্রশ্ন বিশ্লেষণ
            </Text>
            <Text className="text-purple-100 dark:text-slate-400 text-xs font-bengali text-center mt-1">
              আপনার প্র্যাকটিস সেশনের সম্পূর্ণ কর্মদক্ষতা পর্যালোচনা
            </Text>
          </View>
          <View className="w-10" />
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAnalysis} tintColor="#7c3aed" />
        }
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats Dashboard */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Correct Answer Card */}
          <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl items-center justify-center mb-3">
              <Icon name="checkmark-circle-outline" size={22} color="#10b981" />
            </View>
            <Text className="text-2xl font-black text-emerald-500">
              {analysis.totalCorrect}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[10px] mt-0.5">
              সদুপায় উত্তর
            </Text>
          </View>

          {/* Wrong Answer Card */}
          <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 rounded-2xl items-center justify-center mb-3">
              <Icon name="close-circle-outline" size={22} color="#f43f5e" />
            </View>
            <Text className="text-2xl font-black text-rose-500">
              {analysis.totalWrong}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[10px] mt-0.5">
              ভুল উত্তর
            </Text>
          </View>

          {/* Unanswered Card */}
          <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-2xl items-center justify-center mb-3">
              <Icon name="help-circle-outline" size={22} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-black text-blue-500">
              {analysis.totalUnanswered}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[10px] mt-0.5">
              উত্তরহীন
            </Text>
          </View>

          {/* Accuracy Card */}
          <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 rounded-2xl items-center justify-center mb-3">
              <Icon name="stats-chart-outline" size={22} color="#7c3aed" />
            </View>
            <Text className={`text-2xl font-black ${getScoreColor(analysis.accuracy)}`}>
              {analysis.accuracy.toFixed(1)}%
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 font-bengali text-[10px] mt-0.5">
              সঠিকতার হার
            </Text>
          </View>
        </View>

        {/* Segmented Navigation Tabs */}
        <View className="bg-slate-200/60 dark:bg-slate-900 border border-slate-100/50 dark:border-slate-800 rounded-2xl p-1 flex-row mb-6">
          {(['overview', 'correct', 'wrong', 'unanswered'] as const).map(tab => {
            const isSelected = activeTab === tab;
            let tabLabel = '';
            if (tab === 'overview') tabLabel = 'সারাংশ';
            else if (tab === 'correct') tabLabel = `সঠিক (${analysis.correctAnswers.length})`;
            else if (tab === 'wrong') tabLabel = `ভুল (${analysis.wrongAnswers.length})`;
            else tabLabel = `উত্তরহীন (${analysis.unansweredQuestions.length})`;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-1 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-white dark:bg-slate-800 shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-[10px] font-extrabold font-bengali text-center ${
                    isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'
                  }`}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search for non-overview tabs */}
        {activeTab !== 'overview' && (
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex-row items-center px-4 py-3.5 mb-5">
            <Icon name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              placeholder="বিষয়, কঠিনতা বা প্রশ্ন সার্চ করুন..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-2.5 text-xs text-slate-800 dark:text-slate-200 font-bengali"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}

        {/* Dashboard Content Pane */}
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
          {activeTab === 'overview' ? (
            <OverviewTab analysis={analysis} isDark={isDark} />
          ) : (
            <QuestionListTab
              questions={filteredQuestions}
              type={activeTab}
              expandedQuestions={expandedQuestions}
              onToggleQuestion={toggleQuestion}
            />
          )}
        </View>

        {/* Bottom Actions */}
        <View className="flex-row gap-4 mt-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('Practice')}
            className="flex-1 bg-primary-600 dark:bg-primary-500 py-4 rounded-2xl items-center justify-center"
          >
            <Text className="text-white font-extrabold font-bengali text-xs">
              নতুন প্র্যাকটিস সেশন
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PracticeHistory')}
            className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 rounded-2xl items-center justify-center"
          >
            <Text className="text-slate-700 dark:text-slate-300 font-extrabold font-bengali text-xs">
              সেশন ইতিহাস
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Overview Tab Component
const OverviewTab = ({ analysis, isDark }: { analysis: AnalysisStats; isDark: boolean }) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-amber-500';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-rose-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
      case 'hard':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'सहজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  return (
    <View className="gap-6">
      {/* Subject-wise Performance */}
      <View>
        <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4 font-bengali">
          विषয়ভিত্তিক পারফরম্যান্স
        </Text>
        <View className="gap-3.5">
          {Object.entries(analysis.subjectWiseStats).map(([subject, stats]) => (
            <View key={subject} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-900/40 rounded-2xl p-4">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="font-extrabold text-slate-800 dark:text-slate-200 font-bengali text-xs">
                  {subject}
                </Text>
                <Text className={`font-black text-xs ${getScoreColor(stats.accuracy)}`}>
                  {stats.accuracy.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bengali">
                <Text>সঠিক: <Text className="font-extrabold text-emerald-500">{stats.correct}</Text></Text>
                <Text>ভুল: <Text className="font-extrabold text-rose-500">{stats.wrong}</Text></Text>
                <Text>মোট: <Text className="font-extrabold text-slate-700 dark:text-slate-300">{stats.total}</Text></Text>
              </View>
              {/* Progress bar */}
              <View className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <View
                  className="h-2 rounded-full bg-primary-600 dark:bg-primary-500"
                  style={{ width: `${stats.accuracy}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Difficulty-wise Performance */}
      <View>
        <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4 font-bengali">
          কঠিনতা অনুযায়ী পারফরম্যান্স
        </Text>
        <View className="flex-row gap-3">
          {Object.entries(analysis.difficultyWiseStats).map(([difficulty, stats]) => (
            <View
              key={difficulty}
              className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-900/40 rounded-2xl p-4.5 items-center"
            >
              <View className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold mb-3.5 ${getDifficultyColor(difficulty)}`}>
                <Text className="font-bengali text-[9px] uppercase tracking-wider font-bold">
                  {getDifficultyText(difficulty)}
                </Text>
              </View>
              <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                {stats.correct}/{stats.total}
              </Text>
              <Text className={`text-[11px] font-black ${getScoreColor(stats.accuracy)}`}>
                {stats.accuracy.toFixed(1)}%
              </Text>
            </View>
          ))}
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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
      case 'hard':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
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

  const getTypeText = () => {
    switch (type) {
      case 'correct': return 'সঠিক';
      case 'wrong': return 'ভুল';
      case 'unanswered': return 'উত্তরহীন';
    }
  };

  if (questions.length === 0) {
    return (
      <View className="py-12 items-center justify-center">
        <View className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-full items-center justify-center mb-3">
          <Icon
            name={type === 'correct' ? 'checkmark-circle-outline' : type === 'wrong' ? 'close-circle-outline' : 'help-circle-outline'}
            size={30}
            color="#cbd5e1"
          />
        </View>
        <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-bengali text-center">
          কোন {getTypeText()} প্রশ্ন পাওয়া যায়নি
        </Text>
        <Text className="text-slate-400 dark:text-slate-500 text-xs font-bengali text-center px-6 leading-5">
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
    <View className="gap-4">
      <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 mb-2 font-bengali uppercase tracking-wider pl-1">
        📝 {getTypeText()} প্রশ্নসমূহ ({questions.length})
      </Text>

      {questions.map((q, index) => {
        const isExpanded = expandedQuestions.includes(q.questionId);
        const correctOption = q.options.find(opt => opt.is_correct);

        return (
          <View
            key={`${q.sessionId}-${q.questionId}`}
            className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={() => onToggleQuestion(q.questionId)}
              className="p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                  <View className="flex-row flex-wrap items-center gap-2 mb-2">
                    <Text className="text-[10px] font-black text-slate-500 dark:text-slate-500 font-bengali uppercase">
                      প্রশ্ন {index + 1}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getDifficultyColor(q.difficulty)}`}>
                      <Text className="font-bengali text-[9px]">
                        {getDifficultyText(q.difficulty)}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary-50 dark:bg-primary-950/30">
                      <Text className="text-primary-600 dark:text-primary-400 font-bengali text-[9px]">
                        {q.subject}
                      </Text>
                    </View>
                  </View>
                  {q.questionText.includes('\\(') || q.questionText.includes('\\)') || q.questionText.includes('\\[') || q.questionText.includes('\\]') || q.questionText.includes('$') ? (
                    <MathDisplay content={q.questionText} />
                  ) : (
                    <Text className="font-extrabold text-slate-800 dark:text-slate-200 font-bengali leading-5 text-sm">
                      {q.questionText}
                    </Text>
                  )}
                </View>
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#94a3b8"
                  style={{ marginTop: 2 }}
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/60">
                {/* Options List */}
                <View className="mb-4 gap-2">
                  <Text className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 font-bengali mb-1.5 uppercase">
                    বিকল্পসমূহ:
                  </Text>
                  {q.options.map(option => {
                    const isCorrectOption = option.is_correct;
                    const isUserSelected = q.userAnswer === option.id;

                    let optionBorder = 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40';
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
                              সদুপায় উত্তর
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
                {q.explanation ? (
                  <View className="mt-2.5 p-4 bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100/20 rounded-2xl">
                    <View className="flex-row items-center mb-1.5">
                      <Icon name="bulb-outline" size={14} color="#7c3aed" />
                      <Text className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 font-bengali uppercase ml-1">
                        ব্যাখ্যা:
                      </Text>
                    </View>
                    {q.explanation.includes('\\(') || q.explanation.includes('\\)') || q.explanation.includes('\\[') || q.explanation.includes('\\]') || q.explanation.includes('$') ? (
                      <MathDisplay content={q.explanation} />
                    ) : (
                      <Text className="text-xs font-bengali leading-5 text-slate-700 dark:text-slate-300">
                        {q.explanation}
                      </Text>
                    )}
                  </View>
                ) : null}

                {/* Session Details Info */}
                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[9px] text-slate-400">
                  <Text className="font-bengali">সেশন: #{q.sessionId}</Text>
                  {q.timeTaken && <Text className="font-bengali">সময়: {q.timeTaken}</Text>}
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
