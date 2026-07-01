// src/app/(auth)/register/page.tsx
import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="নিবন্ধন করুন"
      subtitle="একটি নতুন অ্যাকাউন্ট তৈরি করুন"
      footerText="ইতিমধ্যে অ্যাকাউন্ট আছে?"
      footerLink="/login"
      footerLinkText="লগইন করুন"
    >
      <RegisterForm />
    </AuthLayout>
  );
}