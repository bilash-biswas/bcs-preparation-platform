// src/screens/questions/QuestionsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchQuestions } from '../../store/slices/questionSlice';
import { fetchSubjects } from '../../store/slices/subjectSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Question as QuestionType } from '../../types';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';

type QuestionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Question = QuestionType;

export const QuestionsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<QuestionsScreenNavigationProp>();
  const route = useRoute();
  const routeParams = route.params as { subjectId?: number } | undefined;
  const { isDark } = useAppTheme();
  
  const { questions, isLoading, error, pagination } = useSelector((state: RootState) => state.question);
  const { subjects: allSubjects } = useSelector((state: RootState) => state.subject);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive state for self-study mode
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  // Inline filters state
  const [filterSubject, setFilterSubject] = useState<string>(() => {
    return routeParams?.subjectId ? routeParams.subjectId.toString() : 'all';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoadedFirstPage, setHasLoadedFirstPage] = useState(false);

  // Sync route param subject filter on focus and consume it
  useFocusEffect(
    useCallback(() => {
      if (routeParams?.subjectId) {
        setFilterSubject(routeParams.subjectId.toString());
        navigation.setParams({ subjectId: undefined } as any);
      }
    }, [routeParams?.subjectId])
  );

  const displayedQuestions: Question[] = Array.isArray(questions) ? questions : [];
  
  const paginationData = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  };

  const loadQuestions = async (page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        if (page === 1) setRefreshing(true);
      }
      
      const filters: any = {
        page,
        page_size: pageSize,
      };

      if (filterSubject !== 'all') {
        filters.subject = filterSubject;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery;
      }

      const result = await dispatch(fetchQuestions(filters)).unwrap();
      
      setCurrentPage(page);
      setHasLoadedFirstPage(true);
      
      const totalPages = result.pagination?.total_pages || 1;
      if (page >= totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.log('Failed to fetch questions:', err);
      const errMsg = typeof err === 'string' ? err : JSON.stringify(err || {});
      if (
        err?.detail === 'Invalid page.' || 
        err?.status === 404 || 
        errMsg.includes('Invalid page') || 
        errMsg.includes('404')
      ) {
        setHasMore(false);
      }
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setHasLoadedFirstPage(false);
    await loadQuestions(1, false);
  }, [filterSubject, searchQuery, pageSize]);

  const loadMoreQuestions = useCallback(async () => {
    if (hasLoadedFirstPage && !loadingMore && hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      await loadQuestions(nextPage, true);
    }
  }, [hasLoadedFirstPage, currentPage, loadingMore, hasMore, isLoading, filterSubject, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSubjects({ page: 1, page_size: 100 }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1);
      setHasMore(true);
      setHasLoadedFirstPage(false);
      loadQuestions(1, false);
      // Reset interactive state on filter change
      setSelectedAnswers({});
      setRevealedAnswers({});
    }
  }, [isAuthenticated, filterSubject]);

  const availableSubjects = Array.isArray(allSubjects) && allSubjects.length > 0 
    ? allSubjects.map(sub => ({ id: sub.id, name: sub.name }))
    : [];

  const getOptionPrefix = (index: number) => {
    const prefixes = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
    return prefixes[index] || String.fromCharCode(65 + index);
  };

  const handleClearFilters = () => {
    setFilterSubject('all');
    setSearchQuery('');
  };

  const toggleRevealAnswer = (questionId: number) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const resetQuestionAnswers = (questionId: number) => {
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setRevealedAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleOptionPress = (questionId: number, optionId: number, isCorrect: boolean) => {
    // If already answered or revealed, do nothing
    if (selectedAnswers[questionId] !== undefined || revealedAnswers[questionId]) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-6 items-center flex-row justify-center gap-2">
        <ActivityIndicator size="small" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-555 text-xs font-bengali">আরো প্রশ্ন লোড হচ্ছে...</Text>
      </View>
    );
  };

  const renderQuestionItem = ({ item, index }: { item: Question; index: number }) => {
    const userSelectedOptionId = selectedAnswers[item.id];
    const isRevealed = revealedAnswers[item.id] || userSelectedOptionId !== undefined;

    return (
      <View className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800 rounded-[28px] shadow-sm mb-5 overflow-hidden">
        {/* Card Header Area */}
        <View className="p-5 pb-3">
          <View className="flex-row justify-between items-center mb-3.5">
            <View className="flex-row items-center gap-2 flex-wrap flex-1 pr-2">
              <View className="bg-primary-50 dark:bg-primary-950/30 px-2.5 py-0.5 rounded-lg">
                <Text className="text-primary-600 dark:text-primary-400 text-[10px] font-extrabold font-bengali">
                  প্রশ্ন #{(currentPage - 1) * pageSize + index + 1}
                </Text>
              </View>
            </View>
            
            <View className="bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/20">
              <Text className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold font-bengali">
                {item.subject_name || 'অন্যান্য'}
              </Text>
            </View>
          </View>

          {/* Question Text (LaTeX compatible) */}
          <View className="mb-1 pr-1">
            <MathDisplay
              content={item.question_text}
              className="text-[15px] font-extrabold text-slate-850 dark:text-slate-50 font-bengali leading-7"
            />
          </View>
        </View>

        {/* Options & Explanation Area */}
        <View className="px-5 pb-5 pt-2 border-t border-slate-50/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/20">
          <View className="gap-2.5 mb-4">
            {item.options && item.options.map((option, optIdx) => {
              const isCorrect = option.is_correct;
              const isSelected = userSelectedOptionId === option.id;
              
              // Option styling logic based on state
              let cardStyle = 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950';
              let textStyle = 'text-slate-700 dark:text-slate-300';
              let bubbleStyle = 'w-6 h-6 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900';
              
              if (isRevealed) {
                if (isCorrect) {
                  // Correct option gets emerald highlight
                  cardStyle = 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20';
                  textStyle = 'text-emerald-700 dark:text-emerald-400 font-extrabold';
                  bubbleStyle = 'w-6 h-6 border-emerald-500 bg-emerald-500';
                } else if (isSelected) {
                  // Incorrect user selection gets rose highlight
                  cardStyle = 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/20';
                  textStyle = 'text-rose-700 dark:text-rose-500 font-bold';
                  bubbleStyle = 'w-6 h-6 border-rose-500 bg-rose-500';
                }
              }

              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={isRevealed ? 1 : 0.7}
                  onPress={() => handleOptionPress(item.id, option.id, isCorrect)}
                  className={`p-3.5 rounded-2xl border flex-row justify-between items-center ${cardStyle}`}
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className={`rounded-full border items-center justify-center mr-3 ${bubbleStyle}`}>
                      {isRevealed && isCorrect ? (
                        <Icon name="checkmark-sharp" size={12} color="white" />
                      ) : isRevealed && isSelected ? (
                        <Icon name="close-sharp" size={12} color="white" />
                      ) : (
                        <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-bengali">
                          {getOptionPrefix(optIdx)}
                        </Text>
                      )}
                    </View>
                    <MathDisplay
                      content={option.option_text}
                      className={`font-bengali text-[13px] flex-1 leading-5 ${textStyle}`}
                    />
                  </View>
                  {isRevealed && isCorrect && (
                    <View className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 rounded-full border border-emerald-200/20">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold font-bengali">সঠিক</Text>
                    </View>
                  )}
                  {isRevealed && isSelected && !isCorrect && (
                    <View className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 rounded-full border border-rose-200/20">
                      <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-extrabold font-bengali">ভুল</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation with 💡 Icon (Only shown if revealed/answered) */}
          {isRevealed && item.explanation && (
            <View className="mb-4 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/25 rounded-2xl p-4 flex-row gap-3">
              <Text className="text-base mt-0.5">💡</Text>
              <View className="flex-1">
                <Text className="font-extrabold text-[11px] text-blue-700 dark:text-blue-400 mb-1 font-bengali">ব্যাখ্যা:</Text>
                <MathDisplay
                  content={item.explanation}
                  className="text-[13px] text-slate-600 dark:text-slate-400 font-bengali leading-5"
                />
              </View>
            </View>
          )}

          {/* Card Footer Controls */}
          <View className="flex-row justify-between items-center pt-3.5 border-t border-slate-100/40 dark:border-slate-800/45">
            <View className="flex-row items-center gap-3">
              {/* Interactive buttons */}
              {isRevealed ? (
                <TouchableOpacity
                  onPress={() => resetQuestionAnswers(item.id)}
                  className="flex-row items-center gap-1.5"
                >
                  <Icon name="eye-off-outline" size={13} color={isDark ? "#9ca3af" : "#6b7280"} />
                  <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] font-bengali">
                    উত্তর লুকান
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => toggleRevealAnswer(item.id)}
                  className="flex-row items-center gap-1.5"
                >
                  <Icon name="eye-outline" size={13} color={isDark ? "#9ca3af" : "#6b7280"} />
                  <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] font-bengali">
                    উত্তর দেখুন
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center py-16 bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-[32px] px-8 shadow-sm">
      <Text className="text-4xl mb-3">📝</Text>
      <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 font-bengali text-center">কোন প্রশ্ন পাওয়া যায়নি</Text>
      <Text className="text-slate-400 dark:text-slate-500 text-center text-xs mb-6 font-bengali leading-5">
        {searchQuery || filterSubject !== 'all'
          ? "ফিল্টারের সাথে মিলিয়ে কোন প্রশ্ন পাওয়া যায়নি"
          : "এখনও কোন প্রশ্ন যোগ করা হয়নি"}
      </Text>
      {(searchQuery || filterSubject !== 'all') && (
        <TouchableOpacity 
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl shadow-sm"
          onPress={handleClearFilters}
        >
          <Text className="text-white font-bold font-bengali text-sm">সব ফিল্টার সরান</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const totalCount = paginationData.totalCount || 0;

  // Header controllers rendered inside ListHeaderComponent for optimal mobile UX
  const renderListHeader = () => {
    return (
      <View className="pt-6 pb-2.5">
        {/* Header Title */}
        <View className="mb-5 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-black text-slate-900 dark:text-slate-50 font-bengali">সমস্ত প্রশ্নব্যাংক</Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-bengali">বিসিএস প্রস্তুতির সকল প্রশ্ন ও সমাধান</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2.5 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <Icon name="close" size={18} color={isDark ? "#cbd5e1" : "#475569"} />
          </TouchableOpacity>
        </View>

        {/* Premium search bar */}
        <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-2 mb-4 shadow-sm">
          <Icon name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
          <TextInput
            className="flex-1 text-slate-800 dark:text-slate-100 text-xs font-bengali py-1.5"
            placeholder="প্রশ্ন বা টপিক খুঁজুন..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              setCurrentPage(1);
              setHasMore(true);
              loadQuestions(1, false);
            }}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadQuestions(1, false); }}>
              <Icon name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal scrollable subjects pills selector (Superb Mobile UX) */}
        <View className="mb-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-bengali">বিষয়সমূহ</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          >
            {/* All subjects pill */}
            <TouchableOpacity
              onPress={() => setFilterSubject('all')}
              className={`px-4 py-2 rounded-full border ${
                filterSubject === 'all'
                  ? 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500'
                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <Text className={`text-[11px] font-extrabold font-bengali ${filterSubject === 'all' ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                সব বিষয়
              </Text>
            </TouchableOpacity>

            {/* Subject pills mapping */}
            {availableSubjects.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setFilterSubject(sub.id.toString())}
                className={`px-4 py-2 rounded-full border ${
                  filterSubject === sub.id.toString()
                    ? 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <Text className={`text-[11px] font-extrabold font-bengali ${filterSubject === sub.id.toString() ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {totalCount > 0 && (
          <View className="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/30 rounded-2xl p-3 mt-4">
            <Text className="text-primary-700 dark:text-primary-400 text-xs text-center font-bold font-bengali">
              মোট {totalCount} টি প্রশ্ন পাওয়া গেছে
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Questions list */}
      <FlatList
        data={displayedQuestions}
        renderItem={renderQuestionItem}
        keyExtractor={(item: Question) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreQuestions}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
      />
    </SafeAreaView>
  );
};

export default QuestionsScreen;
