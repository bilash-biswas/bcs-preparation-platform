// lib/api-client.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedRequests: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  // This method is now client-side only and won't run during SSR
  private getAuthTokens() {
    // This will only run on client side
    if (typeof window === "undefined") {
      return { accessToken: null, refreshToken: null };
    }

    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        return {
          accessToken: authData.state?.accessToken || null,
          refreshToken: authData.state?.refreshToken || null,
        };
      }
    } catch (error) {
      console.error("Error reading auth storage:", error);
    }
    return { accessToken: null, refreshToken: null };
  }

  private updateAuthToken(accessToken: string) {
    if (typeof window === "undefined") return;

    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        authData.state.accessToken = accessToken;
        localStorage.setItem("auth-storage", JSON.stringify(authData));
      }
    } catch (error) {
      console.error("Error updating auth storage:", error);
    }
  }

  private clearAuthTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth-storage");
  }

  private setupInterceptors() {
    // Request interceptor - this only runs on client side
    this.client.interceptors.request.use(
      (config) => {
        // Skip during SSR
        if (typeof window === "undefined") {
          return config;
        }

        const { accessToken } = this.getAuthTokens();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - this only runs on client side
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        // Skip during SSR
        if (typeof window === "undefined") {
          return Promise.reject(error);
        }

        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.failedRequests.push({ resolve, originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { refreshToken } = this.getAuthTokens();

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
              { refresh: refreshToken }
            );

            const { access } = response.data;
            this.updateAuthToken(access);

            // Retry failed requests
            this.failedRequests.forEach((request) => {
              request.resolve(this.client(request.originalRequest));
            });

            this.failedRequests = [];
            this.isRefreshing = false;

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuthTokens();
            this.failedRequests.forEach((request) => {
              request.resolve(Promise.reject(refreshError));
            });
            this.failedRequests = [];
            this.isRefreshing = false;

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export const apiClient = new ApiClient();
