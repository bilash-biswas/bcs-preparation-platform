// app/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchCategories,
  fetchCategoryStatistics,
  clearError,
} from "@/store/slices/categorySlice";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  FileText,
  Users,
  Target,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";
import { Category } from "@/types";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { categories, pagination, error, isLoading } = useAppSelector(
    (state) => state.categories
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCategories({ page: currentPage, page_size: 20 }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchCategories({ page: currentPage, page_size: 20 }));
  };

  const handleCategoryClick = (categoryId: number) => {
    router.push(`/subjects?category=${categoryId}`);
  };

  const handlePracticeClick = (categoryId: number) => {
    router.push(`/practice?category=${categoryId}`);
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      math: "🧮",
      science: "🔬",
      history: "📜",
      geography: "🌍",
      english: "🔤",
      bangla: "📖",
      general: "📚",
      "current-affairs": "📰",
      computer: "💻",
      economics: "💰",
      politics: "🏛️",
      culture: "🎭",
    };
    return icons[iconName] || "📁";
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      "#FF6B6B": {
        gradient: "from-red-500 to-pink-600",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
      "#45B7D1": {
        gradient: "from-cyan-500 to-blue-600",
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
      },
      "#F7DC6F": {
        gradient: "from-yellow-500 to-amber-600",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      "#4ECDC4": {
        gradient: "from-teal-500 to-green-600",
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
      },
    };
    return (
      colors[color as keyof typeof colors] || {
        gradient: "from-gray-500 to-gray-600",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  const totalPages = pagination?.totalPages || 1;
  const visiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);

  if (isLoading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-3 rounded-t-2xl bg-gray-300 mb-4"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="text-center mb-12 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-12 pb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-bengali bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              সকল ক্যাটাগরি
            </h1>
            <CardDescription className="text-lg text-gray-600 font-bengali max-w-2xl mx-auto">
              বিসিএস পরীক্ষার সকল বিষয় ক্যাটাগরি অনুযায়ী সাজানো
            </CardDescription>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-red-800 font-semibold font-bengali mb-2">
                    লোড করতে সমস্যা হয়েছে
                  </CardTitle>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRetry}
                      variant="destructive"
                      className="font-bengali"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      আবার চেষ্টা করুন
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="ক্যাটাগরি খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 font-bengali"
                  />
                </div>
              </div>
              <Badge variant="secondary" className="font-bengali">
                {filteredCategories.length} টি ক্যাটাগরি
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredCategories.map((category) => {
                const colorConfig = getCategoryColor(category.color);
                const completionPercentage = category.question_count
                  ? Math.min(100, (category.question_count / 1000) * 100)
                  : 0;

                return (
                  <Card
                    key={category.id}
                    className={`shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${colorConfig.border} cursor-pointer`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div
                      className={`h-2 rounded-t-2xl bg-gradient-to-r ${colorConfig.gradient}`}
                    ></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getCategoryIcon(category.icon)}
                          </span>
                          <CardTitle className="text-xl font-bold font-bengali">
                            {category.name}
                          </CardTitle>
                        </div>
                      </div>

                      <CardDescription className="mb-4 font-bengali">
                        {category.description}
                      </CardDescription>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="font-bengali">অগ্রগতি</span>
                          <span>{completionPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={completionPercentage}
                          className="h-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(category.id);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold text-sm"
                        >
                          বিষয় দেখুন
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePracticeClick(category.id);
                          }}
                          variant="outline"
                          className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-sm"
                        >
                          প্র্যাকটিস
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {!searchTerm && totalPages > 1 && (
              <Card className="mb-12">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from(
                      { length: endPage - startPage + 1 },
                      (_, i) => startPage + i
                    ).map((page) => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <CardTitle className="font-bengali mb-4">
                কোন ক্যাটাগরি পাওয়া যায়নি
              </CardTitle>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm("")}
                  className="font-bengali"
                >
                  সব ক্যাটাগরি দেখুন
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
