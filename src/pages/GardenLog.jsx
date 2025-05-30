import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Droplets, AlertCircle, Scissors, Flower, Edit, Check, X, Loader, Edit2, Stethoscope } from 'lucide-react';
import { plantAPI, diagnosisAPI } from '../services/api';
import PlantHistoryLog from '../components/PlantHistoryLog';
import PlantDiagnoseLog from '../components/PlantDiagnoseLog';


const PlantLogCard = ({ plant, onNotesUpdate }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(plant.notes || '');
  const [showHistory, setShowHistory] = useState(false);
  const [showDiagnoseHistory, setShowDiagnoseHistory] = useState(false);
  const [diagnoseHistory, setDiagnoseHistory] = useState([]);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Healthy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Critical':
      case 'Sick':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const handleNotesSubmit = async () => {
    try {
      // Improved error handling and response checking
      const response = await plantAPI.updatePlant(plant._id || plant.id, { notes: editedNotes });
      
      if (response && response.success !== false) {
        setIsEditingNotes(false);
      } else {
        console.error('Failed to update notes:', response?.error || 'Unknown error');
        throw new Error(response?.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      // Could add UI feedback here for the error
    }
  };

  const handleNotesCancel = () => {
    setEditedNotes(plant.notes || '');
    setIsEditingNotes(false);
  };

  // Fetch diagnosis history when showing diagnose history
  const handleShowDiagnoseHistory = async () => {
    if (diagnoseHistory.length === 0) {
      try {
        setIsLoadingDiagnosis(true);
        const response = await diagnosisAPI.getPlantDiagnosisHistory(plant._id || plant.id);
        if (response.success) {
          setDiagnoseHistory(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching diagnosis history:', error);
      } finally {
        setIsLoadingDiagnosis(false);
      }
    }
    setShowDiagnoseHistory(true);
  };

  // Calculate health status based on plant data
  const getHealthStatus = (plant) => {
    const status = plant.status || plant.health || 'Healthy';
    if (status === 'Sick' || status === 'Critical') return 'Poor';
    if (status === 'Needs Attention') return 'Fair';
    return 'Good';
  };

  const getCurrentStatusStyle = () => {
    const currentStatus = plant.status || plant.health || 'Healthy';
    const status = statusOptions.find(s => s.value === currentStatus);
    return status || statusOptions[0];
  };

  // Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      // Get today, yesterday, and this week for relative time formatting
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const date = new Date(dateString);
      const dateDay = new Date(date);
      dateDay.setHours(0, 0, 0, 0);

      // Show relative dates for recent activities
      if (dateDay.getTime() === today.getTime()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (dateDay.getTime() === yesterday.getTime()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date > oneWeekAgo) {
        return date.toLocaleDateString([], { weekday: 'long' }) + 
               ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // Default to standard date format for older dates
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get the most recent care action of each type
  const getLastCareAction = (careHistory, actionType) => {
    if (!careHistory || !Array.isArray(careHistory)) return 'Never';

    // Include reminder-initiated care actions
    const actions = careHistory.filter(action => action.actionType === actionType);
    if (actions.length === 0) return 'Never';

    return formatDate(actions[0].date);
  };

  const health = getHealthStatus(plant);

  const handleCardClick = (e) => {
    // Don't open history if clicking on notes section or its children
    if (!e.target.closest('.notes-section') && !e.target.closest('.history-buttons')) {
      setShowHistory(true);
    }
  };

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={plant.mainImage || plant.image || 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Plant'} 
                alt={plant.name} 
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-green-100 dark:ring-green-900"
                onError={(e) => {
                  console.log('Failed to load image for plant:', plant.name);
                  e.target.src = 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Plant';
                }}
              />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                health === 'Good' ? 'bg-green-500' :
                health === 'Fair' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{plant.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {plant.species || plant.nickname || 'Unknown species'}
              </p>
            </div>
          </div>

          {/* Read-only Status Badge */}
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(plant.status || plant.health)}`}>
            {plant.status || plant.health || 'Healthy'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <Droplets className="text-blue-500" size={20} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Watered</p>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {plant.lastWatered ? formatDate(plant.lastWatered) : getLastCareAction(plant.careHistory, 'Watered')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <Flower className="text-purple-500" size={20} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Fertilised</p>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {plant.lastFertilized ? formatDate(plant.lastFertilized) : getLastCareAction(plant.careHistory, 'Fertilized')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <Scissors className="text-green-500" size={20} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Pruning</p>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {plant.lastPruned ? formatDate(plant.lastPruned) : getLastCareAction(plant.careHistory, 'Pruned')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <AlertCircle className="text-yellow-500" size={20} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Health Status</p>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {plant.health || plant.status || 'Healthy'}
              </span>
            </div>
          </div>
        </div>

        {/* Add notes-section class to prevent history popup */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg relative group notes-section">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Recent Notes</h4>
            {!isEditingNotes && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <Edit size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 focus:border-green-500 dark:focus:border-green-500 focus:ring-1 focus:ring-green-500"
                rows={3}
                placeholder="Add notes about your plant..."
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleNotesCancel}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center text-sm"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleNotesSubmit}
                  className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center text-sm"
                >
                  <Check size={16} className="mr-1" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {plant.notes || 'No notes added yet. Click edit to add notes about your plant.'}
            </p>
          )}
        </div>

        {/* History Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3 history-buttons" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Droplets size={16} />
            <span>Care History</span>
          </button>
          
          <button
            onClick={handleShowDiagnoseHistory}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            disabled={isLoadingDiagnosis}
          >
            {isLoadingDiagnosis ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Stethoscope size={16} />
            )}
            <span>Diagnose History</span>
          </button>
        </div>
      </div>

      {/* Care History Modal */}
      <PlantHistoryLog 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        plant={plant}
      />
            {/* Diagnose History Modal */}
            <PlantDiagnoseLog
        isOpen={showDiagnoseHistory}
        onClose={() => setShowDiagnoseHistory(false)}
        plant={plant}
        diagnoseHistory={diagnoseHistory}
      />
    </>
  );
};

const GardenLog = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('Garden Log');
  const [searchTerm, setSearchTerm] = useState('');
  const [plantLogs, setPlantLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch plants from API
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching plants from API...');

        // Check if plantAPI and getAllPlants method exist
        if (!plantAPI || typeof plantAPI.getAllPlants !== 'function') {
          console.error('plantAPI or getAllPlants method not available');
          throw new Error('Plant API service is not properly configured');
        }

        const response = await plantAPI.getAllPlants();
        console.log('Fetched plants for Garden Log:', response);

        if (response && response.success !== false) {
          // Changed from response.success to response.success !== false for more resilience
          setPlantLogs(response.data || []);
        } else {
          console.error('API response was not successful:', response);
          setError(response?.error || 'Failed to fetch plants');
        }
      } catch (err) {
        console.error('Error fetching plants:', err);

        // Provide more specific error messages
        let errorMessage = 'Failed to load plants. Please try again.';

        if (err.message?.includes('Plant API service is not properly configured')) {
          errorMessage = 'Plant API service is not available. Please refresh the page.';
        } else if (err.message?.includes('Network Error') || err.code === 'NETWORK_ERROR') {
          errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (err.status === 401 || err.error?.includes('unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
  }, []);

  const handleNotesUpdate = async (plantId, newNotes) => {
    try {
      console.log('Updating notes for plant:', plantId, 'New notes:', newNotes);

      if (!plantAPI || typeof plantAPI.updatePlant !== 'function') {
        throw new Error('Plant API service is not properly configured');
      }

      const response = await plantAPI.updatePlant(plantId, { notes: newNotes });

      if (response && response.success !== false) {
        // Changed from response.success to response.success !== false
        // Update local state
        setPlantLogs(prevLogs =>
          prevLogs.map(plant =>
            plant._id === plantId || plant.id === plantId
              ? { ...plant, notes: newNotes }
              : plant
          )
        );
        console.log('Notes updated successfully');
      } else {
        throw new Error(response?.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating plant notes:', error);
      throw error;
    }
  };

  const handleStatusUpdate = async (plantId, newStatus) => {
    try {
      console.log('Updating status for plant:', plantId, 'New status:', newStatus);

      if (!plantAPI || typeof plantAPI.updatePlant !== 'function') {
        throw new Error('Plant API service is not properly configured');
      }

      const response = await plantAPI.updatePlant(plantId, { status: newStatus });

      if (response && response.success) {
        setPlants(prevPlants =>
          prevPlants.map(plant =>
            plant._id === plantId || plant.id === plantId
              ? { ...plant, status: newStatus }
              : plant
          )
        );
        console.log('Status updated successfully');
      } else {
        throw new Error(response?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating plant status:', error);
      throw error;
    }
  };

  // Filter plants based on search term
  const filteredPlants = plantLogs.filter(plant =>
    plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader size={48} className="animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading your plants...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Reload Page
                </button>
              </div>
            </div>
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

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Garden Log</h1>

            {/* Search Bar */}
            <div className="relative w-96">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Plants Grid */}
          {filteredPlants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Flower size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'No plants found' : 'No plants in your garden yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add your first plant to start building your garden log'
                }
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setActiveNavItem('My Garden')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Your First Plant
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlants.map(plant => (
                <PlantLogCard 
                  key={plant._id || plant.id} 
                  plant={plant} 
                  onNotesUpdate={handleNotesUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GardenLog;