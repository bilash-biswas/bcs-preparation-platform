// app/subjects/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Subject {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  category_name: string;
  category: number;
}

interface EnhancedSubject extends Subject {
  difficulty_distribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  last_updated?: string;
}

interface Category {
  id: number;
  name: string;
  subject_count: number;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<EnhancedSubject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<EnhancedSubject[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "questions">("name");
  const [pagination, setPagination] = useState<PaginationInfo>({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
    loadSubjects();
    loadCategories();
  }, [searchParams]);

  useEffect(() => {
    filterAndSortSubjects();
  }, [subjects, searchTerm, selectedCategory, sortBy]);

  const loadSubjects = async (page: number = 1) => {
  try {
    setLoading(true);
    
    let url = '/subjects/';
    const params = new URLSearchParams();
    
    if (selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    
    // Try with pagination first
    params.append('page', page.toString());
    params.append('page_size', '20');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const data = await apiClient.get(url);
    
    // Handle both paginated and non-paginated responses
    const subjectsData = data.results || data;
    const totalCount = data.count || subjectsData.length;
    const hasPagination = data.results !== undefined;
    
    setSubjects(subjectsData);
    setFilteredSubjects(subjectsData);
    
    setPagination({
      count: totalCount,
      next: data.next || null,
      previous: data.previous || null,
      current_page: hasPagination ? page : 1,
      total_pages: hasPagination ? Math.ceil(totalCount / 20) : 1
    });
    
  } catch (error: any) {
    console.error('Failed to load subjects:', error);
    
    // If 404, try without pagination
    if (error.response?.status === 404) {
      console.log('Pagination not supported, trying without...');
      try {
        let fallbackUrl = '/subjects/';
        const fallbackParams = new URLSearchParams();
        
        if (selectedCategory !== 'all') {
          fallbackParams.append('category', selectedCategory);
        }
        
        if (fallbackParams.toString()) {
          fallbackUrl += `?${fallbackParams.toString()}`;
        }
        
        const fallbackData = await apiClient.get(fallbackUrl);
        const allSubjects = fallbackData.results || fallbackData;
        
        setSubjects(allSubjects);
        setFilteredSubjects(allSubjects);
        setPagination({
          count: allSubjects.length,
          next: null,
          previous: null,
          current_page: 1,
          total_pages: 1
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  } finally {
    setLoading(false);
  }
};

  const loadCategories = async () => {
    try {
      const data = await apiClient.get("/categories/");
      const categoriesData = data.results || data;

      // Calculate subject count for each category
      const enhancedCategories = categoriesData.map((category: Category) => ({
        ...category,
        subject_count: subjects.filter((sub) => sub.category === category.id)
          .length,
      }));

      setCategories(enhancedCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const filterAndSortSubjects = () => {
    let filtered = subjects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (subject.description &&
            subject.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Sort subjects
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "questions":
          return b.total_questions - a.total_questions;
        default:
          return 0;
      }
    });

    setFilteredSubjects(filtered);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadSubjects(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      loadSubjects(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getDifficultyPercentage = (
    subject: EnhancedSubject,
    difficulty: "easy" | "medium" | "hard"
  ) => {
    if (!subject.difficulty_distribution) return 0;
    const total =
      subject.difficulty_distribution.easy +
      subject.difficulty_distribution.medium +
      subject.difficulty_distribution.hard;
    return total > 0
      ? (subject.difficulty_distribution[difficulty] / total) * 100
      : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (categoryId: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-cyan-100 text-cyan-800",
    ];
    return colors[categoryId % colors.length];
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.current_page - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(
      pagination.total_pages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="animate-pulse h-10 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
            <div className="animate-pulse h-4 bg-gray-300 rounded w-96 mx-auto"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-12 bg-gray-300 rounded"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Subjects Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                <div className="h-2 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-bengali bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              সকল বিষয়
            </h1>
            <p className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto">
              বিসিএস পরীক্ষার জন্য সকল বিষয়ের প্রশ্নব্যাংক এবং প্র্যাকটিস
              ম্যাটেরিয়াল
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold mb-2 font-bengali text-gray-900">
                  🔍 বিষয় খুঁজুন
                </label>
                <input
                  type="text"
                  placeholder="বিষয়ের নাম লিখুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold mb-2 font-bengali text-gray-900">
                  📂 ক্যাটাগরি
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">সব ক্যাটাগরি</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold mb-2 font-bengali text-gray-900">
                  🔄 সাজান
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "questions")
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">নাম অনুসারে</option>
                  <option value="questions">প্রশ্ন সংখ্যা</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600 font-bengali">
              দেখানো হচ্ছে {(pagination.current_page - 1) * 20 + 1} -{" "}
              {Math.min(pagination.current_page * 20, pagination.count)} এর{" "}
              {pagination.count} টি বিষয়
              {selectedCategory !== "all" &&
                ` - ${
                  categories.find((c) => c.id.toString() === selectedCategory)
                    ?.name
                }`}
              {searchTerm && ` - "${searchTerm}"`}
            </p>

            <div className="flex gap-2 text-sm">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bengali">
                সহজ: 🟢
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bengali">
                মধ্যম: 🟡
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bengali">
                কঠিন: 🔴
              </span>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200"
              >
                <div className="p-6">
                  {/* Subject Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 font-bengali">
                      {subject.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${getCategoryColor(
                        subject.category
                      )}`}
                    >
                      {subject.category_name}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed font-bengali line-clamp-2">
                    {subject.description ||
                      "বিসিএস পরীক্ষার জন্য গুরুত্বপূর্ণ বিষয়।"}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                    <span className="font-bengali">
                      {subject.total_questions} টি প্রশ্ন
                    </span>
                    {subject.last_updated && (
                      <span className="font-bengali">
                        আপডেট: {formatDate(subject.last_updated)}
                      </span>
                    )}
                  </div>

                  {/* Difficulty Distribution */}
                  {subject.difficulty_distribution && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2 font-bengali">
                        <span>কঠিনতা স্তর:</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                          style={{
                            width: "100%",
                            background: `linear-gradient(90deg, 
                            green ${getDifficultyPercentage(subject, "easy")}%, 
                            yellow ${getDifficultyPercentage(
                              subject,
                              "easy"
                            )}% ${
                              getDifficultyPercentage(subject, "easy") +
                              getDifficultyPercentage(subject, "medium")
                            }%, 
                            red ${
                              getDifficultyPercentage(subject, "easy") +
                              getDifficultyPercentage(subject, "medium")
                            }% 100%)`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="text-green-600 font-bengali">সহজ</span>
                        <span className="text-yellow-600 font-bengali">
                          মধ্যম
                        </span>
                        <span className="text-red-600 font-bengali">কঠিন</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/practice?subject=${subject.id}`}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 px-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-sm transition-all duration-200 font-bengali"
                    >
                      প্র্যাকটিস
                    </Link>
                    <Link
                      href={`/questions?subject=${subject.id}`}
                      className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-3 rounded-lg hover:bg-blue-50 font-semibold text-sm transition-colors font-bengali"
                    >
                      প্রশ্নব্যাংক
                    </Link>
                    <Link
                      href={`/quizzes?subject=${subject.id}`}
                      className="flex-1 border border-green-600 text-green-600 text-center py-2 px-3 rounded-lg hover:bg-green-50 font-semibold text-sm transition-colors font-bengali"
                    >
                      কুইজ
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className="text-sm text-gray-600 font-bengali">
                  পৃষ্ঠা {pagination.current_page} এর {pagination.total_pages}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={!pagination.previous}
                    className={`px-4 py-2 rounded-lg border font-semibold transition-colors ${
                      pagination.previous
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    পূর্ববর্তী
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {generatePageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg border font-semibold transition-colors ${
                          page === pagination.current_page
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={!pagination.next}
                    className={`px-4 py-2 rounded-lg border font-semibold transition-colors ${
                      pagination.next
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    পরবর্তী
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSubjects.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-bengali">
                কোন বিষয় পাওয়া যায়নি
              </h3>
              <p className="text-gray-600 mb-6 font-bengali">
                আপনার খোঁজার সাথে মিলিয়ে কোন বিষয় পাওয়া যায়নি। অন্য কোন
                কীওয়ার্ড দিয়ে চেষ্টা করুন।
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  loadSubjects(1);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold font-bengali transition-all duration-200"
              >
                সব ফিল্টার সরান
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-center mb-6 font-bengali text-gray-900">
              সামগ্রিক পরিসংখ্যান
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {pagination.count}
                </div>
                <div className="text-gray-600 font-bengali">মোট বিষয়</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {subjects
                    .reduce((sum, sub) => sum + sub.total_questions, 0)
                    .toLocaleString()}
                </div>
                <div className="text-gray-600 font-bengali">মোট প্রশ্ন</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {categories.length}
                </div>
                <div className="text-gray-600 font-bengali">ক্যাটাগরি</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {Math.ceil(
                    subjects.reduce(
                      (sum, sub) => sum + sub.total_questions,
                      0
                    ) / 50
                  )}
                  +
                </div>
                <div className="text-gray-600 font-bengali">
                  প্র্যাকটিস সেশন
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex justify-center gap-4">
            <Link
              href="/categories"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all duration-200 transform hover:scale-105 font-bengali"
            >
              ক্যাটাগরি দেখুন
            </Link>
            <Link
              href="/practice"
              className="border-2 border-blue-600 text-blue-600 py-3 px-8 rounded-xl hover:bg-blue-50 font-semibold transition-colors font-bengali"
            >
              প্র্যাকটিস শুরু করুন
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
