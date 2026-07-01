// app/quizzes/results/[id]/page.tsx - WITH QUESTION PAGINATION
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_title: string;
  user_name: string;
  quiz_details: any;
  score: string;
  total_marks: number;
  time_taken: number;
  started_at: string;
  completed_at: string;
  is_completed: boolean;
  user_answers: any[];
  performance_stats?: {
    total_answered: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy: number;
  };
}

interface UserAnswer {
  id: number;
  is_correct: boolean;
  question_details?: {
    id: number;
    question_text: string;
    options?: any[];
    correct_options?: number[];
    explanation?: string;
  };
  selected_options?: number[];
  selected_option_texts?: string[];
  marks_obtained: string;
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);
  const { isAuthenticated, user } = useAuthStore();

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "তারিখ অজানা";
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || seconds < 0) return "0 মিনিট 0 সেকেন্ড";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins} মিনিট ${secs} সেকেন্ড`;
  }, []);

  const getPerformanceMessage = useCallback((percentage: number) => {
    if (percentage >= 90) return "অসাধারণ! আপনি বিষয়টি খুব ভালোভাবে বুঝেছেন।";
    if (percentage >= 80) return "চমৎকার! আপনার দক্ষতা খুব ভালো।";
    if (percentage >= 70) return "ভালো! আপনি বিষয়টি ভালোভাবে বুঝেছেন।";
    if (percentage >= 60) return "সন্তোষজনক! আরও কিছুটা অনুশীলন প্রয়োজন।";
    if (percentage >= 50) return "গড়! আরও পড়াশোনা এবং অনুশীলন প্রয়োজন।";
    if (percentage >= 40) return "খুব বেশি ভালো নয়। আরও মনোযোগ দিন।";
    return "আপনাকে আরও বেশি পড়াশোনা এবং অনুশীলন করতে হবে।";
  }, []);

  const loadQuizResults = useCallback(async () => {
    if (!isAuthenticated || !attemptId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Loading quiz results for:", attemptId);

      const numericId = parseInt(attemptId);
      
      if (isNaN(numericId)) {
        throw new Error("অবৈব আইডি");
      }

      // First, load user's attempts to understand the context
      const userAttemptsList = await apiClient.get("/attempts/");
      const attempts = Array.isArray(userAttemptsList) 
        ? userAttemptsList 
        : userAttemptsList.results || [];
      
      setUserAttempts(attempts);
      console.log("User attempts found:", attempts.length);

      // Case 1: If the ID matches an attempt ID directly
      const directAttempt = attempts.find((att: any) => att.id === numericId);
      if (directAttempt) {
        console.log("Found direct attempt:", directAttempt);
        setAttempt(directAttempt);
        setLoading(false);
        return;
      }

      // Case 2: If the ID matches a quiz ID, find the latest completed attempt
      const quizAttempts = attempts.filter(
        (att: any )=> att.quiz === numericId && att.is_completed
      );
      
      if (quizAttempts.length > 0) {
        // Get the most recent attempt
        const latestAttempt = quizAttempts.sort(
          (a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];
        
        console.log("Found attempt for quiz:", latestAttempt);
        setAttempt(latestAttempt);
        setLoading(false);
        return;
      }

      // Case 3: No completed attempts found for this quiz
      const hasIncompleteAttempts = attempts.some(
        (att: any )=> att.quiz === numericId && !att.is_completed
      );

      if (hasIncompleteAttempts) {
        throw new Error(
          `কুইজ #${numericId} এর জন্য আপনার অসম্পূর্ণ Attempt আছে। প্রথমে কুইজটি সম্পন্ন করুন।`
        );
      } else {
        throw new Error(
          `কুইজ #${numericId} এর জন্য কোন Attempt পাওয়া যায়নি। প্রথমে কুইজটি সম্পন্ন করুন।`
        );
      }

    } catch (error: any) {
      console.error("Failed to load quiz results:", error);
      setError(error.message || "কুইজ ফলাফল লোড করতে সমস্যা হয়েছে");
      setLoading(false);
    }
  }, [isAuthenticated, attemptId]);

  useEffect(() => {
    loadQuizResults();
  }, [loadQuizResults]);

  // Calculate derived data
  const scorePercentage = attempt && attempt.total_marks > 0 
    ? (parseFloat(attempt.score) / attempt.total_marks) * 100 
    : 0;

  const correctAnswers = attempt?.performance_stats?.correct_answers || 
    attempt?.user_answers?.filter((answer: UserAnswer) => answer.is_correct).length || 0;
  
  const wrongAnswers = attempt?.performance_stats?.wrong_answers || 
    attempt?.user_answers?.filter((answer: UserAnswer) => !answer.is_correct).length || 0;
  
  const totalAnswered = attempt?.performance_stats?.total_answered || 
    attempt?.user_answers?.length || 0;

  // Pagination calculations
  const totalQuestions = attempt?.user_answers?.length || 0;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = attempt?.user_answers?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-bengali">ফলাফল লোড হচ্ছে...</p>
          <p className="text-xs text-gray-400 mt-2">ID: {attemptId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <QuizResultsError 
            error={error}
            attemptId={attemptId}
            userAttempts={userAttempts}
            onRetry={loadQuizResults}
            onNavigateToQuiz={() => router.push("/quizzes")}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        </div>
      </div>
    );
  }

  // Success state
  if (attempt) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <QuizResultsHeader 
            attempt={attempt}
            scorePercentage={scorePercentage}
            getPerformanceMessage={getPerformanceMessage}
          />
          
          <ScoreSummary 
            scorePercentage={scorePercentage}
            attempt={attempt}
            correctAnswers={correctAnswers}
            wrongAnswers={wrongAnswers}
            totalAnswered={totalAnswered}
            formatTime={formatTime}
            getPerformanceMessage={getPerformanceMessage}
          />

          <QuizDetails 
            attempt={attempt}
            formatDate={formatDate}
            formatTime={formatTime}
          />

          <QuestionAnalysis 
            userAnswers={currentQuestions}
            currentPage={currentPage}
            totalPages={totalPages}
            totalQuestions={totalQuestions}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={goToPage}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            questionsPerPage={questionsPerPage}
            onQuestionsPerPageChange={setQuestionsPerPage}
          />

          <ActionButtons 
            userAttempts={userAttempts}
            currentAttempt={attempt}
            router={router}
          />
        </div>
      </div>
    );
  }

  return null;
}

