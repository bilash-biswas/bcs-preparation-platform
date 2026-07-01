// lib/store/slices/gamificationSlice.ts - Fixed version
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gamificationApi } from '@/lib/api/services';
import { UserBadge, Challenge, ChallengeWithProgress } from '@/types/index';

interface GamificationState {
  badges: UserBadge[];
  challenges: ChallengeWithProgress[];
  dashboard: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: GamificationState = {
  badges: [],
  challenges: [],
  dashboard: null,
  loading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk(
  'gamification/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationApi.getDashboard();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchChallenges = createAsyncThunk(
  'gamification/fetchChallenges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationApi.getChallenges();
      // Transform the response to include time_remaining and user_progress
      const challengesWithProgress = response.map((challenge: any) => ({
        ...challenge,
        time_remaining: calculateTimeRemaining(challenge.end_date),
        user_progress: challenge.user_progress || null,
      }));
      return challengesWithProgress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch challenges');
    }
  }
);

// Helper function to calculate time remaining
const calculateTimeRemaining = (endDate: string): string => {
  try {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Ended";
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  } catch (error) {
    return "Unknown";
  }
};

export const joinChallenge = createAsyncThunk(
  'gamification/joinChallenge',
  async (challengeId: number, { rejectWithValue }) => {
    try {
      const response = await gamificationApi.joinChallenge(challengeId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join challenge');
    }
  }
);

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.dashboard = null;
      state.badges = [];
    },
    clearChallenges: (state) => {
      state.challenges = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    // Update challenge progress locally
    updateChallengeProgress: (state, action) => {
      const { challengeId, progress } = action.payload;
      const challenge = state.challenges.find(c => c.id === challengeId);
      if (challenge) {
        challenge.user_progress = progress;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
        // Safely access badges with fallback
        state.badges = action.payload?.badges || [];
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard';
        state.badges = [];
      })
      // Fetch Challenges
      .addCase(fetchChallenges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.loading = false;
        state.challenges = action.payload || [];
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch challenges';
        state.challenges = [];
      })
      // Join Challenge
      .addCase(joinChallenge.fulfilled, (state, action) => {
        const { challengeId } = action.payload;
        const challenge = state.challenges.find(c => c.id === challengeId);
        if (challenge) {
          challenge.user_progress = {
            is_completed: false,
            progress_percentage: 0,
          };
        }
      })
      .addCase(joinChallenge.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to join challenge';
      });
  },
});

export const { 
  clearDashboard, 
  clearChallenges, 
  clearError, 
  updateChallengeProgress 
} = gamificationSlice.actions;
export default gamificationSlice.reducer;