// src/components/sections/marcas/MarcasAliadas.jsx
import React from 'react';
import { useMarcasAliadas } from '../../../api/useMarcasAliadas';
import { VistaMarcas } from './VistaMarcas';
import { FormularioMarca } from './FormularioMarca';
import { VistaProductosMarca } from './VistaProductosMarca';
import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { VistaVentasMarca } from './VistaVentasMarca';

// Componente de notificación
const Notificacion = ({ mensaje, tipo, onCerrar }) => {
  const estilos = {
    exito: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    advertencia: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconos = {
    exito: <CheckCircle className="text-green-600" size={20} />,
    error: <AlertCircle className="text-red-600" size={20} />,
    advertencia: <AlertTriangle className="text-yellow-600" size={20} />
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border-2 rounded-lg shadow-lg p-4 flex items-center space-x-3 ${estilos[tipo]} animate-slide-in`}>
      {iconos[tipo]}
      <span className="font-medium">{mensaje}</span>
      <button onClick={onCerrar} className="ml-4 hover:opacity-70">
        <X size={18} />
      </button>
    </div>
  );
};

// Modal de confirmación
const ModalConfirmacion = ({ mensaje, onConfirmar, onCancelar }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
      <div className="flex items-start space-x-3 mb-6">
        <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar acción</h3>
          <p className="text-gray-600">{mensaje}</p>
        </div>
      </div>
      <div className="flex space-x-3 justify-end">
        <button
          onClick={onCancelar}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

export const MarcasAliadas = () => {
  const marcasAliadas = useMarcasAliadas();

  return (
    <div className="relative">
      {/* Notificación */}
      {marcasAliadas.notificacion && (
        <Notificacion
          mensaje={marcasAliadas.notificacion.mensaje}
          tipo={marcasAliadas.notificacion.tipo}
          onCerrar={() => marcasAliadas.setNotificacion(null)}
        />
      )}

      {/* Modal de confirmación */}
      {marcasAliadas.modalConfirmacion && (
        <ModalConfirmacion
          mensaje={marcasAliadas.modalConfirmacion.mensaje}
          onConfirmar={marcasAliadas.modalConfirmacion.onConfirmar}
          onCancelar={marcasAliadas.modalConfirmacion.onCancelar}
        />
      )}

      {/* Contenido principal según vista */}
      {marcasAliadas.vista === 'lista' && (
        <VistaMarcas marcasAliadas={marcasAliadas} />
      )}

      {(marcasAliadas.vista === 'agregar' || marcasAliadas.vista === 'editar') && (
        <FormularioMarca marcasAliadas={marcasAliadas} />
      )}

      {marcasAliadas.vista === 'productos' && (
        <VistaProductosMarca marcasAliadas={marcasAliadas} />
      )}

      {/* ⬅️ NUEVA VISTA DE VENTAS */}
      {marcasAliadas.vista === 'ventas' && (
        <VistaVentasMarca marcasAliadas={marcasAliadas} />
      )}
    </div>
  );
};