import api from './api';
import { User } from '../types';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  }

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/user/');
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout/');
  }
}

export default new AuthService();