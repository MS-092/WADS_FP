"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getCurrentUserFromStorage, isAuthenticated } from './api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      if (isAuthenticated()) {
        // Get token and set it in API client
        const token = localStorage.getItem('access_token');
        if (token) {
          apiClient.setToken(token);
        }
        
        // Try to get user from localStorage first
        const storedUser = getCurrentUserFromStorage();
        if (storedUser) {
          // Verify the token is still valid by making an API call
          const response = await apiClient.getCurrentUser();
          if (response.data) {
            // Token is valid, use the fresh user data from API
            setUser(response.data);
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Token is invalid, clear auth
            apiClient.logout();
            setUser(null);
          }
        } else {
          // If no stored user, fetch from API
          const response = await apiClient.getCurrentUser();
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Token might be invalid, clear auth
            apiClient.logout();
            setUser(null);
          }
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Clear any existing authentication data first
    apiClient.logout();
    setUser(null);
    
    const response = await apiClient.login(email, password);
    
    if (response.data) {
      // Store tokens and user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
        }
      }
      
      // Update API client token
      apiClient.setToken(response.data.access_token);
      
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: response.error };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    setLoading(true);
    
    const response = await apiClient.register(userData);
    
    if (response.data) {
      // After successful registration, log the user in
      const loginResponse = await apiClient.login(userData.email, userData.password);
      if (loginResponse.data) {
        // Store tokens and user data (same as login function)
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', loginResponse.data.access_token);
          localStorage.setItem('refresh_token', loginResponse.data.refresh_token);
          if (loginResponse.data.user) {
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            setUser(loginResponse.data.user);
          }
        }
        
        // Update API client token
        apiClient.setToken(loginResponse.data.access_token);
        
        setLoading(false);
        return { success: true };
      }
    }
    
    setLoading(false);
    return { success: false, error: response.error };
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 