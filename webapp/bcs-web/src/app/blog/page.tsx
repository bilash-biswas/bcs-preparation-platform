import React from 'react';

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">ব্লগ (Blog)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        বিসিএস ক্যাডারদের পরামর্শ, পরীক্ষার কৌশল, এবং বিভিন্ন বিষয়ের দিকনির্দেশনামূলক প্রবন্ধ এখানে প্রকাশিত হবে।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-semibold font-bengali text-lg">
          নতুন আর্টিকেল নিয়ে খুব শীঘ্রই আমরা আসছি!
        </p>
      </div>
    </div>
  );
}
