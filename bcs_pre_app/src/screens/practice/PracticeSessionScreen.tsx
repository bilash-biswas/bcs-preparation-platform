// screens/practice/PracticeSessionScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { submitAnswer, completeSession, fetchSession } from '../../store/slices/practiceSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/AppNavigator';

// Safe area values for different devices
const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

type PracticeSessionScreenProps = NativeStackNavigationProp<MainStackParamList>;


const PracticeSessionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<PracticeSessionScreenProps>();
  const route = useRoute();
  const { sessionId } = route.params as { sessionId: number };

  const { currentSession, isLoading, error } = useSelector((state: RootState) => state.practice);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isAutoProceeding, setIsAutoProceeding] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Update progress animation
  useEffect(() => {
    const progress = ((currentQuestionIndex + 1) / (currentSession?.session_questions?.length || 1)) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex, currentSession]);

  // Animation when question changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    };
  }, [currentQuestionIndex]);

  // Timer for current question
  useEffect(() => {
    setTimeTaken(0);
    
    timerRef.current = setInterval(() => {
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex]);

  // Define currentQuestion before using it in useEffect
  const currentQuestion = currentSession?.session_questions?.[currentQuestionIndex];
  const isAnswered = currentQuestion?.user_answer !== null && currentQuestion?.user_answer !== undefined;

  // Auto-select if already answered
  useEffect(() => {
    if (currentQuestion?.user_answer !== null && currentQuestion?.user_answer !== undefined) {
      setSelectedOption(currentQuestion.user_answer);
    } else {
      setSelectedOption(null);
    }
    setShowExplanation(false);
  }, [currentQuestionIndex, currentQuestion]);

  const handleOptionSelect = async (optionId: number) => {
    if (!currentSession || !currentQuestion || isAnswered || submitting) return;

    if (!currentQuestion?.question) {
      Alert.alert('ত্রুটি', 'প্রশ্নের তথ্য পাওয়া যায়নি');
      return;
    }

    setSelectedOption(optionId);
    setSubmitting(true);
    setIsAutoProceeding(true);

    console.log('Submitting answer:', {
      sessionId: currentSession.id,
      questionId: currentQuestion.question,
      selectedOptionId: optionId,
      timeTaken: timeTaken
    });
    
    try {
      await dispatch(submitAnswer({
        sessionId: currentSession.id,
        questionId: currentQuestion.question,
        selectedOptionId: optionId,
        timeTaken: timeTaken
      })).unwrap();

      setTimeout(() => {
        if (currentQuestionIndex < (currentSession?.session_questions?.length || 0) - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          handleCompleteSession();
        }
        setIsAutoProceeding(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      Alert.alert('ত্রুটি', error.message || 'উত্তর জমা দিতে সমস্যা হয়েছে');
      setSelectedOption(null);
      setIsAutoProceeding(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (currentSession?.session_questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCompleteSession();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;

    try {
      setSubmitting(true);
      await dispatch(completeSession({
        sessionId: currentSession.id,
        totalTimeTaken: timeTaken
      })).unwrap();

      navigation.navigate("PracticeResults", { sessionId: currentSession.id });
      
    } catch (error: any) {
      console.error('Failed to complete session:', error);
      Alert.alert('ত্রুটি', error.message || 'সেশন সম্পূর্ণ করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < (currentSession?.session_questions?.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}ম ${secs}সে` : `${secs}স`;
  };

  const getQuestionStatus = (question: any) => {
    if (question.user_answer === null || question.user_answer === undefined) return 'unanswered';
    return question.is_correct ? 'correct' : 'incorrect';
  };

  if (isLoading && !currentSession) {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center items-center" style={{ paddingTop: SAFE_AREA_TOP }}>
        <View className="items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4 text-lg font-bengali">
            সেশন লোড হচ্ছে...
          </Text>
          <Text className="text-gray-400 mt-2 text-sm font-bengali">
            অনুগ্রহ করে অপেক্ষা করুন
          </Text>
        </View>
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center items-center p-6" style={{ paddingTop: SAFE_AREA_TOP }}>
        <View className="bg-white rounded-3xl p-8 items-center shadow-2xl mx-4">
          <View className="bg-rose-100 p-5 rounded-full mb-6">
            <Icon name="alert-circle" size={52} color="#dc2626" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-3 font-bengali text-center">
            সেশন পাওয়া যায়নি
          </Text>
          <Text className="text-gray-600 text-center mb-8 font-bengali leading-6 text-base">
            সেশন লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-rose-600 px-8 py-4 rounded-2xl shadow-2xl flex-row items-center"
          >
            <Icon name="arrow-back" size={22} color="white" />
            <Text className="text-white font-semibold text-lg ml-3 font-bengali">
              ফিরে যান
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stats = {
    total: currentSession.total_questions || 0,
    correct: currentSession.correct_answers || 0,
    incorrect: currentSession.wrong_answers || 0,
    unanswered: (currentSession.total_questions || 0) - (currentSession.completed_questions || 0),
    score: currentSession.score || 0,
  };

  const optionLetters = ['ক', 'খ', 'গ', 'ঘ'];

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#1e40af" barStyle="light-content" />
      
      {/* Safe area spacer */}
      <View style={{ height: SAFE_AREA_TOP, backgroundColor: '#1e40af' }} />
      
      {/* Enhanced Header */}
      <View className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 pt-5 pb-5 px-6 shadow-2xl">
        <View className="flex-row justify-between items-center mb-5">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-blue-500/80 p-3 rounded-2xl shadow-lg"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-5">
            <View className="bg-blue-500/20 rounded-2xl py-3 px-4">
              <Text className="text-white text-lg font-bold font-bengali text-center">
                প্রশ্ন {currentQuestionIndex + 1} / {currentSession.session_questions?.length || 0}
              </Text>
              <View className="flex-row justify-center items-center mt-2 space-x-6">
                <View className="flex-row items-center bg-blue-500/30 px-3 py-1 rounded-full">
                  <Icon name="time-outline" size={16} color="#bfdbfe" />
                  <Text className="text-blue-100 text-sm font-bengali ml-2">
                    {formatTime(timeTaken)}
                  </Text>
                </View>
                <View className="bg-blue-500/30 px-3 py-1 rounded-full">
                  <Text className="text-blue-100 text-sm font-bengali">
                    স্কোর: {stats.score.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Enhanced Progress Bar */}
        <View className="w-full bg-blue-500/40 rounded-2xl h-4 mb-4 shadow-inner">
          <Animated.View 
            className="bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 h-4 rounded-2xl shadow-lg"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Enhanced Stats */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center bg-green-500/20 px-4 py-2 rounded-2xl">
            <Icon name="checkmark-circle" size={18} color="#86efac" />
            <Text className="text-green-200 text-sm font-bengali ml-2 font-semibold">
              {stats.correct} সঠিক
            </Text>
          </View>
          <View className="flex-row items-center bg-rose-500/20 px-4 py-2 rounded-2xl">
            <Icon name="close-circle" size={18} color="#fca5a5" />
            <Text className="text-rose-200 text-sm font-bengali ml-2 font-semibold">
              {stats.incorrect} ভুল
            </Text>
          </View>
          <View className="flex-row items-center bg-blue-500/20 px-4 py-2 rounded-2xl">
            <Icon name="ellipse-outline" size={18} color="#93c5fd" />
            <Text className="text-blue-200 text-sm font-bengali ml-2 font-semibold">
              {stats.unanswered} বাকি
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Question Navigation */}
      <View className="bg-gradient-to-r from-gray-50 to-blue-50 py-4 px-5 border-b border-gray-200/50">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          <View className="flex-row space-x-3">
            {currentSession.session_questions?.map((sq, index) => {
              const status = getQuestionStatus(sq);
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <TouchableOpacity
                  key={sq.id}
                  onPress={() => jumpToQuestion(index)}
                  className={`
                    w-14 h-14 rounded-2xl justify-center items-center shadow-lg
                    ${isCurrent ? 'scale-110 ring-4 ring-blue-400' : ''}
                    ${
                      status === 'correct' ? 'bg-emerald-500 shadow-emerald-200' :
                      status === 'incorrect' ? 'bg-rose-500 shadow-rose-200' :
                      'bg-gray-300/80 shadow-gray-200'
                    }
                  `}
                >
                  <Text className={`
                    font-bold text-base
                    ${status !== 'unanswered' || isCurrent ? 'text-white' : 'text-gray-600'}
                  `}>
                    {index + 1}
                  </Text>
                  {status !== 'unanswered' && (
                    <Icon 
                      name={status === 'correct' ? "checkmark" : "close"} 
                      size={14} 
                      color="white" 
                      style={{ 
                        position: 'absolute', 
                        bottom: 4,
                        right: 4
                      }} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 + SAFE_AREA_BOTTOM }}
      >
        <View className="p-6">
          {/* Animated Question Card */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
            className="bg-white rounded-3xl p-7 mb-7 shadow-2xl border border-gray-100/80"
          >
            {/* Question Header */}
            <View className="flex-row items-start mb-6">
              <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 rounded-2xl shadow-lg mr-4">
                <Text className="text-white font-bold font-bengali text-sm">প্রশ্ন</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 font-bengali leading-8">
                  {currentQuestion?.question_text || 'প্রশ্ন লোড হচ্ছে...'}
                </Text>
              </View>
            </View>
            
            {/* Enhanced Options */}
            <View className="space-y-4">
              {currentQuestion?.options?.map((option, index) => {
                const isSelected = selectedOption === option.id;
                const isCorrect = option.is_correct;
                const isUserAnswered = currentQuestion?.user_answer === option.id;
                const showResult = isAnswered && (isSelected || isUserAnswered);
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleOptionSelect(option.id)}
                    disabled={isAnswered || submitting}
                    className={`
                      p-5 rounded-2xl border-3 shadow-lg
                      ${showResult
                        ? isCorrect
                          ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-emerald-200'
                          : 'border-rose-500 bg-gradient-to-r from-rose-50 to-red-50 shadow-rose-200'
                        : isSelected
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-blue-200'
                        : 'border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-gray-100'
                      }
                      ${(isAnswered || submitting) && !showResult ? 'opacity-70' : 'active:scale-95'}
                    `}
                  >
                    <View className="flex-row items-center">
                      <View className={`
                        w-12 h-12 rounded-xl border-3 flex items-center justify-center mr-5 shadow-md
                        ${showResult
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-500 shadow-emerald-300'
                            : 'border-rose-500 bg-rose-500 shadow-rose-300'
                          : isSelected
                          ? 'border-blue-500 bg-blue-500 shadow-blue-300'
                          : 'border-gray-300 bg-white shadow-gray-200'
                        }
                      `}>
                        <Text className={`
                          font-bold text-base
                          ${showResult || isSelected ? 'text-white' : 'text-gray-600'}
                        `}>
                          {optionLetters[index]}
                        </Text>
                      </View>
                      <Text className={`
                        flex-1 text-lg font-bengali leading-7
                        ${showResult
                          ? isCorrect ? 'text-emerald-800 font-semibold' : 'text-rose-800 font-semibold'
                          : 'text-gray-800'
                        }
                      `}>
                        {option.option_text}
                      </Text>
                      {showResult && (
                        <View className={`
                          p-2 rounded-full ml-3
                          ${isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}
                        `}>
                          <Icon 
                            name={isCorrect ? "checkmark-circle" : "close-circle"} 
                            size={26} 
                            color={isCorrect ? "#10b981" : "#ef4444"} 
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Enhanced Navigation Buttons */}
          <View className="flex-row justify-between items-center mb-8 space-x-4">
            <TouchableOpacity
              onPress={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || submitting}
              className={`
                flex-1 flex-row items-center justify-center px-6 py-5 rounded-2xl shadow-lg
                ${currentQuestionIndex === 0 || submitting 
                  ? 'bg-gray-400' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 active:scale-95'
                }
              `}
            >
              <Icon name="chevron-back" size={22} color="white" />
              <Text className="text-white font-semibold ml-3 font-bengali text-base">
                পূর্ববর্তী
              </Text>
            </TouchableOpacity>

            {isAnswered && (
              <TouchableOpacity
                onPress={() => setShowExplanation(!showExplanation)}
                disabled={submitting}
                className={`
                  flex-1 flex-row items-center justify-center px-6 py-5 rounded-2xl shadow-lg
                  ${submitting ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-blue-600 active:scale-95'}
                `}
              >
                <Icon name={showExplanation ? "eye-off-outline" : "eye-outline"} size={22} color="white" />
                <Text className="text-white font-semibold ml-3 font-bengali text-base">
                  {showExplanation ? 'লুকান' : 'ব্যাখ্যা'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNextQuestion}
              disabled={!isAnswered || submitting}
              className={`
                flex-1 flex-row items-center justify-center px-6 py-5 rounded-2xl shadow-lg
                ${!isAnswered || submitting 
                  ? 'bg-gray-400' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 active:scale-95'
                }
              `}
            >
              <Text className="text-white font-semibold mr-3 font-bengali text-base">
                {currentQuestionIndex < (currentSession.session_questions?.length || 0) - 1 ? 'পরবর্তী' : 'সমাপ্ত'}
              </Text>
              <Icon name="chevron-forward" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Enhanced Quick Stats */}
          <View className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl p-6 border-2 border-blue-200/50 shadow-xl">
            <View className="flex-row items-center justify-center mb-5">
              <Icon name="stats-chart" size={24} color="#3b82f6" />
              <Text className="text-blue-800 font-bold ml-3 font-bengali text-xl">
                বর্তমান স্ট্যাটাস
              </Text>
            </View>
            <View className="flex-row justify-between">
              {[
                { 
                  value: stats.correct, 
                  label: 'সঠিক', 
                  color: 'text-emerald-600', 
                  bg: 'bg-emerald-100', 
                  icon: 'checkmark-circle',
                  gradient: 'from-emerald-400 to-green-500'
                },
                { 
                  value: stats.incorrect, 
                  label: 'ভুল', 
                  color: 'text-rose-600', 
                  bg: 'bg-rose-100', 
                  icon: 'close-circle',
                  gradient: 'from-rose-400 to-red-500'
                },
                { 
                  value: stats.unanswered, 
                  label: 'বাকি', 
                  color: 'text-blue-600', 
                  bg: 'bg-blue-100', 
                  icon: 'ellipse-outline',
                  gradient: 'from-blue-400 to-indigo-500'
                },
                { 
                  value: `${stats.score}%`, 
                  label: 'স্কোর', 
                  color: 'text-purple-600', 
                  bg: 'bg-purple-100', 
                  icon: 'trophy',
                  gradient: 'from-purple-400 to-pink-500'
                },
              ].map((stat, index) => (
                <View key={index} className="items-center flex-1">
                  <View className={`bg-gradient-to-br ${stat.gradient} w-16 h-16 rounded-2xl items-center justify-center mb-3 shadow-lg`}>
                    <Icon name={stat.icon} size={26} color="white" />
                  </View>
                  <Text className={`${stat.color} font-bold text-xl mb-1`}>{stat.value}</Text>
                  <Text className={`${stat.color} text-xs font-bengali font-semibold`}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Loading Overlay */}
      {(submitting || isAutoProceeding) && (
        <View className="absolute inset-0 bg-black/60 justify-center items-center" style={{ paddingTop: SAFE_AREA_TOP, paddingBottom: SAFE_AREA_BOTTOM }}>
          <View className="bg-white rounded-3xl p-10 items-center shadow-2xl mx-8">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-800 mt-5 text-xl font-bengali font-semibold">
              {isAutoProceeding ? 'পরবর্তী প্রশ্নে যাচ্ছে...' : 'প্রসেসিং...'}
            </Text>
            {isAutoProceeding && (
              <Text className="text-gray-600 mt-3 text-base font-bengali text-center">
                স্বয়ংক্রিয়ভাবে পরবর্তী প্রশ্নে নিয়ে যাওয়া হচ্ছে
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Bottom safe area spacer */}
      <View style={{ height: SAFE_AREA_BOTTOM, backgroundColor: 'transparent' }} />
    </View>
  );
};

export default PracticeSessionScreen;