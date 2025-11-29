import React from 'react';
import { Bell, User } from 'lucide-react';

const Header = ({ title, subtitle }) => {
  return (
    <div className="bg-white shadow-sm border-b px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Bell size={24} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <User size={24} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;