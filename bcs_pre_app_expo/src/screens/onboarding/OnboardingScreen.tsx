// src/screens/onboarding/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { markOnboardingSeen } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isDark } = useAppTheme();

  const slides = [
    {
      id: 1,
      title: 'BCS প্রস্তুতি অ্যাপে স্বাগতম',
      description: 'বিসিএস পরীক্ষার জন্য বিশেষায়িত পড়াশোনা, অনুশীলন এবং মক টেস্টের মাধ্যমে নিজেকে প্রস্তুত করুন।',
      icon: 'book-outline' as any,
      color: 'bg-primary-500 dark:bg-primary-600',
      textColor: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-950/20',
    },
    {
      id: 2,
      title: 'স্মার্ট অনুশীলন সেশন',
      description: 'আপনার শেখার গতি অনুযায়ী অভিযোজিত স্মার্ট অনুশীলন সেশনের মাধ্যমে দুর্বলতা দূর করুন।',
      icon: 'brain-outline' as any,
      color: 'bg-secondary-500 dark:bg-secondary-600',
      textColor: 'text-secondary-600 dark:text-secondary-400',
      bgColor: 'bg-secondary-50 dark:bg-secondary-950/20',
    },
    {
      id: 3,
      title: 'প্রগ্রেস ট্র্যাক করুন',
      description: 'detailed অ্যানালিটিক্স, স্ট্রীক এবং অর্জন ব্যাজের মাধ্যমে আপনার অগ্রগতি মনিটর করুন।',
      icon: 'bar-chart-outline' as any,
      color: 'bg-accent-500 dark:bg-accent-600',
      textColor: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-50 dark:bg-accent-950/20',
    },
    {
      id: 4,
      title: 'কমিউনিটিতে যোগ দিন',
      description: 'সহপাঠী এবং এক্সপার্টদের সাথে আলোচনা করুন, জ্ঞান শেয়ার করুন এবং আপনার সন্দেহ দূর করুন।',
      icon: 'people-outline' as any,
      color: 'bg-red-500 dark:bg-red-600',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
  ];

  const handleGetStarted = () => {
    dispatch(markOnboardingSeen());
  };

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleGetStarted();
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipOnboarding = () => {
    dispatch(markOnboardingSeen());
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar 
        backgroundColor={isDark ? "#020617" : "#f8fafc"} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Skip Button */}
      <TouchableOpacity
        onPress={skipOnboarding}
        className="absolute top-16 right-6 z-10 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full"
      >
        <Text className="text-primary-600 dark:text-primary-400 font-semibold text-sm font-bengali">স্কিপ</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const slide = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slide);
        }}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View 
            key={slide.id} 
            style={{ width }} 
            className="flex-1 px-8 justify-center items-center"
          >
            {/* Background Glow */}
            <View className={`w-72 h-72 rounded-full blur-3xl opacity-20 dark:opacity-10 absolute ${slide.bgColor}`} />
            
            {/* Icon Wrapper */}
            <View className="items-center mb-12">
              <View 
                className={`w-36 h-36 rounded-3xl items-center justify-center mb-8 shadow-xl ${slide.bgColor}`}
                style={{
                  shadowColor: isDark ? '#000' : '#7c3aed',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Ionicons name={slide.icon} size={64} className={slide.textColor} />
              </View>
            </View>

            {/* Content */}
            <View className="items-center max-w-sm">
              <Text className="text-3xl font-extrabold text-center text-slate-800 dark:text-slate-100 mb-4 leading-10 font-bengali">
                {slide.title}
              </Text>
              <Text className="text-base text-center text-slate-500 dark:text-slate-400 leading-7 font-bengali">
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-8 pb-12 bg-slate-50 dark:bg-slate-950">
        {/* Dots Indicator */}
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2.5 rounded-full mx-1.5 transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-primary-600 dark:bg-primary-500 w-8' 
                  : 'bg-slate-300 dark:bg-slate-800 w-2.5'
              }`}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center">
          {/* Back Button */}
          {currentSlide > 0 ? (
            <TouchableOpacity
              onPress={goToPreviousSlide}
              className="px-6 py-3"
            >
              <Text className="text-slate-500 dark:text-slate-400 font-semibold text-base font-bengali">
                পিছনে
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="w-20" />
          )}

          {/* Next/Get Started Button */}
          <TouchableOpacity
            onPress={goToNextSlide}
            className="flex-1 ml-4"
          >
            <View 
              className="bg-primary-600 dark:bg-primary-500 rounded-2xl py-4 shadow-lg active:opacity-90"
              style={{
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text className="text-white text-center font-bold text-lg font-bengali">
                {currentSlide === slides.length - 1 ? 'শুরু করুন' : 'পরবর্তী'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Direct Login Option */}
        {currentSlide === slides.length - 1 && (
          <TouchableOpacity
            onPress={skipOnboarding}
            className="mt-6"
          >
            <Text className="text-primary-600 dark:text-primary-400 text-center font-semibold text-base font-bengali">
              আমার অ্যাকাউন্ট আছে
            </Text>
          </TouchableOpacity>
        )}

        {/* Progress Text */}
        <View className="mt-4">
          <Text className="text-xs text-slate-400 dark:text-slate-600 text-center font-bengali">
            {currentSlide + 1} / {slides.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;