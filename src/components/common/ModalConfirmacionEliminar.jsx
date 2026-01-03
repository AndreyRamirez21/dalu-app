// src/components/common/ModalConfirmacionEliminar.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ModalConfirmacionEliminar = ({ mensaje, onConfirmar, onCancelar }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Contenido del modal */}
        <div className="p-8 text-center">
          {/* Icono de advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-800 mb-3">Confirmar Eliminación</h3>

          {/* Mensaje */}
          <p className="text-gray-600 mb-6">{mensaje}</p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};