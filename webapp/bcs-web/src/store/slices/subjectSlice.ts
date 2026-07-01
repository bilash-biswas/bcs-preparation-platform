// lib/store/slices/subjectSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { subjectApi } from '@/lib/api/services';
import { Subject } from '@/types/index';

interface SubjectState {
  subjects: Subject[];
  selectedSubject: Subject | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubjectState = {
  subjects: [],
  selectedSubject: null,
  loading: false,
  error: null,
};

export const fetchAllSubjects = createAsyncThunk(
  'subjects/fetchAll',
  async (params?: any) => {
    const response = await subjectApi.getAll(params);
    console.log(response);
    return response;
  }
);

export const fetchSubjectById = createAsyncThunk(
  'subjects/fetchById',
  async (id: number) => {
    const response = await subjectApi.getById(id);
    return response;
  }
);

const subjectSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
    },
    clearSubjects: (state) => {
      state.subjects = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchAllSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch subjects';
      })
      .addCase(fetchSubjectById.fulfilled, (state, action) => {
        state.selectedSubject = action.payload;
      });
  },
});

export const { setSelectedSubject, clearSubjects, clearError } = subjectSlice.actions;
export default subjectSlice.reducer;