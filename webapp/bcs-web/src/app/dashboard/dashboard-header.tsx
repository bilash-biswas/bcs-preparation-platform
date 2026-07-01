// src/components/dashboard/dashboard-header.tsx
import React from 'react';
import { User } from '@/types/auth';
import { Calendar, Award, Zap, Coins } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const currentDate = new Date();
  const greeting = getGreeting();
  
  function getGreeting() {
    const hour = currentDate.getHours();
    if (hour < 12) return 'সুপ্রভাত';
    if (hour < 18) return 'শুভ অপরাহ্ন';
    return 'শুভ সন্ধ্যা';
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.first_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                </span>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 font-bengali">
                {greeting}, {user.first_name || user.username}!
              </h1>
              <p className="text-gray-600 mt-1 font-bengali">
                আপনার বিসিএস প্রস্তুতি যাত্রায় স্বাগতম
              </p>
              
              {/* User Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.is_premium && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Award className="w-3 h-3 mr-1" />
                    <span className="font-bengali">প্রিমিয়াম সদস্য</span>
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Zap className="w-3 h-3 mr-1" />
                  <span className="font-bengali">{user.streak} দিন স্ট্রীক</span>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className="font-bengali">{formatDate(currentDate)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coins Display */}
        <div className="mt-4 sm:mt-0 sm:ml-6">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-white text-sm font-medium font-bengali">কয়েন</div>
            <div className="text-2xl font-bold text-white mt-1">
              {user.coins.toLocaleString('bn-BD')}
            </div>
            <div className="text-yellow-100 text-xs mt-1 font-bengali">
              পুরস্কার রিডিম করুন
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;