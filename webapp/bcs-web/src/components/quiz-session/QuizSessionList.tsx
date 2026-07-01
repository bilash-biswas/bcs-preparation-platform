// components/QuizSessionList.tsx
import { QuizSessionCard } from './QuizSessionCard';

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

interface QuizSessionListProps {
  sessions: QuizSession[];
  loading: boolean;
  onRefresh: () => void;
  type: 'my-sessions' | 'public';
}

export function QuizSessionList({ sessions, loading, onRefresh, type }: QuizSessionListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 font-bengali">
          {type === 'my-sessions' ? 'কোন সেশন খুঁজে পাওয়া যায়নি' : 'কোন পাবলিক সেশন খুঁজে পাওয়া যায়নি'}
        </h3>
        <p className="text-gray-500 mb-4 font-bengali">
          {type === 'my-sessions' 
            ? 'আপনার প্রথম কুইজ সেশন তৈরি করুন' 
            : 'বর্তমানে কোন পাবলিক সেশন নেই'
          }
        </p>
        <button
          onClick={onRefresh}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-bengali"
        >
          রিফ্রেশ করুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold font-bengali">
          {type === 'my-sessions' ? 'আমার সেশনসমূহ' : 'পাবলিক সেশনসমূহ'}
        </h2>
        <button
          onClick={onRefresh}
          className="text-red-600 hover:text-red-700 font-bengali"
        >
          রিফ্রেশ
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <QuizSessionCard 
            key={session.id} 
            session={session} 
            onUpdate={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}