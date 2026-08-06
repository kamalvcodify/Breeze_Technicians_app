import axios from 'axios';
import { API_BASE_URL } from '@env';

const BASE_URL = (API_BASE_URL || 'http://10.0.2.2:5000/api').trim();

console.log(`[Breeze API] Using backend URL: ${BASE_URL}`);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export default apiClient;
