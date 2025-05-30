import React, { useState, useEffect } from 'react';
import {
  Plus, Cloud, Sun, Thermometer, Droplets, 
  Calendar, Bell, TrendingUp, Search, Filter, 
  Upload, Camera, Menu, Home, User, Book, 
  X, Edit, Delete, Eye, AlertCircle, Info, 
  Settings, LogOut, Leaf, Trash2, Scissors, 
  Flower, Stethoscope, AlertTriangle
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { googleAuthService } from '../services/googleAuth';
import { useNavigate } from "react-router-dom";
import { weatherAPI, plantAPI } from '../services/api';
import AddPlant from '../components/AddPlant';
import LogoOJT from '../assets/LogoOJT.png';
import { DarkModeToggle } from '../components/ThemeProvider';
import PlantDetails from '../components/PlantDetails';
import EditPlant from '../components/EditPlant';
import { useNotifications } from '../contexts/NotificationContext';
import { reminderAPI } from '../services/api';
import Weather from '../components/Weather';
import { processPlantImage, handleImageError } from '../utils/imageUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Add this useEffect at the top of your component
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false); 
  const [plantName, setPlantName] = useState("");
  const [activeNavItem, setActiveNavItem] = useState('Home');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [deletingPlant, setDeletingPlant] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);
  const [healthFilter, setHealthFilter] = useState('All'); // Add this state

  // Get notifications from context
  const { notifications, clearNotification } = useNotifications();

  // Add status options constant
  const healthStatusOptions = [
    { value: 'All', label: 'All Plants' },
    { value: 'Healthy', label: 'Healthy', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'Needs Attention', label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Not yet set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    // Fetch weather data
    const initializeWeather = async () => {
      try {
        const data = await weatherAPI.getCurrentWeather('Bangkok');
        if (data.success) {
          const formattedWeather = {
            location: data.data.location,
            localTime: new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            }),
            condition: data.data.description,
            icon: data.data.icon.startsWith('//') ? `https:${data.data.icon}` : data.data.icon,
            temperature: `${Math.round(data.data.temperature)}°C`,
            windSpeed: `${data.data.wind_speed} km/h`,
            humidity: `${data.data.humidity}%`,
            uv: data.data.uv
          };
          setWeatherData(formattedWeather);
        }
        setError(null);
      } catch (error) {
        console.error('Weather API Error:', error);
        setError(error.message);
      }
    };

    // Fetch plants from database
    const fetchPlants = async () => {
      try {
        const response = await plantAPI.getPlants();
        if (response && response.data) {
          // Format plants from database to match frontend structure
          const formattedPlants = response.data.map(plant => ({
            id: plant._id,
            name: plant.name,
            species: plant.species,
            nickname: plant.nickname || plant.name,
            image: processPlantImage(plant.mainImage || plant.image),
            notes: plant.notes,
            health: plant.status, // Ensure health status is included
            status: plant.status, // Include both for compatibility
            lastWatered: formatDate(plant.lastWatered),
            dateAdded: formatDate(plant.dateAdded || plant.createdAt),
            lastFertilised: formatDate(plant.lastFertilised),
            lastPruning: formatDate(plant.lastPruning)
          }));
          setPlants(formattedPlants);
        }
      } catch (error) {
        console.error('Error fetching plants:', error);
      }
    };

    // Fetch due reminders for dashboard display
    const fetchDueReminders = async () => {
      try {
        const response = await reminderAPI.getDueReminders();
        if (response.success !== false) {
          const reminders = response.data || [];
          setDueReminders(Array.isArray(reminders) ? reminders : []);
          
          // Only log when there are actual reminders to avoid console spam
          if (reminders.length > 0) {
            console.log('Dashboard: Found due reminders:', reminders.length);
          }
        }
      } catch (error) {
        console.error('Error fetching due reminders:', error);
      }
    };

    initializeWeather();
    fetchPlants();
    fetchDueReminders();
    
    // Refresh due reminders every 10 minutes instead of 5 to reduce API calls
    const interval = setInterval(() => {
      fetchDueReminders();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await googleAuthService.signOut();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const handleAddPlant = () => {
    setShowAddPlant(true); 
  };

  // Updated to handle the newly saved plant from database
  const handleSavePlant = (savedPlant) => {
    // The plant is already saved to the database in AddPlant component
    // Just add it to the local state
    setPlants(prevPlants => [...prevPlants, savedPlant]);
    // Hide the AddPlant component
    setShowAddPlant(false);
  };

  const handleLocationSearch = async (searchTerm) => {
    setLocation(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await weatherAPI.searchLocations(searchTerm);
      if (response.success) {
        setSearchResults(response.data.slice(0, 15));
      }
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation.name);
    setSearchResults([]);
    handleLocationSubmit(null, selectedLocation.name);
  };

  const handleLocationSubmit = async (e, locationName) => {
    if (e) e.preventDefault();
    if (!location && !locationName) return;

    setIsSearching(true);
    try {
      const data = await weatherAPI.getCurrentWeather(locationName || location);
      if (data.success) {
        const formattedWeather = {
          location: data.data.location,
          localTime: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }),
          condition: data.data.description,
          icon: data.data.icon.startsWith('//') ? `https:${data.data.icon}` : data.data.icon,
          temperature: `${Math.round(data.data.temperature)}°C`,
          windSpeed: `${data.data.wind_speed} km/h`,
          humidity: `${data.data.humidity}%`,
          uv: data.data.uv || "6"
        };
        setWeatherData(formattedWeather);
        setShowLocationInput(false);
      }
      setError(null);
    } catch (error) {
      console.error('Weather API Error:', error);
      setError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeletePlant = async (plantId) => {
    setDeletingPlant(plants.find(p => p.id === plantId));
  };

  const confirmDelete = async () => {
    if (!deletingPlant) return;
    
    setIsDeleting(true);
    try {
      await plantAPI.deletePlant(deletingPlant.id);
      setPlants(plants.filter(p => p.id !== deletingPlant.id));
      setDeletingPlant(null);
    } catch (error) {
      console.error('Error deleting plant:', error);
      // You could add error state handling here if needed
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlantClick = (plant) => {
    setSelectedPlant(plant);
  };

  const handleEditClick = (e, plant) => {
    e.stopPropagation(); // Prevent plant details modal from opening
    setEditingPlant(plant);
  };

  const handlePlantUpdate = (updatedPlant) => {
    // Format dates consistently when updating plant data
    const formattedPlant = {
      ...updatedPlant,
      lastWatered: formatDate(updatedPlant.lastWatered),
      dateAdded: formatDate(updatedPlant.dateAdded || updatedPlant.createdAt),
      lastFertilised: formatDate(updatedPlant.lastFertilised),
      lastPruning: formatDate(updatedPlant.lastPruning)
    };
    
    setPlants(prevPlants => 
      prevPlants.map(p => 
        p.id === formattedPlant.id ? formattedPlant : p
      )
    );
    setEditingPlant(null);
  };

  const handleDeleteClick = (e, plantId) => {
    e.stopPropagation(); // Prevent plant details modal from opening
    setDeletingPlant(plants.find(p => p.id === plantId));
  };

  const handleWaterClick = async (e, plantId) => {
    e.stopPropagation(); // Prevent plant details modal from opening
    try {
      console.log('Watering plant:', plantId);
      const response = await plantAPI.waterPlant(plantId, {
        notes: 'Quick watering from dashboard'
      });
      
      if (response.success) {
        // Update the plant in local state
        setPlants(prevPlants => 
          prevPlants.map(p => 
            p.id === plantId ? {
              ...p,
              lastWatered: formatDate(new Date())
            } : p
          )
        );
        
        // Show success message (you can add a toast notification here)
        console.log('Plant watered successfully');
      }
    } catch (error) {
      console.error('Error watering plant:', error);
      // You can add error handling/notification here
    }
  };

  const handleFertilizeClick = async (e, plantId) => {
    e.stopPropagation();
    try {
      console.log('Fertilizing plant:', plantId);
      const response = await plantAPI.fertilizePlant(plantId, {
        notes: 'Quick fertilizing from dashboard'
      });
      
      if (response.success) {
        // Update the plant in local state
        setPlants(prevPlants => 
          prevPlants.map(p => 
            p.id === plantId ? {
              ...p,
              lastFertilised: formatDate(new Date())
            } : p
          )
        );
        
        console.log('Plant fertilized successfully');
      }
    } catch (error) {
      console.error('Error fertilizing plant:', error);
    }
  };

  const handlePruningClick = async (e, plantId) => {
    e.stopPropagation();
    try {
      console.log('Pruning plant:', plantId);
      const response = await plantAPI.prunePlant(plantId, {
        notes: 'Quick pruning from dashboard'
      });
      
      if (response.success) {
        // Update the plant in local state
        setPlants(prevPlants => 
          prevPlants.map(p => 
            p.id === plantId ? {
              ...p,
              lastPruning: formatDate(new Date())
            } : p
          )
        );
        
        console.log('Plant pruned successfully');
      }
    } catch (error) {
      console.error('Error pruning plant:', error);
    }
  };

  const handleDiagnose = async (e, plant) => {
    e.stopPropagation(); // Prevent plant details modal from opening
    try {
      // Navigate to the diagnose page with the plant data
      navigate(`/diagnose/${plant.id}`, { 
        state: {
          plantId: plant.id,
          plantName: plant.name,
          plantImage: plant.image,
          plantSpecies: plant.species
        }
      });
    } catch (error) {
      console.error('Error navigating to diagnosis:', error);
    }
  };

  // Notification Button component
  const NotificationButton = () => {
    const totalNotifications = (notifications ? notifications.length : 0) + dueReminders.length;
    
    return (
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          <Bell size={24} />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {/* Due Reminders */}
              {dueReminders.map(reminder => (
                <div key={`reminder-${reminder._id}`} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {reminder.plant?.mainImage ? (
                        <img
                          src={reminder.plant.mainImage}
                          alt={reminder.plant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reminder.type} Reminder
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Time to {reminder.type.toLowerCase()} your {reminder.plant?.nickname || reminder.plant?.name || 'plant'}!
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Due: {new Date(reminder.scheduledDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            await reminderAPI.completeReminder(reminder._id);
                            setDueReminders(prev => prev.filter(r => r._id !== reminder._id));
                          } catch (error) {
                            console.error('Error completing reminder:', error);
                          }
                        }}
                        className="text-green-600 hover:text-green-800 text-xs"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Notifications from Context */}
              {notifications && notifications.length > 0 && notifications.map(notification => (
                <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.plantImage ? (
                        <img
                          src={notification.plantImage}
                          alt={notification.plantName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {totalNotifications === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              )}
            </div>

            {totalNotifications > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Clear all notifications
                    if (notifications && notifications.length > 0) {
                      notifications.forEach(n => clearNotification(n.id));
                    }
                    setShowNotifications(false);
                  }}
                  className="w-full text-sm text-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter plants based on health status
  const filteredPlants = plants.filter(plant => 
    healthFilter === 'All' ? true : plant.health === healthFilter
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeNavItem={activeNavItem}
        setActiveNavItem={setActiveNavItem}
      />

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-6">
              {/* Updated Header Section - Removed Add Plant button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <img 
                    src={LogoOJT} 
                    alt="Sprouty Logo" 
                    className="h-17 w-16"
                  />
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-2">Plant Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                  <NotificationButton />
                  <DarkModeToggle />
                </div>
              </div>

              {/* Plants Section - Updated UI */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">My Plants</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'} in your garden
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Add Health Filter Dropdown */}
                    <select
                      value={healthFilter}
                      onChange={(e) => setHealthFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {healthStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Existing Add Plant button */}
                    <button 
                      onClick={handleAddPlant}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
                    >
                      <Plus size={20} className="mr-1" /> Add Plant
                    </button>
                  </div>
                </div>

                {filteredPlants.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 border-dashed">
                    <Camera size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="font-medium dark:text-gray-300">
                      {healthFilter === 'All' 
                        ? 'No plants yet. Add your first plant!'
                        : `No ${healthFilter.toLowerCase()} plants found`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlants.map(plant => (
                      <div 
                        key={plant.id} 
                        className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => handlePlantClick(plant)}
                      >
                        {/* Plant Image */}
                        <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img 
                            src={plant.image} 
                            alt={plant.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => handleImageError(e, plant.name)}
                          />
                        </div>
                        
                        {/* Quick Actions Overlay - Update this section */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2 bg-black/20 backdrop-blur-sm p-1 rounded-lg">
                            <button 
                              className="p-1.5 rounded-lg hover:bg-green-500/80 transition-colors"
                              onClick={(e) => handleWaterClick(e, plant.id)}
                              title="Water Plant"
                            >
                              <Droplets size={16} className="text-white" />
                            </button>
                            <button 
                              className="p-1.5 rounded-lg hover:bg-purple-500/80 transition-colors"
                              onClick={(e) => handleFertilizeClick(e, plant.id)}
                              title="Fertilize Plant"
                            >
                              <Flower size={16} className="text-white" />
                            </button>
                            <button 
                              className="p-1.5 rounded-lg hover:bg-blue-500/80 transition-colors"
                              onClick={(e) => handlePruningClick(e, plant.id)}
                              title="Prune Plant"
                            >
                              <Scissors size={16} className="text-white" />
                            </button>
                            <div className="w-px h-4 my-auto bg-white/20"></div>
                            <button 
                              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                              onClick={(e) => handleEditClick(e, plant)}
                              title="Edit Plant"
                            >
                              <Edit size={16} className="text-white" />
                            </button>
                            <button 
                              className="p-1.5 rounded-lg hover:bg-red-500/80 transition-colors"
                              onClick={(e) => handleDeleteClick(e, plant.id)}
                              title="Delete Plant"
                            >
                              <Trash2 size={16} className="text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Plant Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800 dark:text-white">{plant.nickname}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{plant.species}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              plant.health === 'Healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              plant.health === 'Needs Attention' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {plant.health || plant.status || 'Healthy'}
                            </div>
                          </div>

                          {/* Plant Stats with Diagnose Button */}
                          <div className="mt-4">
                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Droplets size={16} className="mr-2 text-blue-500" />
                                <span>{plant.lastWatered}</span>
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Calendar size={16} className="mr-2 text-gray-400" />
                                <span>Added {plant.dateAdded}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDiagnose(e, plant)}
                              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                            >
                              <Stethoscope size={16} />
                              <span>Diagnose Plant</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Weather Widget (simplified version) */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <Weather />
          </div>
        </div>
      </div>

      {/* Close notification dropdown when clicking outside */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Replace Camera Modal with AddPlant Component */}
      {showAddPlant && (
        <AddPlant 
          onAddPlant={handleSavePlant} 
          onCancel={() => setShowAddPlant(false)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle size={24} className="text-red-500 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Delete Plant</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deletingPlant.nickname}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingPlant(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Delete Plant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plant Details Modal */}
      {selectedPlant && (
        <PlantDetails 
          plant={selectedPlant} 
          onClose={() => setSelectedPlant(null)}
          onUpdate={(updatedPlant) => {
            // Update the plant in the plants list
            setPlants(prevPlants => 
              prevPlants.map(p => 
                p.id === updatedPlant.id ? updatedPlant : p
              )
            );
            // Update the selected plant for the modal
            setSelectedPlant(updatedPlant);
          }}
        />
      )}

      {/* Add EditPlant Modal */}
      {editingPlant && (
        <EditPlant
          plant={editingPlant}
          onSave={handlePlantUpdate}
          onCancel={() => setEditingPlant(null)}
        />
      )}
    </div>
  );
};

const WeatherItem = ({ icon, label, value, className = "" }) => (
  <div className={`flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${className}`}>
    <div className="mr-3">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{value}</p>
    </div>
  </div>
);

export default Dashboard;
