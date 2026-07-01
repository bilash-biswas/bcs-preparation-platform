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
  Modal,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchQuestions } from '../../store/slices/questionSlice';
import { fetchSubjects } from '../../store/slices/subjectSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import your actual Question type from your types file
import { Question as QuestionType } from '../../types';

type QuestionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

// Use the imported QuestionType instead of redefining it
type Question = QuestionType;

interface Subject {
  id: number;
  name: string;
}

interface SubjectPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const QuestionsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<QuestionsScreenNavigationProp>();
  const { questions, isLoading, error, pagination } = useSelector((state: RootState) => state.question);
  const { 
  categories, 
  isLoading: categoriesLoading,
  pagination: categoriesPagination 
} = useSelector((state: RootState) => state.category);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Subject pagination states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectCurrentPage, setSubjectCurrentPage] = useState(1);
  const [subjectHasMore, setSubjectHasMore] = useState(true);
  const [loadingMoreSubjects, setLoadingMoreSubjects] = useState(false);
  const [subjectPageSize] = useState(50); // Larger page size for subjects since they're less frequently loaded

  // Safe access to questions array with proper typing
  const displayedQuestions: Question[] = Array.isArray(questions) ? questions : [];
  
  // Safe pagination data - match the structure from your Redux slice
  const paginationData = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  };

  // Safe subject pagination data
  const subjectPaginationData: SubjectPagination = categoriesPagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 50,
    hasNext: false,
    hasPrevious: false,
  };

  const loadQuestions = async (page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }
      
      await dispatch(fetchQuestions({ 
        page,
        page_size: pageSize,
        subject: filterSubject !== 'all' ? filterSubject : undefined,
        difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
        search: searchQuery || undefined
      })).unwrap();
      
      setCurrentPage(page);
      
      // Check if there are more pages to load
      if (page >= paginationData.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.log('Failed to fetch questions:', error);
      Alert.alert('ত্রুটি', 'প্রশ্ন লোড করতে সমস্যা হয়েছে');
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load categories/subjects with pagination
  const loadSubjects = async (page: number = 1, loadMore: boolean = false) => {
  try {
    if (loadMore) {
      setLoadingMoreSubjects(true);
    }

    const result = await dispatch(fetchSubjects({ 
      page, 
      page_size: subjectPageSize 
    })).unwrap();
    
    setSubjectCurrentPage(page);

    // Check if there are more subject pages to load
    if (page >= (result.pagination?.total_pages || 1)) {
      setSubjectHasMore(false);
    } else {
      setSubjectHasMore(true);
    }
  } catch (error) {
    console.log('Failed to fetch categories:', error);
  } finally {
    setLoadingMoreSubjects(false);
  }
};

  // Load more subjects when reaching the end in filter modal
  const loadMoreSubjectsHandler = useCallback(async () => {
    if (!loadingMoreSubjects && subjectHasMore && !categoriesLoading) {
      const nextPage = subjectCurrentPage + 1;
      await loadSubjects(nextPage, true);
    }
  }, [subjectCurrentPage, loadingMoreSubjects, subjectHasMore, categoriesLoading]);

  const onRefresh = React.useCallback(async () => {
    await loadQuestions(1, false);
  }, [filterSubject, filterDifficulty, searchQuery, pageSize]);

  // Load more questions when reaching the end
  const loadMoreQuestions = useCallback(async () => {
    if (!loadingMore && hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      await loadQuestions(nextPage, true);
    }
  }, [currentPage, loadingMore, hasMore, isLoading, filterSubject, filterDifficulty, searchQuery]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadQuestions(1, false);
      loadSubjects(1, false); // Load first page of subjects when component mounts
    }
  }, [isAuthenticated]);

  // Reset pagination when filters change
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1);
      setHasMore(true);
      loadQuestions(1, false);
    }
  }, [filterSubject, filterDifficulty, searchQuery]);

  // Use Redux categories if available, otherwise use local subjects state
  const availableSubjects = Array.isArray(categories) && categories.length > 0 
    ? categories.map(cat => ({ id: cat.id, name: cat.name }))
    : subjects;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return styles.easyBadge;
      case 'medium': return styles.mediumBadge;
      case 'hard': return styles.hardBadge;
      default: return styles.defaultBadge;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'সহজ';
      case 'medium': return 'মধ্যম';
      case 'hard': return 'কঠিন';
      default: return difficulty;
    }
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case 'mcq': return 'বহুনির্বাচনী';
      case 'true_false': return 'সত্য/মিথ্যা';
      case 'fill_blank': return 'শূন্যস্থান পূরণ';
      default: return type;
    }
  };

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const expandAll = () => {
    setExpandedQuestions(displayedQuestions.map(q => q.id));
  };

  const collapseAll = () => {
    setExpandedQuestions([]);
  };

  const handleFilterApply = () => {
    setFilterModalVisible(false);
    // Filters are applied automatically via useEffect
  };

  const handleClearFilters = () => {
    setFilterSubject('all');
    setFilterDifficulty('all');
    setSearchQuery('');
    setFilterModalVisible(false);
  };

  // Render footer with loading indicator for questions
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#dc2626" />
        <Text style={styles.footerText}>আরো প্রশ্ন লোড হচ্ছে...</Text>
      </View>
    );
  };

  // Render footer for subjects loading in filter modal
  const renderSubjectsFooter = () => {
    if (!loadingMoreSubjects) return null;
    
    return (
      <View style={styles.subjectsFooterLoader}>
        <ActivityIndicator size="small" color="#dc2626" />
        <Text style={styles.subjectsFooterText}>আরো বিষয় লোড হচ্ছে...</Text>
      </View>
    );
  };

  // Render individual subject item in filter modal
  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.filterOption,
        filterSubject === item.id.toString() && styles.activeFilterOption
      ]}
      onPress={() => setFilterSubject(item.id.toString())}
    >
      <Text style={styles.filterOptionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render individual question item
  const renderQuestionItem = ({ item, index }: { item: Question; index: number }) => (
    <View style={styles.questionCard}>
      {/* Question Header */}
      <TouchableOpacity
        onPress={() => toggleQuestion(item.id)}
        style={styles.questionHeader}
      >
        <View style={styles.questionHeaderContent}>
          <View style={styles.questionMeta}>
            <Text style={styles.questionNumber}>
              #{(currentPage - 1) * pageSize + index + 1}
            </Text>
            <View style={[styles.difficultyBadge, getDifficultyColor(item.difficulty)]}>
              <Text style={styles.difficultyText}>
                {getDifficultyText(item.difficulty)}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {getQuestionTypeText(item.question_type)}
              </Text>
            </View>
            <Text style={styles.marksText}>
              {item.marks} মার্কস
            </Text>
          </View>
          <Text style={styles.questionText}>
            {item.question_text}
          </Text>
          <Text style={styles.subjectText}>
            বিষয়: {item.subject_name}
          </Text>
        </View>
        <View style={styles.expandIcon}>
          <Icon 
            name={expandedQuestions.includes(item.id) ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9ca3af" 
          />
        </View>
      </TouchableOpacity>

      {/* Question Details */}
      {expandedQuestions.includes(item.id) && (
        <View style={styles.questionDetails}>
          {/* Options */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>বিকল্পসমূহ:</Text>
            <View style={styles.optionsList}>
              {item.options && item.options.map((option) => (
                <View
                  key={option.id}
                  style={[
                    styles.optionItem,
                    option.is_correct ? styles.correctOption : styles.incorrectOption
                  ]}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionIndicator,
                        option.is_correct ? styles.correctIndicator : styles.incorrectIndicator
                      ]}
                    >
                      {option.is_correct && (
                        <Icon name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      option.is_correct ? styles.correctOptionText : styles.incorrectOptionText
                    ]}>
                      {option.option_text}
                    </Text>
                    {option.is_correct && (
                      <View style={styles.correctBadge}>
                        <Text style={styles.correctBadgeText}>সঠিক</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Explanation */}
          {item.explanation && (
            <View style={styles.explanationSection}>
              <Text style={styles.sectionTitle}>ব্যাখ্যা:</Text>
              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>
                  {item.explanation}
                </Text>
              </View>
            </View>
          )}

          {/* Question Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>আইডি:</Text>
              <Text style={styles.metaValue}>{item.id}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>নেগেটিভ:</Text>
              <Text style={styles.metaValue}>{item.negative_marks}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>কোন প্রশ্ন পাওয়া যায়নি</Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery || filterSubject !== 'all' || filterDifficulty !== 'all'
          ? "ফিল্টারের সাথে মিলিয়ে কোন প্রশ্ন পাওয়া যায়নি"
          : "এখনও কোন প্রশ্ন যোগ করা হয়নি"}
      </Text>
      {(searchQuery || filterSubject !== 'all' || filterDifficulty !== 'all') && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearFiltersButtonText}>সব ফিল্টার সরান</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#f8fafc" barStyle="dark-content" />
        <View style={styles.authContainer}>
          <View style={styles.authCard}>
            <Text style={styles.authIcon}>🔒</Text>
            <Text style={styles.authTitle}>লগইন প্রয়োজন</Text>
            <Text style={styles.authMessage}>প্রশ্ন দেখতে আপনাকে লগইন করতে হবে</Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login' as any)}
            >
              <Text style={styles.loginButtonText}>লগইন করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state (initial load)
  if (isLoading && !refreshing && displayedQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#f8fafc" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>প্রশ্ন লোড হচ্ছে...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && displayedQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#f8fafc" barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>প্রশ্ন লোড করতে সমস্যা হয়েছে</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadQuestions(1, false)}
          >
            <Text style={styles.retryButtonText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalCount = paginationData.totalCount || 0;
  const totalSubjects = subjectPaginationData.totalCount || availableSubjects.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#f8fafc" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>সমস্ত প্রশ্ন</Text>
            <Text style={styles.headerSubtitle}>সকল প্রশ্ন এবং তাদের সঠিক উত্তরসমূহ</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="filter" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="প্রশ্ন বা বিষয় খুঁজুন..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              setCurrentPage(1);
              setHasMore(true);
              loadQuestions(1, false);
            }}
          />
        </View>

        {/* Page Info */}
        {totalCount > 0 && (
          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              মোট {totalCount} টি প্রশ্ন {hasMore && '(আরো লোড হচ্ছে...)'}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.expandButton]}
          onPress={expandAll}
        >
          <Icon name="expand-outline" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>সব খুলুন</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.collapseButton]}
          onPress={collapseAll}
        >
          <Icon name="contract-outline" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>সব বন্ধ করুন</Text>
        </TouchableOpacity>
      </View>

      {/* Questions List with Infinite Scroll */}
      <FlatList
        data={displayedQuestions}
        renderItem={renderQuestionItem}
        keyExtractor={(item: Question) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreQuestions}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ফিল্টার</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Subject Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>বিষয়</Text>
                {totalSubjects > 0 && (
                  <Text style={styles.subjectsCount}>
                    মোট {totalSubjects} বিষয়
                  </Text>
                )}
              </View>
              
              {categoriesLoading && availableSubjects.length === 0 ? (
                <View style={styles.loadingSubjects}>
                  <ActivityIndicator size="small" color="#dc2626" />
                  <Text style={styles.loadingSubjectsText}>বিষয়সমূহ লোড হচ্ছে...</Text>
                </View>
              ) : (
                <View>
                  {/* All Subjects Option */}
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filterSubject === 'all' && styles.activeFilterOption
                    ]}
                    onPress={() => setFilterSubject('all')}
                  >
                    <Text style={styles.filterOptionText}>সব বিষয়</Text>
                  </TouchableOpacity>

                  {/* Subjects List with Infinite Scroll */}
                  <FlatList
                    data={availableSubjects}
                    renderItem={renderSubjectItem}
                    keyExtractor={(item: Subject) => item.id.toString()}
                    scrollEnabled={false} // Since it's inside a ScrollView
                    onEndReached={loadMoreSubjectsHandler}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderSubjectsFooter}
                    ListEmptyComponent={
                      !categoriesLoading ? (
                        <View style={styles.noSubjects}>
                          <Text style={styles.noSubjectsText}>কোন বিষয় পাওয়া যায়নি</Text>
                        </View>
                      ) : null
                    }
                  />
                </View>
              )}
            </View>

            {/* Difficulty Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>কঠিনতা</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterDifficulty === 'all' && styles.activeFilterOption
                  ]}
                  onPress={() => setFilterDifficulty('all')}
                >
                  <Text style={styles.filterOptionText}>সব স্তর</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterDifficulty === 'easy' && styles.activeFilterOption
                  ]}
                  onPress={() => setFilterDifficulty('easy')}
                >
                  <Text style={styles.filterOptionText}>সহজ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterDifficulty === 'medium' && styles.activeFilterOption
                  ]}
                  onPress={() => setFilterDifficulty('medium')}
                >
                  <Text style={styles.filterOptionText}>মধ্যম</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterDifficulty === 'hard' && styles.activeFilterOption
                  ]}
                  onPress={() => setFilterDifficulty('hard')}
                >
                  <Text style={styles.filterOptionText}>কঠিন</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={handleFilterApply}
              >
                <Text style={styles.applyFilterButtonText}>ফিল্টার প্রয়োগ করুন</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearAllButtonText}>সব ফিল্টার সরান</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  authIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  authMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'NotoSansBengali',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessage: {
    color: '#6b7280',
    marginBottom: 24,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    lineHeight: 20,
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'NotoSansBengali',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
    lineHeight: 20,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginLeft: 12,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
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
  actionBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  expandButton: {
    backgroundColor: '#059669',
  },
  collapseButton: {
    backgroundColor: '#4b5563',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    marginBottom: 16,
  },
  questionHeader: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionHeaderContent: {
    flex: 1,
  },
  questionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  defaultBadge: {
    backgroundColor: '#f3f4f6',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  typeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  marksText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
  },
  questionText: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
    fontFamily: 'NotoSansBengali',
    lineHeight: 24,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
  },
  expandIcon: {
    marginLeft: 12,
    marginTop: 4,
  },
  questionDetails: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  optionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    fontFamily: 'NotoSansBengali',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incorrectOption: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  correctIndicator: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  incorrectIndicator: {
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'NotoSansBengali',
    lineHeight: 20,
  },
  correctOptionText: {
    color: '#065f46',
  },
  incorrectOptionText: {
    color: '#374151',
  },
  correctBadge: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10b981',
    borderRadius: 12,
  },
  correctBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
  },
  explanationSection: {
    marginBottom: 20,
  },
  explanationBox: {
    padding: 16,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
  },
  explanationText: {
    color: '#1e40af',
    fontSize: 15,
    fontFamily: 'NotoSansBengali',
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    alignItems: 'flex-start',
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'NotoSansBengali',
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  emptyStateMessage: {
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
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
  // New styles for subject pagination
  subjectsFooterLoader: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  subjectsFooterText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'NotoSansBengali',
  },
  statsContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTotal: {
    color: '#3b82f6',
  },
  statEasy: {
    color: '#10b981',
  },
  statMedium: {
    color: '#f59e0b',
  },
  statHard: {
    color: '#ef4444',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'NotoSansBengali',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'NotoSansBengali',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    fontFamily: 'NotoSansBengali',
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  activeFilterOption: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  filterOptionText: {
    fontWeight: '500',
    color: '#374151',
    fontSize: 16,
    fontFamily: 'NotoSansBengali',
  },
  modalActions: {
    gap: 12,
    marginTop: 24,
  },
  applyFilterButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
  },
  applyFilterButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  clearAllButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 16,
    borderRadius: 12,
  },
  clearAllButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
  // New styles for subject loading
  loadingSubjects: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  loadingSubjectsText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
  },
  noSubjects: {
    padding: 16,
    alignItems: 'center',
  },
  noSubjectsText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'NotoSansBengali',
    textAlign: 'center',
  },
});

export default QuestionsScreen;