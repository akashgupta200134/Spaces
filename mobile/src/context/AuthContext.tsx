import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  profileImage?: string;
  membership?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await SecureStore.setItemAsync('userToken', newToken);
    await SecureStore.setItemAsync('userData', JSON.stringify(newUser));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await SecureStore.setItemAsync('userData', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
