// app/auth/reset-password/[uid]/[token]/page.tsx
'use client';

import React from 'react';
import { ResetPasswordConfirmForm } from '@/components/auth/reset-password-confirm-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useParams } from 'next/navigation';

export default function ResetPasswordConfirmPage() {
  const params = useParams();
  const uid = params.uid as string;
  const token = params.token as string;

  return (
    <AuthLayout
      title="নতুন পাসওয়ার্ড সেট করুন"
      subtitle="আপনার নতুন পাসওয়ার্ড দিন"
      footerText="লগইন করতে চান?"
      footerLink="/login"
      footerLinkText="লগইন করুন"
    >
      <ResetPasswordConfirmForm uid={uid} token={token} />
    </AuthLayout>
  );
}