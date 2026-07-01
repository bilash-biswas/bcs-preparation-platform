// src/components/home/course-highlights-section.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Users, BookOpen } from 'lucide-react';

const CourseHighlightsSection: React.FC = () => {
  const highlights = [
    {
      title: 'বাংলা সাহিত্য ও ভাষা',
      description: 'সম্পূর্ণ সিলেবাস কভার, গুরুত্বপূর্ণ টপিকস এবং প্র্যাকটিস সেশন',
      features: ['৫,০০০+ প্রশ্ন', '১০০+ মক টেস্ট', 'লাইভ ক্লাস'],
      duration: '৩ মাস',
      students: '২,৫০০+'
    },
    {
      title: 'ইংরেজি ভাষা ও সাহিত্য',
      description: 'গ্রামার, ভোকাবুলারি এবং কম্প্রিহেনশন সহ সম্পূর্ণ প্রস্তুতি',
      features: ['৩,০০০+ প্রশ্ন', '৫০+ মক টেস্ট', 'এক্সপার্ট গাইডেন্স'],
      duration: '৩ মাস',
      students: '১,৮০০+'
    },
    {
      title: 'বাংলাদেশ বিষয়াবলি',
      description: 'ইতিহাস, সংবিধান, অর্থনীতি এবং চলমান বিষয়সমূহ',
      features: ['৮,০০০+ প্রশ্ন', '১৫০+ মক টেস্ট', 'আপডেটেড ম্যাটেরিয়াল'],
      duration: '৪ মাস',
      students: '৩,২০০+'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-bengali">
            জনপ্রিয় কোর্সসমূহ
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            বিষয়ভিত্তিক সম্পূর্ণ প্রস্তুতি এবং এক্সপার্ট গাইডেন্স
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-bengali">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  {course.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students} শিক্ষার্থী</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300 group-hover:scale-105 transform">
                  কোর্স ডিটেইল দেখুন
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseHighlightsSection;