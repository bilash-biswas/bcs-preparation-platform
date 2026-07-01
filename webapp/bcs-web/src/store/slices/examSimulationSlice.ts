// store/slices/examSimulationSlice.ts - CORRECTED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { examSimulationApi } from "@/lib/api/services";
import { ExamSimulation } from "@/types/index";

interface ExamAnalysis {
  performance_breakdown: any;
  time_management: any;
  weak_areas: any[];
  improvement_suggestions: string[];
}

interface ExamSimulationState {
  exams: ExamSimulation[];
  currentExam: ExamSimulation | null;
  activeSession: any | null;
  analysis: ExamAnalysis | null;
  questions: any[]; // ADD THIS
  loading: boolean;
  error: string | null;
}

const initialState: ExamSimulationState = {
  exams: [],
  currentExam: null,
  activeSession: null,
  analysis: null,
  questions: [], // ADD THIS
  loading: false,
  error: null,
};

export const fetchExamSimulations = createAsyncThunk(
  "examSimulations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await examSimulationApi.getAll();
      console.log("Fetched exam simulations:", response);

      // FIXED: Properly extract results array from paginated response
      const exams =
        response.data?.results ||
        response.results ||
        response.data ||
        response ||
        [];
      console.log("Extracted exams:", exams);
      console.log("Extracted exams type:", typeof exams);
      console.log("Extracted exams length:", exams.length);
      console.log("First exam:", exams[0]);

      return exams;
    } catch (error: any) {
      console.error("Error fetching exam simulations:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch exam simulations"
      );
    }
  }
);

export const createExamSimulation = createAsyncThunk(
  "examSimulations/create",
  async (examData: any, { rejectWithValue }) => {
    try {
      const response = await examSimulationApi.create(examData);
      // FIXED: Return the actual exam data, not the response wrapper
      return response || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create exam simulation"
      );
    }
  }
);

export const startExamSimulation = createAsyncThunk(
  "examSimulations/start",
  async (examId: number, { rejectWithValue }) => {
    try {
      const response = await examSimulationApi.startSimulation(examId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to start exam simulation"
      );
    }
  }
);

export const fetchExamQuestions = createAsyncThunk(
  "examSimulations/fetchQuestions",
  async (examId: number, { rejectWithValue }) => {
    try {
      const response = await examSimulationApi.getQuestions(examId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch exam questions"
      );
    }
  }
);

export const fetchExamAnalysis = createAsyncThunk(
  "examSimulations/fetchAnalysis",
  async (examId: number, { rejectWithValue }) => {
    try {
      const response = await examSimulationApi.getAnalysis(examId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch exam analysis"
      );
    }
  }
);

const examSimulationSlice = createSlice({
  name: "examSimulations",
  initialState,
  reducers: {
    setCurrentExam: (state, action) => {
      state.currentExam = action.payload;
    },
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
    clearActiveSession: (state) => {
      state.activeSession = null;
    },
    clearAnalysis: (state) => {
      state.analysis = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateSessionProgress: (state, action) => {
      if (state.activeSession) {
        state.activeSession = {
          ...state.activeSession,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exam Simulations
      .addCase(fetchExamSimulations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamSimulations.fulfilled, (state, action) => {
        state.loading = false;
        // FIXED: Store the extracted exams array
        state.exams = Array.isArray(action.payload) ? action.payload : [];
        console.log("✅ Stored exams in state:", state.exams);
        console.log("✅ Number of exams stored:", state.exams.length);
      })
      .addCase(fetchExamSimulations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch exam simulations";
        state.exams = [];
      })
      // Create Exam Simulation
      .addCase(createExamSimulation.fulfilled, (state, action) => {
        if (action.payload) {
          state.exams.push(action.payload);
          console.log("✅ Added new exam to state:", action.payload);
        }
      })
      .addCase(createExamSimulation.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to create exam simulation";
      })
      // Start Exam Simulation
      .addCase(startExamSimulation.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(startExamSimulation.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to start exam simulation";
      })
      // Fetch Exam Analysis
      .addCase(fetchExamAnalysis.fulfilled, (state, action) => {
        state.analysis = action.payload;
      })
      .addCase(fetchExamAnalysis.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to fetch exam analysis";
      })

      .addCase(fetchExamQuestions.fulfilled, (state, action) => {
        state.questions = action.payload.questions || [];
        console.log("✅ Stored questions in state:", state.questions.length);
      })
      .addCase(fetchExamQuestions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to fetch exam questions";
        state.questions = [];
      });
  },
});

export const {
  setCurrentExam,
  clearCurrentExam,
  clearActiveSession,
  clearAnalysis,
  clearError,
  updateSessionProgress,
} = examSimulationSlice.actions;
export default examSimulationSlice.reducer;
