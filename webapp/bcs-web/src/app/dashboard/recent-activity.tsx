// src/components/dashboard/recent-activity.tsx
import React from 'react';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from '@/utils/date-utils';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'quiz_complete',
      title: 'বাংলা সাহিত্য কুইজ',
      score: 85,
      total: 100,
      status: 'completed',
      time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      id: 2,
      type: 'quiz_incomplete',
      title: 'ইংরেজি গ্রামার টেস্ট',
      score: 0,
      total: 50,
      status: 'incomplete',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      id: 3,
      type: 'achievement',
      title: '১০০টি প্রশ্ন সম্পন্ন',
      description: 'মাইলস্টোন অর্জন!',
      score: 0,
      status: 'achievement',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      icon: Award,
      color: 'text-purple-500',
    },
    {
      id: 4,
      type: 'quiz_complete',
      title: 'গণিত প্র্যাকটিস',
      score: 70,
      total: 100,
      status: 'completed',
      time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      icon: CheckCircle,
      color: 'text-green-500',
    },
  ];

  const getStatusText = (activity: any) => {
    switch (activity.status) {
      case 'completed':
        return `${activity.score}/${activity.total} পয়েন্ট`;
      case 'incomplete':
        return 'অসম্পূর্ণ';
      case 'achievement':
        return 'অর্জন';
      default:
        return '';
    }
  };

  const getTimeText = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins} মিনিট আগে`;
    } else if (diffHours < 24) {
      return `${diffHours} ঘন্টা আগে`;
    } else {
      return format(date, 'dd MMM', { locale: bn });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 font-bengali">
        সাম্প্রতিক এক্টিভিটি
      </h2>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`mt-1 ${activity.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </h3>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {getTimeText(activity.time)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-medium ${
                    activity.status === 'completed' ? 'text-green-600' :
                    activity.status === 'incomplete' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`}>
                    {getStatusText(activity)}
                  </span>
                  
                  {activity.status === 'completed' && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      activity.score >= 80 ? 'bg-green-100 text-green-800' :
                      activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.score >= 80 ? 'চমৎকার' :
                      activity.score >= 60 ? 'ভাল' : 'প্রয়োজন উন্নতি'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium font-bengali">
          সব এক্টিভিটি দেখুন
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;