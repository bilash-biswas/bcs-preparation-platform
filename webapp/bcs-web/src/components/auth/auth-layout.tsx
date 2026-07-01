// src/components/auth/auth-layout.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, BookOpen, Users, Brain, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
  footerLinkText,
}) => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans">
      
      {/* Left Panel: App branding & value cards (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden border-r border-indigo-950 shadow-2xl">
        {/* Abstract floating glow design */}
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent font-bengali">
                বিসিএস প্রস্তুতি
              </span>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mt-0.5">BCS Preparation Platform</p>
            </div>
          </Link>
        </div>

        {/* Feature Highlights Section */}
        <div className="relative z-10 space-y-10 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>স্মার্ট প্রিপারেশন হাব</span>
            </div>
            <h2 className="text-3xl font-extrabold font-bengali leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              আপনার বিসিএস স্বপ্নের সফল রূপান্তর
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-bengali">
              বিষয়ভিত্তিক ও পূর্ণাঙ্গ লাইভ মডেল টেস্ট, ডাইনামিক অ্যানালিটিক্স এবং সহপাঠীদের সাথে আলোচনার মাধ্যমে আপনার প্রস্তুতি সম্পন্ন করুন।
            </p>
          </div>

          {/* Quick Stats / Highlights List */}
          <div className="space-y-6">
            <motion.div 
              className="flex items-start space-x-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default"
              whileHover={{ x: 4 }}
            >
              <div className="mt-1 bg-indigo-500/20 p-2 rounded-xl text-indigo-300">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold font-bengali text-sm text-slate-100">স্মার্ট অ্যাডাপ্টিভ লার্নিং</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-bengali">
                  আপনার ভুল হওয়া প্রশ্নগুলোর ভিত্তিতে কাস্টমাইজড প্র্যাকটিস শিডিউল তৈরি করে এআই অ্যালগরিদম।
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start space-x-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default"
              whileHover={{ x: 4 }}
            >
              <div className="mt-1 bg-blue-500/20 p-2 rounded-xl text-blue-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold font-bengali text-sm text-slate-100">লাইভ কুইজ ব্যাটল ও লিডারবোর্ড</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-bengali">
                  অন্যান্য হাজারো প্রার্থীর সাথে লাইভ প্রতিযোগিতায় অংশগ্রহণ করে নিজের অবস্থান যাচাই করে নিন।
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start space-x-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default"
              whileHover={{ x: 4 }}
            >
              <div className="mt-1 bg-emerald-500/20 p-2 rounded-xl text-emerald-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold font-bengali text-sm text-slate-100">সক্রিয় স্টাডি গ্রুপ</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-bengali">
                  সহপাঠীদের সাথে প্রশ্ন ও নোটস শেয়ার করার জন্য পূর্ণাঙ্গ গ্রুপ ডিসকাশন ফোরাম।
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 font-medium">
          <p>© 2026 BCS Preparation. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel: Active Auth Forms */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 lg:bg-none">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo visible only on mobile/tablet */}
          <div className="text-center lg:hidden space-y-2 mb-6">
            <div className="inline-flex w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center shadow-lg text-white mb-2 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-bengali">বিসিএস প্রস্তুতি</h1>
            <p className="text-gray-500 text-xs tracking-wider">Bangladesh Civil Service Preparation</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-150 shadow-xl lg:shadow-2xl/10 space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-bengali tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-gray-500 font-bengali">{subtitle}</p>
            </div>

            {/* Children Form (LoginForm/RegisterForm) */}
            <div className="mt-4">{children}</div>

            {/* Bottom Swapper Link */}
            <div className="text-center text-sm pt-4 border-t border-gray-100 font-bengali">
              <p className="text-gray-500">
                {footerText}{' '}
                <Link
                  id="auth-switcher-link"
                  href={footerLink}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors ml-1"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Copyright on Mobile */}
          <div className="text-center text-xs text-gray-400 font-medium lg:hidden">
            <p>© 2026 BCS Preparation. All rights reserved.</p>
          </div>
        </div>
      </div>

    </div>
  );
};