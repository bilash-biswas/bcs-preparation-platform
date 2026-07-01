// src/components/home/features-section.tsx
import React from 'react';
import { 
  BookOpen, 
  Users, 
  Award, 
  Clock, 
  BarChart3, 
  Smartphone 
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'সম্পূর্ণ প্রশ্ন ব্যাংক',
      description: '৫০,০০০+ প্রশ্নের বিশাল সংগ্রহ, সবগুলো বিষয় কভার করা',
    },
    {
      icon: Users,
      title: 'এক্সপার্ট গাইডেন্স',
      description: 'বিসিএস ক্যাডারদের সরাসরি গাইডেন্স ও মেন্টরশিপ',
    },
    {
      icon: Award,
      title: 'মক টেস্ট সিরিজ',
      description: 'রিয়েল এক্সাম সিমুলেশন সহ সম্পূর্ণ মক টেস্ট সিরিজ',
    },
    {
      icon: Clock,
      title: 'টাইম ম্যানেজমেন্ট',
      description: 'স্মার্ট টাইম ট্র্যাকিং এবং পার্সোনালাইজ্ড স্টাডি প্ল্যান',
    },
    {
      icon: BarChart3,
      title: 'ডিটেইলড এনালিটিক্স',
      description: 'পারফরমেন্স ট্র্যাকিং এবং ইমপ্রুভমেন্ট সাজেশন',
    },
    {
      icon: Smartphone,
      title: 'মোবাইল অ্যাপ',
      description: 'যেকোনো সময়, যেকোনো জায়গায় পড়াশোনা চালিয়ে যান',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-bengali">
            আমাদের বিশেষ সুবিধাসমূহ
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            আধুনিক প্রযুক্তি এবং অভিজ্ঞতার সমন্বয়ে গড়ে উঠেছে আমাদের প্ল্যাটফর্ম
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-red-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-6 h-6 text-red-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 font-bengali">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;