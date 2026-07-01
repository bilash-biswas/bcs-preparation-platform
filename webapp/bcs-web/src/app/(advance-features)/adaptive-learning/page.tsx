"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  startAdaptiveSession,
  submitAdaptiveAnswer,
  clearSession,
  updateAbilityEstimate,
} from "@/store/slices/adaptiveLearningSlice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { fetchAllSubjects } from "@/store/slices/subjectSlice";

interface Subject {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  category_name: string;
  category: number;
}

const AdaptiveLearningPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentSession, abilityEstimate, loading, error } = useAppSelector(
    (state) => state.adaptiveLearning
  );

  const { subjects: storedSubjects } = useAppSelector(
    (state) => state.subjects
  );

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const response = await apiClient.get("/subjects/");
      const subjectsData = response.results || response;
      fetchAllSubjects({
        page: 1,
        page_size: 30,
      });
      console.log("Fetched subjects:", subjectsData);
      console.log("Stored subjects:", storedSubjects);
      setSubjects(storedSubjects.length > 0 ? storedSubjects : subjectsData);
    } catch (error) {
      console.error("Failed to load subjects:", error);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedSubject) return;

    try {
      const result = await dispatch(
        startAdaptiveSession({
          subjectId: selectedSubject,
          questionCount,
        })
      ).unwrap();

      setSessionStarted(true);
      setShowResults(false);
      setSessionResults(null);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentSession || selectedOption === null) return;

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        submitAdaptiveAnswer({
          sessionId: currentSession.id,
          questionId: currentSession.current_question?.id || 0,
          selectedOption,
          responseTime: 30,
        })
      ).unwrap();

      setSelectedOption(null);

      if (result.session_completed) {
        setSessionResults(result);
        setShowResults(true);
        setSessionStarted(false);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = () => {
    dispatch(clearSession());
    setSessionStarted(false);
    setSelectedSubject(null);
    setSelectedOption(null);
    setShowResults(false);
    setSessionResults(null);
  };

  const handleNewSession = () => {
    dispatch(clearSession());
    setSessionStarted(false);
    setSelectedSubject(null);
    setSelectedOption(null);
    setShowResults(false);
    setSessionResults(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAbilityLevel = (estimate: number) => {
    if (estimate < 0.3) return { level: "Beginner", color: "text-blue-600" };
    if (estimate < 0.6)
      return { level: "Intermediate", color: "text-purple-600" };
    return { level: "Advanced", color: "text-green-600" };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const abilityInfo = getAbilityLevel(abilityEstimate);

  if (subjectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Adaptive Learning
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered personalized learning that adapts to your skill level in
            real-time
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Results */}
        {showResults && sessionResults && (
          <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-2 border-green-200">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Session Completed!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      sessionResults.score_percentage || 0
                    )}`}
                  >
                    {sessionResults.final_score}/
                    {sessionResults.total_questions}
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {sessionResults.score_percentage?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {(sessionResults.ability_estimate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Ability Level</div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={handleNewSession} variant="default">
                  Start New Session
                </Button>
                <Button
                  onClick={() => router.push("/practice")}
                  variant="outline"
                >
                  Practice More
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!sessionStarted && !showResults ? (
          // Session Setup
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                Start Adaptive Session
              </h2>
              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Subject *
                  </Label>
                  <select
                    id="subject"
                    value={selectedSubject || ""}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={subjects.length === 0}
                  >
                    <option value="">Choose a subject</option>
                    {subjects.length === 0 ? (
                      <option value="" disabled>
                        Loading subjects...
                      </option>
                    ) : (
                      subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.total_questions} questions)
                        </option>
                      ))
                    )}
                  </select>
                  {subjects.length === 0 && !subjectsLoading && (
                    <p className="text-sm text-red-500 mt-2">
                      No subjects available. Please check back later.
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="questionCount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Number of Questions
                  </Label>
                  <select
                    id="questionCount"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={5}>5 Questions (Quick Practice)</option>
                    <option value={10}>10 Questions (Standard Session)</option>
                    <option value={15}>15 Questions (Extended Practice)</option>
                    <option value={20}>
                      20 Questions (Comprehensive Session)
                    </option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="mr-2">🎯</span> How Adaptive Learning Works
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Questions adapt to your current ability level</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Difficulty adjusts based on your performance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Get personalized learning path in real-time</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Continuous ability estimation and optimization
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleStartSession}
                  disabled={
                    !selectedSubject || loading || subjects.length === 0
                  }
                  className="w-full py-3 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Starting Session...
                    </div>
                  ) : (
                    "Start Adaptive Session"
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                About Adaptive Learning
              </h2>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">🧠</span> Intelligent Question
                    Selection
                  </h3>
                  <p className="text-sm text-gray-700">
                    Our AI algorithm selects questions based on your current
                    ability estimate, ensuring you're always challenged at the
                    right level for optimal learning.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">⚡</span> Real-time Adaptation
                  </h3>
                  <p className="text-sm text-gray-700">
                    The system continuously updates your ability estimate and
                    adjusts question difficulty after each response, creating a
                    truly personalized experience.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📈</span> Optimal Learning
                  </h3>
                  <p className="text-sm text-gray-700">
                    By working at your optimal difficulty level, you maximize
                    learning efficiency, knowledge retention, and skill
                    development.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Learning Progression
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 font-medium">
                        Beginner
                      </span>
                      <span className="text-purple-600 font-medium">
                        Intermediate
                      </span>
                      <span className="text-green-600 font-medium">
                        Advanced
                      </span>
                    </div>
                    <Progress value={abilityEstimate * 100} className="h-2" />
                    <div className="text-xs text-gray-500 text-center">
                      Your starting ability level will be determined by your
                      past performance
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : sessionStarted && currentSession ? (
          // Active Session
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Session Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Session Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Questions Completed</span>
                      <span className="font-medium text-gray-900">
                        {currentSession.questions_answered}/
                        {currentSession.total_questions}
                      </span>
                    </div>
                    <Progress
                      value={
                        (currentSession.questions_answered /
                          currentSession.total_questions) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Correct Answers</span>
                      <span className="font-medium text-gray-900">
                        {currentSession.correct_answers}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((currentSession.correct_answers || 0) /
                          (currentSession.questions_answered || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Ability Level
                      </span>
                      <Badge variant="default" className={abilityInfo.color}>
                        {abilityInfo.level}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Current estimate: {(abilityEstimate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Session Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium text-gray-900">
                      {currentSession.subject.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(currentSession.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Spent:</span>
                    <span className="font-medium text-gray-900">
                      {Math.floor(
                        (currentSession.questions_answered * 45) / 60
                      )}
                      m {(currentSession.questions_answered * 45) % 60}s
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Session Controls
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleEndSession}
                    variant="outline"
                    className="w-full"
                  >
                    End Session
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    You can resume later from where you left off
                  </div>
                </div>
              </Card>
            </div>

            {/* Question Area */}
            <div className="lg:col-span-3">
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                {currentSession.current_question ? (
                  <div className="space-y-6">
                    {/* Question Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Question {currentSession.questions_answered + 1}
                        </h2>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(
                            currentSession.current_question.difficulty
                          )}
                        >
                          {currentSession.current_question.difficulty
                            .charAt(0)
                            .toUpperCase() +
                            currentSession.current_question.difficulty.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          Subject
                        </div>
                        <div className="font-medium text-gray-900">
                          {currentSession.subject.name}
                        </div>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentSession.current_question.question_text}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      <Label className="text-lg font-medium text-gray-900">
                        Select your answer:
                      </Label>
                      <RadioGroup
                        value={selectedOption?.toString() || ""}
                        onValueChange={(value) =>
                          setSelectedOption(Number(value))
                        }
                        className="space-y-3"
                      >
                        {currentSession.current_question.options?.map(
                          (option, index) => (
                            <div
                              key={option.id}
                              className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                            >
                              <RadioGroupItem
                                value={option.id.toString()}
                                id={`option-${option.id}`}
                              />
                              <Label
                                htmlFor={`option-${option.id}`}
                                className="flex-1 cursor-pointer text-gray-900 font-medium"
                              >
                                <div className="flex items-center">
                                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 font-semibold">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  {option.option_text}
                                </div>
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4 pt-6">
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null || isSubmitting}
                        className="flex-1 py-3 text-lg font-semibold"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Checking Answer...
                          </div>
                        ) : (
                          "Submit Answer"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Calculating Next Question
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      The AI is analyzing your performance to select the perfect
                      question for your current ability level...
                    </p>
                  </div>
                )}
              </Card>

              {/* Ability Progression */}
              <Card className="p-6 mt-6 bg-white/80 backdrop-blur-sm">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Learning Progression
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Current Ability
                    </span>
                    <span
                      className="font-bold text-xl"
                      style={{ color: abilityInfo.color.replace("text-", "") }}
                    >
                      {(abilityEstimate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={abilityEstimate * 100} className="h-3" />
                  <div className="grid grid-cols-3 text-xs text-gray-500">
                    <span className="text-blue-600 font-medium">Beginner</span>
                    <span className="text-center text-purple-600 font-medium">
                      Intermediate
                    </span>
                    <span className="text-right text-green-600 font-medium">
                      Advanced
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdaptiveLearningPage;
