// components/gamification/Dashboard.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/index';
import { fetchDashboard } from '@/store/slices/gamificationSlice';
import { Card } from '@/components/ui/card';

const GamificationDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, loading } = useSelector(
    (state: RootState) => state.gamification
  );

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading || !dashboard) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">Gamification Dashboard</h2>
      
      {/* Points and Leaderboard */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {dashboard.points_balance}
          </div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            #{dashboard.leaderboard_position.position}
          </div>
          <div className="text-sm text-gray-600">Leaderboard Rank</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {dashboard.badges.length}
          </div>
          <div className="text-sm text-gray-600">Badges Earned</div>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Your Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboard.badges.map((badge: any) => (
            <div key={badge.id} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                {badge.level}
              </div>
              <div className="text-sm font-medium">{badge.badge_name}</div>
              <div className="text-xs text-gray-500">Level {badge.level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Milestones */}
      <div>
        <h3 className="text-lg font-medium mb-3">Next Milestones</h3>
        <div className="space-y-2">
          {dashboard.next_milestones.map((milestone: any, index: any) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">{milestone}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default GamificationDashboard;