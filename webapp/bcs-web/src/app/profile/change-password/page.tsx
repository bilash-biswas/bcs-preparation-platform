// app/profile/change-password/page.tsx
'use client';

import React from 'react';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Profile */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            প্রোফাইলে ফিরে যান
          </Link>
        </div>

        {/* Change Password Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardContent className="text-2xl font-bold text-gray-900 font-bengali">
              পাসওয়ার্ড পরিবর্তন
            </CardContent>
            <p className="text-gray-600 text-sm">
              আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন
            </p>
          </CardHeader>
          
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">সুরক্ষা টিপস</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• শক্তিশালী পাসওয়ার্ড ব্যবহার করুন</li>
            <li>• অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন মিশ্রিত করুন</li>
            <li>• অন্য ওয়েবসাইটের পাসওয়ার্ড পুনরায় ব্যবহার করবেন না</li>
          </ul>
        </div>
      </div>
    </div>
  );
}