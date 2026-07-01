// app/analysis/all-answers/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { MathDisplay } from "@/components/math-equation/MathDisplay";

interface Answer {
  sessionId: number;
  sessionType: "practice" | "quiz";
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
  marks?: number;
  explanation?: string;
}

interface AnswersStats {
  totalAnswers: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  practiceAnswers: number;
  practiceCorrect: number;
  practiceWrong: number;
  practiceUnanswered: number;
  quizAnswers: number;
  quizCorrect: number;
  quizWrong: number;
  quizUnanswered: number;
  allAnswers: Answer[];
  subjectWiseStats: Record<string, { 
    total: number; correct: number; wrong: number; unanswered: number; accuracy: number 
  }>;
  difficultyWiseStats: Record<string, { 
    total: number; correct: number; wrong: number; unanswered: number; accuracy: number 
  }>;
}

const ITEMS_PER_PAGE = 10;

export default function AllAnswersAnalysisPage() {
  const [stats, setStats] = useState<AnswersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "correct" | "wrong" | "unanswered">("all");
  const [activeMode, setActiveMode] = useState<"all" | "practice" | "quiz">("all");
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  const renderMathText = (text: string) => {
    if (!text) return null;
    return text.split("$").map((part, index) => {
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        return (
          <span key={index} className="inline-block mx-0.5">
            <MathDisplay content={part} displayMode={false} />
          </span>
        );
      }
    });
  };

  useEffect(() => {
    loadAllAnswers();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeMode, filterSubject, filterDifficulty]);

  const loadAllAnswers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all practice sessions
      const practiceResponse = await apiClient.get("/practice-sessions/user_sessions/");
      const practiceSessions = practiceResponse;

      // Fetch all quiz sessions (adjust endpoint based on your API)
      let quizSessions = [];
      try {
        const quizResponse = await apiClient.get("/quiz-sessions/user_sessions/");
        quizSessions = quizResponse.data;
      } catch (quizError) {
        console.log("Quiz sessions endpoint not available, continuing with practice sessions only");
      }

      // Process all sessions to extract answers
      const answersData = processAllAnswers(practiceSessions, quizSessions);
      setStats(answersData);
      
    } catch (error: any) {
      console.error("Failed to load answers:", error);
      setError("উত্তরসমূহ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const processAllAnswers = (practiceSessions: any[], quizSessions: any[]): AnswersStats => {
    const stats: AnswersStats = {
      totalAnswers: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      practiceAnswers: 0,
      practiceCorrect: 0,
      practiceWrong: 0,
      practiceUnanswered: 0,
      quizAnswers: 0,
      quizCorrect: 0,
      quizWrong: 0,
      quizUnanswered: 0,
      allAnswers: [],
      subjectWiseStats: {},
      difficultyWiseStats: {}
    };

    // Process practice sessions
    practiceSessions.forEach(session => {
      if (session.session_questions && Array.isArray(session.session_questions)) {
        session.session_questions.forEach((sq: any) => {
          const correctOption = sq.options?.find((opt: any) => opt.is_correct);
          const answer: Answer = {
            sessionId: session.id,
            sessionType: "practice",
            questionId: sq.question,
            questionText: sq.question_text,
            subject: sq.subject_name,
            difficulty: sq.difficulty,
            userAnswer: sq.user_answer,
            correctAnswer: correctOption?.id || null,
            isCorrect: sq.is_correct,
            options: sq.options || [],
            timeTaken: sq.time_taken,
            answeredAt: sq.answered_at,
            explanation: sq.explanation
          };

          stats.allAnswers.push(answer);
          stats.totalAnswers++;
          stats.practiceAnswers++;

          // Update subject-wise stats
          updateSubjectStats(stats, sq.subject_name, answer);
          // Update difficulty-wise stats
          updateDifficultyStats(stats, sq.difficulty, answer);

          if (sq.user_answer === null) {
            stats.totalUnanswered++;
            stats.practiceUnanswered++;
          } else if (sq.is_correct) {
            stats.totalCorrect++;
            stats.practiceCorrect++;
          } else {
            stats.totalWrong++;
            stats.practiceWrong++;
          }
        });
      }
    });

    // Process quiz sessions
    quizSessions.forEach(session => {
      if (session.questions && Array.isArray(session.questions)) {
        session.questions.forEach((q: any) => {
          const correctOption = q.options?.find((opt: any) => opt.is_correct);
          const answer: Answer = {
            sessionId: session.id,
            sessionType: "quiz",
            questionId: q.id,
            questionText: q.question_text,
            subject: q.subject_name || q.category,
            difficulty: q.difficulty || "medium",
            userAnswer: q.user_answer,
            correctAnswer: correctOption?.id || null,
            isCorrect: q.is_correct,
            options: q.options || [],
            timeTaken: q.time_taken,
            answeredAt: q.answered_at,
            marks: q.marks,
            explanation: q.explanation
          };

          stats.allAnswers.push(answer);
          stats.totalAnswers++;
          stats.quizAnswers++;

          // Update subject-wise stats
          updateSubjectStats(stats, q.subject_name || q.category, answer);
          // Update difficulty-wise stats
          updateDifficultyStats(stats, q.difficulty || "medium", answer);

          if (q.user_answer === null) {
            stats.totalUnanswered++;
            stats.quizUnanswered++;
          } else if (q.is_correct) {
            stats.totalCorrect++;
            stats.quizCorrect++;
          } else {
            stats.totalWrong++;
            stats.quizWrong++;
          }
        });
      }
    });

    // Calculate accuracy for subjects and difficulties
    calculateAccuracies(stats);

    return stats;
  };

  const updateSubjectStats = (stats: AnswersStats, subject: string, answer: Answer) => {
    if (!stats.subjectWiseStats[subject]) {
      stats.subjectWiseStats[subject] = { total: 0, correct: 0, wrong: 0, unanswered: 0, accuracy: 0 };
    }
    stats.subjectWiseStats[subject].total++;
    
    if (answer.userAnswer === null) {
      stats.subjectWiseStats[subject].unanswered++;
    } else if (answer.isCorrect) {
      stats.subjectWiseStats[subject].correct++;
    } else {
      stats.subjectWiseStats[subject].wrong++;
    }
  };

  const updateDifficultyStats = (stats: AnswersStats, difficulty: string, answer: Answer) => {
    if (!stats.difficultyWiseStats[difficulty]) {
      stats.difficultyWiseStats[difficulty] = { total: 0, correct: 0, wrong: 0, unanswered: 0, accuracy: 0 };
    }
    stats.difficultyWiseStats[difficulty].total++;
    
    if (answer.userAnswer === null) {
      stats.difficultyWiseStats[difficulty].unanswered++;
    } else if (answer.isCorrect) {
      stats.difficultyWiseStats[difficulty].correct++;
    } else {
      stats.difficultyWiseStats[difficulty].wrong++;
    }
  };

  const calculateAccuracies = (stats: AnswersStats) => {
    // Calculate subject-wise accuracy
    Object.keys(stats.subjectWiseStats).forEach(subject => {
      const subjectStats = stats.subjectWiseStats[subject];
      const answered = subjectStats.correct + subjectStats.wrong;
      subjectStats.accuracy = answered > 0 ? (subjectStats.correct / answered) * 100 : 0;
    });

    // Calculate difficulty-wise accuracy
    Object.keys(stats.difficultyWiseStats).forEach(difficulty => {
      const difficultyStats = stats.difficultyWiseStats[difficulty];
      const answered = difficultyStats.correct + difficultyStats.wrong;
      difficultyStats.accuracy = answered > 0 ? (difficultyStats.correct / answered) * 100 : 0;
    });
  };

  // Filter answers based on active tabs and filters
  const filteredAnswers = useMemo(() => {
    return stats?.allAnswers.filter(answer => {
      const matchesAnswerType = 
        activeTab === "all" ||
        (activeTab === "correct" && answer.isCorrect) ||
        (activeTab === "wrong" && !answer.isCorrect && answer.userAnswer !== null) ||
        (activeTab === "unanswered" && answer.userAnswer === null);
      
      const matchesMode = activeMode === "all" || answer.sessionType === activeMode;
      const matchesSubject = filterSubject === "all" || answer.subject === filterSubject;
      const matchesDifficulty = filterDifficulty === "all" || answer.difficulty === filterDifficulty;
      
      return matchesAnswerType && matchesMode && matchesSubject && matchesDifficulty;
    }) || [];
  }, [stats, activeTab, activeMode, filterSubject, filterDifficulty]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAnswers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAnswers = filteredAnswers.slice(startIndex, endIndex);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getDifficultyText = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty || 'অজানা';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSessionTypeColor = (type: "practice" | "quiz"): string => {
    return type === "practice" 
      ? "bg-blue-100 text-blue-800 border-blue-200" 
      : "bg-violet-100 text-violet-800 border-violet-200";
  };

  const getSessionTypeText = (type: "practice" | "quiz"): string => {
    return type === "practice" ? "প্র্যাকটিস" : "কুইজ";
  };

  const getAnswerTypeColor = (answer: Answer): string => {
    if (answer.userAnswer === null) {
      return "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50";
    } else if (answer.isCorrect) {
      return "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100/30";
    } else {
      return "border-rose-200 bg-gradient-to-r from-rose-50 to-red-100/30";
    }
  };

  const getAnswerTypeText = (answer: Answer): string => {
    if (answer.userAnswer === null) {
      return "উত্তর দেওয়া হয়নি";
    } else if (answer.isCorrect) {
      return "সঠিক উত্তর";
    } else {
      return "ভুল উত্তর";
    }
  };

  const getAnswerTypeIcon = (answer: Answer): string => {
    if (answer.userAnswer === null) {
      return "⏳";
    } else if (answer.isCorrect) {
      return "✅";
    } else {
      return "❌";
    }
  };

  const retryWrongAnswers = async () => {
    if (!stats) return;
    
    setIsRetrying(true);
    const wrongQuestionIds = stats.allAnswers
      .filter(answer => !answer.isCorrect && answer.userAnswer !== null)
      .map(answer => answer.questionId);
    
    if (wrongQuestionIds.length > 0) {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/practice?retry=${wrongQuestionIds.join(',')}`);
    } else {
      alert('কোন ভুল উত্তর পাওয়া যায়নি!');
      setIsRetrying(false);
    }
  };

  const getTabCount = (tab: string, mode: string = "all") => {
    if (!stats) return 0;
    
    let count = 0;
    stats.allAnswers.forEach(answer => {
      const matchesMode = mode === "all" || answer.sessionType === mode;
      
      if (matchesMode) {
        if (tab === "all") count++;
        else if (tab === "correct" && answer.isCorrect) count++;
        else if (tab === "wrong" && !answer.isCorrect && answer.userAnswer !== null) count++;
        else if (tab === "unanswered" && answer.userAnswer === null) count++;
      }
    });
    
    return count;
  };

  // Calculate overall accuracy
  const overallAccuracy = stats ? (stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100 : 0;

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200/60">
        <div className="text-sm text-gray-600 font-bengali">
          দেখানো হচ্ছে <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredAnswers.length)}</span> এর <span className="font-semibold text-gray-900">{filteredAnswers.length}</span> টি উত্তর
        </div>
        
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-bengali shadow-sm hover:shadow-md"
          >
            <span>←</span>
            পূর্ববর্তী
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-2">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-10 h-10 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="px-1 text-gray-400">•••</span>
                )}
              </>
            )}

            {pageNumbers.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                  currentPage === page
                    ? "border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-1 text-gray-400">•••</span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-10 h-10 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-bengali shadow-sm hover:shadow-md"
          >
            পরবর্তী
            <span>→</span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-bengali text-lg font-medium">উত্তরসমূহ লোড হচ্ছে...</p>
          <p className="text-gray-400 text-sm font-bengali mt-2">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md border border-white/20">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
            ত্রুটি
          </h2>
          <p className="text-gray-600 mb-6 font-bengali leading-relaxed">
            {error || "উত্তরসমূহ লোড করতে সমস্যা হয়েছে"}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={loadAllAnswers}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 font-bengali transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => router.push("/practice")}
              className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-bengali transition-all duration-200"
            >
              প্র্যাকটিস হোম
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20 mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-bengali font-medium">বিশ্লেষণ ড্যাশবোর্ড</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-bengali bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text">
            সকল উত্তর বিশ্লেষণ
          </h1>
          <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            আপনার সকল প্র্যাকটিস ও কুইজ সেশনের সম্পূর্ণ বিশ্লেষণ এবং বিস্তারিত পরিসংখ্যান
          </p>
        </div>

        {/* Overview Stats with Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalAnswers}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">মোট উত্তর</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.totalCorrect}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">সঠিক</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-rose-600 mb-2">{stats.totalWrong}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">ভুল</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-gray-600 mb-2">{stats.totalUnanswered}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">উত্তরহীন</div>
            </div>
          </div>

          {/* Accuracy Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-bengali text-center">সঠিকতার হার</h3>
            <div className="relative">
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${overallAccuracy}%` }}
                ></div>
              </div>
              <div className="text-center mt-3">
                <span className="text-2xl font-bold text-gray-900">{overallAccuracy.toFixed(1)}%</span>
                <p className="text-sm text-gray-600 font-bengali mt-1">
                  {stats.totalCorrect + stats.totalWrong} টি উত্তরের মধ্যে
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-blue-600 font-bengali">প্র্যাকটিস সেশন</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.practiceAnswers}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">মোট</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.practiceCorrect}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">সঠিক</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-600">{stats.practiceWrong}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">ভুল</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-violet-600 font-bengali">কুইজ সেশন</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.quizAnswers}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">মোট</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.quizCorrect}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">সঠিক</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-600">{stats.quizWrong}</div>
                <div className="text-gray-600 text-sm font-bengali font-medium">ভুল</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            {/* Answer Type Tabs */}
            <div className="flex bg-gray-100/80 rounded-xl p-1">
              {[
                { key: "all", label: "সব", count: getTabCount("all"), color: "blue" },
                { key: "correct", label: "সঠিক", count: getTabCount("correct"), color: "emerald" },
                { key: "wrong", label: "ভুল", count: getTabCount("wrong"), color: "rose" },
                { key: "unanswered", label: "উত্তরহীন", count: getTabCount("unanswered"), color: "gray" }
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 font-bengali ${
                    activeTab === key
                      ? `bg-${color}-500 text-white shadow-lg`
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Mode and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Mode Tabs */}
              <div className="flex bg-gray-100/80 rounded-xl p-1">
                {[
                  { key: "all", label: "সব মোড" },
                  { key: "practice", label: "প্র্যাকটিস" },
                  { key: "quiz", label: "কুইজ" }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMode(key as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 font-bengali ${
                      activeMode === key
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                  <option value="all">সব বিষয়</option>
                  {Object.keys(stats.subjectWiseStats).map(subject => (
                    <option key={subject} value={subject}>
                      {subject} ({stats.subjectWiseStats[subject].total})
                    </option>
                  ))}
                </select>

                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                  <option value="all">সব কঠিনতা</option>
                  {Object.keys(stats.difficultyWiseStats).map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {getDifficultyText(difficulty)} ({stats.difficultyWiseStats[difficulty].total})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center mt-6">
            <button
              onClick={retryWrongAnswers}
              disabled={stats.totalWrong === 0 || isRetrying}
              className="bg-gradient-to-r from-rose-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-rose-600 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bengali flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  প্রস্তুত হচ্ছে...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  ভুল উত্তর আবার চেষ্টা করুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* Answers List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          {filteredAnswers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
                {stats.totalAnswers === 0 ? "কোন উত্তর নেই!" : "কোন মিল পাওয়া যায়নি"}
              </h3>
              <p className="text-gray-600 mb-8 font-bengali text-lg max-w-md mx-auto leading-relaxed">
                {stats.totalAnswers === 0 
                  ? "আপনি এখনো কোন প্রশ্নের উত্তর দেননি। নতুন প্র্যাকটিস শুরু করুন এবং আপনার দক্ষতা উন্নত করুন।" 
                  : "বর্তমান ফিল্টারের সাথে মিলে এমন কোন উত্তর পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।"}
              </p>
              {stats.totalAnswers === 0 && (
                <button
                  onClick={() => router.push("/practice")}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-10 rounded-xl hover:from-green-600 hover:to-blue-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl font-bengali text-lg"
                >
                  নতুন প্র্যাকটিস শুরু করুন
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 font-bengali">
                  {activeTab === "all" && "সকল উত্তর"}
                  {activeTab === "correct" && "সঠিক উত্তরসমূহ"}
                  {activeTab === "wrong" && "ভুল উত্তরসমূহ"}
                  {activeTab === "unanswered" && "উত্তরহীন প্রশ্নসমূহ"}
                  <span className="text-blue-600 ml-2">({filteredAnswers.length})</span>
                </h2>
                <div className="text-sm text-gray-600 font-bengali bg-white/50 rounded-lg px-3 py-2 border border-gray-200/50">
                  পৃষ্ঠা <span className="font-semibold text-gray-900">{currentPage}</span> এর <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {currentAnswers.map((answer, index) => {
                  const isExpanded = expandedQuestions.includes(answer.questionId);
                  const userSelectedOption = answer.userAnswer ? 
                    answer.options.find(opt => opt.id === answer.userAnswer) : null;
                  const correctOption = answer.options.find(opt => opt.id === answer.correctAnswer);

                  return (
                    <div
                      key={`${answer.sessionId}-${answer.questionId}`}
                      className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg ${getAnswerTypeColor(answer)}`}
                    >
                      <button
                        onClick={() => toggleQuestion(answer.questionId)}
                        className="w-full text-left p-6 hover:bg-opacity-70 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded-full">
                                প্রশ্ন {startIndex + index + 1}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSessionTypeColor(answer.sessionType)}`}>
                                {getSessionTypeText(answer.sessionType)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(answer.difficulty)}`}>
                                {getDifficultyText(answer.difficulty)}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {answer.subject}
                              </span>
                              <span className="text-lg">
                                {getAnswerTypeIcon(answer)}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {getAnswerTypeText(answer)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 font-bengali leading-relaxed text-lg">
                              {renderMathText(answer.questionText)}
                            </h3>
                          </div>
                          <div className="text-gray-400 text-lg transition-transform duration-200">
                            {isExpanded ? "▲" : "▼"}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm animate-in fade-in duration-300">
                          {/* Options */}
                          <div className="mb-6">
                            <h4 className="font-semibold mb-4 font-bengali text-gray-900 text-lg">বিকল্পসমূহ:</h4>
                            <div className="space-y-3">
                              {answer.options.map((option) => {
                                const isCorrectOption = option.id === answer.correctAnswer;
                                const isUserSelected = option.id === answer.userAnswer;

                                return (
                                  <div
                                    key={option.id}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                      isCorrectOption
                                        ? "border-emerald-500 bg-emerald-50/80 shadow-sm"
                                        : isUserSelected
                                        ? "border-rose-500 bg-rose-50/80 shadow-sm"
                                        : "border-gray-200 bg-white/80"
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <div
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200 ${
                                          isCorrectOption
                                            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                            : isUserSelected
                                            ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                                            : "border-gray-300 bg-white"
                                        }`}
                                      >
                                        {isCorrectOption && "✓"}
                                        {isUserSelected && !isCorrectOption && "✗"}
                                      </div>
                                      <span className="font-bengali flex-1 text-gray-800 leading-relaxed">
                                        {renderMathText(option.option_text)}
                                      </span>
                                      {isCorrectOption && (
                                        <span className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium font-bengali border border-emerald-200">
                                          সঠিক উত্তর
                                        </span>
                                      )}
                                      {isUserSelected && (
                                        <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium font-bengali border border-blue-200">
                                          আপনার উত্তর
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Explanation */}
                          {answer.explanation && (
                            <div className="mb-6">
                              <h4 className="font-semibold mb-3 font-bengali text-gray-900 text-lg">ব্যাখ্যা:</h4>
                              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
                                <div className="text-gray-700 font-bengali leading-relaxed">
                                  {renderMathText(answer.explanation)}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bengali">বিষয়:</span>
                              <span className="font-semibold text-gray-900">{answer.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bengali">কঠিনতা:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(answer.difficulty)}`}>
                                {getDifficultyText(answer.difficulty)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bengali">সেশন ধরন:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(answer.sessionType)}`}>
                                {getSessionTypeText(answer.sessionType)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bengali">সেশন:</span>
                              <span className="font-semibold text-gray-900">#{answer.sessionId}</span>
                            </div>
                            {answer.timeTaken && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-bengali">সময় নেওয়া:</span>
                                <span className="font-semibold text-gray-900">{answer.timeTaken}</span>
                              </div>
                            )}
                            {answer.marks && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-bengali">মার্কস:</span>
                                <span className="font-semibold text-gray-900">{answer.marks}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <Pagination />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button
            onClick={() => router.push("/practice")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-10 rounded-xl hover:from-blue-600 hover:to-purple-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl font-bengali text-lg flex items-center gap-2"
          >
            <span>🚀</span>
            নতুন প্র্যাকটিস শুরু করুন
          </button>
          <button
            onClick={() => router.push("/practice/history")}
            className="border-2 border-gray-300 text-gray-700 py-4 px-10 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200 font-bengali text-lg flex items-center gap-2"
          >
            <span>📚</span>
            সেশন ইতিহাস
          </button>
        </div>
      </div>
    </div>
  );
}