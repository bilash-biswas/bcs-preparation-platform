// src/store/slices/leaderboardSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface LeaderboardEntry {
  id: number;
  username: string;
  total_score: number;
  total_attempts: number;
  average_accuracy: number;
}

interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  leaderboard: [],
  loading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (timeframe: 'weekly' | 'monthly', { rejectWithValue }) => {
    try {
      const endpoint = timeframe === 'weekly' 
        ? '/leaderboard/' 
        : '/leaderboard/monthly/';
      
      const response = await api.get(endpoint);
      
      // Handle both array and object responses
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data);
      
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'লিডারবোর্ড লোড করতে সমস্যা হয়েছে'
      );
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
        state.error = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;