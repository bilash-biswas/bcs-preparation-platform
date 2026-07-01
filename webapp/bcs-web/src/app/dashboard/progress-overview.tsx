// src/components/dashboard/progress-overview.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { BookOpen, TrendingUp, Target } from 'lucide-react';

const ProgressOverview: React.FC = () => {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const response = await apiClient.get('/core/progress/');
      return response.data;
    },
  });

  const subjects = [
    { name: 'বাংলা সাহিত্য', progress: 75, target: 90 },
    { name: 'ইংরেজি ভাষা', progress: 60, target: 85 },
    { name: 'বাংলাদেশ বিষয়ক', progress: 80, target: 95 },
    { name: 'গণিত', progress: 55, target: 80 },
    { name: 'সাধারণ বিজ্ঞান', progress: 70, target: 88 },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 font-bengali">
          বিষয়ভিত্তিক অগ্রগতি
        </h2>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Target className="w-4 h-4" />
          <span>লক্ষ্য: ৮০%+</span>
        </div>
      </div>

      <div className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 font-bengali">
                {subject.name}
              </span>
              <span className="text-sm text-gray-500">
                {subject.progress}% / {subject.target}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${subject.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>বর্তমান: {subject.progress}%</span>
              <span className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                লক্ষ্য: {subject.target}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-bengali">সামগ্রিক অগ্রগতি</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-gray-900">৬৮%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;