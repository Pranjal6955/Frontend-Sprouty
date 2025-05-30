import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { reminderAPI } from '../services/reminderAPI';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isCheckingReminders, setIsCheckingReminders] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const notificationRef = useRef(null);
  const intervalRef = useRef(null);

  // Enhanced notification manager with retry logic
  useEffect(() => {
    const notificationManager = {
      addNotification: (notification) => {
        addNotification(notification);
      },
      processDueReminders: (reminders) => {
        processReminderNotifications(reminders);
      },
      removeReminderNotification: (reminderId) => {
        if (reminderId) {
          removeNotification(`reminder-${reminderId}`);
        }
      },
      clearAllNotifications: clearAllNotifications,
      retryFailedCheck: () => {
        checkReminders();
      }
    };

    window.notificationManager = notificationManager;
    notificationRef.current = notificationManager;

    return () => {
      delete window.notificationManager;
    };
  }, []);

  // Enhanced reminder processing with improved notification data
  const processReminderNotifications = useCallback((reminders) => {
    if (!Array.isArray(reminders) || reminders.length === 0) return;
    
    console.log('Processing due reminders for notifications:', reminders.length);
    
    const newNotifications = reminders.map(reminder => {
      let plantName = 'Unknown Plant';
      let plantImage = null;
      
      if (reminder.plant) {
        if (typeof reminder.plant === 'object') {
          plantName = reminder.plant.nickname || reminder.plant.name || 'Unknown Plant';
          plantImage = reminder.plant.mainImage;
        } else {
          plantName = 'Your Plant';
        }
      }
      
      // Determine if this is overdue or just due now
      const isOverdue = new Date(reminder.scheduledDate) < new Date(Date.now() - 30 * 60 * 1000); // 30 minutes past
      
      return {
        id: `reminder-${reminder._id}`,
        type: 'reminder',
        title: `${reminder.type} Reminder${isOverdue ? ' (Overdue)' : ''}`,
        message: `Time to ${reminder.type.toLowerCase()} your ${plantName}!`,
        plantName: plantName,
        plantImage: plantImage,
        reminderType: reminder.type,
        timestamp: new Date(),
        reminderId: reminder._id,
        reminderData: reminder,
        priority: isOverdue ? 'high' : 'medium',
        autoClose: false,
        isOverdue,
        scheduledFor: reminder.scheduledDate,
        actions: [
          {
            label: 'Mark Done',
            action: 'complete',
            style: 'primary'
          },
          {
            label: `Snooze ${isOverdue ? '1h' : '30m'}`,
            action: 'snooze',
            style: 'secondary',
            duration: isOverdue ? 60 : 30
          }
        ]
      };
    });

    // Update state with deduplication
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      
      if (uniqueNew.length > 0) {
        console.log('Adding new notifications:', uniqueNew.length);
        
        // Mark notifications as sent with batch processing
        setTimeout(async () => {
          const markingPromises = uniqueNew.map(async (notification) => {
            if (notification.reminderId) {
              try {
                await reminderAPI.markNotificationSent(notification.reminderId);
              } catch (error) {
                console.error('Error marking notification as sent:', error);
              }
            }
          });
          
          await Promise.allSettled(markingPromises);
        }, 1000);
        
        return [...prev, ...uniqueNew];
      }
      
      return prev;
    });
  }, []);

  // Enhanced reminder checking with error handling and retry logic
  const checkReminders = useCallback(async (isRetry = false) => {
    if (isCheckingReminders && !isRetry) return;
    
    setIsCheckingReminders(true);
    setError(null);
    
    try {
      const response = await reminderAPI.getDueReminders();
      
      if (response.success !== false && response.data) {
        processReminderNotifications(response.data);
        setLastCheck(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch due reminders');
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
      setError(error.message);
      
      // Retry logic: try again in 30 seconds if it's not already a retry
      if (!isRetry) {
        setTimeout(() => {
          checkReminders(true);
        }, 30000);
      }
    } finally {
      setIsCheckingReminders(false);
    }
  }, [isCheckingReminders, processReminderNotifications]);

  // Enhanced effect with better interval management
  useEffect(() => {
    // Initial check
    checkReminders();

    // Set up interval with exponential backoff on errors
    const setupInterval = () => {
      const intervalTime = error ? 2 * 60 * 1000 : 3 * 60 * 1000; // 2min if error, 3min normally
      
      intervalRef.current = setInterval(() => {
        checkReminders();
      }, intervalTime);
    };

    setupInterval();

    // Update interval when error state changes
    const errorTimeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setupInterval();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(errorTimeout);
    };
  }, [checkReminders, error]);

  // Enhanced notification actions
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      autoClose: true,
      ...notification
    };
    
    setNotifications(prev => {
      // Limit total notifications to prevent memory issues
      const updated = [newNotification, ...prev];
      return updated.slice(0, 50); // Keep only latest 50 notifications
    });

    // Auto-remove if specified
    if (newNotification.autoClose && newNotification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 8000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotification = useCallback((id) => {
    removeNotification(id);
  }, [removeNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle notification actions
  const handleNotificationAction = useCallback(async (notification, action) => {
    try {
      switch (action) {
        case 'complete':
          if (notification.reminderId) {
            const response = await reminderAPI.completeReminder(notification.reminderId);
            if (response.success !== false) {
              // Add completion to reminder history with enhanced message and details
              const completionEntry = {
                id: `completed-${notification.reminderId}-${Date.now()}`,
                reminderId: notification.reminderId,
                type: 'completed',
                action: `Completed ${notification.reminderType.toLowerCase()} task for ${notification.plantName}`,
                reminderType: notification.reminderType,
                plantName: notification.plantName || 'Unknown Plant',
                plantId: notification.plantId,
                historyDate: new Date().toISOString(),
                notes: notification.reminderData?.notes || '',
                originalReminder: notification.reminderData,
                icon: 'check',
                fromNotification: true,
                source: 'notification',
                details: `Completed via notification alert at ${new Date().toLocaleTimeString()}`
              };
              
              // Get current history and add this entry
              const currentHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
              const updatedHistory = [completionEntry, ...currentHistory].slice(0, 100);
              localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
              
              // Show success notification
              addNotification({
                title: 'Reminder Completed',
                message: `${notification.reminderType} task completed for ${notification.plantName}`,
                type: 'success',
                autoClose: true
              });
              removeNotification(notification.id);
            }
          }
          break;
          
        case 'snooze':
          if (notification.reminderId) {
            // Use duration from the action if available, fallback to default
            const duration = notification.actions?.find(a => a.action === 'snooze')?.duration || 30;
            
            const response = await reminderAPI.snoozeReminder(notification.reminderId, duration);
            if (response.success !== false) {
              // Add snooze to history
              const snoozeEntry = {
                id: `snooze-${notification.reminderId}-${Date.now()}`,
                reminderId: notification.reminderId,
                type: 'snooze',
                action: `Snoozed ${notification.reminderType.toLowerCase()} reminder for ${notification.plantName}`,
                reminderType: notification.reminderType,
                plantName: notification.plantName || 'Unknown Plant',
                plantId: notification.plantId,
                historyDate: new Date().toISOString(),
                notes: notification.reminderData?.notes || '',
                originalReminder: notification.reminderData,
                icon: 'snooze',
                fromNotification: true,
                source: 'notification',
                details: `Snoozed for ${duration} minutes via notification alert`
              };
              
              // Update history
              const currentHistory = JSON.parse(localStorage.getItem('reminderHistory') || '[]');
              const updatedHistory = [snoozeEntry, ...currentHistory].slice(0, 100);
              localStorage.setItem('reminderHistory', JSON.stringify(updatedHistory));
              
              addNotification({
                title: 'Reminder Snoozed',
                message: `Reminder snoozed for ${duration} minutes`,
                type: 'info',
                autoClose: true
              });
              removeNotification(notification.id);
            }
          }
          break;
          
        default:
          removeNotification(notification.id);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to process action. Please try again.',
        type: 'error',
        autoClose: true
      });
    }
  }, [addNotification, removeNotification]);

  const value = {
    notifications,
    isCheckingReminders,
    lastCheck,
    error,
    addNotification,
    removeNotification,
    clearNotification,
    clearAllNotifications,
    processDueReminders: processReminderNotifications,
    handleNotificationAction,
    retryCheck: () => checkReminders(true)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
