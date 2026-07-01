// components/auth/reset-password-form.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await apiClient.post('/reset-password/', data);
      setEmailSent(true);
      toast.success('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে');
    } catch (error: any) {
      toast.error(error.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 text-4xl">✓</div>
        <h3 className="text-lg font-semibold">ইমেইল পাঠানো হয়েছে</h3>
        <p className="text-gray-600">
          পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। দয়া করে আপনার ইমেইল চেক করুন।
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          ইমেইল
        </label>
        <Input
          type="email"
          {...register('email')}
          placeholder="আপনার ইমেইল দিন"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
            errors.email ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.email.message}</span>
          </span>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-xl shadow-lg hover:shadow-red-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        disabled={loading}
      >
        {loading ? 'পাঠানো হচ্ছে...' : 'পাসওয়ার্ড রিসেট লিঙ্ক পাঠান'}
      </Button>
    </form>
  );
};