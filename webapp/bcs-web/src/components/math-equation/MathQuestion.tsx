// components/MathQuestion.tsx
import { useState } from "react";
import { MathDisplay } from "./MathDisplay";
import { MathQuestion as MathQuestionType } from "@/types/index";
import React from "react";

interface MathQuestionProps {
  question: MathQuestionType;
  userAnswer?: string;
  onAnswer?: (answer: string) => void;
  showExplanation?: boolean;
}

export function MathQuestion({
  question,
  userAnswer,
  onAnswer,
  showExplanation = false,
}: MathQuestionProps): React.JSX.Element {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    userAnswer
  );

  const handleOptionSelect = (optionKey: string): void => {
    setSelectedOption(optionKey);
    onAnswer?.(optionKey);
  };

  const getOptionStyle = (optionKey: string): string => {
    const baseStyle =
      "flex w-full gap-2 rounded-md p-1.5 pl-2 items-center transition-colors duration-200 ";

    if (selectedOption === optionKey) {
      return (
        baseStyle +
        "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600"
      );
    }

    return (
      baseStyle +
      "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
    );
  };

  const getTopicColor = (topic: MathQuestionType["topic"]): string => {
    const colors: Record<MathQuestionType["topic"], string> = {
      differentiation:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      integration:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      trigonometry:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      vector:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      straight_line:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      colors[topic] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    );
  };

  const getDifficultyColor = (
    difficulty: MathQuestionType["difficultyLevel"]
  ): string => {
    const colors: Record<MathQuestionType["difficultyLevel"], string> = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[difficulty];
  };

  // Extract LaTeX content from question text
  const extractLatexFromQuestion = (text: string): string => {
    // For questions that contain both text and LaTeX, you might want to handle them differently
    // For now, we'll assume the entire question text is LaTeX or contains LaTeX
    return text;
  };

  return (
    <div className="rounded-xl p-6 flex flex-col space-y-4 items-stretch w-full overflow-x-auto shadow-sm border dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Question Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div
            style={{ lineHeight: "1.7" }}
            className="text-lg tracking-wide font-normal leading-relaxed"
          >
            {/* Render the question text - it may contain both text and LaTeX */}
            {question.questionText.split("$").map((part, index) => {
              if (index % 2 === 0) {
                // Regular text
                return <span key={index}>{part}</span>;
              } else {
                // LaTeX content
                return (
                  <span key={index} className="inline-block mx-1">
                    <MathDisplay content={part} displayMode={false} />
                  </span>
                );
              }
            })}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getTopicColor(
            question.topic
          )} ml-4 shrink-0`}
        >
          {question.topic.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Tags and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="cursor-pointer tag tag-cyan max-w-[200px] whitespace-nowrap block overflow-hidden truncate bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 px-3 py-1 rounded-full text-xs">
            {question.databaseReference}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs ${getDifficultyColor(
              question.difficultyLevel
            )}`}
          >
            {question.difficultyLevel}
          </span>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="icon-button p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Share question"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
          </button>
          <button
            className="icon-button p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Bookmark question"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid md:grid-cols-2 gap-2">
        {Object.entries(question.options).map(([key, option]) => (
          <button
            key={key}
            type="button"
            className="w-full"
            onClick={() => handleOptionSelect(key)}
            disabled={!!selectedOption}
          >
            <div className={getOptionStyle(key)}>
              <div className="rounded-full border-gray-500 aspect-square w-6 h-6 shrink-0 flex items-center justify-center border-2 text-sm font-medium">
                {key}
              </div>
              <div className="text-left flex-1">
                <div
                  style={{ lineHeight: "1.7" }}
                  className="text-lg tracking-wide font-normal leading-relaxed"
                >
                  <MathDisplay content={option.latex} displayMode={false} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation Section */}
      {showExplanation && question.explanationText && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Explanation:
          </h4>
          <p className="text-green-700 dark:text-green-300">
            {question.explanationText}
          </p>
        </div>
      )}

      {/* Result Display */}
      {selectedOption && (
        <div
          className={`mt-3 p-3 rounded-lg ${
            selectedOption === question.correctAnswer
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {selectedOption === question.correctAnswer ? (
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Correct! Your answer is right.
            </span>
          ) : (
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Incorrect. The correct answer is {question.correctAnswer}.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
