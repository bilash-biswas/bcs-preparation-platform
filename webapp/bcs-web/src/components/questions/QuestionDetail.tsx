// components/questions/QuestionDetail.tsx
import React from 'react';
import { selectCurrentQuestion } from '@/store/slices/questionSlice';
import {Card} from '@/components/ui/card';
import { useSelector } from 'react-redux';

const QuestionDetail: React.FC = () => {
  const question = useSelector(selectCurrentQuestion);

  if (!question) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          Select a question to view details
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Question Details</h2>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              question.difficulty === 'easy' 
                ? 'bg-green-100 text-green-800' 
                : question.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {question.difficulty}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              {question.question_type}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Question:</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{question.question_text}</p>
        </div>

        {question.explanation && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Explanation:</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{question.explanation}</p>
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Options:</h3>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`p-3 border rounded-lg ${
                  option.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    option.is_correct
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{option.option_text}</p>
                    {option.is_correct && (
                      <p className="text-green-600 text-sm mt-1">✓ Correct Answer</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Subject:</span>
            <p>{question.subject.name}</p>
          </div>
          <div>
            <span className="font-medium">Marks:</span>
            <p>{question.marks}</p>
          </div>
          <div>
            <span className="font-medium">Negative Marks:</span>
            <p>{question.negative_marks}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QuestionDetail;