// app/auth/forgot-password/page.tsx
'use client';

import React from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="পাসওয়ার্ড ভুলে গেছেন?"
      subtitle="আপনার ইমেইল দিন এবং আমরা আপনাকে একটি রিসেট লিঙ্ক পাঠাব"
      footerText="আপনার পাসওয়ার্ড মনে আছে?"
      footerLink="/login"
      footerLinkText="লগইন করুন"
    >
      <ResetPasswordForm />
      
      {/* Additional Help */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 text-center">
          ইমেইল পাননি?{' '}
          <span className="font-medium">স্প্যাম ফোল্ডার চেক করুন</span> অথবা{' '}
          <Link href="/contact" className="text-red-600 hover:text-red-500 font-medium">
            সহায়তা নিন
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}