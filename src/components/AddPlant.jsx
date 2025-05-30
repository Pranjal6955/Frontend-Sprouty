import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, ArrowLeft, Loader, Info, Maximize, Droplets, Sun, Wind, Thermometer, 
         Globe, Leaf, Bookmark, FlowerIcon, Calendar, Upload, Image, Search } from 'lucide-react';
import Webcam from 'react-webcam';
import { plantAPI } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

const AddPlant = ({ onAddPlant, onCancel }) => {
  const [plantName, setPlantName] = useState("");
  const [plantType, setPlantType] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [notes, setNotes] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResults, setIdentificationResults] = useState(null);
  const [plantDetails, setPlantDetails] = useState(null);
  const [error, setError] = useState(null);
  const [showMoreInfo, setShowMoreInfo] = useState(true); // Changed to true to show by default
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const webcamRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false); // Add this new state
  const { isDarkMode } = useTheme();
  const [searchMode, setSearchMode] = useState('image'); // 'image' or 'text'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add debugging state
  const [apiResponse, setApiResponse] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imageData = e.target.result;
        setCapturedImage(imageData);
        await identifyPlantFromImage(imageData);
      } catch (err) {
        console.error('Error processing uploaded image:', err);
        setError('Could not process the uploaded image. Please try another image or use the camera.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setError('Could not read the uploaded file. Please try another image.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Function to handle identification logic (used by both camera and upload)
  const identifyPlantFromImage = async (imageData) => {
    try {
      setIsIdentifying(true);
      setError(null);
      
      console.log("Identifying plant from image...");
      
      // Make API call to identify the plant
      const response = await plantAPI.identifyPlant(imageData);
      
      // Store full response for debugging
      setApiResponse(response);
      console.log("Plant identification response:", response);
      
      // If the API service returned an error but we can still proceed
      if (!response.success) {
        setError(response.error || "Plant identification service is unavailable. You can still add your plant manually.");
        setIsIdentifying(false);
        
        // If it's just an API service issue, we can still let the user add the plant manually
        if (response.is_mock) {
          console.log("Received mock data due to:", response.mock_reason);
          // Set a placeholder image so the form can be submitted
          setCapturedImage('manual-entry');
          setSearchMode('manual');
          return;
        }
      }
      
      // Process the API response
      if (response.success && response.data) {
        const responseData = response.data;
        
        // Handle Plant.ID v3 API response format
        if (responseData && responseData.result && responseData.result.classification) {
          const suggestions = responseData.result.classification.suggestions;
          
          if (suggestions && suggestions.length > 0) {
            const topMatch = suggestions[0];
            setIdentificationResults(topMatch);
            
            console.log("Top match details:", topMatch);
            console.log("Available keys in topMatch:", Object.keys(topMatch));
            
            // Try multiple ways to get common names
            let commonNames = [];
            
            // Method 1: Direct common_names property
            if (topMatch.common_names && Array.isArray(topMatch.common_names)) {
              commonNames = topMatch.common_names;
              console.log("✅ Method 1 - Direct common_names:", commonNames);
            }
            // Method 2: From details object
            else if (topMatch.details?.common_names && Array.isArray(topMatch.details.common_names)) {
              commonNames = topMatch.details.common_names;
              console.log("✅ Method 2 - From details:", commonNames);
            }
            // Method 3: Check if details is an object with common_names
            else if (topMatch.details && typeof topMatch.details === 'object') {
              // Sometimes the API structure varies
              const detailsKeys = Object.keys(topMatch.details);
              console.log("Available details keys:", detailsKeys);
              
              // Look for any key that might contain common names
              for (const key of detailsKeys) {
                if (key.includes('common') || key.includes('name')) {
                  const value = topMatch.details[key];
                  if (Array.isArray(value)) {
                    commonNames = value;
                    console.log("✅ Method 3 - Found in details key:", key, commonNames);
                    break;
                  }
                }
              }
            }
            
            console.log("Final extracted common names:", commonNames);
            
            const primaryCommonName = commonNames.length > 0 ? commonNames[0] : null;
            console.log("Primary common name:", primaryCommonName);
            
            // Extract and organize detailed plant information for v3 API
            const details = {
              scientificName: topMatch.name,
              commonName: primaryCommonName || topMatch.name, // Prioritize common name
              allCommonNames: commonNames,
              confidence: topMatch.probability,
              description: topMatch.description || topMatch.details?.description?.value || topMatch.details?.description || '',
              taxonomy: topMatch.taxonomy || topMatch.details?.taxonomy || {},
              family: topMatch.family || topMatch.details?.taxonomy?.family || 'Unknown',
              genus: topMatch.genus || topMatch.details?.taxonomy?.genus || 'Unknown',
              wikiUrl: topMatch.url || topMatch.details?.url || ''
            };
            
            console.log("Final plant details:", details);
            
            setPlantDetails(details);
            
            // Auto-fill plant name - ALWAYS prioritize common name if available
            if (primaryCommonName && primaryCommonName !== topMatch.name) {
              console.log("Using common name:", primaryCommonName);
              setPlantName(primaryCommonName);
              // Set plant type to scientific name if we have a common name
              setPlantType(topMatch.name);
            } else {
              console.log("Using scientific name:", topMatch.name);
              // Only use scientific name if no common name exists
              setPlantName(topMatch.name);
              setPlantType("Unknown");
            }
            
            // Add comprehensive identification info to notes
            if (details.description) {
              const careInfo = Object.entries(generateCareInfo(details))
                .map(([key, value]) => `• ${value}`)
                .join('\n');
              
              setNotes(`${details.description.substring(0, 150)}...\n\n${careInfo}`);
            }
            
            // Show a warning if this is mock data
            if (response.is_mock) {
              setError(`Note: Using example data (${response.mock_reason}). The identification may not be accurate.`);
            }
            
            // Automatically show image preview when identification is successful
            setShowImagePreview(true);
          } else {
            setError("The plant couldn't be identified clearly. Please enter details manually or try another image.");
          }
        } else {
          setError("The plant couldn't be identified clearly. Please enter details manually or try another image.");
        }
      } else {
        setError("Failed to get identification results. Please try again.");
      }
    } catch (err) {
      console.error('Plant identification error:', err);
      let errorMessage = err.message || 'Could not identify the plant. Please enter details manually or try another image.';
      
      // Handle specific error cases
      if (errorMessage.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('requires API key configuration')) {
        errorMessage = 'Plant identification service is not configured. Please use manual entry or text search to add your plant.';
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = 'Too many identification requests. Please wait a moment and try again.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'The identification service is taking too long. Please try again with a different image.';
      } else if (errorMessage.includes('quota exceeded')) {
        errorMessage = 'Plant identification service quota exceeded. Please try again later.';
      } else if (errorMessage.includes('temporarily unavailable')) {
        errorMessage = 'Plant identification service is temporarily unavailable. Please try manual entry or text search.';
      }
      
      setError(errorMessage);
      // Set a placeholder image so the form can be submitted
      setCapturedImage('manual-entry');
      setSearchMode('manual');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleCapture = async () => {
    if (!webcamRef.current) {
      setError('Camera not initialized. Please try again.');
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError('Failed to capture image. Please try again.');
        return;
      }
      
      setIsUploading(true);
      setError(null);
      setCapturedImage(imageSrc);
      setShowCamera(false); // Hide camera after capture
      await identifyPlantFromImage(imageSrc);
    } catch (err) {
      console.error('Camera capture error:', err);
      setError('Could not capture image. Please try again or upload an image instead.');
    } finally {
      setIsUploading(false);
    }
  };

  // Extract structured plant details from the API response
  const extractPlantDetails = (result) => {
    const details = {
      scientificName: result.plant_name,
      commonName: result.plant_details?.common_names?.[0] || result.plant_name,
      allCommonNames: result.plant_details?.common_names || [],
      confidence: result.probability,
      description: result.plant_details?.wiki_description?.value || '',
      taxonomy: result.plant_details?.taxonomy || {},
      family: result.plant_details?.taxonomy?.family || 'Unknown',
      genus: result.plant_details?.taxonomy?.genus || 'Unknown',
      similarImages: result.similar_images || [],
      wikiUrl: result.plant_details?.url || ''
    };
    return details;
  };

  // Generate plant care information based on plant data
  const generateCareInfo = (details) => {
    // This could be enhanced with a more sophisticated system that uses the plant's 
    // taxonomy to determine care needs, or integrate with another API
    const careInfo = {
      watering: `Most ${details.family} plants need regular watering when soil is dry to touch.`,
      light: `Many plants in the ${details.genus} genus prefer bright, indirect light.`,
      soil: `Well-draining soil mix is typically recommended for ${details.commonName}.`,
      humidity: `Monitor humidity levels based on ${details.commonName}'s natural habitat.`,
      temperature: `Ideal temperature range is typically 65-80°F (18-27°C).`,
      fertilizing: `Feed with balanced, water-soluble fertilizer during growing season.`,
      pruning: `Prune occasionally to maintain shape and remove damaged leaves.`,
      repotting: `Repot every 1-2 years or when rootbound.`,
      propagation: `Can be propagated by division or stem cuttings.`,
      toxicity: `Check specific sources for toxicity information.`,
    };
    
    return careInfo;
  };

  // Generate growing information
  const generateGrowingInfo = (details) => {
    return {
      nativeRegion: `Native to regions where ${details.genus} plants naturally grow.`,
      growthHabit: `${details.commonName} typically grows as a ${details.family.toLowerCase()} plant.`,
      matureSize: `Varies by species and growing conditions.`,
      growthRate: `Moderate growth rate in optimal conditions.`,
      lifespan: `Perennial plant with proper care.`,
      floweringSeason: `Flowering depends on species and care conditions.`,
      companionPlants: `Research companion plants suitable for your specific variety.`,
      commonProblems: `Watch for common pests like spider mites and scale insects.`,
      diseaseResistance: `Generally resistant to diseases with proper care.`
    };
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIdentificationResults(null);
    setPlantDetails(null);
    setError(null);
    setShowMoreInfo(false);
  };

  const handleNotesSubmit = async () => {
    try {
      // Use the correct plant ID property
      const plantId = plant._id || plant.id;
      await onNotesUpdate(plantId, editedNotes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Allow submission with just plant name, without requiring an image
    if (!plantName) {
      setError("Please enter a plant name");
      return;
    }
    
    try {
      console.log('Submitting plant data...');
      
      // Check if plantAPI and createPlant method exist
      if (!plantAPI || typeof plantAPI.createPlant !== 'function') {
        throw new Error('Plant API service is not properly configured');
      }
      
      // Prepare plant data for saving to database
      const plantData = {
        name: plantName,
        species: plantDetails?.scientificName || plantType || "Unknown",
        nickname: plantName,
        mainImage: capturedImage && capturedImage !== 'manual-entry' && capturedImage !== 'text-search-result' ? capturedImage : null,
        notes: notes,
        status: "Healthy",
        scientificDetails: plantDetails ? {
          scientificName: plantDetails.scientificName,
          commonNames: plantDetails.allCommonNames,
          confidence: plantDetails.confidence,
          taxonomy: plantDetails.taxonomy,
          wikiUrl: plantDetails.wikiUrl,
          description: plantDetails.description
        } : null
      };
      
      console.log('Plant data to be saved:', plantData);
      
      // Save to database via API
      const response = await plantAPI.createPlant(plantData);
      console.log('Plant creation response:', response);
      
      if (response && response.success && response.data) {
        // Get the saved plant with proper MongoDB _id and pass it back
        const savedPlant = {
          id: response.data._id,
          _id: response.data._id, // Include both for compatibility
          name: response.data.name,
          species: response.data.species,
          nickname: response.data.nickname,
          image: response.data.mainImage,
          mainImage: response.data.mainImage,
          notes: response.data.notes,
          health: response.data.status,
          status: response.data.status,
          lastWatered: response.data.lastWatered ? new Date(response.data.lastWatered).toLocaleDateString() : 'Not yet watered',
          dateAdded: new Date(response.data.dateAdded || response.data.createdAt).toLocaleDateString(),
          createdAt: response.data.createdAt,
          careHistory: response.data.careHistory || [],
          scientificDetails: response.data.scientificDetails
        };
        
        console.log('Saved plant object:', savedPlant);
        onAddPlant(savedPlant);
      } else {
        throw new Error(response?.error || 'Failed to save plant');
      }
    } catch (error) {
      console.error("Error saving plant to database:", error);
      
      let errorMessage = "Failed to save plant. Please try again.";
      if (error.message?.includes('Plant API service is not properly configured')) {
        errorMessage = 'Plant API service is not available. Please refresh the page.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  // Enhanced debugging info display
  const renderDebugInfo = () => {
    if (!apiResponse && !error) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-48">
        <p className="font-bold">API Debug Information:</p>
        
        {error && (
          <div className="mt-1 border-t border-red-200 pt-1">
            <p className="font-bold text-red-600">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {apiResponse && (
          <details className="mt-1">
            <summary className="cursor-pointer text-blue-600">Show/Hide API Response</summary>
            <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
          </details>
        )}
      </div>
    );
  };

  // Add camera toggle function
  const toggleCamera = () => {
    setShowCamera(prev => !prev);
    setError(null);
  };

  // Add this new function for text search
  const handleTextSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      console.log('Starting search for:', searchQuery);
      const response = await plantAPI.searchPlantByName(searchQuery);
      console.log('Search response received:', response);
      
      if (response.success) {
        // Check different possible response structures
        let suggestions = [];
        
        if (response.data?.suggestions) {
          suggestions = response.data.suggestions;
          console.log('Found suggestions in data.suggestions:', suggestions);
        } else if (response.data?.entities) {
          suggestions = response.data.entities;
          console.log('Found suggestions in data.entities:', suggestions);
        } else if (Array.isArray(response.data)) {
          suggestions = response.data;
          console.log('Found suggestions as array in data:', suggestions);
        } else {
          console.log('Unexpected response structure:', response.data);
          console.log('Available keys in response.data:', Object.keys(response.data || {}));
        }
        
        if (suggestions && suggestions.length > 0) {
          console.log('Processing suggestions:', suggestions.length);
          
          // Ensure we have image data and enhance the results
          const enhancedSuggestions = suggestions.map(suggestion => {
            // Get plant image from different possible locations
            let plantImageUrl = null;
            
            // Check all possible image locations and log what we find
            console.log(`Checking image sources for ${suggestion.name || suggestion.entity_name || suggestion.matched_in}:`);
            
            if (suggestion.images && suggestion.images.length > 0) {
              console.log('- Found images array with length:', suggestion.images.length);
              
              // Find the first valid image URL
              for (const img of suggestion.images) {
                if (img.url) {
                  plantImageUrl = img.url;
                  console.log('- Using image URL from images[].url:', plantImageUrl);
                  break;
                } else if (img.image_url) {
                  plantImageUrl = img.image_url;
                  console.log('- Using image URL from images[].image_url:', plantImageUrl);
                  break;
                }
              }
            }
            
            if (!plantImageUrl && suggestion.image_url) {
              plantImageUrl = suggestion.image_url;
              console.log('- Using direct image_url property:', plantImageUrl);
            }
            
            if (!plantImageUrl && suggestion.details?.images && suggestion.details.images.length > 0) {
              plantImageUrl = suggestion.details.images[0].url || suggestion.details.images[0].image_url;
              console.log('- Using image URL from details.images[]:', plantImageUrl);
            }
            
            if (!plantImageUrl && suggestion.wiki_image && suggestion.wiki_image.value) {
              plantImageUrl = suggestion.wiki_image.value;
              console.log('- Using wiki_image.value:', plantImageUrl);
            }
            
            if (!plantImageUrl && suggestion.details?.wiki_image?.value) {
              plantImageUrl = suggestion.details.wiki_image.value;
              console.log('- Using details.wiki_image.value:', plantImageUrl);
            }
            
            // If we found an image, ensure it has a proper URL format
            if (plantImageUrl) {
              // Fix any URLs that don't start with http/https
              if (!plantImageUrl.startsWith('http')) {
                plantImageUrl = `https://${plantImageUrl.replace(/^\/\//, '')}`;
                console.log('- Fixed image URL format:', plantImageUrl);
              }
            } else {
              console.log('❌ No valid image URL found for this suggestion');
            }
            
            return {
              ...suggestion,
              plantImageUrl: plantImageUrl
            };
          });
          
          setSearchResults(enhancedSuggestions);
          
          // Auto-select the first result for preview
          const topMatch = enhancedSuggestions[0];
          console.log('Top match keys:', Object.keys(topMatch));
          
          // Try to extract common names from different possible locations
          let commonNames = [];
          if (topMatch.details?.common_names) {
            commonNames = topMatch.details.common_names;
          } else if (topMatch.common_names) {
            commonNames = topMatch.common_names;
          } else if (topMatch.commonNames) {
            commonNames = topMatch.commonNames;
          }
          
          const primaryCommonName = commonNames.length > 0 ? commonNames[0] : null;
          console.log('Extracted common names:', commonNames);
          
          // Try to get the scientific/entity name from different locations
          const scientificName = topMatch.entity_name || topMatch.name || topMatch.matched_in || topMatch.scientific_name;
          
          setPlantDetails({
            scientificName: scientificName,
            commonName: primaryCommonName || scientificName,
            allCommonNames: commonNames,
            description: topMatch.details?.description || topMatch.description || '',
            taxonomy: topMatch.details?.taxonomy || topMatch.taxonomy || {},
            family: topMatch.details?.taxonomy?.family || topMatch.taxonomy?.family || 'Unknown',
            genus: topMatch.details?.taxonomy?.genus || topMatch.taxonomy?.genus || 'Unknown',
            wikiUrl: topMatch.details?.url || topMatch.url || '',
            plantImage: topMatch.plantImageUrl // Use our enhanced image URL
          });
          
          // Auto-fill form fields with common name preference
          if (primaryCommonName) {
            setPlantName(primaryCommonName);
            setPlantType(scientificName); // Scientific name as type
          } else {
            setPlantName(scientificName);
          }
          
          // Set the plant image as captured image if available, otherwise use placeholder
          if (topMatch.plantImageUrl) {
            setCapturedImage(topMatch.plantImageUrl);
          } else {
            setCapturedImage('text-search-result');
          }
        } else {
          console.log('No suggestions found in any expected location');
          setError("No plants found matching your search. Try a different name or use manual entry.");
        }
      } else {
        console.log('Search response not successful:', response);
        setError(response.error || "Search failed. Please try again.");
      }
    } catch (err) {
      console.error('Search error details:', err);
      setError(`Failed to search for plants: ${err.message}. Please try again or use manual entry.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border dark:border-gray-700">
        {/* Header */}
        <div className="p-6 pb-3 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Add New Plant</h2>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!capturedImage ? (
              <div className="space-y-4">
                {/* Add mode toggle buttons */}
                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setSearchMode('image')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      searchMode === 'image'
                        ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Camera size={18} className="inline mr-2" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('text')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      searchMode === 'text'
                        ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Search size={18} className="inline mr-2" />
                    Text
                  </button>
                </div>

                {searchMode === 'text' ? (
                  // Text search interface
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search plant by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleTextSearch(e);
                            }
                          }}
                          className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={handleTextSearch}
                          disabled={isSearching || !searchQuery.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isSearching ? (
                            <Loader size={20} className="animate-spin" />
                          ) : (
                            <Search size={20} />
                          )}
                        </button>
                      </div>

                      {/* Manual Entry Option */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          Can't find your plant? You can add it manually by entering the details below.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            // Set a placeholder image so the form can be submitted
                            setCapturedImage('manual-entry');
                            setSearchMode('manual');
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          Skip identification and add manually
                        </button>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Found {searchResults.length} plant{searchResults.length > 1 ? 's' : ''} matching "{searchQuery}"
                          </p>
                          {searchResults.map((result, index) => {
                            // Handle different possible response structures
                            const commonNames = result.details?.common_names || result.common_names || result.commonNames || [];
                            const scientificName = result.entity_name || result.name || result.matched_in || result.scientific_name;
                            const displayName = commonNames.length > 0 ? commonNames[0] : scientificName;
                            
                            return (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600"
                                onClick={() => {
                                  const primaryCommonName = commonNames.length > 0 ? commonNames[0] : null;
                                  
                                  setPlantName(primaryCommonName || scientificName);
                                  setPlantType(scientificName); // Scientific name as type
                                  setPlantDetails({
                                    scientificName: scientificName,
                                    commonName: primaryCommonName || scientificName,
                                    allCommonNames: commonNames,
                                    description: result.details?.description || result.description || '',
                                    taxonomy: result.details?.taxonomy || result.taxonomy || {},
                                    family: result.details?.taxonomy?.family || result.taxonomy?.family || 'Unknown',
                                    genus: result.details?.taxonomy?.genus || result.taxonomy?.genus || 'Unknown',
                                    wikiUrl: result.details?.url || result.url || '',
                                    plantImage: result.plantImageUrl // Use our enhanced image URL
                                  });
                                  
                                  // Set the plant image as captured image if available
                                  if (result.plantImageUrl) {
                                    setCapturedImage(result.plantImageUrl);
                                  } else {
                                    setCapturedImage('text-search-result');
                                  }
                                }}
                              >
                                {/* Plant Image and Info Container */}
                                <div className="flex gap-3">
                                  {/* Plant Image */}
                                  {result.plantImageUrl ? (
                                    <div className="flex-shrink-0">
                                      <img
                                        src={result.plantImageUrl}
                                        alt={displayName || 'Plant image'}
                                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                        onError={(e) => {
                                          console.error('Image failed to load:', result.plantImageUrl);
                                          e.target.parentNode.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                      <Leaf size={24} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                  )}
                                  
                                  {/* Plant Information */}
                                  <div className="flex-1 min-w-0">
                                    {/* Primary name */}
                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-base">
                                      {displayName || 'Unknown Plant'}
                                    </p>
                                    
                                    {/* Scientific name if different from display name */}
                                    {displayName !== scientificName && scientificName && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                        {scientificName}
                                      </p>
                                    )}
                                    
                                    {/* All common names */}
                                    {commonNames.length > 1 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                          Also known as:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {commonNames.slice(1).map((name, nameIndex) => (
                                            <span
                                              key={nameIndex}
                                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                                            >
                                              {name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Description preview */}
                                    {(result.details?.description || result.description) && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                        {(result.details?.description || result.description).length > 100 
                                          ? (result.details?.description || result.description).substring(0, 100) + '...'
                                          : (result.details?.description || result.description)
                                        }
                                      </p>
                                    )}
                                    
                                    {/* Taxonomy info */}
                                    {(result.details?.taxonomy?.family || result.taxonomy?.family) && (
                                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                        Family: {result.details?.taxonomy?.family || result.taxonomy?.family}
                                        {(result.details?.taxonomy?.genus || result.taxonomy?.genus) && (
                                          <span> • Genus: {result.details?.taxonomy?.genus || result.taxonomy?.genus}</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                                      Click to select this plant
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : searchMode === 'manual' ? (
                  // Manual entry mode
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Manual Entry Mode</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Fill in the plant details below. You can add photos later from the plant details page.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode('image');
                        setCapturedImage(null);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                    >
                      ← Back to image/search options
                    </button>
                  </div>
                ) : (
                  // Existing image capture/upload interface
                  <div className="relative h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700">
                    {/* Add manual entry option */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage('manual-entry');
                          setSearchMode('manual');
                        }}
                        className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        Add manually
                      </button>
                    </div>

                    {showCamera ? (
                      // Camera View
                      <div className="relative h-full">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="absolute inset-0 w-full h-full object-cover"
                          videoConstraints={{ 
                            facingMode: 'environment',
                            width: 1280,
                            height: 720,
                          }}
                        />
                        <div className="absolute bottom-4 inset-x-0 flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={handleCapture}
                            disabled={isUploading}
                            className="bg-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center"
                          >
                            <Camera size={20} className="text-gray-700 mr-2" />
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={toggleCamera}
                            className="bg-gray-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Initial View with buttons
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <div className="flex flex-col items-center mb-6">
                          <Camera size={48} className="text-gray-400 dark:text-gray-500 mb-4" />
                          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 px-4">
                            Take a photo or upload an image of your plant
                          </p>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={toggleCamera}
                            className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <Camera size={20} className="mr-2" />
                            Take Photo
                          </button>

                          <label className="bg-gray-100 dark:bg-gray-700 px-6 py-3 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center cursor-pointer border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                            <Upload size={20} className="mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Loading overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mb-2"></div>
                          <p className="text-gray-100">Processing image...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="ml-2 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {isIdentifying ? (
                  <div className="h-20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mb-2"></div>
                      <p className="text-gray-600">Identifying plant...</p>
                    </div>
                  </div>
                ) : (
                  plantDetails && (
                    <div className="space-y-3">
                      {/* Show plant image if available from text search */}
                      {plantDetails.plantImage && (
                        <div className="relative">
                          <img
                            src={plantDetails.plantImage}
                            alt={plantDetails.commonName}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              // Hide image container if it fails to load
                              e.target.closest('div').style.display = 'none';
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              From Plant Database
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-medium text-green-800 dark:text-green-300">
                          {capturedImage === 'text-search-result' || plantDetails.plantImage ? 'Plant Found!' : 'Plant Identified!'}
                        </h3>
                        <div className="mt-2">
                          {/* Show primary common name prominently */}
                          <p className="text-sm text-green-600 dark:text-green-400">
                            <span className="font-medium text-lg">{plantDetails.commonName}</span>
                          </p>
                          
                          {/* Show all common names if there are multiple */}
                          {plantDetails.allCommonNames && plantDetails.allCommonNames.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                                All common names:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {plantDetails.allCommonNames.map((name, index) => (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      index === 0 
                                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-medium' 
                                        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                    }`}
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show scientific name */}
                          {plantDetails.commonName !== plantDetails.scientificName && (
                            <p className="text-xs text-green-500 dark:text-green-500 italic mt-2">
                              Scientific name: {plantDetails.scientificName}
                            </p>
                          )}
                        </div>
                        {plantDetails.confidence && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                              <span>Confidence:</span>
                              <span>{Math.round(plantDetails.confidence * 100)}%</span>
                            </div>
                            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-green-600 dark:bg-green-400 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${plantDetails.confidence * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Debug information for development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info:</p>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p>Scientific: {plantDetails.scientificName}</p>
                            <p>Primary Common: {plantDetails.commonName}</p>
                            <p>All Common Names: [{plantDetails.allCommonNames?.join(', ') || 'None'}]</p>
                            <p>Count: {plantDetails.allCommonNames?.length || 0}</p>
                            <p>Confidence: {plantDetails.confidence}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={handleRetake}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Take another photo
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Plant Name* {plantDetails && plantDetails.commonName !== plantDetails.scientificName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      (Common name preferred)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="E.g., Peace Lily, Golden Pothos"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Scientific Name / Plant Type
                </label>
                <input
                  type="text"
                  placeholder="E.g., Spathiphyllum wallisii, Indoor/Flowering"
                  value={plantType}
                  onChange={(e) => setPlantType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Add any care instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!plantName || isIdentifying}
                className={`flex-1 bg-green-600 text-white px-4 py-3 rounded-lg transition-colors shadow-sm font-medium flex items-center justify-center ${
                  !plantName || isIdentifying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
              >
                {isIdentifying ? (
                  <>
                    <Loader size={18} className="animate-spin mr-1.5" /> Processing...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-1.5" /> Save Plant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlant;