// src/store/slices/practiceSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  PracticeState,
  PracticeSession,
  PracticeSessionQuestion,
} from '../../types';
import PracticeService, {
  CreateSessionData,
} from '../../services/practiceService';
import NetInfo from '@react-native-community/netinfo';

const initialState: PracticeState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  isConnected: true,
  offlineAnswersCount: 0,
  hasPendingSync: false,
};

// Async Thunks
export const setupPracticeNetworkListener = createAsyncThunk(
  'practice/setupNetworkListener',
  async (_, { dispatch }) => {
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setPracticeConnectionStatus(state.isConnected ?? false));

      // Sync offline answers when coming back online
      if (state.isConnected) {
        dispatch(syncPracticeOfflineAnswers());
      }
    });

    return unsubscribe;
  },
);

export const createPracticeSession = createAsyncThunk(
  'practice/createSession',
  async (sessionData: CreateSessionData, { rejectWithValue, dispatch }) => {
    try {
      const session = await PracticeService.createSession(sessionData);
      return session;
    } catch (error: any) {
      const message =
        error.response?.data || 'Failed to create practice session';

      // Check if offline
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        dispatch(
          showPracticeOfflineWarning(
            'Session created offline. Answers will sync when online.',
          ),
        );
      }

      return rejectWithValue(message);
    }
  },
);

export const submitAnswer = createAsyncThunk(
  'practice/submitAnswer',
  async (
    {
      sessionId,
      questionId,
      selectedOptionId,
      timeTaken,
    }: {
      sessionId: number;
      questionId: number;
      selectedOptionId: number;
      timeTaken?: number;
    },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const response = await PracticeService.submitAnswer(
        sessionId,
        questionId,
        selectedOptionId,
        timeTaken,
      );

      // Update offline answers count
      const offlineCount = await PracticeService.getOfflineAnswersCount();
      dispatch(setOfflineAnswersCount(offlineCount));

      // Show offline warning if applicable
      const state = getState() as { practice: PracticeState };
      if (!state.practice.isConnected) {
        dispatch(
          showPracticeOfflineWarning(
            'Answer saved locally. Will sync when online.',
          ),
        );
      }

      return { sessionId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to submit answer');
    }
  },
);

// Add this async thunk in practiceSlice.ts
export const fetchSession = createAsyncThunk(
  'practice/fetchSession',
  async (sessionId: number, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setLoading(true));

      const session = await PracticeService.getSessionDetail(sessionId);

      // Validate session data
      if (!session || !session.session_questions) {
        throw new Error('Invalid session data received');
      }

      return session;
    } catch (error: any) {
      console.error('Fetch session error:', error);

      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch session details';

      return rejectWithValue(message);
    }
  },
);

export const completeSession = createAsyncThunk(
  'practice/completeSession',
  async (
    {
      sessionId,
      totalTimeTaken,
    }: { sessionId: number; totalTimeTaken: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const session = await PracticeService.completeSession(
        sessionId,
        totalTimeTaken,
      );
      return session;
    } catch (error: any) {
      const message = error.response?.data || 'Failed to complete session';

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        dispatch(
          showPracticeOfflineWarning(
            'Session completed offline. Results will sync when online.',
          ),
        );
        // Return current session as completed
        const currentSession = await PracticeService.getCurrentSession();
        if (currentSession && currentSession.id === sessionId) {
          return {
            ...currentSession,
            is_completed: true,
            completed_at: new Date().toISOString(),
            time_taken: totalTimeTaken.toString(),
          };
        }
      }

      return rejectWithValue(message);
    }
  },
);

export const getUserSessions = createAsyncThunk(
  'practice/getUserSessions',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const sessions = await PracticeService.getUserSessions();
      return sessions;
    } catch (error: any) {
      const message = error.response?.data || 'Failed to fetch user sessions';

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        dispatch(showPracticeOfflineWarning('Sessions fetched offline.'));
      }

      return rejectWithValue(message);
    }
  },
);

export const getSessionDetail = createAsyncThunk(
  'practice/getSessionDetail',
  async (sessionId: number, { rejectWithValue, dispatch }) => {
    try {
      const session = await PracticeService.getSessionDetail(sessionId);
      return session;
    } catch (error: any) {
      const message = error.response?.data || 'Failed to fetch session details';

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        dispatch(
          showPracticeOfflineWarning('Session details fetched offline.'),
        );
      }

      return rejectWithValue(message);
    }
  },
);

export const syncPracticeOfflineAnswers = createAsyncThunk(
  'practice/syncOfflineAnswers',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await PracticeService.syncOfflineAnswers();
      dispatch(setOfflineAnswersCount(0));
      dispatch(setHasPendingSync(false));
      return 'Offline answers synced successfully';
    } catch (error: any) {
      return rejectWithValue('Failed to sync offline answers');
    }
  },
);

export const loadCurrentSession = createAsyncThunk(
  'practice/loadCurrentSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await PracticeService.getCurrentSession();
      return session;
    } catch (error: any) {
      return rejectWithValue('Failed to load current session');
    }
  },
);

