// src/screens/quizzes/QuizResultsScreen.tsx
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
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';
import QuizService from '../../services/quizService';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { QuizAttempt } from '../../types';

type QuizResultsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export const QuizResultsScreen = () => {
  const navigation = useNavigation<QuizResultsScreenNavigationProp>();
  const route = useRoute();
  const { isDark } = useAppTheme();
  
  const { attemptId, quizId } = route.params as { attemptId: number; quizId: number };

  const [attemptDetails, setAttemptDetails] = useState<QuizAttempt | null>(null);
  const [questionsData, setQuestionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await QuizService.getAttemptById(attemptId);
        setAttemptDetails(details);

        const data = await QuizService.getAttemptQuestions(attemptId);
        setQuestionsData(data.questions || []);
      } catch (err) {
        console.error('Failed to load quiz attempt results:', err);
        setError('ফলাফল লোড করতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [attemptId]);

  const stats = useMemo(() => {
    if (!attemptDetails || questionsData.length === 0) {
      return { total: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 };
    }

    const total = questionsData.length;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questionsData.forEach(q => {
      const ua = q.user_answer;
      if (!ua || ua.selected_options.length === 0) {
        unanswered++;
      } else if (ua.is_correct) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, incorrect, unanswered, accuracy };
  }, [attemptDetails, questionsData]);

  const formatTime = (seconds: number) => {
    if (!seconds) return '০সে';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}ম ${secs}সে` : `${secs}সে`;
  };

  const handleGoBack = () => {
    navigation.navigate('TabNavigator', { screen: 'Home' });
  };

  const handleAllQuizzes = () => {
    navigation.navigate('Quizzes');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center" style={{ paddingTop: SAFE_AREA_TOP }}>
        <StatusBar backgroundColor={isDark ? '#0f172a' : '#f8fafc'} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 font-bengali text-xs mt-3.5">
          ফলাফল প্রস্তুত হচ্ছে...
        </Text>
      </View>
    );
  }

  if (error || !attemptDetails) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center px-8" style={{ paddingTop: SAFE_AREA_TOP }}>
        <Icon name="alert-circle-outline" size={64} className="text-red-500 mb-4" />
        <Text className="text-base font-bold text-slate-800 dark:text-slate-100 font-bengali text-center mb-6">
          {error || 'ফলাফল লোড করতে সমস্যা হয়েছে'}
        </Text>
        <TouchableOpacity
          onPress={handleGoBack}
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-extrabold font-bengali text-xs">হোমে ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: SAFE_AREA_TOP }}>
      <StatusBar backgroundColor={isDark ? '#0f172a' : '#f8fafc'} barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center shadow-xs">
        <TouchableOpacity onPress={handleAllQuizzes} className="p-1">
          <Icon name="arrow-back" size={22} className="text-slate-650 dark:text-slate-300" />
        </TouchableOpacity>
        <Text className="text-base font-black text-slate-850 dark:text-slate-150 font-bengali">
          কুইজ ফলাফল
        </Text>
        <TouchableOpacity onPress={handleGoBack} className="p-1">
          <Icon name="home-outline" size={20} className="text-slate-655 dark:text-slate-300" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Performance Cards Summary */}
        <View className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-5 mb-6 shadow-xs">
          <Text className="text-sm font-black text-slate-850 dark:text-slate-100 font-bengali mb-4 text-center">
            {attemptDetails.quiz_title}
          </Text>

          <View className="flex-row justify-between mb-4">
            <View className="items-center flex-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-900/30 mr-2">
              <Text className="text-lg font-black text-primary-600 dark:text-primary-400">
                {attemptDetails.score} / {attemptDetails.total_marks}
              </Text>
              <Text className="text-[9px] text-slate-405 dark:text-slate-500 font-bengali mt-1">প্রাপ্ত নম্বর</Text>
            </View>
            <View className="items-center flex-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-900/30 mr-2">
              <Text className="text-lg font-black text-emerald-500">
                {stats.accuracy}%
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-1">সঠিকতার হার</Text>
            </View>
            <View className="items-center flex-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-900/30">
              <Text className="text-lg font-black text-amber-500">
                {formatTime(attemptDetails.time_taken)}
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-1">ব্যয়িত সময়</Text>
            </View>
          </View>

          <View className="flex-row justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <View className="items-center flex-1">
              <Text className="text-sm font-extrabold text-slate-700 dark:text-slate-300">{stats.total}টি</Text>
              <Text className="text-[8px] text-slate-400 font-bengali mt-0.5">মোট প্রশ্ন</Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-800" />
            <View className="items-center flex-1">
              <Text className="text-sm font-extrabold text-emerald-500">{stats.correct}টি</Text>
              <Text className="text-[8px] text-slate-400 font-bengali mt-0.5">সঠিক উত্তর</Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-800" />
            <View className="items-center flex-1">
              <Text className="text-sm font-extrabold text-rose-500">{stats.incorrect}টি</Text>
              <Text className="text-[8px] text-slate-400 font-bengali mt-0.5">ভুল উত্তর</Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-800" />
            <View className="items-center flex-1">
              <Text className="text-sm font-extrabold text-slate-400">{stats.unanswered}টি</Text>
              <Text className="text-[8px] text-slate-400 font-bengali mt-0.5">বাকি ছিল</Text>
            </View>
          </View>
        </View>

        {/* Detailed Question Review */}
        <Text className="text-xs font-black text-slate-400 dark:text-slate-500 mb-4 font-bengali uppercase pl-1">
          প্রশ্নের বিবরণ ও সমাধান:
        </Text>

        <View className="gap-4">
          {questionsData.map((q, idx) => {
            const ua = q.user_answer;
            const isCorrect = ua?.is_correct;
            const isAnswered = ua && ua.selected_options.length > 0;
            const correctOption = q.options.find((opt: any) => opt.is_correct);

            let cardBorder = 'border-slate-100 dark:border-slate-800 border-l-4 border-l-slate-400';
            let iconName: React.ComponentProps<typeof Icon>['name'] = 'help-circle-outline';
            let iconColor = '#94a3b8';

            if (isAnswered) {
              if (isCorrect) {
                cardBorder = 'border-slate-100 dark:border-slate-800 border-l-4 border-l-emerald-500';
                iconName = 'checkmark-circle';
                iconColor = '#10b981';
              } else {
                cardBorder = 'border-slate-100 dark:border-slate-800 border-l-4 border-l-rose-500';
                iconName = 'close-circle';
                iconColor = '#f43f5e';
              }
            }

            return (
              <View key={q.id} className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs ${cardBorder}`}>
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[9px] font-black text-slate-400 font-bengali">#{idx + 1}</Text>
                      {isAnswered && (
                        <View className={`px-2 py-0.5 rounded-full ${
                          isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'
                        }`}>
                          <Text className={`text-[8px] font-bold font-bengali ${
                            isCorrect ? 'text-emerald-650' : 'text-rose-650'
                          }`}>
                            {isCorrect ? 'সঠিক' : 'ভুল'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Icon name={iconName} size={16} color={iconColor} />
                  </View>

                  {/* Question Text */}
                  {q.question_text.includes('\\(') || q.question_text.includes('\\)') || q.question_text.includes('\\[') || q.question_text.includes('\\]') || q.question_text.includes('$') ? (
                    <MathDisplay content={q.question_text} />
                  ) : (
                    <Text className="font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-5 text-sm mb-4">
                      {q.question_text}
                    </Text>
                  )}

                  {/* Options List */}
                  <View className="gap-2 mb-3">
                    {q.options.map((opt: any) => {
                      const isCorrectOpt = opt.is_correct;
                      const isUserSel = ua?.selected_options.includes(opt.id);

                      let optBorder = 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900';
                      let optText = 'text-slate-700 dark:text-slate-300';
                      let checkIcon = null;

                      if (isCorrectOpt) {
                        optBorder = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                        optText = 'text-emerald-800 dark:text-emerald-300 font-extrabold';
                        checkIcon = <Icon name="checkmark-circle" size={16} color="#10b981" className="mr-2" />;
                      } else if (isUserSel) {
                        optBorder = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20';
                        optText = 'text-rose-800 dark:text-rose-300 font-extrabold';
                        checkIcon = <Icon name="close-circle" size={16} color="#f43f5e" className="mr-2" />;
                      }

                      return (
                        <View key={opt.id} className={`p-3 rounded-xl border flex-row items-center justify-between ${optBorder}`}>
                          <View className="flex-row items-center flex-1 mr-2">
                            {checkIcon}
                            <Text className={`font-bengali text-xs flex-1 ${optText}`}>{opt.option_text}</Text>
                          </View>
                          {isCorrectOpt && (
                            <View className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-full">
                              <Text className="text-emerald-850 dark:text-emerald-450 text-[7px] font-black font-bengali">সঠিক</Text>
                            </View>
                          )}
                          {isUserSel && !isCorrectOpt && (
                            <View className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 rounded-full">
                              <Text className="text-rose-850 dark:text-rose-455 text-[7px] font-black font-bengali">আপনার পছন্দ</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Explanation */}
                  {q.explanation ? (
                    <View className="p-3 bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100/10 rounded-2xl mt-2">
                      <View className="flex-row items-center mb-1">
                        <Icon name="bulb-outline" size={12} color="#7c3aed" />
                        <Text className="text-[9px] font-extrabold text-primary-600 dark:text-primary-400 font-bengali ml-1">সমাধান:</Text>
                      </View>
                      {q.explanation.includes('\\(') || q.explanation.includes('\\)') || q.explanation.includes('\\[') || q.explanation.includes('\\]') || q.explanation.includes('$') ? (
                        <MathDisplay content={q.explanation} />
                      ) : (
                        <Text className="text-xs font-bengali leading-5 text-slate-700 dark:text-slate-350">{q.explanation}</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer controls */}
      <View className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={handleAllQuizzes}
          className="flex-1 bg-primary-600 dark:bg-primary-500 py-4 rounded-2xl shadow-xs"
        >
          <Text className="text-white text-center font-extrabold text-xs font-bengali">সব কুইজ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoBack}
          className="flex-1 bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 rounded-2xl"
        >
          <Text className="text-slate-700 dark:text-slate-300 text-center font-extrabold text-xs font-bengali">হোমে যান</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
