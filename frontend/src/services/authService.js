import api from './api';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user;
      
      // Update stored user info
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Check if super admin exists (for setup)
  async checkSuperAdminExists() {
    try {
      const response = await api.get('/auth/check-super-admin');
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Create super admin (initial setup)
  async createSuperAdmin(credentials) {
    try {
      const response = await api.post('/auth/create-super-admin', credentials);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Change password (Super Admin and Shop Admin only)
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get user profile (Super Admin and Shop Admin only)
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.profile;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Handle authentication errors
  handleAuthError(error) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          this.clearAuthData();
          return new Error(data.message || 'Authentication failed');
        case 403:
          return new Error(data.message || 'Access forbidden');
        case 422:
        case 400:
          return new Error(data.message || 'Invalid input data');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Refresh token (if needed in future)
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      return token;
    } catch (error) {
      this.clearAuthData();
      throw this.handleAuthError(error);
    }
  }
}

export default new AuthService();