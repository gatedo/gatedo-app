import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const TOKEN_KEYS = ['gatedo_token', 'token', 'authToken', 'access_token', 'accessToken', 'jwt'];
const USER_KEYS = ['gatedo_user', 'user', 'authUser'];

function getStoredToken() {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value && String(value).trim()) return value;
  }
  return null;
}

function getStoredUser() {
  for (const key of USER_KEYS) {
    const value = localStorage.getItem(key);
    if (!value) continue;
    try {
      return JSON.parse(value);
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function clearStoredAuth() {
  USER_KEYS.forEach((key) => localStorage.removeItem(key));
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  delete api.defaults.headers.Authorization;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      localStorage.setItem('gatedo_token', token);

      const recoveredUser = getStoredUser();
      if (recoveredUser) {
        setUser(recoveredUser);
        localStorage.setItem('gatedo_user', JSON.stringify(recoveredUser));
      } else {
        const payload = decodeJwtPayload(token);
        if (payload?.sub || payload?.id || payload?.email) {
          const fallbackUser = {
            id: payload.id || payload.sub,
            email: payload.email || '',
            role: payload.role || 'USER',
            plan: payload.plan || 'FREE',
          };
          setUser(fallbackUser);
          localStorage.setItem('gatedo_user', JSON.stringify(fallbackUser));
        }
      }
    }

    setLoading(false);

    const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/', '/gamification'];
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || '';
        const isAuthRoute = AUTH_ROUTES.some((route) => url.includes(route));

        if (error.response?.status === 401 && !isAuthRoute) {
          clearStoredAuth();
          setUser(null);
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function signIn(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      if (access_token) {
        localStorage.setItem('gatedo_token', access_token);
        localStorage.setItem('gatedo_user', JSON.stringify(userData));
        api.defaults.headers.Authorization = `Bearer ${access_token}`;

        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'E-mail ou senha incorretos.',
      };
    }

    return { success: false, message: 'Nao foi possivel iniciar a sessao.' };
  }

  function signOut() {
    setUser(null);
    clearStoredAuth();
    window.location.href = '/';
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated: !!user,
        user,
        loading,
        signIn,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
