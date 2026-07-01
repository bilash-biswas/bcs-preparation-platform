// pages/study-plans.tsx - Fixed version

'use client'
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchStudyPlans,
  createStudyPlan,
  generateStudySchedule,
  fetchStudyPlanProgress,
  setCurrentStudyPlan,
} from '@/store/slices/studyPlanSlice';
import { fetchAllSubjects } from '@/store/slices/subjectSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StudyPlanCreator from '@/components/study/StudyPlanCreator';
import StudyPlanList from '@/components/study/StudyPlanList';

const StudyPlansPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { studyPlans, currentStudyPlan, loading } = useAppSelector(
    (state) => state.studyPlans
  );
  const { subjects } = useAppSelector((state) => state.subjects);
  const [showCreator, setShowCreator] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    dispatch(fetchStudyPlans());
    dispatch(fetchAllSubjects(undefined));
  }, [dispatch]);

  const handleCreatePlan = (planData: any) => {
    dispatch(createStudyPlan(planData));
    setShowCreator(false);
  };

  const handleViewPlan = (plan: any) => {
    dispatch(setCurrentStudyPlan(plan));
    setActiveTab('detail');
    // Fetch additional data for the plan
    dispatch(generateStudySchedule(plan.id));
    dispatch(fetchStudyPlanProgress(plan.id));
  };

  const handleBackToList = () => {
    setActiveTab('list');
    dispatch(setCurrentStudyPlan(null));
  };

  // Default upcoming milestones if none are provided
  const getUpcomingMilestones = (plan: any) => {
    if (plan.progress?.upcoming_milestones?.length > 0) {
      return plan.progress.upcoming_milestones;
    }
    
    // Generate default milestones based on the study plan
    return [
      `Complete ${plan.daily_goal * 7} questions this week`,
      "Achieve 80% accuracy in all subjects",
      "Complete first revision cycle",
      `Finish ${plan.subjects.length} subjects`,
      "Take a full-length practice test",
    ];
  };

  if (loading && studyPlans.length === 0) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'list' ? (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Study Plans</h1>
                  <p className="text-gray-600 mt-2">
                    Create and manage your personalized study schedules
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreator(true)}
                  variant="default"
                  disabled={showCreator}
                >
                  Create New Plan
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Study Plan Creator */}
              {showCreator && (
                <div className="lg:col-span-1">
                  <StudyPlanCreator
                    onSubmit={handleCreatePlan}
                    onCancel={() => setShowCreator(false)}
                    subjects={subjects}
                  />
                </div>
              )}

              {/* Study Plan List */}
              <div className={showCreator ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <StudyPlanList
                  studyPlans={studyPlans}
                  onViewPlan={handleViewPlan}
                  loading={loading}
                />
              </div>
            </div>
          </>
        ) : (
          // Study Plan Detail View
          <div>
            <div className="mb-6">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="mb-4"
              >
                ← Back to Plans
              </Button>
              
              {currentStudyPlan && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentStudyPlan.name}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Track your progress and follow your study schedule
                  </p>
                </div>
              )}
            </div>

            {currentStudyPlan && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Overview */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {currentStudyPlan.progress?.completion_percentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Completion</div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Days Remaining</span>
                        <span>{currentStudyPlan.progress?.days_remaining || currentStudyPlan.duration_days}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${((currentStudyPlan.duration_days - (currentStudyPlan.progress?.days_remaining || currentStudyPlan.duration_days)) / currentStudyPlan.duration_days) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {currentStudyPlan.daily_goal}
                        </div>
                        <div className="text-sm text-gray-600">Daily Goal</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {currentStudyPlan.subjects.length}
                        </div>
                        <div className="text-sm text-gray-600">Subjects</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Study Schedule */}
                <Card className="lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Study Schedule</h2>
                  {currentStudyPlan.schedule ? (
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(currentStudyPlan.schedule.daily_schedule || {}).map(([day, task]) => (
                        <div key={day} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-sm capitalize">{day}</div>
                          {/* <div className="text-xs text-gray-600 mt-1">{task}</div> */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No schedule generated yet</p>
                      <Button
                        onClick={() => dispatch(generateStudySchedule(currentStudyPlan.id))}
                        variant="default"
                      >
                        Generate Schedule
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Subjects */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Subjects</h2>
                  <div className="space-y-2">
                    {currentStudyPlan.subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        <span className="font-medium">{subject.name}</span>
                        <span className="text-sm text-blue-600">
                          {subject.total_questions} questions
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Upcoming Milestones - FIXED */}
                <Card className="lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Upcoming Milestones</h2>
                  <div className="space-y-3">
                    {getUpcomingMilestones(currentStudyPlan).map((milestone: any, index: any) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500"
                      >
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm">{milestone}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default StudyPlansPage;