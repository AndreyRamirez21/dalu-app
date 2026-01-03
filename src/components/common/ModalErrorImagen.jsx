// src/components/common/ModalErrorImagen.jsx
import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export const ModalErrorImagen = ({ mensaje, onCerrar }) => {
  // Auto-cerrar después de 2 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        onCerrar();
      }, 2000); // 2 segundos

      // Limpiar el timer si el componente se desmonta antes
      return () => clearTimeout(timer);
    }
  }, [mensaje, onCerrar]);

  if (!mensaje) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Contenido del modal */}
        <div className="p-8 text-center">
          {/* Icono de error */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-800 mb-3">Error</h3>

          {/* Mensaje */}
          <p className="text-gray-600 mb-6">{mensaje}</p>

          {/* Botón Aceptar */}
          <button
            onClick={onCerrar}
            className="px-8 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};