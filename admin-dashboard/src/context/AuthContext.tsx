'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

 useEffect(() => {
  const savedToken = Cookies.get('admin_token');
  const savedUser = Cookies.get('admin_user');

  queueMicrotask(() => {
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('admin_token');
        Cookies.remove('admin_user');
      }
    }
    setIsLoading(false);
  });
}, []);

  const login = async (email: string, password: string) => {
    const response = await API.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = response.data;

    if (userData.role !== 'ADMIN' && userData.role !== 'SPACE_MANAGER') {
      throw new Error('Access denied. Administrator privileges required.');
    }

    Cookies.set('admin_token', jwtToken, { expires: 7 });
    Cookies.set('admin_user', JSON.stringify(userData), { expires: 7 });

    setToken(jwtToken);
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('admin_token');
    Cookies.remove('admin_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};