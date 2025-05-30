import React from 'react';
import { Droplets, Flower, Scissors, AlertCircle, CheckCircle, Calendar, Clock } from 'lucide-react';

const ReminderListItem = ({ reminder, onComplete }) => {
  // Helper function to get icon based on reminder type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Water':
        return <Droplets className="text-blue-500" />;
      case 'Fertilize':
        return <Flower className="text-purple-500" />;
      case 'Prune':
        return <Scissors className="text-green-500" />;
      case 'Repot':
        return <AlertCircle className="text-yellow-500" />;
      default:
        return <Calendar className="text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // Determine if reminder is past due
  const isPastDue = () => {
    if (!reminder.scheduledDate || reminder.completed) return false;
    const now = new Date();
    const scheduledDate = new Date(reminder.scheduledDate);
    return scheduledDate < now;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3 border-l-4 ${
      reminder.completed 
        ? 'border-green-500 dark:border-green-600' 
        : isPastDue()
          ? 'border-red-500 dark:border-red-600'
          : 'border-blue-500 dark:border-blue-600'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            {getTypeIcon(reminder.type)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {reminder.type} {reminder.plant?.name || 'Plant'}
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Calendar size={14} className="mr-1" />
              {formatDate(reminder.scheduledDate)}
              <span className="mx-2">•</span>
              <Clock size={14} className="mr-1" />
              {formatTime(reminder.scheduledDate)}
            </div>
          </div>
        </div>
        
        {!reminder.completed && (
          <button
            onClick={() => onComplete(reminder._id)}
            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
            title="Mark as completed"
          >
            <CheckCircle size={20} />
          </button>
        )}
      </div>
      
      {reminder.notes && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 pl-11">
          {reminder.notes}
        </p>
      )}
      
      {reminder.completed && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400 pl-11">
          ✓ Completed {reminder.completedDate ? formatDate(reminder.completedDate) : ''}
        </div>
      )}
      
      {isPastDue() && !reminder.completed && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 pl-11">
          Past due
        </div>
      )}
    </div>
  );
};

export default ReminderListItem;
