import React from 'react';

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">সাহায্য কেন্দ্র (Help Center)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        আমাদের সাহায্য কেন্দ্রটি বর্তমানে উন্নয়নাধীন রয়েছে। বিসিএস প্রস্তুতি সংক্রান্ত যেকোনো বিষয়ে সহযোগিতার জন্য সরাসরি আমাদের সাপোর্ট ইমেইলে যোগাযোগ করতে পারেন।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-700 font-semibold font-bengali text-lg">
          যোগাযোগ করুন: <a href="mailto:support@bcspreparation.com" className="underline hover:text-red-800">support@bcspreparation.com</a>
        </p>
      </div>
    </div>
  );
}
