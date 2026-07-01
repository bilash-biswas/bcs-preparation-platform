// app/payment/cancel/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-2xl text-center space-y-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

        {/* Cancel Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 text-red-600">
          <XCircle className="h-12 w-12" />
        </div>

        {/* Title */}
        <div className="space-y-2 font-bengali">
          <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট বাতিল করা হয়েছে</h1>
          <p className="text-sm text-gray-500">
            দুঃখিত, কোনো কারণে আপনার পেমেন্ট সেশনটি সফল হয়নি বা বাতিল করা হয়েছে।
          </p>
        </div>

        {/* Info detail */}
        {paymentId && (
          <div className="bg-red-50/30 rounded-2xl p-4 border border-red-100/50 text-xs font-mono text-gray-500 select-all">
            Payment Reference: #{paymentId}
          </div>
        )}

        {/* Help Notice */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-left text-sm text-gray-600 font-bengali">
          <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span>পেমেন্ট প্রসেসিংয়ে কোনো সমস্যা মনে হলে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <Link href="/pricing" className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md">
            <RefreshCw className="w-4 h-4" />
            <span className="font-bengali">আবার চেষ্টা করুন</span>
          </Link>
          
          <Link href="/dashboard" className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer border border-gray-150">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bengali">ড্যাশবোর্ড</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
