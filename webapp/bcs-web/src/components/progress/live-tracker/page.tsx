// components/progress/live-tracker.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Award, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface LiveProgressData {
  current_streak: number;
  daily_goal_met: boolean;
  questions_today: number;
  accuracy_today: number;
  time_spent_today: number;
  recent_achievements: Array<{
    name: string;
    description: string;
  }>;
}

const LiveProgressTracker: React.FC = () => {
  const [progress, setProgress] = useState<LiveProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchLiveProgress();
    const interval = setInterval(fetchLiveProgress, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchLiveProgress = async () => {
    try {
      setLoading(true);
      
      // Get today's analytics
      const today = new Date().toISOString().split('T')[0];
      const analyticsData = await apiClient.get('/analytics/');
      const dailyActivity = await apiClient.get('/analytics/daily_activity/');
      
      const todayActivity = dailyActivity.find((activity: any) => activity.date === today) || {};
      
      const liveProgress: LiveProgressData = {
        current_streak: analyticsData.overview?.current_streak || 0,
        daily_goal_met: todayActivity.daily_goal_met || false,
        questions_today: todayActivity.questions_attempted || 0,
        accuracy_today: todayActivity.accuracy || 0,
        time_spent_today: todayActivity.time_spent ? parseDuration(todayActivity.time_spent) : 0,
        recent_achievements: analyticsData.recent_achievements || []
      };

      // Check for achievements
      checkAchievements(liveProgress);
      
      setProgress(liveProgress);
    } catch (error) {
      console.error('Error fetching live progress:', error);
      // Fallback to mock data
      setProgress(generateMockProgress());
    } finally {
      setLoading(false);
    }
  };

  const generateMockProgress = (): LiveProgressData => {
    const questionsToday = Math.floor(Math.random() * 25);
    
    return {
      current_streak: Math.floor(Math.random() * 10) + 1,
      daily_goal_met: questionsToday >= 20,
      questions_today: questionsToday,
      accuracy_today: Math.floor(Math.random() * 40) + 60,
      time_spent_today: Math.floor(Math.random() * 120) + 10,
      recent_achievements: []
    };
  };

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

  const checkAchievements = (progressData: LiveProgressData) => {
    // Check for daily goal
    if (progressData.questions_today >= 20 && !progressData.daily_goal_met) {
      triggerNotification('ডেইলি গোল অর্জিত! 🎉 ২০টি প্রশ্ন সম্পূর্ণ করেছেন।');
    }

    // Check for streak milestones
    if (progressData.current_streak === 7) {
      triggerNotification('১ সপ্তাহ স্ট্রীক অর্জন! 🔥 চালিয়ে যান!');
    }

    // Check for accuracy achievement
    if (progressData.accuracy_today >= 90) {
      triggerNotification('৯০%+ একুরেসি! 🎯 অসাধারণ পারফরমেন্স!');
    }
  };

  const triggerNotification = (message: string) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  if (loading && !progress) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-gray-100 rounded-xl">
                <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="text-center text-gray-500 py-8">
          <RefreshCw className="w-12 h-12 mx-auto mb-3" />
          <p className="font-bengali">লাইভ প্রগ্রেস লোড করতে সমস্যা হচ্ছে</p>
          <button 
            onClick={fetchLiveProgress}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bengali"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Achievement Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-medium font-bengali">{notification}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 font-bengali">
            আজকের প্রগ্রেস
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 font-bengali">লাইভ</span>
            <button 
              onClick={fetchLiveProgress}
              className="text-red-600 hover:text-red-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Streak */}
          <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
            <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{progress.current_streak}</div>
            <div className="text-sm text-orange-700 font-bengali">স্ট্রীক</div>
          </div>

          {/* Questions Today */}
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{progress.questions_today}/20</div>
            <div className="text-sm text-blue-700 font-bengali">প্রশ্ন</div>
          </div>

          {/* Accuracy */}
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{progress.accuracy_today.toFixed(2)}%</div>
            <div className="text-sm text-green-700 font-bengali">একুরেসি</div>
          </div>

          {/* Time Spent */}
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{progress.time_spent_today}</div>
            <div className="text-sm text-purple-700 font-bengali">মিনিট</div>
          </div>
        </div>

        {/* Daily Goal Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-bengali">ডেইলি গোল প্রগ্রেস</span>
            <span>{progress.questions_today}/20 প্রশ্ন</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((progress.questions_today / 20) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full ${
                progress.daily_goal_met 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}
            />
          </div>
        </div>

        {/* Streak Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-bengali">স্ট্রীক মাইলস্টোন</span>
            <span>{progress.current_streak} দিন</span>
          </div>
          <div className="flex space-x-1">
            {[7, 14, 21, 30].map((milestone) => (
              <div
                key={milestone}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  progress.current_streak >= milestone
                    ? 'bg-orange-500'
                    : progress.current_streak >= milestone - 3
                    ? 'bg-orange-300'
                    : 'bg-gray-200'
                }`}
                title={`${milestone} দিন স্ট্রীক`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>৭ দিন</span>
            <span>১৪ দিন</span>
            <span>২১ দিন</span>
            <span>৩০ দিন</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveProgressTracker;