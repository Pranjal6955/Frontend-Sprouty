import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-sprouty.onrender.com/api';

// List of allowed origins for CORS verification
const ALLOWED_ORIGINS = [
  'https://sproutywebpp.vercel.app',
  'http://localhost:5173'
];

// Create axios instance with base URL and auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for slower connections
  timeout: 15000,
  // Include credentials (cookies) with requests
  withCredentials: true
});

// Function to validate token and refresh if needed
const validateToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found in localStorage');
    return false;
  }
  
  // Basic validation - check if token exists and hasn't expired
  // This is a simple check and should be expanded with proper JWT validation
  try {
    // If token is JWT, check expiration
    if (token.split('.').length === 3) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Auth token expired');
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add origin to headers for troubleshooting
    config.headers['X-Requested-From'] = window.location.origin;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling for CORS issues
    if (error.message === 'Network Error') {
      console.error('Reminder API CORS Error: Unable to connect to the API server. This may be due to a CORS policy restriction.');
      console.error('Current origin:', window.location.origin);
      console.error('API URL:', API_URL);
      
      // Check if current origin is in allowed list
      if (!ALLOWED_ORIGINS.includes(window.location.origin)) {
        console.error('Current origin is not in the allowed list. This might be causing CORS issues.');
      }
      
      // Dispatch a custom event that the app can listen for
      window.dispatchEvent(new CustomEvent('api:cors-error', { 
        detail: { 
          origin: window.location.origin,
          api: API_URL
        } 
      }));
    } 
    // Handle auth errors
    else if (error.response && error.response.status === 401) {
      console.error('Authentication error: Your session may have expired');
      
      // Dispatch auth error event
      window.dispatchEvent(new CustomEvent('api:auth-error'));
    }
    else {
      console.error('Reminder API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Mock data for fallbacks when API is unreachable
const MOCK_REMINDERS = {
  due: [
    {
      _id: 'mock-reminder-1',
      type: 'Water',
      title: 'Water Reminder',
      plant: { name: 'Plant', nickname: 'Your Plant' },
      scheduledDate: new Date().toISOString(),
      notes: 'This is a mock reminder since the API is currently unreachable'
    }
  ]
};

export const reminderAPI = {
  // Get all reminders
  getReminders: async () => {
    try {
      // Validate token before making request
      if (!validateToken()) {
        return { 
          success: false, 
          error: 'Invalid or expired authentication token. Please sign in again.',
          isAuthError: true
        };
      }
      
      const response = await api.get('/reminders');
      return response.data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Get upcoming reminders (next 7 days)
  getUpcomingReminders: async () => {
    try {
      // Validate token before making request
      if (!validateToken()) {
        return { 
          success: false, 
          error: 'Invalid or expired authentication token. Please sign in again.',
          isAuthError: true
        };
      }
      
      const response = await api.get('/reminders/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Get due reminders with enhanced error handling and fallback
  getDueReminders: async (useFallback = false) => {
    // If fallback is explicitly requested, return mock data
    if (useFallback) {
      console.log('Using fallback reminder data');
      return {
        success: true,
        data: MOCK_REMINDERS.due,
        isFallback: true
      };
    }
    
    try {
      // Validate token before making request
      if (!validateToken()) {
        return { 
          success: false, 
          error: 'Invalid or expired authentication token. Please sign in again.',
          isAuthError: true
        };
      }
      
      // Add a request ID for logging/debugging
      const requestId = Math.random().toString(36).substring(2, 15);
      console.log(`[${requestId}] Fetching due reminders...`);
      
      const response = await api.get('/reminders/due', {
        headers: {
          'X-Request-ID': requestId
        }
      });
      
      console.log(`[${requestId}] Successfully fetched due reminders`);
      return response.data;
    } catch (error) {
      // Enhanced error handling for CORS issues
      if (error.message === 'Network Error') {
        console.error('Error fetching due reminders: Network Error (possible CORS issue)');
        // Return a more helpful error with fallback data
        return { 
          success: false, 
          error: 'Network Error - Unable to connect to the reminder service. If this persists, please contact support.',
          isCorsError: true,
          fallbackData: MOCK_REMINDERS.due
        };
      }
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        return {
          success: false,
          error: 'Your session has expired. Please sign in again.',
          isAuthError: true,
          fallbackData: MOCK_REMINDERS.due
        };
      }
      
      console.error('Error fetching due reminders:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        fallbackData: MOCK_REMINDERS.due
      };
    }
  },
  
  // Create a new reminder
  createReminder: async (reminderData) => {
    try {
      // Transform frontend data to backend format
      const transformedData = {
        plant: reminderData.plant,
        type: reminderData.type,
        title: reminderData.title || `${reminderData.type} reminder`,
        notes: reminderData.notes || `${reminderData.type} reminder for plant`,
        scheduledDate: reminderData.scheduledDate,
        recurring: reminderData.recurring !== false,
        frequency: reminderData.frequency === 'daily' ? 1 : 
                  reminderData.frequency === 'weekly' ? 7 :
                  reminderData.frequency === 'monthly' ? 30 :
                  parseInt(reminderData.frequency) || 7,
        notificationMethods: reminderData.notificationMethods || ['popup']
      };

      const response = await api.post('/reminders', transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Update a reminder
  updateReminder: async (id, reminderData) => {
    try {
      const response = await api.put(`/reminders/${id}`, reminderData);
      return response.data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Delete a reminder
  deleteReminder: async (id) => {
    try {
      const response = await api.delete(`/reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Mark a reminder as completed
  completeReminder: async (id) => {
    try {
      const response = await api.put(`/reminders/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing reminder:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Mark reminder notification as sent
  markNotificationSent: async (id) => {
    try {
      const response = await api.put(`/reminders/${id}/notification-sent`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification sent:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Snooze a reminder for a specified duration
  snoozeReminder: async (id, minutes = 30) => {
    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      const response = await api.put(`/reminders/${id}`, {
        scheduledDate: snoozeUntil.toISOString(),
        notificationSent: false
      });
      return response.data;
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Get reminder statistics
  getReminderStats: async () => {
    try {
      const response = await api.get('/reminders/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Check connectivity to the API server
  checkApiConnectivity: async () => {
    try {
      // Try a simple OPTIONS request to check CORS
      const response = await axios({
        method: 'OPTIONS',
        url: `${API_URL}/reminders/due`,
        timeout: 5000
      });
      
      return {
        success: true,
        corsEnabled: !!response.headers['access-control-allow-origin']
      };
    } catch (error) {
      return {
        success: false,
        corsEnabled: false,
        error: error.message
      };
    }
  }
};
