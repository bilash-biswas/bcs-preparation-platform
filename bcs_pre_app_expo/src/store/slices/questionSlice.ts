import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Question } from '../../types';
import QuestionService from '../../services/questionService';

interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    subject?: string;
    difficulty?: string;
    search?: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  },
};

// Async Thunks
export const fetchQuestions = createAsyncThunk(
  'question/fetchQuestions',
  async (filters: {
    page?: number;
    page_size?: number;
    subject?: string;
    difficulty?: string;
    search?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await QuestionService.getQuestions(filters);
      return {
        questions: response.questions || response.results || response,
        pagination: response.pagination || {
          current_page: filters.page || 1,
          total_pages: Math.ceil((response.count || response.length) / (filters.page_size || 10)),
          count: response.count || response.length,
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch questions');
    }
  }
);

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question | null>) => {
      state.currentQuestion = action.payload;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
    setFilters: (state, action: PayloadAction<QuestionState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when changing page size
    },
    clearError: (state) => {
      state.error = null;
    },
    clearQuestions: (state) => {
      state.questions = [];
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 20,
        hasNext: false,
        hasPrevious: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const { questions, pagination } = action.payload;
        
        state.questions = Array.isArray(questions) ? questions : [];
        
        if (pagination) {
          state.pagination = {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.total_pages || 1,
            totalCount: pagination.count || questions.length,
            pageSize: state.pagination.pageSize,
            hasNext: !!pagination.next,
            hasPrevious: !!pagination.previous,
          };
        } else {
          // Fallback for non-paginated responses
          state.pagination = {
            currentPage: 1,
            totalPages: 1,
            totalCount: questions.length,
            pageSize: state.pagination.pageSize,
            hasNext: false,
            hasPrevious: false,
          };
        }
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.questions = [];
        state.pagination = {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          pageSize: state.pagination.pageSize,
          hasNext: false,
          hasPrevious: false,
        };
      });
  },
});

export const {
  setCurrentQuestion,
  clearCurrentQuestion,
  setFilters,
  clearFilters,
  setPage,
  setPageSize,
  clearError,
  clearQuestions,
} = questionSlice.actions;

export default questionSlice.reducer;