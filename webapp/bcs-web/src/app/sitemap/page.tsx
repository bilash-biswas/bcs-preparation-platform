import React from 'react';
import Link from 'next/link';

export default function SitemapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 font-bengali text-center">সাইটম্যাপ (Sitemap)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 font-bengali">মেনু</h2>
          <ul className="space-y-2">
            <li><Link href="/subjects" className="text-red-600 hover:underline font-bengali">বিষয়সমূহ</Link></li>
            <li><Link href="/quizzes" className="text-red-600 hover:underline font-bengali">কুইজ</Link></li>
            <li><Link href="/leaderboard" className="text-red-600 hover:underline font-bengali">লিডারবোর্ড</Link></li>
            <li><Link href="/blog" className="text-red-600 hover:underline font-bengali">ব্লগ</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 font-bengali">সাপোর্ট</h2>
          <ul className="space-y-2">
            <li><Link href="/help" className="text-red-600 hover:underline font-bengali">সাহায্য কেন্দ্র</Link></li>
            <li><Link href="/contact" className="text-red-600 hover:underline font-bengali">যোগাযোগ</Link></li>
            <li><Link href="/privacy" className="text-red-600 hover:underline font-bengali">প্রাইভেসি পলিসি</Link></li>
            <li><Link href="/terms" className="text-red-600 hover:underline font-bengali">টার্মস অফ সার্ভিস</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 font-bengali">রিসোর্স</h2>
          <ul className="space-y-2">
            <li><Link href="/guide" className="text-red-600 hover:underline font-bengali">বিসিএস গাইড</Link></li>
            <li><Link href="/syllabus" className="text-red-600 hover:underline font-bengali">সিলেবাস</Link></li>
            <li><Link href="/exam-rules" className="text-red-600 hover:underline font-bengali">পরীক্ষার নিয়ম</Link></li>
            <li><Link href="/success-stories" className="text-red-600 hover:underline font-bengali">সাকসেস স্টোরি</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
