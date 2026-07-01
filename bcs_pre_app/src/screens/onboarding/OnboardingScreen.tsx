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

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  const slides = [
    {
      id: 1,
      title: 'BCS প্রস্তুতি অ্যাপে স্বাগতম',
      description: 'বিসিএস পরীক্ষার জন্য বিশেষায়িত পড়াশোনা, অনুশীলন এবং মক টেস্টের মাধ্যমে নিজেকে প্রস্তুত করুন।',
      icon: '📚',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      id: 2,
      title: 'স্মার্ট অনুশীলন সেশন',
      description: 'আপনার শেখার গতি অনুযায়ী অভিযোজিত স্মার্ট অনুশীলন সেশনের মাধ্যমে দুর্বলতা দূর করুন।',
      icon: '🧠',
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      id: 3,
      title: 'প্রগ্রেস ট্র্যাক করুন',
      description: 'বিস্তারিত অ্যানালিটিক্স, স্ট্রীক এবং অর্জন ব্যাজের মাধ্যমে আপনার অগ্রগতি মনিটর করুন।',
      icon: '📊',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      id: 4,
      title: 'কমিউনিটিতে যোগ দিন',
      description: 'সহপাঠী এবং এক্সপার্টদের সাথে আলোচনা করুন, জ্ঞান শেয়ার করুন এবং আপনার সন্দেহ দূর করুন।',
      icon: '👥',
      color: '#EF4444',
      bgColor: '#FEF2F2',
    },
  ];

  const handleGetStarted = () => {
    dispatch(markOnboardingSeen());
    navigation.navigate('Login');
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
    navigation.navigate('Login');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Skip Button */}
      <TouchableOpacity
        onPress={skipOnboarding}
        className="absolute top-16 right-6 z-10 bg-gray-100 px-4 py-2 rounded-full"
      >
        <Text className="text-primary-600 font-semibold text-sm">স্কিপ</Text>
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
            className="flex-1 px-8 justify-center"
          >
            {/* Background Color */}
            <View 
              className="absolute top-0 left-0 right-0 bottom-0"
              style={{ backgroundColor: slide.bgColor }}
            />
            
            {/* Icon */}
            <View className="items-center mb-12">
              <View 
                className="w-32 h-32 rounded-3xl items-center justify-center mb-8 shadow-lg"
                style={{ 
                  backgroundColor: slide.color,
                  shadowColor: slide.color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text className="text-5xl text-white">{slide.icon}</Text>
              </View>
            </View>

            {/* Content */}
            <View className="items-center">
              <Text className="text-2xl font-bold text-center text-gray-800 mb-4 leading-8 font-bengali">
                {slide.title}
              </Text>
              <Text className="text-lg text-center text-gray-600 leading-7 font-bengali">
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-8 pb-12 bg-white">
        {/* Dots Indicator */}
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-primary-600 w-8' 
                  : 'bg-gray-300 w-2'
              }`}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center">
          {/* Back Button */}
          {currentSlide > 0 && (
            <TouchableOpacity
              onPress={goToPreviousSlide}
              className="px-6 py-3 flex-row items-center"
            >
              <Text className="text-primary-600 font-semibold text-base font-bengali">
                পিছনে
              </Text>
            </TouchableOpacity>
          )}

          {/* Spacer for centering when no back button */}
          {currentSlide === 0 && <View className="flex-1" />}

          {/* Next/Get Started Button */}
          <TouchableOpacity
            onPress={goToNextSlide}
            className={`${currentSlide > 0 ? 'flex-1 ml-4' : 'flex-1'}`}
          >
            <View 
              className="bg-primary-600 rounded-xl py-4 shadow-lg"
              style={{
                shadowColor: '#dc2626',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
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
            <Text className="text-primary-600 text-center font-semibold text-base font-bengali">
              আমার অ্যাকাউন্ট আছে
            </Text>
          </TouchableOpacity>
        )}

        {/* Progress Text */}
        <View className="mt-4">
          <Text className="text-xs text-gray-500 text-center font-bengali">
            {currentSlide + 1} / {slides.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;