// Error Component (unchanged)
interface QuizResultsErrorProps {
  error: string;
  attemptId: string;
  userAttempts: QuizAttempt[];
  onRetry: () => void;
  onNavigateToQuiz: () => void;
  formatDate: (date: string) => string;
  formatTime: (seconds: number) => string;
}

function QuizResultsError({ 
  error, 
  attemptId, 
  userAttempts, 
  onRetry, 
  onNavigateToQuiz,
  formatDate,
  formatTime
}: QuizResultsErrorProps) {
  const router = useRouter();
  const numericId = parseInt(attemptId);
  const isLikelyQuizId = userAttempts.some(att => att.quiz === numericId);
  const quizAttempts = userAttempts.filter(att => att.quiz === numericId);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
      <div className="text-red-500 text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
        {isLikelyQuizId ? "কুইজ আইডি পাওয়া গেছে" : "ত্রুটি হয়েছে"}
      </h2>
      
      <p className="text-gray-600 mb-6 font-bengali">{error}</p>

      {isLikelyQuizId && quizAttempts.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 font-bengali mb-3">
            এটি একটি কুইজ আইডি (#{attemptId})। এই কুইজের Attempt গুলো:
          </p>
          <div className="space-y-2">
            {quizAttempts.map(attempt => (
              <div key={attempt.id} className="flex justify-between items-center p-3 border-b border-yellow-200 bg-white rounded">
                <div className="text-left">
                  <div className="font-semibold">Attempt #{attempt.id}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(attempt.completed_at || attempt.started_at)} • 
                    সময়: {formatTime(attempt.time_taken)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    attempt.is_completed 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {attempt.is_completed ? "সম্পন্ন" : "অসম্পূর্ণ"}
                  </span>
                  {attempt.is_completed && (
                    <button
                      onClick={() => router.push(`/quizzes/results/${attempt.id}`)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 font-bengali"
                    >
                      ফলাফল দেখুন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold font-bengali"
        >
          আবার চেষ্টা করুন
        </button>
        <button
          onClick={onNavigateToQuiz}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold font-bengali"
        >
          কুইজ পেজে ফিরে যান
        </button>
      </div>
    </div>
  );
}

// Header Component (unchanged)
interface QuizResultsHeaderProps {
  attempt: QuizAttempt;
  scorePercentage: number;
  getPerformanceMessage: (percentage: number) => string;
}

function QuizResultsHeader({ attempt, scorePercentage, getPerformanceMessage }: QuizResultsHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4 font-bengali">
        কুইজ ফলাফল
      </h1>
      <p className="text-lg text-gray-600 font-bengali">
        {attempt.quiz_details?.title || attempt.quiz_title}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Attempt ID: {attempt.id} | Quiz ID: {attempt.quiz} | User: {attempt.user_name}
      </p>
    </div>
  );
}

// Score Summary Component (unchanged)
interface ScoreSummaryProps {
  scorePercentage: number;
  attempt: QuizAttempt;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswered: number;
  formatTime: (seconds: number) => string;
  getPerformanceMessage: (percentage: number) => string;
}

function ScoreSummary({ 
  scorePercentage, 
  attempt, 
  correctAnswers, 
  wrongAnswers, 
  totalAnswered, 
  formatTime,
  getPerformanceMessage 
}: ScoreSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-green-200">
      <div className="text-center">
        <div className="text-6xl font-bold mb-4 text-gray-900">
          {scorePercentage.toFixed(1)}%
        </div>
        <div className="text-4xl font-bold mb-4 text-green-600">
          {attempt.score} / {attempt.total_marks}
        </div>
        <p className="text-lg text-gray-700 mb-6 font-bengali">
          {getPerformanceMessage(scorePercentage)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <StatCard value={correctAnswers} label="সঠিক উত্তর" color="green" />
        <StatCard value={wrongAnswers} label="ভুল উত্তর" color="red" />
        <StatCard value={totalAnswered} label="মোট উত্তর" color="blue" />
        <StatCard value={formatTime(attempt.time_taken)} label="সময় লেগেছে" color="purple" />
      </div>
    </div>
  );
}

// Stat Card Component (unchanged)
interface StatCardProps {
  value: string | number;
  label: string;
  color: "green" | "red" | "blue" | "purple";
}

function StatCard({ value, label, color }: StatCardProps) {
  const colorClasses = {
    green: "text-green-600",
    red: "text-red-600", 
    blue: "text-blue-600",
    purple: "text-purple-600"
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-gray-600 font-bengali">{label}</div>
    </div>
  );
}

// Quiz Details Component (unchanged)
interface QuizDetailsProps {
  attempt: QuizAttempt;
  formatDate: (date: string) => string;
  formatTime: (seconds: number) => string;
}

function QuizDetails({ attempt, formatDate, formatTime }: QuizDetailsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 font-bengali">
        কুইজ বিবরণ
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <DetailItem label="শুরু:" value={formatDate(attempt.started_at)} />
        <DetailItem 
          label="সমাপ্তি:" 
          value={attempt.completed_at ? formatDate(attempt.completed_at) : "অসম্পূর্ণ"} 
        />
        <DetailItem label="সময় লেগেছে:" value={formatTime(attempt.time_taken)} />
        <DetailItem 
          label="স্ট্যাটাস:" 
          value={attempt.is_completed ? "সম্পন্ন" : "অসম্পূর্ণ"}
          valueClassName={attempt.is_completed ? "text-green-600 font-bengali" : "text-yellow-600 font-bengali"}
        />
      </div>
    </div>
  );
}

// Detail Item Component (unchanged)
interface DetailItemProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function DetailItem({ label, value, valueClassName = "" }: DetailItemProps) {
  return (
    <div>
      <span className="text-gray-500 font-bengali">{label}</span>
      <span className={`ml-2 font-semibold ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

// Updated Question Analysis Component with Pagination
interface QuestionAnalysisProps {
  userAnswers: UserAnswer[];
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  questionsPerPage: number;
  onQuestionsPerPageChange: (value: number) => void;
}

function QuestionAnalysis({ 
  userAnswers, 
  currentPage, 
  totalPages, 
  totalQuestions, 
  startIndex, 
  endIndex,
  onPageChange,
  onNextPage,
  onPrevPage,
  questionsPerPage,
  onQuestionsPerPageChange
}: QuestionAnalysisProps) {
  if (!userAnswers || userAnswers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 font-bengali">
          প্রশ্ন বিশ্লেষণ
        </h2>
        <p className="text-gray-500 text-center py-4 font-bengali">
          প্রশ্নের বিস্তারিত তথ্য পাওয়া যায়নি
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold font-bengali">
          প্রশ্ন বিশ্লেষণ ({totalQuestions}টি প্রশ্ন)
        </h2>
        
        {/* Questions per page selector */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <label className="text-sm text-gray-600 font-bengali">
            প্রতি পৃষ্ঠায়:
          </label>
          <select
            value={questionsPerPage}
            onChange={(e) => onQuestionsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Current page info */}
      <div className="mb-4 text-sm text-gray-600 font-bengali">
        দেখানো হচ্ছে {startIndex + 1}-{Math.min(endIndex, totalQuestions)} নং প্রশ্ন ({totalQuestions}টি প্রশ্নের মধ্যে)
      </div>

      {/* Questions List */}
      <div className="space-y-4 mb-6">
        {userAnswers.map((answer, index) => (
          <QuestionAnswerItem 
            key={answer.id} 
            answer={answer} 
            index={startIndex + index}
            globalIndex={startIndex + index + 1}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onNextPage={onNextPage}
          onPrevPage={onPrevPage}
        />
      )}
    </div>
  );
}

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage
}: PaginationControlsProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
      <div className="text-sm text-gray-600 font-bengali">
        পৃষ্ঠা {currentPage} এর {totalPages}
      </div>
      
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg border text-sm font-medium ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          পূর্ববর্তী
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium ${
              currentPage === page
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg border text-sm font-medium ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          পরবর্তী
        </button>
      </div>
    </div>
  );
}

// Enhanced Question Answer Item Component
interface QuestionAnswerItemProps {
  answer: UserAnswer;
  index: number;
  globalIndex: number;
}

function QuestionAnswerItem({ answer, index, globalIndex }: QuestionAnswerItemProps) {
  const isCorrect = answer.is_correct;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`border rounded-xl transition-all duration-300 ${
      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
      {/* Question Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isCorrect 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {globalIndex}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isCorrect ? 'সঠিক' : 'ভুল'}
              </span>
              <span className="text-sm text-gray-500">
                মার্কস: {answer.marks_obtained}
              </span>
            </div>
            
            <p className="text-gray-800 leading-relaxed font-bengali">
              {answer.question_details?.question_text || 'প্রশ্নের বিবরণ পাওয়া যায়নি'}
            </p>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <span>▶️</span>
              <span>বিস্তারিত দেখুন</span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                showDetails ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Question Details - Collapsible */}
      {showDetails && (
        <div className="border-t border-opacity-50 p-4 bg-white bg-opacity-50">
          {/* Selected Options */}
          {answer.selected_option_texts && answer.selected_option_texts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2 font-bengali flex items-center gap-2">
                <span>✅</span>
                আপনার উত্তর
              </h4>
              <div className="space-y-2">
                {answer.selected_option_texts.map((text, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="text-gray-800 font-bengali">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {answer.question_details?.explanation && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2 font-bengali flex items-center gap-2">
                <span>💡</span>
                ব্যাখ্যা
              </h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-800 font-bengali">
                  {answer.question_details.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Question ID for reference */}
          <div className="text-xs text-gray-500 mt-3">
            প্রশ্ন ID: {answer.question_details?.id || 'N/A'} | উত্তর ID: {answer.id}
          </div>
        </div>
      )}
    </div>
  );
}

// Action Buttons Component (unchanged)
interface ActionButtonsProps {
  userAttempts: QuizAttempt[];
  currentAttempt: QuizAttempt;
  router: any;
}

function ActionButtons({ userAttempts, currentAttempt, router }: ActionButtonsProps) {
  const handleViewOtherAttempt = () => {
    const otherAttempt = userAttempts.find(att => 
      att.id !== currentAttempt.id && att.quiz === currentAttempt.quiz
    );
    if (otherAttempt) {
      router.push(`/quizzes/results/${otherAttempt.id}`);
    }
  };

  const otherQuizAttempts = userAttempts.filter(att => 
    att.id !== currentAttempt.id && att.quiz === currentAttempt.quiz
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        href="/quizzes"
        className="bg-red-600 text-white text-center py-3 px-6 rounded-lg hover:bg-red-700 font-semibold transition-colors font-bengali"
      >
        নতুন কুইজ শুরু করুন
      </Link>
      <Link
        href="/practice"
        className="border border-blue-300 text-blue-700 text-center py-3 px-6 rounded-lg hover:bg-blue-50 font-semibold transition-colors font-bengali"
      >
        প্র্যাকটিস সেশন
      </Link>
      {otherQuizAttempts.length > 0 && (
        <button
          onClick={handleViewOtherAttempt}
          className="border border-green-300 text-green-700 text-center py-3 px-6 rounded-lg hover:bg-green-50 font-semibold transition-colors font-bengali"
        >
          অন্য Attempt দেখুন
        </button>
      )}
      <Link
        href={`/quizzes/attempt/${currentAttempt.quiz}`}
        className="border border-purple-300 text-purple-700 text-center py-3 px-6 rounded-lg hover:bg-purple-50 font-semibold transition-colors font-bengali"
      >
        আবার চেষ্টা করুন
      </Link>
    </div>
  );
}