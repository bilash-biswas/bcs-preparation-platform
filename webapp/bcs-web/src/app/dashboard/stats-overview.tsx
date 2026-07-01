// src/components/dashboard/stats-overview.tsx
'use client';

import React from 'react';
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import StatCard from './stat-card';

const StatsOverview: React.FC = () => {
  // Mock data - replace with actual API data
  const statCards = [
    {
      title: 'মোট কুইজ',
      value: '২৪',
      icon: BookOpen,
      color: 'blue' as const,
      change: '+১২%',
      description: 'গত সপ্তাহ থেকে',
    },
    {
      title: 'গড় স্কোর',
      value: '৭৮%',
      icon: Target,
      color: 'green' as const,
      change: '+৫%',
      description: 'উন্নতি হয়েছে',
    },
    {
      title: 'সময় ব্যয়',
      value: '১২ ঘন্টা',
      icon: Clock,
      color: 'purple' as const,
      change: '+৮%',
      description: 'গত মাস থেকে',
    },
    {
      title: 'সাফল্যের হার',
      value: '৮৫%',
      icon: TrendingUp,
      color: 'orange' as const,
      change: '+৩%',
      description: 'ক্রমাগত উন্নতি',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsOverview;