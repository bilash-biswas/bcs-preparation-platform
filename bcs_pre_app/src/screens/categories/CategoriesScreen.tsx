import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchCategories } from '../../store/slices/categorySlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Category } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CategoriesScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const { categories, isLoading, error, pagination } = useSelector(
    (state: RootState) => state.category,
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of categories per page
  const [hasMore, setHasMore] = useState(true);

  // Safe access to categories array with proper typing
  const categoriesArray: Category[] = Array.isArray(categories) ? categories : [];

  // Safe pagination data
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
      
      await dispatch(fetchCategories({ 
        page,
        page_size: pageSize
      })).unwrap();
      
      setCurrentPage(page);
      
      // Check if there are more pages to load
      if (page >= paginationData.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.log('Failed to fetch categories:', error);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    await loadCategories(1, false);
  }, []);

  // Load more categories when reaching the end
  const loadMoreCategories = useCallback(async () => {
    if (!loadingMore && hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      await loadCategories(nextPage, true);
    }
  }, [currentPage, loadingMore, hasMore, isLoading]);

  useEffect(() => {
    loadCategories(1, false);
  }, []);

  // Improved color palette
  const colorPalette = [
    { bg: '#3b82f6', lightBg: '#eff6ff', text: '#1e40af' }, // Blue
    { bg: '#f59e0b', lightBg: '#fffbeb', text: '#92400e' }, // Orange
    { bg: '#06b6d4', lightBg: '#ecfeff', text: '#0e7490' }, // Cyan
    { bg: '#8b5cf6', lightBg: '#faf5ff', text: '#6b21a8' }, // Purple
    { bg: '#10b981', lightBg: '#ecfdf5', text: '#047857' }, // Emerald
    { bg: '#ec4899', lightBg: '#fdf2f8', text: '#be185d' }, // Pink
  ];

  const getCategoryColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  const getCategoryIcon = (index: number) => {
    const icons = ['📚', '🔬', '🌍', '💼', '⚖️', '🏛️'];
    return icons[index % icons.length];
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Main', {
      screen: 'TabNavigator',
      params: {
        screen: 'Subjects',
        params: {
          categoryId: category.id,
          categoryName: category.name,
        },
      },
    });
  };

  // Render footer with loading indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.footerText}>আরো ক্যাটাগরি লোড হচ্ছে...</Text>
      </View>
    );
  };

  // Render individual category item
  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
    const colors = getCategoryColor(index);
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { backgroundColor: colors.lightBg, borderLeftColor: colors.bg }
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        {/* Icon and Title */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(index)}
            </Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={styles.categoryDescription}>
              {item.description || 'বিভিন্ন বিষয়ের প্রশ্ন'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.cardStatsContainer}>
          <View style={styles.cardStatItem}>
            <Icon name="document-text-outline" size={18} color={colors.text} />
            <View style={styles.statTextContainer}>
              <Text style={[styles.cardStatNumber, { color: colors.text }]}>
                {item.question_count || 0}
              </Text>
              <Text style={styles.cardStatLabel}>প্রশ্ন</Text>
            </View>
          </View>
          
          <View style={styles.cardStatItem}>
            <Icon name="library-outline" size={18} color={colors.text} />
            <View style={styles.statTextContainer}>
              <Text style={[styles.cardStatNumber, { color: colors.text }]}>
                {item.subject_count || 0}
              </Text>
              <Text style={styles.cardStatLabel}>বিষয়</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.bg }]}
          onPress={() => handleCategoryPress(item)}
        >
          <Text style={styles.actionButtonText}>বিষয়সমূহ দেখুন</Text>
          <Icon name="chevron-forward" size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="folder-open-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>কোন ক্যাটাগরি নেই</Text>
      <Text style={styles.emptyMessage}>
        এই মুহূর্তে কোন ক্যাটাগরি পাওয়া যায়নি
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onRefresh}>
        <Text style={styles.emptyButtonText}>রিফ্রেশ করুন</Text>
      </TouchableOpacity>
    </View>
  );

  const totalCount = paginationData.totalCount || 0;

  // Loading state (initial load)
  if (isLoading && !refreshing && categoriesArray.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>ক্যাটাগরি লোড হচ্ছে...</Text>
      </View>
    );
  }

  // Error state
  if (error && categoriesArray.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <Icon name="warning-outline" size={64} color="#dc2626" />
        <Text style={styles.errorTitle}>লোড করতে সমস্যা হয়েছে</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>আবার চেষ্টা করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ক্যাটাগরি সমূহ</Text>
          <Text style={styles.headerSubtitle}>আপনার পছন্দের ক্যাটাগরি নির্বাচন করুন</Text>
        </View>
        
        {/* Stats Overview */}
        {totalCount > 0 && (
          <View style={styles.headerStatsContainer}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>{totalCount}</Text>
              <Text style={styles.headerStatLabel}>মোট ক্যাটাগরি</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>
                {categoriesArray.reduce((sum, cat) => sum + (cat.question_count || 0), 0)}
              </Text>
              <Text style={styles.headerStatLabel}>মোট প্রশ্ন</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>
                {categoriesArray.reduce((sum, cat) => sum + (cat.subject_count || 0), 0)}
              </Text>
              <Text style={styles.headerStatLabel}>মোট বিষয়</Text>
            </View>
          </View>
        )}

        {/* Page Info */}
        {totalCount > 0 && (
          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              দেখানো হচ্ছে {categoriesArray.length} / {totalCount} ক্যাটাগরি {hasMore && '(আরো লোড হচ্ছে...)'}
            </Text>
          </View>
        )}
      </View>

      {/* Categories List with Infinite Scroll */}
      <FlatList
        data={categoriesArray}
        renderItem={renderCategoryItem}
        keyExtractor={(item: Category) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreCategories}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    fontFamily: 'NotoSansBengali',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'NotoSansBengali',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'NotoSansBengali',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  headerStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  headerStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#475569',
  },
  headerStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'NotoSansBengali',
  },
  pageInfo: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
  },
  pageInfoText: {
    color: '#1e40af',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 22,
    color: 'white',
  },
  titleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'NotoSansBengali',
    marginBottom: 6,
    lineHeight: 24,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
    lineHeight: 20,
  },
  cardStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  statTextContainer: {
    alignItems: 'center',
  },
  cardStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'NotoSansBengali',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'NotoSansBengali',
  },
  emptyMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'NotoSansBengali',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'NotoSansBengali',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
  },
});

export default CategoriesScreen;