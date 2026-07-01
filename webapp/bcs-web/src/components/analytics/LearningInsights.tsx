// components/analytics/LearningInsights.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/index';
import { fetchLearningInsights } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LearningInsights: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { learningInsights, loading, error } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchLearningInsights());
  }, [dispatch]);

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={() => dispatch(fetchLearningInsights())} className="mt-2">
          Retry
        </Button>
      </Card>
    );
  }

  if (!learningInsights) {
    return null;
  }

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Learning Insights</h2>
      
      {/* Peak Study Hours */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Peak Study Hours</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(learningInsights.peak_study_hours).map(([hour, count]: any) => (
            <div key={hour} className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{hour}</div>
              <div className="text-sm text-gray-600">{count} sessions</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Areas */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Areas Needing Improvement</h3>
        <div className="space-y-3">
          {learningInsights.weak_areas.map((area: any, index: any) => (
            <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium">{area.subject}</div>
                <div className="text-sm text-gray-600">Accuracy: {area.accuracy}%</div>
              </div>
              <div className="text-sm text-red-600">Needs Focus</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-medium mb-3">Recommended Actions</h3>
        <div className="space-y-2">
          {learningInsights.recommended_actions.map((action : any, index: any) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                action.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <div>
                <div className="font-medium">{action.action}</div>
                <div className="text-sm text-gray-600">{action.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LearningInsights;