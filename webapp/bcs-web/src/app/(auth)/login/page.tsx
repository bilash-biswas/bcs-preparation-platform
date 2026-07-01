'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function LoginPage() {
  return (
    <AuthLayout
      title="লগইন করুন"
      subtitle="আপনার অ্যাকাউন্টে অ্যাক্সেস পেতে লগইন করুন"
      footerText="অ্যাকাউন্ট নেই?"
      footerLink="/register"
      footerLinkText="নিবন্ধন করুন"
    >
      <LoginForm />
    </AuthLayout>
  );
}