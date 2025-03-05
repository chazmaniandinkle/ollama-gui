import { writable } from 'svelte/store';
import { apiClient } from '$lib/api';
import type { User } from '$lib/types';
import { browser } from '$app/environment';
import { connectSocket, disconnectSocket } from '$lib/api/websocket';

// Initial auth state
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null as User | null
};

function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    /**
     * Login user with credentials
     */
    login: async (email: string, password: string) => {
      const response = await apiClient.login(email, password);
      
      if (response.status) {
        // Store token in local storage
        if (browser) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        // Update store
        set({
          isAuthenticated: true,
          isLoading: false,
          user: response.data.user
        });
        
        // Connect WebSocket
        connectSocket();
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Register new user
     */
    register: async (name: string, email: string, password: string) => {
      const response = await apiClient.register(name, email, password);
      
      if (response.status) {
        // Store token in local storage
        if (browser) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        // Update store
        set({
          isAuthenticated: true,
          isLoading: false,
          user: response.data.user
        });
        
        // Connect WebSocket
        connectSocket();
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Check if user is already authenticated
     */
    checkAuth: async () => {
      // Skip if not in browser
      if (!browser) {
        set({ ...initialState, isLoading: false });
        return false;
      }
      
      // Check if token exists
      const token = localStorage.getItem('auth_token');
      if (!token) {
        set({ ...initialState, isLoading: false });
        return false;
      }
      
      // Verify token by getting user profile
      try {
        const response = await apiClient.getUserProfile();
        
        if (response.status) {
          // Update store with user data
          set({
            isAuthenticated: true,
            isLoading: false,
            user: response.data
          });
          
          // Connect WebSocket
          connectSocket();
          
          return true;
        } else {
          // Invalid token
          localStorage.removeItem('auth_token');
          set({ ...initialState, isLoading: false });
          return false;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('auth_token');
        set({ ...initialState, isLoading: false });
        return false;
      }
    },
    
    /**
     * Update user data
     */
    updateUser: (userData: Partial<User>) => {
      update(state => ({
        ...state,
        user: state.user ? { ...state.user, ...userData } : null
      }));
    },
    
    /**
     * Logout user
     */
    logout: () => {
      // Remove token
      if (browser) {
        localStorage.removeItem('auth_token');
      }
      
      // Disconnect WebSocket
      disconnectSocket();
      
      // Reset store
      set({ ...initialState, isLoading: false });
    }
  };
}

export const authStore = createAuthStore();
