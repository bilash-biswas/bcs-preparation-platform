import React from 'react';

export default function ExamRulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">পরীক্ষার নিয়ম (Exam Rules)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        আমাদের প্ল্যাটফর্মে পরিচালিত লাইভ এক্সাম, মক টেস্ট এবং অন্যান্য পরীক্ষার সাধারণ নিয়মাবলী ও স্কোরিং সিস্টেমের গাইডলাইন শীঘ্রই এখানে প্রদান করা হবে।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-semibold font-bengali text-lg">
          অনুগ্রহ করে কোনো প্রকার নিয়ম ভঙ্গ ও অনৈতিক উপায় অবলম্বন করা থেকে বিরত থাকুন।
        </p>
      </div>
    </div>
  );
}
