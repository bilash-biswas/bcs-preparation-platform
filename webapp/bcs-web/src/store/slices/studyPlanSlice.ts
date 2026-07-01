import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studyPlanApi } from "@/lib/api/services";
import { SmartStudyPlan, StudyPlanProgress } from "@/types/index";

interface StudyPlanWithProgress extends SmartStudyPlan {
  progress?: StudyPlanProgress;
  schedule?: any;
}

interface StudyPlanState {
  studyPlans: SmartStudyPlan[];
  currentStudyPlan: StudyPlanWithProgress | null;
  loading: boolean;
  error: string | null;
}

const initialState: StudyPlanState = {
  studyPlans: [],
  currentStudyPlan: null,
  loading: false,
  error: null,
};

export const fetchStudyPlans = createAsyncThunk(
  "studyPlans/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await studyPlanApi.getAll();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch study plans");
    }
  }
);

export const createStudyPlan = createAsyncThunk(
  "studyPlans/create",
  async (studyPlanData: any, { rejectWithValue }) => {
    try {
      const response = await studyPlanApi.create(studyPlanData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create study plan");
    }
  }
);

export const generateStudySchedule = createAsyncThunk(
  "studyPlans/generateSchedule",
  async (studyPlanId: number, { rejectWithValue }) => {
    try {
      const response = await studyPlanApi.generateSchedule(studyPlanId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate schedule");
    }
  }
);

export const fetchStudyPlanProgress = createAsyncThunk(
  "studyPlans/fetchProgress",
  async (studyPlanId: number, { rejectWithValue }) => {
    try {
      const response = await studyPlanApi.getProgress(studyPlanId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch progress");
    }
  }
);

const studyPlanSlice = createSlice({
  name: "studyPlans",
  initialState,
  reducers: {
    setCurrentStudyPlan: (state, action) => {
      state.currentStudyPlan = action.payload;
    },
    clearCurrentStudyPlan: (state) => {
      state.currentStudyPlan = null;
    },
    clearStudyPlans: (state) => {
      state.studyPlans = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    updateStudyPlanProgress: (state, action) => {
      if (state.currentStudyPlan) {
        state.currentStudyPlan.progress = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Study Plans
      .addCase(fetchStudyPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.studyPlans = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchStudyPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch study plans";
        state.studyPlans = [];
      })
      // Create Study Plan
      .addCase(createStudyPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudyPlan.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object') {
          state.studyPlans.push(action.payload);
        }
      })
      .addCase(createStudyPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to create study plan";
      })
      // Generate Schedule
      .addCase(generateStudySchedule.fulfilled, (state, action) => {
        if (state.currentStudyPlan) {
          state.currentStudyPlan.schedule = action.payload;
        }
      })
      // Fetch Progress
      .addCase(fetchStudyPlanProgress.fulfilled, (state, action) => {
        if (state.currentStudyPlan) {
          state.currentStudyPlan.progress = action.payload;
        }
      });
  },
});

export const {
  setCurrentStudyPlan,
  clearCurrentStudyPlan,
  clearStudyPlans,
  clearError,
  updateStudyPlanProgress,
} = studyPlanSlice.actions;
export default studyPlanSlice.reducer;