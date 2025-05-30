import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Calendar, Clock, Droplets, Plus, Trash2, Loader, CheckCircle, AlertCircle, Filter, Search, RotateCcw, Leaf, Scissors, Package } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LogoOJT from '../assets/LogoOJT.png';
import { plantAPI } from '../services/api';
import { reminderAPI } from '../services/reminderAPI';

const Reminder = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('Reminders');
  const [activeSection, setActiveSection] = useState('upcoming');
  const [completedReminders, setCompletedReminders] = useState([]);
  const [reminderHistory, setReminderHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reminders, setReminders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    plant: "",
    type: "Water",
    scheduledDate: "",
    time: "",
    recurring: true,
    frequency: "weekly",
    notes: "",
    notificationMethods: ["popup"]
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  
  // Improved getPlantName function with better null handling
  const getPlantName = (plantRef) => {
    if (!plantRef) return 'Unknown Plant';
    
    // If plant is populated (object), get name from it
    if (typeof plantRef === 'object' && plantRef.name) {
      return plantRef.nickname || plantRef.name;
    }
    
    // If plant is just an ID, find it in our plants array
    if (plants && plants.length > 0) {
      const plant = plants.find(p => p._id === plantRef || p.id === plantRef);
      if (plant) {
        return plant.nickname || plant.name;
      }
    }
    
    // If we couldn't find the plant or plants aren't loaded yet, return a fallback
    return 'Plant';
  };

  // Enhanced useEffect with deferred history creation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch data with proper error handling
        const [reminderResponse, plantResponse] = await Promise.allSettled([
          reminderAPI.getReminders(),
          plantAPI.getAllPlants()
        ]);
        
        // First, set plants so they're available for getPlantName
        if (plantResponse.status === 'fulfilled') {
          const plantData = plantResponse.value;
          if (plantData.success !== false) {
            setPlants(Array.isArray(plantData.data) ? plantData.data : []);
          } else {
            setError(prev => prev ? `${prev}\nFailed to load plants: ${plantData.error}` : `Failed to load plants: ${plantData.error}`);
          }
        } else {
          setError(prev => prev ? `${prev}\nFailed to fetch plants: ${plantResponse.reason?.message}` : `Failed to fetch plants: ${plantResponse.reason?.message}`);
        }
        
        // Then handle reminders
        if (reminderResponse.status === 'fulfilled') {
          const reminderData = reminderResponse.value;
          if (reminderData.success !== false) {
            const reminders = reminderData.data || [];
            setReminders(Array.isArray(reminders) ? reminders : []);
            
            // Separate completed reminders
            const completed = reminders.filter(r => r.completed);
            setCompletedReminders(completed);
            
            // We'll create the history after the component has fully updated
            setTimeout(() => {
              createReminderHistory(reminders);
            }, 100);
          } else {
            setError(prev => prev ? `${prev}\nFailed to load reminders: ${reminderData.error}` : `Failed to load reminders: ${reminderData.error}`);
          }
        } else {
          setError(prev => prev ? `${prev}\nFailed to fetch reminders: ${reminderResponse.reason?.message}` : `Failed to fetch reminders: ${reminderResponse.reason?.message}`);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      if (!refreshing) {
        refreshData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshing]); // Removed plants from dependency array to avoid loop

  // Separate function to create reminder history
  const createReminderHistory = useCallback((reminders) => {
    try {
      // Create comprehensive history entries from all reminders
      const historyEntries = [];
      
      reminders.forEach(reminder => {
        // Add creation history entry
        historyEntries.push({
          id: `created-${reminder._id}`,
          reminderId: reminder._id,
          type: 'created',
          action: `Created ${reminder.type.toLowerCase()} reminder`,
          reminderType: reminder.type,
          plantName: getPlantName(reminder.plant),
          plantId: reminder.plant,
          historyDate: reminder.createdAt || reminder.scheduledDate,
          notes: reminder.notes,
          originalReminder: reminder,
          icon: 'plus'
        });
        
        // Add completion history entry if completed
        if (reminder.completed) {
          historyEntries.push({
            id: `completed-${reminder._id}`,
            reminderId: reminder._id,
            type: 'completed',
            action: `Completed ${reminder.type.toLowerCase()} task`,
            reminderType: reminder.type,
            plantName: getPlantName(reminder.plant),
            plantId: reminder.plant,
            historyDate: reminder.completedDate || reminder.updatedAt,
            notes: reminder.notes,
            originalReminder: reminder,
            icon: 'check'
          });
        }
        
        // Add notification history entries if notifications were sent
        if (reminder.notificationSent && reminder.lastNotificationSent) {
          historyEntries.push({
            id: `notified-${reminder._id}`,
            reminderId: reminder._id,
            type: 'notified',
            action: `Notification sent for ${reminder.type.toLowerCase()}`,
            reminderType: reminder.type,
            plantName: getPlantName(reminder.plant),
            plantId: reminder.plant,
            historyDate: reminder.lastNotificationSent,
            notes: reminder.notes,
            originalReminder: reminder,
            icon: 'bell'
          });
        }
        
        // Add update history entries if reminder was modified
        if (reminder.updatedAt && reminder.createdAt && 
            new Date(reminder.updatedAt) > new Date(reminder.createdAt) && 
            !reminder.completed) {
          historyEntries.push({
            id: `updated-${reminder._id}`,
            reminderId: reminder._id,
            type: 'updated',
            action: `Updated ${reminder.type.toLowerCase()} reminder`,
            reminderType: reminder.type,
            plantName: getPlantName(reminder.plant),
            plantId: reminder.plant,
            historyDate: reminder.updatedAt,
            notes: reminder.notes,
            originalReminder: reminder,
            icon: 'edit'
          });
        }
      });
      
      // Load additional history from localStorage (for deleted items)
      const storedHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
      const validStoredHistory = storedHistory.filter(entry => 
        entry.historyDate && 
        new Date(entry.historyDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      );
      
      // Combine and sort all history entries
      const allHistory = [...historyEntries, ...validStoredHistory];
      const sortedHistory = allHistory.sort((a, b) => 
        new Date(b.historyDate) - new Date(a.historyDate)
      );
      
      // Remove duplicates based on unique combination of type, reminderId, and date
      const uniqueHistory = sortedHistory.filter((entry, index, array) => 
        index === array.findIndex(e => 
          e.id === entry.id || 
          (e.type === entry.type && e.reminderId === entry.reminderId && 
           Math.abs(new Date(e.historyDate) - new Date(entry.historyDate)) < 1000)
        )
      );
      
      setReminderHistory(uniqueHistory);
      
      // Update localStorage with current history
      localStorage.setItem('reminderHistory', JSON.stringify(uniqueHistory.slice(0, 100))); // Keep last 100 entries
    } catch (error) {
      console.error('Error creating reminder history:', error);
    }
  }, [getPlantName]);

  // Enhanced refreshData function with better history management
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await reminderAPI.getReminders();
      if (response.success !== false) {
        const reminderData = response.data || [];
        setReminders(Array.isArray(reminderData) ? reminderData : []);
        
        // Update completed reminders
        const completed = reminderData.filter(r => r.completed);
        setCompletedReminders(completed);
        
        // Create a detailed history from server data and localStorage
        const storedHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
        
        // Extract unique IDs from stored history to avoid duplicates
        const existingHistoryIds = new Set(storedHistory.map(h => h.reminderId));
        const existingCompletedIds = new Set(storedHistory
          .filter(h => h.type === 'completed')
          .map(h => h.reminderId));
        
        // Create new history entries from server data that's not in stored history
        const newHistoryEntries = [];
        
        // Add completion history for newly completed reminders
        reminderData.forEach(reminder => {
          if (reminder.completed && !existingCompletedIds.has(reminder._id)) {
            newHistoryEntries.push({
              id: `completed-${reminder._id}-${Date.now()}`,
              reminderId: reminder._id,
              type: 'completed',
              action: `Completed ${reminder.type.toLowerCase()} task for ${getPlantName(reminder.plant)}`,
              reminderType: reminder.type,
              plantName: getPlantName(reminder.plant),
              plantId: reminder.plant,
              historyDate: reminder.completedDate || reminder.updatedAt || new Date().toISOString(),
              notes: reminder.notes,
              originalReminder: reminder,
              icon: 'check',
              fromServer: true
            });
          }
        });
        
        // Update history with new entries
        if (newHistoryEntries.length > 0) {
          const updatedHistory = [...newHistoryEntries, ...storedHistory]
            .sort((a, b) => new Date(b.historyDate) - new Date(a.historyDate))
            .slice(0, 200); // Keep reasonable history size
          
          localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
          setReminderHistory(updatedHistory);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Enhanced handleCompleteReminder with better history message
  const handleCompleteReminder = async (reminderId) => {
    const reminderToComplete = reminders.find(r => r._id === reminderId);
    if (!reminderToComplete) return;

    // Update UI immediately
    setReminders(prev => prev.filter(r => r._id !== reminderId));
    setCompletedReminders(prev => [
      { ...reminderToComplete, completed: true, completedDate: new Date() },
      ...prev
    ]);

    // Add completion entry to history immediately with enhanced message
    const completionEntry = {
      id: `completed-${reminderId}-${Date.now()}`,
      reminderId: reminderId,
      type: 'completed',
      action: `Completed ${reminderToComplete.type.toLowerCase()} task for ${getPlantName(reminderToComplete.plant)}`,
      reminderType: reminderToComplete.type,
      plantName: getPlantName(reminderToComplete.plant),
      plantId: reminderToComplete.plant,
      historyDate: new Date().toISOString(),
      notes: reminderToComplete.notes,
      originalReminder: reminderToComplete,
      icon: 'check',
      fromApp: true,
      source: 'app'
    };
    
    setReminderHistory(prev => [completionEntry, ...prev]);

    try {
      const response = await reminderAPI.completeReminder(reminderId);
      
      if (response.success === false) {
        // Revert optimistic updates on error
        setReminders(prev => [...prev, reminderToComplete]);
        setCompletedReminders(prev => prev.filter(r => r._id !== reminderId));
        setReminderHistory(prev => prev.filter(entry => entry.id !== completionEntry.id));
        setError('Failed to complete reminder: ' + response.error);
      } else {
        // Update localStorage with successful completion
        const currentHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
        const updatedHistory = [completionEntry, ...currentHistory].slice(0, 100);
        localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
      }
    } catch (err) {
      // Revert optimistic updates on error
      setReminders(prev => [...prev, reminderToComplete]);
      setCompletedReminders(prev => prev.filter(r => r._id !== reminderId));
      setReminderHistory(prev => prev.filter(entry => entry.id !== completionEntry.id));
      console.error('Error completing reminder:', err);
      setError('Failed to complete reminder. Please try again.');
    }
  };

  // Enhanced handleDeleteReminder with better history message
  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    const reminderToDelete = reminders.find(r => r._id === reminderId) || 
                            completedReminders.find(r => r._id === reminderId);
    
    if (!reminderToDelete) return;

    // Add deletion entry to history with enhanced message
    const deletionEntry = {
      id: `deleted-${reminderId}-${Date.now()}`,
      reminderId: reminderId,
      type: 'deleted',
      action: `Deleted ${reminderToDelete.type.toLowerCase()} reminder for ${getPlantName(reminderToDelete.plant)}`,
      reminderType: reminderToDelete.type,
      plantName: getPlantName(reminderToDelete.plant),
      plantId: reminderToDelete.plant,
      historyDate: new Date().toISOString(),
      notes: reminderToDelete.notes,
      originalReminder: reminderToDelete,
      icon: 'trash',
      details: `Scheduled for ${formatDate(reminderToDelete.scheduledDate)} at ${formatTime(reminderToDelete.scheduledDate)}`
    };

    try {
      const response = await reminderAPI.deleteReminder(reminderId);
      
      if (response.success !== false) {
        // Remove from all reminder lists
        setReminders(prev => prev.filter(r => r._id !== reminderId));
        setCompletedReminders(prev => prev.filter(r => r._id !== reminderId));
        
        // Add deletion to history
        setReminderHistory(prev => [deletionEntry, ...prev]);
        
        // Update localStorage
        const currentHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
        const updatedHistory = [deletionEntry, ...currentHistory].slice(0, 100);
        localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
      } else {
        setError('Failed to delete reminder: ' + response.error);
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder. Please try again.');
    }
  };

  // Enhanced handleAddReminder with history tracking
  const handleAddReminder = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newReminder.plant || !newReminder.scheduledDate || !newReminder.time) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate future date
    const scheduledDateTime = new Date(`${newReminder.scheduledDate}T${newReminder.time}`);
    const now = new Date();
    if (scheduledDateTime <= now) {
      setError('Please select a future date and time');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const reminderData = {
        plant: newReminder.plant,
        type: newReminder.type,
        scheduledDate: scheduledDateTime.toISOString(),
        recurring: newReminder.recurring,
        frequency: newReminder.frequency,
        notes: newReminder.notes || `${newReminder.type} reminder for plant`,
        notificationMethods: newReminder.notificationMethods
      };

      const response = await reminderAPI.createReminder(reminderData);
      
      if (response.success !== false) {
        setReminders(prev => [...prev, response.data]);
        
        // Add creation entry to history
        const creationEntry = {
          id: `created-${response.data._id}-${Date.now()}`,
          reminderId: response.data._id,
          type: 'created',
          action: `Created ${response.data.type.toLowerCase()} reminder`,
          reminderType: response.data.type,
          plantName: getPlantName(response.data.plant),
          plantId: response.data.plant,
          historyDate: new Date().toISOString(),
          notes: response.data.notes,
          originalReminder: response.data,
          icon: 'plus'
        };
        
        setReminderHistory(prev => [creationEntry, ...prev]);
        
        // Update localStorage
        const currentHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
        const updatedHistory = [creationEntry, ...currentHistory].slice(0, 100);
        localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
        
        setShowAddReminder(false);
        setNewReminder({
          plant: "",
          type: "Water",
          scheduledDate: "",
          time: "",
          recurring: true,
          frequency: "weekly",
          notes: "",
          notificationMethods: ["popup"]
        });
      } else {
        setError('Failed to create reminder: ' + response.error);
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError('Failed to create reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to get history icon with more types
  const getHistoryIcon = (reminderType, entryType, iconType) => {
    // Use iconType if specified, otherwise fall back to entryType
    const icon = iconType || entryType;
    
    switch (icon) {
      case 'check':
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'plus':
      case 'created':
        return <Plus size={16} className="text-blue-500" />;
      case 'trash':
      case 'deleted':
        return <Trash2 size={16} className="text-red-500" />;
      case 'bell':
      case 'notified':
        return <Bell size={16} className="text-yellow-500" />;
      case 'edit':
      case 'updated':
        return <Clock size={16} className="text-orange-500" />;
      case 'snooze':
        return <Clock size={16} className="text-purple-500" />;
      default:
        // Fall back to reminder type icons
        switch (reminderType?.toLowerCase()) {
          case 'water': return <Droplets size={16} className="text-blue-500" />;
          case 'fertilize': return <Leaf size={16} className="text-green-500" />;
          case 'prune': return <Scissors size={16} className="text-orange-500" />;
          case 'repot': return <Package size={16} className="text-purple-500" />;
          default: return <Bell size={16} className="text-gray-500" />;
        }
    }
  };

  // Enhanced getActionMessage for more detailed history entries
  const getActionMessage = (entry) => {
    const plantName = entry.plantName || 'Unknown Plant';
    const type = entry.reminderType?.toLowerCase() || 'task';
    
    switch (entry.type) {
      case 'completed':
        return entry.fromNotification 
          ? `Completed ${type} task for ${plantName} via notification`
          : `Completed ${type} task for ${plantName}`;
      case 'created':
        return `Created ${type} reminder for ${plantName}`;
      case 'deleted':
        return `Deleted ${type} reminder for ${plantName}`;
      case 'notified':
        return `Received notification to ${type} ${plantName}`;
      case 'updated':
        return `Updated ${type} reminder for ${plantName}`;
      case 'snooze':
        return `Snoozed ${type} reminder for ${plantName}`;
      default:
        return entry.action || `Action on ${type} for ${plantName}`;
    }
  };

  // Filter and sort reminders
  const getFilteredReminders = (reminderList) => {
    let filtered = reminderList;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type.toLowerCase() === filterType.toLowerCase());
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => 
        getPlantName(r.plant).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort reminders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.scheduledDate) - new Date(b.scheduledDate);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'plant':
          return getPlantName(a.plant).localeCompare(getPlantName(b.plant));
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Add function to format history date
  const formatHistoryDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getFrequencyDisplay = (frequency) => {
    if (typeof frequency === 'number') {
      return frequency === 1 ? 'Daily' :
             frequency === 7 ? 'Weekly' :
             frequency === 30 ? 'Monthly' :
             `Every ${frequency} days`;
    }
    return frequency || 'Weekly';
  };

  // Add function to clear history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all reminder history? This cannot be undone.')) {
      // Clear the history in state
      setReminderHistory([]);
      
      // Clear the history in localStorage
      localStorage.removeItem('reminderHistory');
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar 
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader size={48} className="animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeNavItem={activeNavItem}
        setActiveNavItem={setActiveNavItem}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Enhanced Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <img src={LogoOJT} alt="Sprouty Logo" className="h-17 w-16" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-2">Plant Care Reminders</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"
                title="Refresh reminders"
              >
                <RotateCcw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => setShowAddReminder(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
              >
                <Plus size={20} className="mr-1" /> Add Reminder
              </button>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
              <div>
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}

          {/* Filter and Search Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reminders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value="water">Water</option>
                  <option value="fertilize">Fertilize</option>
                  <option value="prune">Prune</option>
                  <option value="repot">Repot</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="date">Date</option>
                  <option value="type">Type</option>
                  <option value="plant">Plant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeSection === 'upcoming'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setActiveSection('upcoming')}
            >
              <Calendar size={16} />
              Upcoming ({getFilteredReminders(reminders.filter(r => !r.completed)).length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeSection === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setActiveSection('completed')}
            >
              <CheckCircle size={16} />
              Completed ({getFilteredReminders(completedReminders).length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeSection === 'history'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setActiveSection('history')}
            >
              <Clock size={16} />
              History ({reminderHistory.length})
            </button>
          </div>

          {/* Enhanced Content Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Bell className="text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {activeSection === 'upcoming' ? 'Upcoming Reminders' : 
                   activeSection === 'completed' ? 'Completed Reminders' : 
                   'Reminder History'}
                </h2>
              </div>
              {/* Add Clear History button for history section */}
              {activeSection === 'history' && reminderHistory.length > 0 ? (
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center"
                >
                  <Trash2 size={16} className="mr-1.5" />
                  Clear History
                </button>
              ) : refreshing && (
                <Loader size={20} className="animate-spin text-green-500" />
              )}
            </div>

            <div className="space-y-4">
              {/* Enhanced History Section */}
              {activeSection === 'history' && 
                reminderHistory
                  .filter(entry => {
                    // Apply filters
                    if (filterType !== 'all' && entry.reminderType?.toLowerCase() !== filterType.toLowerCase()) {
                      return false;
                    }
                    if (searchTerm) {
                      return entry.plantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             entry.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             entry.type?.toLowerCase().includes(searchTerm.toLowerCase());
                    }
                    return true;
                  })
                  .map(entry => (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        entry.type === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        entry.type === 'deleted' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                        entry.type === 'created' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                        entry.type === 'notified' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                        entry.type === 'snooze' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                        'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          entry.type === 'completed' ? 'bg-green-100 dark:bg-green-800' :
                          entry.type === 'deleted' ? 'bg-red-100 dark:bg-red-800' :
                          entry.type === 'created' ? 'bg-blue-100 dark:bg-blue-800' :
                          entry.type === 'notified' ? 'bg-yellow-100 dark:bg-yellow-800' :
                          entry.type === 'snooze' ? 'bg-purple-100 dark:bg-purple-800' :
                          'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          {getHistoryIcon(entry.reminderType, entry.type, entry.icon)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {getActionMessage(entry)}
                            {entry.fromNotification && !entry.fromServer && 
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                From notification
                              </span>
                            }
                            {entry.fromBoth && 
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                Notification & App
                              </span>
                            }
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.details || 
                              (entry.notes ? entry.notes : 
                                entry.originalReminder?.recurring ? 
                                  `${getFrequencyDisplay(entry.originalReminder.frequency)} reminder` : 
                                  'One-time reminder')}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.type === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              entry.type === 'deleted' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              entry.type === 'created' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              entry.type === 'notified' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              entry.type === 'snooze' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                            </span>
                            <span className="ml-2">{entry.reminderType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock size={16} className="mr-1" />
                          <span className="text-sm">{formatHistoryDate(entry.historyDate)}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(entry.historyDate).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
              }

              {/* Upcoming and Completed Reminders (existing code) */}
              {(activeSection === 'upcoming' || activeSection === 'completed') && 
                getFilteredReminders(
                  activeSection === 'upcoming' 
                    ? reminders.filter(r => !r.completed)
                    : completedReminders
                ).map(reminder => (
                  <div 
                    key={reminder._id || reminder.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        reminder.type === 'Water' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        reminder.type === 'Fertilize' ? 'bg-green-100 dark:bg-green-900/30' :
                        reminder.type === 'Prune' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <Droplets className={
                          reminder.type === 'Water' ? 'text-blue-500' :
                          reminder.type === 'Fertilize' ? 'text-green-500' :
                          reminder.type === 'Prune' ? 'text-yellow-500' :
                          'text-purple-500'
                        } />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-white">
                          {getPlantName(reminder.plant)} - {reminder.type}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reminder.recurring ? getFrequencyDisplay(reminder.frequency) : 'One-time'}
                          {reminder.notes && ` • ${reminder.notes}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar size={16} className="mr-1" />
                          <span className="text-sm">{formatDate(reminder.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock size={16} className="mr-1" />
                          <span className="text-sm">{formatTime(reminder.scheduledDate)}</span>
                        </div>
                      </div>
                      
                      {activeSection === 'upcoming' ? (
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleCompleteReminder(reminder._id)}
                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                            title="Mark as completed"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteReminder(reminder._id)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                            title="Delete reminder"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleDeleteReminder(reminder._id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                          title="Delete reminder"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }
              
              {/* Enhanced Empty State */}
              {((activeSection === 'upcoming' && getFilteredReminders(reminders.filter(r => !r.completed)).length === 0) ||
                (activeSection === 'completed' && getFilteredReminders(completedReminders).length === 0) ||
                (activeSection === 'history' && reminderHistory.length === 0)) && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {searchTerm || filterType !== 'all' 
                      ? 'No entries match your filters'
                      : activeSection === 'upcoming' 
                        ? 'No upcoming reminders' 
                        : activeSection === 'completed'
                        ? 'No completed reminders'
                        : 'No reminder history yet'
                    }
                  </p>
                  {activeSection === 'history' && reminderHistory.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      Complete some reminders to see your history here
                    </p>
                  )}
                  {(searchTerm || filterType !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                      }}
                      className="mt-2 text-green-500 hover:text-green-600"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Add Reminder Modal */}
        {showAddReminder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Reminder</h3>
              <form onSubmit={handleAddReminder}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plant *
                    </label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={newReminder.plant}
                      onChange={(e) => setNewReminder({...newReminder, plant: e.target.value})}
                    >
                      <option value="">Select a plant...</option>
                      {plants.map(plant => (
                        <option key={plant._id} value={plant._id}>
                          {plant.nickname || plant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                    >
                      <option value="Water">Water</option>
                      <option value="Fertilize">Fertilize</option>
                      <option value="Prune">Prune</option>
                      <option value="Repot">Repot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={newReminder.scheduledDate}
                      onChange={(e) => setNewReminder({...newReminder, scheduledDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                    <input
                      type="time"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddReminder(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center"
                  >
                    {loading && <Loader size={16} className="animate-spin mr-2" />}
                    Add Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminder;
