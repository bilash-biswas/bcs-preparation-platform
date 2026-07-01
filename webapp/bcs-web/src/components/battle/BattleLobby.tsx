// components/battle/BattleLobby.tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useBattle } from '@/hooks/useBattle';

const BattleLobby: React.FC = () => {
  const {
    availableBattles = [], // Default to empty array
    activeBattles = [],    // Default to empty array
    loading,
    loadAvailableBattles,
    loadActiveBattles,
    createQuickMatch,
    joinBattleByCode
  } = useBattle();

  const [battleCode, setBattleCode] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadAvailableBattles();
    loadActiveBattles();
  }, [loadAvailableBattles, loadActiveBattles]);

  const handleCreateQuickBattle = async () => {
    try {
      await createQuickMatch().unwrap();
      // Refresh the lists after creating a battle
      loadAvailableBattles();
      loadActiveBattles();
    } catch (error) {
      console.error('Failed to create quick battle:', error);
    }
  };

  const handleJoinBattle = async () => {
    if (battleCode.trim()) {
      try {
        await joinBattleByCode(battleCode.trim()).unwrap();
        // Refresh the lists after joining a battle
        loadAvailableBattles();
        loadActiveBattles();
        setBattleCode(''); // Clear input after joining
      } catch (error) {
        console.error('Failed to join battle:', error);
      }
    }
  };

  // Prevent hydration issues by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">1 vs 1 Battle</h1>
          <p className="text-gray-600">Challenge other players in real-time quiz battles</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Match</h2>
            <p className="text-gray-600 mb-4">Start a quick battle with random opponent</p>
            <button
              onClick={handleCreateQuickBattle}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Find Quick Match'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Join Battle</h2>
            <p className="text-gray-600 mb-4">Enter a battle code to join specific battle</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={battleCode}
                onChange={(e) => setBattleCode(e.target.value.toUpperCase())}
                placeholder="Enter battle code"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
              <button
                onClick={handleJoinBattle}
                disabled={!battleCode.trim() || loading}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Available Battles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Battles</h2>
          {!availableBattles || availableBattles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No available battles</p>
          ) : (
            <div className="space-y-3">
              {availableBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">
                      {battle.creator_name || 'Unknown'}'s Battle
                    </h3>
                    <p className="text-sm text-gray-600">
                      {battle.subject_name || 'General'} • {battle.question_count || 0} questions • {battle.difficulty || 'Medium'}
                    </p>
                  </div>
                  <button
                    onClick={() => joinBattleByCode(battle.battle_code)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Battles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Active Battles</h2>
          {!activeBattles || activeBattles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active battles</p>
          ) : (
            <div className="space-y-3">
              {activeBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">Battle {battle.battle_code}</h3>
                    <p className="text-sm text-gray-600">
                      {battle.creator_name || 'You'} vs {battle.opponent_name || 'Waiting...'} • {battle.status || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() => joinBattleByCode(battle.battle_code)}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Enter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;