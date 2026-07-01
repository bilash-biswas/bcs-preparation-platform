// app/quiz-sessions/page.tsx - Fixed version
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { CreateQuizSession } from '@/components/quiz-session/CreateQuizSession';
import { JoinQuizSession } from '@/components/quiz-session/JoinQuizSession';
import { QuizSessionList } from '@/components/quiz-session/QuizSessionList';
import { useAuthStore } from '@/store/auth-store';

interface QuizSession {
  id: number;
  title: string;
  description: string;
  session_code: string;
  creator_name: string;
  quiz_title: string;
  scheduled_start: string;
  duration: number;
  status: string;
  participant_count: number;
  max_participants: number;
  is_public: boolean;
  can_join: boolean;
}

export default function QuizSessionsPage() {
  const [activeTab, setActiveTab] = useState<'my-sessions' | 'public' | 'create' | 'join'>('my-sessions');
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadSessions();
  }, [activeTab, user]); // Add user to dependencies

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/quiz-sessions/');
      console.log('Sessions data:', data);
      setSessions(data.results || data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current username safely
  const currentUsername = user?.username || '';

  const filteredSessions = sessions.filter(session => {
    console.log('Filtering - Current user:', currentUsername, 'Session creator:', session.creator_name);
    
    switch (activeTab) {
      case 'my-sessions':
        // Filter sessions created by current user
        return session.creator_name === currentUsername;
      case 'public':
        // Filter public sessions that user can join and are active
        return session.creator_name !== currentUsername;
      default:
        return true;
    }
  });

  console.log('Current user from auth store:', user);
  console.log('Current username:', currentUsername);
  console.log('Filtered sessions:', filteredSessions);

  // Show loading if auth is not ready
  if (!isAuthenticated && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bengali">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Debug info - remove in production */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-bengali">
            ডিবাগ: বর্তমান ব্যবহারকারী - <strong>{currentUsername || 'অজানা'}</strong> | 
            মোট সেশন - <strong>{sessions.length}</strong> | 
            ফিল্টার্ড সেশন - <strong>{filteredSessions.length}</strong>
          </p>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-bengali">
            কুইজ সেশন
          </h1>
          <p className="text-lg text-gray-600 font-bengali">
            কুইজ তৈরি করুন এবং বন্ধুদের সাথে অংশগ্রহণ করুন
          </p>
        </div>

        {/* Tab Navigation with counts */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('my-sessions')}
              className={`flex-1 py-4 px-6 text-center font-medium font-bengali ${
                activeTab === 'my-sessions'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              আমার সেশন ({sessions.filter(s => s.creator_name === currentUsername).length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 py-4 px-6 text-center font-medium font-bengali ${
                activeTab === 'public'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              পাবলিক সেশন ({sessions.filter(s => s.creator_name !== currentUsername).length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 px-6 text-center font-medium font-bengali ${
                activeTab === 'create'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              সেশন তৈরি
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-4 px-6 text-center font-medium font-bengali ${
                activeTab === 'join'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              সেশন যোগদান
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'my-sessions' && (
              <QuizSessionList 
                sessions={filteredSessions} 
                loading={loading}
                onRefresh={loadSessions}
                type="my-sessions"
              />
            )}

            {activeTab === 'public' && (
              <QuizSessionList 
                sessions={filteredSessions} 
                loading={loading}
                onRefresh={loadSessions}
                type="public"
              />
            )}

            {activeTab === 'create' && <CreateQuizSession onSuccess={loadSessions} />}
            
            {activeTab === 'join' && <JoinQuizSession onSuccess={loadSessions} />}
          </div>
        </div>
      </div>
    </div>
  );
}