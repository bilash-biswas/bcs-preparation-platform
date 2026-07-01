// components/battle/BattleRoom.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useBattle } from '@/hooks/useBattle';
import { useRouter } from 'next/router';

const BattleRoom: React.FC = () => {
  const router = useRouter();
  const { battleCode } = router.query;
  const {
    currentBattle,
    connectToBattle,
    disconnectFromBattle,
    sendReadySignal,
    sendChatMessage,
    sendAnswer
  } = useBattle();

  const [chatMessage, setChatMessage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (battleCode && typeof battleCode === 'string') {
      connectToBattle(battleCode);
    }

    return () => {
      disconnectFromBattle();
    };
  }, [battleCode, connectToBattle, disconnectFromBattle]);

  // Timer effect
  useEffect(() => {
    if (!currentBattle?.time_remaining) return;

    setTimeRemaining(Math.floor(currentBattle.time_remaining));

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentBattle?.time_remaining]);

  const handleReady = () => {
    sendReadySignal();
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleOptionSelect = (optionId: number) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleAnswerSubmit = () => {
    if (currentBattle?.current_question && selectedOptions.length > 0) {
      const timeTaken = currentBattle.time_per_question - timeRemaining;
      sendAnswer(currentBattle.current_question.id, selectedOptions, timeTaken);
      setSelectedOptions([]);
    }
  };

  if (!currentBattle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to battle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Battle Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Battle {currentBattle.battle_code}
              </h1>
              <p className="text-gray-600">
                {currentBattle.subject_name} • {currentBattle.difficulty}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Time Remaining</div>
              <div className="text-2xl font-bold text-blue-600">
                {timeRemaining}s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players Panel */}
        <div className="lg:col-span-1 space-y-4">
          {currentBattle.participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {participant.user_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">{participant.user_name}</h3>
                    <p className="text-sm text-gray-600">
                      Score: {participant.score}
                    </p>
                  </div>
                </div>
                {participant.is_ready && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Ready
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Correct: {participant.correct_answers}/{currentBattle.current_question_index}
              </div>
            </div>
          ))}

          {/* Ready Button */}
          {currentBattle.status === 'waiting' && (
            <button
              onClick={handleReady}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              I'm Ready!
            </button>
          )}

          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-3">Battle Chat</h3>
            <div className="h-48 overflow-y-auto mb-3 space-y-2">
              {/* Chat messages would go here */}
              <div className="text-sm text-gray-500 text-center py-8">
                Chat messages will appear here
              </div>
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Question Panel */}
        <div className="lg:col-span-2">
          {currentBattle.status === 'waiting' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-4xl mb-4">⚔️</div>
              <h2 className="text-2xl font-bold mb-2">Waiting for Players</h2>
              <p className="text-gray-600 mb-4">
                {currentBattle.participants.filter(p => p.is_ready).length} / 2 players ready
              </p>
              <div className="animate-pulse text-blue-600">
                Get ready for battle!
              </div>
            </div>
          )}

          {currentBattle.status === 'active' && currentBattle.current_question && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    Question {currentBattle.current_question_index + 1} of {currentBattle.question_count}
                  </span>
                  <span className="ml-2 bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                    {currentBattle.current_question.difficulty}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    {timeRemaining}s
                  </div>
                  <div className="text-sm text-gray-600">Time Left</div>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-6">
                {currentBattle.current_question.question_text}
              </h2>

              <div className="space-y-3 mb-6">
                {currentBattle.current_question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.option_text}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAnswerSubmit}
                disabled={selectedOptions.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          )}

          {currentBattle.status === 'completed' && currentBattle.battle_stats && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-2">Battle Complete!</h2>
              <p className="text-xl text-gray-600 mb-6">
                Winner: <span className="font-bold text-green-600">{currentBattle.battle_stats.winner}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                {currentBattle.participants.map((participant) => (
                  <div key={participant.id} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{participant.user_name}</h3>
                    <div className="text-2xl font-bold text-blue-600">{participant.score}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/battle')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Back to Lobby
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleRoom;