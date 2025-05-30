import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-sprouty.onrender.com/api';
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the auth token in requests
axiosInstance.interceptors.request.use(
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
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// This authAPI object will be used - it has the simplified implementation

// Upload image to Cloudinary and return the URL
const uploadToCloudinary = async (imageData) => {
  try {
    console.log("Starting Cloudinary upload process");
    
    // If it's already a URL, just return it
    if (typeof imageData === 'string' && !imageData.startsWith('data:image')) {
      console.log("Using existing image URL");
      return imageData;
    }

    // Extract base64 data (remove the prefix)
    let base64Data = imageData;
    if (imageData.startsWith('data:image')) {
      base64Data = imageData.split(',')[1];
    }

    // Prepare the form data
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64Data}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    console.log("Uploading to Cloudinary with preset:", CLOUDINARY_UPLOAD_PRESET);
    console.log("Cloudinary cloud name:", CLOUDINARY_CLOUD_NAME);

    // Upload to Cloudinary
    const uploadUrl = `${CLOUDINARY_URL}${CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log("Uploading to URL:", uploadUrl);
    
    const response = await axios.post(uploadUrl, formData);

    if (response.data && response.data.secure_url) {
      console.log('✅ Image uploaded to Cloudinary:', response.data.secure_url);
      return response.data.secure_url;
    } else {
      console.error("Cloudinary response missing secure_url:", response.data);
      throw new Error('Failed to get image URL from Cloudinary');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (error.response) {
      console.error('Cloudinary error response:', error.response.data);
    }
    throw error;
  }
};

// Fix the token inconsistency - use 'authToken' consistently
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Auth Services
export const authAPI = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },
  
  googleAuth: async (idToken) => {
    const response = await axiosInstance.post('/auth/google', { idToken });
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await axiosInstance.get('/auth/verify-token');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgotpassword', { email });
    return response.data;
  },
  
  resetPassword: async (resetToken, password) => {
    const response = await axiosInstance.put(`/auth/resetpassword/${resetToken}`, { password });
    return response.data;
  },

  linkAccounts: async (idToken) => {
    const response = await axiosInstance.post('/auth/link-accounts', { idToken });
    return response.data;
  }
};

// User Services
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Updating profile with data:', { 
        ...profileData, 
        avatar: profileData.avatar ? 'Image data present' : 'No avatar' 
      });

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update localStorage user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        name: profileData.name || storedUser.name,
        avatar: profileData.avatar || storedUser.avatar 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('Profile updated successfully');
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Get user stats
  getStats: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      return data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  // Get user profile data
  getUserProfile: async () => {
    try {
      const response = await axiosInstance.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Update user profile
  updateUserProfile: async (userData) => {
    try {
      const response = await axiosInstance.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Update user preferences
  updateUserPreferences: async (preferences) => {
    try {
      const response = await axiosInstance.put('/users/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};

// Plant Services
export const plantAPI = {
  // Create a new plant
  createPlant: async (plantData) => {
    try {
      const response = await axiosInstance.post('/plants', plantData);
      return response.data;
    } catch (error) {
      console.error('Error creating plant:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Get all plants for the current user
  getAllPlants: async () => {
    try {
      const response = await axiosInstance.get('/plants');
      return response.data;
    } catch (error) {
      console.error('Error fetching plants:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Get all plants (alias for getAllPlants for compatibility)
  getPlants: async () => {
    try {
      const response = await axiosInstance.get('/plants');
      return response.data;
    } catch (error) {
      console.error('Error fetching plants:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Get a specific plant by ID
  getPlant: async (plantId) => {
    try {
      const response = await axiosInstance.get(`/plants/${plantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update a plant
  updatePlant: async (plantId, updateData) => {
    try {
      const response = await axiosInstance.put(`/plants/${plantId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating plant:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Delete a plant
  deletePlant: async (plantId) => {
    try {
      const response = await axiosInstance.delete(`/plants/${plantId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting plant:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Update plant care history
  updateCareHistory: async (plantId, careData) => {
    try {
      const response = await axiosInstance.put(`/plants/${plantId}/care`, careData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add growth milestone
  addGrowthMilestone: async (plantId, milestoneData) => {
    try {
      const response = await axiosInstance.post(`/plants/${plantId}/growth`, milestoneData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Identify plant from image
  identifyPlant: async (imageData) => {
    try {
      // Check if imageData is a URL or base64 string
      const isUrl = typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'));
      
      const requestData = isUrl 
        ? { imageUrl: imageData }
        : { base64Image: imageData.split(',')[1] }; // Remove data:image/jpeg;base64, prefix

      const response = await axiosInstance.post('/plants/identify', requestData);
      return response.data;
    } catch (error) {
      console.error('Error identifying plant:', error);
      // Handle 503 errors gracefully
      if (error.response?.status === 503) {
        return { 
          success: false, 
          error: error.response?.data?.error || 'Plant identification service is temporarily unavailable', 
          is_mock: true,
          mock_reason: 'API service unavailable'
        };
      }
      
      // Handle other errors
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        is_mock: true,
        mock_reason: 'API error'
      };
    }
  },

  // Search plant by name
  searchPlantByName: async (plantName) => {
    try {
      const response = await axiosInstance.get(`/plants/search?name=${encodeURIComponent(plantName)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Plant care actions
  waterPlant: async (plantId, data = {}) => {
    try {
      const response = await axiosInstance.post(`/plants/${plantId}/water`, {
        notes: data.notes,
        amount: data.amount
      });
      return response.data;
    } catch (error) {
      console.error('Error watering plant:', error);
      throw error;
    }
  },

  fertilizePlant: async (plantId, data = {}) => {
    try {
      const response = await axiosInstance.post(`/plants/${plantId}/fertilize`, {
        notes: data.notes,
        fertilizerType: data.fertilizerType
      });
      return response.data;
    } catch (error) {
      console.error('Error fertilizing plant:', error);
      throw error;
    }
  },

  prunePlant: async (plantId, data = {}) => {
    try {
      const response = await axiosInstance.post(`/plants/${plantId}/prune`, {
        notes: data.notes,
        pruningType: data.pruningType
      });
      return response.data;
    } catch (error) {
      console.error('Error pruning plant:', error);
      throw error;
    }
  },

  getPlantSchedule: async (plantId) => {
    try {
      const response = await axiosInstance.get(`/plants/${plantId}/schedule`);
      return response.data;
    } catch (error) {
      console.error('Error fetching plant schedule:', error);
      throw error;
    }
  }
};

// Weather API endpoints
export const weatherAPI = {
  getCurrentWeather: async (location) => {
    try {
      const token = localStorage.getItem('authToken');
      const params = location ? `?location=${encodeURIComponent(location)}` : '';
      const response = await fetch(`${API_URL}/weather${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Weather API error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Weather API Error:', error);
      throw error;
    }
  },

  getWeatherRecommendations: async (location) => {
    try {
      const token = localStorage.getItem('authToken');
      const params = location ? `?location=${encodeURIComponent(location)}` : '';
      const response = await fetch(`${API_URL}/weather/recommendations${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Weather recommendations error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Weather Recommendations API Error:', error);
      throw error;
    }
  },

  getWeatherForecast: async (location) => {
    try {
      const token = localStorage.getItem('authToken');
      const params = location ? `?location=${encodeURIComponent(location)}` : '';
      const response = await fetch(`${API_URL}/weather/forecast${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Weather forecast error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Weather Forecast API Error:', error);
      throw error;
    }
  },

  searchLocations: async (query) => {
    try {
      const token = localStorage.getItem('authToken');
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      const response = await fetch(`${API_URL}/weather/search${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Location search error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Location Search API Error:', error);
      throw error;
    }
  }
};

// Remove duplicate reminderAPI - use the one from reminderAPI.js instead
// Import and re-export the consolidated reminderAPI
import { reminderAPI } from './reminderAPI';
export { reminderAPI };

// Add diagnosis API endpoints
export const diagnosisAPI = {
  diagnoseDisease: async (diagnosisData) => {
    try {
      // Need to declare variables before using them
      let response;
      let newHealthStatus = 'Healthy'; // Default to healthy

      // Make the diagnosis request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      response = await axiosInstance.post('/diagnosis/diagnose', diagnosisData, {
        signal: controller.signal,
        timeout: 60000
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.success && diagnosisData.plantId) {
        try {
          // Determine health status based on diagnosis results
          if (response.data.data && response.data.data.summary && !response.data.data.summary.isHealthy) {
            // Set health based on treatment priority
            if (response.data.data.summary.treatmentPriority === 'high') {
              newHealthStatus = 'Critical';
            } else {
              newHealthStatus = 'Needs Attention';
            }
          }
          
          // Update plant status
          await axiosInstance.put(`/plants/${diagnosisData.plantId}`, { 
            status: newHealthStatus 
          });
          
          console.log('Plant health status updated after diagnosis:', newHealthStatus);
        } catch (updateError) {
          console.error('Error updating plant health status after diagnosis:', updateError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error diagnosing plant disease:', error);
      
      // Check if the request was aborted due to timeout
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.error('Diagnosis request timed out');
        throw new Error('The diagnosis request timed out. Please try again with a smaller image or check your internet connection.');
      }
      
      // Enhanced error handling for API key issues
      if (error.response?.data?.error?.includes('api key') || 
          error.response?.data?.error?.includes('API key')) {
        throw new Error('Plant identification service API key error. Please contact support.');
      }
      
      throw error;
    }
  },

  getPlantDiagnosisHistory: async (plantId) => {
    try {
      const response = await axiosInstance.get(`/diagnosis/plant/${plantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching diagnosis history:', error);
      throw error;
    }
  },

  getUserDiagnosisHistory: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/diagnosis/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user diagnosis history:', error);
      throw error;
    }
  },

  getDiagnosis: async (diagnosisId) => {
    try {
      const response = await axiosInstance.get(`/diagnosis/${diagnosisId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      throw error;
    }
  },

  updateDiagnosis: async (diagnosisId, updateData) => {
    try {
      const response = await axiosInstance.put(`/diagnosis/${diagnosisId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      throw error;
    }
  },

  deleteDiagnosis: async (diagnosisId) => {
    try {
      const response = await axiosInstance.delete(`/diagnosis/${diagnosisId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      throw error;
    }
  },

  getDiagnosisStats: async () => {
    try {
      const response = await axiosInstance.get('/diagnosis/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching diagnosis stats:', error);
      throw error;
    }
  }
};

// Export uploadToCloudinary for use in other components
export { uploadToCloudinary };

// Update the main api object to include reminder methods and additional exports
const apiService = {
  // Reminder methods (for backward compatibility) - now using the imported reminderAPI
  getReminders: () => reminderAPI.getReminders(),
  createReminder: (data) => reminderAPI.createReminder(data),
  deleteReminder: (id) => reminderAPI.deleteReminder(id),
  getDueReminders: () => reminderAPI.getDueReminders(),
  markNotificationSent: (id) => reminderAPI.markNotificationSent(id),
  completeReminder: (id) => reminderAPI.completeReminder(id),
  
  // Add utility function
  uploadToCloudinary
};

export default apiService;

// Create a simple api object for axios instance access (backward compatibility)
export const api = axiosInstance;
