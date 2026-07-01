// src/screens/practice/PracticeSessionScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import {
  submitAnswer,
  completeSession,
  fetchSession,
  updateSessionQuestion,
  clearCurrentSession,
} from '../../store/slices/practiceSlice';
import { Ionicons as Icon } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';
import { PracticeSessionSkeleton } from '../../components/common/Skeleton';

const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

type PracticeSessionScreenProps = NativeStackNavigationProp<MainStackParamList>;

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
}

export const PracticeSessionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<PracticeSessionScreenProps>();
  const route = useRoute();
  const { sessionId } = route.params as { sessionId: number };
  const { isDark } = useAppTheme();

  const { currentSession, isLoading, error } = useSelector((state: RootState) => state.practice);

  const [timeTaken, setTimeTaken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Optimistic local answers state for instant UI updates (0ms latency!)
  const [localAnswers, setLocalAnswers] = useState<Record<number, number>>({});
  const [submittingQuestions, setSubmittingQuestions] = useState<Record<number, boolean>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSession(sessionId));
    }
  }, [sessionId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('ত্রুটি', error);
    }
  }, [error]);

  // Session-wide Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getQuestionData = (sq: any): SessionQuestion => {
    if (sq.question_details) return sq.question_details;
    return sq;
  };

  const handleOptionSelect = async (sq: any, optionId: number) => {
    const questionData = getQuestionData(sq);
    const isAlreadyAnswered = sq.user_answer !== null && sq.user_answer !== undefined || localAnswers[sq.id] !== undefined;

    if (!currentSession || isAlreadyAnswered || submittingQuestions[sq.id]) return;

    // 1. Instantly highlight selection in the local UI state (0ms latency!)
    setLocalAnswers((prev) => ({ ...prev, [sq.id]: optionId }));

    // 2. Submit API answer in background
    try {
      const response = await dispatch(
        submitAnswer({
          sessionId: currentSession.id,
          questionId: questionData.question || questionData.id,
          selectedOptionId: optionId,
          timeTaken: 0,
        })
      ).unwrap();

      // 3. Sync Redux store quietly
      dispatch(
        updateSessionQuestion({
          sessionId: currentSession.id,
          questionId: questionData.question || questionData.id,
          userAnswerId: optionId,
          isCorrect: response.is_correct,
        })
      );
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      // Rollback optimistic state on failure
      setLocalAnswers((prev) => {
        const updated = { ...prev };
        delete updated[sq.id];
        return updated;
      });
      Alert.alert('ত্রুটি', err.message || 'উত্তর জমা দিতে সমস্যা হয়েছে');
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;

    try {
      setSubmitting(true);
      await dispatch(
        completeSession({
          sessionId: currentSession.id,
          totalTimeTaken: timeTaken,
        })
      ).unwrap();

      navigation.replace('PracticeResults', { sessionId: currentSession.id });
    } catch (err: any) {
      console.error('Failed to complete session:', err);
      Alert.alert('ত্রুটি', err.message || 'সেশন সম্পন্ন করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}ম ${secs}সে` : `${secs}সে`;
  };

  if (isLoading && !currentSession) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: SAFE_AREA_TOP }}>
        <PracticeSessionSkeleton />
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center p-6" style={{ paddingTop: SAFE_AREA_TOP }}>
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm">
          <View className="bg-red-50 dark:bg-red-950/20 p-5 rounded-full mb-5">
            <Icon name="alert-circle" size={48} className="text-red-500" />
          </View>
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-bengali text-center">
            সেশন পাওয়া যায়নি
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-center mb-6 font-bengali leading-5 text-sm">
            সেশন লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary-600 dark:bg-primary-500 px-6 py-3.5 rounded-2xl flex-row items-center gap-2"
          >
            <Icon name="arrow-back" size={20} color="white" />
            <Text className="text-white font-bold font-bengali text-sm">ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const optionLetters = ['ক', 'খ', 'গ', 'ঘ'];
  
  // Combine local answers and redux answered state to count completed
  const completedCount = currentSession?.session_questions
    ? currentSession.session_questions.filter(
        (sq) => sq.user_answer !== null && sq.user_answer !== undefined || localAnswers[sq.id] !== undefined
      ).length
    : 0;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#0f172a" : "#7c3aed"} barStyle="light-content" />
      
      {/* Safe area spacer */}
      <View style={{ height: SAFE_AREA_TOP, backgroundColor: isDark ? '#0f172a' : '#7c3aed' }} />
      
      {/* Header */}
      <View className="bg-primary-600 dark:bg-slate-900 pt-5 pb-5 px-6 shadow-sm border-b border-slate-150 dark:border-slate-800/80">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'সেশন থেকে বের হন?',
                'আপনি কি এই প্র্যাকটিস সেশনটি বন্ধ করে দিতে চান?',
                [
                  { text: 'থাকুন', style: 'cancel' },
                  { text: 'বাহির হোন', style: 'destructive', onPress: () => {
                      dispatch(clearCurrentSession());
                      navigation.goBack();
                    } 
                  }
                ]
              );
            }}
            className="bg-white/10 dark:bg-slate-800 p-2.5 rounded-2xl border border-white/10 dark:border-slate-700/50"
          >
            <Icon name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <View className="bg-white/10 dark:bg-slate-800/60 rounded-2xl py-2 px-4 border border-white/5 dark:border-slate-700/30 flex-row justify-between items-center">
              <Text className="text-white text-xs font-black font-bengali">
                পদ্ধতি: সব প্রশ্ন একসাথে
              </Text>
              <View className="flex-row items-center bg-white/10 dark:bg-slate-750 px-2 py-0.5 rounded-lg">
                <Icon name="time-outline" size={12} color="white" />
                <Text className="text-white text-[10px] font-black font-bengali ml-1">
                  {formatTime(timeTaken)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Questions Scrollable List */}
      <ScrollView 
        className="flex-1 bg-slate-50 dark:bg-slate-950" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 140 }}
      >
        <View className="gap-5">
          {Array.isArray(currentSession.session_questions) &&
            currentSession.session_questions.map((sq: any, idx: number) => {
              const question = getQuestionData(sq);
              const isAnswered = sq.user_answer !== null && sq.user_answer !== undefined || localAnswers[sq.id] !== undefined;
              const selectedOptionId = localAnswers[sq.id] !== undefined ? localAnswers[sq.id] : sq.user_answer;

              return (
                <View
                  key={sq.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-850 shadow-sm mb-1"
                >
                  {/* Card Header Info */}
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-primary-600 dark:text-primary-400 font-extrabold text-xs">
                      প্রশ্ন {idx + 1}
                    </Text>
                    
                    <View className="bg-slate-50 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-200/30">
                      <Text className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                        {question.subject_name || 'অন্যান্য'}
                      </Text>
                    </View>
                  </View>

                  {/* Question Text (LaTeX compatible) */}
                  <View className="mb-4">
                    <MathDisplay
                      content={question.question_text}
                      className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-7"
                    />
                  </View>

                  {/* Options List */}
                  <View className="gap-2.5">
                    {question.options?.map((option: any, optIdx: number) => {
                      const isOptionSelected = selectedOptionId === option.id;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => handleOptionSelect(sq, option.id)}
                          className={`p-3.5 rounded-[16px] border flex-row items-center justify-between transition-all ${
                            isOptionSelected
                              ? 'border-primary-500 bg-primary-50/10 dark:bg-primary-950/10'
                              : 'border-slate-200/80 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/30'
                          } active:opacity-90`}
                          activeOpacity={0.85}
                        >
                          <View className="flex-row items-center flex-1 pr-2">
                            {/* Option bubble */}
                            <View className={`w-8 h-8 rounded-full border items-center justify-center mr-3 ${
                              isOptionSelected
                                ? 'border-primary-500 bg-primary-600 dark:bg-primary-500'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}>
                              <Text className={`font-extrabold text-xs ${
                                isOptionSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {optionLetters[optIdx]}
                              </Text>
                            </View>

                            {/* Option Text (LaTeX compatible) */}
                            <MathDisplay
                              content={option.option_text}
                              className={`flex-1 text-sm font-bengali leading-5 ${
                                isOptionSelected ? 'text-primary-750 dark:text-primary-300 font-bold' : 'text-slate-700 dark:text-slate-350'
                              }`}
                            />
                          </View>

                          {/* Selection circle indicator */}
                          <View className={`w-5 h-5 rounded-full border justify-center items-center ${
                            isOptionSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}>
                            {isOptionSelected && (
                              <Icon 
                                name="checkmark-sharp" 
                                size={12} 
                                color="#7c3aed" 
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Finish Exam Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-850/80 shadow-md flex-row justify-between items-center gap-4">
        <View className="flex-1 pr-2">
          <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali font-bold">
            ⏱️ মোট সময়: {formatTime(timeTaken)}
          </Text>
          <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali mt-0.5">
            {completedCount} / {currentSession.session_questions?.length || 0} উত্তর দেওয়া হয়েছে
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCompleteSession}
          disabled={submitting}
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3.5 rounded-2xl flex-row items-center gap-2 shadow"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name="checkmark-done-circle-outline" size={18} color="white" />
          )}
          <Text className="text-white font-extrabold font-bengali text-sm">সমাপ্ত করুন</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom safe area spacer */}
      <View style={{ height: SAFE_AREA_BOTTOM }} />
    </View>
  );
};

export default PracticeSessionScreen;