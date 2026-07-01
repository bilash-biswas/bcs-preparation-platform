// components/questions/QuestionList.tsx
import React, { useEffect, useMemo } from 'react';
import { RootState, AppDispatch } from '@/store/index';
import { 
  fetchQuestions, 
  setFilters, 
  setPage,
  setCurrentQuestion 
} from '@/store/slices/questionSlice';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';

const QuestionList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    filteredQuestions, 
    loading, 
    error, 
    filters,
    pagination 
  } = useSelector((state: RootState) => state.questions);

  useEffect(() => {
    dispatch(fetchQuestions(filters));
  }, [dispatch, filters, pagination.currentPage]);

  const difficultyOptions = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const questionTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value || undefined }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-red-600 text-center py-4">
          Error: {error}
          <Button 
            onClick={() => dispatch(fetchQuestions(filters))} 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search questions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={filters.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.question_type || ''}
              onChange={(e) => handleFilterChange('question_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {questionTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => dispatch(setFilters({}))}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions found matching your filters.
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => dispatch(setCurrentQuestion(question))}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {question.question_text}
                  </h3>
                  <div className="flex space-x-2 ml-4">
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
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{question.subject.name}</span>
                  <span>{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  {question.options.length} options
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuestionList;