// app/analytics/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLearningInsights,
  fetchComparativeAnalysis,
} from "@/store/slices/analyticsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  Lightbulb,
  Calendar,
} from "lucide-react";
import { AppDispatch, RootState } from "@/store";

const AnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { learningInsights, comparativeAnalysis, loading, error } = useSelector(
    (state: RootState) => state.analytics
  );
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeSection, setActiveSection] = useState<
    "overview" | "performance" | "recommendations"
  >("overview");

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = () => {
    dispatch(fetchLearningInsights());
    dispatch(fetchComparativeAnalysis());
  };

  useEffect(() => {
    if (learningInsights || comparativeAnalysis) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [learningInsights, comparativeAnalysis]);

  const exportData = () => {
    try {
      const data = {
        learningInsights,
        comparativeAnalysis,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learning-analytics-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error("Export failed:", exportError);
    }
  };

  // Data validation and fallbacks
  const peakHours = learningInsights?.peak_study_hours || {};
  const weakAreas = learningInsights?.weak_areas || [];
  const recommendations = learningInsights?.recommended_actions || [];
  const subjectRankings = comparativeAnalysis?.subject_rankings || [];
  const improvementTrend = learningInsights?.improvement_trend || 0;
  const accuracyPercentile = comparativeAnalysis?.accuracy_percentile || 0;
  const speedPercentile = comparativeAnalysis?.speed_percentile || 0;
  const consistencyRank = comparativeAnalysis?.consistency_rank || 0;

  if (loading && !learningInsights && !comparativeAnalysis) {
    return <LoadingState />;
  }

  if (error && !learningInsights && !comparativeAnalysis) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  if (!loading && !learningInsights && !comparativeAnalysis) {
    return <EmptyState onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                  Learning Analytics
                </h1>
                <div className="text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-base">
                    Deep insights into your learning patterns and performance
                  </span>
                  {lastUpdated && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated {lastUpdated}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportData}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!learningInsights && !comparativeAnalysis}
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                onClick={loadData}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
        </div>

        {loading && (learningInsights || comparativeAnalysis) && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Updating analytics...
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeSection === "overview" ? "default" : "outline"}
            onClick={() => setActiveSection("overview")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeSection === "performance" ? "default" : "outline"}
            onClick={() => setActiveSection("performance")}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Performance
          </Button>
          <Button
            variant={
              activeSection === "recommendations" ? "default" : "outline"
            }
            onClick={() => setActiveSection("recommendations")}
            className="flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeSection === "overview" && (
            <OverviewTab
              peakHours={peakHours}
              weakAreas={weakAreas}
              improvementTrend={improvementTrend}
              accuracyPercentile={accuracyPercentile}
              speedPercentile={speedPercentile}
              consistencyRank={consistencyRank}
            />
          )}

          {activeSection === "performance" && (
            <PerformanceTab
              subjectRankings={subjectRankings}
              accuracyPercentile={accuracyPercentile}
              speedPercentile={speedPercentile}
              consistencyRank={consistencyRank}
            />
          )}

          {activeSection === "recommendations" && (
            <RecommendationsTab recommendations={recommendations} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component (keep the same as before)
const OverviewTab = ({
  peakHours,
  weakAreas,
  improvementTrend,
  accuracyPercentile,
  speedPercentile,
  consistencyRank,
}: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {/* Key Metrics */}
    <Card className="lg:col-span-2 xl:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Key Learning Metrics
        </CardTitle>
        <CardDescription>
          Your overall learning performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Accuracy Percentile"
            value={`${accuracyPercentile}%`}
            subtitle="Compared to peers"
            trend={accuracyPercentile - 50}
            color={
              accuracyPercentile >= 70
                ? "green"
                : accuracyPercentile >= 50
                ? "blue"
                : "red"
            }
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            title="Speed Percentile"
            value={`${speedPercentile}%`}
            subtitle="Response time ranking"
            trend={speedPercentile - 50}
            color={
              speedPercentile >= 70
                ? "green"
                : speedPercentile >= 50
                ? "blue"
                : "red"
            }
            icon={<Clock className="h-5 w-5" />}
          />
          <MetricCard
            title="Learning Streak"
            value={`${consistencyRank} days`}
            subtitle="Current consistency"
            trend={improvementTrend.toFixed(2)}
            color={
              consistencyRank >= 7
                ? "green"
                : consistencyRank >= 3
                ? "blue"
                : "purple"
            }
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>
      </CardContent>
    </Card>

    {/* Peak Study Hours */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-500" />
          Peak Study Hours
        </CardTitle>
        <CardDescription>Your most productive times</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(peakHours).length > 0 ? (
            Object.entries(peakHours).map(([hour, count]: any) => (
              <div
                key={hour}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{hour}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  {count} sessions
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No study session data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Weak Areas */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Areas Needing Improvement
        </CardTitle>
        <CardDescription>Focus on these subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weakAreas.length > 0 ? (
            weakAreas.map((area: any, index: number) => (
              <div
                key={index}
                className="p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-900">
                    {area.subject}
                  </span>
                  <Badge variant="destructive">{area.accuracy}%</Badge>
                </div>
                <Progress value={area.accuracy} className="h-2 bg-red-200" />
                <div className="text-xs text-red-600 mt-2">
                  {area.attempted_questions} questions attempted
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-300" />
              <p>No weak areas identified</p>
              <p className="text-sm">Great job!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Improvement Trend */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Progress Trend
        </CardTitle>
        <CardDescription>Your learning trajectory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
              improvementTrend > 0
                ? "bg-green-100 text-green-600"
                : improvementTrend < 0
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            } mb-4`}
          >
            {improvementTrend > 0 ? (
              <TrendingUp className="h-8 w-8" />
            ) : improvementTrend < 0 ? (
              <TrendingDown className="h-8 w-8" />
            ) : (
              <BarChart3 className="h-8 w-8" />
            )}
          </div>
          <div
            className={`text-3xl font-bold ${
              improvementTrend > 0
                ? "text-green-600"
                : improvementTrend < 0
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {improvementTrend > 0 ? "+" : ""}
            {improvementTrend.toFixed(2)}%
          </div>
          <div className="text-gray-600 mt-2">
            {improvementTrend > 0
              ? "Improving steadily"
              : improvementTrend < 0
              ? "Needs attention"
              : "Stable performance"}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Performance Tab Component (keep the same as before)
const PerformanceTab = ({
  subjectRankings,
  accuracyPercentile,
  speedPercentile,
  consistencyRank,
}: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Subject Rankings */}
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Subject Rankings vs Peers
        </CardTitle>
        <CardDescription>
          Your performance compared to other learners
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjectRankings.length > 0 ? (
            subjectRankings.map((subject: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-bold">
                    #{subject.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {subject.subject}
                    </div>
                    <div className="text-sm text-gray-600">
                      Rank {subject.rank} of {subject.total_users} learners
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {subject.accuracy}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <Badge
                    className={`
                    ${
                      subject.percentile >= 80
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : subject.percentile >= 60
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  `}
                  >
                    Top {100 - subject.percentile}%
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No ranking data available</p>
              <p className="text-sm">
                Complete more subjects to see your rankings
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Performance Metrics */}
    <Card>
      <CardHeader>
        <CardTitle>Accuracy Analysis</CardTitle>
        <CardDescription>How you compare in knowledge mastery</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {accuracyPercentile}%
            </div>
            <div className="text-blue-700 font-medium">Accuracy Percentile</div>
            <div className="text-sm text-blue-600 mt-2">
              You score higher than {accuracyPercentile}% of learners
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Speed & Consistency</CardTitle>
        <CardDescription>Your learning pace and regularity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {speedPercentile}%
            </div>
            <div className="text-green-700 text-sm">Speed Percentile</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {consistencyRank}
            </div>
            <div className="text-purple-700 text-sm">Day Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Recommendations Tab Component (keep the same as before)
const RecommendationsTab = ({ recommendations }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        Personalized Recommendations
      </CardTitle>
      <CardDescription>
        AI-powered suggestions to improve your learning
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.length > 0 ? (
          recommendations.map((action: any, index: number) => (
            <div
              key={index}
              className={`p-5 rounded-xl border-l-4 transition-all hover:shadow-md ${
                action.priority === "high"
                  ? "bg-red-50 border-red-500 hover:bg-red-75"
                  : action.priority === "medium"
                  ? "bg-yellow-50 border-yellow-500 hover:bg-yellow-75"
                  : "bg-blue-50 border-blue-500 hover:bg-blue-75"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    action.priority === "high"
                      ? "bg-red-100 text-red-600"
                      : action.priority === "medium"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {action.priority === "high" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {action.action}
                    </h3>
                    <Badge
                      variant={
                        action.priority === "high"
                          ? "destructive"
                          : action.priority === "medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{action.reason}</p>
                  {action.subject && (
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      Subject: {action.subject}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No recommendations available</p>
            <p className="text-sm">
              Complete more learning activities to get personalized suggestions
            </p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Reusable Metric Card Component (keep the same as before)
const MetricCard = ({ title, value, subtitle, trend, color, icon }: any) => {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-white/50">{icon}</div>
        {trend !== undefined && (
          <div
            className={`text-sm font-medium ${
              trend > 0
                ? "text-green-600"
                : trend < 0
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium opacity-90">{title}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
};

// Loading State Component (keep the same as before)
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-32"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error State Component (keep the same as before)
const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Unable to Load Analytics
            </h3>
            <p className="text-gray-600 mb-2">
              We encountered an error while fetching your analytics data:
            </p>
            <p className="text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-6 font-medium">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Empty State Component (keep the same as before)
const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Analytics Data Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Complete some practice sessions, quizzes, or adaptive learning
              sessions to start generating personalized learning insights and
              recommendations.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Data
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/practice")}
              >
                Start Practicing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default AnalyticsPage;
