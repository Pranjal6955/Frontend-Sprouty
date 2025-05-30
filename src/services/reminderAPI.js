import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-sprouty.onrender.com/api';

// Create axios instance with base URL and auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Reminder API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const reminderAPI = {
  // Get all reminders
  getReminders: async () => {
    try {
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
      const response = await api.get('/reminders/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Get due reminders
  getDueReminders: async () => {
    try {
      const response = await api.get('/reminders/due');
      return response.data;
    } catch (error) {
      console.error('Error fetching due reminders:', error);
      return { success: false, error: error.response?.data?.error || error.message };
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
  }
};
