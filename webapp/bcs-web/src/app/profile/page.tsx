// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Target,
  Clock,
  Edit3,
  Save,
  X,
  Shield,
  Star,
  Zap,
  BookOpen,
  BarChart3
} from "lucide-react";

interface UserStats {
  user: any;
  quiz_stats: {
    total_attempts: number;
    completed_attempts: number;
    average_score: number;
  };
  progress_stats: {
    subjects_attempted: number;
    total_accuracy: number;
  };
}

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login/");
      return;
    }

    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }

    loadUserStats();
  }, [isAuthenticated, router, user]);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get("/stats/");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load user stats:", error);
      if (error.response?.status === 404) {
        // Use mock data for demonstration
        setStats({
          user: user,
          quiz_stats: {
            total_attempts: 45,
            completed_attempts: 38,
            average_score: 78.5,
          },
          progress_stats: {
            subjects_attempted: 12,
            total_accuracy: 72.3,
          },
        });
      } else {
        toast.error("স্ট্যাটিস্টিক্স লোড করতে সমস্যা হয়েছে");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const updatedUser = await apiClient.patch("/profile/update/", formData);
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 font-bengali mb-3">
            আমার প্রোফাইল
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            আপনার অ্যাকাউন্ট তথ্য, অর্জন এবং লার্নিং পরিসংখ্যান দেখুন
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-bengali">
                        {user.username}
                      </h2>
                      <p className="text-red-100 text-sm">
                        {user.user_type === "student"
                          ? "বিসিএস প্রস্তুতিকারি"
                          : user.user_type === "teacher"
                          ? "শিক্ষক"
                          : user.user_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {isEditing ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                    <span className="font-bengali">
                      {isEditing ? "বাতিল" : "এডিট"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          <span>ইউজারনেম</span>
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <Mail className="w-4 h-4" />
                          <span>ইমেইল</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <Phone className="w-4 h-4" />
                          <span>ফোন নম্বর</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                          disabled={isLoading}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 font-bengali"
                      >
                        <X className="w-4 h-4" />
                        <span>বাতিল</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 font-bengali"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? "সেভ হচ্ছে..." : "সেভ করুন"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <User className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-bengali">ইউজারনেম</p>
                          <p className="font-semibold text-gray-900">{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-bengali">ইমেইল</p>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-bengali">ফোন নম্বর</p>
                          <p className="font-semibold text-gray-900">
                            {user.phone || "প্রদান করা হয়নি"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/profile/change-password"
                        className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-bengali">সিকিউরিটি</p>
                          <p className="font-semibold text-orange-700">পাসওয়ার্ড পরিবর্তন</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Statistics Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Quiz Statistics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-bengali">
                    কুইজ পরিসংখ্যান
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bengali">মোট অ্যাটেম্পট</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {stats?.quiz_stats.total_attempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bengali">সম্পন্ন অ্যাটেম্পট</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {stats?.quiz_stats.completed_attempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bengali">গড় স্কোর</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {stats?.quiz_stats.average_score?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Statistics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-bengali">
                    প্রগ্রেস পরিসংখ্যান
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bengali">বিষয় সংখ্যা</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {stats?.progress_stats.subjects_attempted || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bengali">সঠিকতার হার</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {stats?.progress_stats.total_accuracy?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Achievements & Quick Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-bengali">
                দ্রুত পরিসংখ্যান
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-bengali">কারেন্ট স্ট্রীক</span>
                  </div>
                  <span className="font-bold text-red-600">{user.streak || 0} দিন</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700 font-bengali">কয়েন</span>
                  </div>
                  <span className="font-bold text-yellow-600">{user.coins || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-bengali">সর্বশেষ অ্যাক্টিভ</span>
                  </div>
                  <span className="font-bold text-green-600 text-sm">আজ</span>
                </div>
              </div>
            </motion.div>

            {/* Achievements Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 font-bengali">
                  সাম্প্রতিক অর্জন
                </h3>
                <Link
                  href="/achievements"
                  className="text-sm text-red-600 hover:text-red-700 font-bengali"
                >
                  সব দেখুন
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm font-bengali">প্রথম পদক্ষেপ</p>
                    <p className="text-xs text-gray-600">আপনার প্রথম কুইজ সম্পূর্ণ</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm font-bengali">স্ট্রীক মাস্টার</p>
                    <p className="text-xs text-gray-600">৭ দিন ধরে লেগে থাকুন</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm font-bengali">একুরেসি চ্যাম্পিয়ন</p>
                    <p className="text-xs text-gray-600">৯০%+ একুরেসি অর্জন</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-red-600 to-green-600 rounded-2xl p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4 font-bengali">
                দ্রুত অ্যাকশন
              </h3>
              <div className="space-y-3">
                <Link
                  href="/practice"
                  className="flex items-center space-x-3 p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-bengali">প্র্যাকটিস শুরু করুন</span>
                </Link>
                <Link
                  href="/analytics"
                  className="flex items-center space-x-3 p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-bengali">অ্যানালিটিক্স দেখুন</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="flex items-center space-x-3 p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bengali">লিডারবোর্ড</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}