export const clearPracticeCache = createAsyncThunk(
  'practice/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      await PracticeService.clearPracticeCache();
      return 'Practice cache cleared successfully';
    } catch (error: any) {
      return rejectWithValue('Failed to clear practice cache');
    }
  },
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    clearCurrentSession: state => {
      state.currentSession = null;
    },
    setCurrentSession: (state, action: PayloadAction<PracticeSession>) => {
      state.currentSession = action.payload;
    },
    // In practiceSlice.ts - Fix the type safety issue
    updateSessionQuestion: (
      state,
      action: PayloadAction<{
        sessionId: number;
        questionId: number;
        userAnswerId: number;
        isCorrect: boolean;
        timeTaken?: number;
      }>,
    ) => {
      const { sessionId, questionId, userAnswerId, isCorrect, timeTaken } =
        action.payload;

      // Update in current session - FIXED VERSION
      if (state.currentSession && state.currentSession.id === sessionId) {
        const questionIndex = state.currentSession.session_questions.findIndex(
          q => q.question === questionId, // This should match your data structure
        );

        if (questionIndex !== -1) {
          // Use proper type-safe assignment
          state.currentSession.session_questions[questionIndex] = {
            ...state.currentSession.session_questions[questionIndex],
            user_answer: userAnswerId,
            is_correct: isCorrect,
            time_taken: timeTaken
              ? timeTaken.toString()
              : state.currentSession.session_questions[questionIndex]
                  .time_taken,
          };

          // Update session stats
          state.currentSession.completed_questions += 1;
          if (isCorrect) {
            state.currentSession.correct_answers += 1;
          } else {
            state.currentSession.wrong_answers += 1;
          }

          state.currentSession.score =
            state.currentSession.completed_questions > 0
              ? (state.currentSession.correct_answers /
                  state.currentSession.completed_questions) *
                100
              : 0;
        }
      }
    },
    clearPracticeState: state => {
      state.sessions = [];
      state.currentSession = null;
      state.isLoading = false;
      state.error = null;
      state.offlineAnswersCount = 0;
      state.hasPendingSync = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    setPracticeConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.hasPendingSync = state.offlineAnswersCount > 0;
      }
    },
    setOfflineAnswersCount: (state, action: PayloadAction<number>) => {
      state.offlineAnswersCount = action.payload;
      state.hasPendingSync = action.payload > 0;
    },
    setHasPendingSync: (state, action: PayloadAction<boolean>) => {
      state.hasPendingSync = action.payload;
    },
    showPracticeOfflineWarning: (state, action) => {
      // This would trigger a UI component to show the warning
      console.log('Practice offline warning:', action.payload);
    },
  },
  extraReducers: builder => {
    builder
      // Network Listener
      .addCase(setupPracticeNetworkListener.fulfilled, state => {
        // Listener setup complete
      })

      // Create Practice Session
      .addCase(createPracticeSession.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPracticeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        if (!state.sessions.find(s => s.id === action.payload.id)) {
          state.sessions.unshift(action.payload);
        }
      })
      .addCase(createPracticeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Submit Answer
      .addCase(submitAnswer.pending, state => {
        state.isLoading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isLoading = false;
        const { sessionId, session_stats } = action.payload;

        // Update session in list
        const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
          state.sessions[sessionIndex].completed_questions =
            session_stats.completed_questions;
          state.sessions[sessionIndex].correct_answers =
            session_stats.correct_answers;
          state.sessions[sessionIndex].wrong_answers =
            session_stats.wrong_answers;
        }

        // Update current session if it matches
        if (state.currentSession && state.currentSession.id === sessionId) {
          state.currentSession.completed_questions =
            session_stats.completed_questions;
          state.currentSession.correct_answers = session_stats.correct_answers;
          state.currentSession.wrong_answers = session_stats.wrong_answers;
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Complete Session
      .addCase(completeSession.pending, state => {
        state.isLoading = true;
      })
      .addCase(completeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSession = action.payload;

        // Update in sessions list
        const sessionIndex = state.sessions.findIndex(
          s => s.id === updatedSession.id,
        );
        if (sessionIndex !== -1) {
          state.sessions[sessionIndex] = updatedSession;
        } else {
          state.sessions.unshift(updatedSession);
        }

        // Update current session
        if (
          state.currentSession &&
          state.currentSession.id === updatedSession.id
        ) {
          state.currentSession = updatedSession;
        }
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get User Sessions
      .addCase(getUserSessions.pending, state => {
        state.isLoading = true;
      })
      .addCase(getUserSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(getUserSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get Session Detail
      .addCase(getSessionDetail.pending, state => {
        state.isLoading = true;
      })
      .addCase(getSessionDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
      })
      .addCase(getSessionDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load Current Session
      .addCase(loadCurrentSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentSession = action.payload;
        }
      })
      .addCase(fetchSession.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentSession = null;
      })

      // Sync Offline Answers
      .addCase(syncPracticeOfflineAnswers.fulfilled, state => {
        state.offlineAnswersCount = 0;
        state.hasPendingSync = false;
      })

      // Clear Cache
      .addCase(clearPracticeCache.fulfilled, state => {
        // Cache cleared
      });
  },
});

export const {
  clearCurrentSession,
  setCurrentSession,
  updateSessionQuestion,
  clearPracticeState,
  setLoading,
  clearError,
  setPracticeConnectionStatus,
  setOfflineAnswersCount,
  setHasPendingSync,
  showPracticeOfflineWarning,
} = practiceSlice.actions;

export default practiceSlice.reducer;
