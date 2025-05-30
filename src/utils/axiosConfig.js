import axios from 'axios';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-sprouty.onrender.com/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error types
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Redirect to login if needed
    } else if (!error.response) {
      // Network errors or server unreachable
      console.error('Network error: Unable to reach the server');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
