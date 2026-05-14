import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
export const WS_URL = BASE.replace('http','ws').replace('https','wss').replace('/api','');
const api = axios.create({ baseURL: BASE, timeout: 15000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bj_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
