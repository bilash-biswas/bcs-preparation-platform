// app/quizzes/page.tsx - CORRECTED VERSION
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

interface Subject {
  id: number;
  name: string;
  category_name: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  subjects: Subject[];
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  is_published?: boolean;
}

interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_title: string;
  score: string;
  total_marks: number;
  time_taken: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  user_answers: any[];
  performance_stats?: {
    total_answered: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy: number;
  };
}

// Helper function to get subject name
const getSubjectName = (quiz: Quiz): string => {
  if (quiz.subjects && quiz.subjects.length > 0) {
    const firstSubject = quiz.subjects[0];
    if (typeof firstSubject === "string") {
      return firstSubject;
    } else if (
      firstSubject &&
      typeof firstSubject === "object" &&
      firstSubject.name
    ) {
      return firstSubject.name;
    }
  }
  return "সাধারণ";
};

// Helper function to get difficulty color
const getDifficultyColor = (difficulty: string | undefined): string => {
  const difficultyLevel = difficulty?.toLowerCase() || "medium";
  switch (difficultyLevel) {
    case "easy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "hard":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Helper function to get difficulty display text
const getDifficultyText = (difficulty: string | undefined): string => {
  const difficultyLevel = difficulty?.toLowerCase() || "medium";
  switch (difficultyLevel) {
    case "easy":
      return "সহজ";
    case "medium":
      return "মধ্যম";
    case "hard":
      return "কঠিন";
    default:
      return difficulty || "মধ্যম";
  }
};

// Helper function to get score color
const getScoreColor = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 80) return "text-emerald-600";
  if (percentage >= 60) return "text-amber-600";
  return "text-rose-600";
};

// Helper function to get score background color
const getScoreBgColor = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 80)
    return "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200";
  if (percentage >= 60)
    return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200";
  return "bg-gradient-to-r from-rose-50 to-red-50 border-rose-200";
};

