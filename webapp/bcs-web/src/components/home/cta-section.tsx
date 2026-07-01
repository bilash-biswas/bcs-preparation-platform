// src/components/home/cta-section.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, Award, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CTASection: React.FC = () => {
  const features = [
    { icon: Shield, text: '১০০% সুরক্ষিত পেমেন্ট' },
    { icon: Clock, text: '২৪/৭ সাপোর্ট' },
    { icon: Users, text: '১০,০০০+ সক্রিয় শিক্ষার্থী' },
    { icon: Award, text: 'গ্যারান্টিড সাফল্য' }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-red-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
            <span className="text-sm">বাংলাদেশের #১ বিসিএস প্রস্তুতি প্ল্যাটফর্ম</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-bengali">
            আপনার বিসিএস স্বপ্ন পূরণের<br />যাত্রা শুরু করুন
          </h2>
          
          {/* Description */}
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            আজই জয়েন করুন বাংলাদেশের সবচেয়ে বিশ্বস্ত বিসিএস প্রস্তুতি প্ল্যাটফর্মে। 
            আমাদের সাথে থাকুন সফলতার গ্যারান্টি সহ।
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link href="/register">
              <Button 
                size="lg" 
                className="px-8 py-3 text-lg bg-white text-gray-900 hover:bg-gray-100 font-semibold"
              >
                <span>ফ্রি অ্যাকাউন্ট তৈরি করুন</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link href="/pricing">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg border-2 border-white text-white hover:bg-white hover:text-gray-900"
              >
                <Award className="w-5 h-5 mr-2" />
                <span>প্রিমিয়াম প্ল্যান দেখুন</span>
              </Button>
            </Link>
          </motion.div>

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="pt-8"
          >
            <p className="text-sm text-gray-400">
              ⚡ ৭-দিনের মানি ব্যাক গ্যারান্টি • 🔒 ১০০% সুরক্ষিত • 🎯 ৯৫% সাফল্যের হার
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;