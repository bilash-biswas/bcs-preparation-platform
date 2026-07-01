// src/components/dashboard/dashboard-content.tsx
'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { redirect } from 'next/navigation';
import DashboardHeader from './dashboard-header';
import StatsOverview from './stats-overview';
import QuickActions from './quick-actions';
import RecentActivity from './recent-activity';
import ProgressOverview from './progress-overview';
import LoadingSpinner from '@/components/ui/loading-spinner';

const DashboardContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: loading} = useAuthStore();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect('/login');
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirect will happen
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <DashboardHeader user={user} />
      
      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats and Progress */}
        <div className="lg:col-span-2 space-y-6">
          <StatsOverview />
          <ProgressOverview />
        </div>
        
        {/* Right Column - Quick Actions and Recent Activity */}
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;