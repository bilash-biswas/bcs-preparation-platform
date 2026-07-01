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
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchSubjects, searchSubjects } from '../../store/slices/subjectSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  TabParamList,
} from '../../navigation/AppNavigator';

type SubjectsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
type SubjectsScreenRouteProp = RouteProp<TabParamList, 'Subjects'>;

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

  // Get params safely with fallback
  const { categoryId, categoryName } = route.params || {};

  // Use subjects from Redux
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  // Safe pagination data
  const paginationData = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  };

  // Use filteredSubjects if available, otherwise use subjects
  const displaySubjects = searchQuery ? filteredSubjects || [] : subjects || [];

  // Helper function to extract categories array
  const getCategoriesArray = (): Category[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (
      categories &&
      typeof categories === 'object' &&
      'results' in categories
    ) {
      return (categories as any).results;
    }
    return [];
  };

  const loadSubjects = async (page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
        setPaginationError(null); // Clear previous errors when loading more
      } else {
        setRefreshing(true);
        setPaginationError(null);
      }

      console.log(
        'Loading subjects - Page:',
        page,
        'Category:',
        selectedCategory.id,
      );

      const result = await dispatch(
        fetchSubjects({
          category_id: selectedCategory.id || undefined,
          page,
          page_size: pageSize,
        }),
      ).unwrap();

      setCurrentPage(page);

      // Check if there are more pages to load
      const totalPages = result.pagination?.total_pages || 1;
      console.log(
        'Total pages:',
        totalPages,
        'Current page:',
        page,
        'Has next:',
        result.pagination?.next,
      );

      // Use the API's next field to determine if there are more pages
      if (result.pagination?.next) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.log('Failed to fetch subjects:', error);

      // Handle 404 specifically (no more pages)
      if (
        error?.status === 404 ||
        error?.includes('404') ||
        error?.includes('Not found')
      ) {
        console.log('No more subjects available (404)');
        setHasMore(false);
        setPaginationError('আরো বিষয় পাওয়া যায়নি');
      } else if (loadMore) {
        // Only show alert for initial load errors, not for pagination errors
        setPaginationError('আরো বিষয় লোড করতে সমস্যা হয়েছে');
      } else {
        Alert.alert('ত্রুটি', 'বিষয়সমূহ লোড করতে সমস্যা হয়েছে');
      }
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    await loadSubjects(1, false);
  }, [selectedCategory.id]);

  // Load more subjects when reaching the end
  const loadMoreSubjects = useCallback(async () => {
    if (!loadingMore && hasMore && !isLoading && !searchQuery) {
      console.log('Loading more subjects... Current page:', currentPage);
      const nextPage = currentPage + 1;
      await loadSubjects(nextPage, true);
    }
  }, [currentPage, loadingMore, hasMore, isLoading, searchQuery]);

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        dispatch(searchSubjects(searchQuery));
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchQuery, dispatch]);

  // Initial load
  useEffect(() => {
    console.log('Initial load triggered');
    loadSubjects(1, false);
  }, [selectedCategory.id]);

  // Handle category selection from route params on initial load
  useEffect(() => {
    if (categoryId && categoryName) {
      setSelectedCategory({
        id: categoryId,
        name: categoryName,
      });
    }
  }, [categoryId, categoryName]);

  // Reset pagination when category changes
  useEffect(() => {
    console.log('Category changed, resetting pagination');
    setCurrentPage(1);
    setHasMore(true);
    setPaginationError(null);
  }, [selectedCategory.id]);

  const handleSubjectPress = (subject: any) => {};

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

  // Prepare categories for the filter modal
  const allCategoriesOption: SelectedCategory = { id: null, name: 'সকল বিষয়' };
  const categoriesArray = getCategoriesArray();
  const categoryOptions = [allCategoriesOption, ...categoriesArray];

  // Render footer with loading indicator or error
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#dc2626" />
          <Text style={styles.footerText}>আরো বিষয় লোড হচ্ছে...</Text>
        </View>
      );
    }

    if (paginationError && !hasMore) {
      return (
        <View style={styles.footerError}>
          <Text style={styles.footerErrorText}>{paginationError}</Text>
        </View>
      );
    }

    if (!hasMore && displaySubjects.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>সব বিষয় দেখানো হয়েছে</Text>
        </View>
      );
    }

    return null;
  };

  // Render individual subject item
  const renderSubjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => handleSubjectPress(item)}
    >
      <View style={styles.subjectHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.subjectDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.questionCount}>
          <Text style={styles.questionCountText}>
            {item.total_questions || item.question_count || 0}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'TabNavigator',
              params: {
                screen: 'Questions',
                params: {
                  subjectId: item.id,
                },
              },
            })
          }
        >
          <Text style={styles.primaryButtonText}>প্র্যাকটিস করুন</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'TabNavigator',
              params: {
                screen: 'Practice',
                params: {
                  subjectId: item.id,
                },
              },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>প্রশ্নব্যাংক</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'কোন বিষয় পাওয়া যায়নি' : 'কোন বিষয় পাওয়া যায়নি'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery
          ? '"' + searchQuery + '" এর সাথে মিলে এমন কোন বিষয় পাওয়া যায়নি'
          : 'দয়া করে পরে আবার চেষ্টা করুন'}
      </Text>
      {searchQuery ? (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearSearchButtonText}>সব বিষয় দেখুন</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>রিফ্রেশ করুন</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const CategoryFilterModal = () => (
    <Modal
      visible={showCategoryFilter}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryFilter(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ক্যাটাগরি নির্বাচন করুন</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryFilter(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categoryOptions}
            keyExtractor={item => (item.id ? item.id.toString() : 'all')}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  selectedCategory.id === item.id &&
                    styles.selectedCategoryItem,
                ]}
                onPress={() => handleCategorySelect(item)}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    selectedCategory.id === item.id &&
                      styles.selectedCategoryItemText,
                  ]}
                >
                  {item.name}
                </Text>
                {selectedCategory.id === item.id && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  const totalCount = paginationData.totalCount || 0;

  // Loading state (initial load)
  if (isLoading && !refreshing && displaySubjects.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#f9fafb" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>
          {selectedCategory.id
            ? 'বিষয়সমূহ লোড হচ্ছে...'
            : 'সকল বিষয় লোড হচ্ছে...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (error && displaySubjects.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar backgroundColor="#f9fafb" barStyle="dark-content" />
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>বিষয়সমূহ লোড করতে সমস্যা হয়েছে</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>আবার চেষ্টা করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f9fafb" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{selectedCategory.name}</Text>
        <Text style={styles.headerSubtitle}>
          {selectedCategory.id
            ? `ক্যাটাগরি: ${selectedCategory.name}`
            : 'আপনার পছন্দের বিষয় নির্বাচন করুন'}
        </Text>

        {/* Search and Filter Row */}
        <View style={styles.filterRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="বিষয় খুঁজুন..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.categoryFilterButton}
            onPress={() => setShowCategoryFilter(true)}
          >
            <Text style={styles.categoryFilterButtonText}>ফিল্টার</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Category Badge */}
        {selectedCategory.id && (
          <View style={styles.selectedCategoryBadge}>
            <Text style={styles.selectedCategoryBadgeText}>
              {selectedCategory.name}
            </Text>
            <TouchableOpacity
              onPress={clearCategoryFilter}
              style={styles.clearCategoryButton}
            >
              <Text style={styles.clearCategoryButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Page Info */}
        {totalCount > 0 && !searchQuery && (
          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              দেখানো হচ্ছে {displaySubjects.length} / {totalCount} বিষয়{' '}
              {hasMore && !paginationError && '(আরো লোড হচ্ছে...)'}
              {paginationError && `(${paginationError})`}
            </Text>
          </View>
        )}
      </View>

      {/* Subjects List with Infinite Scroll */}
      <FlatList
        data={displaySubjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreSubjects}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={[
          styles.listContent,
          displaySubjects.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
      />

      <CategoryFilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 24,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4b5563',
    marginTop: 16,
    fontFamily: 'NotoSansBengali',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
  },
  errorMessage: {
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'NotoSansBengali',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'NotoSansBengali',
  },
  headerSubtitle: {
    color: '#4b5563',
    marginTop: 4,
    marginBottom: 16,
    fontFamily: 'NotoSansBengali',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'NotoSansBengali',
  },
  categoryFilterButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  categoryFilterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'NotoSansBengali',
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  selectedCategoryBadgeText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'NotoSansBengali',
    marginRight: 8,
  },
  clearCategoryButton: {
    backgroundColor: '#93c5fd',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearCategoryButtonText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pageInfo: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pageInfoText: {
    color: '#1e40af',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    fontWeight: '500',
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
    fontFamily: 'NotoSansBengali',
  },
  subjectDescription: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'NotoSansBengali',
  },
  questionCount: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  questionCountText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyItem: {
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontFamily: 'NotoSansBengali',
  },
  easyBadge: {
    backgroundColor: '#dcfce7',
  },
  mediumBadge: {
    backgroundColor: '#fef3c7',
  },
  hardBadge: {
    backgroundColor: '#fee2e2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#4b5563',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
  },
  emptyStateMessage: {
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'NotoSansBengali',
  },
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: '#4b5563',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  footerError: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  footerErrorText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  footerEnd: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  footerEndText: {
    color: '#0369a1',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'NotoSansBengali',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f9ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'NotoSansBengali',
  },
  selectedCategoryItemText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  selectedIndicator: {
    color: '#0369a1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
  },
});

export default SubjectsScreen;
