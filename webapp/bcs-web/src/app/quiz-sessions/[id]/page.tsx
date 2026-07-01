// app/quiz-sessions/[id]/attempt/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  explanation: string;
  marks: number;
  options: Option[];
}

interface Option {
  id: number;
  option_text: string;
  order: number;
}

interface QuizSessionData {
  session_id: number;
  session_title: string;
  quiz_title: string;
  total_questions: number;
  time_limit: number;
  questions: Question[];
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<QuizSessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: number[]}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  useEffect(() => {
    if (sessionData?.time_limit) {
      setTimeLeft(sessionData.time_limit * 60); // Convert minutes to seconds
    }
  }, [sessionData]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/quiz-sessions/${sessionId}/questions/`);
      setSessionData(data);
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      alert(error.response?.data?.error || 'প্রশ্ন লোড করতে সমস্যা হয়েছে।');
      router.push('/quiz-sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionId: number) => {
    const currentQuestionId = sessionData?.questions[currentQuestion]?.id;
    if (!currentQuestionId) return;

    setAnswers(prev => {
      const currentAnswers = prev[currentQuestionId] || [];
      
      // For single choice, replace the array with new selection
      // For multiple choice, toggle the selection
      const questionType = sessionData?.questions[currentQuestion]?.question_type;
      
      if (questionType === 'mcq') {
        // Single choice - replace previous selection
        return { ...prev, [currentQuestionId]: [optionId] };
      } else {
        // Multiple choice - toggle selection
        const isSelected = currentAnswers.includes(optionId);
        if (isSelected) {
          return { ...prev, [currentQuestionId]: currentAnswers.filter(id => id !== optionId) };
        } else {
          return { ...prev, [currentQuestionId]: [...currentAnswers, optionId] };
        }
      }
    });
  };

  const handleNextQuestion = () => {
    if (sessionData && currentQuestion < sessionData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitAnswer = async () => {
    const currentQuestionId = sessionData?.questions[currentQuestion]?.id;
    if (!currentQuestionId || !answers[currentQuestionId]) return;

    try {
      await apiClient.post(`/quiz-sessions/${sessionId}/submit-answer/`, {
        question_id: currentQuestionId,
        selected_options: answers[currentQuestionId]
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleCompleteSession = async () => {
    try {
      setSubmitting(true);
      
      // Submit all answers first
      for (const [questionId, selectedOptions] of Object.entries(answers)) {
        await apiClient.post(`/quiz-sessions/${sessionId}/submit-answer/`, {
          question_id: parseInt(questionId),
          selected_options: selectedOptions
        });
      }

      // Complete the session
      await apiClient.post(`/quiz-sessions/${sessionId}/complete/`, {
        time_taken: (sessionData?.time_limit || 0) * 60 - timeLeft
      });

      alert('কুইজ সেশন সম্পন্ন হয়েছে!');
      router.push('/quiz-sessions');
    } catch (error: any) {
      console.error('Failed to complete session:', error);
      alert(error.response?.data?.error || 'সেশন সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('সময় শেষ! আপনার উত্তরগুলি স্বয়ংক্রিয়ভাবে জমা দেওয়া হচ্ছে।');
    handleCompleteSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bengali">প্রশ্ন লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-bengali">সেশন খুঁজে পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  const question = sessionData.questions[currentQuestion];
  const currentQuestionId = question?.id;
  const selectedOptions = answers[currentQuestionId] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-bengali">
                {sessionData.session_title}
              </h1>
              <p className="text-gray-600 font-bengali">{sessionData.quiz_title}</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-red-600">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 font-bengali">সময় বাকি</div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex justify-between items-center text-sm text-gray-600 font-bengali">
            <div>
              প্রশ্ন {currentQuestion + 1} / {sessionData.questions.length}
            </div>
            <div>
              উত্তর দেওয়া হয়েছে: {Object.keys(answers).length} / {sessionData.questions.length}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900 font-bengali">
                প্রশ্ন {currentQuestion + 1}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              } font-bengali`}>
                {question.difficulty === 'easy' ? 'সহজ' : 
                 question.difficulty === 'medium' ? 'মধ্যম' : 'কঠিন'}
              </span>
            </div>

            <p className="text-gray-800 text-lg leading-relaxed font-bengali">
              {question.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOptions.includes(option.id)
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    selectedOptions.includes(option.id)
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedOptions.includes(option.id) && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-800 font-bengali">
                    {option.option_text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
          >
            পূর্ববর্তী
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOptions.length}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bengali"
            >
              উত্তর সংরক্ষণ
            </button>

            {currentQuestion === sessionData.questions.length - 1 ? (
              <button
                onClick={handleCompleteSession}
                disabled={submitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bengali"
              >
                {submitting ? 'জমা দেওয়া হচ্ছে...' : 'কুইজ শেষ করুন'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bengali"
              >
                পরবর্তী
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 font-bengali">প্রশ্ন নেভিগেশন</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {sessionData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg border-2 font-medium ${
                  currentQuestion === index
                    ? 'border-red-500 bg-red-500 text-white'
                    : answers[sessionData.questions[index].id]
                    ? 'border-green-500 bg-green-100 text-green-800'
                    : 'border-gray-300 text-gray-700'
                } font-bengali`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}