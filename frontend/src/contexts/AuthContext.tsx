import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, inviteToken?: string) => Promise<{ emailVerificationRequired?: boolean } | void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  setUserData: (data: User) => void;
  skipLoading: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.setToken(token);
    api.getCurrentUser()
      .then((userData) => setUser(userData))
      .catch(() => {
        api.setToken(null);
        localStorage.removeItem('token');
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    api.setToken(response.token);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('has_seen_landing', 'true');
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, inviteToken?: string) => {
    const response = await api.register({ email, password, firstName, lastName, inviteToken });
    if (response.emailVerificationRequired) {
      return { emailVerificationRequired: true };
    }
    if (response.token && response.user) {
      api.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('has_seen_landing', 'true');
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    api.setOnUnauthorized(logout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skipLoading = useCallback(() => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    setLoading(false);
    setAuthChecking(false);
  }, []);

  const updateUser = async (data: Partial<User>) => {
    const updatedUser = await api.updateUser(data);
    setUser(updatedUser);
  };

  const setUserData = (data: User) => {
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading: authChecking, login, register, logout, updateUser, setUserData, skipLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
