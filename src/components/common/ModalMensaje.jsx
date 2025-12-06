// src/components/common/ModalMensaje.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ModalMensaje = ({ mensaje, tipo = 'info', onCerrar, autoCloseMs = 0 }) => {
  useEffect(() => {
    let timer;
    if (autoCloseMs && autoCloseMs > 0) {
      timer = setTimeout(() => {
        onCerrar();
      }, autoCloseMs);
    }
    return () => clearTimeout(timer);
  }, [autoCloseMs, onCerrar]);

  const config = {
    exito: {
      titulo: 'Éxito',
      Icon: CheckCircle,
      color: 'text-green-600'
    },
    error: {
      titulo: 'Error',
      Icon: AlertCircle,
      color: 'text-red-600'
    },
    info: {
      titulo: 'Información',
      Icon: Info,
      color: 'text-teal-600'
    }
  }[tipo] || {
    titulo: 'Información',
    Icon: Info,
    color: 'text-teal-600'
  };

  const { titulo, Icon, color } = config;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-4">
          <Icon size={24} className={`${color}`} />
          <h3 className="text-lg font-bold text-gray-800">{titulo}</h3>
        </div>
        <p className="text-gray-700 mb-6 whitespace-pre-line">{mensaje}</p>
        <div className="flex justify-end">
          <button
            onClick={onCerrar}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
