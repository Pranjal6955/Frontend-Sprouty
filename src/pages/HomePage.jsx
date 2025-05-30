import React, { useState } from 'react';
import { Plus, Bell, TrendingUp, Zap, Thermometer, Clock } from 'lucide-react';
import plantPhoto from '../assets/plantPhoto.jpg';
import { Link } from 'react-router-dom';
import LogoOJT from '../assets/LogoOJT.png';
import { DarkModeToggle } from '../components/ThemeProvider';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar - Updated with consistent styling */}
      <nav className="sticky top-0 z-50 mx-auto w-[75%] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-green-100 dark:border-gray-700 shadow-lg rounded-[100px] mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  src={LogoOJT} 
                  alt="Sprouty Logo" 
                  className="h-12 w-13"
                />
                <span className="text-teal-600 font-bold text-2xl ml-2">Sprouty</span>
              </div>
              <div className="hidden md:ml-8 md:flex md:space-x-10">
                <a href="#home" className="text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 text-sm font-medium transition duration-150">Home</a>
                <a href="#features" className="text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 text-sm font-medium transition duration-150">Features</a>
                <a href="#about" className="text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 text-sm font-medium transition duration-150">About Us</a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <DarkModeToggle />
              <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:text-teal-800 dark:hover:text-teal-300">
                Login
              </Link>
              <Link to="/signup" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-5 rounded-full transition duration-150">
                Sign Up
              </Link>
            </div>
            <div className="flex items-center md:hidden">
              <button onClick={toggleMenu} className="text-gray-700">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu - Slide down animation */}
        {isMenuOpen && (
          <div className="md:hidden animate-slideDown">
            <div className="pt-2 pb-3 space-y-1 px-2">
              <a href="#home" className="block px-3 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg">Home</a>
              <a href="#features" className="block px-3 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg">Features</a>
              <a href="#about" className="block px-3 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg">About Us</a>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center justify-center px-4 space-x-4 py-2">
                <Link to="/login" className="w-full text-teal-600 font-medium py-2 px-4 rounded-lg border border-teal-600 hover:bg-teal-50">
                  Login
                </Link>
                <Link to="/signup" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-10">
              <div className="inline-block px-3 py-1 text-sm font-medium text-teal-700 bg-teal-100 rounded-full mb-6">
                Your plant care companion
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Grow Happier, <br/>
                <span className="text-teal-600 dark:text-teal-400">Healthier Plants</span>
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 leading-relaxed">
                Sprouty helps you remember when to water, prune, and care for your plants with timely reminders and personalized advice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:-translate-y-1 text-center">
                  Get Started Free
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0 relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-teal-200 rounded-full opacity-50 filter blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-200 rounded-full opacity-50 filter blur-3xl"></div>
              <img 
                src={plantPhoto} 
                alt="Plant care illustration" 
                className="w-full h-auto rounded-2xl shadow-2xl relative z-10 transform hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Smart Features for Plant Lovers</h2>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-200 max-w-3xl mx-auto">
              Everything you need to become a successful plant parent
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Plus className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Plant Recognition</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Identify any plant instantly with our AI-powered recognition system. Just snap a photo.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Smart Reminders</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Never forget to water, fertilize, or prune again with intelligent care schedules tailored to each plant's needs.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Growth Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Monitor progress with visual growth tracking, celebrating your plant care success.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Care Tips & Guides</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Access plant-specific care guides and expert advice to help your plants thrive.</p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Thermometer className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Light & Temperature</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Get recommendations for optimal light and temperature conditions for each plant type.</p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-green-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Seasonal Changes</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Adaptive care schedules that change with the seasons for year-round plant health.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section - Updated text colors */}
      <section id="about" className="py-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1558693168-c370615b54e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Team working on plant care app" 
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
              />
            </div>
            <div className="md:w-1/2">
              <div className="inline-block px-3 py-1 text-sm font-medium text-teal-700 bg-teal-100 rounded-full mb-6">
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">A Growing Passion</h2>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 leading-relaxed">
                Sprouty was born when our founder's collection of houseplants kept dying despite their best efforts. We realized that consistent care was the key to thriving plants, and technology could help bridge that gap.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                Our mission is to empower plant lovers of all experience levels with the tools and knowledge they need to create thriving indoor jungles and outdoor gardens.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Every feature in Sprouty is designed with plant science in mind, built by a team of developers who are also passionate plant parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Updated gradient */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to grow with us?</h2>
          <p className="text-teal-100 mb-8 text-lg max-w-3xl mx-auto">
            Join thousands of plant enthusiasts using Sprouty to care for their plants better than ever before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-emerald-700 hover:bg-emerald-50 font-medium py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:-translate-y-1">
              Start Free Trial
            </Link>
            <Link to="/login" className="bg-emerald-800 text-white hover:bg-emerald-900 font-medium py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:-translate-y-1">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Updated styling */}
      <footer className="bg-gradient-to-br from-gray-900 to-emerald-900 dark:from-gray-950 dark:to-emerald-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xl font-bold text-teal-400 mb-4">Sprouty</h3>
              <p className="text-gray-400 mb-4">Nurturing your green thumb one plant at a time.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-teal-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-teal-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-teal-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-gray-400 hover:text-teal-400 transition duration-150">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-teal-400 transition duration-150">Features</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-teal-400 transition duration-150">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-gray-400 mb-4">Subscribe to our newsletter for tips and updates.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="w-full px-4 py-3 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-r-lg transition duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Sprouty. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-teal-400 transition duration-150">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-teal-400 transition duration-150">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-teal-400 transition duration-150">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;