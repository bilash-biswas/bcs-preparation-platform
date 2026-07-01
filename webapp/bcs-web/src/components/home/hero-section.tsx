// src/components/home/hero-section.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Users, Award, BookOpen, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
  const stats = [
    { number: '১০,০০০+', label: 'সক্রিয় শিক্ষার্থী', icon: Users },
    { number: '৫০,০০০+', label: 'প্রশ্ন ব্যাংক', icon: BookOpen },
    { number: '১,০০০+', label: 'সফল ক্যান্ডিডেট', icon: Award },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-red-50 via-white to-green-50 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <div className="space-y-4">
              {/* Trust Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600 font-bengali">
                  ৪.৯/৫ রেটিং (২,৫০০+ রিভিউ)
                </span>
              </div>

              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                variants={itemVariants}
              >
                <span className="block font-bengali">বিসিএস পরীক্ষার</span>
                <span className="block text-red-600 font-bengali bg-gradient-to-r from-red-600 to-green-600 bg-clip-text">
                  সম্পূর্ণ প্রস্তুতি
                </span>
                <span className="block text-gray-700 text-xl md:text-2xl mt-4">
                  একটি প্ল্যাটফর্মেই সবকিছু
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-lg text-gray-600 max-w-2xl leading-relaxed"
                variants={itemVariants}
              >
                আধুনিক প্রযুক্তি, অভিজ্ঞ মেন্টর এবং সম্পূর্ণ ডিজিটাল সিস্টেমের মাধ্যমে 
                আপনার বিসিএস পরীক্ষার প্রস্তুতি নিন। আমাদের সাথে যুক্ত হয়ে সফলতার পথে এগিয়ে যান।
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
              variants={itemVariants}
            >
              <Link href="/register">
                <Button size="lg" className="px-8 py-3 text-lg bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700">
                  <span>ফ্রি ট্রায়াল শুরু করুন</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-2">
                  <Play className="w-5 h-5 mr-2" />
                  <span>ডেমো দেখুন</span>
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-8"
              variants={itemVariants}
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 font-bengali">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 font-bengali">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image/Illustration */}
          <motion.div 
            className="relative"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="aspect-video bg-gradient-to-br from-red-100 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 font-bengali mb-2">
                    ইন্টারেক্টিভ লার্নিং
                  </h3>
                  <p className="text-gray-600">
                    লাইভ কুইজ, মক টেস্ট এবং রিয়েল-টাইম এনালিটিক্স
                  </p>
                </div>
                
                {/* Animated background elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                  <div className="absolute top-4 left-4 w-8 h-8 bg-red-300 rounded-full opacity-20 animate-ping"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 bg-green-300 rounded-full opacity-20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-float"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-400 rounded-full opacity-20 animate-float animation-delay-2000"></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;