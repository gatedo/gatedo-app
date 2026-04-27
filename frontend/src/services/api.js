import axios from 'axios';

const isLocal = window.location.hostname === 'localhost';

// Em dev, usa VITE_API_URL se definido — senão localhost:3001
// Em produção, sempre usa api.gatedo.com
const BASE_URL = isLocal
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : 'https://api.gatedo.com/api';

const api = axios.create({
  baseURL: BASE_URL,
});

function getStoredToken() {
  const possibleKeys = [
    'gatedo_token',
    'token',
    'authToken',
    'access_token',
    'accessToken',
    'jwt',
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value && String(value).trim()) {
      return value;
    }
  }

  return null;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export default api;