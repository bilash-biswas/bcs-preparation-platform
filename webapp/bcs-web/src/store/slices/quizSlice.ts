// lib/store/slices/quizSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { quizApi, quizAttemptApi } from '@/lib/api/services';
import { Quiz, QuizAttempt } from '@/types/index';

interface QuizState {
  quizzes: Quiz[];
  availableQuizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizAttempts: QuizAttempt[];
  currentAttempt: QuizAttempt | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  availableQuizzes: [],
  currentQuiz: null,
  quizAttempts: [],
  currentAttempt: null,
  loading: false,
  error: null,
};

export const fetchQuizzes = createAsyncThunk(
  'quizzes/fetchAll',
  async () => {
    const response = await quizApi.getAll();
    return response;
  }
);

export const fetchAvailableQuizzes = createAsyncThunk(
  'quizzes/fetchAvailable',
  async () => {
    const response = await quizApi.getAvailable();
    return response.data;
  }
);

export const startQuiz = createAsyncThunk(
  'quizzes/start',
  async (quizId: number) => {
    const response = await quizApi.startQuiz(quizId);
    return response.data;
  }
);

export const fetchQuizQuestions = createAsyncThunk(
  'quizzes/fetchQuestions',
  async (quizId: number) => {
    const response = await quizApi.getQuestions(quizId);
    return response.data;
  }
);

export const fetchQuizAttempts = createAsyncThunk(
  'quizzes/fetchAttempts',
  async () => {
    const response = await quizAttemptApi.getAll();
    return response;
  }
);

export const submitQuizAnswer = createAsyncThunk(
  'quizzes/submitAnswer',
  async ({ attemptId, data }: { attemptId: number; data: any }) => {
    const response = await quizAttemptApi.submitAnswer(attemptId, data);
    return response.data;
  }
);

export const completeQuizAttempt = createAsyncThunk(
  'quizzes/completeAttempt',
  async (attemptId: number) => {
    const response = await quizAttemptApi.completeAttempt(attemptId);
    return response.data;
  }
);

const quizSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    setCurrentQuiz: (state, action) => {
      state.currentQuiz = action.payload;
    },
    setCurrentAttempt: (state, action) => {
      state.currentAttempt = action.payload;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
    },
    clearCurrentAttempt: (state) => {
      state.currentAttempt = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch quizzes';
      })
      // Fetch Available Quizzes
      .addCase(fetchAvailableQuizzes.fulfilled, (state, action) => {
        state.availableQuizzes = action.payload;
      })
      // Start Quiz
      .addCase(startQuiz.fulfilled, (state, action) => {
        state.currentAttempt = action.payload;
      })
      // Fetch Quiz Attempts
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.quizAttempts = action.payload;
      })
      // Complete Quiz Attempt
      .addCase(completeQuizAttempt.fulfilled, (state, action) => {
        state.currentAttempt = action.payload;
        // Update the attempt in the list
        const index = state.quizAttempts.findIndex(
          attempt => attempt.id === action.payload.id
        );
        if (index !== -1) {
          state.quizAttempts[index] = action.payload;
        } else {
          state.quizAttempts.push(action.payload);
        }
      });
  },
});

export const {
  setCurrentQuiz,
  setCurrentAttempt,
  clearCurrentQuiz,
  clearCurrentAttempt,
  clearError,
} = quizSlice.actions;
export default quizSlice.reducer;