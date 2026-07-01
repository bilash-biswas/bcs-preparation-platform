// lib/store/slices/analyticsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi } from '@/lib/api/services';
import { AnalyticsData, ComparativeAnalysis } from '@/types/index';

interface AnalyticsState {
  learningInsights: AnalyticsData | null;
  comparativeAnalysis: ComparativeAnalysis | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  learningInsights: null,
  comparativeAnalysis: null,
  loading: false,
  error: null,
};

export const fetchLearningInsights = createAsyncThunk(
  'analytics/learningInsights',
  async () => {
    const response = await analyticsApi.getLearningInsights();
    return response;
  }
);

export const fetchComparativeAnalysis = createAsyncThunk(
  'analytics/comparativeAnalysis',
  async () => {
    const response = await analyticsApi.getComparativeAnalysis();
    return response;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.learningInsights = null;
      state.comparativeAnalysis = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearningInsights.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLearningInsights.fulfilled, (state, action) => {
        state.loading = false;
        state.learningInsights = action.payload;
      })
      .addCase(fetchLearningInsights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch insights';
      })
      .addCase(fetchComparativeAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComparativeAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.comparativeAnalysis = action.payload;
      })
      .addCase(fetchComparativeAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comparative analysis';
      });
  },
});

export const { clearAnalytics, clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;