// Helper function to safely format date
const formatDate = (dateString: string): string => {
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
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return "0 মিনিট 0 সেকেন্ড";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins} মিনিট ${secs} সেকেন্ড`;
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "attempts">(
    "available"
  );
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes();
    }
  }, [isAuthenticated]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading quizzes data...");

      // Load available quizzes
      const quizzesData = await apiClient.get("/quizzes/available/");
      console.log("Available quizzes raw data:", quizzesData);

      // Load user's quiz attempts
      const attemptsData = await apiClient.get("/attempts/");
      console.log("Quiz attempts raw data:", attemptsData);

      // Process available quizzes
      const allQuizzes: Quiz[] = (
        Array.isArray(quizzesData) ? quizzesData : quizzesData.results || []
      ).map((quiz: any) => {
        let subjects: Subject[] = [];
        if (Array.isArray(quiz.subjects)) {
          subjects = quiz.subjects.map((subject: any) => {
            if (typeof subject === "string") {
              return { id: 0, name: subject, category_name: "সাধারণ" };
            } else if (subject && typeof subject === "object") {
              return {
                id: subject.id || 0,
                name: subject.name || "অজানা বিষয়",
                category_name: subject.category_name || "সাধারণ",
              };
            }
            return { id: 0, name: "অজানা বিষয়", category_name: "সাধারণ" };
          });
        } else {
          subjects = [{ id: 0, name: "সাধারণ", category_name: "সাধারণ" }];
        }

        return {
          id: quiz.id || 0,
          title: quiz.title || "কুইজের নাম নেই",
          description: quiz.description || "",
          subjects: subjects,
          duration_minutes: quiz.time_limit || quiz.duration_minutes || 30,
          total_marks: quiz.total_marks || 100,
          total_questions: quiz.total_questions || 10,
          difficulty: quiz.difficulty || "medium",
          is_active: quiz.is_active !== false,
          is_published: quiz.is_published !== false,
          created_at: quiz.created_at || new Date().toISOString(),
        };
      });

      console.log("Processed ALL quizzes:", allQuizzes);

      // Process all attempts
      const allAttempts: QuizAttempt[] = Array.isArray(attemptsData)
        ? attemptsData
        : attemptsData.results || [];

      console.log("All user attempts:", allAttempts);

      setQuizzes(allQuizzes);
      setAttempts(allAttempts);
    } catch (error: any) {
      console.error("Failed to load quizzes:", error);
      setError(error.message || "কুইজ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId: number) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      setError(null);

      const attempt = await apiClient.post("/quizzes/start/", {
        quiz: quizId,
      });

      console.log("Quiz attempt response:", attempt);

      const attemptId = attempt.id || attempt.quiz_attempt_id;

      if (attemptId) {
        if (attempt.existing) {
          console.log("Resuming existing attempt:", attemptId);
        } else {
          console.log("New attempt created:", attemptId);
        }

        window.location.href = `/quizzes/attempt/${attemptId}`;
      } else {
        setError("কুইজ শুরু করতে সমস্যা হয়েছে");
      }
    } catch (error: any) {
      console.error("Failed to start quiz:", error);
      setError(error.message || "কুইজ শুরু করতে সমস্যা হয়েছে");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md border border-white/20">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
            লগইন প্রয়োজন
          </h2>
          <p className="text-gray-600 mb-6 font-bengali leading-relaxed">
            কুইজ দেখতে এবং অংশগ্রহণ করতে আপনাকে লগইন করতে হবে
          </p>
          <Link
            href="/login"
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 px-6 rounded-2xl hover:from-red-600 hover:to-rose-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl block font-bengali text-lg"
          >
            লগইন করুন
          </Link>
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
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-bengali font-medium">
              কুইজ প্ল্যাটফর্ম
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-bengali bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
            কুইজ সমূহ
          </h1>
          <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            আপনার জ্ঞান পরীক্ষা করুন এবং দক্ষতা উন্নত করুন। বিভিন্ন বিষয়ের উপর
            কুইজ দিন এবং আপনার স্কোর দেখুন।
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-bengali text-lg">{error}</p>
              </div>
              <button
                onClick={loadQuizzes}
                className="text-red-600 hover:text-red-800 font-semibold font-bengali px-4 py-2 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-all duration-200"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl mb-8 border border-white/20">
          <div className="border-b border-gray-200/50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 py-6 px-8 text-center font-semibold text-lg border-b-2 transition-all duration-300 font-bengali flex items-center justify-center gap-3 ${
                  activeTab === "available"
                    ? "border-red-500 text-red-600 bg-gradient-to-r from-red-50 to-rose-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    activeTab === "available"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {quizzes.length}
                </span>
                উপলব্ধ কুইজ
              </button>
              <button
                onClick={() => setActiveTab("attempts")}
                className={`flex-1 py-6 px-8 text-center font-semibold text-lg border-b-2 transition-all duration-300 font-bengali flex items-center justify-center gap-3 ${
                  activeTab === "attempts"
                    ? "border-red-500 text-red-600 bg-gradient-to-r from-red-50 to-rose-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    activeTab === "attempts"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {attempts.length}
                </span>
                আমার Attempts
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-16 justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-bengali text-lg font-medium">
                  কুইজ লোড হচ্ছে...
                </p>
                <p className="text-gray-400 text-sm font-bengali mt-2">
                  অনুগ্রহ করে একটু অপেক্ষা করুন
                </p>
              </div>
            ) : activeTab === "available" ? (
              <AvailableQuizzes
                quizzes={quizzes}
                onStartQuiz={startQuiz}
              />
            ) : (
              <MyAttempts attempts={attempts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Available Quizzes Component
interface AvailableQuizzesProps {
  quizzes: Quiz[];
  onStartQuiz: (quizId: number) => void;
}

function AvailableQuizzes({ quizzes, onStartQuiz }: AvailableQuizzesProps) {
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
          কোন কুইজ পাওয়া যায়নি
        </h3>
        <p className="text-gray-500 font-bengali text-lg max-w-md mx-auto leading-relaxed">
          বর্তমানে কোন নতুন কুইজ উপলব্ধ নেই। অনুগ্রহ করে কিছুক্ষণ পর আবার চেক
          করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-6 border-2 border-gray-200/50 hover:border-red-300 transition-all duration-300 hover:shadow-xl group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 font-bengali line-clamp-2 mb-2 group-hover:text-red-600 transition-colors duration-300">
                {quiz.title}
              </h3>
              <span
                className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(
                  quiz.difficulty
                )}`}
              >
                {getDifficultyText(quiz.difficulty)}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6 line-clamp-2 font-bengali leading-relaxed">
            {quiz.description || `${getSubjectName(quiz)} বিষয়ক কুইজ`}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bengali flex items-center gap-2">
                <span>📚</span>
                বিষয়
              </span>
              <span className="font-semibold text-gray-900 font-bengali">
                {getSubjectName(quiz)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bengali flex items-center gap-2">
                <span>⏱️</span>
                সময়
              </span>
              <span className="font-semibold text-gray-900">
                {quiz.duration_minutes} মিনিট
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bengali flex items-center gap-2">
                <span>❓</span>
                প্রশ্ন
              </span>
              <span className="font-semibold text-gray-900">
                {quiz.total_questions} টি
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bengali flex items-center gap-2">
                <span>⭐</span>
                মার্কস
              </span>
              <span className="font-semibold text-gray-900">
                {quiz.total_marks}
              </span>
            </div>
          </div>

          <button
            onClick={() => onStartQuiz(quiz.id)}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 px-6 rounded-2xl hover:from-red-600 hover:to-rose-700 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bengali text-lg flex items-center justify-center gap-3 group/btn"
          >
            <span>🚀</span>
            কুইজ শুরু করুন
            <span className="group-hover/btn:translate-x-1 transition-transform duration-300">
              →
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

// My Attempts Component
interface MyAttemptsProps {
  attempts: QuizAttempt[];
}

function MyAttempts({ attempts }: MyAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📊</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 font-bengali">
          কোন Attempt নেই
        </h3>
        <p className="text-gray-500 font-bengali text-lg max-w-md mx-auto leading-relaxed">
          আপনি এখনো কোন কুইজ Attempt করেননি। উপলব্ধ কুইজ থেকে একটি নির্বাচন করুন
          এবং শুরু করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attempts.map((attempt) => {
        const score = parseFloat(attempt.score) || 0;
        const percentage = attempt.total_marks > 0 
          ? Math.round((score / attempt.total_marks) * 100) 
          : 0;

        return (
          <div
            key={attempt.id}
            className={`bg-gradient-to-br rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
              attempt.is_completed 
                ? getScoreBgColor(score, attempt.total_marks)
                : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 font-bengali">
                    {attempt.quiz_title || `কুইজ #${attempt.quiz}`}
                  </h3>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                      attempt.is_completed 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }`}
                  >
                    {attempt.is_completed ? "সম্পন্ন" : "চলমান"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-2">
                    <span>🆔</span>
                    Attempt #{attempt.id}
                  </span>
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    {formatDate(attempt.started_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span>⏱️</span>
                    {formatTime(attempt.time_taken)}
                  </span>
                  {attempt.is_completed && (
                    <span className="flex items-center gap-2">
                      <span>✅</span>
                      {formatDate(attempt.completed_at!)}
                    </span>
                  )}
                </div>

                {attempt.is_completed && (
                  <>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                          percentage >= 80
                            ? "bg-gradient-to-r from-emerald-400 to-green-500"
                            : percentage >= 60
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                            : "bg-gradient-to-r from-rose-400 to-red-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-bengali">অগ্রগতি</span>
                      <span>{percentage}%</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col items-center lg:items-end gap-4">
                {attempt.is_completed ? (
                  <>
                    <div className="text-center lg:text-right">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          score,
                          attempt.total_marks
                        )}`}
                      >
                        {score} / {attempt.total_marks}
                      </div>
                      <div className="text-sm text-gray-600 font-bengali mt-1">
                        স্কোর: {percentage}%
                      </div>
                    </div>

                    <Link
                      href={`/quizzes/results/${attempt.id}`}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-bengali flex items-center gap-2"
                    >
                      <span>📈</span>
                      বিস্তারিত দেখুন
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-center lg:text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        চলমান
                      </div>
                      <div className="text-sm text-gray-600 font-bengali mt-1">
                        এখনো সম্পন্ন হয়নি
                      </div>
                    </div>

                    <Link
                      href={`/quizzes/attempt/${attempt.id}`}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-bengali flex items-center gap-2"
                    >
                      <span>➡️</span>
                      চালিয়ে যান
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Performance Stats */}
            {attempt.is_completed && attempt.performance_stats && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-600 font-bold text-lg">
                      {attempt.performance_stats.correct_answers}
                    </div>
                    <div className="text-gray-600 font-bengali">সঠিক</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-bold text-lg">
                      {attempt.performance_stats.wrong_answers}
                    </div>
                    <div className="text-gray-600 font-bengali">ভুল</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 font-bold text-lg">
                      {attempt.performance_stats.total_answered}
                    </div>
                    <div className="text-gray-600 font-bengali">মোট উত্তর</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-600 font-bold text-lg">
                      {attempt.performance_stats.accuracy}%
                    </div>
                    <div className="text-gray-600 font-bengali">সঠিকতা</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}