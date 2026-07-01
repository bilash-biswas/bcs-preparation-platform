// app/quizzes/attempt/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_text: string;
  explanation: string;
  question_type: string;
  difficulty: string;
  marks: number;
  negative_marks: number;
  options: Option[];
  user_answer?: number[];
  is_correct?: boolean;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  negative_marking: boolean;
  subjects: any[];
}

interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_details?: Quiz;
  score: number;
  total_marks: number;
  time_taken: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  user_answers: any[];
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;
  
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (isAuthenticated && attemptId) {
      loadQuizAttempt();
    }
  }, [isAuthenticated, attemptId]);

  useEffect(() => {
    if (attempt && !attempt.is_completed && quiz) {
      const quizDuration = quiz.duration_minutes || 30;
      const endTime = new Date(attempt.started_at).getTime() + (quizDuration * 60 * 1000);
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = Math.max(0, endTime - now);
        setTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining === 0 && !attempt.is_completed) {
          autoSubmitQuiz();
        }
      };
      
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [attempt, quiz]);

  const loadQuizAttempt = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading attempt:', attemptId);

      // Load attempt details
      const attemptData = await apiClient.get(`/attempts/${attemptId}/`);
      console.log('Attempt data:', attemptData);
      setAttempt(attemptData);

      // Extract quiz ID and load quiz details
      let quizId: number;
      let quizDetails: Quiz | null = null;

      if (typeof attemptData.quiz === 'object' && attemptData.quiz !== null) {
        quizId = attemptData.quiz.id;
        quizDetails = attemptData.quiz;
      } else {
        quizId = attemptData.quiz;
        try {
          quizDetails = await apiClient.get(`/quizzes/${quizId}/`);
          console.log('Quiz details:', quizDetails);
        } catch (error) {
          console.error('Failed to load quiz details:', error);
        }
      }

      setQuiz(quizDetails);

      // Load questions using practice session endpoint
      let questionsData: Question[] = [];
      
      if (quizDetails && quizDetails.subjects && quizDetails.subjects.length > 0) {
        const subjectIds = quizDetails.subjects.map((subject: any) => 
          typeof subject === 'object' ? subject.id : subject
        );
        
        console.log('Loading questions for subjects:', subjectIds);
        
        try {
          // Use practice session to get questions
          questionsData = await apiClient.post('/practice/create_session/', {
            subjects: subjectIds,
            difficulty: 'all',
            question_count: quizDetails.total_questions || 20
          });
          
          console.log('Questions loaded via practice session:', questionsData);
        } catch (error) {
          console.error('Failed to load questions via practice session:', error);
          // Fallback: Load questions by first subject
          if (subjectIds.length > 0) {
            try {
              const subjectQuestions = await apiClient.get(`/questions/?subject=${subjectIds[0]}`);
              questionsData = Array.isArray(subjectQuestions) 
                ? subjectQuestions 
                : subjectQuestions.results || [];
              console.log('Questions loaded via subject endpoint:', questionsData);
            } catch (subjectError) {
              console.error('Failed to load questions via subject endpoint:', subjectError);
            }
          }
        }
      } else {
        // Fallback: Load some random questions
        console.log('No subjects found, loading random questions');
        try {
          const allQuestions = await apiClient.get('/questions/');
          questionsData = Array.isArray(allQuestions) 
            ? allQuestions.slice(0, 10) 
            : allQuestions.results?.slice(0, 10) || [];
          console.log('Random questions loaded:', questionsData);
        } catch (error) {
          console.error('Failed to load random questions:', error);
        }
      }

      setQuestions(questionsData);

      // Load existing user answers if any - FIXED: Use attemptData.user_answers directly
      if (attemptData.user_answers && Array.isArray(attemptData.user_answers) && questionsData.length > 0) {
        const currentQuestionId = questionsData[0]?.id;
        if (currentQuestionId) {
          const currentQuestionAnswers = attemptData.user_answers.find(
            (answer: any) => answer.question === currentQuestionId
          );
          if (currentQuestionAnswers) {
            setSelectedOptions(currentQuestionAnswers.selected_options || []);
          }
        }
      }

    } catch (error: any) {
      console.error('Failed to load quiz attempt:', error);
      setError(error.message || 'কুইজ লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionId: number) => {
    if (attempt?.is_completed) return;

    if (currentQuestion?.question_type === 'multiple_choice') {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || selectedOptions.length === 0) return;

    try {
      setSubmitting(true);
      
      await apiClient.post(`/attempts/${attemptId}/submit_answer/`, {
        question_id: currentQuestion.id,
        selected_options: selectedOptions
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOptions([]);
        
        // Load next question's existing answer if any - FIXED: Check if attempt exists
        const nextQuestionId = questions[currentQuestionIndex + 1]?.id;
        if (nextQuestionId && attempt?.user_answers) {
          const nextQuestionAnswer = attempt.user_answers.find(
            (answer: any) => answer.question === nextQuestionId
          );
          if (nextQuestionAnswer) {
            setSelectedOptions(nextQuestionAnswer.selected_options || []);
          }
        }
      } else {
        await completeQuiz();
      }
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      setError(error.message || 'উত্তর জমা দিতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const completeQuiz = async () => {
    try {
      setSubmitting(true);
      
      const completedAttempt = await apiClient.post(`/attempts/${attemptId}/complete_attempt/`);
      setAttempt(completedAttempt);
      setQuizCompleted(true);
      
      setTimeout(() => {
        router.push(`/quizzes/results/${attemptId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('Failed to complete quiz:', error);
      setError(error.message || 'কুইজ সম্পন্ন করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmitQuiz = async () => {
    if (attempt && !attempt.is_completed) {
      try {
        await completeQuiz();
      } catch (error) {
        console.error('Failed to auto-submit quiz:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!questions.length) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  // Safe getters for quiz properties
  const getQuizTitle = () => quiz?.title || attempt?.quiz_details?.title || 'কুইজ';
  const getQuizDescription = () => quiz?.description || attempt?.quiz_details?.description || '';
  const getQuizDuration = () => quiz?.duration_minutes || attempt?.quiz_details?.duration_minutes || 30;
  const getTotalMarks = () => quiz?.total_marks || attempt?.quiz_details?.total_marks || 100;
  const getTotalQuestions = () => quiz?.total_questions || attempt?.quiz_details?.total_questions || questions.length;
  const hasNegativeMarking = () => quiz?.negative_marking || attempt?.quiz_details?.negative_marking || false;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">লগইন প্রয়োজন</h2>
          <p className="text-gray-600 mb-6 font-bengali">কুইজ দেখতে আপনাকে লগইন করতে হবে</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
          >
            লগইন করুন
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-bengali">কুইজ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">ত্রুটি হয়েছে</h2>
          <p className="text-gray-600 mb-6 font-bengali">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadQuizAttempt}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
            >
              আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => router.push('/quizzes')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold"
            >
              কুইজ পেজে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">কুইজ সম্পন্ন!</h2>
          <p className="text-gray-600 mb-6 font-bengali">আপনার কুইজ সফলভাবে সম্পন্ন হয়েছে। ফলাফল পেজে redirect করা হচ্ছে...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!attempt || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">কুইজ পাওয়া যায়নি</h2>
          <p className="text-gray-600 mb-6 font-bengali">দুঃখিত, এই কুইজটি পাওয়া যায়নি</p>
          <button
            onClick={() => router.push('/quizzes')}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
          >
            কুইজ পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-bengali">
                {getQuizTitle()}
              </h1>
              <p className="text-gray-600 font-bengali">
                {getQuizDescription()}
              </p>
            </div>
            
            {/* Timer */}
            <div className={`text-2xl font-bold ${
              timeLeft < 300 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2 font-bengali">
              <span>প্রশ্ন: {currentQuestionIndex + 1} / {questions.length}</span>
              <span>সময়: {getQuizDuration()} মিনিট</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Question Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-sm text-gray-500 font-bengali">
                প্রশ্ন {currentQuestionIndex + 1}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500 capitalize">
                {currentQuestion.difficulty}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {currentQuestion.marks} মার্কস
              </span>
            </div>
            
            {hasNegativeMarking() && (
              <span className="text-sm text-red-600 font-bengali">
                নেগেটিভ মার্কিং: -{currentQuestion.negative_marks}
              </span>
            )}
          </div>

          {/* Question Text */}
          <h2 className="text-lg font-semibold mb-6 font-bengali leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={attempt.is_completed}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOptions.includes(option.id)
                    ? 'border-red-600 bg-red-50 text-red-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-800'
                } ${attempt.is_completed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    selectedOptions.includes(option.id)
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-gray-400'
                  }`}>
                    {selectedOptions.includes(option.id) && '✓'}
                  </div>
                  <span className="font-bengali">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(prev => prev - 1);
                  setSelectedOptions([]);
                  
                  // Load previous question's existing answer if any - FIXED: Check if attempt exists
                  const prevQuestionId = questions[currentQuestionIndex - 1]?.id;
                  if (prevQuestionId && attempt?.user_answers) {
                    const prevQuestionAnswer = attempt.user_answers.find(
                      (answer: any) => answer.question === prevQuestionId
                    );
                    if (prevQuestionAnswer) {
                      setSelectedOptions(prevQuestionAnswer.selected_options || []);
                    }
                  }
                }
              }}
              disabled={currentQuestionIndex === 0 || submitting}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bengali"
            >
              পূর্ববর্তী
            </button>

            <div className="flex gap-3">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={submitAnswer}
                  disabled={selectedOptions.length === 0 || submitting}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bengali"
                >
                  {submitting ? 'সাবমিট হচ্ছে...' : 'পরবর্তী প্রশ্ন'}
                </button>
              ) : (
                <button
                  onClick={submitAnswer}
                  disabled={selectedOptions.length === 0 || submitting}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bengali"
                >
                  {submitting ? 'সম্পন্ন হচ্ছে...' : 'কুইজ শেষ করুন'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 font-bengali">কুইজ তথ্য</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-bengali">মোট প্রশ্ন:</span>
              <span className="ml-2 font-semibold">{getTotalQuestions()}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bengali">মোট মার্কস:</span>
              <span className="ml-2 font-semibold">{getTotalMarks()}</span>
            </div>
            <div>
              <span className="text-gray-500 font-bengali">সময়:</span>
              <span className="ml-2 font-semibold">{getQuizDuration()} মিনিট</span>
            </div>
            <div>
              <span className="text-gray-500 font-bengali">নেগেটিভ মার্কিং:</span>
              <span className="ml-2 font-semibold font-bengali">
                {hasNegativeMarking() ? 'হ্যাঁ' : 'না'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {timeLeft < 300 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-bengali text-center">
              ⚠️ সময় শেষ হতে {Math.ceil(timeLeft / 60)} মিনিট বাকি! দ্রুত আপনার উত্তরগুলি সম্পন্ন করুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}