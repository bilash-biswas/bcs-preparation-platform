// src/components/dashboard/quick-actions.tsx
import React from 'react';
import Link from 'next/link';
import { 
  Play, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'কুইজ শুরু করুন',
      description: 'নতুন কুইজ দিয়ে শুরু করুন',
      icon: Play,
      href: '/quizzes',
      color: 'bg-blue-500',
    },
    {
      title: 'মক টেস্ট',
      description: 'পূর্ণাঙ্গ মক টেস্ট দিন',
      icon: Clock,
      href: '/mock-tests',
      color: 'bg-green-500',
    },
    {
      title: 'প্র্যাকটিস সেশন',
      description: 'বিষয়ভিত্তিক প্র্যাকটিস',
      icon: BookOpen,
      href: '/practice',
      color: 'bg-purple-500',
    },
    {
      title: 'প্রগ্রেস রিপোর্ট',
      description: 'বিস্তারিত এনালিটিক্স',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 font-bengali">
        দ্রুত একশন
      </h2>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
                <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm font-bengali">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </div>
                <Rocket className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Daily Goal */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <div className="flex items-center space-x-3">
          <Award className="w-8 h-8 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800 text-sm font-bengali">
              আজকের লক্ষ্য
            </h3>
            <p className="text-xs text-yellow-700">
              ৫০টি প্রশ্ন সম্পন্ন করুন
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
            style={{ width: '30%' }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-yellow-700 mt-1">
          <span>১৫/৫০ প্রশ্ন</span>
          <span>৩০% সম্পূর্ণ</span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;