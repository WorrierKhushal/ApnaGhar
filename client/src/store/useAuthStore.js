import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  initialized: false,

  setAccessToken: (token) => set({ accessToken: token }),

  signup: async (name, email, password, phoneNumber, role) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
        phoneNumber,
        role
      });
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      set({ loading: false });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      set({ 
        user, 
        accessToken, 
        loading: false 
      });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid email or password' 
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local auth states regardless of server request success
      set({ 
        user: null, 
        accessToken: null 
      });
    }
  },

  checkAuth: async () => {
    if (get().initialized) return;
    try {
      // Try to rotate token on startup using secure cookie
      const response = await api.post('/auth/refresh-token');
      const { accessToken } = response.data;
      
      // Fetch user profile info with the new access token
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      set({ 
        user: userResponse.data.user, 
        accessToken, 
        initialized: true 
      });
    } catch (error) {
      set({ 
        user: null, 
        accessToken: null, 
        initialized: true 
      });
    }
  }
}));

export default useAuthStore;
