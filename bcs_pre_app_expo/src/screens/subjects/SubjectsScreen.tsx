// src/screens/subjects/SubjectsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchSubjects, searchSubjects } from '../../store/slices/subjectSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  MainStackParamList,
} from '../../navigation/AppNavigator';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons as Icon } from '@expo/vector-icons';

type SubjectsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type SubjectsScreenRouteProp = RouteProp<MainStackParamList, 'Subjects'>;

interface Category {
  id: number;
  name: string;
}

interface SelectedCategory {
  id: number | null;
  name: string;
}

const SubjectsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<SubjectsScreenNavigationProp>();
  const route = useRoute<SubjectsScreenRouteProp>();
  const { isDark } = useAppTheme();

  const { categoryId, categoryName } = route.params || {};

  const { subjects, filteredSubjects, isLoading, error, pagination } =
    useSelector((state: RootState) => state.subject);
  const { categories } = useSelector((state: RootState) => state.category);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>({
    id: categoryId || null,
    name: categoryName || 'সকল বিষয়',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoadedFirstPage, setHasLoadedFirstPage] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  const paginationData = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  };

  const displaySubjects = searchQuery ? filteredSubjects || [] : subjects || [];

  const getCategoriesArray = (): Category[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (categories && typeof categories === 'object' && 'results' in categories) {
      return (categories as any).results;
    }
    return [];
  };

  const loadSubjects = async (page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
        setPaginationError(null);
      } else {
        setRefreshing(true);
        setPaginationError(null);
      }

      const result = await dispatch(
        fetchSubjects({
          category_id: selectedCategory.id || undefined,
          page,
          page_size: pageSize,
        }),
      ).unwrap();

      setCurrentPage(page);
      setHasLoadedFirstPage(true);

      if (result.pagination?.next) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.log('Failed to fetch subjects:', err);
      if (err?.status === 404 || err?.includes?.('404') || err?.includes?.('Not found')) {
        setHasMore(false);
        setPaginationError('আরো বিষয় পাওয়া যায়নি');
      } else if (loadMore) {
        setPaginationError('আরো বিষয় লোড করতে সমস্যা হয়েছে');
      } else {
        Alert.alert('ত্রুটি', 'বিষয়সমূহ লোড করতে সমস্যা হয়েছে');
      }
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setHasLoadedFirstPage(false);
    await loadSubjects(1, false);
  }, [selectedCategory.id]);

  const loadMoreSubjects = useCallback(async () => {
    if (hasLoadedFirstPage && !loadingMore && hasMore && !isLoading && !searchQuery) {
      const nextPage = currentPage + 1;
      await loadSubjects(nextPage, true);
    }
  }, [hasLoadedFirstPage, currentPage, loadingMore, hasMore, isLoading, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        dispatch(searchSubjects(searchQuery));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, dispatch]);

  useEffect(() => {
    setHasLoadedFirstPage(false);
    loadSubjects(1, false);
  }, [selectedCategory.id]);

  useEffect(() => {
    if (categoryId && categoryName) {
      setSelectedCategory({
        id: categoryId,
        name: categoryName,
      });
    }
  }, [categoryId, categoryName]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setPaginationError(null);
  }, [selectedCategory.id]);

  const handleCategorySelect = (category: SelectedCategory) => {
    setSelectedCategory(category);
    setShowCategoryFilter(false);
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
    setPaginationError(null);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory({
      id: null,
      name: 'সকল বিষয়',
    });
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
    setPaginationError(null);
  };

  const allCategoriesOption: SelectedCategory = { id: null, name: 'সকল বিষয়' };
  const categoriesArray = getCategoriesArray();
  const categoryOptions = [allCategoriesOption, ...categoriesArray];

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-6 items-center flex-row justify-center gap-2">
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-bengali">আরো বিষয় লোড হচ্ছে...</Text>
        </View>
      );
    }

    if (paginationError && !hasMore) {
      return (
        <View className="py-4 items-center">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-bengali">{paginationError}</Text>
        </View>
      );
    }

    if (!hasMore && displaySubjects.length > 0) {
      return (
        <View className="py-4 items-center">
          <Text className="text-slate-400 dark:text-slate-600 text-xs font-bengali">সব বিষয় দেখানো হয়েছে</Text>
        </View>
      );
    }

    return null;
  };

  const renderSubjectItem = ({ item }: { item: any }) => (
    <View
      className="bg-white dark:bg-slate-900 border border-slate-100/70 dark:border-slate-800 rounded-[24px] p-5 shadow-sm mb-4"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-6">{item.name}</Text>
          {item.description && (
            <Text className="text-slate-400 dark:text-slate-505 text-xs mt-1.5 font-bengali leading-4">{item.description}</Text>
          )}
        </View>
        <View className="bg-primary-50 dark:bg-primary-950/40 px-3.5 py-1.5 rounded-2xl border border-primary-100/30 dark:border-primary-900/30">
          <Text className="text-primary-600 dark:text-primary-400 font-black text-xs font-bengali">
            {item.total_questions || item.question_count || 0} প্রশ্ন
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3 border-t border-slate-100/70 dark:border-slate-800/60 pt-4">
        <TouchableOpacity
          className="bg-primary-600 dark:bg-primary-700 flex-1 py-3.5 rounded-[16px] flex-row items-center justify-center gap-2 shadow-sm"
          onPress={() =>
            navigation.navigate('TabNavigator', {
              screen: 'PracticeTab',
              params: {
                subjectId: item.id,
              },
            })
          }
        >
          <Icon name="rocket-outline" size={15} color="white" />
          <Text className="text-white font-bold text-xs font-bengali">প্র্যাকটিস করুন</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-1 py-3.5 rounded-[16px] flex-row items-center justify-center gap-2"
          onPress={() =>
            navigation.navigate('Questions', {
              subjectId: item.id,
            })
          }
        >
          <Icon name="book-outline" size={15} color={isDark ? "#cbd5e1" : "#475569"} />
          <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs font-bengali">প্রশ্নব্যাংক</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <Icon name="book-outline" size={64} color={isDark ? "#334155" : "#cbd5e1"} />
      <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 font-bengali">কোন বিষয় পাওয়া যায়নি</Text>
      <Text className="text-slate-400 dark:text-slate-500 text-center text-sm mt-2 font-bengali">
        {searchQuery
          ? `"${searchQuery}" এর সাথে মিলে এমন কোন বিষয় পাওয়া যায়নি`
          : 'দয়া করে পরে আবার চেষ্টা করুন'}
      </Text>
      {searchQuery ? (
        <TouchableOpacity
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl mt-6 shadow-sm"
          onPress={() => setSearchQuery('')}
        >
          <Text className="text-white font-bold text-sm font-bengali">সব বিষয় দেখুন</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl mt-6 shadow-sm" 
          onPress={onRefresh}
        >
          <Text className="text-white font-bold text-sm font-bengali">রিফ্রেশ করুন</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const totalCount = paginationData.totalCount || 0;

  if (isLoading && !refreshing && displaySubjects.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 text-sm mt-4 font-bengali">
          {selectedCategory.id ? 'বিষয়সমূহ লোড হচ্ছে...' : 'সকল বিষয় লোড হচ্ছে...'}
        </Text>
      </View>
    );
  }

  if (error && displaySubjects.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950 px-8">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <Icon name="warning-outline" size={64} color="#ef4444" />
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 font-bengali">বিষয়সমূহ লোড করতে সমস্যা হয়েছে</Text>
        <Text className="text-slate-400 dark:text-slate-500 text-center text-sm mt-2 font-bengali">{error}</Text>
        <TouchableOpacity 
          className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl mt-6 shadow-sm" 
          onPress={onRefresh}
        >
          <Text className="text-white font-bold text-sm font-bengali">আবার চেষ্টা করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-14 pb-6 px-6 border-b border-slate-100 dark:border-slate-800/80 rounded-b-[40px] shadow-sm">
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali">{selectedCategory.name}</Text>
        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 font-bengali leading-5">
          {selectedCategory.id ? `ক্যাটাগরি: ${selectedCategory.name}` : 'আপনার বিসিএস প্রস্তুতির জন্য পছন্দের বিষয় নির্বাচন করুন'}
        </Text>

        {/* Search and Filter Row */}
        <View className="flex-row items-center gap-3 mt-5">
          <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-100/70 dark:border-slate-855 rounded-[18px] px-4 py-0.5">
            <Icon name="search-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-slate-800 dark:text-slate-100 text-sm font-bengali py-2.5"
              placeholder="বিষয় খুঁজুন..."
              placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            className="bg-slate-50 dark:bg-slate-950 border border-slate-100/70 dark:border-slate-855 w-12 h-12 rounded-[18px] items-center justify-center shadow-sm"
            onPress={() => setShowCategoryFilter(true)}
            activeOpacity={0.8}
          >
            <Icon name="funnel-outline" size={18} color={isDark ? "#cbd5e1" : "#475569"} />
          </TouchableOpacity>
        </View>

        {/* Selected Category Badge */}
        {selectedCategory.id && (
          <View className="flex-row items-center bg-primary-50 dark:bg-primary-950/30 border border-primary-100/50 dark:border-primary-900/50 self-start px-3.5 py-1.5 rounded-full mt-4">
            <Text className="text-primary-600 dark:text-primary-400 text-xs font-bold font-bengali mr-2 leading-none">
              {selectedCategory.name}
            </Text>
            <TouchableOpacity onPress={clearCategoryFilter} className="justify-center items-center">
              <Icon name="close-circle" size={16} color={isDark ? "#a855f7" : "#7c3aed"} />
            </TouchableOpacity>
          </View>
        )}

        {/* Page Info */}
        {totalCount > 0 && !searchQuery && (
          <View className="mt-4">
            <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bengali font-bold">
              দেখানো হচ্ছে {displaySubjects.length} / {totalCount} বিষয়{' '}
              {hasMore && !paginationError && '(আরো লোড হচ্ছে...)'}
              {paginationError && `(${paginationError})`}
            </Text>
          </View>
        )}
      </View>

      {/* Subjects List */}
      <FlatList
        data={displaySubjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreSubjects}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryFilter}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white dark:bg-slate-900 rounded-t-[40px] max-h-[75%] p-6 border-t border-slate-100/70 dark:border-slate-800">
            {/* Modal Pull Bar */}
            <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-5" />
            
            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <Text className="text-lg font-black text-slate-800 dark:text-slate-100 font-bengali">ক্যাটাগরি নির্বাচন করুন</Text>
              <TouchableOpacity
                className="w-8 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full items-center justify-center"
                onPress={() => setShowCategoryFilter(false)}
              >
                <Icon name="close" size={16} color={isDark ? "#94a3b8" : "#64748b"} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categoryOptions}
              keyExtractor={item => (item.id ? item.id.toString() : 'all')}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`flex-row justify-between items-center py-4 px-4 rounded-2xl mb-2.5 ${
                    selectedCategory.id === item.id 
                      ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30' 
                      : 'bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-900/30'
                  }`}
                  onPress={() => handleCategorySelect(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm font-bengali ${
                      selectedCategory.id === item.id
                        ? 'text-primary-600 dark:text-primary-400 font-black'
                        : 'text-slate-700 dark:text-slate-300 font-bold'
                    }`}
                  >
                    {item.name}
                  </Text>
                  {selectedCategory.id === item.id && (
                    <Icon name="checkmark-circle" size={18} color={isDark ? "#a855f7" : "#7c3aed"} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SubjectsScreen;
