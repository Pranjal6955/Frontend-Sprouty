import React, { useState } from 'react';
import { X, Check, Camera, Upload, Loader } from 'lucide-react';
import { plantAPI } from '../services/api';

const EditPlant = ({ plant, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: plant.name,
    nickname: plant.nickname || plant.name,
    species: plant.species,
    notes: plant.notes,
    status: plant.health
  });
  const [image, setImage] = useState(plant.image);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = React.useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedPlant = {
        ...formData,
        mainImage: image,
        lastWatered: formData.lastWatered ? new Date(formData.lastWatered).toISOString() : null,
        lastFertilised: formData.lastFertilised ? new Date(formData.lastFertilised).toISOString() : null,
        lastPruning: formData.lastPruning ? new Date(formData.lastPruning).toISOString() : null,
        dateAdded: formData.dateAdded ? new Date(formData.dateAdded).toISOString() : null
      };

      const response = await plantAPI.updatePlant(plant.id, updatedPlant);
      
      onSave({
        ...response.data,
        id: plant.id,
        image: response.data.mainImage,
        health: response.data.status
      });
    } catch (err) {
      setError('Failed to update plant. Please try again.');
      console.error('Error updating plant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Plant</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Section */}
          <div className="relative">
            <img 
              src={image} 
              alt={formData.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <label className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors cursor-pointer text-white">
                <Upload size={20} />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plant Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Species
              </label>
              <input
                type="text"
                value={formData.species}
                onChange={(e) => setFormData({...formData, species: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Health Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="Healthy">Healthy</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="4"
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlant;
