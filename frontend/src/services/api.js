import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only handle 401 for authenticated requests, not login attempts
    if (error.response?.status === 401) {
      // Check if this is a login request - don't redirect for login failures
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        // Token expired or invalid for authenticated requests
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Use React Router navigation instead of window.location
        // The AuthContext will handle the redirect properly
        
        // You can also dispatch a custom event that AuthContext can listen to
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;