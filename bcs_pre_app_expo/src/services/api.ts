// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://192.168.10.235:8000/api'; // Your Django backend

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const { store } = require('../store');
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Failed to fetch auth token dynamically:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        const { store } = require('../store');
        const { logout } = require('../store/slices/authSlice');
        store.dispatch(logout());
      } catch (e) {
        console.log('Failed to dispatch logout dynamically:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;