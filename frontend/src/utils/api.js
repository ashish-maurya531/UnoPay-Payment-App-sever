import axios from 'axios';
import { notification } from 'antd';
import { jwtDecode } from "jwt-decode";

// Token expiration check
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  const expiryTime = decoded.exp;
  return expiryTime ? Date.now() / 1000 > expiryTime : true;
};

// Axios Interceptors for request/response
export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      if (isTokenExpired(token)) {
        notification.error({
          message: 'Token Expired',
          description: 'Your session has expired. Please log in again.',
        });
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject('Token expired');
      }
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        notification.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
        });
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        window.location.href = '/login'; // Redirect to login page
      }
      return Promise.reject(error);
    }
  );
};
