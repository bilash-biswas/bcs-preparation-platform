// components/auth/login-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'ইউজারনাম বা ইমেইল লিখুন'),
  password: z.string().min(1, 'পাসওয়ার্ড লিখুন'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
      const response = await apiClient.post<{
        user: any;
        access: string;
        refresh: string;
        message: string;
      }>('/auth/login/', data);
      
      login(response.user, response.access, response.refresh);
      toast.success(response.message || 'সফলভাবে লগইন করা হয়েছে!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'লগইন করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-5">
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
      {/* Username / Email field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          ইউজারনাম বা ইমেইল
        </label>
        <div className="relative">
          <Input
            id="login-username"
            type="text"
            {...register('username')}
            placeholder="আপনার ইউজারনাম বা ইমেইল দিন"
            disabled={loading}
            className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
              errors.username ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.username && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.username.message}</span>
          </span>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          পাসওয়ার্ড
        </label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="আপনার পাসওয়ার্ড দিন"
            disabled={loading}
            className={`h-11 rounded-xl border pl-4 pr-11 text-sm w-full text-gray-900 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
              errors.password ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
            }`}
          />
          <button
            id="toggle-login-password"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.password.message}</span>
          </span>
        )}
      </div>

      {/* Forgot Password link */}
      <div className="text-right">
        <Link
          id="link-forgot-password"
          href="/forgot-password"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bengali"
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </Link>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          id="btn-login-submit"
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>লগইন হচ্ছে...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};