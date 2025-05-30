import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Wind, Thermometer, MapPin, Cloud, 
  Umbrella, ArrowRight, AlertCircle, Droplets, ChevronDown,
  Eye, Gauge, Search, Loader2, CloudRain, CloudSnow,
  Zap, RefreshCw, Leaf
} from 'lucide-react';
import { weatherAPI } from '../services/api';

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load last searched location on component mount
  useEffect(() => {
    const lastLocation = localStorage.getItem('lastWeatherLocation');
    if (lastLocation) {
      loadWeatherData(lastLocation);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadWeatherData = async (searchLocation) => {
    if (!searchLocation) return;
    
    try {
      setError(null);
      setIsLoading(true);
      
      const weatherResponse = await weatherAPI.getCurrentWeather(searchLocation);
      
      if (weatherResponse.success) {
        const data = weatherResponse.data;
        
        const formattedWeather = {
          location: data.location,
          country: data.country,
          localTime: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          condition: data.description,
          icon: data.icon.startsWith('//') ? `https:${data.icon}` : data.icon,
          temperature: Math.round(data.temperature),
          tempF: Math.round(data.temperature * 9/5 + 32),
          windSpeed: data.wind_speed,
          humidity: data.humidity,
          uv: data.uv || 6,
          pressure: data.pressure || 1013,
          visibility: data.visibility || 10
        };
        
        setWeatherData(formattedWeather);
        setLastUpdated(new Date());
        setHasSearched(true);
        
        // Save the successfully searched location
        localStorage.setItem('lastWeatherLocation', searchLocation);
        
        // Load recommendations
        try {
          const recResponse = await weatherAPI.getWeatherRecommendations(searchLocation);
          if (recResponse.success) {
            setRecommendations(recResponse.data.recommendations);
          }
        } catch (recError) {
          console.warn('Could not load weather recommendations:', recError.message);
        }
      }
    } catch (error) {
      console.error('Weather service error:', error);
      setError("Unable to load weather data. Please check the location and try again.");
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (query.length >= 2) {
          const response = await weatherAPI.searchLocations(query);
          if (response.success) {
            setSuggestions(response.data.slice(0, 8));
            setShowSuggestions(true);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Location search error:', error);
      }
    }, 300);
  };

  const handleLocationSubmit = async (e) => {
    e?.preventDefault();
    if (!location.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      await loadWeatherData(location);
      setLocation('');
    } catch (error) {
      setError("Could not find weather data for this location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setLocation('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsSearching(true);
    
    try {
      await loadWeatherData(suggestion.name);
    } catch (error) {
      setError("Could not load weather for selected location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleLocationSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const getWeatherIcon = (condition) => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('rain')) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (lowerCondition.includes('snow')) return <CloudSnow className="w-6 h-6 text-blue-300" />;
    if (lowerCondition.includes('storm')) return <Zap className="w-6 h-6 text-yellow-500" />;
    if (lowerCondition.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-500" />;
    return <Sun className="w-6 h-6 text-yellow-500" />;
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (uv <= 5) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (uv <= 7) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (uv <= 10) return { level: 'Very High', color: 'text-red-600', bg: 'bg-red-100' };
    return { level: 'Extreme', color: 'text-purple-600', bg: 'bg-purple-100' };
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-2">
              <Cloud size={16} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Plant Weather</h2>
          </div>
          {weatherData && (
            <button
              onClick={() => loadWeatherData(weatherData.location)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Refresh weather"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Search Bar - Simplified */}
        <div className="relative" ref={suggestionsRef}>
          <form onSubmit={handleLocationSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  searchLocations(e.target.value);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-8 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Search location..."
                disabled={isSearching}
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSearching || !location.trim()}
              >
                {isSearching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${suggestion.region}-${index}`}
                  className={`w-full px-3 py-2 text-left border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-all text-sm ${
                    selectedSuggestionIndex === index 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div className="flex items-center">
                    <MapPin size={14} className="text-gray-400 mr-2 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {suggestion.region}, {suggestion.country}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-xs">
            <AlertCircle size={14} className="text-red-500 mr-1.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Weather Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading weather...</p>
            </div>
          </div>
        ) : weatherData ? (
          <>
            {/* Current Weather Card - Simplified */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-3">
                <MapPin size={16} className="text-blue-500 mr-1.5" />
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {weatherData.location}
                </h3>
              </div>

              <div className="flex items-center mt-2 mb-3">
                <img 
                  src={weatherData.icon} 
                  alt={weatherData.condition} 
                  className="w-14 h-14 mr-3"
                />
                <div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                      {weatherData.temperature}°
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      C
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                    {weatherData.condition}
                  </p>
                </div>
              </div>

              {/* Plant-focused weather metrics */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <WeatherDataPill 
                  icon={<Droplets className="w-4 h-4 text-blue-500" />} 
                  value={`${weatherData.humidity}%`}
                  label="Humidity"
                />
                <WeatherDataPill 
                  icon={<Wind className="w-4 h-4 text-cyan-500" />} 
                  value={`${weatherData.windSpeed} km/h`}
                  label="Wind"
                />
              </div>

              {/* UV Index - Important for plant care */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center">
                  <Sun className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">UV Index</span>
                </div>
                <div className="flex items-center">
                  <span className="text-base font-bold text-gray-800 dark:text-gray-100 mr-2">
                    {weatherData.uv}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getUVLevel(weatherData.uv).bg} ${getUVLevel(weatherData.uv).color}`}>
                    {getUVLevel(weatherData.uv).level}
                  </span>
                </div>
              </div>
            </div>

            {/* Plant Care Recommendations - Simplified */}
            {recommendations && (
              <div className="rounded-xl border border-green-100 dark:border-green-800/30 overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2.5 border-b border-green-100 dark:border-green-800/30">
                  <div className="flex items-center">
                    <Leaf size={16} className="text-green-600 mr-2" />
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      Today's Plant Care Tips
                    </h3>
                  </div>
                </div>
                
                <div className="p-3 space-y-2.5 bg-white dark:bg-gray-800">
                  {recommendations.watering && (
                    <PlantTip 
                      icon={<Droplets className="w-4 h-4 text-blue-500" />}
                      tip={recommendations.watering}
                    />
                  )}
                  {recommendations.sunlight && (
                    <PlantTip 
                      icon={<Sun className="w-4 h-4 text-yellow-500" />}
                      tip={recommendations.sunlight}
                    />
                  )}
                  {recommendations.protection && (
                    <PlantTip 
                      icon={<Umbrella className="w-4 h-4 text-purple-500" />}
                      tip={recommendations.protection}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 px-3">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Cloud className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Weather & Plant Care
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Get weather-based care tips for your plants
            </p>
            {!hasSearched && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/30 text-center mt-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Search for your location to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WeatherDataPill = ({ icon, value, label }) => (
  <div className="bg-white/80 dark:bg-gray-700/70 rounded-lg p-2 flex items-center justify-between">
    <div className="flex items-center">
      {icon}
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
  </div>
);

const PlantTip = ({ icon, tip }) => (
  <div className="flex items-start rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
    <div className="flex-shrink-0 mt-0.5 mr-2">
      {icon}
    </div>
    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
  </div>
);

export default Weather;
