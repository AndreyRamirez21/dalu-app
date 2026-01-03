import React, { useState } from 'react';
import { ShoppingCart, Eye, Plus, Search, Calendar, X, Download } from 'lucide-react';
import { useVentas } from '../../api/useVentas';
import ModalAgregarVenta from './ModalAgregarVenta';
import ModalDetalleVenta from './ModalDetalleVenta';
import { ModalConfirmacion } from '../common/ModalConfirmacion';
import { ModalMensaje } from '../common/ModalMensaje';
import { exportarVentasExcel } from '../../utils/exportExcel';

const Ventas = () => {
  const { ventas, estadisticas, loading, buscarVentas, cargarVentas, cancelarVenta } = useVentas();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [ventaAConfirmar, setVentaAConfirmar] = useState(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [vistaAnual, setVistaAnual] = useState(false);

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
    setShowModalConfirm(false);

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
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ordenar ventas por fecha descendente (más reciente primero)
  const ventasFiltradas = [...ventas].sort((a, b) => {
    return new Date(b.fecha) - new Date(a.fecha);
  });

  // Calcular estadísticas anuales
  const calcularEstadisticasAnuales = () => {
    const ahora = new Date();
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    const ventasDelAnio = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicioAnio && venta.estado !== 'Cancelado';
    });

    const total_ventas = ventasDelAnio.length;
    // ✅ CORREGIDO: Sumar solo lo que se pagó (monto_pagado), no el total
    const total_vendido = ventasDelAnio.reduce((sum, v) => sum + (v.monto_pagado || 0), 0);
    const total_pendiente = ventasDelAnio
      .filter(v => v.estado === 'Pendiente')
      .reduce((sum, v) => sum + (v.total - v.monto_pagado), 0);
    const total_costos_adicionales = ventasDelAnio.reduce((sum, v) => sum + (v.costo_bolsa || 0) + (v.costo_etiqueta || 0), 0);

    return {
      total_ventas,
      total_vendido,
      total_pendiente,
      total_costos_adicionales
    };
  };

  const estadisticasAnuales = calcularEstadisticasAnuales();
  const estadisticasMostrar = vistaAnual ? estadisticasAnuales : estadisticas;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header de Ventas */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de Ventas</h1>
        <p className="text-gray-600">Registra y administra las ventas de tu negocio.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="mb-6">
        <div className="flex justify-end items-center mb-3">
          <div className="inline-flex bg-white rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setVistaAnual(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                !vistaAnual
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setVistaAnual(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                vistaAnual
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Año
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Ventas */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
            <p className="text-xs text-cyan-600 font-medium mb-1">Cantidad</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {estadisticasMostrar?.total_ventas || 0}
            </h3>
            <p className="text-xs text-cyan-600">
              {vistaAnual ? 'ventas este año' : 'ventas este mes'}
            </p>
          </div>

          {/* Total Vendido */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Total Vendido</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              ${estadisticasMostrar?.total_vendido?.toFixed(2) || '0.00'}
            </h3>
            <p className="text-xs text-green-600">
              {vistaAnual ? 'ingresos anuales' : 'ingresos mensuales'}
            </p>
          </div>

          {/* Pendiente */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-600 font-medium mb-1">Pendiente</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              ${estadisticasMostrar?.total_pendiente?.toFixed(2) || '0.00'}
            </h3>
            <p className="text-xs text-red-600">por cobrar</p>
          </div>

          {/* Costos Adicionales */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Costos Extras</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              ${estadisticasMostrar?.total_costos_adicionales?.toFixed(2) || '0.00'}
            </h3>
            <p className="text-xs text-blue-600">bolsas, etiquetas</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de venta o cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportarVentasExcel(ventas)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            disabled={ventas.length === 0}
          >
            <Download className="w-5 h-5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setShowModalAgregar(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* Tabla de Ventas con scroll */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Venta</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Productos</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Contenedor con scroll para el tbody */}
        <div className="overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              {loading && ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-teal-600 font-semibold">{venta.numero_venta}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {venta.cliente_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {venta.total_productos} producto(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-semibold">${venta.total.toFixed(2)}</div>
                      {venta.estado === 'Pendiente' && (
                        <div className="text-xs text-red-600 mt-1">
                          Debe: ${(venta.total - venta.monto_pagado).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                        {venta.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(venta.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVerDetalle(venta)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                        {venta.estado !== 'Cancelado' && (
                          <button
                            onClick={() => handleCancelarVenta(venta)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Cancelar venta"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModalConfirm && ventaAConfirmar && (
        <ModalConfirmacion
          titulo="Cancelar Venta"
          mensaje={`¿Estás seguro de que deseas cancelar la venta ${ventaAConfirmar.numero_venta}? Esta acción no se puede deshacer.`}
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
          onClose={() => setMostrarMensaje(false)}
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