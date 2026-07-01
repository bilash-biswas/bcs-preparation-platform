// components/QuizSessionCard.tsx - Fixed creator logic
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

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

interface QuizSessionCardProps {
  session: QuizSession;
  onUpdate: () => void;
}

export function QuizSessionCard({ session, onUpdate }: QuizSessionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [emails, setEmails] = useState("");
  const [isParticipant, setIsParticipant] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  // Check if current user is a participant
  useEffect(() => {
    checkParticipation();
  }, [session.id, user]);

  const checkParticipation = async () => {
    try {
      // Check if user is already a participant
      const participants = await apiClient.get(`/quiz-sessions/${session.id}/participants/`);
      const currentUserId = user?.id;
      
      if (currentUserId && participants.some((p: any) => p.user === currentUserId)) {
        setIsParticipant(true);
      }
    } catch (error) {
      console.error('Failed to check participation:', error);
    }
  };

  const startSession = async () => {
    try {
      setLoading(true);
      //await apiClient.post(`/quiz-sessions/${session.id}/start/`);
      const attempt = await apiClient.post("/quizzes/start/", {
        quiz: session.id,
      });
      onUpdate();
      alert("সেশন শুরু করা হয়েছে!");
    } catch (error: any) {
      console.error('Failed to start session:', error);
      alert(error.response?.data?.error || 'সেশন শুরু করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    console.log('Navigating to quiz attempt:', session.id);
    router.push(`/quiz-sessions/${session.id}/`);
  };

  const joinSession = async () => {
    try {
      setLoading(true);
      await apiClient.post(`/quiz-sessions/join/`, {
        session_code: session.session_code
      });
      setIsParticipant(true);
      alert("সেশনে যোগদান করেছেন! এখন কুইজ শুরু করতে পারেন।");
      onUpdate();
    } catch (error: any) {
      console.error('Failed to join session:', error);
      alert(error.response?.data?.error || 'যোগদান করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const inviteUsers = async () => {
    try {
      setLoading(true);
      const emailList = emails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      await apiClient.post(`/quiz-sessions/${session.id}/invite/`, {
        emails: emailList,
      });

      setShowInvite(false);
      setEmails("");
      alert("ইনভাইটেশন পাঠানো হয়েছে!");
    } catch (error: any) {
      console.error('Failed to send invitations:', error);
      alert(error.response?.data?.error || 'ইনভাইটেশন পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "created":
        return "তৈরি হয়েছে";
      case "scheduled":
        return "শিডিউল্ড";
      case "active":
        return "চলছে";
      case "completed":
        return "সম্পন্ন";
      case "cancelled":
        return "বাতিল";
      default:
        return status;
    }
  };

  const isCreator = user?.username === session.creator_name;

  // FIXED: Creator can always take exam in their active sessions
  const canTakeExam = session.status === "active" && (isCreator || isParticipant);

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 font-bengali">
            {session.title}
          </h3>
          <p className="text-gray-600 text-sm mt-1 font-bengali">
            {session.description || "কোন বিবরণ নেই"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              session.status
            )} font-bengali`}
          >
            {getStatusText(session.status)}
          </span>
          {session.is_public && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium font-bengali">
              পাবলিক
            </span>
          )}
          {isCreator && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium font-bengali">
              আয়োজক
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <div className="font-medium font-bengali">সেশন কোড</div>
          <div className="font-mono text-lg font-bold text-red-600">
            {session.session_code}
          </div>
        </div>
        <div>
          <div className="font-medium font-bengali">কুইজ</div>
          <div className="font-bengali">{session.quiz_title}</div>
        </div>
        <div>
          <div className="font-medium font-bengali">সময়</div>
          <div className="font-bengali">
            {new Date(session.scheduled_start).toLocaleString("bn-BD")}
          </div>
        </div>
        <div>
          <div className="font-medium font-bengali">অংশগ্রহণকারী</div>
          <div className="font-bengali">
            {session.participant_count} / {session.max_participants}
          </div>
        </div>
      </div>

      {/* Debug info - remove in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <p className="font-bengali">
          ডিবাগ: সৃষ্টিকর্তা: {session.creator_name} | বর্তমান ব্যবহারকারী: {user?.username}
        </p>
        <p className="font-bengali">
          আয়োজক: {isCreator ? 'হ্যাঁ' : 'না'} | অংশগ্রহণকারী: {isParticipant ? 'হ্যাঁ' : 'না'}
        </p>
        <p className="font-bengali">
          অবস্থা: {session.status} | যোগদান করতে পারবেন: {session.can_join ? 'হ্যাঁ' : 'না'}
        </p>
        <p className="font-bengali">
          পরীক্ষা নিতে পারবেন: {canTakeExam ? 'হ্যাঁ' : 'না'}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 font-bengali">
          তৈরি করেছেন: {session.creator_name}
          {isParticipant && " • আপনি অংশগ্রহণকারী"}
          {isCreator && " • আপনি আয়োজক"}
        </div>

        <div className="flex gap-2">
          {session.status === "created" || session.status === "scheduled" ? (
            <>
              {isCreator && (
                <>
                  <button
                    onClick={() => setShowInvite(true)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 font-bengali"
                  >
                    আমন্ত্রণ
                  </button>

                  <button
                    onClick={startSession}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 font-bengali"
                  >
                    শুরু করুন
                  </button>
                </>
              )}
            </>
          ) : session.status === "active" ? (
            <>
              {/* FIXED: Show Start Quiz button for creators and participants */}
              {canTakeExam && (
                <button
                  onClick={handleStartQuiz}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-bengali"
                >
                  কুইজ শুরু করুন
                </button>
              )}

              {/* Show Join button for non-creators who can join */}
              {!isCreator && session.can_join && (
                <button
                  onClick={joinSession}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 font-bengali"
                >
                  যোগদান করুন
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Invitation Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 font-bengali">
              ব্যবহারকারী আমন্ত্রণ করুন
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-bengali">
                ইমেইল ঠিকানা (কমা দ্বারা আলাদা করুন)
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50 font-bengali"
              >
                বাতিল
              </button>
              <button
                onClick={inviteUsers}
                disabled={loading || !emails.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 font-bengali"
              >
                পাঠান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}