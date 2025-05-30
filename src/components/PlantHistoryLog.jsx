import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Info, FileText, Calendar } from 'lucide-react';
import { processPlantImage, handleImageError } from '../utils/imageUtils';
import { plantAPI } from '../services/api';

const PlantDiagnoseLog = ({ isOpen, onClose, plant, diagnoseHistory, onSelectDiagnosis, onPlantUpdated }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingDetailed, setViewingDetailed] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [updatingHealth, setUpdatingHealth] = useState(false);

  if (!isOpen) return null;

  // Sort diagnoses by date (newest first)
  const sortedHistory = [...diagnoseHistory].sort((a, b) => 
    new Date(b.diagnosisDate) - new Date(a.diagnosisDate)
  );

  const handleDetailView = (diagnosis) => {
    // If we have a callback for selecting diagnosis, use it
    if (onSelectDiagnosis) {
      onSelectDiagnosis(diagnosis);
      onClose(); // Close the modal since we'll show in the main view
    } else {
      // Otherwise just show in the modal
      setSelectedDiagnosis(diagnosis);
      setViewingDetailed(true);
    }
  };

  const backToList = () => {
    setViewingDetailed(false);
    setSelectedDiagnosis(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // Add new function to update plant health status
  const updatePlantHealth = async (diagnosis) => {
    if (!plant || !plant._id) return;
    
    setUpdatingHealth(true);
    try {
      // Determine health status based on diagnosis data
      let newStatus = 'Healthy';
      
      if (!diagnosis.isHealthy) {
        if (diagnosis.recommendations && diagnosis.recommendations.treatment_priority === 'high') {
          newStatus = 'Critical';
        } else {
          newStatus = 'Needs Attention';
        }
      }
      
      // Call API to update plant status
      const response = await plantAPI.updatePlant(plant._id, {
        status: newStatus
      });
      
      if (response.success !== false) {
        // Update local plant data if we have a callback
        if (onPlantUpdated) {
          onPlantUpdated({
            ...plant,
            health: newStatus,
            status: newStatus
          });
        }
        
        alert(`Plant health status updated to ${newStatus}`);
      } else {
        alert('Failed to update plant health status');
      }
    } catch (error) {
      console.error('Error updating plant health:', error);
      alert('Error updating plant health status');
    } finally {
      setUpdatingHealth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {viewingDetailed && (
              <button 
                onClick={backToList}
                className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {viewingDetailed ? 'Diagnosis Details' : 'Diagnosis History'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewingDetailed && selectedDiagnosis ? (
            <div className="space-y-6">
              {/* Plant & Date Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={processPlantImage(plant.image || plant.mainImage)} 
                      alt={plant.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, plant.name)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{plant.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{plant.species}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Diagnosis Date</div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {formatDate(selectedDiagnosis.diagnosisDate)}
                  </div>
                </div>
              </div>
              
              {/* Health Status Summary */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  {selectedDiagnosis.isHealthy ? (
                    <CheckCircle className="text-green-500 dark:text-green-400 mr-2" size={24} />
                  ) : (
                    <AlertTriangle className="text-red-500 dark:text-red-400 mr-2" size={24} />
                  )}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedDiagnosis.isHealthy ? 'Plant Appears Healthy' : 'Issues Detected'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Overall Health: <span className="font-medium capitalize text-gray-900 dark:text-white">{selectedDiagnosis.overallHealth}</span>
                </p>
                {selectedDiagnosis.recommendations?.treatment_priority !== 'low' && (
                  <p className="text-sm mt-1">
                    Treatment Priority: 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedDiagnosis.recommendations?.treatment_priority)}`}>
                      {selectedDiagnosis.recommendations?.treatment_priority?.toUpperCase()}
                    </span>
                  </p>
                )}
                
                {/* Add Update Health Status Button */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => updatePlantHealth(selectedDiagnosis)}
                    disabled={updatingHealth}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {updatingHealth ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating Health Status...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Update Plant Health Status
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Diseases */}
              {selectedDiagnosis.diseases && selectedDiagnosis.diseases.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detected Diseases</h4>
                  <div className="space-y-4">
                    {selectedDiagnosis.diseases.map((disease, index) => (
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
                        
                        {disease.treatment && Object.keys(disease.treatment).some(key => disease.treatment[key]) && (
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
              {selectedDiagnosis.recommendations && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {selectedDiagnosis.recommendations.immediate_actions && selectedDiagnosis.recommendations.immediate_actions.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Immediate Actions:</h6>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                          {selectedDiagnosis.recommendations.immediate_actions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDiagnosis.recommendations.preventive_measures && selectedDiagnosis.recommendations.preventive_measures.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Preventive Measures:</h6>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                          {selectedDiagnosis.recommendations.preventive_measures.map((measure, index) => (
                            <li key={index}>{measure}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDiagnosis.recommendations.monitoring && selectedDiagnosis.recommendations.monitoring.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Monitoring Tips:</h6>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                          {selectedDiagnosis.recommendations.monitoring.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDiagnosis.notes && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-gray-600 dark:text-gray-300">{selectedDiagnosis.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((diagnosis, index) => (
                    <div 
                      key={diagnosis._id || index} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => handleDetailView(diagnosis)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0">
                            {diagnosis.diagnosisImage && 
                             typeof diagnosis.diagnosisImage === 'string' && 
                             !diagnosis.diagnosisImage.includes('...') && 
                             diagnosis.diagnosisImage.length > 100 ? (
                              <img 
                                src={processPlantImage(diagnosis.diagnosisImage)}
                                alt="Plant diagnosis" 
                                className="w-full h-full object-cover"
                                onError={(e) => handleImageError(e, 'Diagnosis')}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {new Date(diagnosis.diagnosisDate).toLocaleDateString()} 
                              {diagnosis.diseases && diagnosis.diseases.length > 0 ? 
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
                              {diagnosis.diseases && diagnosis.diseases.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
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
                <div className="text-center py-12">
                  <FileText size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Diagnosis Records</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    This plant doesn't have any diagnosis history yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer with navigation buttons */}
        {viewingDetailed && sortedHistory.length > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => {
                const currentIndex = sortedHistory.findIndex(d => 
                  d._id === selectedDiagnosis._id
                );
                const prevIndex = (currentIndex - 1 + sortedHistory.length) % sortedHistory.length;
                setSelectedDiagnosis(sortedHistory[prevIndex]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
            >
              <ChevronLeft size={20} className="mr-1" />
              Previous Diagnosis
            </button>
            <button
              onClick={() => {
                const currentIndex = sortedHistory.findIndex(d => 
                  d._id === selectedDiagnosis._id
                );
                const nextIndex = (currentIndex + 1) % sortedHistory.length;
                setSelectedDiagnosis(sortedHistory[nextIndex]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
            >
              Next Diagnosis
              <ChevronRight size={20} className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantDiagnoseLog;
