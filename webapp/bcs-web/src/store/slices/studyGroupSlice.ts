// lib/store/slices/studyGroupSlice.ts - Fixed version
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studyGroupApi } from '@/lib/api/services';
import { StudyGroup } from '@/types/index';

interface StudyGroupState {
  studyGroups: StudyGroup[];
  currentStudyGroup: StudyGroup | null;
  groupActivities: any[];
  loading: boolean;
  error: string | null;
}

const initialState: StudyGroupState = {
  studyGroups: [],
  currentStudyGroup: null,
  groupActivities: [],
  loading: false,
  error: null,
};

export const fetchStudyGroups = createAsyncThunk(
  'studyGroups/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studyGroupApi.getAll();
      // Ensure we return an array
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch study groups');
    }
  }
);

export const createStudyGroup = createAsyncThunk(
  'studyGroups/create',
  async (groupData: any, { rejectWithValue }) => {
    try {
      const response = await studyGroupApi.create(groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create study group');
    }
  }
);

export const joinStudyGroup = createAsyncThunk(
  'studyGroups/join',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await studyGroupApi.join(groupId);
      return { groupId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join study group');
    }
  }
);

export const fetchGroupActivities = createAsyncThunk(
  'studyGroups/fetchActivities',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await studyGroupApi.getActivities(groupId);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group activities');
    }
  }
);

const studyGroupSlice = createSlice({
  name: 'studyGroups',
  initialState,
  reducers: {
    setCurrentStudyGroup: (state, action) => {
      state.currentStudyGroup = action.payload;
    },
    clearCurrentStudyGroup: (state) => {
      state.currentStudyGroup = null;
    },
    clearStudyGroups: (state) => {
      state.studyGroups = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Study Groups
      .addCase(fetchStudyGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.studyGroups = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchStudyGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch study groups';
        state.studyGroups = [];
      })
      // Create Study Group
      .addCase(createStudyGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudyGroup.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object') {
          state.studyGroups.push(action.payload);
        }
      })
      .addCase(createStudyGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create study group';
      })
      // Join Study Group
      .addCase(joinStudyGroup.fulfilled, (state, action) => {
        const { groupId } = action.payload;
        const group = state.studyGroups.find(g => g.id === groupId);
        if (group) {
          group.is_member = true;
          group.member_count = (group.member_count || 0) + 1;
        }
      })
      // Fetch Group Activities
      .addCase(fetchGroupActivities.fulfilled, (state, action) => {
        state.groupActivities = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { 
  setCurrentStudyGroup, 
  clearCurrentStudyGroup, 
  clearStudyGroups,
  clearError 
} = studyGroupSlice.actions;
export default studyGroupSlice.reducer;