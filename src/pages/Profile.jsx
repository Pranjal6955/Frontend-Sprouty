import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Camera, Edit2, Save, X, Upload, Image as ImageIcon, MapPin, Calendar, 
  Droplets, ThermometerSun, Scissors, AlertCircle, Sun } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LogoOJT from '../assets/LogoOJT.png';
import defaultProfile from '../assets/profile.png';
import Webcam from 'react-webcam';
import { userAPI } from '../services/api';

const Profile = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('Profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    location: '',
    joinDate: '',
    totalPlants: 0,
    activeReminders: 0,
    avatar: null
  });

  const [editForm, setEditForm] = useState({ ...userProfile });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have the required API functions
        if (!userAPI || typeof userAPI.getUserProfile !== 'function' || typeof userAPI.getStats !== 'function') {
          console.error('userAPI or required methods not available');
          throw new Error('User API service is not properly configured');
        }
        
        // Fetch both profile and stats data
        const [profileResponse, statsResponse] = await Promise.all([
          userAPI.getUserProfile(),
          userAPI.getStats()
        ]);
        
        if (profileResponse && profileResponse.success) {
          setUserProfile({
            ...profileResponse.data,
            totalPlants: statsResponse?.data?.totalPlants || 0,
            activeReminders: statsResponse?.data?.upcomingReminders || 0
          });
        } else {
          console.error('API response was not successful:', profileResponse);
          setError(profileResponse?.error || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const updateData = {
        name: editForm.name,
        avatar: editForm.avatar,
        location: editForm.location
      };
      
      const response = await userAPI.updateProfile(updateData);
      
      if (response.success) {
        setUserProfile({
          ...userProfile,
          ...updateData
        });
        setIsEditing(false);
        
        // Show success message
        setError(''); // Clear any previous errors
        // You could add a success message state if needed
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newAvatar = reader.result;
        
        // Immediately save to database
        try {
          setSaving(true);
          setError('');
          
          const updateData = {
            name: userProfile.name,
            avatar: newAvatar,
            location: userProfile.location
          };
          
          const response = await userAPI.updateProfile(updateData);
          
          if (response.success) {
            setUserProfile({ ...userProfile, avatar: newAvatar });
            setEditForm({ ...editForm, avatar: newAvatar });
            setShowImageModal(false);
          }
        } catch (error) {
          console.error('Error updating avatar:', error);
          setError('Failed to update profile picture. Please try again.');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Immediately save to database
      try {
        setSaving(true);
        setError('');
        
        const updateData = {
          name: userProfile.name,
          avatar: imageSrc,
          location: userProfile.location
        };
        
        const response = await userAPI.updateProfile(updateData);
        
        if (response.success) {
          setUserProfile({ ...userProfile, avatar: imageSrc });
          setEditForm({ ...editForm, avatar: imageSrc });
          setShowCamera(false);
          setShowImageModal(false);
        }
      } catch (error) {
        console.error('Error updating avatar:', error);
        setError('Failed to update profile picture. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar 
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeNavItem={activeNavItem}
        setActiveNavItem={setActiveNavItem}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header/Cover */}
        <div className="relative h-64 bg-gradient-to-r from-green-400 to-emerald-600 dark:from-green-800 dark:to-emerald-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end space-x-6">
              <div className="relative">
                <img 
                  src={userProfile.avatar || defaultProfile}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProfile;
                  }}
                />
                <button 
                  onClick={() => setShowImageModal(true)}
                  className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white hover:bg-green-600 transition-colors"
                >
                  <Camera size={20} />
                </button>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center text-sm backdrop-blur-sm transition-colors"
                  >
                    <Edit2 size={16} className="mr-2" /> Edit Profile
                  </button>
                </div>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="flex items-center text-sm">
                    <Mail size={16} className="mr-1" /> {userProfile.email}
                  </span>
                  {userProfile.location && (
                    <span className="flex items-center text-sm">
                      <MapPin size={16} className="mr-1" /> {userProfile.location}
                    </span>
                  )}
                  <span className="flex items-center text-sm">
                    <Calendar size={16} className="mr-1" /> Joined {userProfile.joinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid gap-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Plants</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">{userProfile.totalPlants}</p>
                  <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">plants</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Reminders</h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">{userProfile.activeReminders}</p>
                  <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">reminders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold dark:text-white">Edit Profile</h3>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold dark:text-white">Update Profile Picture</h3>
                <button 
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              {saving && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">Saving profile picture...</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {showCamera ? (
                  <div className="space-y-4">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg"
                    />
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleCameraCapture}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                        disabled={saving}
                      >
                        <Camera size={20} className="inline mr-2" />
                        Capture & Save
                      </button>
                      <button
                        onClick={() => setShowCamera(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowCamera(true)}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center disabled:opacity-50"
                      disabled={saving}
                    >
                      <Camera size={20} className="mr-2" />
                      Take Photo
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 flex items-center justify-center disabled:opacity-50"
                        disabled={saving}
                      >
                        <Upload size={20} className="mr-2" />
                        Upload & Save Image
                      </button>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              ref={fileInputRef}
                                              style={{ display: 'none' }}
                                              onChange={handleImageUpload}
                                              disabled={saving}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {error && (
                                        <div className="mt-4 text-red-600 dark:text-red-400 text-sm text-center">
                                          {error}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      };
                      
                      export default Profile;
