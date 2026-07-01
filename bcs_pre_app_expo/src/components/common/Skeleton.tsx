// src/components/common/Skeleton.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  className?: string;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style, className }: SkeletonProps) => {
  const { isDark } = useAppTheme();
  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400, // Speed of the shimmer sweep
        useNativeDriver: true,
      })
    );

    if (layoutWidth > 0) {
      animation.start();
    }

    return () => animation.stop();
  }, [shimmerAnim, layoutWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const baseColor = isDark ? '#1e293b' : '#e2e8f0'; // slate-800 or slate-200
  
  // Clean, modern glare transparency adjusted for light/dark themes
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)';

  // Interpolate translation value to glide across the measured element bounds
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth * 0.4, layoutWidth * 1.4],
  });

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden', // Ensures highlight doesn't bleed outside boundaries
          position: 'relative',
        },
        style,
      ]}
      className={className}
    >
      {layoutWidth > 0 && (
  <Animated.View
    style={[
      StyleSheet.absoluteFill, // <-- Fixed here
      {
        width: '35%', 
        backgroundColor: highlightColor,
        transform: [
          { translateX },
          { skewX: '-20deg' }, 
        ],
      },
    ]}
  />
)}
    </View>
  );
};

// Pure Text-Free Shimmer for Practice Screen Loading
export const PracticeScreenSkeleton = () => (
  <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center p-6">
    {/* Header Skeletons */}
    <View className="mb-8 items-center gap-3">
      <Skeleton width={180} height={24} borderRadius={12} />
      <Skeleton width={240} height={12} borderRadius={6} />
    </View>

    {/* Search Input Placeholder */}
    <View className="mb-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex-row items-center gap-3 shadow-sm">
      <Skeleton width={20} height={20} borderRadius={10} />
      <Skeleton width="75%" height={14} borderRadius={6} />
    </View>

    {/* Horizontal Tabs Placeholder */}
    <View className="flex-row gap-2.5 mb-6">
      <Skeleton width={75} height={32} borderRadius={16} />
      <Skeleton width={90} height={32} borderRadius={16} />
      <Skeleton width={100} height={32} borderRadius={16} />
    </View>

    {/* Scroll List Card Skeletons */}
    <View className="gap-3.5">
      {[1, 2, 3, 4].map((key) => (
        <View key={key} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4.5 flex-row justify-between items-center shadow-sm">
          <View className="flex-row items-center flex-1 mr-4">
            <Skeleton width={40} height={40} borderRadius={12} className="mr-3" />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={16} borderRadius={6} />
              <Skeleton width="35%" height={10} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={20} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  </View>
);

// Pure Text-Free Shimmer for Practice Session Screen Loading
export const PracticeSessionSkeleton = () => (
  <View className="flex-1 bg-slate-100 dark:bg-slate-950 justify-center p-4">
    {/* Question Card Placeholder */}
    <View className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-150/40 dark:border-slate-800/70 shadow-sm mb-5 gap-4">
      {/* Question header info */}
      <View className="flex-row justify-between items-center mb-3">
        <Skeleton width={60} height={16} borderRadius={8} />
        <Skeleton width={80} height={16} borderRadius={8} />
      </View>
      
      {/* Question Title bars */}
      <View className="gap-2.5 mb-5">
        <Skeleton width="95%" height={18} borderRadius={6} />
        <Skeleton width="70%" height={18} borderRadius={6} />
      </View>

      {/* Options placeholders */}
      <View className="gap-3">
        {[1, 2, 3, 4].map((key) => (
          <View key={key} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex-row items-center justify-between bg-white dark:bg-slate-900 shadow-sm">
            <View className="flex-row items-center flex-1 pr-3">
              <Skeleton width={32} height={32} borderRadius={16} className="mr-3" />
              <Skeleton width="55%" height={14} borderRadius={6} />
            </View>
            <Skeleton width={18} height={18} borderRadius={9} />
          </View>
        ))}
      </View>
    </View>
  </View>
);

// Pure Text-Free Shimmer for Practice Results Screen Loading
export const PracticeResultsSkeleton = () => (
  <View className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center p-6 gap-6">
    {/* Score Banner Card */}
    <View className="rounded-[32px] p-6 bg-white dark:bg-slate-900 border border-slate-150/50 dark:border-slate-800/80 items-center gap-4 shadow-sm">
      <Skeleton width={52} height={52} borderRadius={16} />
      <Skeleton width={110} height={36} borderRadius={10} />
      <Skeleton width={160} height={16} borderRadius={6} />
      <Skeleton width="100%" height={48} borderRadius={16} />
    </View>

    {/* Stat Card Grid */}
    <View className="flex-row gap-3">
      {[1, 2, 3].map((key) => (
        <View key={key} className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 items-center gap-2.5 border border-slate-150/50 dark:border-slate-800/80 shadow-sm">
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={35} height={18} borderRadius={6} />
          <Skeleton width={50} height={10} borderRadius={4} />
        </View>
      ))}
    </View>

    {/* Breakdown items placeholder */}
    <View className="bg-white dark:bg-slate-900 border border-slate-150/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm gap-3">
      <Skeleton width={140} height={18} borderRadius={6} className="mb-2 self-center" />
      {[1, 2, 3].map((key) => (
        <View key={key} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl gap-2">
          <View className="flex-row justify-between items-center">
            <Skeleton width={60} height={14} borderRadius={6} />
            <Skeleton width={45} height={14} borderRadius={6} />
          </View>
          <Skeleton width="100%" height={8} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
);