// components/CreateQuizSession.tsx
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Quiz {
  id: number;
  title: string;
  description: string;
}

interface CreateQuizSessionProps {
  onSuccess: () => void;
}

export function CreateQuizSession({ onSuccess }: CreateQuizSessionProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quiz: '',
    scheduled_start: '',
    duration: 30,
    max_participants: 50,
    is_public: false,
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await apiClient.get('/quizzes/');
      setQuizzes(data.results || data);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const createSession = async () => {
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        quiz: parseInt(formData.quiz),
        scheduled_start: new Date(formData.scheduled_start).toISOString(),
      };

      const response = await apiClient.post('/quiz-sessions/create_session/', payload);
      
      console.log('Session created:', response.data);
      alert('কুইজ সেশন সফলভাবে তৈরি হয়েছে!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        quiz: '',
        scheduled_start: '',
        duration: 30,
        max_participants: 50,
        is_public: false,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create session:', error);
      alert(error.response?.data?.error || 'সেশন তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 font-bengali">নতুন কুইজ সেশন তৈরি করুন</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
            সেশন শিরোনাম
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="সেশনের একটি শিরোনাম লিখুন"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
            বিবরণ
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="সেশন সম্পর্কে সংক্ষিপ্ত বিবরণ"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
              কুইজ নির্বাচন করুন
            </label>
            <select
              value={formData.quiz}
              onChange={(e) => setFormData({...formData, quiz: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">একটি কুইজ নির্বাচন করুন</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
              সময়সীমা (মিনিট)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="5"
              max="180"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
              শিডিউল্ড সময়
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
              সর্বোচ্চ অংশগ্রহণকারী
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700 font-bengali">
            পাবলিক সেশন (যে কেউ যোগদান করতে পারবে)
          </label>
        </div>

        <button
          onClick={createSession}
          disabled={loading || !formData.title || !formData.quiz || !formData.scheduled_start}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bengali text-lg font-medium"
        >
          {loading ? 'তৈরি হচ্ছে...' : 'সেশন তৈরি করুন'}
        </button>
      </div>
    </div>
  );
}