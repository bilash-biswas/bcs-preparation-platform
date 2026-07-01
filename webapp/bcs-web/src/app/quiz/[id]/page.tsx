// app/quiz/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Question {
  id: number;
  question_text: string;
  explanation: string;
  question_type: string;
  difficulty: string;
  marks: number;
  options: Option[];
}

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface QuizAttempt {
  id: number;
  quiz: {
    title: string;
    time_limit: number;
  };
  started_at: string;
  is_completed: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;
  
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      loadQuizData();
    }
  }, [attemptId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      const [attemptData, questionsData] = await Promise.all([
        apiClient.get(`/attempts/${attemptId}/`),
        apiClient.get(`/attempts/${attemptId}/questions/`)
      ]);

      setAttempt(attemptData);
      setQuestions(questionsData.results || questionsData);
      
      // Calculate time left
      const timeLimit = attemptData.quiz.time_limit * 60; // Convert to seconds
      const startedAt = new Date(attemptData.started_at);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      setTimeLeft(Math.max(0, timeLimit - elapsed));

    } catch (error) {
      console.error('Failed to load quiz data:', error);
      alert('কুইজ লোড করতে সমস্যা হয়েছে');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !attempt || attempt.is_completed) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  const handleTimeUp = async () => {
    await submitQuiz();
  };

  const handleOptionSelect = (optionId: number) => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData.question_type === 'mcq') {
      // For MCQ, toggle selection
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // For true/false or single choice, replace selection
      setSelectedOptions([optionId]);
    }
  };

  const submitAnswer = async () => {
    try {
      await apiClient.post(`/attempts/${attemptId}/submit_answer/`, {
        question_id: questions[currentQuestion].id,
        selected_options: selectedOptions
      });

      // Move to next question or submit quiz
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOptions([]);
      } else {
        await submitQuiz();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('উত্তর জমা দিতে সমস্যা হয়েছে');
    }
  };

  const submitQuiz = async () => {
    try {
      await apiClient.post(`/attempts/${attemptId}/complete_attempt/`);
      router.push(`/quiz/${attemptId}/results`);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('কুইজ জমা দিতে সমস্যা হয়েছে');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">কুইজ পাওয়া যায়নি</h2>
          <button
            onClick={() => router.push('/quizzes')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            কুইজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-bengali">{attempt.quiz.title}</h1>
            <div className={`text-lg font-semibold ${
              timeLeft < 300 ? 'text-red-600' : 'text-gray-700'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>প্রশ্ন: {currentQuestion + 1} / {questions.length}</span>
            <span>মার্কস: {currentQuestionData.marks}</span>
            <span>কঠিনতা: {currentQuestionData.difficulty}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 font-bengali">
            {currentQuestionData.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestionData.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOptions.includes(option.id)
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.option_text}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            পূর্ববর্তী
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={submitAnswer}
              disabled={selectedOptions.length === 0}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              পরবর্তী প্রশ্ন
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              কুইজ শেষ করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}