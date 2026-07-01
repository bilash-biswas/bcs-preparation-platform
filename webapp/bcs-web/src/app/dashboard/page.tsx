// src/app/dashboard/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  Calendar,
  BarChart3,
  Zap,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AnalyticsData {
  overview: {
    total_sessions: number;
    completed_sessions: number;
    total_questions_attempted: number;
    current_streak: number;
  };
  weekly_accuracy: Array<{
    date: string;
    accuracy: number;
  }>;
  subject_performance: Array<{
    subject__id?: number;
    subject__name: string;
    subject__category__name: string;
    attempted_questions: number;
    correct_answers: number;
    accuracy: number;
    current_streak: number;
  }>;
  recent_achievements: Array<{
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }>;
  daily_goal_met: boolean;
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/analytics/');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500 font-bengali font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center p-8 glass-panel rounded-3xl max-w-sm mx-auto shadow-md">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-700 font-bengali text-lg font-bold">অ্যানালিটিক্স ডেটা পাওয়া যায়নি</p>
          <p className="text-slate-500 font-bengali text-sm mt-1">অনুগ্রহ করে প্র্যাকটিস সেশন সম্পন্ন করে আবার চেষ্টা করুন।</p>
        </div>
      </div>
    );
  }

  const { overview, weekly_accuracy, subject_performance, recent_achievements, daily_goal_met } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100/40 to-indigo-50/20 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase bg-indigo-50 px-3 py-1 rounded-full w-max">
              <Sparkles className="w-3.5 h-3.5" />
              <span>রিয়েল-টাইম পারফরমেন্স ট্র্যাকিং</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-bengali tracking-tight mt-2.5">
              প্রগ্রেস ড্যাশবোর্ড
            </h1>
            <p className="text-slate-500 font-bengali text-base mt-1.5">
              আপনার লার্নিং জার্নি, বিসিএস প্রস্তুতি এবং অর্জনসমূহ ট্র্যাক করুন
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex bg-slate-200/60 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/80 w-max shadow-inner">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 font-bengali ${
                  timeRange === range
                    ? 'bg-white text-indigo-700 shadow-md transform scale-102 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                {range === 'week' ? 'সাপ্তাহিক' : range === 'month' ? 'মাসিক' : 'সব'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              title: 'মোট সেশন',
              value: overview.total_sessions,
              icon: TrendingUp,
              color: 'from-blue-500 to-indigo-600',
              bgLight: 'bg-blue-500/10 text-blue-600',
            },
            {
              title: 'প্রশ্ন অ্যাটেম্পট',
              value: overview.total_questions_attempted,
              icon: Target,
              color: 'from-emerald-500 to-teal-600',
              bgLight: 'bg-emerald-500/10 text-emerald-600',
            },
            {
              title: 'কারেন্ট স্ট্রীক',
              value: `${overview.current_streak} দিন`,
              icon: Zap,
              color: 'from-amber-500 to-orange-600',
              bgLight: 'bg-amber-500/10 text-amber-600',
            },
            {
              title: 'ডেইলি গোল',
              value: daily_goal_met ? 'অর্জিত ✅' : 'চলমান ⏳',
              icon: Calendar,
              color: daily_goal_met ? 'from-purple-500 to-indigo-600' : 'from-slate-400 to-slate-600',
              bgLight: daily_goal_met ? 'bg-purple-500/10 text-purple-600' : 'bg-slate-500/10 text-slate-600',
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-6.5 border border-slate-200/60 shadow-[0_8px_30px_rgb(241,245,249)] hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-500 font-bengali uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight mt-1.5 font-bengali">{card.value}</p>
                </div>
                <div className={`w-14 h-14 ${card.bgLight} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Accuracy and Achievements Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Accuracy Trend Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6.5 sm:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(241,245,249)] h-full flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-bengali">একুরেসি ট্রেন্ড</h3>
                  <p className="text-slate-400 text-xs font-bengali mt-0.5">আপনার পারফরমেন্সর পরিবর্তন ও গতিধারা</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="h-64 mt-4">
                <AccuracyChart data={weekly_accuracy} />
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div>
            <div className="bg-white rounded-3xl p-6.5 sm:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(241,245,249)] h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-bengali">সাম্প্রতিক অর্জনসমূহ</h3>
                  <p className="text-slate-400 text-xs font-bengali mt-0.5">সফলভাবে আনলক করা মেডেল ও ব্যাজ</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-4.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {recent_achievements.slice(0, 4).map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3.5 p-3.5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-100 hover:border-amber-200/60 transition-all duration-300"
                  >
                    <div className="w-11 h-11 bg-gradient-to-tr from-amber-100 to-yellow-200 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-800 font-bengali text-sm truncate">{achievement.name}</p>
                      <p className="text-slate-500 text-xs font-bengali mt-0.5 truncate">{achievement.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </motion.div>
                ))}
                
                {recent_achievements.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Award className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bengali text-sm font-semibold">কোন মেডেল বা ব্যাজ এখনও আনলক হয়নি</p>
                    <p className="text-slate-400 text-xs font-bengali mt-1">প্র্যাকটিস কুইজ সম্পূর্ণ করুন এবং আর্ন করুন ব্যাজ!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject Wise Performance Table */}
        <div className="mt-8 bg-white rounded-3xl p-6.5 sm:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(241,245,249)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-bengali">বিষয়ভিত্তিক পারফরমেন্স</h3>
              <p className="text-slate-400 text-xs font-bengali mt-0.5">প্রতিটি বিষয়ের নির্ভুলতা ও ধারাবাহিকতা বিশ্লেষণ</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <SubjectPerformanceTable data={subject_performance} />
        </div>

      </div>
    </div>
  );
};

// High-fidelity Accuracy Chart Component
const AccuracyChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bengali">
        <p>পর্যবেক্ষণ করার মতো পর্যাপ্ত ডেটা পাওয়া যায়নি</p>
      </div>
    );
  }

  const maxAccuracy = Math.max(...data.map(d => d.accuracy), 100);

  return (
    <div className="h-full flex items-end justify-between space-x-3.5 sm:space-x-5 pt-8 px-2">
      {data.map((day, index) => {
        const heightPercent = (day.accuracy / maxAccuracy) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
            {/* Value Bubble Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-md mb-2 shadow-md absolute transform -translate-y-16">
              {Math.round(day.accuracy)}%
            </div>
            
            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-t-xl h-full flex items-end shadow-inner relative overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: index * 0.05, duration: 0.8, ease: 'easeOut' }}
                className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500 rounded-t-xl transition-all duration-300 relative group-hover:brightness-110"
              >
                {/* Glow Filter */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </div>
            
            {/* Bar Label (Formatted date) */}
            <div className="text-[10px] font-black text-slate-500 mt-2.5 font-bengali text-center truncate w-full">
              {new Date(day.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Premium Subject Performance Table
const SubjectPerformanceTable: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 font-bengali">
        কোনো বিষয়ের সেশন ডেটা উপলব্ধ নেই।
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-left bg-slate-50/50">
            <th className="py-4.5 px-4 font-bold text-slate-800 font-bengali text-sm rounded-l-2xl">বিষয়</th>
            <th className="text-center py-4.5 px-4 font-bold text-slate-800 font-bengali text-sm">অ্যাটেম্পট করা প্রশ্ন</th>
            <th className="text-center py-4.5 px-4 font-bold text-slate-800 font-bengali text-sm">সঠিক উত্তর</th>
            <th className="text-center py-4.5 px-4 font-bold text-slate-800 font-bengali text-sm">নির্ভুলতা (Accuracy)</th>
            <th className="text-center py-4.5 px-4 font-bold text-slate-800 font-bengali text-sm rounded-r-2xl">ধারাবাহিকতা (Streak)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((subject, index) => (
            <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors duration-200">
              <td className="py-4 px-4">
                <div>
                  <p className="font-extrabold text-slate-850 font-bengali text-sm">{subject.subject__name}</p>
                  <p className="text-xs text-slate-400 font-bengali mt-0.5">{subject.subject__category__name}</p>
                </div>
              </td>
              <td className="text-center py-4 px-4 font-bold text-slate-700 text-sm">{subject.attempted_questions}</td>
              <td className="text-center py-4 px-4 font-bold text-slate-700 text-sm">{subject.correct_answers}</td>
              <td className="text-center py-4 px-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black font-bengali ${
                  subject.accuracy >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  subject.accuracy >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {Math.round(subject.accuracy)}%
                </span>
              </td>
              <td className="text-center py-4 px-4">
                <div className="flex items-center justify-center space-x-1 font-bold text-slate-700 text-sm">
                  <Zap className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                  <span>{subject.current_streak}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsDashboard;