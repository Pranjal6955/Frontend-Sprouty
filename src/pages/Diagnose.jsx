import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LogoOJT from '../assets/LogoOJT.png';
import { Upload, Loader, AlertCircle, CheckCircle, AlertTriangle, Camera, FileText, Calendar, Stethoscope, X, Image, Plus } from 'lucide-react';
import { diagnosisAPI, plantAPI } from '../services/api';
import Webcam from 'react-webcam'; // Add this import
import PlantHistoryLog from '../components/PlantHistoryLog';  // Add this import

const Diagnose = () => {
  const location = useLocation();
  const { plantId } = useParams();
  const plantData = location.state;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('Diagnose');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [plant, setPlant] = useState(null);
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [showDiagnosisResult, setShowDiagnosisResult] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showDiagnoseModal, setShowDiagnoseModal] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [showHistory, setShowHistory] = useState(false);  // Add this state
  const [showDiagnoseHistory, setShowDiagnoseHistory] = useState(false);

  // Fetch plant data if plantId is provided
  useEffect(() => {
    if (plantId) {
      fetchPlantData();
      fetchDiagnosisHistory();
    }
  }, [plantId]);

  // Fetch all plants when component mounts
  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (plantData) {
      // Auto-select the plant when navigating from dashboard
      setSelectedPlant({
        id: plantData.plantId,
        name: plantData.plantName,
        image: plantData.plantImage,
        species: plantData.plantSpecies
      });
    }
  }, [plantData]);

  const fetchPlantData = async () => {
    try {
      const response = await plantAPI.getPlant(plantId);
      if (response.success) {
        setPlant(response.data);
      }
    } catch (error) {
      console.error('Error fetching plant data:', error);
    }
  };

  const fetchDiagnosisHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await diagnosisAPI.getPlantDiagnosisHistory(plantId);
      if (response.success) {
        setDiagnosisHistory(response.data);
        // Automatically show history section if we have history
        if (response.data && response.data.length > 0) {
          setShowHistorySection(true);
        }
      }
    } catch (error) {
      console.error('Error fetching diagnosis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await plantAPI.getPlants();
      if (response.success) {
        setPlants(response.data);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
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

      setSelectedImage(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async () => {
    if (!imagePreview) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setShowDiagnosisResult(true); // Show result section when diagnosing

    try {
      // Convert image to base64 (remove data URL prefix)
      const base64Image = imagePreview.split(',')[1];
      
      if (!base64Image) {
        setError('Invalid image format. Please try a different image.');
        setLoading(false);
        return;
      }
      
      console.log('Image processed successfully. Base64 length:', base64Image.length);
      
      const diagnosisData = {
        plantId: selectedPlant?.id || plantId || null,
        base64Image: base64Image,
        notes: notes.trim()
      };

      console.log('Sending diagnosis request to backend API...');
      console.log('Request data:', {
        hasPlantId: !!plantId,
        hasImage: !!base64Image,
        hasNotes: !!notes.trim(),
        imageSize: base64Image ? `${(base64Image.length * 0.75 / 1024).toFixed(2)} KB` : 'N/A'
      });

      // Add a timeout to automatically handle hanging requests
      const timeoutId = setTimeout(() => {
        if (loading) {
          setError('The diagnosis is taking longer than expected. Please wait or try again with a smaller image.');
        }
      }, 45000); // 45 seconds timeout warning
      
      try {
        const response = await diagnosisAPI.diagnoseDisease(diagnosisData);
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        console.log('Diagnosis response received:', {
          success: response.success,
          hasData: !!response.data,
          usingMockData: response.data?.serviceInfo?.usingMockData,
          apiAvailable: response.data?.serviceInfo?.apiAvailable,
          serviceMessage: response.data?.serviceInfo?.message
        });
        
        if (response.success) {
          setDiagnosisResult(response.data);
          
          // Update plant data if the plant was updated during diagnosis
          if (plantId || selectedPlant) {
            await fetchPlantData();
          }
          
          // If the diagnosis returned a health status, show it
          if (response.data.summary && response.data.summary.isHealthy !== undefined) {
            const healthStatus = response.data.summary.isHealthy ? 'Healthy' : 
                                (response.data.summary.treatmentPriority === 'high' ? 'Critical' : 'Needs Attention');
            console.log('Updated plant health status from diagnosis:', healthStatus);
          }
        } else {
          setError(response.error || 'Failed to diagnose plant. Please try again.');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setError(err.message || 'An error occurred during diagnosis. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiagnose = (plant) => {
    handleViewHistory(plant);
  };

  const handleViewHistory = async (plant) => {
    try {
      const response = await diagnosisAPI.getPlantDiagnosisHistory(plant._id);
      if (response.success) {
        setDiagnosisHistory(response.data);
        setSelectedPlant(plant);
        setShowDiagnoseHistory(true);
      }
    } catch (error) {
      console.error('Error fetching diagnosis history:', error);
    }
  };

  // New function to view a specific diagnosis from history
  const viewDiagnosisDetails = (diagnosis) => {
    setActiveDiagnosis(diagnosis);
    setDiagnosisResult({ diagnosis: diagnosis, summary: {
      isHealthy: diagnosis.isHealthy,
      overallHealth: diagnosis.overallHealth,
      diseaseCount: diagnosis.diseases.length,
      treatmentPriority: diagnosis.recommendations?.treatment_priority || 'low'
    }});
    setShowDiagnosisResult(true);
  };

  // Add the missing startNewDiagnosis function
  const startNewDiagnosis = () => {
    setImagePreview(null);
    setSelectedImage(null);
    setDiagnosisResult(null);
    setError(null);
    setNotes('');
    setShowDiagnosisResult(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startCamera = () => {
    setUseCamera(true);
    setError(null);
  };

  const stopCamera = () => {
    setUseCamera(false);
  };

  const captureImage = () => {
    try {
      const screenshot = videoRef.current?.getScreenshot();
      if (!screenshot) {
        throw new Error('Failed to capture image');
      }
      setImagePreview(screenshot);
      stopCamera();
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image. Please try again.');
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const renderCameraView = () => (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg bg-black"
        style={{ maxHeight: '400px', objectFit: 'contain' }}
      />
      <div className="flex justify-center gap-4">
        <button
          onClick={captureImage}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
        >
          <Camera className="w-5 h-5 mr-2" />
          Capture
        </button>
        <button
          onClick={stopCamera}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </button>
      </div>
    </div>
  );

  const renderImageSection = () => (
    <div className="relative h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700">
      {useCamera ? (
        // Camera View
        <div className="relative h-full">
          <Webcam
            ref={videoRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: 'environment',
              width: 1280,
              height: 720
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-4 inset-x-0 flex justify-center space-x-4">
            <button
              onClick={captureImage}
              className="bg-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Camera size={20} className="text-gray-700 mr-2" />
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : imagePreview ? (
        <div className="relative h-full">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button
              onClick={() => {
                setImagePreview(null);
                setSelectedImage(null);
              }}
              className="bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              Remove Image
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
              onClick={startCamera}
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
                id="fileInput"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeNavItem={activeNavItem}
        setActiveNavItem={setActiveNavItem}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src={LogoOJT} alt="Logo" className="h-17 w-16" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Plant Disease Diagnosis
              </h1>
            </div>
            
            {/* Add New Diagnosis Button when viewing results */}
            {showDiagnosisResult && selectedPlant && (
              <button
                onClick={startNewDiagnosis}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Diagnosis
              </button>
            )}
          </div>
        </div>

        {/* Main Content - Updated for full height */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          {selectedPlant ? (
            <div className="flex flex-col h-full">
              {/* Modified layout to have the diagnosis history next to results when in detail view */}
              <div className={`grid grid-cols-1 ${plantId && !showDiagnosisResult ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
                {/* Left Section - Upload */}
                {!showDiagnosisResult && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
                    <div className="p-6 flex-1 flex flex-col overflow-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                          <Upload size={24} />
                          Upload Image
                        </h2>
                        <button
                          onClick={() => setSelectedPlant(null)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Plant Info */}
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                          <img
                            src={selectedPlant.image || 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Plant'}
                            alt={selectedPlant.name}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Plant';
                            }}
                          />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {selectedPlant.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedPlant.species}
                            </p>
                          </div>
                        </div>

                        {/* Image Upload/Capture Area */}
                        {renderImageSection()}

                        <input
                          type="file"
                          id="fileInput"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />

                        {/* Notes Area */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Diagnosis Notes
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe any symptoms or concerns..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            rows="4"
                          />
                        </div>

                        {error && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                          </div>
                        )}

                        <button
                          onClick={handleDiagnose}
                          disabled={!imagePreview || loading}
                          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                              Analyzing...
                            </span>
                          ) : (
                            'Start Diagnosis'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Grid for Results and History when in detail view */}
                <div className={`${plantId ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}>
                  {/* Results Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
                    <div className="p-6 flex-1 flex flex-col overflow-auto">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                          <Stethoscope size={24} />
                          Diagnosis Results
                        </h2>
                        
                        {diagnosisResult && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(diagnosisResult.diagnosis.diagnosisDate || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <Loader className="h-12 w-12 animate-spin text-green-500 mx-auto" />
                            <p className="mt-4 text-gray-600">Analyzing plant condition...</p>
                          </div>
                        </div>
                      ) : diagnosisResult ? (
                        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-20rem]">

                          <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center mb-2">
                              {diagnosisResult.summary.isHealthy ? (
                                <CheckCircle className="text-green-500 dark:text-green-400 mr-2" size={24} />
                              ) : (
                                <AlertTriangle className="text-red-500 dark:text-red-400 mr-2" size={24} />
                              )}
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {diagnosisResult.summary.isHealthy ? 'Plant Appears Healthy' : 'Issues Detected'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Overall Health: <span className="font-medium capitalize text-gray-900 dark:text-white">{diagnosisResult.summary.overallHealth}</span>
                            </p>
                            {diagnosisResult.summary.treatmentPriority !== 'low' && (
                              <p className="text-sm mt-1">
                                Treatment Priority: 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(diagnosisResult.summary.treatmentPriority)}`}>
                                  {diagnosisResult.summary.treatmentPriority.toUpperCase()}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Diseases */}
                          {diagnosisResult.diagnosis.diseases && diagnosisResult.diagnosis.diseases.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detected Diseases</h4>
                              <div className="space-y-4">
                                {diagnosisResult.diagnosis.diseases.map((disease, index) => (
                                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900 dark:text-white">{disease.name}</h5>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(disease.severity)}`}>
                                          {disease.severity}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                          {Math.round(disease.probability * 100)}% confidence
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {disease.common_names && disease.common_names.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                          Also known as: <span className="text-gray-700 dark:text-gray-200">{disease.common_names.join(', ')}</span>
                                        </p>
                                      </div>
                                    )}
                                    
                                    {disease.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{disease.description}</p>
                                    )}
                                    
                                    {disease.treatment && Object.keys(disease.treatment).length > 0 && (
                                      <div className="mt-3">
                                        <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Treatment Options:</h6>
                                        <div className="space-y-1">
                                          {Object.entries(disease.treatment).map(([type, treatment]) => (
                                            treatment && (
                                              <div key={type} className="text-sm">
                                                <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{type}:</span>
                                                <span className="ml-1 text-gray-600 dark:text-gray-300">{treatment}</span>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {diagnosisResult.diagnosis.recommendations && (
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
                              <div className="space-y-3">
                                {diagnosisResult.diagnosis.recommendations.immediate_actions && diagnosisResult.diagnosis.recommendations.immediate_actions.length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Immediate Actions:</h6>
                                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                                      {diagnosisResult.diagnosis.recommendations.immediate_actions.map((action, index) => (
                                        <li key={index}>{action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {diagnosisResult.diagnosis.recommendations.preventive_measures && diagnosisResult.diagnosis.recommendations.preventive_measures.length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Preventive Measures:</h6>
                                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                                      {diagnosisResult.diagnosis.recommendations.preventive_measures.map((measure, index) => (
                                        <li key={index}>{measure}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <div className="text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                            <p>Upload an image to see diagnosis results</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis History Section - Show side by side when in detail view */}
                  {plantId && (showHistorySection || diagnosisHistory.length > 0) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                            <Calendar className="mr-2" size={20} />
                            Diagnosis History
                          </h2>
                          <button 
                            onClick={() => setShowHistorySection(!showHistorySection)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showHistorySection ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        
                        {showHistorySection && (
                          historyLoading ? (
                            <div className="flex justify-center p-6">
                              <Loader size={24} className="animate-spin text-green-500" />
                            </div>
                          ) : diagnosisHistory.length > 0 ? (
                            <div className="space-y-4 mt-4">
                              {diagnosisHistory.map((diagnosis, index) => (
                                <div 
                                  key={diagnosis._id} 
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                  onClick={() => viewDiagnosisDetails(diagnosis)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-4">
                                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0">
                                        {diagnosis.diagnosisImage && typeof diagnosis.diagnosisImage === 'string' && 
                                         !diagnosis.diagnosisImage.includes('...') && 
                                         diagnosis.diagnosisImage.startsWith('data:image') ? (
                                          <img 
                                            src={diagnosis.diagnosisImage} 
                                            alt="Plant diagnosis" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // If image fails to load, replace with icon
                                              e.target.style.display = 'none';
                                              e.target.parentNode.innerHTML = `
                                                <div class="w-full h-full flex items-center justify-center">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path><path d="M21 21H3"></path><path d="M21 16H3"></path><path d="M15 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path></svg>
                                                </div>
                                              `;
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Stethoscope size={24} className="text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                          {new Date(diagnosis.diagnosisDate).toLocaleDateString()} 
                                          {diagnosis.diseases.length > 0 ? 
                                            ` - ${diagnosis.diseases[0].name}` : 
                                            ' - Healthy Check'}
                                        </h3>
                                        <div className="flex items-center mt-1">
                                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                                            diagnosis.isHealthy ? 
                                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          }`}>
                                            {diagnosis.isHealthy ? 'Healthy' : 'Issues Detected'}
                                          </span>
                                          {diagnosis.diseases.length > 0 && (
                                            <span className="ml-2 text-xs text-gray-500">
                                              {diagnosis.diseases.length} {diagnosis.diseases.length === 1 ? 'disease' : 'diseases'} detected
                                            </span>
                                          )}
                                        </div>
                                        {diagnosis.notes && (
                                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                            {diagnosis.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(diagnosis.diagnosisDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <FileText size={48} className="mx-auto mb-4" />
                              <p>No diagnosis history found for this plant</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Diagnosis History Section - Only show below results when not in detail view */}
              {!plantId && (showHistorySection || diagnosisHistory.length > 0) && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Calendar className="mr-2" size={20} />
                        Diagnosis History
                      </h2>
                      <button 
                        onClick={() => setShowHistorySection(!showHistorySection)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showHistorySection ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    {showHistorySection && (
                      historyLoading ? (
                        <div className="flex justify-center p-6">
                          <Loader size={24} className="animate-spin text-green-500" />
                        </div>
                      ) : diagnosisHistory.length > 0 ? (
                        <div className="space-y-4 mt-4">
                          {diagnosisHistory.map((diagnosis, index) => (
                            <div 
                              key={diagnosis._id} 
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              onClick={() => viewDiagnosisDetails(diagnosis)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-4">
                                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0">
                                    {diagnosis.diagnosisImage && typeof diagnosis.diagnosisImage === 'string' && 
                                     !diagnosis.diagnosisImage.includes('...') && 
                                     diagnosis.diagnosisImage.startsWith('data:image') ? (
                                      <img 
                                        src={diagnosis.diagnosisImage} 
                                        alt="Plant diagnosis" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // If image fails to load, replace with icon
                                          e.target.style.display = 'none';
                                          e.target.parentNode.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path><path d="M21 21H3"></path><path d="M21 16H3"></path><path d="M15 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path></svg>
                                            </div>
                                          `;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Stethoscope size={24} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {new Date(diagnosis.diagnosisDate).toLocaleDateString()} 
                                      {diagnosis.diseases.length > 0 ? 
                                        ` - ${diagnosis.diseases[0].name}` : 
                                        ' - Healthy Check'}
                                    </h3>
                                    <div className="flex items-center mt-1">
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                                        diagnosis.isHealthy ? 
                                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                        {diagnosis.isHealthy ? 'Healthy' : 'Issues Detected'}
                                      </span>
                                      {diagnosis.diseases.length > 0 && (
                                        <span className="ml-2 text-xs text-gray-500">
                                          {diagnosis.diseases.length} {diagnosis.diseases.length === 1 ? 'disease' : 'diseases'} detected
                                        </span>
                                      )}
                                    </div>
                                    {diagnosis.notes && (
                                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                        {diagnosis.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(diagnosis.diagnosisDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <FileText size={48} className="mx-auto mb-4" />
                          <p>No diagnosis history found for this plant</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Plant Grid View - Fixed syntax
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map((plant) => (
                <div key={plant._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  {/* Plant Image */}
                  <div className="relative h-48">
                    <img
                      src={plant.image || 'https://via.placeholder.com/300x200/e5e7eb/9ca3af?text=Plant'}
                      alt={plant.name}
                      className="w-full h-full object-cover rounded-t-xl"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200/e5e7eb/9ca3af?text=Plant';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-xl" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white">{plant.name}</h3>
                      <p className="text-sm text-gray-200">{plant.species}</p>
                    </div>
                  </div>
                  
                  {/* Plant Details */}
                  <div className="p-4 space-y-4">
                    {/* Health Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Health Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        plant.health === 'Healthy' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        plant.health === 'Needs Attention' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {plant.health}
                      </span>
                    </div>

                    {/* Care Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Last Watered</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {plant.lastWatered ? formatDate(plant.lastWatered) : 'Not yet watered'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Last Fertilized</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {plant.lastFertilized ? formatDate(plant.lastFertilized) : 'Not yet fertilized'}
                        </p>
                      </div>
                    </div>

                    {/* View Diagnose Button */}
                    <button
                      onClick={(e) => {
                        handleViewHistory(plant);
                        e.preventDefault();
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Stethoscope size={18} />
                      View Diagnose History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add PlantDiagnoseLog component */}
      {showDiagnoseHistory && selectedPlant && (
        <PlantDiagnoseLog
          isOpen={showDiagnoseHistory}
          onClose={() => setShowDiagnoseHistory(false)}
          plant={selectedPlant}
          diagnoseHistory={diagnosisHistory}
          onSelectDiagnosis={(diagnosis) => {
            viewDiagnosisDetails(diagnosis);
            setShowDiagnoseHistory(false);
          }}
        />
      )}
    </div>
  );
};

export default Diagnose;

