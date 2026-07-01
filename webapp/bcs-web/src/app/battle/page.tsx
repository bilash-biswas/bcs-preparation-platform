// src/app/battle/page.tsx
"use client"
import React from 'react';
import BattleLobby from '@/components/battle/BattleLobby';
import { Suspense } from 'react';

const BattlePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BattleLobby />
    </Suspense>
  );
};

export default BattlePage;