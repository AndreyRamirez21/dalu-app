// src/components/sections/Inventario.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useInventario } from '../../api/useInventario';
import { Notificacion } from '../common/Notificacion';
import { ModalConfirmacion } from '../common/ModalConfirmacion';
import { VistaLista } from './inventario/VistaLista';
import { VistaFormulario } from './inventario/VistaFormulario';

const Inventario = () => {
  const inventario = useInventario();

  // Pantallas de carga y error
  if (inventario.cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (inventario.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error al cargar datos</h3>
          <p className="text-red-600 mb-4">{inventario.error}</p>
          <button
            onClick={inventario.cargarProductos}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {inventario.vista === 'lista' ? (
        <VistaLista inventario={inventario} />
      ) : (
        <VistaFormulario inventario={inventario} />
      )}

      {inventario.notificacion && (
        <Notificacion
          mensaje={inventario.notificacion.mensaje}
          tipo={inventario.notificacion.tipo}
          onClose={() => inventario.setNotificacion(null)}
        />
      )}

      {inventario.modalConfirmacion && (
        <ModalConfirmacion
          mensaje={inventario.modalConfirmacion.mensaje}
          onConfirmar={inventario.modalConfirmacion.onConfirmar}
          onCancelar={inventario.modalConfirmacion.onCancelar}
        />
      )}
    </>
  );
};

export default Inventario;

