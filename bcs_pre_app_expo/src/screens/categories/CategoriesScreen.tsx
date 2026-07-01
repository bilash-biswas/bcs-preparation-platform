// src/screens/categories/CategoriesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchCategoriesWithCounts } from '../../store/slices/categorySlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Category } from '../../types';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CategoriesScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const { categories, isLoading, error, pagination } = useSelector(
    (state: RootState) => state.category,
  );
  const { isDark } = useAppTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoadedFirstPage, setHasLoadedFirstPage] = useState(false);

  const categoriesArray: Category[] = Array.isArray(categories) ? categories : [];

  const paginationData = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  };

  const loadCategories = async (page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }
      
      await dispatch(fetchCategoriesWithCounts({ 
        page,
        page_size: pageSize
      })).unwrap();
      
      setCurrentPage(page);
      setHasLoadedFirstPage(true);
      
      if (page >= paginationData.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.log('Failed to fetch categories:', err);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setHasLoadedFirstPage(false);
    await loadCategories(1, false);
  }, []);

  const loadMoreCategories = useCallback(async () => {
    if (hasLoadedFirstPage && !loadingMore && hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      await loadCategories(nextPage, true);
    }
  }, [hasLoadedFirstPage, currentPage, loadingMore, hasMore, isLoading]);

  useEffect(() => {
    setHasLoadedFirstPage(false);
    loadCategories(1, false);
  }, []);

  const colorPalette = [
    { bg: 'bg-primary-500', textClass: 'text-primary-600 dark:text-primary-400', color: '#7c3aed', darkColor: '#a855f7', lightBg: 'bg-primary-50 dark:bg-primary-950/20', border: 'border-primary-500' },
    { bg: 'bg-secondary-500', textClass: 'text-secondary-600 dark:text-secondary-400', color: '#12b886', darkColor: '#20c997', lightBg: 'bg-secondary-50 dark:bg-secondary-950/20', border: 'border-secondary-500' },
    { bg: 'bg-blue-500', textClass: 'text-blue-600 dark:text-blue-400', color: '#2563eb', darkColor: '#60a5fa', lightBg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-500' },
    { bg: 'bg-accent-500', textClass: 'text-accent-600 dark:text-accent-400', color: '#fab005', darkColor: '#ffd43b', lightBg: 'bg-accent-50 dark:bg-accent-950/20', border: 'border-accent-500' },
  ];

  const getCategoryColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  const getCategoryIcon = (index: number) => {
    const icons = ['book-outline', 'flask-outline', 'globe-outline', 'briefcase-outline', 'ribbon-outline', 'library-outline'];
    return icons[index % icons.length] as any;
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Main', {
      screen: 'Subjects',
      params: {
        categoryId: category.id,
        categoryName: category.name,
      },
    });
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-6 items-center flex-row justify-center gap-2">
        <ActivityIndicator size="small" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 text-xs font-bengali">আরো ক্যাটাগরি লোড হচ্ছে...</Text>
      </View>
    );
  };

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
    const colors = getCategoryColor(index);
    return (
      <TouchableOpacity
        className={`bg-white dark:bg-slate-900 border-l-4 ${colors.border} rounded-[24px] p-5 shadow-sm mb-4 border border-slate-100 dark:border-slate-800/80`}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.85}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1 mr-3">
            {/* Circular glowing icon backdrop */}
            <View className={`w-13 h-13 rounded-2xl items-center justify-center mr-4 ${colors.lightBg}`}>
              <Icon 
                name={getCategoryIcon(index)} 
                size={22} 
                color={isDark ? colors.darkColor : colors.color} 
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-bengali leading-6">
                {item.name}
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 font-bengali leading-4" numberOfLines={2}>
                {item.description || 'বিভিন্ন বিষয়ের প্র্যাকটিস প্রশ্ন'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Area with Stats Badges and Interactive Action */}
        <View className="flex-row items-center justify-between border-t border-slate-100/70 dark:border-slate-800/50 pt-4 mt-1">
          <View className="flex-row items-center gap-3">
            {/* Questions count pill */}
            <View className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-slate-100 dark:border-slate-800/60">
              <Icon name="document-text-outline" size={14} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className="text-slate-700 dark:text-slate-350 font-bold text-[11px] font-bengali">
                {item.question_count || 0} <Text className="text-slate-400 dark:text-slate-500 font-normal">প্রশ্ন</Text>
              </Text>
            </View>

            {/* Subjects count pill */}
            <View className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-slate-100 dark:border-slate-800/60">
              <Icon name="library-outline" size={14} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className="text-slate-700 dark:text-slate-350 font-bold text-[11px] font-bengali">
                {item.subject_count || 0} <Text className="text-slate-400 dark:text-slate-500 font-normal">বিষয়</Text>
              </Text>
            </View>
          </View>

          {/* Action indicator button */}
          <View className="w-8 h-8 rounded-full items-center justify-center bg-primary-50 dark:bg-primary-950/40 border border-primary-100/30 dark:border-primary-900/30 shadow-sm">
            <Icon 
              name="chevron-forward" 
              size={15} 
              color={isDark ? "#a855f7" : "#7c3aed"} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <Icon name="folder-open-outline" size={64} color={isDark ? "#334155" : "#cbd5e1"} />
      <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 font-bengali">কোন ক্যাটাগরি নেই</Text>
      <Text className="text-slate-400 dark:text-slate-500 text-center text-sm mt-2 font-bengali">
        এই মুহূর্তে কোন ক্যাটাগরি পাওয়া যায়নি
      </Text>
      <TouchableOpacity 
        className="bg-primary-600 dark:bg-primary-500 px-6 py-3 rounded-2xl mt-6 shadow-sm" 
        onPress={onRefresh}
      >
        <Text className="text-white font-bold text-sm font-bengali">রিফ্রেশ করুন</Text>
      </TouchableOpacity>
    </View>
  );

  const totalCount = paginationData.totalCount || 0;

  if (isLoading && !refreshing && categoriesArray.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-slate-400 dark:text-slate-500 text-sm mt-4 font-bengali">ক্যাটাগরি লোড হচ্ছে...</Text>
      </View>
    );
  }

  if (error && categoriesArray.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950 px-8">
        <StatusBar backgroundColor={isDark ? "#0f172a" : "#f8fafc"} barStyle={isDark ? "light-content" : "dark-content"} />
        <Icon name="warning-outline" size={64} color="#ef4444" />
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 font-bengali">লোড করতে সমস্যা হয়েছে</Text>
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
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali">ক্যাটাগরি সমূহ</Text>
        <Text className="text-slate-400 dark:text-slate-550 text-xs mt-1.5 font-bengali leading-5">
          আপনার বিসিএস প্রস্তুতির জন্য যেকোনো একটি ক্যাটাগরি বেছে নিন
        </Text>
        
        {totalCount > 0 && (
          <View className="flex-row justify-between bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-4 mt-5 border border-slate-100 dark:border-slate-800/50 shadow-inner">
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-slate-800 dark:text-slate-100">{totalCount}</Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali font-bold">মোট ক্যাটাগরি</Text>
            </View>
            <View className="w-px h-8 bg-slate-200 dark:bg-slate-800/60 self-center" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-slate-800 dark:text-slate-100">
                {categoriesArray.reduce((sum, cat) => sum + (cat.question_count || 0), 0)}
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali font-bold">মোট প্রশ্ন</Text>
            </View>
            <View className="w-px h-8 bg-slate-200 dark:bg-slate-800/60 self-center" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-slate-800 dark:text-slate-100">
                {categoriesArray.reduce((sum, cat) => sum + (cat.subject_count || 0), 0)}
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bengali font-bold">মোট বিষয়</Text>
            </View>
          </View>
        )}
      </View>

      {/* Categories List */}
      <FlatList
        data={categoriesArray}
        renderItem={renderCategoryItem}
        keyExtractor={(item: Category) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreCategories}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default CategoriesScreen;