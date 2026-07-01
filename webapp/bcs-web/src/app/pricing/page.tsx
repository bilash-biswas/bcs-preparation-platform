// app/pricing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Star, Shield, Award, Sparkles, Loader2, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentPlan {
  id: number;
  name: string;
  plan_type: 'basic' | 'premium' | 'gold' | 'platinum';
  description: string;
  price: string;
  original_price: string;
  duration_days: number;
  duration_display: string;
  features: string[];
  is_popular: boolean;
  discount_percentage: number;
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxPaymentId, setSandboxPaymentId] = useState<number | null>(null);
  const [sandboxAmount, setSandboxAmount] = useState<number>(0);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/plans/');
      const plansList = Array.isArray(data) ? data : data.results || [];
      setPlans(plansList);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      toast.error('পরিকল্পনাসমূহ লোড করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: PaymentPlan) => {
    if (!isAuthenticated) {
      toast.error('দয়া করে প্রথমে লগইন করুন।');
      router.push(`/login?redirect=/pricing`);
      return;
    }

    try {
      setProcessingPlanId(plan.id);
      
      // Request a subscription checkout session from backend
      const response = await apiClient.post('/payments/create_subscription/', {
        plan_id: plan.id,
        payment_method: 'stripe',
      });

      if (response.checkout_url) {
        // Redirect to Stripe checkout page if stripe initialized successfully
        toast.loading('পেমেন্ট গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...');
        window.location.href = response.checkout_url;
      } else if (response.is_mock_available && response.payment_id) {
        // Stripe session failed (due to mock stripe keys in development). Prompt sandbox modal
        setSandboxPaymentId(response.payment_id);
        setSandboxAmount(response.amount);
        setSandboxError(response.error);
        setShowSandboxModal(true);
        toast.success('লোকাল ডেভলপমেন্ট স্যান্ডবক্স মোড সক্রিয় করা হয়েছে!');
      } else {
        toast.error(response.error || 'পেমেন্ট সেশন তৈরি করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      toast.error(err.response?.data?.error || 'পেমেন্ট রিকোয়েস্টে সমস্যা হয়েছে।');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const executeSandboxPayment = async () => {
    if (!sandboxPaymentId) return;

    try {
      setLoading(true);
      const response = await apiClient.post(`/payments/${sandboxPaymentId}/simulate_mock_payment/`);
      toast.success(response.message || 'পেমেন্ট সফলভাবে অনুকরণ করা হয়েছে!');
      setShowSandboxModal(false);
      
      // Redirect directly to the success page with sandbox simulated payment id
      router.push(`/payment/success?payment_id=${sandboxPaymentId}&simulated=true`);
    } catch (err: any) {
      console.error('Sandbox execution error:', err);
      toast.error('স্যান্ডবক্স পেমেন্ট সিমুলেট করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">প্ল্যানসমূহ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>প্রিমিয়াম সাবস্ক্রিপশন</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl font-bengali">
          আমাদের প্রিমিয়াম প্ল্যানসমূহ
        </h1>
        <p className="text-xl text-gray-600 font-bengali max-w-2xl mx-auto">
          আপনার বিসিএস প্রিলিমিনারি ও রিটেন পরীক্ষার জন্য সেরা এবং পূর্ণাঙ্গ প্রস্তুতি নিশ্চিত করুন।
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8 items-stretch">
        {plans.map((plan) => {
          const isGold = plan.plan_type === 'gold';
          const isPopular = plan.is_popular;
          const isUserPlan = user?.is_premium && user?.user_type === 'student'; // Simplification for active plan
          
          return (
            <motion.div
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all border ${
                isPopular
                  ? 'bg-gradient-to-b from-slate-900 to-indigo-950 text-white border-indigo-500 shadow-2xl scale-105 md:-translate-y-4 z-10'
                  : 'bg-white text-gray-900 border-gray-200 shadow-lg hover:shadow-xl'
              }`}
              whileHover={{ y: isPopular ? -20 : -8 }}
              transition={{ duration: 0.3 }}
            >
              {isPopular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>সবচেয়ে জনপ্রিয়</span>
                </div>
              )}

              {/* Title & Badge */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  {plan.discount_percentage > 0 && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isPopular ? 'bg-indigo-500 text-white font-medium' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {plan.discount_percentage}% ছাড়
                    </span>
                  )}
                </div>
                
                <p className={`text-sm leading-relaxed ${isPopular ? 'text-slate-300' : 'text-gray-500'}`}>
                  {plan.description}
                </p>

                {/* Price block */}
                <div className="pt-4 pb-2 border-b border-gray-150">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold tracking-tight font-sans">৳ {parseFloat(plan.price).toFixed(0)}</span>
                    <span className={`text-sm ${isPopular ? 'text-slate-400' : 'text-gray-500'}`}>
                      / {plan.duration_display}
                    </span>
                  </div>
                  {plan.discount_percentage > 0 && (
                    <p className={`text-xs mt-1.5 ${isPopular ? 'text-slate-400' : 'text-gray-500'}`}>
                      পূর্বের মূল্য: <span className="line-through">৳ {parseFloat(plan.original_price).toFixed(0)}</span>
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-4.5 pt-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    isPopular ? 'text-slate-300' : 'text-gray-400'
                  }`}>
                    ফিচারসমূহ:
                  </p>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm">
                        <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${
                          isPopular ? 'bg-emerald-500/25 text-emerald-400' : 'bg-green-50 text-green-600'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                        <span className={isPopular ? 'text-slate-200' : 'text-gray-600'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8 mt-auto">
                <button
                  id={`btn-plan-${plan.id}`}
                  disabled={processingPlanId !== null}
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-center transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                    isPopular
                      ? 'bg-white text-gray-900 hover:bg-slate-50 font-bold hover:scale-[1.02]'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>প্রসেস করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>شুরু করুন</span>
                      <ArrowRight className="w-5 h-5 ml-1.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Developer Sandbox Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-gray-100 overflow-hidden">
            {/* Background design glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center space-x-3 text-amber-600 mb-4">
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
              <h3 className="text-xl font-bold">Sandbox Mode Activated</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed font-bengali">
              লোকাল ডেভেলপমেন্টে স্ট্রাইপ পেমেন্ট সেটআপ না থাকায় পেমেন্ট সেশনটি সফল করা যায়নি। (ত্রুটি: {sandboxError})
            </p>
            
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-sm text-amber-800 mb-6 font-bengali space-y-1">
              <div className="flex justify-between font-semibold">
                <span>পরিশোধের পরিমাণ:</span>
                <span>৳ {sandboxAmount}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-700">
                <span>পেমেন্ট আইডি:</span>
                <span>#{sandboxPaymentId}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                id="btn-execute-sandbox"
                onClick={executeSandboxPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>পেমেন্ট সিমুলেট করুন</span>
              </button>
              <button
                id="btn-close-sandbox"
                onClick={() => setShowSandboxModal(false)}
                className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
