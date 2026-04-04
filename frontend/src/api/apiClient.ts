import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  console.error('❌ Request Error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  console.log(`✅ API Response: ${response.status} from ${response.config.url}`);
  return response;
}, (error) => {
  console.error(`❌ API Error from ${error.config?.url}:`, error.response?.data || error.message);
  return Promise.reject(error);
});

export default apiClient;
