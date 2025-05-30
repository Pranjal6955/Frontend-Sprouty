import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import LogoOJT from '../assets/LogoOJT.png';
import { useTheme } from '../components/ThemeProvider';

function Login() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Starting login process...');
      
      const credentials = {
        email: email.trim().toLowerCase(),
        password: password
      };

      console.log('Login credentials:', { email: credentials.email });
      
      const backendAuth = await authAPI.login(credentials);
      
      console.log('Login successful:', backendAuth);
      
      // Store the backend token
      if (backendAuth.token) {
        localStorage.setItem('authToken', backendAuth.token);
      }
      
      // Store user information
      if (backendAuth.user) {
        localStorage.setItem('user', JSON.stringify({
          id: backendAuth.user.id || backendAuth.user._id,
          name: backendAuth.user.name,
          email: backendAuth.user.email,
          authProvider: backendAuth.user.authProvider || 'local'
        }));
      }
      
      setLoading(false);
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      console.error('Login error details:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage({ type: '', text: '' });
    
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    try {
      setResetLoading(true);
      
      // Backend password reset
      await authAPI.forgotPassword(resetEmail);
      
      setResetLoading(false);
      setResetMessage({ 
        type: 'success', 
        text: 'Password reset link sent! Check your email inbox.' 
      });
      
      // Clear the form after 3 seconds and close the modal
      setTimeout(() => {
        setResetEmail('');
        setShowResetModal(false);
        setResetMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setResetLoading(false);
      setResetMessage({ type: 'error', text: `Failed to send reset email: ${error.message}` });
    }
  };

  const openResetModal = (e) => {
    e.preventDefault();
    setResetEmail(email); // Pre-fill with login email if available
    setShowResetModal(true);
    setResetMessage({ type: '', text: '' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 dark:border-gray-700">
        {/* Logo Header */}
        <div className="text-center">
          <img 
            src={LogoOJT} 
            alt="Sprouty Logo" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Sign in to your Sprouty account</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
            />
            {password && password.length < 8 && (
              <p className="text-sm text-red-500 dark:text-red-400">Password must be at least 8 characters long.</p>
            )}
            <div className="flex items-center justify-between">
              <button 
                onClick={openResetModal} 
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200"
              >
                Forgot Password?
              </button>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 rounded dark:bg-gray-700"
                />
                <label htmlFor="showPassword" className="text-sm text-gray-600 dark:text-gray-400">Show Password</label>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-white font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account? <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200">Sign Up</Link>
        </p>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 mt-1 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {resetMessage.text && (
                <div className={`p-3 text-sm rounded-lg ${
                  resetMessage.type === 'error' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}>
                  {resetMessage.text}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    resetLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;