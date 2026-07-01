// src/screens/quizzes/QuizSessionScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';
import QuizService from '../../services/quizService';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { Question } from '../../types';

type QuizSessionScreenProps = NativeStackNavigationProp<MainStackParamList>;

const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const CHOICE_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];

export const QuizSessionScreen = () => {
  const navigation = useNavigation<QuizSessionScreenProps>();
  const route = useRoute();
  const { isDark } = useAppTheme();
  
  const { attemptId, quizId } = route.params as { attemptId: number; quizId: number };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingAnswers, setSubmittingAnswers] = useState<Record<number, boolean>>({});
  const [questionLayouts, setQuestionLayouts] = useState<Record<number, number>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizDetailsRef = useRef<any>(null);

  // Fetch quiz details & questions
  useEffect(() => {
    const initQuiz = async () => {
      try {
        setIsLoading(true);
        const details = await QuizService.getQuizById(quizId);
        quizDetailsRef.current = details;
        
        if (details.time_limit) {
          setTimeRemaining(details.time_limit * 60);
        }

        const data = await QuizService.getQuizQuestions(quizId);
        setQuestions(data);
      } catch (err) {
        console.error('Failed to initialize quiz session:', err);
        Alert.alert('ত্রুটি', 'কুইজ তথ্য লোড করতে সমস্যা হয়েছে');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();
  }, [quizId]);

  // Handle countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) {
        handleAutoSubmit();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining]);

  const handleAutoSubmit = useCallback(async () => {
    Alert.alert('সময় শেষ!', 'আপনার নির্ধারিত সময় শেষ হয়েছে। কুইজটি জমা দেওয়া হচ্ছে।', [
      { text: 'ঠিক আছে', onPress: () => submitQuizAttempt() }
    ]);
  }, [attemptId]);

  const submitQuizAttempt = async () => {
    try {
      setIsLoading(true);
      await QuizService.completeAttempt(attemptId);
      navigation.replace('QuizResults', { attemptId, quizId });
    } catch (err) {
      console.error('Failed to complete quiz:', err);
      Alert.alert('ত্রুটি', 'কুইজ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  const handleOptionSelect = async (questionId: number, optionId: number) => {
    if (submittingAnswers[questionId]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));

    setSubmittingAnswers(prev => ({ ...prev, [questionId]: true }));
    try {
      await QuizService.submitAnswer(attemptId, questionId, [optionId]);
    } catch (err) {
      console.error('Failed to record answer:', err);
    } finally {
      setSubmittingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const scrollToQuestion = (idx: number) => {
    setCurrentIdx(idx);
    const questionId = questions[idx]?.id;
    if (questionId !== undefined) {
      const y = questionLayouts[questionId];
      if (y !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: y - 10, animated: true });
      }
    }
  };

  const handleFinishConfirm = () => {
    Alert.alert('কুইজ শেষ করুন', 'আপনি কি নিশ্চিতভাবে এই কুইজটি শেষ করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', onPress: submitQuizAttempt }
    ]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading && questions.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center" style={{ paddingTop: SAFE_AREA_TOP }}>
        <StatusBar backgroundColor={isDark ? '#0f172a' : '#f8fafc'} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 font-bengali text-xs mt-3.5">
          কুইজ লোড হচ্ছে...
        </Text>
      </View>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isTimeLow = timeRemaining !== null && timeRemaining <= 60; // 1 minute warning

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: SAFE_AREA_TOP }}>
      <StatusBar backgroundColor={isDark ? '#0f172a' : '#f8fafc'} barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header View */}
      <View className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center shadow-xs">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Icon name="arrow-back" size={22} color={isDark ? "#cbd5e1" : "#475569"} />
        </TouchableOpacity>
        
        {timeRemaining !== null && (
          <View 
            className="flex-row items-center border px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: isTimeLow ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.08)',
              borderColor: isTimeLow ? 'rgba(239, 68, 68, 0.25)' : 'rgba(124, 58, 237, 0.2)',
            }}
          >
            <Icon name="time-outline" size={14} color={isTimeLow ? "#ef4444" : "#7c3aed"} />
            <Text 
              className="font-extrabold text-xs font-bengali ml-1.5"
              style={{
                color: isTimeLow ? "#ef4444" : "#7c3aed"
              }}
            >
              {formatTimer(timeRemaining)}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleFinishConfirm} 
          className="px-4 py-2.5 rounded-2xl border"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <Text 
            className="font-black text-xs font-bengali"
            style={{
              color: isDark ? '#cbd5e1' : '#475569'
            }}
          >
            শেষ করুন
          </Text>
        </TouchableOpacity>
      </View>

      {/* Question Index Progress Tracker Slider */}
      <View className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        >
          {questions.map((question, idx) => {
            const isCurrent = currentIdx === idx;
            const isAnswered = selectedAnswers[question.id] !== undefined;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => scrollToQuestion(idx)}
                className="w-9 h-9 rounded-full border items-center justify-center"
                style={{
                  backgroundColor: isCurrent 
                    ? (isDark ? '#8b5cf6' : '#7c3aed') 
                    : (isAnswered 
                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)') 
                        : (isDark ? '#0f172a' : '#f8fafc')),
                  borderColor: isCurrent 
                    ? (isDark ? '#8b5cf6' : '#7c3aed') 
                    : (isAnswered 
                        ? '#10b981' 
                        : (isDark ? '#1e293b' : '#cbd5e1')),
                }}
              >
                <Text 
                  className="text-xs font-black"
                  style={{
                    color: isCurrent
                      ? '#ffffff'
                      : (isAnswered
                          ? '#10b981'
                          : (isDark ? '#94a3b8' : '#64748b'))
                  }}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Horizontal Progress bar */}
      <View className="w-full h-1 bg-slate-100 dark:bg-slate-850">
        <View className="h-full bg-primary-600 dark:bg-primary-500" style={{ width: `${progressPercent}%` }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-5" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {questions.map((question, idx) => {
          const isFocused = currentIdx === idx;

          return (
            <View 
              key={question.id}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setQuestionLayouts(prev => ({
                  ...prev,
                  [question.id]: y
                }));
              }}
              className="bg-white dark:bg-slate-900 border rounded-3xl p-6 mb-5 shadow-xs"
              style={{
                borderColor: isFocused
                  ? (isDark ? '#8b5cf6' : '#7c3aed')
                  : (isDark ? '#cbd5e100' : '#e2e8f000'),
                borderWidth: 2
              }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bengali">
                  প্রশ্ন {idx + 1}
                </Text>
                {question.marks && (
                  <View 
                    className="px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    }}
                  >
                    <Text 
                      className="text-[9px] font-extrabold font-bengali"
                      style={{
                        color: isDark ? '#94a3b8' : '#64748b'
                      }}
                    >
                      +{question.marks} মার্কস
                    </Text>
                  </View>
                )}
              </View>

              {question.question_text.includes('\\(') || question.question_text.includes('\\)') || question.question_text.includes('\\[') || question.question_text.includes('\\]') || question.question_text.includes('$') ? (
                <MathDisplay content={question.question_text} />
              ) : (
                <Text className="text-base font-extrabold text-slate-850 dark:text-slate-100 font-bengali leading-6 mb-4">
                  {question.question_text}
                </Text>
              )}

              {/* Options List */}
              <View className="gap-3">
                {question.options.map((option, oIdx) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  const letter = CHOICE_LETTERS[oIdx] || '';
                  
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => {
                        handleOptionSelect(question.id, option.id);
                        setCurrentIdx(idx);
                      }}
                      className="p-4 rounded-2xl border flex-row items-center justify-between"
                      style={{
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff')
                          : (isDark ? '#0f172a' : '#ffffff'),
                        borderColor: isSelected
                          ? (isDark ? '#8b5cf6' : '#7c3aed')
                          : (isDark ? '#1e293b' : '#e2e8f0'),
                      }}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center flex-1 mr-4">
                        {/* Choice Letter Bubble */}
                        <View 
                          className="w-7 h-7 rounded-xl items-center justify-center mr-3 border"
                          style={{
                            backgroundColor: isSelected
                              ? (isDark ? '#8b5cf6' : '#7c3aed')
                              : (isDark ? '#1e293b' : '#f1f5f9'),
                            borderColor: isSelected
                              ? (isDark ? '#8b5cf6' : '#7c3aed')
                              : (isDark ? '#334155' : '#cbd5e1'),
                          }}
                        >
                          <Text 
                            className="text-xs font-black font-bengali"
                            style={{
                              color: isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#475569')
                            }}
                          >
                            {letter}
                          </Text>
                        </View>
                        
                        <Text 
                          className="font-bengali text-xs flex-1"
                          style={{
                            color: isSelected
                              ? (isDark ? '#ffffff' : '#4c1d95')
                              : (isDark ? '#cbd5e1' : '#334155'),
                            fontWeight: isSelected ? '800' : 'normal'
                          }}
                        >
                          {option.option_text}
                        </Text>
                      </View>
                      
                      {/* Radio Circle */}
                      <View 
                        className="w-5 h-5 rounded-full border items-center justify-center"
                        style={{
                          backgroundColor: isSelected
                            ? (isDark ? '#8b5cf6' : '#7c3aed')
                            : 'transparent',
                          borderColor: isSelected
                            ? (isDark ? '#8b5cf6' : '#7c3aed')
                            : (isDark ? '#475569' : '#cbd5e1'),
                        }}
                      >
                        {isSelected && <Icon name="checkmark" size={12} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Navigation Footer */}
      <View className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bengali">
            উত্তর দেওয়া হয়েছে
          </Text>
          <Text className="text-sm font-extrabold text-slate-850 dark:text-slate-100 font-bengali">
            {answeredCount} / {questions.length}টি প্রশ্ন
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleFinishConfirm}
          className="px-6 py-4.5 rounded-2xl flex-row items-center justify-center"
          style={{
            backgroundColor: '#10b981', // green-500
          }}
        >
          <Text className="text-white text-xs font-black font-bengali mr-1.5">কুইজ জমা দিন</Text>
          <Icon name="checkmark-done" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
