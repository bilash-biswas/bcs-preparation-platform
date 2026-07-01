import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adaptiveLearningApi } from '@/lib/api/services';
import { AdaptiveSession, AdaptiveResponse } from '@/types/index';

interface AdaptiveLearningState {
  currentSession: AdaptiveSession | null;
  abilityEstimate: number;
  loading: boolean;
  error: string | null;
}

const initialState: AdaptiveLearningState = {
  currentSession: null,
  abilityEstimate: 0.5,
  loading: false,
  error: null,
};

export const startAdaptiveSession = createAsyncThunk(
  'adaptiveLearning/startSession',
  async (sessionData: { subjectId: number; questionCount: number }, { rejectWithValue }) => {
    try {
      const response = await adaptiveLearningApi.startSession(sessionData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start adaptive session');
    }
  }
);

export const getNextAdaptiveQuestion = createAsyncThunk(
  'adaptiveLearning/nextQuestion',
  async (sessionData: any, { rejectWithValue }) => {
    try {
      const response = await adaptiveLearningApi.getNextQuestion(sessionData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get next question');
    }
  }
);

export const submitAdaptiveAnswer = createAsyncThunk(
  'adaptiveLearning/submitAnswer',
  async (answerData: {
    sessionId: number;
    questionId: number;
    selectedOption: number;
    responseTime: number;
  }, { rejectWithValue }) => {
    try {
      const response = await adaptiveLearningApi.submitAnswer(answerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit answer');
    }
  }
);

const adaptiveLearningSlice = createSlice({
  name: 'adaptiveLearning',
  initialState,
  reducers: {
    clearSession: (state) => {
      state.currentSession = null;
      state.abilityEstimate = 0.5;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAbilityEstimate: (state, action) => {
      state.abilityEstimate = action.payload;
    },
    updateSessionProgress: (state, action) => {
      if (state.currentSession) {
        state.currentSession = {
          ...state.currentSession,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Start Adaptive Session
      .addCase(startAdaptiveSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startAdaptiveSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.abilityEstimate = action.payload.ability_estimate || 0.5;
      })
      .addCase(startAdaptiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to start adaptive session';
      })
      // Get Next Adaptive Question
      .addCase(getNextAdaptiveQuestion.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNextAdaptiveQuestion.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentSession && action.payload) {
          if (action.payload.session_completed) {
            // Session completed
            state.currentSession = null;
          } else if (action.payload.next_question) {
            // Update with next question
            state.currentSession.current_question = action.payload.next_question;
            state.currentSession.ability_estimate = action.payload.ability_estimate;
            state.currentSession.questions_answered = action.payload.questions_answered;
            state.currentSession.correct_answers = action.payload.correct_answers;
            state.abilityEstimate = action.payload.ability_estimate;
          }
        }
      })
      .addCase(getNextAdaptiveQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to get next question';
      })
      // Submit Adaptive Answer
      .addCase(submitAdaptiveAnswer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAdaptiveAnswer.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentSession && action.payload) {
          if (action.payload.session_completed) {
            // Session completed
            state.currentSession = null;
          } else {
            // Update session with new data
            state.currentSession.ability_estimate = action.payload.ability_estimate;
            state.currentSession.questions_answered = action.payload.questions_answered;
            state.currentSession.correct_answers = action.payload.correct_answers;
            state.currentSession.current_question = action.payload.next_question;
            state.abilityEstimate = action.payload.ability_estimate;
          }
        }
      })
      .addCase(submitAdaptiveAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to submit answer';
      });
  },
});

export const {
  clearSession,
  clearError,
  updateAbilityEstimate,
  updateSessionProgress,
} = adaptiveLearningSlice.actions;
export default adaptiveLearningSlice.reducer;