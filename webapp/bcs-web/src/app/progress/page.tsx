import React from 'react';
import ProgressHistory from '@/components/progress/history/page';
import LiveProgressTracker from '@/components/progress/live-tracker/page';

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-bengali mb-2">প্রগ্রেস ট্র্যাকিং</h1>
          <p className="text-gray-600">আপনার লার্নিং জার্নি এবং উন্নতি দেখুন</p>
        </div>
        <LiveProgressTracker />
        <ProgressHistory />
      </div>
    </div>
  );
}