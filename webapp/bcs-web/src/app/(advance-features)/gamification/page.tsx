// pages/gamification.tsx - Fixed version
'use client'
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchDashboard,
  fetchChallenges,
  joinChallenge,
} from '@/store/slices/gamificationSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeWithProgress } from '@/types';

const GamificationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { dashboard, challenges, loading, error } = useAppSelector(
    (state) => state.gamification
  );

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchChallenges());
  }, [dispatch]);

  const handleJoinChallenge = (challengeId: number) => {
    dispatch(joinChallenge(challengeId));
  };

  // Helper function to safely access challenge properties
  const getChallengeTimeRemaining = (challenge: ChallengeWithProgress): string => {
    return challenge.time_remaining || 'Unknown';
  };

  const getChallengeProgress = (challenge: ChallengeWithProgress) => {
    return challenge.user_progress || { is_completed: false, progress_percentage: 0 };
  };

  if (loading && !dashboard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gamification</h1>
        <p className="text-gray-600 mt-2">
          Earn badges, complete challenges, and climb the leaderboard
        </p>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-red-600 text-center py-4">
            Error: {error}
            <Button 
              onClick={() => {
                dispatch(fetchDashboard());
                dispatch(fetchChallenges());
              }} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {dashboard && (
        <>
          {/* Dashboard Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {dashboard.points_balance || 0}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                #{dashboard.leaderboard_position?.position || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Leaderboard Rank</div>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dashboard.badges?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {dashboard.current_challenges?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Challenges</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Badges */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Your Badges</h2>
              {dashboard.badges && dashboard.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {dashboard.badges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className="text-center p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border border-yellow-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">
                        {badge.level}
                      </div>
                      <div className="font-medium text-sm mb-1">
                        {badge.badge_name}
                      </div>
                      <div className="text-xs text-gray-600">Level {badge.level}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div
                          className="bg-yellow-500 h-1 rounded-full"
                          style={{ width: `${badge.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No badges earned yet. Complete challenges to earn badges!
                </div>
              )}
            </Card>

            {/* Next Milestones */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Next Milestones</h2>
              <div className="space-y-3">
                {dashboard.next_milestones?.map((milestone: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">{milestone}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Challenges Section */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Available Challenges</h2>
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No challenges available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge: ChallengeWithProgress) => {
              const userProgress = getChallengeProgress(challenge);
              const timeRemaining = getChallengeTimeRemaining(challenge);
              
              return (
                <div
                  key={challenge.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {challenge.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {challenge.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        challenge.challenge_type === 'daily'
                          ? 'bg-green-100 text-green-800'
                          : challenge.challenge_type === 'weekly'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {challenge.challenge_type}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Reward:</span>
                      <span className="font-medium text-yellow-600">
                        {challenge.reward_points} points
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Time Left:</span>
                      <span>{timeRemaining}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Requirements:
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Object.entries(challenge.requirements).map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span>{key.replace('_', ' ')}:</span>
                          <span className="font-medium">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    variant="default"
                    className="w-full"
                    disabled={userProgress.is_completed}
                  >
                    {userProgress.is_completed
                      ? 'Completed'
                      : userProgress.progress_percentage > 0
                      ? 'In Progress'
                      : 'Join Challenge'}
                  </Button>

                  {userProgress.progress_percentage > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>
                          {userProgress.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-green-600 h-1 rounded-full"
                          style={{
                            width: `${userProgress.progress_percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default GamificationPage;