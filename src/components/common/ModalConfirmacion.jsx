// src/components/common/ModalConfirmacion.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ModalConfirmacion = ({ mensaje, onConfirmar, onCancelar }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle size={24} className="text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-800">Confirmar acción</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};