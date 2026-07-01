// src/components/gamification/achievements.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Star, Target, Zap, Calendar } from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  achievement_type: string;
  progress: number;
  is_unlocked: boolean;
  unlocked_at: string;
}

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [category, setCategory] = useState<'all' | 'streak' | 'accuracy' | 'practice' | 'mastery' | 'consistency'>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      // This would typically come from your achievements API
      const mockAchievements: Achievement[] = [
        {
          id: 1,
          name: 'প্রথম পদক্ষেপ',
          description: 'আপনার প্রথম প্র্যাকটিস সেশন সম্পূর্ণ করুন',
          icon: 'first-steps',
          achievement_type: 'practice',
          progress: 100,
          is_unlocked: true,
          unlocked_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'স্ট্রীক মাস্টার',
          description: '৭ দিন ধরে লেগে থাকুন',
          icon: 'streak-master',
          achievement_type: 'streak',
          progress: 85,
          is_unlocked: false,
          unlocked_at: ''
        },
        {
          id: 3,
          name: 'একুরেসি চ্যাম্পিয়ন',
          description: '৯০%+ একুরেসি অর্জন করুন',
          icon: 'accuracy-champion',
          achievement_type: 'accuracy',
          progress: 75,
          is_unlocked: false,
          unlocked_at: ''
        },
        {
          id: 4,
          name: 'নিয়মিত শিক্ষার্থী',
          description: 'সপ্তাহে ৫টি সেশন সম্পূর্ণ করুন',
          icon: 'regular-learner',
          achievement_type: 'consistency',
          progress: 60,
          is_unlocked: false,
          unlocked_at: ''
        },
        {
          id: 5,
          name: 'কুইজ মাস্টার',
          description: '১০টি কুইজ সম্পূর্ণ করুন',
          icon: 'quiz-master',
          achievement_type: 'practice',
          progress: 40,
          is_unlocked: false,
          unlocked_at: ''
        },
        {
          id: 6,
          name: 'গতি রাকেট',
          description: 'গড়ে ৩০ সেকেন্ডের কম সময়ে প্রশ্নের উত্তর দিন',
          icon: 'speed-demon',
          achievement_type: 'mastery',
          progress: 25,
          is_unlocked: false,
          unlocked_at: ''
        }
      ];
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.is_unlocked) return false;
    if (filter === 'locked' && achievement.is_unlocked) return false;
    if (category !== 'all' && achievement.achievement_type !== category) return false;
    return true;
  });

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'first-steps': return <Target className="w-6 h-6" />;
      case 'streak-master': return <Zap className="w-6 h-6" />;
      case 'accuracy-champion': return <Star className="w-6 h-6" />;
      case 'regular-learner': return <Calendar className="w-6 h-6" />;
      case 'quiz-master': return <Trophy className="w-6 h-6" />;
      case 'speed-demon': return <Zap className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'streak': return 'from-orange-500 to-red-500';
      case 'accuracy': return 'from-green-500 to-blue-500';
      case 'practice': return 'from-purple-500 to-pink-500';
      case 'mastery': return 'from-yellow-500 to-orange-500';
      case 'consistency': return 'from-blue-500 to-purple-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-bengali">অর্জনসমূহ</h1>
          <p className="text-gray-600 mt-2">আপনার লার্নিং অর্জন সংগ্রহ করুন এবং নতুন চ্যালেঞ্জ গ্রহণ করুন</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {achievements.filter(a => a.is_unlocked).length}
            </div>
            <div className="text-gray-600 font-bengali">অর্জিত অর্জন</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
            <div className="text-gray-600 font-bengali">মোট অর্জন</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((achievements.filter(a => a.is_unlocked).length / achievements.length) * 100)}%
            </div>
            <div className="text-gray-600 font-bengali">সম্পূর্ণতা</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex space-x-2">
            {['all', 'unlocked', 'locked'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'সব' : f === 'unlocked' ? 'অর্জিত' : 'লকড'}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            {['all', 'streak', 'accuracy', 'practice', 'mastery', 'consistency'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? 'সব' : 
                 cat === 'streak' ? 'স্ট্রীক' :
                 cat === 'accuracy' ? 'একুরেসি' :
                 cat === 'practice' ? 'প্র্যাকটিস' :
                 cat === 'mastery' ? 'মাস্টারি' : 'নিয়মিত'}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-300 ${
                  achievement.is_unlocked 
                    ? 'border-yellow-400 shadow-md' 
                    : 'border-gray-200 opacity-75'
                }`}
              >
                {/* Achievement Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    achievement.is_unlocked 
                      ? `bg-gradient-to-r ${getTypeColor(achievement.achievement_type)} text-white` 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  {achievement.is_unlocked && (
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      অর্জিত
                    </div>
                  )}
                </div>

                {/* Achievement Content */}
                <h3 className="font-semibold text-gray-900 mb-2 font-bengali">
                  {achievement.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>প্রগ্রেস</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        achievement.is_unlocked
                          ? `bg-gradient-to-r ${getTypeColor(achievement.achievement_type)}`
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Unlock Date */}
                {achievement.is_unlocked && achievement.unlocked_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    অর্জিত: {new Date(achievement.unlocked_at).toLocaleDateString('bn-BD')}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-bengali">কোন অর্জন পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;