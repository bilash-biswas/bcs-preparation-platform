// src/screens/practice/PracticeHomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createPracticeSession } from '../../store/slices/practiceSlice';
import { fetchSubjects } from '../../store/slices/subjectSlice';
import { AppDispatch, RootState } from '../../store';

// Fix the navigation type - use the correct type from your navigator
type PracticeHomeScreenNavigationProp = any; // Replace with your actual navigation type

const PracticeHomeScreen: React.FC = () => {
  const navigation = useNavigation<PracticeHomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  // Get subjects from Redux store instead of local state
  const { subjects: reduxSubjects, isLoading: subjectsLoading } = useSelector(
    (state: RootState) => state.subject,
  );
  const { isLoading: practiceLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<
    'all' | 'easy' | 'medium' | 'hard'
  >('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      // Dispatch the fetchSubjects action
      await dispatch(fetchSubjects()).unwrap();
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setError('বিষয়সমূহ লোড করতে সমস্যা হয়েছে');
    }
  };

  const startPractice = async () => {
    if (selectedSubjects.length === 0) {
      setError('কমপক্ষে একটি বিষয় নির্বাচন করুন');
      return;
    }

    try {
      setError(null);

      const requestData: any = {
        subjects: selectedSubjects,
        question_count: questionCount,
      };

      // Add difficulty only if not 'all'
      if (difficulty !== 'all') {
        requestData.difficulty = difficulty;
      }

      const result = await dispatch(
        createPracticeSession(requestData),
      ).unwrap();
      console.log('Practice session created:', result);
      console.log('Starting practice with data:', result);
      if (result && result.id) {
        console.log(
          'Practice session created, navigating to session:',
          result.id,
        );
        // Use navigation service or ensure navigation is available
        navigation.navigate('PracticeSession', { sessionId: result.id });
      } else {
        throw new Error('Session creation failed - no session ID returned');
      }
    } catch (error: any) {
      console.error('Failed to start practice:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'প্র্যাকটিস সেশন শুরু করতে সমস্যা হয়েছে';
      setError(errorMessage);
      Alert.alert('ত্রুটি', errorMessage);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId],
    );
    setError(null);
  };

  // Filter subjects based on search and category
  const filteredSubjects = (reduxSubjects || []).filter(subject => {
    const matchesSearch =
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || subject.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [
    'all',
    ...new Set(
      (reduxSubjects || [])
        .map(subject => subject.category_name)
        .filter(Boolean),
    ),
  ];

  const renderSubjectItem = (item: any) => (
    <TouchableOpacity
      key={item.id.toString()}
      className={`bg-white border-2 rounded-xl p-4 mb-2 ${
        selectedSubjects.includes(item.id)
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200'
      }`}
      onPress={() => toggleSubject(item.id)}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full self-start">
            {item.category_name}
          </Text>
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            selectedSubjects.includes(item.id)
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          }`}
        >
          {selectedSubjects.includes(item.id) && (
            <Text className="text-white text-sm font-bold">✓</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (subjectsLoading && reduxSubjects.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-base text-gray-500">
          বিষয়সমূহ লোড হচ্ছে...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-blue-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="p-6 pb-4 items-center">
          <Text className="text-3xl font-bold text-gray-800 mb-3 text-center">
            প্র্যাকটিস সেশন
          </Text>
          <Text className="text-base text-gray-500 text-center leading-6">
            আপনার জ্ঞান পরীক্ষা করুন এবং দক্ষতা উন্নত করুন। বিষয়ভিত্তিক
            প্র্যাকটিসের মাধ্যমে বিসিএস পরীক্ষার জন্য প্রস্তুত হোন।
          </Text>
        </View>

        <View className="p-4">
          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* Search and Filter */}
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                🔍 বিষয় বা বিভাগ অনুসন্ধান
              </Text>
              <TextInput
                className="bg-white border border-gray-300 rounded-xl p-3 text-base"
                placeholder="বিষয় বা বিভাগের নাম লিখুন..."
                placeholderTextColor="#9ca3af"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                📂 বিভাগ ফিল্টার
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <View className="flex-row gap-2">
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      className={`px-4 py-2 rounded-full border ${
                        selectedCategory === category
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        className={`text-sm ${
                          selectedCategory === category
                            ? 'text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        {category === 'all' ? 'সব বিভাগ' : category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Subject Selection */}
          <View className="mb-6">
            {/* Section Header - Title only */}
            <View className="mb-2">
              <Text className="text-xl font-semibold text-gray-800">
                বিষয় নির্বাচন করুন
              </Text>
            </View>
            
            {/* Selection info on separate line */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm text-gray-500">
                {selectedSubjects.length} টি বিষয় নির্বাচিত
              </Text>
              {selectedSubjects.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedSubjects([])}>
                  <Text className="text-sm text-red-600 font-semibold">
                    সব নির্বাচন মুছুন
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredSubjects.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-base text-gray-500 text-center">
                  {reduxSubjects.length === 0
                    ? 'বিষয়সমূহ লোড হচ্ছে...'
                    : 'কোন বিষয় পাওয়া যায়নি। অনুগ্রহ করে আপনার অনুসন্ধান পরিবর্তন করুন।'}
                </Text>
              </View>
            ) : (
              <View>
                {filteredSubjects.map(item => renderSubjectItem(item))}
              </View>
            )}
          </View>

          {/* Settings */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                📊 কঠিনতা স্তর
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <View className="flex-row gap-2">
                  {[
                    { value: 'all', label: 'সব স্তর' },
                    { value: 'easy', label: 'সহজ' },
                    { value: 'medium', label: 'মধ্যম' },
                    { value: 'hard', label: 'কঠিন' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.value}
                      className={`px-4 py-2 rounded-lg border ${
                        difficulty === item.value
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => setDifficulty(item.value as any)}
                    >
                      <Text
                        className={`text-sm ${
                          difficulty === item.value
                            ? 'text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                🔢 প্রশ্ন সংখ্যা
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <View className="flex-row gap-2">
                  {[10, 20, 30, 50, 80, 100, 150, 200].map(count => (
                    <TouchableOpacity
                      key={count}
                      className={`px-3 py-2 rounded-lg border ${
                        questionCount === count
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => setQuestionCount(count)}
                    >
                      <Text
                        className={`text-sm ${
                          questionCount === count
                            ? 'text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        {count} টি
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                ⚡ মোট সময়
              </Text>
              <View className="bg-white border border-gray-300 rounded-lg p-3 items-center">
                <Text className="text-lg font-bold text-blue-500">
                  {Math.ceil(questionCount)} মিনিট
                </Text>
              </View>
            </View>
          </View>

          {/* Selected Subjects Info */}
          {selectedSubjects.length > 0 && (
            <View className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
              <Text className="text-blue-900 text-sm">
                <Text className="font-semibold">নির্বাচিত বিষয়:</Text>{' '}
                {selectedSubjects
                  .map(id => {
                    const subject = reduxSubjects.find((s: any) => s.id === id);
                    return subject?.name;
                  })
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start Button - Fixed at bottom */}
      <View className="p-4 bg-blue-50 border-t border-gray-200">
        <TouchableOpacity
          className={`bg-blue-500 py-4 rounded-xl w-full items-center ${
            practiceLoading || selectedSubjects.length === 0 ? 'opacity-50' : ''
          }`}
          onPress={startPractice}
          disabled={practiceLoading || selectedSubjects.length === 0}
        >
          {practiceLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white text-lg font-semibold">
                সেশন তৈরি হচ্ছে...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-lg font-semibold">
                প্র্যাকটিস শুরু করুন
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {selectedSubjects.length === 0 && (
          <Text className="mt-3 text-sm text-gray-500 text-center">
            শুরু করতে কমপক্ষে একটি বিষয় নির্বাচন করুন
          </Text>
        )}
      </View>
    </View>
  );
};

export default PracticeHomeScreen;