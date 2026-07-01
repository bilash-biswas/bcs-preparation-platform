import React from 'react';

export default function SyllabusPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">সিলেবাস (BCS Syllabus)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        বিসিএস প্রিলিমিনারি পরীক্ষার ২০০ নম্বরের অফিশিয়াল সিলেবাস এবং ক্যাডার ভিত্তিক মানবন্টন সংক্রান্ত বিস্তারিত নির্দেশিকা শীঘ্রই আসছে।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-semibold font-bengali text-lg">
          সিলেবাস সংক্রান্ত সর্বশেষ আপডেটের জন্য আমাদের সাথে থাকুন।
        </p>
      </div>
    </div>
  );
}
