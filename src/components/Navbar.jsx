import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LogoOJT from '../assets/LogoOJT.png';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage for user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Reset user state
      setUser(null);
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear storage and navigate even if logout fails
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2">
          <img 
            src={LogoOJT} 
            alt="Sprouty Logo" 
            className="h-10 w-10"
          />
          <span className="text-xl font-bold text-emerald-600">Sprouty</span>
        </Link>
        
        <div className="flex space-x-4 items-center">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-gray-600">Hello, {user.name}</span>
              <div className="relative">
                <button 
                  onClick={toggleMenu}
                  className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-800"
                >
                  <span>Menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <hr className="my-1" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link text-emerald-600 hover:text-emerald-800">
                Login
              </Link>
              <Link to="/signup" className="nav-link bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;