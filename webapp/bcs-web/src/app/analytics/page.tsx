// app/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface AnalyticsData {
  overview: {
    total_sessions: number;
    completed_sessions: number;
    total_questions_attempted: number;
    current_streak: number;
  };
  subject_performance: Array<{
    subject__name: string;
    subject__category__name: string;
    attempted_questions: number;
    correct_answers: number;
    accuracy: number;
    current_streak: number;
  }>;
  weekly_accuracy: Array<{
    date: string;
    accuracy: number;
  }>;
  recent_achievements: Array<{
    id: number;
    name: string;
    description: string;
    achievement_type: string;
    icon: string;
    unlocked_at: string;
  }>;
  daily_goal_met: boolean;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/analytics/");
      console.log("Analytics loaded:", data);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ডেটা লোড করতে সমস্যা হয়েছে
          </h2>
          <button
            onClick={loadAnalytics}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-bengali">
          এনালাইটিক্স ড্যাশবোর্ড
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.overview.total_sessions}
            </div>
            <div className="text-gray-600 text-sm font-bengali">মোট সেশন</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics.overview.completed_sessions}
            </div>
            <div className="text-gray-600 text-sm font-bengali">
              সম্পন্ন সেশন
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-2xl font-bold text-red-600">
              {analytics.overview.total_questions_attempted}
            </div>
            <div className="text-gray-600 text-sm font-bengali">
              মোট প্রশ্ন অ্যাটেম্পট
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.overview.current_streak}
            </div>
            <div className="text-gray-600 text-sm font-bengali">
              বর্তমান স্ট্রীক
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subject Performance */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 font-bengali">
              বিষয়ভিত্তিক পারফরম্যান্স
            </h2>
            <div className="space-y-4">
              {analytics.subject_performance.map((subject) => (
                <div
                  key={subject.subject__name}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium font-bengali">
                      {subject.subject__name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {subject.correct_answers} / {subject.attempted_questions}{" "}
                      সঠিক
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {subject.accuracy.toFixed(1)}%
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${subject.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Accuracy */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 font-bengali">
              সাপ্তাহিক সঠিকতা
            </h2>
            <div className="space-y-3">
              {analytics.weekly_accuracy.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between"
                >
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString("bn-BD")}
                  </div>
                  <div className="text-sm font-semibold">
                    {day.accuracy.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4 font-bengali">
            সাম্প্রতিক অর্জন
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.recent_achievements.map((achievement) => (
              <div key={achievement.id} className="border rounded-lg p-4">
                <div className="font-semibold font-bengali">
                  {achievement.name}
                </div>
                <div className="text-sm text-gray-600">
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
