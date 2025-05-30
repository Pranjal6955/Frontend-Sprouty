import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const PlantCard = ({ plant, onDelete, onEdit }) => {
  const navigate = useNavigate();

  const handleDiagnoseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/diagnose');
  };

  const handleViewDiagnose = (e) => {
    e.stopPropagation();
    navigate(`/diagnose/${plant._id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{plant.name}</h3>
          <span className="text-sm text-gray-500">{plant.species}</span>
        </div>
        <div className="mt-2">
          <img src={plant.image} alt={plant.name} className="w-full h-32 object-cover rounded-md" />
        </div>
        <button
          onClick={handleDiagnoseClick}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>Diagnose Plant</span>
        </button>
        <button
          onClick={handleViewDiagnose}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Stethoscope size={18} />
          <span>View Diagnose</span>
        </button>
      </div>
    </div>
  );
};

export default PlantCard;