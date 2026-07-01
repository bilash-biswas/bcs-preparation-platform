"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchExamSimulations,
  createExamSimulation,
  startExamSimulation,
  fetchExamAnalysis,
  setCurrentExam,
  clearError,
  fetchExamQuestions,
} from "@/store/slices/examSimulationSlice";
import { fetchAllSubjects } from "@/store/slices/subjectSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  BookOpen,
  Play,
  BarChart3,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  FileText,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Subject } from "@/types";

const ExamSimulationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { exams, currentExam, activeSession, analysis, questions, loading, error } =
    useAppSelector((state) => state.examSimulations);
  const { subjects } = useAppSelector((state) => state.subjects);
  console.log("Exam Simulations:", subjects);
  console.log("exams:", exams);
  console.log('current exam:', currentExam);
  console.log('analysis:', analysis);
  console.log('active session:', activeSession);
  console.log('error:', error);

  const [activeTab, setActiveTab] = useState<
    "list" | "create" | "exam" | "analysis"
  >("list");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    selectedSubjects: [] as number[],
    duration: 50, // 3 hours default
    totalQuestions: 50,
    strictTiming: true,
    showResultsAfter: false,
  });

  useEffect(() => {
    dispatch(fetchExamSimulations());
    dispatch(fetchAllSubjects({ is_active: true, page_size: 50 }));
  }, [dispatch]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSession && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, timeRemaining]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (createForm.selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform data to match Django expectations
      const examData = {
        name: createForm.name.trim(),
        subjects: createForm.selectedSubjects, // Array of subject IDs
        duration: createForm.duration,
        total_questions: createForm.totalQuestions,
        strict_timing: Boolean(createForm.strictTiming),
        show_results_after: Boolean(createForm.showResultsAfter),
        question_breakdown: {
          easy: Math.floor(createForm.totalQuestions * 0.3),
          medium: Math.floor(createForm.totalQuestions * 0.5),
          hard: Math.floor(createForm.totalQuestions * 0.2),
        },
      };

      console.log("📤 Sending to Django:", examData);
      console.log("Subjects being sent:", examData.subjects);
      console.log("Subjects type:", typeof examData.subjects);
      console.log("First subject type:", typeof examData.subjects[0]);

      await dispatch(createExamSimulation(examData)).unwrap();

      // Reset form on success
      setActiveTab("list");
      setCreateForm({
        name: "",
        selectedSubjects: [],
        duration: 180,
        totalQuestions: 100,
        strictTiming: true,
        showResultsAfter: false,
      });

      console.log("✅ Exam created successfully!");
    } catch (error: any) {
      console.error("❌ Failed to create exam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartExam = async (examId: number) => {
    try {
      const result = await dispatch(startExamSimulation(examId)).unwrap();
      await dispatch(fetchExamQuestions(examId)).unwrap();
      setTimeRemaining(result.duration * 60); // Convert minutes to seconds
      setActiveTab("exam");
      setCurrentQuestionIndex(0);
      setAnswers({});
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleAutoSubmit = () => {
    console.log("Time's up! Auto-submitting...");
    setActiveTab("analysis");
  };

  const handleViewAnalysis = async (examId: number) => {
    try {
      await dispatch(fetchExamAnalysis(examId));
      setActiveTab("analysis");
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSubject = (subjectId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((id) => id !== subjectId)
        : [...prev.selectedSubjects, subjectId],
    }));
  };

  const getProgressPercentage = () => {
    if (!currentExam) return 0;
    return (Object.keys(answers).length / questions.length) * 100;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < 300) return "text-red-600 bg-red-100";
    if (seconds < 900) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  if (loading && exams.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                Exam Simulation
              </h1>
              <div className="text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                <span>
                  Practice with realistic exam conditions and detailed
                  performance analysis
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={handleClearError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Exams
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
            {activeSession && (
              <TabsTrigger value="exam" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active Exam
              </TabsTrigger>
            )}
            {analysis && (
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            )}
          </TabsList>

          {/* Exam List Tab */}
          <TabsContent value="list" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My Exam Simulations
                </h2>
                <p className="text-gray-600">
                  Manage and start your practice exams
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Exam
              </Button>
            </div>

            {exams.length === 0 ? (
              <EmptyExamState onCreateExam={() => setActiveTab("create")} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    onStartExam={handleStartExam}
                    onViewAnalysis={handleViewAnalysis}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Exam Tab */}
          <TabsContent value="create">
            <CreateExamForm
              form={createForm}
              subjects={subjects}
              isSubmitting={isSubmitting}
              onSubmit={handleCreateExam}
              onCancel={() => setActiveTab("list")}
              onToggleSubject={toggleSubject}
              onChange={setCreateForm}
            />
          </TabsContent>

          {/* Active Exam Tab */}
          <TabsContent value="exam">
            {activeSession && (
              <ActiveExamView
                exam={currentExam}
                questions={questions}
                timeRemaining={timeRemaining}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                onAnswerChange={(questionIndex: any, answer: any) =>
                  setAnswers((prev) => ({ ...prev, [questionIndex]: answer }))
                }
                onQuestionChange={setCurrentQuestionIndex}
                onTimeUpdate={setTimeRemaining}
                onSubmit={() => setActiveTab("analysis")}
                formatTime={formatTime}
                getProgressPercentage={getProgressPercentage}
                getTimeColor={getTimeColor}
              />
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            {analysis && <ExamAnalysisView analysis={analysis} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="animate-pulse space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyExamState = ({ onCreateExam }: { onCreateExam: () => void }) => (
  <Card className="text-center py-16">
    <CardContent>
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="h-10 w-10 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        No Exam Simulations Yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Create your first exam simulation to practice under realistic conditions
        and get detailed performance insights.
      </p>
      <Button
        onClick={onCreateExam}
        size="lg"
        className="flex items-center gap-2 mx-auto"
      >
        <Plus className="h-5 w-5" />
        Create Your First Exam
      </Button>
    </CardContent>
  </Card>
);

// Exam Card Component
// Exam Card Component - Fixed with safe key generation
const ExamCard = ({ exam, onStartExam, onViewAnalysis }: any) => {
  // Safe subject handling with fallbacks
  const safeSubjects = exam.subjects || [];

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {exam.name}
          </CardTitle>
          <Badge
            variant={exam.strict_timing ? "destructive" : "secondary"}
            className="shrink-0"
          >
            {exam.strict_timing ? "Strict" : "Flexible"}
          </Badge>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{exam.duration} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>{exam.total_questions} questions</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* FIXED: Safe subject rendering with unique keys */}
        <div className="flex flex-wrap gap-1 mb-4">
          {safeSubjects.slice(0, 3).map((subject: any, index: number) => {
            // Generate safe key with multiple fallbacks
            const safeKey = subject?.id
              ? `subject-${subject.id}`
              : subject?.name
              ? `subject-${subject.name}-${index}`
              : `subject-${index}-${Date.now()}`;

            return (
              <Badge key={safeKey} variant="outline" className="text-xs">
                {subject?.name || `Subject ${index + 1}`}
              </Badge>
            );
          })}

          {safeSubjects.length > 3 && (
            <Badge key="more-subjects" variant="outline" className="text-xs">
              +{safeSubjects.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onStartExam(exam.id)}
            variant="default"
            className="flex-1 flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Exam
          </Button>
          <Button
            onClick={() => onViewAnalysis(exam.id)}
            variant="outline"
            size="icon"
            title="View Analysis"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Create Exam Form Component
const CreateExamForm = ({
  form,
  subjects,
  isSubmitting,
  onSubmit,
  onCancel,
  onToggleSubject,
  onChange,
}: any) => {
  const safeSubjects = React.useMemo(() => {
    console.log("Raw subjects data:", subjects);

    if (Array.isArray(subjects)) {
      return subjects;
    }
    if (subjects && typeof subjects === "object") {
      // Handle paginated response structure
      return subjects.results || subjects.data || subjects.items || [];
    }
    return [];
  }, [subjects]);
  console.log("All Subjects:", subjects);
  console.log("Available subjects for exam creation:", safeSubjects);
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-6 w-6 text-blue-600" />
          Create Exam Simulation
        </CardTitle>
        <CardDescription>
          Configure your custom exam with specific subjects and timing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="exam-name" className="text-base">
              Exam Name
            </Label>
            <Input
              id="exam-name"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="e.g., BCS Preliminary Mock Test 2024"
              className="mt-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="duration" className="text-base">
                Duration (minutes)
              </Label>
              <div className="relative mt-2">
                <Input
                  id="duration"
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    onChange({ ...form, duration: parseInt(e.target.value) })
                  }
                  min="30"
                  max="360"
                  required
                />
                <div className="absolute right-9 top-1/2 transform -translate-y-1/2 text-gray-500">
                  mins
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="total-questions" className="text-base">
                Total Questions
              </Label>
              <Input
                id="total-questions"
                type="number"
                value={form.totalQuestions}
                onChange={(e) =>
                  onChange({
                    ...form,
                    totalQuestions: parseInt(e.target.value),
                  })
                }
                min="10"
                max="200"
                className="mt-2"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Select Subjects</Label>
            {safeSubjects.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subjects available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Please check if subjects are loaded
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                {safeSubjects.map((subject: any) => (
                  <label
                    key={subject.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      form.selectedSubjects.includes(subject.id)
                        ? "bg-blue-50 border-blue-500 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Checkbox
                      checked={form.selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => onToggleSubject(subject.id)}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">{subject.name}</span>
                  </label>
                ))}
              </div>
            )}
            {form.selectedSubjects.length === 0 && safeSubjects.length > 0 && (
              <p className="text-sm text-red-500 mt-2">
                Please select at least one subject
              </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Checkbox
                checked={form.strictTiming}
                onCheckedChange={(checked) =>
                  onChange({ ...form, strictTiming: checked as boolean })
                }
                className="mt-1"
              />
              <div>
                <div className="font-medium">Enable Strict Timing</div>
                <div className="text-sm text-gray-600 mt-1">
                  Exam will auto-submit when time expires. Recommended for
                  realistic practice.
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Checkbox
                checked={form.showResultsAfter}
                onCheckedChange={(checked) =>
                  onChange({ ...form, showResultsAfter: checked as boolean })
                }
                className="mt-1"
              />
              <div>
                <div className="font-medium">Show Results Immediately</div>
                <div className="text-sm text-gray-600 mt-1">
                  Display performance analysis right after exam completion.
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 flex items-center gap-2"
              disabled={isSubmitting || form.selectedSubjects.length === 0}
            >
              {isSubmitting ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isSubmitting ? "Creating Exam..." : "Create Exam Simulation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Active Exam View Component
// Active Exam View Component - UPDATED VERSION
const ActiveExamView = ({
  exam,
  questions, // ADD this prop
  timeRemaining,
  currentQuestionIndex,
  answers,
  onAnswerChange,
  onQuestionChange,
  onSubmit,
  formatTime,
  getProgressPercentage,
  getTimeColor,
}: any) => {
  
  const currentQuestion = questions?.[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Exam Controls Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Exam Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`text-center p-4 rounded-lg ${getTimeColor(
                timeRemaining
              )}`}
            >
              <div className="text-2xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm opacity-75">Time Remaining</div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <div className="text-xs text-gray-500 text-center mt-1">
                {Object.keys(answers).length} of {questions.length} answered
              </div>
            </div>

            <Button
              onClick={onSubmit}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit Exam
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Question Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_: any, i: any) => (
                <button
                  key={`question-nav-${i}`}
                  onClick={() => onQuestionChange(i)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                    i === currentQuestionIndex
                      ? "bg-blue-600 text-white shadow-md"
                      : answers[i]
                      ? "bg-green-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Area */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <div className="text-sm text-gray-500 mt-2">
                  Subject: {currentQuestion.subject} • 
                  Difficulty: <Badge variant="outline" className="ml-1 capitalize">
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <p className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option: any, index: number) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    answers[currentQuestionIndex] === option.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestionIndex] === option.id}
                    onChange={() => onAnswerChange(currentQuestionIndex, option.id)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {String.fromCharCode(65 + index)}. {option.option_text}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => onQuestionChange(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={() => onQuestionChange(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2"
              >
                Next Question
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Exam Analysis View Component
const ExamAnalysisView = ({ analysis }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Exam Performance Analysis
        </CardTitle>
        <CardDescription>
          Detailed breakdown of your performance and improvement areas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Overall Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {analysis.performance_breakdown.overall_score}%
            </div>
            <div className="text-blue-700 font-medium">Overall Score</div>
            <div className="text-sm text-blue-600 mt-2">
              {analysis.performance_breakdown.overall_score >= 80
                ? "Excellent!"
                : analysis.performance_breakdown.overall_score >= 60
                ? "Good Job!"
                : "Keep Practicing!"}
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {analysis.performance_breakdown.difficulty_breakdown.reduce(
                (acc: number, curr: any) => acc + curr.correct,
                0
              )}
              /
              {analysis.performance_breakdown.difficulty_breakdown.reduce(
                (acc: number, curr: any) => acc + curr.total,
                0
              )}
            </div>
            <div className="text-green-700 font-medium">Correct Answers</div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {analysis.time_management.average_time_per_question}s
            </div>
            <div className="text-purple-700 font-medium">Avg Time/Question</div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Subject Performance
          </h3>
          <div className="space-y-4">
            {analysis.performance_breakdown.subject_breakdown.map(
              (subject: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        subject.score >= 80
                          ? "bg-green-500"
                          : subject.score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="font-medium text-gray-900">
                      {subject.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-semibold ${
                        subject.score >= 80
                          ? "text-green-600"
                          : subject.score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {subject.score}%
                    </span>
                    <Progress
                      value={subject.score}
                      className={`w-32 h-2 ${
                        subject.score >= 80
                          ? "[&>div]:bg-green-500"
                          : subject.score >= 60
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Weak Areas */}
        {analysis.weak_areas.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Areas for Improvement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.weak_areas.map((area: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="font-semibold text-red-900 mb-1">
                    {area.topic}
                  </div>
                  <div className="text-sm text-red-700 mb-2">
                    Accuracy: {area.accuracy}%
                  </div>
                  <div className="text-sm text-red-800">{area.suggestion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Recommendations for Improvement
          </h3>
          <div className="space-y-3">
            {analysis.improvement_suggestions.map(
              (suggestion: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800">{suggestion}</span>
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ExamSimulationPage;
