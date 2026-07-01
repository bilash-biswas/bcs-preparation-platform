// components/analytics/ComparativeAnalysis.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/index';
import { fetchComparativeAnalysis } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/card';

const ComparativeAnalysis: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { comparativeAnalysis, loading } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchComparativeAnalysis());
  }, [dispatch]);

  if (loading || !comparativeAnalysis) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Comparative Analysis</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {comparativeAnalysis.accuracy_percentile}%
          </div>
          <div className="text-sm text-gray-600">Accuracy Percentile</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {comparativeAnalysis.consistency_rank} days
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Subject Rankings</h3>
        <div className="space-y-3">
          {comparativeAnalysis.subject_rankings.map((subject: any, index: any) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{subject.subject}</div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Rank: {subject.rank}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  subject.percentile >= 80 ? 'bg-green-100 text-green-800' :
                  subject.percentile >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {subject.percentile}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ComparativeAnalysis;