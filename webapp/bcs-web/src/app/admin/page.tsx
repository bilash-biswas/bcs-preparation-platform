// src/app/admin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import { MathDisplay } from "@/components/math-equation/MathDisplay";
import {
  Users,
  BookOpen,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  Settings,
  Sparkles,
  X
} from "lucide-react";

interface Subject {
  id: number;
  name: string;
  category_name?: string;
}

interface Option {
  id?: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  id: number;
  question_text: string;
  subject: number;
  subject_name?: string;
  question_type: string;
  difficulty: string;
  explanation: string;
  marks: number;
  is_active: boolean;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit: number;
  total_questions: number;
  total_marks: number;
  negative_marking: boolean;
  is_published: boolean;
  subjects: number[] | any[];
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  coins: number;
  streak: number;
  is_active: boolean;
  is_premium: boolean;
  premium_expiry?: string;
}

type TabType = "users" | "quizzes" | "questions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data lists
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // Edit Modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  const renderMathPreview = (text: string) => {
    if (!text) return null;
    return text.split("$").map((part, index) => {
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        return (
          <span key={index} className="inline-block mx-1">
            <MathDisplay content={part} displayMode={false} />
          </span>
        );
      }
    });
  };

  useEffect(() => {
    // Check permission
    if (!authLoading) {
      if (!isAuthenticated || !user || user.user_type !== "admin") {
        // Not admin
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [authLoading, isAuthenticated, user, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subjects list for dropdowns (loaded once)
      if (subjects.length === 0) {
        const subjectsData = await apiClient.get("/subjects/");
        const subjectsList = Array.isArray(subjectsData)
          ? subjectsData
          : (subjectsData && Array.isArray(subjectsData.results) ? subjectsData.results : []);
        setSubjects(subjectsList);
      }

      if (activeTab === "users") {
        const usersData = await apiClient.get("/admin/users/");
        const usersList = Array.isArray(usersData)
          ? usersData
          : (usersData && Array.isArray(usersData.results) ? usersData.results : []);
        setUsers(usersList);
      } else if (activeTab === "quizzes") {
        const quizzesData = await apiClient.get("/quizzes/");
        const quizzesList = Array.isArray(quizzesData)
          ? quizzesData
          : (quizzesData && Array.isArray(quizzesData.results) ? quizzesData.results : []);
        setQuizzes(quizzesList);
      } else if (activeTab === "questions") {
        const questionsData = await apiClient.get("/questions/");
        const questionsList = Array.isArray(questionsData)
          ? questionsData
          : (questionsData && Array.isArray(questionsData.results) ? questionsData.results : []);
        setQuestions(questionsList);
      }
    } catch (err: any) {
      console.error("Failed to fetch admin data:", err);
      setError("ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm("");
    setDifficultyFilter("");
    setSubjectFilter("");
    setError(null);
    setSuccessMsg(null);
  };

  // --- USER HANDLERS ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await apiClient.patch(`/admin/users/${editingUser.id}/`, {
        user_type: editingUser.user_type,
        coins: editingUser.coins,
        streak: editingUser.streak,
        is_active: editingUser.is_active,
        is_premium: editingUser.is_premium,
        premium_expiry: editingUser.is_premium && !editingUser.premium_expiry 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // default 30 days
          : editingUser.premium_expiry
      });
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      showSuccess("ইউজার সফলভাবে আপডেট করা হয়েছে।");
    } catch (err: any) {
      setError("ইউজার আপডেট ব্যর্থ হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  // --- QUIZ HANDLERS ---
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;
    try {
      setActionLoading(true);
      setError(null);

      // Extract raw IDs if subjects contains full objects
      const subjectIds = Array.isArray(editingQuiz.subjects)
        ? editingQuiz.subjects.map((s: any) => (typeof s === "object" ? s.id : s))
        : [];

      const payload = {
        title: editingQuiz.title,
        description: editingQuiz.description || "",
        time_limit: Number(editingQuiz.time_limit) || 30,
        total_questions: Number(editingQuiz.total_questions) || 10,
        total_marks: Number(editingQuiz.total_marks) || 10,
        negative_marking: !!editingQuiz.negative_marking,
        is_published: !!editingQuiz.is_published,
        subjects: subjectIds
      };

      if (editingQuiz.id) {
        // Edit existing
        const updated = await apiClient.patch(`/quizzes/${editingQuiz.id}/`, payload);
        setQuizzes((prev) => prev.map((q) => (q.id === editingQuiz.id ? updated : q)));
        showSuccess("কুইজ সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Create new
        const created = await apiClient.post("/quizzes/", payload);
        setQuizzes((prev) => [created, ...prev]);
        showSuccess("নতুন কুইজ তৈরি করা হয়েছে।");
      }
      setEditingQuiz(null);
    } catch (err: any) {
      setError("কুইজ সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই কুইজটি মুছে ফেলতে চান?")) return;
    try {
      setActionLoading(true);
      await apiClient.delete(`/quizzes/${quizId}/`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      showSuccess("কুইজ মুছে ফেলা হয়েছে।");
    } catch (err) {
      setError("কুইজ মুছতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  // --- QUESTION HANDLERS ---
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      setActionLoading(true);
      setError(null);

      // Verify that options have at least one correct choice
      const hasCorrect = editingQuestion.options?.some((o) => o.is_correct);
      if (!hasCorrect) {
        setError("অবশ্যই অন্তত একটি সঠিক উত্তর নির্বাচন করতে হবে।");
        setActionLoading(false);
        return;
      }

      const payload = {
        subject: Number(editingQuestion.subject),
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type || "mcq",
        difficulty: editingQuestion.difficulty || "medium",
        explanation: editingQuestion.explanation || "",
        marks: Number(editingQuestion.marks) || 1,
        is_active: editingQuestion.is_active !== false,
        options: editingQuestion.options
      };

      if (editingQuestion.id) {
        // Edit existing
        const updated = await apiClient.patch(`/questions/${editingQuestion.id}/`, payload);
        setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? updated : q)));
        showSuccess("প্রশ্ন সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Create new
        const created = await apiClient.post("/questions/", payload);
        setQuestions((prev) => [created, ...prev]);
        showSuccess("নতুন প্রশ্ন সফলভাবে তৈরি করা হয়েছে।");
      }
      setEditingQuestion(null);
    } catch (err: any) {
      setError("প্রশ্ন সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি মুছে ফেলতে চান?")) return;
    try {
      setActionLoading(true);
      await apiClient.delete(`/questions/${questionId}/`);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showSuccess("প্রশ্ন মুছে ফেলা হয়েছে।");
    } catch (err) {
      setError("প্রশ্ন মুছতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptionChange = (index: number, field: keyof Option, value: any) => {
    if (!editingQuestion || !editingQuestion.options) return;
    const updatedOptions = [...editingQuestion.options];
    
    if (field === "is_correct" && value === true) {
      // If single choice, uncheck other choices
      updatedOptions.forEach((o, i) => {
        if (i !== index) o.is_correct = false;
      });
    }

    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- RENDERING SECURITY PAGE ---
  if (!authLoading && (!isAuthenticated || !user || user.user_type !== "admin")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-md border border-slate-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 font-bengali">অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে</h2>
          <p className="text-slate-500 mb-5 font-bengali text-sm">
            এই পেজটি শুধুমাত্র এডমিন ব্যবহারকারীদের জন্য সংরক্ষিত। অনুগ্রহ করে সঠিক অ্যাকাউন্ট দিয়ে লগইন করুন।
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-bengali text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ড্যাশবোর্ডে ফিরে যান</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.last_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter((q) =>
    (q.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuestions = questions.filter((q) => {
    const textMatch = (q.question_text || "").toLowerCase().includes(searchTerm.toLowerCase());
    const difficultyMatch = difficultyFilter === "" || q.difficulty === difficultyFilter;
    const subjectMatch = subjectFilter === "" || String(q.subject) === subjectFilter;
    return textMatch && difficultyMatch && subjectMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Title and stats bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 font-bengali flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-650" />
              <span>সিস্টেম এডমিন প্যানেল</span>
            </h1>
            <p className="text-xs text-slate-450 mt-1 font-bengali">ইউজার, কুইজ এবং প্রশ্নের তথ্য পরিচালনা করুন</p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
              👥 {users.length} ইউজার
            </span>
            <span className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
              📚 {quizzes.length} কুইজ
            </span>
            <span className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
              ❓ {questions.length} প্রশ্ন
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-semibold rounded-r-lg font-bengali flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-semibold rounded-r-lg font-bengali">
            {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl overflow-hidden">
          <button
            onClick={() => handleTabChange("users")}
            className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 font-bengali flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ইউজার ব্যবস্থাপনা</span>
          </button>
          <button
            onClick={() => handleTabChange("quizzes")}
            className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 font-bengali flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "quizzes"
                ? "border-indigo-600 text-indigo-600 bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>কুইজসমূহ</span>
          </button>
          <button
            onClick={() => handleTabChange("questions")}
            className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 font-bengali flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "questions"
                ? "border-indigo-600 text-indigo-600 bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>প্রশ্ন ভান্ডার</span>
          </button>
        </div>

        {/* Action Controls & Search (Always Visible) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === "users"
                  ? "ইউজার খুঁজুন..."
                  : activeTab === "quizzes"
                  ? "কুইজ খুঁজুন..."
                  : "প্রশ্ন খুঁজুন..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-bengali font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            {activeTab === "questions" && (
              <>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold font-bengali text-slate-650 bg-white"
                >
                  <option value="">সকল কঠিনতা</option>
                  <option value="easy">সহজ</option>
                  <option value="medium">মধ্যম</option>
                  <option value="hard">কঠিন</option>
                </select>
                
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold font-bengali text-slate-650 bg-white max-w-[160px]"
                >
                  <option value="">সকল বিষয়</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}

            {activeTab === "quizzes" && (
              <button
                onClick={() => setEditingQuiz({ title: "", description: "", time_limit: 30, total_questions: 10, total_marks: 10, negative_marking: false, is_published: false, subjects: [] })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bengali text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কুইজ</span>
              </button>
            )}

            {activeTab === "questions" && (
              <button
                onClick={() =>
                  setEditingQuestion({
                    question_text: "",
                    subject: subjects[0]?.id || 1,
                    question_type: "mcq",
                    difficulty: "medium",
                    explanation: "",
                    marks: 1,
                    is_active: true,
                    options: [
                      { option_text: "", is_correct: false, order: 0 },
                      { option_text: "", is_correct: false, order: 1 },
                      { option_text: "", is_correct: false, order: 2 },
                      { option_text: "", is_correct: false, order: 3 }
                    ]
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bengali text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন প্রশ্ন</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Tab 1: Users Table */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 font-bengali">
                      <th className="p-4">ইউজারনেম</th>
                      <th className="p-4">ইমেইল</th>
                      <th className="p-4">টাইপ</th>
                      <th className="p-4 text-center">কয়েন</th>
                      <th className="p-4 text-center">প্রিমিয়াম</th>
                      <th className="p-4 text-center">স্ট্যাটাস</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold">{u.username}</td>
                          <td className="p-4 text-slate-500">{u.email}</td>
                          <td className="p-4 uppercase text-xs font-bold text-indigo-650">{u.user_type}</td>
                          <td className="p-4 text-center font-bold text-amber-600">🪙 {u.coins}</td>
                          <td className="p-4 text-center">
                            {u.is_premium ? (
                              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">সক্রিয়</span>
                            ) : (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">না</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {u.is_active ? (
                              <span className="text-emerald-600">সক্রিয়</span>
                            ) : (
                              <span className="text-rose-500">নিষ্ক্রিয়</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="text-slate-500 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer inline-flex"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bengali">কোনো ইউজার পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Quizzes Table */}
            {activeTab === "quizzes" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 font-bengali">
                      <th className="p-4">কুইজ শিরোনাম</th>
                      <th className="p-4 text-center">প্রশ্ন সংখ্যা</th>
                      <th className="p-4 text-center">পূর্ণমান</th>
                      <th className="p-4 text-center">সময় সীমা</th>
                      <th className="p-4 text-center">প্রকাশিত</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredQuizzes.length > 0 ? (
                      filteredQuizzes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold">{q.title}</td>
                          <td className="p-4 text-center">{q.total_questions}</td>
                          <td className="p-4 text-center font-semibold text-slate-800">{q.total_marks}</td>
                          <td className="p-4 text-center text-slate-500">{q.time_limit} মিনিট</td>
                          <td className="p-4 text-center">
                            {q.is_published ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-right gap-1 space-x-1.5">
                            <button
                              onClick={() => setEditingQuiz(q)}
                              className="text-slate-500 hover:text-indigo-600 p-1.5 cursor-pointer inline-flex"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(q.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer inline-flex"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bengali">কোনো কুইজ পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Questions Table */}
            {activeTab === "questions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 font-bengali">
                      <th className="p-4">প্রশ্ন</th>
                      <th className="p-4">বিষয়</th>
                      <th className="p-4 text-center">কঠিনতা</th>
                      <th className="p-4 text-center">মার্কস</th>
                      <th className="p-4 text-center">অবস্থা</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-800 max-w-sm truncate font-bengali">{q.question_text}</td>
                          <td className="p-4 text-xs font-bold text-indigo-750">{q.subject_name || `ID: ${q.subject}`}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              q.difficulty === "easy"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.difficulty === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {q.difficulty === "easy" ? "সহজ" : q.difficulty === "medium" ? "মধ্যম" : "কঠিন"}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold">{q.marks}</td>
                          <td className="p-4 text-center">
                            {q.is_active ? (
                              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-100">সক্রিয়</span>
                            ) : (
                              <span className="text-xs bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-semibold border border-slate-200">নিষ্ক্রিয়</span>
                            )}
                          </td>
                          <td className="p-4 text-right gap-1 space-x-1.5">
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="text-slate-500 hover:text-indigo-600 p-1.5 cursor-pointer inline-flex"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer inline-flex"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bengali">কোনো প্রশ্ন পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* --- USER EDIT MODAL --- */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="font-bold text-slate-800 font-bengali">ইউজার তথ্য সংশোধন</h3>
              </div>
              <form onSubmit={handleSaveUser} className="p-5 space-y-4 font-bengali">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ব্যবহারকারী</label>
                  <p className="text-sm font-bold text-slate-850">{editingUser.username} ({editingUser.email})</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">কয়েন</label>
                    <input
                      type="number"
                      value={editingUser.coins}
                      onChange={(e) => setEditingUser({ ...editingUser, coins: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">স্ট্রিক</label>
                    <input
                      type="number"
                      value={editingUser.streak}
                      onChange={(e) => setEditingUser({ ...editingUser, streak: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ইউজার টাইপ</label>
                  <select
                    value={editingUser.user_type}
                    onChange={(e) => setEditingUser({ ...editingUser, user_type: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="student">Student (শিক্ষার্থী)</option>
                    <option value="teacher">Teacher (শিক্ষক)</option>
                    <option value="admin">Admin (এডমিন)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-750">
                    <input
                      type="checkbox"
                      checked={editingUser.is_active}
                      onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>সক্রিয় ইউজার</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-750">
                    <input
                      type="checkbox"
                      checked={editingUser.is_premium}
                      onChange={(e) => setEditingUser({ ...editingUser, is_premium: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>প্রিমিয়াম মেম্বার</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-slate-250 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- QUIZ EDIT MODAL --- */}
        {editingQuiz && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="font-bold text-slate-800 font-bengali">
                  {editingQuiz.id ? "কুইজ তথ্য সংশোধন" : "নতুন কুইজ তৈরি"}
                </h3>
              </div>
              <form onSubmit={handleSaveQuiz} className="p-5 space-y-4 font-bengali">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">কুইজ শিরোনাম</label>
                  <input
                    type="text"
                    required
                    value={editingQuiz.title || ""}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">কুইজ বিবরণ</label>
                  <textarea
                    rows={2}
                    value={editingQuiz.description || ""}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">প্রশ্ন সংখ্যা</label>
                    <input
                      type="number"
                      required
                      value={editingQuiz.total_questions || 0}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, total_questions: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">পূর্ণমান</label>
                    <input
                      type="number"
                      required
                      value={editingQuiz.total_marks || 0}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, total_marks: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">সময় সীমা (মিনিট)</label>
                    <input
                      type="number"
                      required
                      value={editingQuiz.time_limit || 0}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, time_limit: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">সংশ্লিষ্ট বিষয়সমূহ</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {subjects.map((sub) => {
                      const isChecked = Array.isArray(editingQuiz.subjects) && editingQuiz.subjects.some((s) => (typeof s === "object" ? s.id === sub.id : s === sub.id));
                      return (
                        <label key={sub.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentIds = Array.isArray(editingQuiz.subjects) 
                                ? editingQuiz.subjects.map((s) => (typeof s === "object" ? s.id : s))
                                : [];
                              if (e.target.checked) {
                                setEditingQuiz({ ...editingQuiz, subjects: [...currentIds, sub.id] });
                              } else {
                                setEditingQuiz({ ...editingQuiz, subjects: currentIds.filter((id) => id !== sub.id) });
                              }
                            }}
                            className="rounded text-indigo-650"
                          />
                          <span>{sub.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-750">
                    <input
                      type="checkbox"
                      checked={!!editingQuiz.negative_marking}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, negative_marking: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>নেগেটিভ মার্কিং সক্রিয় করুন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-750">
                    <input
                      type="checkbox"
                      checked={!!editingQuiz.is_published}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, is_published: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>অনলাইন কুইজ প্রকাশ করুন (Publish)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingQuiz(null)}
                    className="px-4 py-2 border border-slate-250 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- QUESTION EDIT MODAL --- */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 font-bengali">
                  {editingQuestion.id ? "প্রশ্ন সংশোধন" : "নতুন প্রশ্ন তৈরি করুন"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveQuestion} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-5 font-bengali overflow-y-auto flex-1">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">বিষয় নির্বাচন</label>
                    <select
                      required
                      value={editingQuestion.subject || ""}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">কঠিনতার স্তর</label>
                    <select
                      required
                      value={editingQuestion.difficulty || "medium"}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="easy">Easy (সহজ)</option>
                      <option value="medium">Medium (মধ্যম)</option>
                      <option value="hard">Hard (কঠিন)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">প্রশ্নের মূল বিবরণ (Text)</label>
                  <textarea
                    rows={3}
                    required
                    value={editingQuestion.question_text || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {editingQuestion.question_text && editingQuestion.question_text.includes("$") && (
                    <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-xs">
                      <span className="font-bold text-slate-400 block mb-1">সমীকরণ প্রিভিউ:</span>
                      <div className="text-slate-800 leading-relaxed font-sans">
                        {renderMathPreview(editingQuestion.question_text)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Options List */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">উত্তর অপশনসমূহ (Mcq Option list)</label>
                  <div className="space-y-2">
                    {editingQuestion.options?.map((option, idx) => {
                      const letters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg animate-in fade-in duration-100">
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-xs font-bold text-slate-500 w-5">{letters[idx] || (idx + 1)}</span>
                            <input
                              type="text"
                              required
                              placeholder="অপশন বিবরণ লিখুন..."
                              value={option.option_text || ""}
                              onChange={(e) => handleOptionChange(idx, "option_text", e.target.value)}
                              className="flex-1 p-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={option.is_correct}
                                onChange={(e) => handleOptionChange(idx, "is_correct", e.target.checked)}
                                className="rounded text-emerald-500 focus:ring-emerald-400"
                              />
                              <span>সঠিক</span>
                            </label>
                          </div>
                          {option.option_text && option.option_text.includes("$") && (
                            <div className="ml-8 text-xs font-sans text-slate-650 border-l-2 border-slate-350 pl-2">
                              <span className="font-semibold text-slate-400">সমীকরণ প্রিভিউ: </span>
                              {renderMathPreview(option.option_text)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ব্যাখ্যা (Explanation)</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation || ""}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {editingQuestion.explanation && editingQuestion.explanation.includes("$") && (
                    <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-xs">
                      <span className="font-bold text-slate-400 block mb-1">ব্যাখ্যা প্রিভিউ:</span>
                      <div className="text-slate-800 leading-relaxed font-sans">
                        {renderMathPreview(editingQuestion.explanation)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">মার্কস</label>
                    <input
                      type="number"
                      required
                      value={editingQuestion.marks || 1}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-750">
                      <input
                        type="checkbox"
                        checked={editingQuestion.is_active !== false}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, is_active: e.target.checked })}
                        className="rounded text-indigo-650"
                      />
                      <span>প্রশ্নটি সক্রিয় রাখুন (Active)</span>
                    </label>
                </div>
              </div>
            </div>

                <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-700 font-bengali"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer font-bengali"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
