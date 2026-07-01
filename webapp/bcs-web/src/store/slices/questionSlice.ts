// lib/store/slices/questionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { questionApi } from '@/lib/api/services';
import { Question, Option, Subject } from '@/types/index';

interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  filteredQuestions: Question[];
  questionsBySubject: Record<number, Question[]>; // Cache questions by subject ID
  loading: boolean;
  error: string | null;
  filters: {
    subject?: number;
    difficulty?: string;
    question_type?: string;
    search?: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  filteredQuestions: [],
  questionsBySubject: {},
  loading: false,
  error: null,
  filters: {
    subject: undefined,
    difficulty: undefined,
    question_type: undefined,
    search: undefined,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
  },
};

// Async Thunks
export const fetchQuestions = createAsyncThunk(
  'questions/fetchAll',
  async (params?: {
    subject?: number;
    difficulty?: string;
    question_type?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await questionApi.getAll(params);
    return {
      data: response,
      headers: response,
    };
  }
);

export const fetchQuestionById = createAsyncThunk(
  'questions/fetchById',
  async (id: number) => {
    const response = await questionApi.getById(id);
    return response;
  }
);

export const fetchQuestionsBySubject = createAsyncThunk(
  'questions/fetchBySubject',
  async (subjectId: number) => {
    const response = await questionApi.getAll({ subject: subjectId });
    return {
      subjectId,
      data: response,
    };
  }
);

export const submitAnswer = createAsyncThunk(
  'questions/submitAnswer',
  async ({
    questionId,
    selectedOptionIds,
    timeTaken,
  }: {
    questionId: number;
    selectedOptionIds: number[];
    timeTaken?: number;
  }) => {
    return {
      questionId,
      selectedOptionIds,
      isCorrect: true, 
      correctOptionIds: [1, 2], 
      explanation: "This is the explanation", 
    };
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question | null>) => {
      state.currentQuestion = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<QuestionState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {
        subject: undefined,
        difficulty: undefined,
        question_type: undefined,
        search: undefined,
      };
      state.pagination.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
    clearQuestions: (state) => {
      state.questions = [];
      state.filteredQuestions = [];
      state.questionsBySubject = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    // Utility actions for question management
    addOptionToCurrentQuestion: (state, action: PayloadAction<Option>) => {
      if (state.currentQuestion) {
        state.currentQuestion.options.push(action.payload);
      }
    },
    removeOptionFromCurrentQuestion: (state, action: PayloadAction<number>) => {
      if (state.currentQuestion) {
        state.currentQuestion.options = state.currentQuestion.options.filter(
          option => option.id !== action.payload
        );
      }
    },
    updateOptionInCurrentQuestion: (state, action: PayloadAction<Option>) => {
      if (state.currentQuestion) {
        const index = state.currentQuestion.options.findIndex(
          option => option.id === action.payload.id
        );
        if (index !== -1) {
          state.currentQuestion.options[index] = action.payload;
        }
      }
    },
    // Shuffle questions for random order
    shuffleQuestions: (state) => {
      state.questions = [...state.questions].sort(() => Math.random() - 0.5);
      state.filteredQuestions = [...state.filteredQuestions].sort(() => Math.random() - 0.5);
    },
    // Filter questions based on current filters
    applyFilters: (state) => {
      let filtered = state.questions;

      if (state.filters.subject) {
        filtered = filtered.filter(q => q.subject.id === state.filters.subject);
      }

      if (state.filters.difficulty) {
        filtered = filtered.filter(q => q.difficulty === state.filters.difficulty);
      }

      if (state.filters.question_type) {
        filtered = filtered.filter(q => q.question_type === state.filters.question_type);
      }

      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase();
        filtered = filtered.filter(q =>
          q.question_text.toLowerCase().includes(searchLower)
        );
      }

      state.filteredQuestions = filtered;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.data;
        state.filteredQuestions = action.payload.data;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch questions';
      })
      // Fetch Question By ID
      .addCase(fetchQuestionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch question';
      })
      // Fetch Questions By Subject
      .addCase(fetchQuestionsBySubject.fulfilled, (state, action) => {
        const { subjectId, data } = action.payload;
        state.questionsBySubject[subjectId] = data;
      })
      // Submit Answer
      .addCase(submitAnswer.fulfilled, (state, action) => {
        // Handle answer submission result
        // You might want to store the result in a separate state for analytics
        console.log('Answer submitted:', action.payload);
      });
  },
});

export const {
  setCurrentQuestion,
  setFilters,
  clearFilters,
  setPage,
  setPageSize,
  clearCurrentQuestion,
  clearQuestions,
  clearError,
  addOptionToCurrentQuestion,
  removeOptionFromCurrentQuestion,
  updateOptionInCurrentQuestion,
  shuffleQuestions,
  applyFilters,
} = questionSlice.actions;

// Selectors
export const selectAllQuestions = (state: { questions: QuestionState }) => state.questions.questions;
export const selectFilteredQuestions = (state: { questions: QuestionState }) => state.questions.filteredQuestions;
export const selectCurrentQuestion = (state: { questions: QuestionState }) => state.questions.currentQuestion;
export const selectQuestionsLoading = (state: { questions: QuestionState }) => state.questions.loading;
export const selectQuestionsError = (state: { questions: QuestionState }) => state.questions.error;
export const selectQuestionsFilters = (state: { questions: QuestionState }) => state.questions.filters;
export const selectQuestionsPagination = (state: { questions: QuestionState }) => state.questions.pagination;
export const selectQuestionsBySubject = (subjectId: number) => 
  (state: { questions: QuestionState }) => state.questions.questionsBySubject[subjectId] || [];

export default questionSlice.reducer;