import React, { useState } from 'react';
import { ShoppingCart, Eye, Plus, Search, Calendar, X, Download } from 'lucide-react';
import { useVentas } from '../../api/useVentas';
import ModalAgregarVenta from './ModalAgregarVenta';
import ModalDetalleVenta from './ModalDetalleVenta';
import { ModalConfirmacion } from '../common/ModalConfirmacion';
import { ModalMensaje } from '../common/ModalMensaje';
import { exportarVentasExcel } from '../../utils/exportExcel';



const Ventas = () => {
  const {
    ventas,
    estadisticas,
    loading,
    buscarVentas,
    cargarVentas,
    cancelarVenta
  } = useVentas();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [ventaAConfirmar, setVentaAConfirmar] = useState(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      buscarVentas(value);
    } else {
      cargarVentas();
    }
  };

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta);
    setShowModalDetalle(true);
  };

const handleCancelarVenta = (venta) => {
  setVentaAConfirmar(venta);
  setShowModalConfirm(true);
};

const confirmarCancelacion = async () => {
  if (!ventaAConfirmar) return;

  const { id, numero_venta } = ventaAConfirmar;
  setShowModalConfirm(false); // Cerrar modal de confirmación

  const resultado = await cancelarVenta(id);

  if (resultado.success) {
    setMensajeModal(`Venta ${numero_venta} cancelada exitosamente`);
    setMostrarMensaje(true);
    cargarVentas();
  } else {
    setMensajeModal("Error al cancelar la venta");
    setMostrarMensaje(true);
  }
};


  const getEstadoColor = (estado) => {
    const colors = {
      'Pagado': 'bg-green-100 text-green-700',
      'Pendiente': 'bg-yellow-100 text-yellow-700',
      'Cancelado': 'bg-red-100 text-red-700'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

    const formatDate = (dateString) => {
      // SQLite guarda en UTC, así que parseamos como UTC y convertimos a hora local
      const date = new Date(dateString); // La 'Z' indica que es UTC

      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

  const ventasFiltradas = ventas;

  return (
    <div className="p-8">
            {/* Header de Ventas */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Total Ventas */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                  <div className="text-xs font-medium text-teal-600 uppercase mb-1">Cantidad</div>
                  <div className="text-2xl font-bold text-teal-700">{estadisticas?.total_ventas || 0}</div>
                  <div className="text-xs text-teal-600 mt-1">ventas este mes</div>
                </div>

                {/* Total Vendido */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-600 uppercase mb-1">Total Vendido</div>
                  <div className="text-2xl font-bold text-green-700">
                    ${estadisticas?.total_vendido?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">ingresos totales</div>
                </div>

                {/* Pendiente */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="text-xs font-medium text-red-600 uppercase mb-1">Pendiente</div>
                  <div className="text-2xl font-bold text-red-700">
                    ${estadisticas?.total_pendiente?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-red-600 mt-1">por cobrar</div>
                </div>

                {/* Costos Adicionales */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 uppercase mb-1">Costos Extras</div>
                  <div className="text-2xl font-bold text-blue-700">
                    ${estadisticas?.total_costos_adicionales?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">bolsas, etiquetas</div>
                </div>
              </div>

              {/* Barra de búsqueda */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por número de venta o cliente..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={() => exportarVentasExcel(ventas)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  disabled={ventas.length === 0}
                >
                  <Download size={20} />
                  <span>Exportar Excel</span>
                </button>
                <button
                  onClick={() => setShowModalAgregar(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
                >
                  <Plus size={20} />
                  <span>Nueva Venta</span>
                </button>
              </div>
            </div>
      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading && ventasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Cargando ventas...</div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay ventas registradas</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Venta
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasFiltradas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                    {venta.numero_venta}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {venta.cliente_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {venta.total_productos} producto(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${venta.total.toFixed(2)}
                    </div>
                    {venta.estado === 'Pendiente' && (
                      <div className="text-xs text-red-600">
                        Debe: ${(venta.total - venta.monto_pagado).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                      {venta.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(venta.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerDetalle(venta)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Ver detalle"
                      >
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      {venta.estado !== 'Cancelado' && (
                        <button
                            onClick={() => handleCancelarVenta(venta)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Cancelar venta"
                        >
                          <X size={18} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
            {showModalConfirm && ventaAConfirmar && (
              <ModalConfirmacion
                mensaje={`¿Cancelar la venta ${ventaAConfirmar.numero_venta}? Esto devolverá el stock de los productos.`}
                onConfirmar={confirmarCancelacion}
                onCancelar={() => {
                  setShowModalConfirm(false);
                  setVentaAConfirmar(null);
                }}
              />
            )}

      {/* Modal Agregar Venta */}
      {showModalAgregar && (
        <ModalAgregarVenta
          onClose={() => setShowModalAgregar(false)}
          onSuccess={() => {
            setShowModalAgregar(false);
            cargarVentas();
          }}
        />
      )}

          {mostrarMensaje && (
            <ModalMensaje
              mensaje={mensajeModal}
              onCerrar={() => setMostrarMensaje(false)}
            />
          )}


      {/* Modal Detalle Venta */}
      {showModalDetalle && ventaSeleccionada && (
        <ModalDetalleVenta
          venta={ventaSeleccionada}
          onClose={() => {
            setShowModalDetalle(false);
            setVentaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
};

export default Ventas;