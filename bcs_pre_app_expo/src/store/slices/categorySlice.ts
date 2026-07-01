import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CategoryState, Category } from '../../types';
import CategoryService from '../../services/categoryService';

interface CategoryPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const initialState: CategoryState & {
  pagination: CategoryPagination;
} = {
  categories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
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
export const fetchCategories = createAsyncThunk(
  'category/fetchCategories',
  async (filters: {
    page?: number;
    page_size?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getCategories(filters);
      return {
        categories: response.categories,
        pagination: response.pagination || {
          current_page: filters.page || 1,
          total_pages: Math.ceil((response.count || response.categories.length) / (filters.page_size || 20)),
          count: response.count || response.categories.length,
        }
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch categories',
      );
    }
  },
);

export const fetchCategoriesWithCounts = createAsyncThunk(
  'category/fetchCategoriesWithCounts',
  async (filters: {
    page?: number;
    page_size?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getCategoriesWithCounts(filters);
      return {
        categories: response.categories,
        pagination: response.pagination || {
          current_page: filters.page || 1,
          total_pages: Math.ceil((response.count || response.categories.length) / (filters.page_size || 20)),
          count: response.count || response.categories.length,
        }
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch categories with counts',
      );
    }
  },
);

export const fetchCategoryStatistics = createAsyncThunk(
  'category/fetchCategoryStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const statistics = await CategoryService.getCategoryStatistics();
      return statistics;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch category statistics',
      );
    }
  },
);

export const fetchCategoryById = createAsyncThunk(
  'category/fetchCategoryById',
  async (categoryId: number, { rejectWithValue }) => {
    try {
      const category = await CategoryService.getCategoryById(categoryId);
      return category;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || 'Failed to fetch category',
      );
    }
  },
);

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    // Set current category
    setCurrentCategory: (state, action: PayloadAction<Category | null>) => {
      state.currentCategory = action.payload;
    },

    // Clear current category
    clearCurrentCategory: state => {
      state.currentCategory = null;
    },

    // Set pagination
    setCategoryPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },

    setCategoryPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1;
    },

    // Add more categories (for infinite scroll)
    addMoreCategories: (state, action: PayloadAction<Category[]>) => {
      if (Array.isArray(state.categories)) {
        state.categories = [...state.categories, ...action.payload];
      } else {
        // If categories is a paginated response object, handle accordingly
        state.categories = action.payload as any;
      }
    },

    // Clear category state
    clearCategoryState: state => {
      state.categories = [];
      state.currentCategory = null;
      state.isLoading = false;
      state.error = null;
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

    // Filter categories by search
    filterCategories: (state, action: PayloadAction<string>) => {
      // This is just a helper - actual filtering should be done in components
      // But we can store the filter state if needed
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;

        const { categories, pagination } = action.payload;
        
        // Handle categories data
        if (Array.isArray(categories)) {
          // Replace categories for first page, append for subsequent pages
          if (pagination.current_page === 1) {
            state.categories = categories;
          } else {
            state.categories = [...(Array.isArray(state.categories) ? state.categories : []), ...categories];
          }
        } else {
          state.categories = categories;
        }

        // Update pagination
        if (pagination) {
          state.pagination = {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.total_pages || 1,
            totalCount: pagination.count || (Array.isArray(categories) ? categories.length : 0),
            pageSize: state.pagination.pageSize,
            hasNext: !!pagination.next,
            hasPrevious: !!pagination.previous,
          };
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Categories With Counts
      .addCase(fetchCategoriesWithCounts.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchCategoriesWithCounts.fulfilled, (state, action) => {
        state.isLoading = false;

        const { categories, pagination } = action.payload;
        
        // Handle categories data
        if (Array.isArray(categories)) {
          // Replace categories for first page, append for subsequent pages
          if (pagination.current_page === 1) {
            state.categories = categories;
          } else {
            state.categories = [...(Array.isArray(state.categories) ? state.categories : []), ...categories];
          }
        } else {
          state.categories = categories;
        }

        // Update pagination
        if (pagination) {
          state.pagination = {
            currentPage: pagination.current_page || 1,
            totalPages: pagination.total_pages || 1,
            totalCount: pagination.count || (Array.isArray(categories) ? categories.length : 0),
            pageSize: state.pagination.pageSize,
            hasNext: !!pagination.next,
            hasPrevious: !!pagination.previous,
          };
        }
      })
      .addCase(fetchCategoriesWithCounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Category Statistics
      .addCase(fetchCategoryStatistics.fulfilled, (state, action) => {
        // Store statistics if needed, or just return for component use
      })
      .addCase(fetchCategoryStatistics.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch Category By ID
      .addCase(fetchCategoryById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentCategory,
  clearCurrentCategory,
  setCategoryPage,
  setCategoryPageSize,
  addMoreCategories,
  clearCategoryState,
  setLoading,
  clearError,
  filterCategories,
} = categorySlice.actions;

export default categorySlice.reducer;