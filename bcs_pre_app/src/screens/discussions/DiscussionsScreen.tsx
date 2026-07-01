// src/screens/discussions/DiscussionsScreen.tsx - COMPLETELY FIXED VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  Clipboard,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchDiscussions,
  fetchPopularDiscussions,
  fetchBookmarkedDiscussions,
  likeDiscussion,
  dislikeDiscussion,
  bookmarkDiscussion,
  addReply,
  createDiscussion,
} from '../../store/slices/discussionSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Discussion } from '../../types';

const DiscussionsScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionComment, setNewDiscussionComment] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'bookmarks'>('all');
  
  const dispatch = useDispatch<AppDispatch>();
  const discussionState = useSelector((state: RootState) => state.discussion);
  
  // Safe extraction with proper handling of API response structure
  const extractDiscussionsArray = (data: any): Discussion[] => {
    if (!data) return [];
    
    // Handle array response
    if (Array.isArray(data)) {
      return data;
    }
    
    // Handle object with results array (Django REST Framework format)
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Handle object with data array
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
    
    console.warn('Unexpected discussions data format:', data);
    return [];
  };

  // Extract discussions from state with safe defaults
  const discussions = extractDiscussionsArray(discussionState?.discussions) || [];
  const popularDiscussions = extractDiscussionsArray(discussionState?.popularDiscussions) || [];
  const bookmarkedDiscussions = extractDiscussionsArray(discussionState?.bookmarkedDiscussions) || [];
  const isLoading = discussionState?.isLoading || false;
  const error = discussionState?.error || null;

  useEffect(() => {
    loadDiscussions();
  }, [activeTab]);

  const loadDiscussions = () => {
    switch (activeTab) {
      case 'all':
        dispatch(fetchDiscussions());
        break;
      case 'popular':
        dispatch(fetchPopularDiscussions());
        break;
      case 'bookmarks':
        dispatch(fetchBookmarkedDiscussions());
        break;
      default:
        dispatch(fetchDiscussions());
    }
  };

  const onRefresh = () => {
    loadDiscussions();
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussionTitle.trim() || !newDiscussionComment.trim()) {
      Alert.alert('ত্রুটি', 'শিরোনাম এবং বর্ণনা পূরণ করুন');
      return;
    }

    try {
      await dispatch(createDiscussion({
        title: newDiscussionTitle,
        comment: newDiscussionComment,
      })).unwrap();
      
      setIsCreateModalOpen(false);
      setNewDiscussionTitle('');
      setNewDiscussionComment('');
      Alert.alert('সফল', 'আলোচনা সফলভাবে তৈরি হয়েছে');
      loadDiscussions();
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'আলোচনা তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const handleLike = async (discussionId: number) => {
    try {
      await dispatch(likeDiscussion(discussionId)).unwrap();
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'লাইক করতে সমস্যা হয়েছে');
    }
  };

  const handleDislike = async (discussionId: number) => {
    try {
      await dispatch(dislikeDiscussion(discussionId)).unwrap();
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'ডিসলাইক করতে সমস্যা হয়েছে');
    }
  };

  const handleBookmark = async (discussionId: number) => {
    try {
      await dispatch(bookmarkDiscussion(discussionId)).unwrap();
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'বুকমার্ক করতে সমস্যা হয়েছে');
    }
  };

  const handleReply = async (discussionId: number) => {
    if (!replyText.trim()) {
      Alert.alert('ত্রুটি', 'উত্তর লিখুন');
      return;
    }

    try {
      await dispatch(addReply({
        parentId: discussionId,
        comment: replyText,
      })).unwrap();
      
      setReplyText('');
      setShowReplyForm(null);
      Alert.alert('সফল', 'উত্তর সফলভাবে পোস্ট হয়েছে');
    } catch (error: any) {
      Alert.alert('ত্রুটি', 'উত্তর পোস্ট করতে সমস্যা হয়েছে');
    }
  };

  const shareDiscussion = async (discussion: Discussion) => {
    try {
      const shareUrl = `https://yourapp.com/discussions/${discussion.id}`;
      const shareText = `এই আলোচনাটি দেখুন: ${discussion.title}`;

      await Share.share({
        message: `${shareText}\n\n${shareUrl}`,
        title: 'আলোচনা ফোরাম',
      });
    } catch (error) {
      // Fallback: Copy to clipboard
      Clipboard.setString(`https://yourapp.com/discussions/${discussion.id}`);
      Alert.alert('সফল', 'লিঙ্ক কপি করা হয়েছে');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return 'কিছুক্ষণ আগে';
      if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} দিন আগে`;
      return date.toLocaleDateString('bn-BD');
    } catch {
      return 'সময় অজানা';
    }
  };

  // SAFE: Always return an array
  const getCurrentDiscussions = (): Discussion[] => {
    switch (activeTab) {
      case 'all': 
        return discussions;
      case 'popular': 
        return popularDiscussions;
      case 'bookmarks': 
        return bookmarkedDiscussions;
      default: 
        return discussions;
    }
  };

  // SAFE: Filter with array check
  const filteredDiscussions = (() => {
    const currentDiscussions = getCurrentDiscussions();
    return currentDiscussions.filter((discussion) => {
      if (!discussion || typeof discussion !== 'object') return false;

      const matchesSearch =
        (discussion.comment?.toLowerCase() || '').includes(
          searchTerm.toLowerCase()
        ) ||
        (discussion.title?.toLowerCase() || '').includes(
          searchTerm.toLowerCase()
        );

      return matchesSearch;
    });
  })();

  const DiscussionCard = ({ discussion, index }: { discussion: Discussion; index: number }) => (
    <View style={styles.discussionCard}>
      {/* Discussion Header */}
      <View style={styles.discussionHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {discussion.user_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {discussion.user_name || 'অজানা ব্যবহারকারী'}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimeAgo(discussion.created_at)}
            </Text>
          </View>
        </View>
      </View>

      {/* Discussion Title */}
      <View style={styles.titleContainer}>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>
            {discussion.title || 'শিরোনাম নেই'}
          </Text>
        </View>
      </View>

      {/* Discussion Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.commentText}>
          {discussion.comment || 'কোন বর্ণনা নেই'}
        </Text>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            {/* Like Button */}
            <TouchableOpacity
              onPress={() => handleLike(discussion.id)}
              style={[
                styles.actionButton,
                discussion.is_liked ? styles.likedButton : styles.defaultButton
              ]}
            >
              <Icon 
                name={discussion.is_liked ? "thumb-up" : "thumb-up-outline"} 
                size={16} 
                color={discussion.is_liked ? "#3b82f6" : "#6b7280"} 
              />
              <Text style={[
                styles.actionText,
                discussion.is_liked ? styles.likedText : styles.defaultText
              ]}>
                {discussion.likes_count || 0}
              </Text>
            </TouchableOpacity>

            {/* Dislike Button */}
            <TouchableOpacity
              onPress={() => handleDislike(discussion.id)}
              style={[
                styles.actionButton,
                discussion.is_disliked ? styles.dislikedButton : styles.defaultButton
              ]}
            >
              <Icon 
                name={discussion.is_disliked ? "thumb-down" : "thumb-down-outline"} 
                size={16} 
                color={discussion.is_disliked ? "#ef4444" : "#6b7280"} 
              />
              <Text style={[
                styles.actionText,
                discussion.is_disliked ? styles.dislikedText : styles.defaultText
              ]}>
                {discussion.dislikes_count || 0}
              </Text>
            </TouchableOpacity>

            {/* Reply Button */}
            <TouchableOpacity
              onPress={() => setShowReplyForm(showReplyForm === discussion.id ? null : discussion.id)}
              style={styles.actionButton}
            >
              <Icon name="comment-outline" size={16} color="#6b7280" />
              <Text style={styles.actionText}>
                {discussion.reply_count || 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightActions}>
            {/* Bookmark Button */}
            <TouchableOpacity
              onPress={() => handleBookmark(discussion.id)}
              style={[
                styles.iconButton,
                discussion.is_bookmarked ? styles.bookmarkedButton : styles.defaultIconButton
              ]}
            >
              <Icon 
                name={discussion.is_bookmarked ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={discussion.is_bookmarked ? "#f59e0b" : "#6b7280"} 
              />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={() => shareDiscussion(discussion)}
              style={styles.iconButton}
            >
              <Icon name="share-variant" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reply Form */}
        {showReplyForm === discussion.id && (
          <View style={styles.replyForm}>
            <View style={styles.replyInputContainer}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="আপনার উত্তর লিখুন..."
                multiline
                numberOfLines={3}
                style={styles.replyInput}
                textAlignVertical="top"
              />
              <TouchableOpacity
                onPress={() => handleReply(discussion.id)}
                disabled={!replyText.trim()}
                style={[
                  styles.sendButton,
                  !replyText.trim() && styles.sendButtonDisabled
                ]}
              >
                <Icon name="send" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Replies */}
        {discussion.replies && discussion.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {discussion.replies.map((reply) => (
              <View
                key={reply.id}
                style={styles.replyCard}
              >
                <View style={styles.replyHeader}>
                  <Icon name="account" size={14} color="#6b7280" />
                  <Text style={styles.replyUser}>
                    {reply.user_name || 'অজানা ব্যবহারকারী'}
                  </Text>
                  <Text style={styles.replyTime}>
                    {formatTimeAgo(reply.created_at)}
                  </Text>
                </View>
                <Text style={styles.replyText}>
                  {reply.comment || 'কোন মন্তব্য নেই'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Calculate statistics safely
  const totalReplies = discussions.reduce((sum, disc) => sum + (disc.reply_count || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="forum" size={20} color="white" />
          </View>
          <Text style={styles.headerTitle}>
            আলোচনা ফোরাম
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          প্রশ্ন নিয়ে আলোচনা করুন, উত্তর খুঁজুন এবং অন্য শিক্ষার্থীদের সাহায্য করুন
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[
              styles.tabButton,
              activeTab === 'all' ? styles.activeTab : styles.inactiveTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'all' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              সব আলোচনা
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('popular')}
            style={[
              styles.tabButton,
              activeTab === 'popular' ? styles.activeTab : styles.inactiveTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'popular' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              জনপ্রিয়
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('bookmarks')}
            style={[
              styles.tabButton,
              activeTab === 'bookmarks' ? styles.activeTab : styles.inactiveTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'bookmarks' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              বুকমার্ক
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search and Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Icon name="magnify" size={20} color="#6b7280" />
              <TextInput
                placeholder="আলোচনা বা প্রশ্ন খুঁজুন..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorContent}>
                <Icon name="alert-circle" size={20} color="#f59e0b" />
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            </View>
          )}

          {/* Discussions List */}
          {isLoading && filteredDiscussions.length === 0 ? (
            // Loading Skeleton
            [...Array(3)].map((_, index) => (
              <View key={index} style={styles.loadingSkeleton}>
                <View style={styles.skeletonContent}>
                  <View style={styles.skeletonAvatar}></View>
                  <View style={styles.skeletonTexts}>
                    <View style={styles.skeletonLine1}></View>
                    <View style={styles.skeletonLine2}></View>
                    <View style={styles.skeletonLine3}></View>
                    <View style={styles.skeletonActions}>
                      <View style={styles.skeletonAction}></View>
                      <View style={styles.skeletonAction}></View>
                      <View style={styles.skeletonAction}></View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : filteredDiscussions.length > 0 ? (
            filteredDiscussions.map((discussion, index) => (
              <DiscussionCard key={discussion.id || index} discussion={discussion} index={index} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="forum-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>
                {searchTerm
                  ? "কোন আলোচনা পাওয়া যায়নি"
                  : activeTab === 'bookmarks'
                  ? "কোন বুকমার্ক করা আলোচনা নেই"
                  : "এখনও কোন আলোচনা শুরু হয়নি"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "আপনার সার্চ ক্রাইটেরিয়া মেলে এমন কোন আলোচনা নেই"
                  : activeTab === 'bookmarks'
                  ? "আপনি এখনও কোন আলোচনা বুকমার্ক করেননি"
                  : "প্রথম আলোচনা শুরু করুন এবং কমিউনিটির সাথে জ্ঞান বিনিময় করুন!"}
              </Text>
              {activeTab !== 'bookmarks' && (
                <TouchableOpacity
                  onPress={() => setIsCreateModalOpen(true)}
                  style={styles.createButton}
                >
                  <Text style={styles.createButtonText}>
                    প্রথম আলোচনা শুরু করুন
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <Icon name="forum" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statNumber}>
                {discussions.length}
              </Text>
              <Text style={styles.statLabel}>মোট আলোচনা</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                <Icon name="comment-multiple" size={20} color="#10b981" />
              </View>
              <Text style={styles.statNumber}>
                {totalReplies}
              </Text>
              <Text style={styles.statLabel}>মোট উত্তর</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsCreateModalOpen(true)}
        style={styles.fab}
      >
        <Icon name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Create Discussion Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              নতুন আলোচনা
            </Text>
            <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>শিরোনাম</Text>
            <TextInput
              value={newDiscussionTitle}
              onChangeText={setNewDiscussionTitle}
              placeholder="আলোচনার শিরোনাম লিখুন..."
              style={styles.textInput}
            />

            <Text style={styles.inputLabel}>বর্ণনা</Text>
            <TextInput
              value={newDiscussionComment}
              onChangeText={setNewDiscussionComment}
              placeholder="আলোচনার বিস্তারিত বর্ণনা লিখুন..."
              multiline
              numberOfLines={6}
              style={[styles.textInput, styles.textArea]}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleCreateDiscussion}
              disabled={!newDiscussionTitle.trim() || !newDiscussionComment.trim()}
              style={[
                styles.submitButton,
                (!newDiscussionTitle.trim() || !newDiscussionComment.trim()) && styles.submitButtonDisabled
              ]}
            >
              <Text style={styles.submitButtonText}>
                আলোচনা তৈরি করুন
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// Styles (keep the same styles as before, but remove debug styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  inactiveTab: {
    backgroundColor: '#f3f4f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  inactiveTabText: {
    color: '#6b7280',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    color: '#92400e',
    flex: 1,
  },
  discussionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  discussionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  contentContainer: {
    padding: 16,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  defaultButton: {
    backgroundColor: '#f3f4f6',
  },
  likedButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  dislikedButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  defaultText: {
    color: '#6b7280',
  },
  likedText: {
    color: '#1d4ed8',
  },
  dislikedText: {
    color: '#dc2626',
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  defaultIconButton: {
    backgroundColor: '#f3f4f6',
  },
  bookmarkedButton: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  replyForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    height: 64,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  repliesContainer: {
    marginTop: 16,
    gap: 8,
  },
  replyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  replyUser: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  replyTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  replyText: {
    fontSize: 13,
    color: '#4b5563',
  },
  loadingSkeleton: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
  },
  skeletonTexts: {
    flex: 1,
    gap: 8,
  },
  skeletonLine1: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '75%',
  },
  skeletonLine2: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    width: '50%',
  },
  skeletonLine3: {
    height: 64,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonAction: {
    height: 32,
    width: 64,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DiscussionsScreen;