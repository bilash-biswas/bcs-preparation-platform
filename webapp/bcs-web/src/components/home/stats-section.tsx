// src/components/home/stats-section.tsx
import React from 'react';

const StatsSection: React.FC = () => {
  const stats = [
    { number: 95, suffix: '%', label: 'সাফল্যের হার', description: 'আমাদের শিক্ষার্থীদের' },
    { number: 50000, label: 'প্রশ্ন ব্যাংক', description: 'সম্পূর্ণ আপডেটেড' },
    { number: 1000, label: 'মক টেস্ট', description: 'বিষয়ভিত্তিক' },
    { number: 24, suffix: '/৭', label: 'সাপোর্ট', description: 'সব সময় উপলব্ধ' },
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-red-600 to-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                {stat.number}
                {stat.suffix && <span>{stat.suffix}</span>}
              </div>
              <div className="text-lg font-semibold mb-1 font-bengali">
                {stat.label}
              </div>
              <div className="text-red-100 text-sm">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;