// app/practice/analysis/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getDifficultyColor, getDifficultyText } from "@/utils/difficultyUtils";

interface QuestionAnalysis {
  sessionId: number;
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
}

interface AnalysisStats {
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  totalQuestions: number;
  accuracy: number;
  correctAnswers: QuestionAnalysis[];
  wrongAnswers: QuestionAnalysis[];
  unansweredQuestions: QuestionAnalysis[];
  subjectWiseStats: Record<string, { correct: number; wrong: number; unanswered: number; total: number; accuracy: number }>;
  difficultyWiseStats: Record<string, { correct: number; wrong: number; unanswered: number; total: number; accuracy: number }>;
}

const ITEMS_PER_PAGE = 10;

export default function PracticeAnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "correct" | "wrong" | "unanswered">("overview");
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadAnalysis();
  }, []);

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch all user sessions
      const sessionsResponse = await apiClient.get("/practice-sessions/user_sessions/");
      const sessions = sessionsResponse;

      // Process all sessions to extract question data
      const analysisData = processSessionsAnalysis(sessions);
      setAnalysis(analysisData);
      
    } catch (error: any) {
      console.error("Failed to load analysis:", error);
      setError("বিশ্লেষণ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const processSessionsAnalysis = (sessions: any[]): AnalysisStats => {
    const analysis: AnalysisStats = {
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      totalQuestions: 0,
      accuracy: 0,
      correctAnswers: [],
      wrongAnswers: [],
      unansweredQuestions: [],
      subjectWiseStats: {},
      difficultyWiseStats: {}
    };

    sessions.forEach(session => {
      if (session.session_questions && Array.isArray(session.session_questions)) {
        session.session_questions.forEach((sq: any) => {
          analysis.totalQuestions++;
          
          // Find correct answer from options
          const correctOption = sq.options?.find((opt: any) => opt.is_correct);
          const correctAnswerId = correctOption?.id || null;
          
          const questionAnalysis: QuestionAnalysis = {
            sessionId: session.id,
            questionId: sq.question,
            questionText: sq.question_text,
            subject: sq.subject_name,
            difficulty: sq.difficulty,
            userAnswer: sq.user_answer,
            correctAnswer: correctAnswerId,
            isCorrect: sq.is_correct,
            options: sq.options || [],
            timeTaken: sq.time_taken,
            answeredAt: sq.answered_at
          };

          // Update subject-wise stats
          if (!analysis.subjectWiseStats[sq.subject_name]) {
            analysis.subjectWiseStats[sq.subject_name] = { correct: 0, wrong: 0, unanswered: 0, total: 0, accuracy: 0 };
          }
          analysis.subjectWiseStats[sq.subject_name].total++;

          // Update difficulty-wise stats
          if (!analysis.difficultyWiseStats[sq.difficulty]) {
            analysis.difficultyWiseStats[sq.difficulty] = { correct: 0, wrong: 0, unanswered: 0, total: 0, accuracy: 0 };
          }
          analysis.difficultyWiseStats[sq.difficulty].total++;

          if (sq.user_answer === null) {
            analysis.totalUnanswered++;
            analysis.unansweredQuestions.push(questionAnalysis);
            analysis.subjectWiseStats[sq.subject_name].unanswered++;
            analysis.difficultyWiseStats[sq.difficulty].unanswered++;
          } else if (sq.is_correct) {
            analysis.totalCorrect++;
            analysis.correctAnswers.push(questionAnalysis);
            analysis.subjectWiseStats[sq.subject_name].correct++;
            analysis.difficultyWiseStats[sq.difficulty].correct++;
          } else {
            analysis.totalWrong++;
            analysis.wrongAnswers.push(questionAnalysis);
            analysis.subjectWiseStats[sq.subject_name].wrong++;
            analysis.difficultyWiseStats[sq.difficulty].wrong++;
          }
        });
      }
    });

    // Calculate accuracy and subject/difficulty accuracies
    analysis.accuracy = analysis.totalQuestions > 0 ? 
      (analysis.totalCorrect / (analysis.totalCorrect + analysis.totalWrong)) * 100 : 0;

    // Calculate subject-wise accuracy
    Object.keys(analysis.subjectWiseStats).forEach(subject => {
      const stats = analysis.subjectWiseStats[subject];
      const answered = stats.correct + stats.wrong;
      stats.accuracy = answered > 0 ? (stats.correct / answered) * 100 : 0;
    });

    // Calculate difficulty-wise accuracy
    Object.keys(analysis.difficultyWiseStats).forEach(difficulty => {
      const stats = analysis.difficultyWiseStats[difficulty];
      const answered = stats.correct + stats.wrong;
      stats.accuracy = answered > 0 ? (stats.correct / answered) * 100 : 0;
    });

    return analysis;
  };

  // Get current questions based on active tab
  const currentQuestions = useMemo(() => {
    switch (activeTab) {
      case "correct": return analysis?.correctAnswers || [];
      case "wrong": return analysis?.wrongAnswers || [];
      case "unanswered": return analysis?.unansweredQuestions || [];
      default: return [];
    }
  }, [activeTab, analysis]);

  // Pagination calculations
  const totalPages = Math.ceil(currentQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuestions = currentQuestions.slice(startIndex, endIndex);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-amber-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-800";
    if (percentage >= 60) return "bg-amber-100 text-amber-800";
    if (percentage >= 40) return "bg-orange-100 text-orange-800";
    return "bg-rose-100 text-rose-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  // Pagination Component
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
          দেখানো হচ্ছে <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, currentQuestions.length)}</span> এর <span className="font-semibold text-gray-900">{currentQuestions.length}</span> টি প্রশ্ন
        </div>
        
        <div className="flex items-center gap-2">
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
          <p className="mt-4 text-gray-600 font-bengali text-lg font-medium">বিশ্লেষণ লোড হচ্ছে...</p>
          <p className="text-gray-400 text-sm font-bengali mt-2">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
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
            {error || "বিশ্লেষণ লোড করতে সমস্যা হয়েছে"}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={loadAnalysis}
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
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-bengali font-medium">বিশ্লেষণ ড্যাশবোর্ড</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-bengali bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text">
            প্রশ্ন বিশ্লেষণ
          </h1>
          <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            আপনার সকল প্র্যাকটিস সেশনের সম্পূর্ণ বিশ্লেষণ এবং বিস্তারিত পরিসংখ্যান
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{analysis.totalCorrect}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">সঠিক উত্তর</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-rose-600 mb-2">{analysis.totalWrong}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">ভুল উত্তর</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-3xl font-bold text-blue-600 mb-2">{analysis.totalUnanswered}</div>
              <div className="text-gray-600 font-bengali text-sm font-medium">উত্তর দেওয়া হয়নি</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.accuracy)} mb-2`}>
                {analysis.accuracy.toFixed(1)}%
              </div>
              <div className="text-gray-600 font-bengali text-sm font-medium">সঠিকতার হার</div>
            </div>
          </div>

          {/* Accuracy Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-bengali text-center">সঠিকতার হার</h3>
            <div className="relative">
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${analysis.accuracy}%` }}
                ></div>
              </div>
              <div className="text-center mt-3">
                <span className={`text-2xl font-bold ${getScoreColor(analysis.accuracy)}`}>
                  {analysis.accuracy.toFixed(1)}%
                </span>
                <p className="text-sm text-gray-600 font-bengali mt-1">
                  {analysis.totalCorrect + analysis.totalWrong} টি উত্তরের মধ্যে
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-1 mb-8 border border-white/20">
          <div className="flex flex-wrap">
            {[
              { key: "overview", label: "সারাংশ", icon: "📊", color: "blue" },
              { key: "correct", label: "সঠিক উত্তর", icon: "✅", count: analysis.correctAnswers.length, color: "emerald" },
              { key: "wrong", label: "ভুল উত্তর", icon: "❌", count: analysis.wrongAnswers.length, color: "rose" },
              { key: "unanswered", label: "উত্তর দেওয়া হয়নি", icon: "❓", count: analysis.unansweredQuestions.length, color: "blue" }
            ].map(({ key, label, icon, count, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 font-bengali flex items-center justify-center gap-2 ${
                  activeTab === key
                    ? `bg-${color}-500 text-white shadow-lg`
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Subject-wise Performance */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-bengali">
                  বিষয়ভিত্তিক পারফরম্যান্স
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysis.subjectWiseStats).map(([subject, stats]) => (
                    <div key={subject} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                      <h3 className="font-semibold text-gray-900 mb-4 font-bengali text-lg">{subject}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bengali">সঠিক:</span>
                          <span className="font-semibold text-emerald-600">{stats.correct}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bengali">ভুল:</span>
                          <span className="font-semibold text-rose-600">{stats.wrong}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bengali">মোট:</span>
                          <span className="font-semibold text-gray-900">{stats.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bengali">সঠিকতা:</span>
                          <span className={`font-semibold ${getScoreColor(stats.accuracy)}`}>
                            {stats.accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500`} 
                            style={{ width: `${stats.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty-wise Performance */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-bengali">
                  কঠিনতা অনুযায়ী পারফরম্যান্স
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(analysis.difficultyWiseStats).map(([difficulty, stats]) => (
                    <div key={difficulty} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                      <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 border ${getDifficultyColor(difficulty)}`}>
                        {getDifficultyText(difficulty)}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {stats.correct} / {stats.total}
                      </div>
                      <div className={`text-lg font-semibold mb-3 ${getScoreColor(stats.accuracy)}`}>
                        {stats.accuracy.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            difficulty === 'easy' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                            difficulty === 'medium' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 
                            'bg-gradient-to-r from-rose-400 to-red-500'
                          }`} 
                          style={{ width: `${stats.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {["correct", "wrong", "unanswered"].includes(activeTab) && (
            <QuestionList
              questions={paginatedQuestions}
              type={activeTab as "correct" | "wrong" | "unanswered"}
              expandedQuestions={expandedQuestions}
              onToggleQuestion={toggleQuestion}
              currentPage={currentPage}
              startIndex={startIndex}
            />
          )}

          {/* Pagination for question lists */}
          {["correct", "wrong", "unanswered"].includes(activeTab) && currentQuestions.length > 0 && (
            <Pagination />
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

// Question List Component
interface QuestionListProps {
  questions: QuestionAnalysis[];
  type: "correct" | "wrong" | "unanswered";
  expandedQuestions: number[];
  onToggleQuestion: (id: number) => void;
  currentPage: number;
  startIndex: number;
}

const QuestionList = ({ questions, type, expandedQuestions, onToggleQuestion, currentPage, startIndex }: QuestionListProps) => {
  const getTypeColor = () => {
    switch (type) {
      case 'correct': return 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100/30';
      case 'wrong': return 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-100/30';
      case 'unanswered': return 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50';
    }
  };

  const getTypeText = () => {
    switch (type) {
      case 'correct': return 'সঠিক';
      case 'wrong': return 'ভুল';
      case 'unanswered': return 'উত্তর দেওয়া হয়নি';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'correct': return '✅';
      case 'wrong': return '❌';
      case 'unanswered': return '⏳';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">{getTypeIcon()}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
          কোন {getTypeText()} প্রশ্ন পাওয়া যায়নি
        </h3>
        <p className="text-gray-600 font-bengali text-lg max-w-md mx-auto leading-relaxed">
          {type === 'correct' 
            ? 'আপনার এখনো কোন সঠিক উত্তর নেই। আরও প্র্যাকটিস করুন!' 
            : type === 'wrong' 
            ? 'আপনার এখনো কোন ভুল উত্তর নেই। দুর্দান্ত কাজ চলছে!'
            : 'আপনার এখনো কোন উত্তরহীন প্রশ্ন নেই। সব প্রশ্নের উত্তর দিয়েছেন!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-bengali flex items-center gap-3">
          <span>{getTypeIcon()}</span>
          {getTypeText()} প্রশ্নসমূহ
          <span className="text-blue-600">({questions.length})</span>
        </h2>
      </div>
      
      <div className="space-y-4">
        {questions.map((q, index) => {
          const isExpanded = expandedQuestions.includes(q.questionId);
          const userSelectedOption = q.userAnswer ? 
            q.options.find(opt => opt.id === q.userAnswer) : null;
          const correctOption = q.options.find(opt => opt.is_correct);

          return (
            <div
              key={`${q.sessionId}-${q.questionId}`}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg ${getTypeColor()}`}
            >
              <button
                onClick={() => onToggleQuestion(q.questionId)}
                className="w-full text-left p-6 hover:bg-opacity-70 transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded-full">
                        প্রশ্ন {startIndex + index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(q.difficulty)}`}>
                        {getDifficultyText(q.difficulty)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {q.subject}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {getTypeText()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 font-bengali leading-relaxed text-lg">
                      {q.questionText}
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
                      {q.options.map((option) => {
                        const isCorrectOption = option.is_correct;
                        const isUserSelected = q.userAnswer === option.id;

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
                                {option.option_text}
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

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bengali">বিষয়:</span>
                      <span className="font-semibold text-gray-900">{q.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bengali">কঠিনতা:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                        {getDifficultyText(q.difficulty)}
                      </span>
                    </div>
                    {q.timeTaken && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bengali">সময় নেওয়া:</span>
                        <span className="font-semibold text-gray-900">{q.timeTaken}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bengali">সেশন:</span>
                      <span className="font-semibold text-gray-900">#{q.sessionId}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};