import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SubjectState, Subject } from '../../types';
import SubjectService from '../../services/subjectService';

interface SubjectPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const initialState: SubjectState & {
  pagination: SubjectPagination;
} = {
  subjects: [],
  currentSubject: null,
  filteredSubjects: [],
  isLoading: false,
  error: null,
  filters: {
    category: null,
    searchQuery: '',
    difficulty: 'all',
    isActive: true,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  },
};

// Async Thunks
export const fetchSubjects = createAsyncThunk(
  'subject/fetchSubjects',
  async (filters: {
    page?: number;
    page_size?: number;
    category_id?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await SubjectService.getSubjects(filters);
      return {
        subjects: response.subjects,
        pagination: response.pagination || {
          current_page: filters.page || 1,
          total_pages: Math.ceil((response.count || response.subjects.length) / (filters.page_size || 20)),
          count: response.count || response.subjects.length,
        }
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch subjects',
      );
    }
  },
);

export const fetchSubjectsByCategory = createAsyncThunk(
  'subject/fetchSubjectsByCategory',
  async (payload: {
    categoryId: number;
    page?: number;
    pageSize?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await SubjectService.getSubjectsByCategory(
        payload.categoryId, 
        payload.page, 
        payload.pageSize
      );
      return {
        subjects: response.subjects,
        pagination: response.pagination || {
          current_page: payload.page || 1,
          total_pages: Math.ceil((response.count || response.subjects.length) / (payload.pageSize || 20)),
          count: response.count || response.subjects.length,
        },
        categoryId: payload.categoryId
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch subjects by category',
      );
    }
  },
);

export const fetchSubjectById = createAsyncThunk(
  'subject/fetchSubjectById',
  async (subjectId: number, { rejectWithValue }) => {
    try {
      const subject = await SubjectService.getSubjectById(subjectId);
      return subject;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch subject');
    }
  },
);

export const fetchSubjectWithDetails = createAsyncThunk(
  'subject/fetchSubjectWithDetails',
  async (subjectId: number, { rejectWithValue }) => {
    try {
      const subject = await SubjectService.getSubjectWithDetails(subjectId);
      return subject;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch subject details',
      );
    }
  },
);

