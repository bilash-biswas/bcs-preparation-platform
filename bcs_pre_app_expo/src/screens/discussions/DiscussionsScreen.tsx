// src/screens/discussions/DiscussionsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Discussion } from '../../types';
import { useAppTheme } from '../../context/ThemeContext';
import { MathDisplay } from '../../components/math-equation/MathDisplay';

const DiscussionsScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplyEmpty, setIsReplyEmpty] = useState(true);
  const replyTextRef = useRef('');
  const inputRef = useRef<any>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionComment, setNewDiscussionComment] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'bookmarks'>('all');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const { isDark } = useAppTheme();
  
  const dispatch = useDispatch<AppDispatch>();
  const discussionState = useSelector((state: RootState) => state.discussion);
  
  const extractDiscussionsArray = (data: any): Discussion[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results;
    if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
    return [];
  };

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
    }
  };

  const onRefresh = () => {
    loadDiscussions();
  };

  const handleCreateDiscussion = async () => {
    Keyboard.dismiss();
    if (!newDiscussionTitle.trim() || !newDiscussionComment.trim()) {
      Alert.alert('ত্রুটি', 'শিরোনাম এবং বর্ণনা পূরণ করুন');
      return;
    }

    try {
      setCreatingPost(true);
      await dispatch(createDiscussion({
        title: newDiscussionTitle.trim(),
        comment: newDiscussionComment.trim(),
      })).unwrap();
      
      setIsCreateModalOpen(false);
      setNewDiscussionTitle('');
      setNewDiscussionComment('');
      Alert.alert('সফল', 'আলোচনা সফলভাবে তৈরি হয়েছে');
      loadDiscussions();
    } catch (err: any) {
      Alert.alert('ত্রুটি', 'আলোচনা তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async (discussionId: number) => {
    try {
      await dispatch(likeDiscussion(discussionId)).unwrap();
    } catch (err: any) {
      Alert.alert('ত্রুটি', 'লাইক করতে সমস্যা হয়েছে');
    }
  };

  const handleDislike = async (discussionId: number) => {
    try {
      await dispatch(dislikeDiscussion(discussionId)).unwrap();
    } catch (err: any) {
      Alert.alert('ত্রুটি', 'ডিসলাইক করতে সমস্যা হয়েছে');
    }
  };

  const handleBookmark = async (discussionId: number) => {
    try {
      await dispatch(bookmarkDiscussion(discussionId)).unwrap();
    } catch (err: any) {
      Alert.alert('ত্রুটি', 'বুকমার্ক করতে সমস্যা হয়েছে');
    }
  };

  const handleReplySubmit = async (discussionId: number) => {
    Keyboard.dismiss();
    const text = replyTextRef.current.trim();
    if (!text) return;

    try {
      setSubmittingReply(true);
      await dispatch(addReply({
        parentId: discussionId,
        comment: text,
      })).unwrap();
      
      replyTextRef.current = '';
      setIsReplyEmpty(true);
      inputRef.current?.clear();
    } catch (err: any) {
      Alert.alert('ত্রুটি', 'উত্তর পোস্ট করতে সমস্যা হয়েছে');
    } finally {
      setSubmittingReply(false);
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
    } catch (err) {
      Clipboard.setString(`https://yourapp.com/discussions/${discussion.id}`);
      Alert.alert('সফল', 'লিঙ্ক কপি করা হয়েছে');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'কিছুক্ষণ আগে';
      if (diffInHours < 24) return `${diffInHours} ঘণ্টা আগে`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} দিন আগে`;
      return date.toLocaleDateString('bn-BD');
    } catch {
      return 'সময় অজানা';
    }
  };

  const getCurrentDiscussionsList = (): Discussion[] => {
    switch (activeTab) {
      case 'all': return discussions;
      case 'popular': return popularDiscussions;
      case 'bookmarks': return bookmarkedDiscussions;
    }
  };

  const currentList = getCurrentDiscussionsList();

  useEffect(() => {
    if (selectedDiscussion) {
      const updated = currentList.find(d => d.id === selectedDiscussion.id);
      if (updated) {
        setSelectedDiscussion(updated);
      }
    }
  }, [currentList]);

  const filteredDiscussions = currentList.filter((discussion) => {
    if (!discussion || typeof discussion !== 'object') return false;
    return (
      (discussion.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (discussion.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  });

  const renderCommentContent = (text: string, isPreview = false) => {
    if (text.includes('\\(') || text.includes('\\)') || text.includes('\\[') || text.includes('\\]') || text.includes('$')) {
      return <MathDisplay content={text} />;
    }
    return (
      <Text 
        numberOfLines={isPreview ? 3 : undefined}
        className="text-slate-600 dark:text-slate-400 font-bengali text-sm leading-6 mt-1"
      >
        {text}
      </Text>
    );
  };

  // Compact Discussion Card in Feed
  const DiscussionCard = ({ discussion }: { discussion: Discussion }) => (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5  mb-4.5">
      {/* Clickable content area */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setSelectedDiscussion(discussion)}
      >
        {/* Header Info */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-2xl bg-primary-50 dark:bg-primary-950/40 items-center justify-center mr-3 border border-primary-200/10">
              <Text className="text-primary-600 dark:text-primary-400 font-extrabold text-sm">
                {discussion.user_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-black text-slate-800 dark:text-slate-200 font-bengali">
                {discussion.user_name || 'অজানা ব্যবহারকারী'}
              </Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
                {formatTimeAgo(discussion.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Discussion Title */}
        <View className="mb-2">
          <Text className="text-sm font-black text-slate-800 dark:text-slate-100 font-bengali">
            {discussion.title || 'শিরোনাম নেই'}
          </Text>
        </View>

        {/* Discussion Text Preview */}
        <View className="mb-4">
          {renderCommentContent(discussion.comment || 'কোন বর্ণনা নেই', true)}
        </View>
      </TouchableOpacity>

      {/* Actions Strip (Outside clickable area) */}
      <View className="flex-row items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3.5 mt-1">
        <View className="flex-row items-center gap-4">
          {/* Like */}
          <TouchableOpacity
            onPress={() => handleLike(discussion.id)}
            className="flex-row items-center gap-1.5"
            activeOpacity={0.7}
          >
            <Icon 
              name={discussion.is_liked ? "thumb-up" : "thumb-up-outline"} 
              size={15} 
              color={discussion.is_liked ? "#7c3aed" : "#94a3b8"} 
            />
            <Text className={`text-[10px] font-extrabold ${
              discussion.is_liked ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
            }`}>
              {discussion.likes_count || 0}
            </Text>
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity
            onPress={() => handleDislike(discussion.id)}
            className="flex-row items-center gap-1.5"
            activeOpacity={0.7}
          >
            <Icon 
              name={discussion.is_disliked ? "thumb-down" : "thumb-down-outline"} 
              size={15} 
              color={discussion.is_disliked ? "#ef4444" : "#94a3b8"} 
            />
            <Text className={`text-[10px] font-extrabold ${
              discussion.is_disliked ? 'text-red-500' : 'text-slate-400'
            }`}>
              {discussion.dislikes_count || 0}
            </Text>
          </TouchableOpacity>

          {/* Comments count / Clickable details trigger */}
          <TouchableOpacity
            onPress={() => setSelectedDiscussion(discussion)}
            className="flex-row items-center gap-1.5"
            activeOpacity={0.7}
          >
            <Icon name="comment-outline" size={15} color="#94a3b8" />
            <Text className="text-[10px] font-extrabold text-slate-400">
              {discussion.reply_count || 0} উত্তর
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Bookmark */}
          <TouchableOpacity
            onPress={() => handleBookmark(discussion.id)}
            className="p-1"
            activeOpacity={0.7}
          >
            <Icon 
              name={discussion.is_bookmarked ? "bookmark" : "bookmark-outline"} 
              size={16} 
              color={discussion.is_bookmarked ? "#eab308" : "#94a3b8"} 
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={() => shareDiscussion(discussion)}
            className="p-1"
            activeOpacity={0.7}
          >
            <Icon name="share-variant-outline" size={15} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const totalReplies = discussions.reduce((sum, disc) => sum + (disc.reply_count || 0), 0);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 pt-14 pb-5 px-6 border-b border-slate-100 dark:border-slate-800 rounded-b-[36px] ">
        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 font-bengali text-center">
          আলোচনা ফোরাম
        </Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1 leading-5 font-bengali">
          প্রশ্ন নিয়ে আলোচনা করুন, উত্তর খুঁজুন এবং অন্য শিক্ষার্থীদের সাহায্য করুন
        </Text>

        {/* Tab Buttons Row (Clean Inline Styles) */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#020617' : '#f8fafc',
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            borderRadius: 16,
            padding: 4,
            marginTop: 20,
            alignSelf: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: activeTab === 'all' ? (isDark ? '#8b5cf6' : '#7c3aed') : 'transparent',
              shadowColor: activeTab === 'all' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'all' ? 0.15 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'all' ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSansBengali',
                fontWeight: activeTab === 'all' ? '900' : 'bold',
                fontSize: 11,
                color: activeTab === 'all' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              সব আলোচনা
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('popular')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: activeTab === 'popular' ? (isDark ? '#8b5cf6' : '#7c3aed') : 'transparent',
              shadowColor: activeTab === 'popular' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'popular' ? 0.15 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'popular' ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSansBengali',
                fontWeight: activeTab === 'popular' ? '900' : 'bold',
                fontSize: 11,
                color: activeTab === 'popular' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              জনপ্রিয়
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('bookmarks')}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: activeTab === 'bookmarks' ? (isDark ? '#8b5cf6' : '#7c3aed') : 'transparent',
              shadowColor: activeTab === 'bookmarks' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'bookmarks' ? 0.15 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'bookmarks' ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSansBengali',
                fontWeight: activeTab === 'bookmarks' ? '900' : 'bold',
                fontSize: 11,
                color: activeTab === 'bookmarks' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              বুকমার্ক
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={['#7c3aed']}
            tintColor="#7c3aed"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 }}
      >
        {/* Search bar */}
        <View className="mb-5 flex-row items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-0.5">
          <Icon name="magnify" size={20} color="#94a3b8" className="mr-2" />
          <TextInput
            placeholder="আলোচনা বা প্রশ্ন খুঁজুন..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 text-slate-800 dark:text-slate-100 text-xs font-bengali py-3.5"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} className="p-1">
              <Icon name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 mb-5 flex-row items-center gap-2">
            <Icon name="alert-circle-outline" size={18} color="#ef4444" />
            <Text className="text-red-700 dark:text-red-400 font-bengali text-xs flex-1">{error}</Text>
          </View>
        )}

        {/* Discussions List */}
        {isLoading && filteredDiscussions.length === 0 ? (
          // Skeleton loader
          [...Array(3)].map((_, idx) => (
            <View key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 mb-4.5 ">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-3" />
                <View className="gap-1 flex-1">
                  <View className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                </View>
              </View>
              <View className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-3" />
              <View className="h-12 bg-slate-50 dark:bg-slate-950 rounded-xl mb-4" />
              <View className="flex-row justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-1">
                <View className="flex-row gap-4">
                  <View className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-10" />
                  <View className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-10" />
                </View>
                <View className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-6" />
              </View>
            </View>
          ))
        ) : filteredDiscussions.length > 0 ? (
          filteredDiscussions.map((disc, idx) => (
            <DiscussionCard key={disc.id || idx} discussion={disc} />
          ))
        ) : (
          <View className="items-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 ">
            <Icon name="message-text-outline" size={48} color="#94a3b8" />
            <Text className="text-base font-black text-slate-800 dark:text-slate-200 mb-2 font-bengali text-center mt-4">
              {searchTerm
                ? "কোন আলোচনা পাওয়া যায়নি"
                : activeTab === 'bookmarks'
                ? "কোন বুকমার্ক করা আলোচনা নেই"
                : "এখনও কোন আলোচনা শুরু হয়নি"}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-center text-xs mb-6 font-bengali leading-5">
              {searchTerm
                ? "আপনার সার্চ ক্রাইটেরিয়া মেলে এমন কোন আলোচনা নেই"
                : activeTab === 'bookmarks'
                ? "আপনি এখনও কোন আলোচনা বুকমার্ক করেননি"
                : "প্রথম আলোচনা শুরু করুন এবং কমিউনিটির সাথে জ্ঞান বিনিময় করুন!"}
            </Text>
            {activeTab !== 'bookmarks' && (
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(true)}
                className="bg-primary-600 dark:bg-primary-500 rounded-2xl px-6 py-3.5 "
              >
                <Text className="text-white font-bold font-bengali text-sm">
                  আলোচনা শুরু করুন
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Info Summary Stats */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 items-center ">
            <View className="w-9 h-9 bg-primary-100 dark:bg-primary-950 rounded-xl items-center justify-center mb-2">
              <Icon name="comment-question-outline" size={18} color="#7c3aed" />
            </View>
            <Text className="text-base font-black text-slate-800 dark:text-slate-100">
              {discussions.length}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-[9px] font-bengali mt-0.5">মোট আলোচনা</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 items-center ">
            <View className="w-9 h-9 bg-teal-100 dark:bg-teal-950 rounded-xl items-center justify-center mb-2">
              <Icon name="forum-outline" size={18} color="#0d9488" />
            </View>
            <Text className="text-base font-black text-slate-800 dark:text-slate-100">
              {totalReplies}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-[9px] font-bengali mt-0.5">মোট উত্তর</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsCreateModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 dark:bg-primary-500 rounded-full items-center justify-center  z-30 active:opacity-95"
      >
        <Icon name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Detailed Thread View (Absolute Overlay to prevent Native Modal navigation context bugs) */}
      {selectedDiscussion !== null && (
        <View 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, paddingTop: insets.top, paddingBottom: insets.bottom }}
          className="bg-slate-50 dark:bg-slate-950"
        >
          {/* Header */}
          <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex-row items-center justify-between ">
            <TouchableOpacity 
              onPress={() => setSelectedDiscussion(null)} 
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200"
            >
              <Icon name="arrow-left" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>
            <Text className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-bengali flex-1 ml-4" numberOfLines={1}>
              {selectedDiscussion?.title || 'বিস্তারিত আলোচনা'}
            </Text>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            className="flex-1"
          >
            {selectedDiscussion ? (
              <ScrollView 
                className="flex-1 p-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Original Discussion Card */}
                <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5  mb-6">
                  {/* Creator Info */}
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 items-center justify-center mr-3 border border-primary-200/10">
                      <Text className="text-primary-700 dark:text-primary-400 font-black text-sm">
                        {selectedDiscussion.user_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs font-black text-slate-800 dark:text-slate-100 font-bengali">
                        {selectedDiscussion.user_name || 'অজানা ব্যবহারকারী'}
                      </Text>
                      <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali mt-0.5">
                        {formatTimeAgo(selectedDiscussion.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Body */}
                  <Text className="text-base font-black text-slate-900 dark:text-slate-100 font-bengali mb-3">
                    {selectedDiscussion.title}
                  </Text>
                  <View className="mb-4">
                    {renderCommentContent(selectedDiscussion.comment)}
                  </View>

                  {/* Actions Bar */}
                  <View className="flex-row items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4 mt-2">
                    <View className="flex-row items-center gap-4">
                      {/* Like */}
                      <TouchableOpacity
                        onPress={() => handleLike(selectedDiscussion.id)}
                        className="flex-row items-center gap-1.5"
                      >
                        <Icon 
                          name={selectedDiscussion.is_liked ? "thumb-up" : "thumb-up-outline"} 
                          size={16} 
                          color={selectedDiscussion.is_liked ? "#7c3aed" : "#94a3b8"} 
                        />
                        <Text className={`text-xs font-extrabold ${
                          selectedDiscussion.is_liked ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                        }`}>
                          {selectedDiscussion.likes_count || 0}
                        </Text>
                      </TouchableOpacity>

                      {/* Dislike */}
                      <TouchableOpacity
                        onPress={() => handleDislike(selectedDiscussion.id)}
                        className="flex-row items-center gap-1.5"
                      >
                        <Icon 
                          name={selectedDiscussion.is_disliked ? "thumb-down" : "thumb-down-outline"} 
                          size={16} 
                          color={selectedDiscussion.is_disliked ? "#ef4444" : "#94a3b8"} 
                        />
                        <Text className={`text-xs font-extrabold ${
                          selectedDiscussion.is_disliked ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {selectedDiscussion.dislikes_count || 0}
                        </Text>
                      </TouchableOpacity>

                      {/* Bookmarked */}
                      <TouchableOpacity
                        onPress={() => handleBookmark(selectedDiscussion.id)}
                        className="flex-row items-center gap-1.5"
                      >
                        <Icon 
                          name={selectedDiscussion.is_bookmarked ? "bookmark" : "bookmark-outline"} 
                          size={16} 
                          color={selectedDiscussion.is_bookmarked ? "#eab308" : "#94a3b8"} 
                        />
                        <Text className={`text-xs font-extrabold ${
                          selectedDiscussion.is_bookmarked ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          বুকমার্ক
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Share */}
                    <TouchableOpacity
                      onPress={() => shareDiscussion(selectedDiscussion)}
                      className="p-1"
                    >
                      <Icon name="share-variant-outline" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section Title */}
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3.5 font-bengali uppercase tracking-wider pl-1">
                  💬 উত্তরসমূহ ({selectedDiscussion.replies?.length || 0})
                </Text>

                {/* Replies Scroll List */}
                {selectedDiscussion.replies && selectedDiscussion.replies.length > 0 ? (
                  <View className="gap-3">
                    {selectedDiscussion.replies.map((reply, index) => (
                      <View
                        key={reply.id}
                        className="flex-row items-stretch mb-5"
                      >
                        {/* Left Avatar Column with Thread Line */}
                        <View className="items-center mr-3.5">
                          <View className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/40 items-center justify-center border border-primary-200/10">
                            <Text className="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase">
                              {reply.user_name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                          </View>
                          {/* Render vertical connector thread line for all but the last item */}
                          {index < selectedDiscussion.replies.length - 1 && (
                            <View className="w-[1.5px] bg-slate-100 dark:bg-slate-800 flex-1 my-1.5" />
                          )}
                        </View>

                        {/* Reply Bubble */}
                        <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl rounded-tl-none p-4.5">
                          {/* Author Info header */}
                          <View className="flex-row items-center justify-between mb-2.5">
                            <Text className="text-xs font-black text-slate-800 dark:text-slate-100 font-bengali">
                              {reply.user_name || 'অজানা ব্যবহারকারী'}
                            </Text>
                            <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-bengali">
                              {formatTimeAgo(reply.created_at)}
                            </Text>
                          </View>
                          {/* Comment Content */}
                          <View className="pr-1.5 leading-5 text-slate-700 dark:text-slate-300">
                            {renderCommentContent(reply.comment || 'কোন মন্তব্য নেই')}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 ">
                    <Icon name="comment-alert-outline" size={32} color="#cbd5e1" className="mb-2" />
                    <Text className="text-xs text-slate-400 dark:text-slate-500 font-bengali text-center leading-5">
                      এখনও কোন উত্তর দেওয়া হয়নি। আপনার মূল্যবান উত্তরটি প্রথম শেয়ার করুন!
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#7c3aed" />
              </View>
            )}

            {/* Bottom Sticky Reply Input Box */}
            {selectedDiscussion && (
              <View className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex-row items-center ">
                <TextInput
                  ref={inputRef}
                  defaultValue=""
                  onChangeText={(text) => {
                    replyTextRef.current = text;
                    const empty = text.trim() === '';
                    if (empty !== isReplyEmpty) {
                      setIsReplyEmpty(empty);
                    }
                  }}
                  placeholder="আপনার উত্তর লিখুন..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={1}
                  className="flex-1 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bengali text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950"
                  style={{ maxHeight: 80 }}
                />
                <TouchableOpacity
                  onPress={() => handleReplySubmit(selectedDiscussion.id)}
                  disabled={isReplyEmpty || submittingReply}
                  className={`w-11 h-11 rounded-2xl items-center justify-center ml-3.5 ${
                    !isReplyEmpty && !submittingReply
                      ? 'bg-primary-600 dark:bg-primary-500 '
                      : 'bg-slate-100 dark:bg-slate-800 opacity-60'
                  }`}
                >
                  {submittingReply ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Icon name="send" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Create Discussion View (Absolute Overlay to prevent Native Modal navigation context bugs) */}
      {isCreateModalOpen && (
        <View 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, paddingTop: insets.top, paddingBottom: insets.bottom }}
          className="bg-slate-50 dark:bg-slate-950"
        >
          <StatusBar backgroundColor={isDark ? "#020617" : "#ffffff"} barStyle={isDark ? "light-content" : "dark-content"} />
          
          <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex-row justify-between items-center ">
            <Text className="text-base font-black text-slate-800 dark:text-slate-100 font-bengali">
              নতুন আলোচনা ফোরাম
            </Text>
            <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200">
              <Icon name="close" size={18} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1 p-6"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 pl-1 font-bengali">আলোচনার শিরোনাম</Text>
            <TextInput
              value={newDiscussionTitle}
              onChangeText={setNewDiscussionTitle}
              placeholder="কি বিষয় নিয়ে আলোচনা করতে চান?"
              placeholderTextColor="#9CA3AF"
              className="border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bengali text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 mb-5 "
            />

            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 pl-1 font-bengali">বিস্তারিত বর্ণনা</Text>
            <TextInput
              value={newDiscussionComment}
              onChangeText={setNewDiscussionComment}
              placeholder="আপনার আলোচনা বা প্রশ্নের বিস্তারিত বিবরণ লিখুন..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              className="border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bengali text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 mb-8 h-36 "
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleCreateDiscussion}
              disabled={!newDiscussionTitle.trim() || !newDiscussionComment.trim() || creatingPost}
              className={`py-4 rounded-2xl items-center justify-center  ${
                (newDiscussionTitle.trim() && newDiscussionComment.trim() && !creatingPost) 
                  ? 'bg-primary-600 dark:bg-primary-500 active:opacity-95' 
                  : 'bg-slate-200 dark:bg-slate-800 opacity-60'
              }`}
            >
              {creatingPost ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-extrabold text-sm font-bengali">
                  আলোচনা তৈরি করুন
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default DiscussionsScreen;