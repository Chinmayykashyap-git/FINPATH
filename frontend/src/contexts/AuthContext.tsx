import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import {
  api,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../services/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    const res = await api.login(email, password, remember);
    setStoredToken(res.access_token, remember);
    setUser(res.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.register(fullName, email, password);
    setStoredToken(res.access_token, true);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setStoredToken(res.access_token, false);
    setUser(res.user);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, demoLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

