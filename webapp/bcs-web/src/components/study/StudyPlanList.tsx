// components/study/StudyPlanList.tsx - Fixed version
import React from 'react';
import { SmartStudyPlan } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface StudyPlanListProps {
  studyPlans: SmartStudyPlan[] | null | undefined;
  onViewPlan: (plan: SmartStudyPlan) => void;
  loading?: boolean;
}

const StudyPlanList: React.FC<StudyPlanListProps> = ({
  studyPlans,
  onViewPlan,
  loading = false,
}) => {
  // Helper function to calculate progress (you can replace this with actual progress data)
  const calculateProgress = (plan: SmartStudyPlan): number => {
    // This is a placeholder - in a real app, you'd get this from the API
    return Math.min(100, Math.floor(Math.random() * 100));
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatus = (plan: SmartStudyPlan): { text: string; color: string } => {
    if (!plan.is_active) return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (plan.completed_at) return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
  };

  // Safe array access
  const safeStudyPlans = Array.isArray(studyPlans) ? studyPlans : [];

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!safeStudyPlans || safeStudyPlans.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Study Plans Yet
          </h3>
          <p className="text-gray-600">
            Create your first study plan to organize your learning journey.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Your Study Plans</h2>
      
      <div className="space-y-4">
        {safeStudyPlans.map((plan) => {
          const progress = calculateProgress(plan);
          const status = getStatus(plan);
          
          return (
            <div
              key={plan.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => onViewPlan(plan)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    {plan.subjects?.length || 0} subjects • {plan.duration_days} days • {plan.daily_goal} questions/day
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {plan.subjects?.slice(0, 3).map((subject) => (
                      <span
                        key={subject.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {subject.name}
                      </span>
                    ))}
                    {plan.subjects && plan.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{plan.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPlan(plan);
                  }}
                >
                  View Details
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {safeStudyPlans.length}
            </div>
            <div className="text-sm text-gray-600">Total Plans</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {safeStudyPlans.filter(p => p.is_active && !p.completed_at).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {safeStudyPlans.filter(p => p.completed_at).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudyPlanList;