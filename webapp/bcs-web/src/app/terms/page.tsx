import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">ব্যবহারের শর্তাবলী (Terms of Service)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        আমাদের প্ল্যাটফর্ম ব্যবহার করার জন্য কিছু নির্দিষ্ট শর্ত ও নীতিমালা মেনে চলতে হবে। এই নীতিমালা পাতাটি শীঘ্রই আপডেট করা হবে।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-semibold font-bengali text-lg">
          যেকোনো তথ্যের জন্য ইমেইল করুন: support@bcspreparation.com
        </p>
      </div>
    </div>
  );
}
