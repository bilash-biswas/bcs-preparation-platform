// src/components/common/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export const SplashScreen: React.FC = () => {
  const { isDark } = useAppTheme();
  
  // Intro animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  
  // Ambient continuous loop animation
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Smooth initial entry transitions
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Start premium, ultra-subtle breathing effect after entry completes
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.06,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
  }, [fadeAnim, scaleAnim, glowAnim]);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950 justify-center items-center px-6">
      <StatusBar 
        backgroundColor={isDark ? '#020617' : '#ffffff'} 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
      />

      {/* Ambient background pastel gradient orbs - subtle tone shifts for dark mode */}
      <View className="absolute top-1/4 w-96 h-96 rounded-full bg-primary-100/10 dark:bg-primary-900/5 blur-[80px]" />
      <View className="absolute bottom-1/4 w-96 h-96 rounded-full bg-secondary-100/10 dark:bg-secondary-900/5 blur-[80px]" />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        {/* Concentric outer glowing emblem container with ambient loop scale */}
        <Animated.View 
          style={{ transform: [{ scale: glowAnim }] }}
          className="w-32 h-32 rounded-[40px] bg-primary-50/50 dark:bg-primary-950/30 items-center justify-center border border-primary-100/40 dark:border-primary-900/20 shadow-sm mb-6"
        >
          {/* Inner emblem badge */}
          <View className="w-24 h-24 rounded-[32px] bg-primary-600 dark:bg-primary-700 items-center justify-center shadow-md">
            <Icon name="school" size={46} color="white" />
          </View>
        </Animated.View>

        {/* Main App Title */}
        <Text className="text-[26px] font-black text-slate-850 dark:text-slate-100 font-bengali tracking-wide text-center">
          বিসিএস প্রস্তুতি ফোরাম
        </Text>
        
        {/* Premium Minimal Subtitle */}
        <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-[5px] uppercase text-center mt-2.5">
          PREMIUM EXAM PLATFORM
        </Text>
      </Animated.View>

      {/* Clean Copyright minimal footer */}
      <View className="absolute bottom-12 items-center">
        <Text className="text-[8px] text-slate-350 dark:text-slate-600 tracking-[3px] font-extrabold uppercase">
          © BCS PREPARATION GROUP
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;