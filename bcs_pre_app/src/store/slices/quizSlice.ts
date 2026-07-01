// src/store/slices/quizSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { QuizState, Quiz, QuizAttempt, Question } from '../../types';
import QuizService from '../../services/quizService';

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  quizAttempts: [],
  isLoading: false,
  error: null,
};

export const fetchQuizzes = createAsyncThunk(
  'quiz/fetchQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const quizzes = await QuizService.getQuizzes();
      return quizzes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quizzes');
    }
  }
);

export const fetchAvailableQuizzes = createAsyncThunk(
  'quiz/fetchAvailableQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const quizzes = await QuizService.getAvailableQuizzes();
      return quizzes;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available quizzes');
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quiz/fetchQuizById',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const quiz = await QuizService.getQuizById(quizId);
      return quiz;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quiz');
    }
  }
);

export const startQuizAttempt = createAsyncThunk(
  'quiz/startQuizAttempt',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const result = await QuizService.startQuiz(quizId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start quiz');
    }
  }
);

export const fetchQuizAttempts = createAsyncThunk(
  'quiz/fetchQuizAttempts',
  async (_, { rejectWithValue }) => {
    try {
      const attempts = await QuizService.getQuizAttempts();
      return attempts;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quiz attempts');
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setCurrentQuiz: (state, action) => {
      state.currentQuiz = action.payload;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetQuizState: (state) => {
      state.quizzes = [];
      state.currentQuiz = null;
      state.quizAttempts = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Available Quizzes
      .addCase(fetchAvailableQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchAvailableQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Quiz by ID
      .addCase(fetchQuizById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(fetchQuizById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Start Quiz Attempt
      .addCase(startQuizAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startQuizAttempt.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(startQuizAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Quiz Attempts
      .addCase(fetchQuizAttempts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizAttempts = action.payload;
      })
      .addCase(fetchQuizAttempts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentQuiz, 
  clearCurrentQuiz, 
  clearError, 
  resetQuizState 
} = quizSlice.actions;
export default quizSlice.reducer;