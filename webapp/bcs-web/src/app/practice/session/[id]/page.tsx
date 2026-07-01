// app/practice/session/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import Header from "@/components/layout/header";
import { Sparkles, Loader2, Check, BookOpen } from "lucide-react";
import { MathDisplay } from "@/components/math-equation/MathDisplay";

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface SessionQuestion {
  id: number;
  question_text: string;
  explanation?: string;
  question_type?: string;
  difficulty: string;
  marks?: number;
  subject_name: string;
  options: Option[];
  user_answer: number | null;
  is_correct: boolean;
  time_taken: string | null;
  sequence_order: number;
  question?: number;
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
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [generatingAI, setGeneratingAI] = useState<number | null>(null);

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

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Loading practice session ${sessionId}...`);
      const sessionData = await apiClient.get(
        `/practice-sessions/${sessionId}/`
      );
      console.log("Session data loaded:", sessionData);

      if (!sessionData) {
        throw new Error("No session data received");
      }

      if (!sessionData.session_questions) {
        console.warn("No session_questions found, setting empty array");
        sessionData.session_questions = [];
      }

      setSession(sessionData);
    } catch (error: any) {
      console.error("Failed to load session:", error);
      setError("সেশন লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIExplanation = async (questionId: number, force: boolean = false) => {
    if (generatingAI !== null || !questionId) return;
    setGeneratingAI(questionId);
    setError(null);
    try {
      const response = await apiClient.post(`/questions/${questionId}/explain/`, { force });
      if (response && response.explanation) {
        setSession((prev) => {
          if (!prev) return null;
          const updatedQuestions = prev.session_questions.map((q) => {
            if (q.question === questionId) {
              return { ...q, explanation: response.explanation };
            }
            return q;
          });
          return { ...prev, session_questions: updatedQuestions };
        });
      } else {
        throw new Error("Failed to generate explanation");
      }
    } catch (err: any) {
      console.error("AI explanation error:", err);
      setError("AI ব্যাখ্যা তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setGeneratingAI(null);
    }
  };

  const handleOptionSelect = async (questionIndex: number, optionId: number) => {
    if (!session || submitting) return;
    const currentSQ = session.session_questions[questionIndex];
    if (!currentSQ || currentSQ.user_answer !== null) return;

    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartTime) / 1000));
    setSubmitting(true);

    try {
      const requestData = {
        question_id: currentSQ.question,
        selected_option: optionId,
        time_taken: timeTaken,
      };

      await apiClient.post(
        `/practice-sessions/${session.id}/submit_answer/`,
        requestData
      );

      // Reload session to get updated stats
      const updatedSession = await apiClient.get(
        `/practice-sessions/${session.id}/`
      );
      setSession(updatedSession);
    } catch (error: any) {
      console.error("Failed to submit answer:", error);
      const errorMessage =
        error.response?.data?.error || "উত্তর জমা দিতে সমস্যা হয়েছে";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;

    try {
      setSubmitting(true);
      await apiClient.post(
        `/practice-sessions/${session.id}/complete_session/`,
        {
          total_time_taken: Math.max(1, Math.floor((Date.now() - questionStartTime) / 1000)),
        }
      );

      router.push(`/practice/results/${session.id}`);
    } catch (error: any) {
      console.error("Failed to complete session:", error);
      setError("সেশন সম্পূর্ণ করতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
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

  const getBengaliLabel = (index: number) => {
    const labels = ["ক", "খ", "গ", "ঘ", "ঙ"];
    return labels[index] || String.fromCharCode(65 + index);
  };

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`q-card-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-[var(--muted-foreground)] font-bengali font-semibold">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-[var(--card)] rounded-3xl p-6 text-center max-w-sm border border-[var(--border)] shadow-sm">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-3 font-bengali">সেশন ত্রুটি</h2>
          <p className="text-[var(--muted-foreground)] mb-5 font-bengali text-sm">{error || "সেশন লোড করতে সমস্যা হয়েছে"}</p>
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
  };

  const progressPercentage = (session.completed_questions / session.total_questions) * 100;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Sticky Dashboard and Quick Nav Header */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-6 shadow-sm sticky top-4 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-[var(--muted-foreground)] font-extrabold uppercase tracking-wider font-bengali">বিসিএস প্র্যাকটিস সেশন</span>
              <h2 className="text-xl font-black text-[var(--foreground)] mt-1 font-bengali">
                উত্তর করা হয়েছে: <span className="text-primary-500 font-black">{session.completed_questions}</span> / {session.total_questions}
              </h2>
            </div>

            {/* Performance Mini Stats */}
            <div className="flex items-center gap-3.5 justify-between sm:justify-end">
              <div className="flex items-center space-x-2 text-xs font-bold bg-[var(--background)] border border-[var(--border)] px-4 py-2 rounded-2xl text-[var(--foreground)] font-bengali">
                <span className="text-primary-500">{session.completed_questions} সম্পন্ন</span>
                <span className="text-[var(--border)]">|</span>
                <span className="text-[var(--muted-foreground)]">{stats.unanswered} বাকি</span>
              </div>

              <button
                onClick={handleCompleteSession}
                className="bg-primary-500 hover:bg-primary-hover text-white px-5 py-2.5 rounded-2xl font-black font-bengali text-xs shadow-xs transition-colors cursor-pointer"
              >
                সেশন শেষ করুন 🎯
              </button>
            </div>
          </div>

          {/* Clean Progress Line */}
          <div className="relative mt-4 mb-2">
            <div className="w-full bg-[var(--border)] rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="absolute -top-6 right-0 text-[10px] font-bold text-[var(--muted-foreground)] font-bengali">
              {Math.round(progressPercentage)}% সম্পূর্ণ
            </div>
          </div>

          {/* Quick Nav Questions Jump-links */}
          <div className="flex flex-wrap gap-1.5 mt-4 p-2 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
            {session.session_questions.map((sq, index) => (
              <button
                key={sq.id}
                onClick={() => scrollToQuestion(index)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  sq.user_answer !== null
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-primary-50/10 border border-[var(--border)]"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Questions list */}
        <div className="space-y-6">
          {session.session_questions.map((sq, questionIndex) => {
            const isAnswered = sq.user_answer !== null;
            return (
              <div
                key={sq.id}
                id={`q-card-${questionIndex}`}
                className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-5"
              >
                {/* Question Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wider font-bengali">
                      প্রশ্ন {questionIndex + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold font-bengali ${getDifficultyColor(sq.difficulty)}`}>
                      {getDifficultyText(sq.difficulty)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] font-bengali">
                    বিষয়: {sq.subject_name}
                  </div>
                </div>

                {/* Question Text Box */}
                <div className="flex items-start gap-3">
                  <span className="text-primary-500 bg-primary-500/10 border border-primary-500/20 font-black px-2 py-0.5 rounded-xl text-xs">Q</span>
                  <p className="text-base font-extrabold leading-relaxed text-[var(--foreground)] font-bengali flex-1">
                    {sq.question_text ? renderMathText(sq.question_text) : "প্রশ্ন লোড হচ্ছে..."}
                  </p>
                </div>

                {/* Answer Choice Cards */}
                <div className="space-y-2.5">
                  {sq.options && sq.options.length > 0 ? (
                    sq.options.map((option, optIdx) => {
                      const isOptionSelected = sq.user_answer === option.id;
                      const letters = ["ক", "খ", "গ", "ঘ"];

                      // Styling rules
                      let cardBorder = "border-[var(--border)]";
                      let cardBg = "bg-[var(--card)] hover:bg-primary-50/10";
                      let cardText = "text-[var(--foreground)]";
                      
                      let bubbleBorder = "border-[var(--border)]";
                      let bubbleBg = "bg-[var(--muted)]";
                      let bubbleText = "text-[var(--muted-foreground)]";

                      if (isOptionSelected) {
                        cardBorder = "border-primary-500";
                        cardBg = "bg-primary-500/10";
                        cardText = "text-primary-950 dark:text-primary-400";
                        
                        bubbleBorder = "border-primary-500";
                        bubbleBg = "bg-primary-500";
                        bubbleText = "text-white";
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => !isAnswered && handleOptionSelect(questionIndex, option.id)}
                          disabled={submitting || isAnswered}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${cardBorder} ${cardBg} ${cardText} ${
                            isAnswered ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center flex-1 pr-3">
                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center mr-3 font-black text-xs transition-colors duration-200 ${bubbleBorder} ${bubbleBg} ${bubbleText}`}>
                              {letters[optIdx]}
                            </div>
                            <span className="font-bengali text-sm leading-relaxed flex-1 font-semibold">
                              {renderMathText(option.option_text)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[var(--muted-foreground)] font-bengali text-xs text-center py-4">কোনো অপশন পাওয়া যায়নি।</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky footer action bar */}
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={handleCompleteSession}
            className="w-full sm:w-auto bg-primary-500 hover:bg-primary-hover text-white px-8 py-3 rounded-2xl font-black font-bengali text-sm shadow-md transition-all duration-200 cursor-pointer"
          >
            সেশন শেষ করুন এবং ফলাফল দেখুন 🎯
          </button>
        </div>

      </div>
    </div>
  );
}