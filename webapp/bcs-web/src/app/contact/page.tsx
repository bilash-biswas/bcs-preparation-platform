import React from 'react';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 font-bengali">যোগাযোগ (Contact Us)</h1>
      <p className="text-lg text-gray-600 mb-8 font-bengali">
        আমাদের সাথে যোগাযোগের জন্য নিচে দেওয়া ঠিকানায় অথবা সরাসরি আমাদের ইমেইল আইডিতে ইমেইল করতে পারেন। আমরা দ্রুত সময়ের মধ্যে আপনার সাথে যোগাযোগ করব।
      </p>
      <div className="inline-block p-6 bg-red-50 rounded-xl border border-red-100 text-left">
        <p className="text-gray-800 font-semibold font-bengali text-lg mb-2">
          📧 ইমেইল: <a href="mailto:support@bcspreparation.com" className="underline hover:text-red-700">support@bcspreparation.com</a>
        </p>
        <p className="text-gray-800 font-semibold font-bengali text-lg mb-2">
          📞 ফোন: +৮৮ ০১৭XX-XXXXXX
        </p>
        <p className="text-gray-800 font-semibold font-bengali text-lg">
          📍 ঠিকানা: ঢাকা, বাংলাদেশ
        </p>
      </div>
    </div>
  );
}
