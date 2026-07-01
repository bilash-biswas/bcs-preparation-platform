// app/practice/history/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface PracticeSession {
  id: number;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  accuracy: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string;
  time_taken: string;
  duration_minutes: number;
  subject_names: string[];
  difficulty?: string;
  session_type?: string;
  session_questions?: any[];
  subjects?: number[];
  user?: number;
}

const ITEMS_PER_PAGE = 10;

export default function PracticeHistoryPage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "questions">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadSessionHistory();
  }, []);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchTerm, sortBy, sortOrder]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/practice-sessions/user_sessions/");
      console.log("Fetched session history:", response);
      setSessions(response);
    } catch (error: any) {
      console.error("Failed to load session history:", error);
      setError("সেশন ইতিহাস লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSessions = useCallback(() => {
    let filtered = sessions.filter(
      (session) =>
        session.subject_names.some((subject) =>
          subject.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (session.difficulty &&
          session.difficulty
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (session.session_type &&
          session.session_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.completed_at || a.started_at);
          bValue = new Date(b.completed_at || b.started_at);
          break;
        case "score":
          aValue = a.score || a.accuracy || 0;
          bValue = b.score || b.accuracy || 0;
          break;
        case "questions":
          aValue = a.total_questions;
          bValue = b.total_questions;
          break;
        default:
          aValue = new Date(a.completed_at || a.started_at);
          bValue = new Date(b.completed_at || b.started_at);
      }

      if (sortOrder === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "তারিখ পাওয়া যায়নি";
    }
  };

  const formatDuration = (duration: string | number | null) => {
    if (duration === null || duration === undefined) {
      return "সময় পাওয়া যায়নি";
    }

    if (typeof duration === "number") {
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const minutes = Math.round(duration % 60);
        return `${hours} ঘন্টা ${minutes} মিনিট`;
      } else if (duration >= 1) {
        return `${Math.round(duration)} মিনিট`;
      } else {
        const seconds = Math.round(duration * 60);
        return `${seconds} সেকেন্ড`;
      }
    }

    if (typeof duration === "string") {
      if (duration.includes(":")) {
        const parts = duration.split(":");
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;

        if (hours > 0) {
          return `${hours} ঘন্টা ${minutes} মিনিট`;
        } else if (minutes > 0) {
          return `${minutes} মিনিট`;
        } else {
          return `${seconds} সেকেন্ড`;
        }
      } else if (duration.startsWith("PT")) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return "0 মিনিট";

        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");

        if (hours > 0) {
          return `${hours} ঘন্টা ${minutes} মিনিট`;
        } else if (minutes > 0) {
          return `${minutes} মিনিট`;
        } else {
          return `${seconds} সেকেন্ড`;
        }
      }
    }

    return "0 মিনিট";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 40) return "text-orange-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
    if (score >= 40) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const getSessionScore = (session: PracticeSession) => {
    return session.score || session.accuracy || 0;
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

  const deleteSession = async (sessionId: number, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm("আপনি কি এই সেশনটি ডিলিট করতে চান?")) {
      return;
    }

    try {
      setIsDeleting(sessionId);
      await apiClient.delete(`/practice-sessions/${sessionId}/`);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      alert("সেশন ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setIsDeleting(null);
    }
  };

  const clearAllHistory = async () => {
    if (
      !confirm(
        "আপনি কি সব সেশন ইতিহাস ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
      )
    ) {
      return;
    }

    try {
      await apiClient.delete("/practice-sessions/clear_history/");
      setSessions([]);
      alert("সব সেশন ইতিহাস ডিলিট করা হয়েছে");
    } catch (error: any) {
      console.error("Failed to clear history:", error);
      alert("ইতিহাস ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const exportHistory = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      averageScore:
        sessions.length > 0
          ? sessions.reduce(
              (acc, session) => acc + getSessionScore(session),
              0
            ) / sessions.length
          : 0,
      sessions: sessions.map((session) => ({
        id: session.id,
        date: session.completed_at || session.started_at,
        score: getSessionScore(session),
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,
        wrongAnswers: session.wrong_answers,
        completedQuestions: session.completed_questions,
        subjects: session.subject_names,
        duration: session.time_taken,
        durationMinutes: session.duration_minutes,
        difficulty: session.difficulty,
        sessionType: session.session_type,
        isCompleted: session.is_completed,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `practice-history-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          দেখানো হচ্ছে <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredSessions.length)}</span> এর <span className="font-semibold text-gray-900">{filteredSessions.length}</span> টি সেশন
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
          <p className="mt-4 text-gray-600 font-bengali text-lg font-medium">সেশন ইতিহাস লোড হচ্ছে...</p>
          <p className="text-gray-400 text-sm font-bengali mt-2">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
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
            <span className="text-sm text-gray-600 font-bengali font-medium">সেশন ইতিহাস</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-bengali bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text">
            প্র্যাকটিস সেশন ইতিহাস
          </h1>
          <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            আপনার পূর্ববর্তী সকল প্র্যাকটিস সেশনের সম্পূর্ণ ফলাফল এবং পরিসংখ্যান
          </p>
        </div>

        {error && (
          <div className="mb-6 p-6 bg-red-50 border-l-4 border-red-500 rounded-2xl">
            <p className="text-red-700 font-bengali">{error}</p>
            <button
              onClick={loadSessionHistory}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 text-sm font-bengali transition-all duration-200"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Stats and Controls */}
        {sessions.length > 0 && (
          <div className="mb-8 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {sessions.length}
                </div>
                <div className="text-sm text-gray-600 font-bengali font-medium">
                  মোট সেশন
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {sessions.length > 0
                    ? Math.round(
                        sessions.reduce(
                          (acc, session) => acc + getSessionScore(session),
                          0
                        ) / sessions.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600 font-bengali font-medium">
                  গড় স্কোর
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {sessions.reduce(
                    (acc, session) => acc + session.total_questions,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600 font-bengali font-medium">
                  মোট প্রশ্ন
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="text-3xl font-bold text-amber-600 mb-2">
                  {sessions.filter((s) => getSessionScore(s) >= 80).length}
                </div>
                <div className="text-sm text-gray-600 font-bengali font-medium">
                  চমৎকার সেশন
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="বিষয়, কঠিনতা বা ধরন অনুসন্ধান..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bengali bg-white/50 backdrop-blur-sm"
                    />
                    <svg
                      className="w-5 h-5 absolute left-4 top-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Sort */}
                  <div className="flex gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="date">তারিখ</option>
                      <option value="score">স্কোর</option>
                      <option value="questions">প্রশ্ন সংখ্যা</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={exportHistory}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-semibold font-bengali flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    এক্সপোর্ট
                  </button>
                  {sessions.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 font-semibold font-bengali transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      সব ডিলিট
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
              {sessions.length === 0
                ? "কোন সেশন পাওয়া যায়নি"
                : "কোন মিল পাওয়া যায়নি"}
            </h2>
            <p className="text-gray-600 mb-8 font-bengali text-lg max-w-md mx-auto leading-relaxed">
              {sessions.length === 0
                ? "আপনি এখনো কোন প্র্যাকটিস সেশন সম্পন্ন করেননি। নতুন সেশন শুরু করুন এবং আপনার দক্ষতা উন্নত করুন।"
                : "আপনার অনুসন্ধানের সাথে মিলে এমন কোন সেশন পাওয়া যায়নি। অনুগ্রহ করে অন্য বিষয় বা কঠিনতা দিয়ে চেষ্টা করুন।"}
            </p>
            {sessions.length === 0 && (
              <button
                onClick={() => router.push("/practice")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-10 rounded-xl hover:from-blue-600 hover:to-purple-700 font-semibold transition-all duration-200 font-bengali text-lg shadow-lg hover:shadow-xl"
              >
                প্রথম সেশন শুরু করুন
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedSessions.map((session) => {
              const sessionScore = getSessionScore(session);
              return (
                <div
                  key={session.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200/50"
                  onClick={() =>
                    router.push(`/practice/results/${session.id}`)
                  }
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-sm text-gray-500 font-bengali bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(
                            session.completed_at || session.started_at
                          )}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBgColor(
                            sessionScore
                          )}`}
                        >
                          {sessionScore >= 80
                            ? "চমৎকার 🎯"
                            : sessionScore >= 60
                            ? "ভালো 👍"
                            : sessionScore >= 40
                            ? "মধ্যম 📊"
                            : "প্রয়োজন উন্নতি 📈"}
                        </span>
                        {session.difficulty &&
                          session.difficulty !== "all" && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(session.difficulty)}`}>
                              {getDifficultyText(session.difficulty)}
                            </span>
                          )}
                        {!session.is_completed && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            অসম্পূর্ণ
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-3 font-bengali">
                        {session.subject_names?.join(", ") ||
                          "বিষয় পাওয়া যায়নি"}
                      </h3>

                      <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                        <span className="font-bengali flex items-center gap-1">
                          <span>❓</span>
                          {session.total_questions} টি প্রশ্ন
                        </span>
                        <span className="font-bengali flex items-center gap-1">
                          <span>⏱️</span>
                          {formatDuration(
                            session.duration_minutes || session.time_taken
                          )}
                        </span>
                        <span className="font-bengali flex items-center gap-1">
                          <span>📝</span>
                          {session.completed_questions || 0} উত্তর দেওয়া
                        </span>
                        {session.session_type && (
                          <span className="font-bengali flex items-center gap-1">
                            <span>🎯</span>
                            {session.session_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${getScoreColor(
                            sessionScore
                          )}`}
                        >
                          {sessionScore.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 font-bengali">
                          স্কোর
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-emerald-600">
                            {session.correct_answers || 0}
                          </div>
                          <div className="text-xs text-gray-600 font-bengali">
                            সঠিক
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-rose-600">
                            {session.wrong_answers || 0}
                          </div>
                          <div className="text-xs text-gray-600 font-bengali">
                            ভুল
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          disabled={isDeleting === session.id}
                          className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                          title="সেশন ডিলিট করুন"
                        >
                          {isDeleting === session.id ? (
                            <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                        <div className="text-gray-400">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <Pagination />
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/practice")}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-10 rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold transition-all duration-200 font-bengali text-lg shadow-lg hover:shadow-xl"
          >
            প্র্যাকটিস হোম
          </button>
        </div>
      </div>
    </div>
  );
}