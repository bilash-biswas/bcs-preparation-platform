export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'student' | 'teacher' | 'admin';
  phone?: string;
  avatar?: string;
  is_premium: boolean;
  premium_expiry?: string;
  coins: number;
  streak: number;
  last_active: string;
  date_joined: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: 'student';
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  register: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
}