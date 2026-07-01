// src/screens/practice/PracticeResultsScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchSession, clearCurrentSession } from '../../store/slices/practiceSlice';
import { Ionicons as Icon } from '@expo/vector-icons';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';
import { PracticeResultsSkeleton } from '../../components/common/Skeleton';

type PracticeResultsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

type RouteParams = {
  sessionId: number;
};

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
  explanation?: string;
}

const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

export const PracticeResultsScreen = () => {
  const navigation = useNavigation<PracticeResultsScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { sessionId } = route.params as RouteParams;
  const { isDark } = useAppTheme();

  const { currentSession, isLoading } = useSelector((state: RootState) => state.practice);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getQuestionData = (sq: any): SessionQuestion => {
    if (sq && sq.question_details) return sq.question_details;
    return sq;
  };

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setError(null);
      setLoading(true);
      await dispatch(fetchSession(sessionId)).unwrap();
    } catch (err: any) {
      console.error('Failed to load session results:', err);
      setError('ফলাফল লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPractice = () => {
    dispatch(clearCurrentSession());
    navigation.navigate('Practice');
  };

  const handleGoHome = () => {
    dispatch(clearCurrentSession());
    navigation.navigate('TabNavigator', { screen: 'Home' });
  };

  const stats = useMemo(() => {
    if (!currentSession) {
      return { total: 0, correct: 0, incorrect: 0, accuracy: 0, score: 0, time: 0 };
    }
    const questions = currentSession.session_questions || [];
    const total = questions.length > 0 ? questions.length : (currentSession.total_questions || 0);
    const correct = questions.length > 0 
      ? questions.filter((sq: any) => sq.is_correct).length 
      : (currentSession.correct_answers || 0);
    const incorrect = questions.length > 0 
      ? questions.filter((sq: any) => !sq.is_correct && sq.user_answer !== null && sq.user_answer !== undefined).length 
      : (currentSession.wrong_answers || 0);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const score = total > 0 ? (correct / total) * 100 : (currentSession.score || 0);
    
    // Parse total time taken from session (supports HH:MM:SS, MM:SS, and raw seconds)
    let time = 0;
    if (currentSession.time_taken) {
      const parts = String(currentSession.time_taken).split(':');
      if (parts.length === 3) {
        const hrs = parseInt(parts[0], 10) || 0;
        const mins = parseInt(parts[1], 10) || 0;
        const secs = parseInt(parts[2], 10) || 0;
        time = hrs * 3600 + mins * 60 + secs;
      } else if (parts.length === 2) {
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        time = mins * 60 + secs;
      } else {
        const parsed = parseInt(currentSession.time_taken, 10);
        if (!isNaN(parsed)) time = parsed;
      }
    }

    return { total, correct, incorrect, accuracy, score, time };
  }, [currentSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}ম ${secs}সে` : `${secs}সে`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: SAFE_AREA_TOP }}>
        <PracticeResultsSkeleton />
      </View>
    );
  }

  if (error || !currentSession) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center px-8" style={{ paddingTop: SAFE_AREA_TOP }}>
        <Icon name="warning-outline" size={64} className="text-red-500 mb-4" />
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 font-bengali text-center">
          ফলাফল দেখাতে সমস্যা হয়েছে
        </Text>
        <Text className="text-slate-450 dark:text-slate-550 text-center text-sm mt-2 mb-6 font-bengali">
          {error || 'সেশন ডেটা পাওয়া যায়নি'}
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={loadSession}
            className="flex-1 bg-primary-600 dark:bg-primary-500 py-3.5 rounded-2xl shadow-sm"
          >
            <Text className="text-white font-bold font-bengali text-center text-sm">পুনরায় চেষ্টা করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNewPractice}
            className="flex-1 bg-slate-250 dark:bg-slate-800 py-3.5 rounded-2xl border border-slate-300/40 dark:border-slate-700/45"
          >
            <Text className="text-slate-700 dark:text-slate-300 font-bold font-bengali text-center text-sm">নতুন প্র্যাকটিস</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const optionLetters = ['ক', 'খ', 'গ', 'ঘ'];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Safe area spacer */}
      <View style={{ height: SAFE_AREA_TOP, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }} />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 40 }}
      >
        {/* Simple score summary card */}
        <View className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-850 shadow-sm mb-6 items-center">
          {/* Circular Score Badge */}
          <View className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-950/30 items-center justify-center border-4 border-primary-100 dark:border-primary-900/40 mb-3">
            <Text className="text-2xl font-black text-primary-600 dark:text-primary-400">
              {stats.score.toFixed(0)}%
            </Text>
          </View>

          <Text className="text-base font-black text-slate-850 dark:text-slate-100 font-bengali text-center">
            {stats.score >= 80 ? 'অসাধারণ পারফরম্যান্স! 🏆' : stats.score >= 60 ? 'ভালো প্রস্তুতি! 👍' : 'আরো অনুশীলন প্রয়োজন 📚'}
          </Text>

          {/* Quick Metrics list */}
          <View className="flex-row justify-around w-full border-t border-slate-100 dark:border-slate-800/60 mt-4.5 pt-4">
            <View className="items-center">
              <Text className="text-xs text-slate-400 font-bengali font-bold">মোট প্রশ্ন</Text>
              <Text className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{stats.total}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-secondary-500 font-bengali font-bold">সঠিক</Text>
              <Text className="text-base font-extrabold text-secondary-600 dark:text-secondary-400 mt-0.5">{stats.correct}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-red-500 font-bengali font-bold">ভুল</Text>
              <Text className="text-base font-extrabold text-red-500 mt-0.5">{stats.incorrect}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-slate-400 font-bengali font-bold">সময়</Text>
              <Text className="text-base font-extrabold text-slate-850 dark:text-slate-200 mt-0.5">{formatTime(stats.time)}</Text>
            </View>
          </View>
        </View>

        {/* Clean, fully-expanded list for question review */}
        <Text className="text-sm font-black text-slate-800 dark:text-slate-250 mb-3 px-1 font-bengali">
          উত্তরপত্র ও ব্যাখ্যা বিশ্লেষণ
        </Text>

        <View className="gap-5">
          {Array.isArray(currentSession.session_questions) &&
            currentSession.session_questions.map((sq: any, idx: number) => {
              const question = getQuestionData(sq);
              const isCorrectStatus = sq.is_correct;
              const hasAnswered = sq.user_answer !== null && sq.user_answer !== undefined;

              return (
                <View
                  key={sq.id}
                  className={`bg-white dark:bg-slate-900 rounded-[24px] p-5 border shadow-sm ${
                    hasAnswered
                      ? isCorrectStatus
                        ? 'border-secondary-500/30 dark:border-secondary-600/30'
                        : 'border-red-500/30'
                      : 'border-slate-100 dark:border-slate-850'
                  }`}
                >
                  {/* Card Header row */}
                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-50 dark:border-slate-800/40">
                    <View className="flex-row items-center gap-1.5">
                      <Icon 
                        name={isCorrectStatus ? "checkmark-circle" : hasAnswered ? "close-circle" : "ellipse-outline"} 
                        size={16} 
                        color={isCorrectStatus ? "#10b981" : hasAnswered ? "#ef4444" : "#94a3b8"} 
                      />
                      <Text className="text-slate-800 dark:text-slate-100 font-extrabold font-bengali text-xs">
                        প্রশ্ন {idx + 1}
                      </Text>
                    </View>
                    
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-bengali">
                      {question.subject_name}
                    </Text>
                  </View>

                  {/* Question Text (LaTeX compatible) */}
                  <View className="mb-4">
                    <MathDisplay
                      content={question.question_text}
                      className="text-sm font-extrabold text-slate-850 dark:text-slate-100 font-bengali leading-6"
                    />
                  </View>

                  {/* Options Review list */}
                  <View className="gap-2.5">
                    {question.options?.map((option: any, optIdx: number) => {
                      const isOptionSelected = sq.user_answer === option.id;
                      const isOptionCorrect = option.is_correct;

                      let optionBorderColor = 'border-slate-100 dark:border-slate-850';
                      let optionBgColor = 'bg-slate-50/20 dark:bg-slate-950/20';
                      let optionTextColor = 'text-slate-700 dark:text-slate-350';
                      let prefixBg = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                      let prefixText = 'text-slate-500 dark:text-slate-400';

                      if (isOptionCorrect) {
                        optionBorderColor = 'border-secondary-500';
                        optionBgColor = 'bg-secondary-50/10 dark:bg-secondary-950/10';
                        optionTextColor = 'text-secondary-600 dark:text-secondary-400 font-bold';
                        prefixBg = 'bg-secondary-500 border-secondary-500';
                        prefixText = 'text-white';
                      } else if (isOptionSelected) {
                        optionBorderColor = 'border-red-500';
                        optionBgColor = 'bg-red-50/10 dark:bg-red-950/10';
                        optionTextColor = 'text-red-500 font-bold';
                        prefixBg = 'bg-red-500 border-red-500';
                        prefixText = 'text-white';
                      }

                      return (
                        <View
                          key={option.id}
                          className={`p-3 rounded-xl border flex-row items-center justify-between ${optionBorderColor} ${optionBgColor}`}
                        >
                          <View className="flex-row items-center flex-1 pr-3">
                            {/* Option bubble prefix */}
                            <View className={`w-8 h-8 rounded-full border items-center justify-center mr-3 ${prefixBg}`}>
                              <Text className={`font-black text-xs ${prefixText}`}>
                                {optionLetters[optIdx]}
                              </Text>
                            </View>

                            {/* Option choice content (LaTeX compatible) */}
                            <MathDisplay
                              content={option.option_text}
                              className={`flex-1 text-xs font-bengali leading-4.5 ${optionTextColor}`}
                            />
                          </View>

                          {/* checked/close check indicators */}
                          {isOptionCorrect ? (
                            <Icon name="checkmark-sharp" size={14} color="#10b981" />
                          ) : isOptionSelected ? (
                            <Icon name="close-sharp" size={14} color="#ef4444" />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  {/* Explanation box (shown directly below the options) */}
                  {question.explanation && (
                    <View className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/60">
                      <Text className="text-[10px] font-black text-primary-600 dark:text-primary-400 font-bengali mb-1.5">
                        💡 সঠিক ব্যাখ্যা:
                      </Text>
                      <MathDisplay
                        content={question.explanation}
                        className="text-xs text-slate-500 dark:text-slate-400 font-bengali leading-5"
                      />
                    </View>
                  )}
                </View>
              );
            })}
        </View>

        {/* Cohesive Action row buttons */}
        <View className="gap-3.5 mt-8">
          <TouchableOpacity
            onPress={handleNewPractice}
            className="bg-primary-600 dark:bg-primary-500 py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow"
          >
            <Icon name="refresh-sharp" size={18} color="white" />
            <Text className="text-white text-center font-extrabold text-sm font-bengali">
              নতুন সেশন শুরু করুন
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoHome}
            className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <Icon name="home-outline" size={18} className="text-slate-650 dark:text-slate-400" />
            <Text className="text-slate-700 dark:text-slate-300 text-center font-extrabold text-sm font-bengali">
              হোমে ফিরে যান
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default PracticeResultsScreen;