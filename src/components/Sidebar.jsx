import React from 'react';
import { Menu, LogOut, User, Home, Book, Bell, X, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../services/googleAuth';

const NavItem = ({ icon, label, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center space-x-4 p-2.5 rounded-lg cursor-pointer transition-colors ${
      isActive 
        ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}
  >
    <div className={isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>{icon}</div>
    <span className={`${isActive ? 'font-medium' : ''} transition-all`}>{label}</span>
  </div>
);

const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeNavItem, setActiveNavItem }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Sign out from Google if using Google auth
      await googleAuthService.signOut();
      
      // Clear local storage
      localStorage.clear(); // Clear all storage instead of just specific items
      
      // Force navigation to home page
      window.location.href = '/'; // Using window.location.href to force a full page refresh
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear storage and redirect even if logout fails
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleNavigation = (item) => {
    console.log('Navigation triggered for:', item);
    setActiveNavItem(item);
    
    switch(item) {
      case 'Diagnose':
        console.log('Navigating to diagnose page');
        navigate('/diagnose'); // Removed { replace: true } and ensure no ID is appended
        return;
      case 'Home':
        navigate('/dashboard');
        break;
      case 'Garden Log':
        navigate('/gardenLog');
        break;
      case 'Reminders':
        navigate('/reminder');
        break;
      case 'Profile':
        navigate('/profile');
        break;
      default:
        return;
    }
  };

  const navItems = [
    { id: 'Home', label: 'Home', icon: Home, path: '/dashboard' },
    { id: 'Garden Log', label: 'Garden Log', icon: Book, path: '/gardenLog' },
    { id: 'Reminders', label: 'Reminders', icon: Bell, path: '/reminder' },
    { id: 'Diagnose', label: 'Diagnose', icon: Stethoscope, path: '/diagnose' },
    { id: 'Profile', label: 'Profile', icon: User, path: '/profile' }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 h-full shadow-lg transition-all duration-300 ease-in-out ${
      isMenuOpen ? 'w-64' : 'w-16'
    } flex flex-col border-r border-gray-100 dark:border-gray-700`}>
      {/* Hamburger Menu only */}
      <div className="p-4 flex justify-start">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation Items - Only show when menu is open */}
      <div className="flex-1 px-2">
        {isMenuOpen && (
          <div className="space-y-4 mt-4">
            {navItems.map((item) => (
              <NavItem 
                key={item.id}
                icon={<item.icon size={20} />} 
                label={item.label} 
                isActive={activeNavItem === item.id} 
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Logout Button - Always visible */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-700">
        <button 
          onClick={handleLogout} 
          className={`flex items-center justify-center w-full p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${
            isMenuOpen ? 'justify-start px-4' : 'justify-center'
          }`}
        >
          <LogOut size={20} />
          {isMenuOpen && <span className="ml-3 font-medium">Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
