// src/components/home/how-it-works-section.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Users, Target, Award } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: ClipboardList,
      title: 'রেজিস্ট্রেশন করুন',
      description: 'ফ্রি অ্যাকাউন্ট তৈরি করুন এবং আপনার প্রোফাইল সেটআপ করুন',
      step: '০১'
    },
    {
      icon: Users,
      title: 'মেন্টর সিলেক্ট করুন',
      description: 'বিসিএস ক্যাডারদের থেকে আপনার পছন্দের মেন্টর নির্বাচন করুন',
      step: '০২'
    },
    {
      icon: Target,
      title: 'স্টাডি প্ল্যান ফলো করুন',
      description: 'পার্সোনালাইজ্ড স্টাডি প্ল্যান অনুসরণ করে প্রস্তুতি নিন',
      step: '০৩'
    },
    {
      icon: Award,
      title: 'সফল হোন',
      description: 'রেগুলার প্র্যাকটিস এবং গাইডেন্সে বিসিএসে সফলতা অর্জন করুন',
      step: '০৪'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-bengali">
            কিভাবে কাজ করে
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            সহজ ৪টি ধাপে আপনার বিসিএস প্রস্তুতি সম্পূর্ণ করুন
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative text-center group"
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
                )}
                
                <div className="relative bg-white rounded-2xl p-6 border border-gray-200 group-hover:border-red-300 group-hover:shadow-xl transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-8 h-8 text-red-600 group-hover:text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-bengali">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;