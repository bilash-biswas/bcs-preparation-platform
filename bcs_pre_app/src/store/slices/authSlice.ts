// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../../types';
import AuthService, { LoginData, RegisterData } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasSeenOnboarding: false,
  error: null,
};

// Load initial state from storage
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const [token, userData, hasSeenOnboarding] = await Promise.all([
      AsyncStorage.getItem('auth_token'),
      AsyncStorage.getItem('user_data'),
      AsyncStorage.getItem('has_seen_onboarding'),
    ]);

    return {
      token,
      user: userData ? JSON.parse(userData) : null,
      hasSeenOnboarding: hasSeenOnboarding === 'true',
    };
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      
      // Store tokens and user data
      await AsyncStorage.setItem('auth_token', response.access);
      await AsyncStorage.setItem('refresh_token', response.refresh);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(userData);
      
      // Store tokens and user data
      await AsyncStorage.setItem('auth_token', response.access);
      await AsyncStorage.setItem('refresh_token', response.refresh);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      return response;
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed. Please try again.';
      
      if (errorData) {
        if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        }
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await AuthService.getCurrentUser();
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to get user');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
    } catch (error: any) {
      console.log('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      await Promise.all([
        AsyncStorage.removeItem('auth_token'),
        AsyncStorage.removeItem('refresh_token'),
        AsyncStorage.removeItem('user_data'),
      ]);
    }
  }
);

export const markOnboardingSeen = createAsyncThunk(
  'auth/markOnboardingSeen',
  async (_, { rejectWithValue }) => {
    try {
      // Store in AsyncStorage
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      return true;
    } catch (error) {
      return rejectWithValue('Failed to mark onboarding as seen');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.fulfilled, (state, action) => {
        const { token, user, hasSeenOnboarding } = action.payload;
        state.token = token;
        state.user = user;
        state.isAuthenticated = !!token;
        state.hasSeenOnboarding = hasSeenOnboarding;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Mark Onboarding Seen
      .addCase(markOnboardingSeen.fulfilled, (state) => {
        state.hasSeenOnboarding = true;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;