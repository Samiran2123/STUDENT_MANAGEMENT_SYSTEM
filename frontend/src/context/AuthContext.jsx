/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // Initialize and persist session
  const initializeAuth = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(savedToken);
      // Check token expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        logout();
        setLoading(false);
        return;
      }

      setToken(savedToken);

      // Attempt to load full profile from backend
      try {
        const res = await authService.getProfile();
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        } else {
          setUser(decoded);
        }
      } catch {
        // Fallback to decoded token data if offline / endpoint fails
        setUser(decoded);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data?.token) {
        const newToken = res.data.token;
        const userData = res.data.user;

        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, message: res.message || 'Login failed' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred during login';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      if (res.success) {
        if (res.data?.token) {
          const newToken = res.data.token;
          const createdUser = res.data.user;

          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem(USER_KEY, JSON.stringify(createdUser));

          setToken(newToken);
          setUser(createdUser);
          return { success: true, user: createdUser };
        } else {
          // Registration succeeded without auto-login token (e.g., student pending admission approval)
          return { success: true, user: res.data?.user || null, message: res.message };
        }
      } else {
        return { success: false, message: res.message || 'Registration failed' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
