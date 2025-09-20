import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAuth, fetchMe, updateMe as apiUpdateMe } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, location?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('rtrwh-token');
        if (token) {
          // Load user from backend
          const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const user: User = {
              id: userData.id.toString(),
              name: userData.name,
              email: userData.email,
              location: userData.location,
            };
            setUser(user);
            localStorage.setItem('rtrwh-user', JSON.stringify(user));
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('rtrwh-token');
            localStorage.removeItem('rtrwh-user');
          }
        } else {
          // Fallback to any cached user
          const cached = localStorage.getItem('rtrwh-user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch (error) {
              localStorage.removeItem('rtrwh-user');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid data
        localStorage.removeItem('rtrwh-token');
        localStorage.removeItem('rtrwh-user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Real API call for login
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (response.status === 422) {
          return { success: false, error: 'Please enter a valid email address and password.' };
        } else if (response.status >= 500) {
          return { success: false, error: 'Server error. Please try again later.' };
        } else {
          return { success: false, error: errorData.detail || 'Login failed. Please try again.' };
        }
      }

      const tokenData = await response.json();
      setAuth(tokenData.access_token);
      
      // Fetch user data after successful login
      const userResponse = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user: User = {
          id: userData.id.toString(),
          name: userData.name,
          email: userData.email,
          location: userData.location,
        };
        
        localStorage.setItem('rtrwh-user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        return { success: false, error: 'Login successful but failed to load user data. Please refresh the page.' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error. Please check your internet connection and try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, location?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Real API call for registration
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, location }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          if (errorData.detail?.includes('Email already registered')) {
            return { success: false, error: 'This email address is already registered. Please use a different email or try logging in.' };
          } else if (errorData.detail?.includes('password')) {
            return { success: false, error: 'Password must be at least 8 characters long.' };
          } else if (errorData.detail?.includes('email')) {
            return { success: false, error: 'Please enter a valid email address.' };
          } else {
            return { success: false, error: errorData.detail || 'Registration failed. Please check your information and try again.' };
          }
        } else if (response.status === 422) {
          return { success: false, error: 'Please fill in all required fields with valid information.' };
        } else if (response.status >= 500) {
          return { success: false, error: 'Server error. Please try again later.' };
        } else {
          return { success: false, error: errorData.detail || 'Registration failed. Please try again.' };
        }
      }

      const userData = await response.json();
      const user: User = {
        id: userData.id.toString(),
        name: userData.name,
        email: userData.email,
        location: userData.location,
      };
      
      // After successful registration, automatically log in the user
      const loginResponse = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        const tokenData = await loginResponse.json();
        setAuth(tokenData.access_token);
        localStorage.setItem('rtrwh-user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        return { success: false, error: 'Account created successfully, but automatic login failed. Please try logging in manually.' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error. Please check your internet connection and try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('rtrwh-user');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return Promise.reject(new Error('Not authenticated'));
    // Build minimal payload: only changed, non-empty fields
    const payload: { name?: string; email?: string; location?: string } = {};
    if (typeof userData.name === 'string') {
      const trimmed = userData.name.trim();
      if (trimmed && trimmed !== user.name) payload.name = trimmed;
    }
    if (typeof userData.email === 'string') {
      const trimmed = userData.email.trim();
      if (trimmed && trimmed !== user.email) payload.email = trimmed;
    }
    if (typeof userData.location === 'string') {
      const trimmed = userData.location.trim();
      if (trimmed && trimmed !== (user.location || '')) payload.location = trimmed;
    }

    // If nothing to update, exit early
    if (Object.keys(payload).length === 0) return user;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('rtrwh-token');
      if (!token) throw new Error('No authentication token');

      // Update user via API
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUserData = await response.json();
      const updatedUser: User = {
        id: updatedUserData.id.toString(),
        name: updatedUserData.name,
        email: updatedUserData.email,
        location: updatedUserData.location,
      };

      setUser(updatedUser);
      localStorage.setItem('rtrwh-user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (e) {
      console.error('Failed to update user:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
