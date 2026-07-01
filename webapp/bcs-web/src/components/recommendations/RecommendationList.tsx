// components/recommendations/RecommendationList.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/index';
import { 
  fetchRecommendations, 
  markRecommendationCompleted,
  generateRecommendations 
} from '@/store/slices/recommendationSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const RecommendationList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { recommendations, loading } = useSelector(
    (state: RootState) => state.recommendations
  );

  useEffect(() => {
    dispatch(fetchRecommendations());
  }, [dispatch]);

  const handleMarkCompleted = (id: number) => {
    dispatch(markRecommendationCompleted(id));
  };

  const handleGenerateNew = () => {
    dispatch(generateRecommendations());
  };

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

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Learning Recommendations</h2>
        <Button onClick={handleGenerateNew} variant="outline" size="sm">
          Generate New
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recommendations available. Generate new recommendations to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation: any) => (
            <div
              key={recommendation.id}
              className={`p-4 rounded-lg border-l-4 ${
                recommendation.is_completed
                  ? 'bg-gray-50 border-gray-400'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      recommendation.priority >= 8
                        ? 'bg-red-100 text-red-800'
                        : recommendation.priority >= 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {recommendation.recommendation_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      Confidence: {Math.round(recommendation.confidence_score * 100)}%
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-lg mb-1">
                    {recommendation.subject.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-3">{recommendation.reason}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Category: {recommendation.subject.category.name}</span>
                    <span>Priority: {recommendation.priority}/10</span>
                  </div>
                </div>

                {!recommendation.is_completed && (
                  <Button
                    onClick={() => handleMarkCompleted(recommendation.id)}
                    variant="default"
                    size="sm"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>

              {recommendation.is_completed && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  ✓ Completed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecommendationList;