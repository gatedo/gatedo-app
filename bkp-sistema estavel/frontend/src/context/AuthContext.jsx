import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recoveredUser = localStorage.getItem('gatedo_user');
    if (recoveredUser) {
      try {
        setUser(JSON.parse(recoveredUser));
      } catch (e) {
        localStorage.removeItem('gatedo_user');
      }
    }
    setLoading(false);

    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function signIn(email, password) {
    try {
      const response = await api.get('/users');
      const foundUser = response.data.find(u => u.email === email);

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('gatedo_user', JSON.stringify(foundUser));
        return { success: true };
      } else {
        return { success: false, message: "Email não encontrado." };
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, message: "Erro de conexão." };
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('gatedo_user');
    localStorage.clear(); 
    window.location.href = '/'; 
  }

  // Exportamos setUser aqui para ser usado no ProfileEdit
  return (
    <AuthContext.Provider value={{ signed: !!user, user, setUser, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}