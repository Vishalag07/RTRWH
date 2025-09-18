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
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
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
          const me = await fetchMe();
          setUser(me);
          localStorage.setItem('rtrwh-user', JSON.stringify(me));
        } else {
          // Fallback to any cached user
          const cached = localStorage.getItem('rtrwh-user');
          if (cached) setUser(JSON.parse(cached));
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user data exists in localStorage from registration
      const existingUserData = localStorage.getItem('rtrwh-user');
      let userName = 'User'; // Default fallback
      
      if (existingUserData) {
        try {
          const parsedUser = JSON.parse(existingUserData);
          if (parsedUser.email === email) {
            userName = parsedUser.name;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      
      // Mock successful login
      const mockUser: User = {
        id: '1',
        name: userName,
        email: email,
        avatar: undefined,
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      setAuth(mockToken);
      localStorage.setItem('rtrwh-user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with real registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const mockUser: User = {
        id: '1',
        name: name,
        email: email,
        avatar: undefined,
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      setAuth(mockToken);
      localStorage.setItem('rtrwh-user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
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
      // Persist and then re-fetch to ensure DB is source of truth
      await apiUpdateMe(payload);
      const fresh = await fetchMe();
      setUser(fresh);
      localStorage.setItem('rtrwh-user', JSON.stringify(fresh));
      return fresh;
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
