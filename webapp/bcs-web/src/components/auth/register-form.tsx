// components/auth/register-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, UserPlus, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'ইউজারনাম অন্তত ৩ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে'),
  password_confirm: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করা আবশ্যক'),
  user_type: z.enum(['student', 'teacher']),
  phone: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["password_confirm"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      user_type: 'student',
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
      const response = await apiClient.post<{
        user: any;
        access: string;
        refresh: string;
        message: string;
      }>('/auth/register/', data);
      
      registerUser(response.user, response.access, response.refresh);
      toast.success(response.message || 'সফলভাবে নিবন্ধন সম্পন্ন হয়েছে!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'নিবন্ধন করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-4.5">
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
      
      {/* Username field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          ইউজারনাম
        </label>
        <Input
          id="register-username"
          type="text"
          {...register('username')}
          placeholder="আপনার ইউজারনাম দিন"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/10 ${
            errors.username ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
          }`}
        />
        {errors.username && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.username.message}</span>
          </span>
        )}
      </div>

      {/* Email field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          ইমেইল
        </label>
        <Input
          id="register-email"
          type="email"
          {...register('email')}
          placeholder="আপনার ইমেইল দিন"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/10 ${
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

      {/* User Type field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          অ্যাকাউন্ট টাইপ
        </label>
        <select
          id="register-usertype"
          {...register('user_type')}
          className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 font-bengali"
          disabled={loading}
        >
          <option value="student">ছাত্র/ছাত্রী</option>
          <option value="teacher">শিক্ষক</option>
        </select>
      </div>

      {/* Password field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          পাসওয়ার্ড
        </label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"
            disabled={loading}
            className={`h-11 rounded-xl border pl-4 pr-11 text-sm w-full text-gray-900 transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/10 ${
              errors.password ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
            }`}
          />
          <button
            id="toggle-register-password"
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

      {/* Password Confirm field */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          পাসওয়ার্ড নিশ্চিত করুন
        </label>
        <div className="relative">
          <Input
            id="register-password-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('password_confirm')}
            placeholder="পাসওয়ার্ড পুনরায় লিখুন"
            disabled={loading}
            className={`h-11 rounded-xl border pl-4 pr-11 text-sm w-full text-gray-900 transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/10 ${
              errors.password_confirm ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
            }`}
          />
          <button
            id="toggle-register-confirm-password"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password_confirm && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.password_confirm.message}</span>
          </span>
        )}
      </div>

      {/* Phone number field (optional) */}
      <div className="space-y-1.5 text-left">
        <label className="block text-sm font-semibold text-gray-700 font-bengali">
          ফোন নম্বর (ঐচ্ছিক)
        </label>
        <Input
          id="register-phone"
          type="tel"
          {...register('phone')}
          placeholder="আপনার ফোন নম্বর (যেমন: 01XXXXXXXXX)"
          disabled={loading}
          className={`h-11 rounded-xl border px-4 text-sm w-full text-gray-900 transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/10 ${
            errors.phone ? 'border-red-500 bg-red-50/10 focus:ring-red-500/10' : 'border-gray-300'
          }`}
        />
        {errors.phone && (
          <span className="text-xs text-red-500 font-semibold flex items-center space-x-1 font-bengali">
            <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>{errors.phone.message}</span>
          </span>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          id="btn-register-submit"
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>নিবন্ধন হচ্ছে...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>নিবন্ধন করুন</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};