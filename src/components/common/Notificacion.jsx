// src/components/common/Notificacion.jsx
import React, { useEffect } from 'react';

export const Notificacion = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const estilos = tipo === 'exito'
    ? 'bg-green-50 border-green-500 text-green-800'
    : tipo === 'error'
    ? 'bg-red-50 border-red-500 text-red-800'
    : 'bg-yellow-50 border-yellow-500 text-yellow-800';

  const Icono = tipo === 'exito' ? '✓' : tipo === 'error' ? '✕' : '⚠';

  return (
    <div className={`fixed top-4 right-4 z-50 ${estilos} border-l-4 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md`}>
      <span className="text-2xl">{Icono}</span>
      <p className="flex-1 font-medium">{mensaje}</p>
      <button onClick={onClose} className="hover:opacity-70 text-xl font-bold">
        ×
      </button>
    </div>
  );
};