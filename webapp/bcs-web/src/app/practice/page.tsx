// app/practice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useSearchParams, useRouter } from "next/navigation";

interface Subject {
  id: number;
  name: string;
  category_name: string;
}

export default function PracticePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      const subjectId = parseInt(subjectParam);
      if (!isNaN(subjectId)) {
        setSelectedSubjects([subjectId]);
      }
    }
    loadSubjects();
  }, [searchParams]);

  const loadSubjects = async () => {
    try {
      setSubjectsLoading(true);
      console.log("Loading subjects...");
      const data = await apiClient.get("/subjects/");
      console.log("Subjects loaded:", data);
      const subjectsData = Array.isArray(data) ? data : data.results || data;
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Failed to load subjects:", error);
      setError("বিষয়সমূহ লোড করতে সমস্যা হয়েছে");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const startPractice = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (selectedSubjects.length === 0) {
      setError("কমপক্ষে একটি বিষয় নির্বাচন করুন");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestData: any = {
        subjects: selectedSubjects,
        question_count: questionCount,
      };

      if (difficulty !== "all") {
        requestData.difficulty = difficulty;
      }

      console.log("Sending practice session request:", requestData);

      const response = await apiClient.post(
        "/practice-sessions/create_session/",
        requestData
      );

      console.log("Full API response object:", response);

      let sessionData;

      if (response.data) {
        sessionData = response.data;
        console.log("Session data from response.data:", sessionData);
      } else if (response) {
        sessionData = response;
        console.log("Session data from response:", sessionData);
      } else {
        console.log("Full response for debugging:", response);
        throw new Error("No session data found in response");
      }

      if (!sessionData) {
        throw new Error("Session data is null or undefined");
      }

      if (!sessionData.id) {
        console.error("Session data missing id:", sessionData);
        throw new Error("Session ID not found in response data");
      }

      console.log(
        "✅ Practice session created successfully. ID:",
        sessionData.id
      );

      router.push(`/practice/session/${sessionData.id}`);
    } catch (error: any) {
      console.error("❌ Failed to start practice:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "প্র্যাকটিস সেশন শুরু করতে সমস্যা হয়েছে";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
    setError(null);
  };

  const selectAllSubjects = () => {
    setSelectedSubjects(filteredSubjects.map(subject => subject.id));
  };

  const clearAllSubjects = () => {
    setSelectedSubjects([]);
  };

  // Filter subjects based on search and category
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || subject.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [
    ...new Set(subjects.map((subject) => subject.category_name)),
  ];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case 'medium': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'hard': return 'text-rose-600 bg-rose-100 border-rose-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getDifficultyText = (diff: string) => {
    switch (diff) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return 'সব স্তর';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20 mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-bengali font-medium">প্র্যাকটিস সেশন</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-bengali bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            প্র্যাকটিস সেশন
          </h1>
          <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            আপনার জ্ঞান পরীক্ষা করুন এবং দক্ষতা উন্নত করুন। বিষয়ভিত্তিক প্র্যাকটিসের মাধ্যমে বিসিএস পরীক্ষার জন্য প্রস্তুত হোন।
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-700 font-bengali text-lg">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-3 font-bengali text-gray-700">
                🔍 বিষয় বা বিভাগ অনুসন্ধান
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="বিষয় বা বিভাগের নাম লিখুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 pl-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                />
                <svg className="w-5 h-5 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 font-bengali text-gray-700">
                📂 বিভাগ ফিল্টার
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
              >
                <option value="all">সব বিভাগ</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Selection */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold font-bengali text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  📚
                </div>
                বিষয় নির্বাচন করুন
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-bengali bg-white/50 rounded-xl px-4 py-2 border border-gray-200/50">
                  <span className="font-semibold text-blue-600">{selectedSubjects.length}</span> টি বিষয় নির্বাচিত
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllSubjects}
                    className="text-sm bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-green-700 font-semibold transition-all duration-200 shadow-sm hover:shadow-md font-bengali"
                  >
                    সব নির্বাচন
                  </button>
                  <button
                    onClick={clearAllSubjects}
                    className="text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold transition-all duration-200 shadow-sm hover:shadow-md font-bengali"
                  >
                    সব মুছুন
                  </button>
                </div>
              </div>
            </div>

            {subjectsLoading ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-bengali text-lg font-medium">বিষয়সমূহ লোড হচ্ছে...</p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="text-gray-500 font-bengali text-lg mb-2">
                  কোন বিষয় পাওয়া যায়নি
                </p>
                <p className="text-gray-400 text-sm">
                  অনুগ্রহ করে আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করুন
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-160 overflow-y-auto p-4 bg-white/50 rounded-2xl border border-gray-200/50">
                {filteredSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      selectedSubjects.includes(subject.id)
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-white/80 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold font-bengali text-gray-900 text-lg mb-2 leading-relaxed">
                          {subject.name}
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full inline-block border border-gray-200">
                          {subject.category_name}
                        </div>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedSubjects.includes(subject.id)
                            ? "border-blue-500 bg-blue-500 text-white shadow-lg scale-110"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedSubjects.includes(subject.id) && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-8 bg-gradient-to-br from-blue-50/80 to-indigo-100/50 rounded-2xl border border-blue-200/50">
            <div>
              <label className="text-sm font-semibold mb-4 font-bengali text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white text-sm">
                  📊
                </div>
                কঠিনতা স্তর
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
              >
                <option value="all">সব স্তর</option>
                <option value="easy">সহজ</option>
                <option value="medium">মধ্যম</option>
                <option value="hard">কঠিন</option>
              </select>
              <div className="mt-3">
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getDifficultyColor(difficulty)}`}>
                  {getDifficultyText(difficulty)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-4 font-bengali text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm">
                  🔢
                </div>
                প্রশ্ন সংখ্যা
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
              >
                <option value={5}>৫ টি প্রশ্ন</option>
                <option value={10}>১০ টি প্রশ্ন</option>
                <option value={15}>১৫ টি প্রশ্ন</option>
                <option value={20}>২০ টি প্রশ্ন</option>
                <option value={25}>২৫ টি প্রশ্ন</option>
                <option value={30}>৩০ টি প্রশ্ন</option>
              </select>
              <div className="mt-3 text-sm text-gray-600 font-bengali">
                আনুমানিক সময়: <span className="font-semibold text-blue-600">{Math.ceil(questionCount * 1)} মিনিট</span>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="text-sm font-semibold mb-4 font-bengali text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm">
                    ⚡
                  </div>
                  সেশন সারাংশ
                </label>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-bengali">বিষয়:</span>
                      <span className="font-semibold text-gray-900">{selectedSubjects.length} টি</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-bengali">প্রশ্ন:</span>
                      <span className="font-semibold text-gray-900">{questionCount} টি</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-bengali">সময়:</span>
                      <span className="font-semibold text-gray-900">{Math.ceil(questionCount * 1)} মিনিট</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Subjects Info */}
          {selectedSubjects.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-700 font-bengali text-lg">
                    <span className="font-semibold">নির্বাচিত বিষয়:</span>{" "}
                    {selectedSubjects
                      .map((id) => {
                        const subject = subjects.find((s) => s.id === id);
                        return subject?.name;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startPractice}
              disabled={loading || selectedSubjects.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-5 px-16 rounded-2xl hover:from-blue-600 hover:to-purple-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl font-bengali relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <span className="flex items-center justify-center relative z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  সেশন তৈরি হচ্ছে...
                </span>
              ) : (
                <span className="flex items-center justify-center relative z-10">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  প্র্যাকটিস শুরু করুন
                </span>
              )}
            </button>

            {selectedSubjects.length === 0 && (
              <p className="text-gray-500 text-lg mt-6 font-bengali flex items-center justify-center gap-2">
                <span>👉</span>
                শুরু করতে কমপক্ষে একটি বিষয় নির্বাচন করুন
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}