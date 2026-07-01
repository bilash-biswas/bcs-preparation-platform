// app/discussions/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import CreateDiscussionModal from "@/components/discussions/create-discussion-modal";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  ThumbsUp,
  ThumbsDown,
  Share,
  Bookmark,
  Send,
  Plus,
  Clock,
  Zap,
  TrendingUp,
  MessageCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  User,
  Heart,
  BookmarkCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface Discussion {
  id: number;
  user: number;
  user_name: string;
  title: string;
  comment: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  bookmarks_count: number;
  reply_count: number;
  is_liked: boolean;
  is_disliked: boolean;
  is_bookmarked: boolean;
  replies?: Discussion[];
  parent: number | null;
  is_active: boolean;
}

const DiscussionsPage: React.FC = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "bookmarks">(
    "all"
  );

  useEffect(() => {
    loadDiscussions();
    loadSubjectsAndCategories();
  }, [activeTab]);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = "/discussions/";
      if (activeTab === "popular") {
        endpoint = "/discussions/popular/";
      } else if (activeTab === "bookmarks") {
        endpoint = "/discussions/bookmarks/";
      }

      const response = await apiClient.get(endpoint);
      console.log("Discussions API response:", response);

      let discussionsData: Discussion[] = [];

      if (Array.isArray(response)) {
        discussionsData = response;
      } else if (response && Array.isArray(response.results)) {
        discussionsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        discussionsData = response.data;
      } else {
        console.warn("Unexpected API response structure");
        discussionsData = [];
      }

      setDiscussions(discussionsData);
    } catch (error) {
      console.error("Error loading discussions:", error);
      setError("আলোচনা লোড করতে সমস্যা হয়েছে");
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = () => {
    setIsCreateModalOpen(true);
  };

  const handleDiscussionCreated = () => {
    loadDiscussions();
    setIsCreateModalOpen(false);
  };

  const loadSubjectsAndCategories = async () => {
    try {
      const [subjectsResponse, categoriesResponse] = await Promise.all([
        apiClient.get("/subjects/"),
        apiClient.get("/categories/"),
      ]);

      setSubjects(
        Array.isArray(subjectsResponse)
          ? subjectsResponse
          : subjectsResponse?.results || subjectsResponse?.data || []
      );
      setCategories(
        Array.isArray(categoriesResponse)
          ? categoriesResponse
          : categoriesResponse?.results || categoriesResponse?.data || []
      );
    } catch (error) {
      console.error("Error loading subjects/categories:", error);
      setSubjects([]);
      setCategories([]);
    }
  };

  const filteredDiscussions = Array.isArray(discussions)
    ? discussions.filter((discussion) => {
        if (!discussion || typeof discussion !== "object") return false;

        const matchesSearch =
          (discussion.comment?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (discussion.title?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          );

        return matchesSearch;
      })
    : [];

  const handleLike = async (discussionId: number) => {
    try {
      const response = await apiClient.post(
        `/discussions/${discussionId}/like/`
      );

      if (response.status === "success") {
        setDiscussions((prevDiscussions) =>
          Array.isArray(prevDiscussions)
            ? prevDiscussions.map((disc) =>
                disc.id === discussionId
                  ? {
                      ...disc,
                      likes_count: response.likes_count,
                      dislikes_count: response.dislikes_count,
                      is_liked: response.liked,
                      is_disliked: false,
                    }
                  : disc
              )
            : prevDiscussions
        );
        toast.success(response.liked ? "লাইক করা হয়েছে" : "লাইক সরানো হয়েছে");
      }
    } catch (error) {
      console.error("Error liking discussion:", error);
      toast.error("লাইক করতে সমস্যা হয়েছে");
    }
  };

  const handleDislike = async (discussionId: number) => {
    try {
      const response = await apiClient.post(
        `/discussions/${discussionId}/dislike/`
      );

      if (response.status === "success") {
        setDiscussions((prevDiscussions) =>
          Array.isArray(prevDiscussions)
            ? prevDiscussions.map((disc) =>
                disc.id === discussionId
                  ? {
                      ...disc,
                      dislikes_count: response.dislikes_count,
                      likes_count: response.likes_count,
                      is_disliked: response.disliked,
                      is_liked: false,
                    }
                  : disc
              )
            : prevDiscussions
        );
        toast.success(
          response.disliked ? "ডিসলাইক করা হয়েছে" : "ডিসলাইক সরানো হয়েছে"
        );
      }
    } catch (error) {
      console.error("Error disliking discussion:", error);
      toast.error("ডিসলাইক করতে সমস্যা হয়েছে");
    }
  };

  const handleBookmark = async (discussionId: number) => {
    try {
      const response = await apiClient.post(
        `/discussions/${discussionId}/bookmark/`
      );

      if (response.status === "success") {
        setDiscussions((prevDiscussions) =>
          Array.isArray(prevDiscussions)
            ? prevDiscussions.map((disc) =>
                disc.id === discussionId
                  ? {
                      ...disc,
                      is_bookmarked: response.bookmarked,
                      bookmarks_count: response.bookmarks_count,
                    }
                  : disc
              )
            : prevDiscussions
        );
        toast.success(
          response.bookmarked ? "বুকমার্ক করা হয়েছে" : "বুকমার্ক সরানো হয়েছে"
        );
      }
    } catch (error) {
      console.error("Error bookmarking discussion:", error);
      toast.error("বুকমার্ক করতে সমস্যা হয়েছে");
    }
  };

  const handleReply = async (discussionId: number) => {
    if (!replyText.trim()) {
      toast.error("উত্তর লিখুন");
      return;
    }

    try {
      const response = await apiClient.post(
        `/discussions/${discussionId}/reply/`,
        {
          comment: replyText,
          title: `Reply to discussion ${discussionId}`,
        }
      );

      if (response.id) {
        setDiscussions((prevDiscussions) =>
          Array.isArray(prevDiscussions)
            ? prevDiscussions.map((disc) =>
                disc.id === discussionId
                  ? {
                      ...disc,
                      reply_count: (disc.reply_count || 0) + 1,
                      replies: [...(disc.replies || []), response],
                    }
                  : disc
              )
            : prevDiscussions
        );

        setReplyText("");
        setShowReplyForm(null);
        toast.success("উত্তর সফলভাবে পোস্ট হয়েছে");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("উত্তর পোস্ট করতে সমস্যা হয়েছে");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return "কিছুক্ষণ আগে";
      if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} দিন আগে`;
      return date.toLocaleDateString("bn-BD");
    } catch {
      return "সময় অজানা";
    }
  };

  const shareDiscussion = async (discussion: Discussion) => {
    const shareUrl = `${window.location.origin}/discussions/${discussion.id}`;
    const shareText = `এই আলোচনাটি দেখুন: ${discussion.title}`;

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.error("Window object not available");
      return;
    }

    // Try Web Share API first (for mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "আলোচনা ফোরাম",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
        // Fall through to clipboard method if share fails
      }
    }

    // Fallback: Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("লিঙ্ক কপি করা হয়েছে");
        return;
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        // Fall through to legacy method
      }
    }

    // Legacy fallback: document.execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        toast.success("লিঙ্ক কপি করা হয়েছে");
      } else {
        throw new Error("execCommand failed");
      }
    } catch (legacyError) {
      console.error("Legacy copy failed:", legacyError);

      // Final fallback: show URL to user
      toast.error(
        `লিঙ্ক কপি করতে সমস্যা হয়েছে। লিঙ্কটি ম্যানুয়ালি কপি করুন: ${shareUrl}`,
        { duration: 5000 }
      );
    }
  };

  if (error && discussions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-bengali">
              ত্রুটি ঘটেছে
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadDiscussions}
              className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-bengali flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>আবার চেষ্টা করুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-bengali">
              আলোচনা ফোরাম
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            প্রশ্ন নিয়ে আলোচনা করুন, উত্তর খুঁজুন এবং অন্য শিক্ষার্থীদের
            সাহায্য করুন
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-6"
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition-all duration-300 ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-bengali">সব আলোচনা</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition-all duration-300 ${
                activeTab === "popular"
                  ? "bg-green-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bengali">জনপ্রিয়</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition-all duration-300 ${
                activeTab === "bookmarks"
                  ? "bg-yellow-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookmarkCheck className="w-4 h-4" />
                <span className="font-bengali">বুকমার্ক</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="আলোচনা বা প্রশ্ন খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-bengali"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-bengali"
              >
                <option value="">সব ক্যাটাগরি</option>
                {Array.isArray(categories) &&
                  categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-bengali"
              >
                <option value="">সব বিষয়</option>
                {Array.isArray(subjects) &&
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-bengali">{error}</p>
                <p className="text-yellow-700 text-sm">মক ডেটা দেখানো হচ্ছে</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Discussions List */}
        <div className="space-y-6">
          {loading ? (
            // Loading Skeleton
            [...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredDiscussions.length > 0 ? (
            filteredDiscussions.map((discussion, index) => (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Discussion Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {discussion.user_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 font-bengali">
                            {discussion.user_name || "অজানা ব্যবহারকারী"}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-bengali">
                              {formatTimeAgo(discussion.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discussion Title */}
                <div className="px-6 pt-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 font-bengali">
                      {discussion.title}
                    </h4>
                  </div>
                </div>

                {/* Discussion Content */}
                <div className="p-6">
                  <p className="text-gray-800 leading-relaxed mb-4 font-bengali">
                    {discussion.comment}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(discussion.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          discussion.is_liked
                            ? "bg-blue-100 text-blue-600 border border-blue-200"
                            : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-medium font-bengali">
                          {discussion.likes_count || 0}
                        </span>
                      </button>

                      {/* Dislike Button */}
                      <button
                        onClick={() => handleDislike(discussion.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          discussion.is_disliked
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="font-medium font-bengali">
                          {discussion.dislikes_count || 0}
                        </span>
                      </button>

                      {/* Reply Button */}
                      <button
                        onClick={() =>
                          setShowReplyForm(
                            showReplyForm === discussion.id
                              ? null
                              : discussion.id
                          )
                        }
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all duration-300"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium font-bengali">
                          {discussion.reply_count || 0} উত্তর
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Bookmark Button */}
                      <button
                        onClick={() => handleBookmark(discussion.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          discussion.is_bookmarked
                            ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                            : "bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600"
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span className="font-medium font-bengali">
                          {discussion.bookmarks_count || 0}
                        </span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => shareDiscussion(discussion)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                      >
                        <Share className="w-4 h-4" />
                        <span className="font-medium font-bengali">শেয়ার</span>
                      </button>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {showReplyForm === discussion.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="আপনার উত্তর লিখুন..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 resize-none font-bengali"
                          />
                        </div>
                        <button
                          onClick={() => handleReply(discussion.id)}
                          disabled={!replyText.trim()}
                          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                        >
                          <Send className="w-4 h-4" />
                          <span className="font-bengali">পোস্ট</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Show Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {discussion.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-700 font-bengali">
                              {reply.user_name}
                            </span>
                            <span className="text-xs text-gray-500 font-bengali">
                              {formatTimeAgo(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm font-bengali">
                            {reply.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
            >
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-bengali">
                {searchTerm || selectedSubject || selectedCategory
                  ? "কোন আলোচনা পাওয়া যায়নি"
                  : activeTab === "bookmarks"
                  ? "কোন বুকমার্ক করা আলোচনা নেই"
                  : "এখনও কোন আলোচনা শুরু হয়নি"}
              </h3>
              <p className="text-gray-600 mb-6 font-bengali">
                {searchTerm || selectedSubject || selectedCategory
                  ? "আপনার সার্চ ক্রাইটেরিয়া মেলে এমন কোন আলোচনা নেই"
                  : activeTab === "bookmarks"
                  ? "আপনি এখনও কোন আলোচনা বুকমার্ক করেননি"
                  : "প্রথম আলোচনা শুরু করুন এবং কমিউনিটির সাথে জ্ঞান বিনিময় করুন!"}
              </p>
              {activeTab !== "bookmarks" && (
                <button
                  onClick={handleCreateDiscussion}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-bengali mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>প্রথম আলোচনা শুরু করুন</span>
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Statistics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(discussions) ? discussions.length : 0}
            </div>
            <div className="text-sm text-gray-600 font-bengali">মোট আলোচনা</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(discussions)
                ? discussions.reduce(
                    (sum, disc) => sum + (disc.reply_count || 0),
                    0
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-600 font-bengali">মোট উত্তর</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(discussions)
                ? discussions.reduce(
                    (sum, disc) => sum + (disc.likes_count || 0),
                    0
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-600 font-bengali">মোট লাইক</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(discussions)
                ? discussions.reduce(
                    (sum, disc) =>
                      sum +
                      (disc.reply_count || 0) +
                      (disc.likes_count || 0) +
                      (disc.dislikes_count || 0),
                    0
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-600 font-bengali">
              মোট এক্টিভিটি
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleCreateDiscussion}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDiscussionCreated={handleDiscussionCreated}
      />
    </div>
  );
};

export default DiscussionsPage;
