// components/study/StudyPlanCreator.tsx
import React, { useState } from 'react';
import { Subject } from '../../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StudyPlanCreatorProps {
  onSubmit: (studyPlanData: any) => void;
  onCancel: () => void;
  subjects: Subject[];
}

const StudyPlanCreator: React.FC<StudyPlanCreatorProps> = ({
  onSubmit,
  onCancel,
  subjects,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    duration_days: 7,
    daily_goal: 20,
    selectedSubjects: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      subjects: formData.selectedSubjects,
    });
  };

  const toggleSubject = (subjectId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }));
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Create Study Plan</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Final Exam Preparation"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (Days)
            </label>
            <input
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="90"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Goal (Questions)
            </label>
            <input
              type="number"
              value={formData.daily_goal}
              onChange={(e) => setFormData(prev => ({ ...prev, daily_goal: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="100"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subjects
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.selectedSubjects.includes(subject.id)
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.selectedSubjects.includes(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                  className="hidden"
                />
                <div className="flex items-center space-x-3 w-full">
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    formData.selectedSubjects.includes(subject.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {formData.selectedSubjects.includes(subject.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{subject.name}</div>
                    <div className="text-xs text-gray-500">
                      {subject.category.name} • {subject.total_questions} questions
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {formData.selectedSubjects.length === 0 && (
            <p className="text-sm text-red-600 mt-1">Please select at least one subject</p>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button type="submit" variant="default" className="flex-1" disabled={formData.selectedSubjects.length === 0}>
            Create Study Plan
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default StudyPlanCreator;