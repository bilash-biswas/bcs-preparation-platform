// src/components/home/testimonials-section.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'আহমেদ হাসান',
      role: '৪০তম বিসিএস ক্যাডার',
      image: '/api/placeholder/80/80',
      content: 'এই প্ল্যাটফর্মের মাধ্যমে আমি ৪০তম বিসিএসে সফল হয়েছি। সিস্টেমেটিক পড়াশোনা এবং রেগুলার মক টেস্টই সাফল্যের চাবিকাঠি। বিশেষ করে বাংলা এবং ইংরেজি বিষয়ের জন্য প্রশ্ন ব্যাংক খুবই সহায়ক ছিল।',
      rating: 5
    },
    {
      name: 'ফাতেমা বেগম',
      role: '৩৯তম বিসিএস ক্যাডার',
      image: '/api/placeholder/80/80',
      content: 'মেন্টরদের গাইডেন্স এবং টাইম ম্যানেজমেন্ট টুলস আমার প্রস্তুতিকে অনেক সহজ করে দিয়েছে। প্রতিদিনের স্টাডি প্ল্যান ফলো করে আমি আমার লক্ষ্য অর্জন করতে পেরেছি।',
      rating: 5
    },
    {
      name: 'রফিকুল ইসলাম',
      role: '৪১তম বিসিএস ক্যাডার',
      image: '/api/placeholder/80/80',
      content: 'বাংলাদেশ বিষয়াবলির আপডেটেড ম্যাটেরিয়াল এবং লাইভ ক্লাসগুলো খুবই কার্যকরী ছিল। মক টেস্ট সিরিজটি আসল পরীক্ষার মতোই ছিল, যা আমাকে আত্মবিশ্বাসী করে তুলেছে।',
      rating: 5
    }
  ];

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
            আমাদের সফল শিক্ষার্থীদের কথা
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            দেখুন আমাদের শিক্ষার্থীরা তাদের সাফল্যের গল্প শেয়ার করছেন
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="relative bg-gray-50 rounded-2xl p-6 border border-gray-200 group hover:border-red-200 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-12 h-12 text-red-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 font-bengali">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;