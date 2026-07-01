// screens/ProgressScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LiveProgressTracker from '../../components/progress/LiveProgressTracker';
import ProgressHistory from '../../components/progress/ProgressHistory';

const ProgressScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 20 }}>
        <View className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-3xl font-bold text-gray-900 font-bengali mb-2">
              প্রগ্রেস ট্র্যাকিং
            </Text>
            <Text className="text-gray-600 font-bengali">
              আপনার লার্নিং জার্নি এবং উন্নতি দেখুন
            </Text>
          </View>
          
          {/* Components */}
          <LiveProgressTracker />
          <ProgressHistory />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressScreen;