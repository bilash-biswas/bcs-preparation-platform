// src/app/(advance-features)/recommendations/page.tsx
'use client'

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchRecommendations,
  generateRecommendations,
  markRecommendationCompleted,
} from '@/store/slices/recommendationSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const RecommendationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { recommendations, loading, error } = useAppSelector(
    (state) => state.recommendations
  );

  useEffect(() => {
    dispatch(fetchRecommendations());
  }, [dispatch]);

  const handleGenerateNew = () => {
    dispatch(generateRecommendations());
  };

  const handleMarkCompleted = (id: number) => {
    dispatch(markRecommendationCompleted(id));
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Safely handle recommendations data
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const completedCount = safeRecommendations.filter(r => r.is_completed).length;
  const highPriorityCount = safeRecommendations.filter(r => r.priority >= 8).length;
  const uniqueSubjectsCount = new Set(safeRecommendations.map(r => r.subject?.id)).size;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
            <p className="text-gray-600 mt-2">
              Personalized learning suggestions based on your performance
            </p>
          </div>
          <Button onClick={handleGenerateNew} variant="default">
            Generate New Recommendations
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-red-600 text-center py-4">
            Error: {error}
            <Button 
              onClick={() => dispatch(fetchRecommendations())} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {safeRecommendations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Generate personalized recommendations to optimize your learning journey.
            </p>
            <Button onClick={handleGenerateNew} variant="default">
              Generate Recommendations
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {safeRecommendations.map((recommendation) => (
            <Card
              key={recommendation.id}
              className={`border-l-4 ${
                recommendation.is_completed
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                        recommendation.priority
                      )}`}
                    >
                      Priority: {recommendation.priority}/10
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800`}
                    >
                      {recommendation.recommendation_type?.replace('_', ' ') || 'General'}
                    </span>
                    <span
                      className={`text-xs font-medium ${getConfidenceColor(
                        recommendation.confidence_score
                      )}`}
                    >
                      Confidence: {Math.round((recommendation.confidence_score || 0) * 100)}%
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">
                    {recommendation.subject?.name || 'Unknown Subject'}
                  </h3>

                  <p className="text-gray-600 mb-4">{recommendation.reason}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Category: {recommendation.subject?.category?.name || 'N/A'}</span>
                    <span>
                      Questions: {recommendation.subject?.total_questions || 0}
                    </span>
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
                <div className="flex items-center space-x-2 text-green-600 font-medium">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Completed</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {safeRecommendations.length > 0 && (
        <Card className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {safeRecommendations.length}
              </div>
              <div className="text-sm text-gray-600">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedCount}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {highPriorityCount}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {uniqueSubjectsCount}
              </div>
              <div className="text-sm text-gray-600">Subjects Covered</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsPage;