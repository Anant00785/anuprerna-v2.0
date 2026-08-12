import axios from 'axios';
import { ConfigurationService } from './config';
import { AuthService } from './auth-service';

export const apiClient = axios.create({
  baseURL: ConfigurationService.SERVER_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = AuthService.retrieveJWT();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
