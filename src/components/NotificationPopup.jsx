import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, Droplets, Leaf, Scissors, Package, CheckCircle, Clock, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationPopup = () => {
  const { notifications, handleNotificationAction, clearNotification } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [audioEnabled] = useState(true);

  // Use sound effect for notifications (optional)
  const playNotificationSound = useCallback(() => {
    if (audioEnabled) {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play prevented by browser policy'));
      } catch (error) {
        console.log('Audio notification not supported');
      }
    }
  }, [audioEnabled]);

  useEffect(() => {
    // Play sound only for new notifications
    const newNotificationIds = notifications
      .filter(n => !visibleNotifications.find(vn => vn.id === n.id))
      .map(n => n.id);

    if (newNotificationIds.length > 0) {
      playNotificationSound();
    }

    // Update visible notifications with new ones
    const updatedVisible = [...visibleNotifications];
    
    notifications.forEach((notification, index) => {
      if (!updatedVisible.find(vn => vn.id === notification.id)) {
        setTimeout(() => {
          setVisibleNotifications(prev => {
            if (!prev.find(n => n.id === notification.id)) {
              return [...prev, { ...notification, visible: true }];
            }
            return prev;
          });
        }, index * 300);
      }
    });

    // Remove notifications that are no longer in the context
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    setVisibleNotifications(prev => 
      prev.filter(vn => currentNotificationIds.has(vn.id))
    );
  }, [notifications.length, notifications.map(n => n.id).join(',')]); // Fixed dependency array

  const handleDismiss = useCallback((id) => {
    setVisibleNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, visible: false } : n)
    );
    
    setTimeout(() => {
      setVisibleNotifications(prev => prev.filter(n => n.id !== id));
      clearNotification(id);
    }, 300);
  }, [clearNotification]);

  const handleAction = useCallback(async (notification, action) => {
    // Add missing plant data if needed for history tracking
    if (notification.reminderData && !notification.plantId) {
      notification.plantId = typeof notification.reminderData.plant === 'object' 
        ? notification.reminderData.plant._id 
        : notification.reminderData.plant;
    }
    
    await handleNotificationAction(notification, action);
  }, [handleNotificationAction]);

  const getIcon = (type, notificationType) => {
    if (notificationType === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (notificationType === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    
    switch (type?.toLowerCase()) {
      case 'water': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'fertilize': return <Leaf className="w-5 h-5 text-green-500" />;
      case 'prune': return <Scissors className="w-5 h-5 text-orange-500" />;
      case 'repot': return <Package className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Calculate time ago for better timestamp display
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // seconds ago
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return timestamp.toLocaleTimeString();
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-h-[calc(100vh-32px)] overflow-y-auto pb-20 w-full max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl border-l-4 ${
            notification.priority === 'high' ? 'border-l-red-500' : 
            notification.type === 'success' ? 'border-l-green-500' :
            notification.type === 'error' ? 'border-l-red-500' :
            notification.type === 'info' ? 'border-l-blue-500' :
            'border-l-yellow-500'
          } p-4 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-90 transform transition-all duration-500 ${
            notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          } hover:shadow-2xl hover:scale-[1.02] transition-all`}
        >
          {/* Priority indicator dot - visible only for high priority */}
          {notification.priority === 'high' && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          )}
          
          <div className="flex items-start space-x-3">
            {/* Enhanced plant image display with fallback gradient background */}
            <div className="flex-shrink-0">
              {notification.plantImage ? (
                <div className="relative">
                  <img
                    src={notification.plantImage}
                    alt={notification.plantName || 'Notification'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-green-200 dark:border-green-700 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                    {getIcon(notification.reminderType, notification.type)}
                  </div>
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
                  notification.type === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/30' :
                  notification.type === 'success' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/30' :
                  notification.type === 'info' ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/30' :
                  'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/30'
                }`}>
                  {getIcon(notification.reminderType, notification.type)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                {notification.message}
              </p>

              {/* Enhanced action buttons with improved styling */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center space-x-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(notification, action.action)}
                      className={`inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                        action.style === 'primary' 
                          ? 'text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 shadow-sm hover:shadow'
                          : 'text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow'
                      }`}
                    >
                      {action.action === 'complete' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                      {action.action === 'snooze' && <Clock className="w-3 h-3 mr-1.5" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Link to related reminder - for reminder notifications */}
              {notification.reminderId && (
                <div className="mt-2">
                  <a 
                    href={`/reminders?highlight=${notification.reminderId}`} 
                    className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View in reminders
                  </a>
                </div>
              )}

              {/* Enhanced timestamp with relative time */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {getTimeAgo(notification.timestamp)}
                </p>
                
                {notification.priority === 'high' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Clear all button - shown when multiple notifications exist */}
      {visibleNotifications.length > 1 && (
        <button 
          onClick={() => visibleNotifications.forEach(n => handleDismiss(n.id))}
          className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full px-2 py-1 text-xs font-medium shadow-sm"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default NotificationPopup;
