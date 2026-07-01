// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Award, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const paymentId = searchParams.get('payment_id');
  const isSimulated = searchParams.get('simulated') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (paymentId) {
      verifyPaymentAndRefreshProfile();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const verifyPaymentAndRefreshProfile = async () => {
    try {
      setLoading(true);
      // Fetch details of the payment
      const paymentData = await apiClient.get(`/payments/${paymentId}/`);
      setPaymentDetails(paymentData);
      
      // Fetch the updated user profile from backend to get the latest is_premium status
      const profile = await apiClient.get('/auth/profile/');
      if (profile) {
        updateUser(profile);
        toast.success('আপনার প্রিমিয়াম সাবস্ক্রিপশন সচল হয়েছে!');
      }
    } catch (err: any) {
      console.error('Error verifying payment success:', err);
      // In development sandbox simulation, we still allow proceeding
      if (isSimulated) {
        // Mock update
        updateUser({ is_premium: true });
        toast.success('প্রিমিয়াম সাবস্ক্রিপশন সচল হয়েছে (স্যান্ডবক্স সিমুলেশন)');
      } else {
        toast.error('পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">পেমেন্ট ভেরিফাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-2xl text-center space-y-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Confetti sparkle overlay */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500"></div>
        <div className="absolute top-4 right-4 text-emerald-300">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">পেমেন্ট সফল হয়েছে!</h1>
          <p className="text-sm text-gray-500 font-bengali">
            আমাদের BCS Preparation প্রিমিয়াম মেম্বারশিপে আপনাকে স্বাগতম।
          </p>
        </div>

        {/* Info Box */}
        {paymentDetails ? (
          <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100 text-left space-y-2 text-sm text-gray-700 font-bengali">
            <div className="flex justify-between">
              <span className="text-gray-500">প্ল্যান:</span>
              <span className="font-semibold text-gray-900">{paymentDetails.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">পরিমাণ:</span>
              <span className="font-semibold text-gray-900">৳ {parseFloat(paymentDetails.amount).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">পেমেন্ট আইডি:</span>
              <span className="font-mono text-xs text-gray-900 select-all">#{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">পদ্ধতি:</span>
              <span className="font-semibold text-gray-900 uppercase">{paymentDetails.payment_method}</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 text-emerald-800 font-bengali text-sm space-y-2">
            <div className="flex items-center space-x-2 justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>প্রিমিয়াম স্ট্যাটাস একটিভ হয়েছে</span>
            </div>
            <p className="text-xs text-emerald-700">
              স্যান্ডবক্স মোডে পেমেন্ট প্রসেস সম্পন্ন করা হয়েছে।
            </p>
          </div>
        )}

        {/* Premium Highlights */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex flex-col items-center p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <Award className="w-6 h-6 text-indigo-600 mb-1" />
            <span className="text-xs font-semibold text-indigo-900 font-bengali">সীমাহীন মক টেস্ট</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-purple-600 mb-1" />
            <span className="text-xs font-semibold text-purple-900 font-bengali">অ্যাডভান্সড অ্যানালিটিক্স</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link href="/dashboard" className="w-full py-3.5 px-4 rounded-xl bg-gray-950 text-white font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md">
            <span className="font-bengali">ড্যাশবোর্ডে ফিরে যান</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
