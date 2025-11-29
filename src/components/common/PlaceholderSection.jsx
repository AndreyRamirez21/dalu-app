import React from 'react';
import { Package } from 'lucide-react';

const PlaceholderSection = ({ title }) => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500">Esta sección estará disponible próximamente.</p>
      </div>
    </div>
  );
};

export default PlaceholderSection;