const subjectSlice = createSlice({
  name: 'subject',
  initialState,
  reducers: {
    // Set current subject
    setCurrentSubject: (state, action: PayloadAction<Subject | null>) => {
      state.currentSubject = action.payload;
    },

    // Clear current subject
    clearCurrentSubject: state => {
      state.currentSubject = null;
    },

    // Filter subjects
    filterSubjects: (
      state,
      action: PayloadAction<{
        category?: number | null;
        searchQuery?: string;
        difficulty?: 'all' | 'easy' | 'medium' | 'hard';
        isActive?: boolean;
      }>,
    ) => {
      const { category, searchQuery, difficulty, isActive } = action.payload;

      // Update filters
      if (category !== undefined) state.filters.category = category;
      if (searchQuery !== undefined) state.filters.searchQuery = searchQuery;
      if (difficulty !== undefined) state.filters.difficulty = difficulty;
      if (isActive !== undefined) state.filters.isActive = isActive;

      // Apply filters
      state.filteredSubjects = state.subjects.filter(subject => {
        // Category filter
        if (
          state.filters.category &&
          subject.category !== state.filters.category
        ) {
          return false;
        }

        // Search filter
        if (state.filters.searchQuery) {
          const query = state.filters.searchQuery.toLowerCase();
          const matchesName = subject.name.toLowerCase().includes(query);
          const matchesDescription = subject.description
            .toLowerCase()
            .includes(query);
          if (!matchesName && !matchesDescription) {
            return false;
          }
        }

        // Active filter
        if (
          state.filters.isActive !== undefined &&
          subject.is_active !== state.filters.isActive
        ) {
          return false;
        }

        return true;
      });

      // Sort by priority and name
      state.filteredSubjects.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.name.localeCompare(b.name);
      });
    },

    // Clear filters
    clearFilters: state => {
      state.filters = {
        category: null,
        searchQuery: '',
        difficulty: 'all',
        isActive: true,
      };
      state.filteredSubjects = state.subjects;
    },

    // Sort subjects
    sortSubjects: (
      state,
      action: PayloadAction<
        'name' | 'priority' | 'total_questions' | 'created_at'
      >,
    ) => {
      const sortBy = action.payload;

      state.filteredSubjects.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'priority':
            return b.priority - a.priority; // Higher priority first
          case 'total_questions':
            return b.total_questions - a.total_questions;
          default:
            return 0;
        }
      });
    },

    // Search subjects
    searchSubjects: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;

      if (!action.payload) {
        state.filteredSubjects = state.subjects;
      } else {
        const query = action.payload.toLowerCase();
        state.filteredSubjects = state.subjects.filter(
          subject =>
            subject.name.toLowerCase().includes(query) ||
            subject.description.toLowerCase().includes(query),
        );
      }
    },

    // Set pagination
    setSubjectPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },

    setSubjectPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1;
    },

    // Add more subjects (for infinite scroll)
    addMoreSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.subjects = [...state.subjects, ...action.payload];
      state.filteredSubjects = [...state.filteredSubjects, ...action.payload];
    },

    // Clear subject state
    clearSubjectState: state => {
      state.subjects = [];
      state.filteredSubjects = [];
      state.currentSubject = null;
      state.isLoading = false;
      state.error = null;
      state.filters = {
        category: null,
        searchQuery: '',
        difficulty: 'all',
        isActive: true,
      };
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 20,
        hasNext: false,
        hasPrevious: false,
      };
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Subjects
      .addCase(fetchSubjects.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.isLoading = false;

        const { subjects, pagination } = action.payload;
        
        // Replace subjects for first page, append for subsequent pages
        if (pagination.current_page === 1) {
          state.subjects = Array.isArray(subjects) ? subjects : [];
        } else {
          state.subjects = [...state.subjects, ...(Array.isArray(subjects) ? subjects : [])];
        }
        
        state.filteredSubjects = state.subjects;

        if (pagination) {
          state.pagination = {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.total_pages || 1,
            totalCount: pagination.count || subjects.length,
            pageSize: state.pagination.pageSize,
            hasNext: !!pagination.next,
            hasPrevious: !!pagination.previous,
          };
        }
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Subjects By Category
      .addCase(fetchSubjectsByCategory.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchSubjectsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;

        const { subjects, pagination, categoryId } = action.payload;
        
        // Replace subjects for first page, append for subsequent pages
        if (pagination.current_page === 1) {
          state.subjects = Array.isArray(subjects) ? subjects : [];
        } else {
          state.subjects = [...state.subjects, ...(Array.isArray(subjects) ? subjects : [])];
        }
        
        state.filteredSubjects = state.subjects;
        state.filters.category = categoryId;

        if (pagination) {
          state.pagination = {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.total_pages || 1,
            totalCount: pagination.count || subjects.length,
            pageSize: state.pagination.pageSize,
            hasNext: !!pagination.next,
            hasPrevious: !!pagination.previous,
          };
        }
      })
      .addCase(fetchSubjectsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Subject By ID
      .addCase(fetchSubjectById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubject = action.payload;
      })
      .addCase(fetchSubjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Subject With Details
      .addCase(fetchSubjectWithDetails.fulfilled, (state, action) => {
        state.currentSubject = action.payload;
      })
      .addCase(fetchSubjectWithDetails.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentSubject,
  clearCurrentSubject,
  filterSubjects,
  clearFilters,
  sortSubjects,
  searchSubjects,
  setSubjectPage,
  setSubjectPageSize,
  addMoreSubjects,
  clearSubjectState,
  setLoading,
  clearError,
} = subjectSlice.actions;

export default subjectSlice.reducer;