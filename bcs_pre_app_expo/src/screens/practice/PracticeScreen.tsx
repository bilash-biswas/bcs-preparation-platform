// src/screens/practice/PracticeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { createPracticeSession } from '../../store/slices/practiceSlice';
import { fetchSubjects } from '../../store/slices/subjectSlice';
import { AppDispatch, RootState } from '../../store';
import { Subject } from '../../types';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons as Icon } from '@expo/vector-icons';
import { PracticeScreenSkeleton } from '../../components/common/Skeleton';

type PracticeHomeScreenNavigationProp = any;

const PracticeHomeScreen: React.FC = () => {
  const navigation = useNavigation<PracticeHomeScreenNavigationProp>();
  const route = useRoute();
  const routeParams = route.params as { subjectId?: number } | undefined;
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useAppTheme();

  const { subjects: reduxSubjects, isLoading: subjectsLoading } = useSelector(
    (state: RootState) => state.subject,
  );
  const { isLoading: practiceLoading } = useSelector(
    (state: RootState) => state.practice,
  );

  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSubjects();
  }, []);

  // Sync route param subject filter and consume it once subjects are loaded
  useEffect(() => {
    if (routeParams?.subjectId && reduxSubjects.length > 0) {
      setSelectedSubjects([routeParams.subjectId]);
      
      const subject = reduxSubjects.find(sub => sub.id === routeParams.subjectId);
      if (subject && subject.category_name) {
        setSelectedCategory(subject.category_name);
      } else {
        setSelectedCategory('all');
      }
      setSearchTerm('');
      
      navigation.setParams({ subjectId: undefined } as any);
    }
  }, [routeParams?.subjectId, reduxSubjects, navigation]);

  const loadSubjects = async () => {
    try {
      await dispatch(fetchSubjects({})).unwrap();
    } catch (err) {
      console.error('Failed to load subjects:', err);
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

      if (difficulty !== 'all') {
        requestData.difficulty = difficulty;
      }

      const result = await dispatch(
        createPracticeSession(requestData),
      ).unwrap();
      
      if (result && result.id) {
        navigation.navigate('PracticeSession', { sessionId: result.id });
      } else {
        throw new Error('Session creation failed - no session ID returned');
      }
    } catch (err: any) {
      console.error('Failed to start practice:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
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

  const selectAllFilteredSubjects = () => {
    const filteredIds = filteredSubjects.map(sub => sub.id);
    // Find missing ids and add them
    const newSelected = [...selectedSubjects];
    filteredIds.forEach(id => {
      if (!newSelected.includes(id)) {
        newSelected.push(id);
      }
    });
    setSelectedSubjects(newSelected);
    setError(null);
  };

  const deselectAllFilteredSubjects = () => {
    const filteredIds = filteredSubjects.map(sub => sub.id);
    setSelectedSubjects(prev => prev.filter(id => !filteredIds.includes(id)));
    setError(null);
  };

  const filteredSubjects: Subject[] = (reduxSubjects || []).filter((subject: Subject) => {
    const matchesSearch =
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || subject.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'all',
    ...new Set(
      (reduxSubjects || [])
        .map((subject: Subject) => subject.category_name)
        .filter(Boolean),
    ),
  ];

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('bangla') || name.includes('বাংলা')) return '📖';
    if (name.includes('bangladesh') || name.includes('বাংলাদেশ')) return '🏛️';
    if (name.includes('computer') || name.includes('it') || name.includes('তথ্য প্রযুক্তি')) return '💻';
    if (name.includes('english') || name.includes('ইংরেজি')) return '🇬🇧';
    if (name.includes('science') || name.includes('বিজ্ঞান')) return '🔬';
    if (name.includes('geography') || name.includes('environment') || name.includes('ভূগোল')) return '🌍';
    if (name.includes('international') || name.includes('আন্তর্জাতিক')) return '🌐';
    if (name.includes('math') || name.includes('গণিত') || name.includes('mental')) return '🔢';
    return '📝';
  };

  const SubjectCard = ({ item }: { item: any }) => {
    const isSelected = selectedSubjects.includes(item.id);
    return (
      <TouchableOpacity
        key={item.id.toString()}
        className={`w-full bg-white dark:bg-slate-900 border rounded-2xl p-4 mb-2 flex-row items-center justify-between ${
          isSelected
            ? 'border-primary-500 bg-primary-50/15 dark:bg-primary-950/15'
            : 'border-slate-100 dark:border-slate-800/80 shadow-sm'
        }`}
        onPress={() => toggleSubject(item.id)}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center flex-1 mr-4">
          {/* Left Category Icon Emblem */}
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
            isSelected ? 'bg-primary-100 dark:bg-primary-950/40' : 'bg-slate-50 dark:bg-slate-950'
          }`}>
            <Text className="text-lg">{getCategoryIcon(item.category_name)}</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-5">
              {item.name}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali font-semibold">
                {item.category_name}
              </Text>
              <View className="w-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-800" />
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
                {item.total_questions || 0}টি প্রশ্ন
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          {isSelected && (
            <Text className="text-[9px] text-primary-600 dark:text-primary-400 font-black font-bengali">
              নির্বাচিত
            </Text>
          )}
          <View className={`w-5 h-5 rounded-full border justify-center items-center ${
            isSelected
              ? 'border-primary-500 bg-primary-600 dark:bg-primary-500'
              : 'border-slate-350 dark:border-slate-700'
          }`}>
            {isSelected && <Icon name="checkmark" size={12} color="white" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (subjectsLoading && reduxSubjects.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <PracticeScreenSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-14 pb-6 px-6 border-b border-slate-100 dark:border-slate-800/80 rounded-b-[36px] shadow-sm mb-6">
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali text-center">
          প্র্যাকটিস সেশন
        </Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1 leading-5 font-bengali max-w-xs mx-auto">
          আপনার সুবিধা অনুযায়ী বিষয়ভিত্তিক অনুশীলন শুরু করুন
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="px-6">
          {/* Error Banner */}
          {error && (
            <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 mb-5 flex-row items-center gap-2">
              <Icon name="alert-circle-outline" size={18} className="text-red-500" />
              <Text className="text-red-700 dark:text-red-400 font-bengali text-xs flex-1">{error}</Text>
            </View>
          )}

          {/* Search bar */}
          <View className="mb-5 flex-row items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-1">
            <Icon name="search-outline" size={18} className="text-slate-400 mr-2" />
            <TextInput
              className="flex-1 text-slate-800 dark:text-slate-100 text-sm font-bengali py-2.5"
              placeholder="বিষয় বা বিভাগের নাম লিখুন..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* Category Filter Wrap Grid */}
          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 font-bengali">
              📂 বিভাগ ফিল্টার
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  className={`px-4 py-2.5 rounded-2xl border ${
                    selectedCategory === category
                      ? 'bg-primary-600 dark:bg-primary-500 border-primary-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 shadow-sm'
                  }`}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-xs font-bold font-bengali ${
                      selectedCategory === category
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {category === 'all' ? 'সব বিভাগ' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Selection Box */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-black text-slate-800 dark:text-slate-200 font-bengali">
                বিষয় নির্বাচন ({selectedSubjects.length} টি নির্বাচিত)
              </Text>
              
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={selectAllFilteredSubjects}>
                  <Text className="text-xs text-primary-600 dark:text-primary-400 font-extrabold font-bengali">
                    সব নিন
                  </Text>
                </TouchableOpacity>
                {selectedSubjects.length > 0 && (
                  <TouchableOpacity onPress={deselectAllFilteredSubjects}>
                    <Text className="text-xs text-red-500 font-bold font-bengali">
                      মুছুন
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {filteredSubjects.length === 0 ? (
              <View className="py-12 items-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <Text className="text-xs text-slate-400 dark:text-slate-500 text-center font-bengali">
                  কোন বিষয় পাওয়া যায়নি। অনুসন্ধান পরিবর্তন করুন।
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {filteredSubjects.map(item => (
                  <SubjectCard key={item.id.toString()} item={item} />
                ))}
              </View>
            )}
          </View>

          {/* Settings Section Card */}
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 mb-6 shadow-sm">
            {/* Difficulty Setting */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 font-bengali">
                📊 কঠিনতা স্তর
              </Text>
              <View className="flex-row gap-2">
                {[
                  { value: 'all', label: 'সব স্তর' },
                  { value: 'easy', label: 'সহজ' },
                  { value: 'medium', label: 'মধ্যম' },
                  { value: 'hard', label: 'কঠিন' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      difficulty === item.value
                        ? 'bg-primary-600 dark:bg-primary-500 border-primary-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/85'
                    }`}
                    onPress={() => setDifficulty(item.value as any)}
                  >
                    <Text
                      className={`text-xs font-bold font-bengali ${
                        difficulty === item.value
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Question Count Setting */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 font-bengali">
                🔢 প্রশ্ন সংখ্যা
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[10, 20, 30, 50, 100].map(count => (
                  <TouchableOpacity
                    key={count}
                    className={`flex-1 min-w-[18%] py-2.5 rounded-xl border items-center ${
                      questionCount === count
                        ? 'bg-primary-600 dark:bg-primary-500 border-primary-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/85'
                    }`}
                    onPress={() => setQuestionCount(count)}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        questionCount === count
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Estimated Duration Info */}
            <View className="border-t border-slate-50 dark:border-slate-850 pt-4 flex-row justify-between items-center">
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 font-bengali">
                ⚡ বরাদ্দকৃত সময়
              </Text>
              <View className="bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-xl border border-primary-200/20">
                <Text className="text-xs font-extrabold text-primary-600 dark:text-primary-400 font-bengali">
                  {Math.ceil(questionCount)} মিনিট
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Button at Bottom */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-850/80 shadow-md">
        <TouchableOpacity
          className={`py-4 rounded-2xl w-full items-center justify-center shadow-lg active:scale-[0.99] flex-row gap-2 ${
            selectedSubjects.length === 0 
              ? 'bg-slate-200 dark:bg-slate-800' 
              : 'bg-primary-600 dark:bg-primary-500'
          }`}
          onPress={startPractice}
          disabled={practiceLoading || selectedSubjects.length === 0}
        >
          {practiceLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon 
              name="rocket-outline" 
              size={18} 
              color={selectedSubjects.length === 0 ? (isDark ? '#4b5563' : '#94a3b8') : '#ffffff'} 
            />
          )}
          <Text 
            className={`text-base font-black font-bengali ${
              selectedSubjects.length === 0 
                ? 'text-slate-400 dark:text-slate-500' 
                : 'text-white'
            }`}
          >
            {practiceLoading 
              ? 'সেশন তৈরি হচ্ছে...' 
              : selectedSubjects.length === 0 
                ? 'বিষয় নির্বাচন করুন' 
                : `প্র্যাকটিস শুরু করুন (${selectedSubjects.length}টি বিষয়)`}
          </Text>
        </TouchableOpacity>

        {selectedSubjects.length === 0 && (
          <Text className="mt-2 text-[9px] text-slate-400 dark:text-slate-500 text-center font-bengali">
            শুরু করতে কমপক্ষে একটি বিষয় নির্বাচন করুন
          </Text>
        )}
      </View>
    </View>
  );
};

export default PracticeHomeScreen;