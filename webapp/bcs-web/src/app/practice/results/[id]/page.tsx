// app/practice/results/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import Header from "@/components/layout/header";
import { MathDisplay } from "@/components/math-equation/MathDisplay";
import { Check, Loader2, Sparkles } from "lucide-react";

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  order?: number;
  created_at?: string;
}

interface Question {
  id: number;
  question_text: string;
  explanation?: string;
  question_type: string;
  difficulty: string;
  marks: number;
  subject_name: string;
  options?: Option[];
}

interface SessionQuestion {
  id: number;
  question: number; // This is just the ID
  question_text: string;
  subject_name: string;
  difficulty: string;
  options: Option[];
  user_answer: number | null;
  is_correct: boolean;
  time_taken: string | null;
  sequence_order: number;
  answered_at?: string;
  explanation?: string; 
}

interface PracticeSession {
  id: number;
  session_questions: SessionQuestion[];
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string;
  time_taken: string;
  accuracy: number;
  subject_names: string[];
  difficulty: string;
}

const ITEMS_PER_PAGE = 10;

export default function PracticeResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"summary" | "questions">("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // Reset to first page when view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/practice-sessions/${sessionId}/`);
      
      let sessionData;
      
      if (response && typeof response === 'object') {
        if (response.data !== undefined) {
          sessionData = response.data;
        } else {
          sessionData = response;
        }
      } else {
        throw new Error("Invalid response format");
      }
      
      if (!sessionData) {
        throw new Error("No session data received");
      }
      
      console.log("Session Data:", sessionData);
      
      if (!sessionData.session_questions || !Array.isArray(sessionData.session_questions)) {
        throw new Error("Invalid session data structure");
      }
      
      const processedSessionQuestions = sessionData.session_questions.map((sq: any, index: number) => {
        return {
          id: sq.id,
          question: sq.question,
          question_text: sq.question_text || "প্রশ্নের তথ্য পাওয়া যায়নি",
          subject_name: sq.subject_name || "অজানা বিষয়",
          difficulty: sq.difficulty || "medium",
          options: sq.options || [],
          user_answer: sq.user_answer,
          is_correct: sq.is_correct,
          time_taken: sq.time_taken,
          sequence_order: sq.sequence_order || index,
          answered_at: sq.answered_at,
          explanation: sq.explanation
        };
      });
      
      const processedSessionData = {
        ...sessionData,
        session_questions: processedSessionQuestions
      };
      
      if (!processedSessionData.is_completed) {
        setError("এই সেশনটি এখনও সম্পূর্ণ হয়নি");
        return;
      }
      
      setSession(processedSessionData);
    } catch (error: any) {
      console.error("Failed to load session results:", error);
      
      if (error.response?.status === 404) {
        setError("সেশনটি খুঁজে পাওয়া যায়নি");
      } else if (error.response?.status === 403) {
        setError("আপনার এই সেশন দেখার অনুমতি নেই");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("ফলাফল লোড করতে সমস্যা হয়েছে");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get question data from session question
  const getQuestionData = useCallback((sq: SessionQuestion) => {
    return {
      id: sq.question,
      question_text: sq.question_text,
      explanation: sq.explanation || "",
      question_type: "multiple_choice",
      difficulty: sq.difficulty,
      marks: 1,
      subject_name: sq.subject_name,
      options: sq.options || []
    };
  }, []);

  // Pagination calculations for questions view
  const totalPages = Math.ceil((session?.session_questions.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuestions = session?.session_questions.slice(startIndex, endIndex) || [];

  const toggleQuestion = useCallback((questionId: number) => {
    setExpandedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const expandAll = useCallback(() => {
    if (session) {
      setExpandedQuestions(session.session_questions.map(sq => sq.question));
    }
  }, [session]);

  const collapseAll = useCallback(() => {
    setExpandedQuestions([]);
  }, []);

  const getScoreColor = useCallback((percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 dark:text-emerald-450";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-450";
    if (percentage >= 40) return "text-orange-600 dark:text-orange-450";
    return "text-rose-600 dark:text-rose-450";
  }, []);

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

  const shareResults = async () => {
    if (!session) return;

    try {
      setSharing(true);
      const text = `আমি ${session.score.toFixed(1)}% স্কোর সহ ${session.total_questions}টি প্রশ্নের প্র্যাকটিস সম্পন্ন করেছি! ${session.correct_answers}টি সঠিক, ${session.wrong_answers}টি ভুল।`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'প্র্যাকটিস সেশন ফলাফল',
          text: text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('ফলাফল কপি করা হয়েছে!');
      }
    } catch (error) {
      console.error('Failed to share results:', error);
    } finally {
      setSharing(false);
    }
  };

  const retryIncorrectQuestions = () => {
    if (!session) return;
    
    const incorrectQuestions = session.session_questions
      .filter(sq => !sq.is_correct && sq.user_answer !== null)
      .map(sq => sq.question);
    
    if (incorrectQuestions.length > 0) {
      router.push(`/practice?retry=${incorrectQuestions.join(',')}`);
    } else {
      alert('কোন ভুল উত্তর পাওয়া যায়নি!');
    }
  };

  const exportResults = () => {
    if (!session) return;
    
    const data = {
      sessionId: session.id,
      score: session.score,
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      wrongAnswers: session.wrong_answers,
      completedAt: session.completed_at,
      timeTaken: session.time_taken,
      accuracy: session.accuracy,
      questions: session.session_questions.map(sq => {
        const question = getQuestionData(sq);
        return {
          question: question.question_text,
          userAnswer: sq.user_answer,
          isCorrect: sq.is_correct,
          difficulty: question.difficulty,
          subject: question.subject_name
        };
      })
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice-session-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Safe data calculation functions
  const calculateSubjectStats = useCallback((session: PracticeSession) => {
    return session.session_questions.reduce((acc, sq) => {
      const subjectName = sq.subject_name;
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, correct: 0 };
      }
      acc[subjectName].total++;
      if (sq.is_correct) {
        acc[subjectName].correct++;
      }
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);
  }, []);

  const calculateDifficultyStats = useCallback((session: PracticeSession) => {
    return session.session_questions.reduce((acc, sq) => {
      const difficulty = sq.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, correct: 0 };
      }
      acc[difficulty].total++;
      if (sq.is_correct) {
        acc[difficulty].correct++;
      }
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);
  }, []);

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[var(--border)]">
        <div className="text-sm text-[var(--muted-foreground)] font-bengali">
          দেখানো হচ্ছে <span className="font-semibold text-[var(--foreground)]">{startIndex + 1}-{Math.min(endIndex, session?.session_questions.length || 0)}</span> এর <span className="font-semibold text-[var(--foreground)]">{session?.session_questions.length || 0}</span> টি প্রশ্ন
        </div>
        
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-bengali shadow-sm hover:shadow-md cursor-pointer"
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
                  className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="px-1 text-[var(--muted-foreground)]">•••</span>
                )}
              </>
            )}

            {pageNumbers.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
                  currentPage === page
                    ? "border-primary-500 bg-primary-500 text-white shadow-lg scale-105"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10"
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-1 text-[var(--muted-foreground)]">•••</span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-bengali shadow-sm hover:shadow-md cursor-pointer"
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-[var(--muted-foreground)] font-bengali font-semibold">ফলাফল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-[var(--card)] rounded-3xl p-6 text-center max-w-sm border border-[var(--border)] shadow-sm">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-3 font-bengali">ত্রুটি</h2>
          <p className="text-[var(--muted-foreground)] mb-5 font-bengali text-sm">{error || "ফলাফল লোড করতে সমস্যা হয়েছে"}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={loadSession}
              className="bg-primary-500 hover:bg-primary-hover text-white px-4 py-2.5 rounded-2xl font-bold font-bengali transition-colors text-sm cursor-pointer"
            >
              আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => router.push("/practice")}
              className="border border-[var(--border)] text-[var(--foreground)] px-4 py-2.5 rounded-2xl hover:bg-primary-50/10 font-bold font-bengali transition-colors text-sm cursor-pointer"
            >
              নতুন সেশন শুরু করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: session.total_questions,
    correct: session.correct_answers,
    incorrect: session.wrong_answers,
    unanswered: session.total_questions - session.completed_questions,
    score: session.score,
    accuracy: session.accuracy
  };

  const subjectStats = calculateSubjectStats(session);
  const difficultyStats = calculateDifficultyStats(session);

  const incorrectQuestionsCount = session.session_questions.filter(
    sq => !sq.is_correct && sq.user_answer !== null
  ).length;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-2 shadow-sm mb-4">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-[var(--muted-foreground)] font-extrabold uppercase tracking-wider font-bengali">সেশন ফলাফল</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 font-bengali text-[var(--foreground)] tracking-tight">
            প্র্যাকটিস সেশন ফলাফল
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] font-bengali">
            আপনি {session.total_questions} টি প্রশ্নের প্র্যাকটিস সম্পন্ন করেছেন
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-1 shadow-sm flex">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-6 py-2.5 rounded-xl font-bold font-bengali text-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                viewMode === "summary"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-primary-50/10"
              }`}
            >
              <span>📊</span>
              সারাংশ
            </button>
            <button
              onClick={() => setViewMode("questions")}
              className={`px-6 py-2.5 rounded-xl font-bold font-bengali text-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                viewMode === "questions"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-primary-50/10"
              }`}
            >
              <span>❓</span>
              সব প্রশ্ন ({session.total_questions})
            </button>
          </div>
        </div>

        {viewMode === "summary" ? (
          /* Summary View */
          <div className="space-y-6">
            {/* Score Card */}
            <div
              className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm flex flex-col items-center justify-center"
            >
              <div className="text-center">
                <div className="text-6xl font-black mb-2 text-[var(--foreground)]">
                  {stats.score.toFixed(1)}%
                </div>
                <div
                  className={`text-2xl font-black mb-4 ${getScoreColor(
                    stats.score
                  )}`}
                >
                  {stats.correct} / {stats.total}
                </div>
                <p className="text-sm font-bold text-[var(--foreground)] font-bengali leading-relaxed">
                  {stats.score >= 80
                    ? "🎉 অসাধারণ! আপনি বিষয়টি খুব ভালোভাবে বুঝেছেন।"
                    : stats.score >= 60
                    ? "👍 ভালো! আপনার দক্ষতা উন্নয়নশীল।"
                    : stats.score >= 40
                    ? "📊 সন্তোষজনক! আরও অনুশীলন প্রয়োজন।"
                    : "📈 আরও পড়াশোনা এবং অনুশীলন প্রয়োজন।"}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full">
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <div className="text-2xl font-black text-emerald-600">
                    {stats.correct}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] font-bengali">সঠিক উত্তর</div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <div className="text-2xl font-black text-rose-600">
                    {stats.incorrect}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] font-bengali">ভুল উত্তর</div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <div className="text-2xl font-black text-blue-600">
                    {stats.unanswered}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] font-bengali">
                    বাকি
                  </div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <div className="text-2xl font-black text-purple-600">
                    {stats.total}
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] font-bengali">মোট প্রশ্ন</div>
                </div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--foreground)] mb-6 font-bengali">
                কঠিনতা অনুযায়ী পারফরম্যান্স
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["easy", "medium", "hard"].map((difficulty) => {
                  const diffStats = difficultyStats[difficulty] || { total: 0, correct: 0 };
                  const percentage = diffStats.total > 0 ? (diffStats.correct / diffStats.total) * 100 : 0;

                  return (
                    <div
                      key={difficulty}
                      className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-5 text-center hover:shadow-sm transition-all duration-200"
                    >
                      <div
                        className={`text-xs font-black mb-3 px-3 py-1 rounded-lg border inline-block ${getDifficultyColor(difficulty)}`}
                      >
                        {getDifficultyText(difficulty)}
                      </div>
                      <div className="text-xl font-black text-[var(--foreground)] mb-1">
                        {diffStats.correct} / {diffStats.total}
                      </div>
                      <div className={`text-sm font-bold ${getScoreColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                            difficulty === "easy"
                              ? "bg-emerald-505 bg-emerald-500"
                              : difficulty === "medium"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject-wise Performance */}
            {Object.keys(subjectStats).length > 0 && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-black text-[var(--foreground)] mb-6 font-bengali">
                  বিষয়ভিত্তিক পারফরম্যান্স
                </h2>
                <div className="space-y-4">
                  {Object.entries(subjectStats).map(([subject, subjectStat]) => {
                    const percentage = subjectStat.total > 0 ? (subjectStat.correct / subjectStat.total) * 100 : 0;
                    
                    return (
                      <div key={subject} className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:shadow-xs transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold font-bengali text-[var(--foreground)] text-sm">
                            {subject}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {subjectStat.correct}/{subjectStat.total}
                            </div>
                            <div className={`text-sm font-black ${getScoreColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-[var(--border)] rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-primary-500 transition-all duration-1000 ease-out" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Questions View */
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-black text-[var(--foreground)] font-bengali">
                সব প্রশ্নের বিশ্লেষণ
              </h2>
            </div>

            <div className="space-y-4">
              {paginatedQuestions.map((sq, index) => {
                const question = getQuestionData(sq);
                const userSelectedOption = sq.user_answer && question.options 
                  ? question.options.find(opt => opt.id === sq.user_answer) 
                  : null;

                return (
                  <div
                    key={sq.id}
                    className={`rounded-2xl border p-4 hover:shadow-xs transition-all duration-200 space-y-4 bg-[var(--card)] ${
                      sq.is_correct
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : sq.user_answer !== null
                        ? "border-rose-500/30 bg-rose-500/5"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-md">
                        প্রশ্ন {startIndex + index + 1}
                      </span>
                    
                      <span className="text-[9px] font-bold text-[var(--muted-foreground)] ml-auto font-bengali">
                        বিষয়: {question.subject_name}
                      </span>
                    </div>

                    {/* Question Title */}
                    <h3 className="font-extrabold text-[var(--foreground)] font-bengali leading-relaxed text-xs md:text-sm">
                      {renderMathText(question.question_text)}
                    </h3>

                    {/* Options list */}
                    <div>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optIdx) => {
                          const isCorrectOption = option.is_correct;
                          const isUserSelected = sq.user_answer === option.id;
                          const letters = ["ক", "খ", "গ", "ঘ"];

                          // Styling rules
                          let cardBorder = "border-[var(--border)]";
                          let cardBg = "bg-[var(--card)]";
                          let cardText = "text-[var(--foreground)]";
                          
                          let bubbleBorder = "border-[var(--border)]";
                          let bubbleBg = "bg-[var(--muted)]";
                          let bubbleText = "text-[var(--muted-foreground)]";

                          if (isCorrectOption) {
                            cardBorder = "border-emerald-500";
                            cardBg = "bg-emerald-500/5";
                            cardText = "text-emerald-950 dark:text-emerald-450";
                            
                            bubbleBorder = "border-emerald-500";
                            bubbleBg = "bg-emerald-500";
                            bubbleText = "text-white";
                          } else if (isUserSelected) {
                            cardBorder = "border-rose-500";
                            cardBg = "bg-rose-50/50 dark:bg-rose-500/5";
                            cardText = "text-rose-950 dark:text-rose-450";
                            
                            bubbleBorder = "border-rose-500";
                            bubbleBg = "bg-rose-500";
                            bubbleText = "text-white";
                          }

                          return (
                            <div
                              key={option.id}
                              className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${cardBorder} ${cardBg} ${cardText}`}
                            >
                              <div className="flex items-center flex-1 pr-3">
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center mr-2.5 font-black text-[10px] transition-colors duration-200 ${bubbleBorder} ${bubbleBg} ${bubbleText}`}>
                                  {isCorrectOption ? <Check className="w-3 h-3 stroke-[3]" /> : letters[optIdx]}
                                </div>
                                <span className="font-bengali text-xs leading-relaxed flex-1 font-semibold">
                                  {renderMathText(option.option_text)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isCorrectOption && (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[9px] font-black font-bengali border border-emerald-500/20">
                                    সঠিক উত্তর
                                  </span>
                                )}
                                {isUserSelected && !isCorrectOption && (
                                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[9px] font-black font-bengali border border-rose-500/20">
                                    আপনার উত্তর
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {(!question.options || question.options.length === 0) && (
                          <p className="text-[var(--muted-foreground)] font-bengali text-xs text-center py-2">কোনো অপশন পাওয়া যায়নি।</p>
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="pt-1">
                        <h4 className="text-[10px] font-extrabold mb-1.5 font-bengali text-[var(--muted-foreground)] uppercase tracking-wider">
                          💡 ব্যাখ্যা:
                        </h4>
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/25 rounded-xl">
                          <p className="text-[var(--foreground)] font-bengali leading-relaxed text-xs">
                            {renderMathText(question.explanation)}
                          </p>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center items-center mt-12 pb-10">
          <button
            onClick={() => router.push("/practice")}
            className="bg-primary-500 hover:bg-primary-hover text-white py-3.5 px-8 rounded-2xl font-black font-bengali text-sm shadow-md transition-all duration-200 cursor-pointer"
          >
            🚀 নতুন প্র্যাকটিস সেশন
          </button>
          
          {incorrectQuestionsCount > 0 && (
            <button
              onClick={retryIncorrectQuestions}
              className="bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-8 rounded-2xl font-black font-bengali text-sm shadow-md transition-all duration-200 cursor-pointer"
            >
              🔄 ভুল প্রশ্ন আবার চেষ্টা করুন ({incorrectQuestionsCount})
            </button>
          )}

          <button
            onClick={shareResults}
            disabled={sharing}
            className="border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 py-3.5 px-8 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {sharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                শেয়ার হচ্ছে...
              </>
            ) : (
              <>
                <span>📤</span>
                ফলাফল শেয়ার
              </>
            )}
          </button>

          <button
            onClick={exportResults}
            className="border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 py-3.5 px-8 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer"
          >
            💾 রিপোর্ট ডাউনলোড
          </button>

          <button
            onClick={() => router.push("/practice/history")}
            className="border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-primary-50/10 py-3.5 px-8 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer"
          >
            📚 সেশন ইতিহাস
          </button>
        </div>
      </div>
    </div>
  );
}