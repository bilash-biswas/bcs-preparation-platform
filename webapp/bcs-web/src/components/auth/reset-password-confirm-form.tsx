// components/auth/reset-password-confirm-form.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

const resetPasswordConfirmSchema = z.object({
  new_password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirm_password"],
});

type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmSchema>;

interface ResetPasswordConfirmFormProps {
  uid: string;
  token: string;
}

export const ResetPasswordConfirmForm: React.FC<ResetPasswordConfirmFormProps> = ({
  uid,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
  });

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    setLoading(true);
    try {
      await apiClient.post('/reset-password/confirm/', {
        uid,
        token,
        new_password: data.new_password,
      });
      
      toast.success('পাসওয়ার্ড সফলভাবে রিসেট হয়েছে');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          নতুন পাসওয়ার্ড
        </label>
        <Input
          type="password"
          {...register('new_password')}
          placeholder="নতুন পাসওয়ার্ড দিন"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
            errors.new_password ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
          }`}
        />
        {errors.new_password && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.new_password.message}</span>
          </span>
        )}
      </div>
      
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          পাসওয়ার্ড নিশ্চিত করুন
        </label>
        <Input
          type="password"
          {...register('confirm_password')}
          placeholder="পাসওয়ার্ড আবার দিন"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
            errors.confirm_password ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
          }`}
        />
        {errors.confirm_password && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.confirm_password.message}</span>
          </span>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-xl shadow-lg hover:shadow-red-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        disabled={loading}
      >
        {loading ? 'রিসেট হচ্ছে...' : 'পাসওয়ার্ড রিসেট করুন'}
      </Button>
    </form>
  );
};