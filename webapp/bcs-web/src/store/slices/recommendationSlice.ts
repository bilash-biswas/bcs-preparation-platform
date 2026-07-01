// lib/store/slices/recommendationSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recommendationApi } from '@/lib/api/services';
import { LearningRecommendation } from '@/types/index';

interface RecommendationState {
  recommendations: LearningRecommendation[];
  loading: boolean;
  error: string | null;
}

const initialState: RecommendationState = {
  recommendations: [],
  loading: false,
  error: null,
};

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetchAll',
  async () => {
    const response = await recommendationApi.getAll();
    return response;
  }
);

export const generateRecommendations = createAsyncThunk(
  'recommendations/generate',
  async () => {
    const response = await recommendationApi.generate();
    return response;
  }
);

export const markRecommendationCompleted = createAsyncThunk(
  'recommendations/markCompleted',
  async (id: number) => {
    await recommendationApi.markCompleted(id);
    return id;
  }
);

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch recommendations';
      })
      .addCase(generateRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(markRecommendationCompleted.fulfilled, (state, action) => {
        const recommendationId = action.payload;
        state.recommendations = state.recommendations.map(rec =>
          rec.id === recommendationId ? { ...rec, is_completed: true } : rec
        );
      });
  },
});

export const { clearRecommendations, clearError } = recommendationSlice.actions;
export default recommendationSlice.reducer;