import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recoveredUser = localStorage.getItem('gatedo_user');
    const token = localStorage.getItem('gatedo_token');

    if (recoveredUser && token) {
      try {
        const parsedUser = JSON.parse(recoveredUser);
        setUser(parsedUser);
        // Configura o token guardado para todas as chamadas à API
        api.defaults.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('gatedo_user');
        localStorage.removeItem('gatedo_token');
      }
    }
    setLoading(false);

    // Interceptor: signOut automático APENAS em 401 de rotas protegidas.
    // Rotas de auth (/auth/*) e rotas opcionais (/gamification/me) são ignoradas
    // para não redirecionar o usuário durante login/registro.
    const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/', '/gamification'];
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        const url = error.config?.url || '';
        const isAuthRoute = AUTH_ROUTES.some(r => url.includes(r));
        if (error.response?.status === 401 && !isAuthRoute) {
          signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function signIn(email, password) {
    try {
      // Chama o endpoint real de login do NestJS
      const response = await api.post('/auth/login', { email, password });
      
      const { access_token, user: userData } = response.data;

      if (access_token) {
        // Guarda as credenciais no armazenamento local
        localStorage.setItem('gatedo_token', access_token);
        localStorage.setItem('gatedo_user', JSON.stringify(userData));
        
        // Define o token para as próximas chamadas Axios
        api.defaults.headers.Authorization = `Bearer ${access_token}`;
        
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "E-mail ou senha incorretos." 
      };
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('gatedo_user');
    localStorage.removeItem('gatedo_token');
    delete api.defaults.headers.Authorization;
    
    // REDIRECIONAMENTO: Ao sair, volta para a página inicial (Welcome/Manifesto)
    window.location.href = '/';
  }

  return (
    <AuthContext.Provider value={{ 
      authenticated: !!user, 
      user, 
      loading, 
      signIn, 
      signOut,
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}