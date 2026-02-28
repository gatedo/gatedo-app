import axios from 'axios';

// Detecta se o app está em produção através do Vite
const isProduction = import.meta.env.PROD;

const api = axios.create({
  // Se for produção, usa a URL do seu servidor hospedado. 
  // Se for desenvolvimento, usa o localhost:3000.
  baseURL: isProduction 
    ? 'https://app.gatedo.com/api' // Substitua pela URL real do seu deploy
    : 'http://localhost:3000/api', 
});

// Interceptor opcional para garantir que o token seja enviado em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Gatedo:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;