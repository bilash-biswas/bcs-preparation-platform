// components/JoinQuizSession.tsx
import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface JoinQuizSessionProps {
  onSuccess: () => void;
}

export function JoinQuizSession({ onSuccess }: JoinQuizSessionProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);

  const joinSession = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/quiz-sessions/join/', {
        session_code: sessionCode.toUpperCase(),
      });
      
      console.log('Joined session:', response.data);
      alert('সেশনটিতে সফলভাবে যোগদান করেছেন!');
      
      setSessionCode('');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to join session:', error);
      alert(error.response?.data?.error || 'সেশনে যোগদান করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center font-bengali">
        কুইজ সেশনে যোগদান করুন
      </h2>
      
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 font-bengali">
            সেশন কোড লিখুন
          </label>
          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="যেমন: A1B2C3"
            className="w-full p-4 text-center text-xl font-mono border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
            maxLength={6}
            style={{ letterSpacing: '0.2em' }}
          />
          <p className="text-sm text-gray-500 mt-2 text-center font-bengali">
            সেশন আয়োজকের কাছ থেকে ৬-অক্ষরের কোডটি নিন
          </p>
        </div>

        <button
          onClick={joinSession}
          disabled={loading || sessionCode.length !== 6}
          className="w-full bg-green-600 text-white py-4 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bengali text-lg font-medium"
        >
          {loading ? 'যোগদান করা হচ্ছে...' : 'সেশনে যোগদান করুন'}
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2 font-bengali">সেশন কোড কীভাবে পাবেন?</h3>
          <ul className="text-sm text-blue-700 space-y-1 font-bengali">
            <li>• সেশন আয়োজকের কাছ থেকে আমন্ত্রণ পান</li>
            <li>• পাবলিক সেশন থেকে কোড সংগ্রহ করুন</li>
            <li>• বন্ধু বা শিক্ষকের কাছ থেকে কোড নিন</li>
          </ul>
        </div>
      </div>
    </div>
  );
}