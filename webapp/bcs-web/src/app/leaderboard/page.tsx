// app/leaderboard/page.tsx - IMPROVED VERSION
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface LeaderboardEntry {
  id: number;
  username: string;
  total_score: number;
  total_attempts: number;
  average_accuracy: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the correct endpoint structure
      const endpoint = timeframe === 'weekly' 
        ? '/leaderboard/' 
        : '/leaderboard/monthly/';
      
      const response = await apiClient.get(endpoint);
      
      // Handle both array and object responses
      const data = Array.isArray(response) ? response : (response.results || response);
      console.log('Leaderboard raw data:', data);
      setLeaderboard(data);
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setError('লিডারবোর্ড লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-50 border-yellow-200 shadow-md';
    if (index === 1) return 'bg-gray-50 border-gray-200 shadow-sm';
    if (index === 2) return 'bg-orange-50 border-orange-200 shadow-sm';
    return 'bg-white border-gray-200 hover:bg-gray-50 transition-colors';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return (index + 1).toString();
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500 text-white';
    if (index === 1) return 'bg-gray-500 text-white';
    if (index === 2) return 'bg-orange-500 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-bengali bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text">
            লিডারবোর্ড
          </h1>
          <p className="text-gray-600 mb-6 font-bengali">
            শীর্ষ প্রতিযোগীদের সাথে আপনার দক্ষতা তুলনা করুন
          </p>
          
          {/* Timeframe Selector */}
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all font-bengali ${
                timeframe === 'weekly'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              সাপ্তাহিক
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all font-bengali ${
                timeframe === 'monthly'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              মাসিক
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-700 font-bengali">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-bengali"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center p-4 bg-white rounded-xl border">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Content */}
        {!loading && !error && (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center p-6 rounded-2xl border-2 ${getRankColor(index)} transition-all duration-300`}
              >
                {/* Rank Badge */}
                <div className={`w-14 h-14 flex items-center justify-center rounded-full font-bold text-lg ${getMedalColor(index)} mr-4 shadow-sm`}>
                  {getRankIcon(index)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {entry.username.toUpperCase()}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="font-bengali">{entry.total_attempts}টি অ্যাটেম্পট</span>
                    <span className="font-bengali">{entry.average_accuracy}% সঠিকতা</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round(entry.total_score)}
                  </div>
                  <div className="text-sm text-gray-500 font-bengali">স্কোর</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && leaderboard.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="text-gray-400 text-8xl mb-6">🏆</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4 font-bengali">
              এখনো কোন স্কোর নেই
            </h3>
            <p className="text-gray-500 mb-6 font-bengali">
              প্রথম কুইজ দিন এবং লিডারবোর্ডে আপনার নাম দেখুন
            </p>
            <button
              onClick={() => window.location.href = '/practice'}
              className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 font-semibold transition-colors font-bengali"
            >
              কুইজ শুরু করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}