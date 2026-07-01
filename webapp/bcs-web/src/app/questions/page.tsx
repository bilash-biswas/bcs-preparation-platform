// app/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { 
  BookOpen, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Calendar, 
  Hash, 
  FileQuestion, 
  Check, 
  Award,
  Sparkles,
  TrendingUp,
  Coins
} from "lucide-react";

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  id: number;
  question_text: string;
  explanation: string;
  question_type: string;
  difficulty: string;
  marks: number;
  negative_marks: number;
  subject_name: string;
  subject: number;
  options: Option[];
  created_at: string;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState<number[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
  });
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions();
      loadSubjects();
    }
  }, [isAuthenticated]);

  const loadQuestions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let url = "/questions/";
      const params = new URLSearchParams();

      if (filterSubject !== "all") {
        params.append("subject", filterSubject);
      }
      if (filterDifficulty !== "all") {
        params.append("difficulty", filterDifficulty);
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("page_size", "20"); // You can adjust page size as needed

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiClient.get(url);
      console.log("Questions loaded:", response);

      // Handle different response formats
      const questionsArray = Array.isArray(response)
        ? response
        : response.results || [];

      const paginationInfo: PaginationInfo = Array.isArray(response)
        ? {
            count: response.length,
            next: null,
            previous: null,
            current_page: 1,
            total_pages: 1,
          }
        : {
            count: response.count || questionsArray.length,
            next: response.next || null,
            previous: response.previous || null,
            current_page: page,
            total_pages: Math.ceil(
              (response.count || questionsArray.length) / 20
            ),
          };

      setQuestions(questionsArray);
      setPagination(paginationInfo);
    } catch (error: any) {
      console.error("Failed to load questions:", error);
      setError(error.message || "প্রশ্ন লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await apiClient.get("/subjects/");
      const subjectsArray = Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData.results || [];
      setSubjects(subjectsArray);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      loadQuestions(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterApply = () => {
    // Reset to first page when applying new filters
    loadQuestions(1);
  };

  const toggleAnswer = (questionId: number) => {
    setShowAnswers((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-450";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-450";
      case "hard":
        return "bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-450";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/50 dark:bg-slate-800/20 dark:text-slate-400";
    }
  };

  const getBengaliLabel = (index: number) => {
    const labels = ["ক", "খ", "গ", "ঘ", "ঙ"];
    return labels[index] || String.fromCharCode(65 + index);
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "সহজ";
      case "medium":
        return "মধ্যম";
      case "hard":
        return "কঠিন";
      default:
        return difficulty;
    }
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "mcq":
        return "বহুনির্বাচনী";
      case "true_false":
        return "সত্য/মিথ্যা";
      case "fill_blank":
        return "শূন্যস্থান পূরণ";
      default:
        return type;
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.current_page - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(
      pagination.total_pages,
      startPage + maxVisiblePages - 1
    );

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center transition-colors duration-300">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 text-center max-w-md shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-black text-[var(--foreground)] mb-3 font-bengali">
            লগইন প্রয়োজন
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 font-bengali">
            প্রশ্ন দেখতে আপনাকে লগইন করতে হবে
          </p>
          <Link
            href="/login/"
            className="w-full bg-primary-500 hover:bg-primary-hover text-white py-3 rounded-2xl font-bold font-bengali block text-sm shadow-sm transition-all duration-200"
          >
            লগইন করুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--background)] py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] mb-3 font-bengali tracking-tight">
              সমস্ত প্রশ্ন
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] font-bengali">
              সকল প্রশ্ন এবং তাদের সঠিক উত্তরসমূহ
            </p>
          </div>

          {/* Filters */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-extrabold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 font-bengali">
                  বিষয় নির্বাচন করুন
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full p-3 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-2xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bengali text-sm"
                >
                  <option value="all">সব বিষয়</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleFilterApply}
                className="w-full md:w-auto px-8 py-3 bg-primary-500 hover:bg-primary-hover text-white rounded-2xl font-bold font-bengali text-sm shadow-sm transition-all duration-200 cursor-pointer"
              >
                ফিল্টার প্রয়োগ করুন
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-bengali">{error}</p>
              <button
                onClick={() => loadQuestions(1)}
                className="mt-2 text-red-600 hover:text-red-800 font-semibold font-bengali"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-bengali">প্রশ্ন লোড হচ্ছে...</p>
            </div>
          )}

          {/* Questions List */}
          {!loading && questions.length > 0 && (
            <>
              <div className="space-y-4 mb-6">
                {questions.map((question, index) => {
                  const isAnswerVisible = showAnswers.includes(question.id);
                  return (
                    <div
                      key={question.id}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 mb-5 space-y-5 shadow-sm hover:shadow transition-all duration-300 overflow-hidden"
                    >
                      {/* Question Header */}
                      <div className="flex-1">
                        {/* Badges Bar */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[10px] font-extrabold text-[var(--muted-foreground)] uppercase tracking-widest font-bengali">
                            প্রশ্ন {(pagination.current_page - 1) * 20 + index + 1}
                          </span>
                          <span className="text-[10px] font-extrabold text-[var(--muted-foreground)] uppercase tracking-widest font-bengali">
                            বিষয়: {question.subject_name}
                          </span>
                        </div>

                        {/* Question Text */}
                        <h3 className="text-base font-extrabold text-[var(--foreground)] leading-normal font-bengali">
                          {question.question_text}
                        </h3>
                      </div>

                      {/* Options Container */}
                      <div className="pt-2">
                        <div className="space-y-2.5">
                          {question.options.map((option, optIdx) => {
                            const isCorrectAndVisible = isAnswerVisible && option.is_correct;
                            return (
                              <div
                                key={option.id}
                                className="p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between"
                                style={{
                                  borderColor: isCorrectAndVisible ? '#10b981' : 'var(--border)',
                                  backgroundColor: isCorrectAndVisible ? 'rgba(16, 185, 129, 0.08)' : 'var(--card)',
                                  color: isCorrectAndVisible ? '#10b981' : 'var(--foreground)',
                                }}
                              >
                                <div className="flex items-center flex-1 pr-3">
                                  {/* Choice Letter Bubble */}
                                  <div
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black mr-3 transition-colors duration-200 border"
                                    style={{
                                      borderColor: isCorrectAndVisible ? '#10b981' : 'var(--border)',
                                      backgroundColor: isCorrectAndVisible ? '#10b981' : 'var(--muted)',
                                      color: isCorrectAndVisible ? '#ffffff' : 'var(--muted-foreground)',
                                    }}
                                  >
                                    {isCorrectAndVisible ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : getBengaliLabel(optIdx)}
                                  </div>
                                  
                                  <span className="font-bengali text-sm leading-relaxed flex-1 font-semibold">
                                    {option.option_text}
                                  </span>
                                </div>
                                
                                {isCorrectAndVisible && (
                                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black font-bengali border border-emerald-500/20">
                                    সঠিক উত্তর
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* See Answer Action Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => toggleAnswer(question.id)}
                          className="px-4 py-2 text-xs font-bold rounded-xl border border-primary-500 text-primary-500 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer font-bengali flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isAnswerVisible ? "উত্তর লুকান" : "উত্তর দেখুন"}
                        </button>
                      </div>

                      {/* Explanation Card */}
                      {isAnswerVisible && question.explanation && (
                        <div>
                          <h4 className="text-xs font-extrabold text-[var(--muted-foreground)] uppercase tracking-widest mb-2 font-bengali">
                            ব্যাখ্যা:
                          </h4>
                          
                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/25 rounded-2xl">
                            <p className="text-[var(--foreground)] font-bengali leading-relaxed text-sm">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Page Info */}
                    <div className="text-sm text-[var(--muted-foreground)] font-bengali">
                      দেখানো হচ্ছে {(pagination.current_page - 1) * 20 + 1} -{" "}
                      {Math.min(pagination.current_page * 20, pagination.count)}{" "}
                      এর {pagination.count} টি প্রশ্ন
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() =>
                          handlePageChange(pagination.current_page - 1)
                        }
                        disabled={!pagination.previous}
                        className={`px-4 py-2 rounded-xl border font-bold text-xs transition-colors font-bengali ${
                          pagination.previous
                            ? "border-[var(--border)] text-[var(--foreground)] hover:bg-primary-50/20 cursor-pointer"
                            : "border-[var(--border)] text-slate-350 dark:text-slate-700 cursor-not-allowed"
                        }`}
                      >
                        পূর্ববর্তী
                      </button>

                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {generatePageNumbers().map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-colors ${
                              page === pagination.current_page
                                ? "bg-primary-500 border-primary-500 text-white"
                                : "border-[var(--border)] text-[var(--foreground)] hover:bg-primary-50/20 cursor-pointer"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() =>
                          handlePageChange(pagination.current_page + 1)
                        }
                        disabled={!pagination.next}
                        className={`px-4 py-2 rounded-xl border font-bold text-xs transition-colors font-bengali ${
                          pagination.next
                            ? "border-[var(--border)] text-[var(--foreground)] hover:bg-primary-50/20 cursor-pointer"
                            : "border-[var(--border)] text-slate-350 dark:text-slate-700 cursor-not-allowed"
                        }`}
                      >
                        পরবর্তী
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && questions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-bengali">
                কোন প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="text-gray-500 font-bengali mb-6">
                {filterSubject !== "all" || filterDifficulty !== "all"
                  ? "ফিল্টারের সাথে মিলিয়ে কোন প্রশ্ন পাওয়া যায়নি। অন্য ফিল্টার চেষ্টা করুন।"
                  : "এখনও কোন প্রশ্ন যোগ করা হয়নি।"}
              </p>
              {(filterSubject !== "all" || filterDifficulty !== "all") && (
                <button
                  onClick={() => {
                    setFilterSubject("all");
                    setFilterDifficulty("all");
                    loadQuestions(1);
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors font-bengali"
                >
                  সব ফিল্টার সরান
                </button>
              )}
            </div>
          )}

          {/* Statistics */}
          {!loading && questions.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 font-bengali">
                পরিসংখ্যান
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pagination.count}
                  </div>
                  <div className="text-gray-600 font-bengali">মোট প্রশ্ন</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {questions.filter((q) => q.difficulty === "easy").length}
                  </div>
                  <div className="text-gray-600 font-bengali">সহজ প্রশ্ন</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {questions.filter((q) => q.difficulty === "medium").length}
                  </div>
                  <div className="text-gray-600 font-bengali">মধ্যম প্রশ্ন</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {questions.filter((q) => q.difficulty === "hard").length}
                  </div>
                  <div className="text-gray-600 font-bengali">কঠিন প্রশ্ন</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
