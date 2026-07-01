// components/progress/history.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Target, Clock, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DailyActivity {
  date: string;
  questions_attempted: number;
  correct_answers: number;
  time_spent: string;
  daily_goal_met: boolean;
  accuracy?: number;
}

const ProgressHistory: React.FC = () => {
  const [history, setHistory] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressHistory();
  }, []);

  const fetchProgressHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API call to get daily activity
      const data = await apiClient.get('/analytics/daily_activity/');
      
      // Transform and limit to last 7 days
      const last7Days = data
        .map((item: any) => ({
          date: item.date,
          questions_attempted: item.questions_attempted || 0,
          correct_answers: item.correct_answers || 0,
          time_spent: item.time_spent || '0:00:00',
          daily_goal_met: item.daily_goal_met || false,
          accuracy: item.accuracy || (item.questions_attempted > 0 
            ? Math.round((item.correct_answers / item.questions_attempted) * 100) 
            : 0)
        }))
        .slice(0, 7); // Get only last 7 days
      
      setHistory(last7Days);
    } catch (error) {
      console.error('Error fetching progress history:', error);
      setError('ডেটা লোড করতে সমস্যা হয়েছে');
      // Fallback to mock data
      setHistory(generateMockHistory());
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = (): DailyActivity[] => {
    const history: DailyActivity[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const questionsAttempted = Math.floor(Math.random() * 30) + 5;
      const correctAnswers = Math.floor(questionsAttempted * (0.6 + Math.random() * 0.3));
      
      history.push({
        date: date.toISOString().split('T')[0],
        questions_attempted: questionsAttempted,
        correct_answers: correctAnswers,
        accuracy: Math.round((correctAnswers / questionsAttempted) * 100),
        time_spent: `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
        daily_goal_met: questionsAttempted >= 20
      });
    }
    
    return history;
  };

  // Convert Django duration to minutes
  const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    try {
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        return hours * 60 + minutes;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="text-center text-red-600 py-4">
          <p className="font-bengali">{error}</p>
          <button 
            onClick={fetchProgressHistory}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bengali"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 font-bengali">
          গত ৭ দিনের অ্যাক্টিভিটি
        </h3>
        <button 
          onClick={fetchProgressHistory}
          className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-bengali">রিফ্রেশ</span>
        </button>
      </div>

      <div className="space-y-3">
        {history.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              day.daily_goal_met
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Date */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(day.date).toLocaleDateString('bn-BD', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {day.daily_goal_met ? 'গোল অর্জিত ✅' : 'গোল বাকি ❌'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>{day.questions_attempted}</span>
                </div>
                <div className="text-xs text-gray-500 font-bengali">প্রশ্ন</div>
              </div>

              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className={
                    day.accuracy && day.accuracy >= 80 ? 'text-green-600' :
                    day.accuracy && day.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }>
                    {day.accuracy?.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-bengali">একুরেসি</div>
              </div>

              <div className="text-center">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round(parseDuration(day.time_spent))}m</span>
                </div>
                <div className="text-xs text-gray-500 font-bengali">সময়</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Summary */}
      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 font-bengali">সাপ্তাহিক সামারি</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {history.reduce((sum, day) => sum + day.questions_attempted, 0)}
              </div>
              <div className="text-sm text-gray-600 font-bengali">মোট প্রশ্ন</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(
                  history.reduce((sum, day) => sum + (day.accuracy || 0), 0) / history.length
                )}%
              </div>
              <div className="text-sm text-gray-600 font-bengali">গড় একুরেসি</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {history.filter(day => day.daily_goal_met).length}
              </div>
              <div className="text-sm text-gray-600 font-bengali">গোল অর্জিত</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(history.reduce((sum, day) => sum + parseDuration(day.time_spent), 0))}m
              </div>
              <div className="text-sm text-gray-600 font-bengali">মোট সময়</div>
            </div>
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-bengali">কোন অ্যাক্টিভিটি ডেটা পাওয়া যায়নি</p>
          <p className="text-sm">আজকে কিছু প্রশ্ন চেষ্টা করুন!</p>
        </div>
      )}
    </div>
  );
};

export default ProgressHistory;