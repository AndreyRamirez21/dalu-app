import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, Plus, Search, X, Download, CheckCircle,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { useVentas } from '../../api/useVentas';
import ModalAgregarVenta  from './ModalAgregarVenta';
import ModalDetalleVenta  from './ModalDetalleVenta';
import { ModalConfirmacion } from '../common/ModalConfirmacion';
import { exportarVentasExcel } from '../../utils/exportExcel';
import ModalDevolucion from './ModalDevolucion';

const BRAND = '#82bbbd';

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ mensaje, tipo = 'exito', onDone }) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ backgroundColor: tipo === 'exito' ? BRAND : '#dc2626' }}
    >
      {tipo === 'exito'
        ? <CheckCircle  size={18} className="text-white flex-shrink-0" />
        : <AlertCircle  size={18} className="text-white flex-shrink-0" />}
      <span className="text-white font-medium text-sm">{mensaje}</span>
    </div>
  );
};

/* ─── Stat card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{
      borderTop:  `2px solid ${accentColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {label}
    </p>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
  </div>
);

/* ─── Badge ──────────────────────────────────────────────────── */
const BADGE = {
  Pagado:    { color: '#059669', bg: '#f0fdf4', border: '#86efac' },
  Pendiente: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  Cancelado: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

const Badge = ({ estado }) => {
  const s = BADGE[estado] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {estado}
    </span>
  );
};

/* ─── Button helpers ─────────────────────────────────────────── */
const BtnPrimary = ({ onClick, disabled, icon: Icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
    style={{ backgroundColor: BRAND, color: '#fff' }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const BtnOutline = ({ onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50"
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

/* ─── Main component ─────────────────────────────────────────── */
const Ventas = () => {
  const { ventas, estadisticas, loading, buscarVentas, cargarVentas, cancelarVenta } = useVentas();
  const [searchTerm,           setSearchTerm]           = useState('');
  const [showModalAgregar,     setShowModalAgregar]     = useState(false);
  const [showModalDetalle,     setShowModalDetalle]     = useState(false);
  const [ventaSeleccionada,    setVentaSeleccionada]    = useState(null);
  const [showModalConfirm,     setShowModalConfirm]     = useState(false);
  const [ventaAConfirmar,      setVentaAConfirmar]      = useState(null);
  const [vistaAnual,           setVistaAnual]           = useState(false);
  const [showModalDevolucion,  setShowModalDevolucion]  = useState(false);
  const [toast,                setToast]                = useState(null);

  const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) buscarVentas(value);
    else cargarVentas();
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
    setVentaAConfirmar(null);
    setShowModalConfirm(false);
    const resultado = await cancelarVenta(id);
    if (resultado.success) {
      cargarVentas();
      mostrarToast(`Venta ${numero_venta} cancelada`, 'exito');
    } else {
      mostrarToast('Error al cancelar la venta', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const ventasFiltradas = [...ventas]
    .filter((v) => v.estado !== 'Cancelado')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const calcularEstadisticasAnuales = () => {
    const ahora      = new Date();
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
    const ventasAnio = ventas.filter(
      (v) => new Date(v.fecha) >= inicioAnio && v.estado !== 'Cancelado'
    );
    return {
      total_ventas:             ventasAnio.length,
      total_vendido:            ventasAnio.reduce((s, v) => s + (v.monto_pagado || 0), 0),
      total_pendiente:          ventasAnio.filter((v) => v.estado === 'Pendiente')
                                           .reduce((s, v) => s + (v.total - v.monto_pagado), 0),
      total_costos_adicionales: ventasAnio.reduce(
        (s, v) => s + (v.costo_bolsa || 0) + (v.costo_etiqueta || 0), 0
      ),
    };
  };

  const estadisticasAnuales = calcularEstadisticasAnuales();
  const stats = vistaAnual ? estadisticasAnuales : estadisticas;
  const periodo = vistaAnual ? 'este año' : 'este mes';

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onDone={() => setToast(null)} />
      )}

      {/* ── Stat cards ── */}
      <div className="mb-6">
        {/* Toggle Mes / Año */}
        <div className="flex justify-end mb-3">
          <div className="inline-flex bg-white rounded-lg border border-gray-200 p-0.5">
            {['Mes', 'Año'].map((label, i) => {
              const isYear = i === 1;
              const active = isYear ? vistaAnual : !vistaAnual;
              return (
                <button
                  key={label}
                  onClick={() => setVistaAnual(isYear)}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
                  style={active
                    ? { backgroundColor: BRAND, color: '#fff' }
                    : { color: '#6b7280' }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Cantidad"
            value={stats?.total_ventas ?? 0}
            sub={`ventas ${periodo}`}
            accentColor={BRAND}
          />
          <StatCard
            label="Total Vendido"
            value={`$${(stats?.total_vendido ?? 0).toFixed(2)}`}
            sub={`ingresos ${periodo}`}
            accentColor="#059669"
          />
          <StatCard
            label="Pendiente"
            value={`$${(stats?.total_pendiente ?? 0).toFixed(2)}`}
            sub="por cobrar"
            accentColor="#dc2626"
          />
          <StatCard
            label="Costos Extras"
            value={`$${(stats?.total_costos_adicionales ?? 0).toFixed(2)}`}
            sub="bolsas, etiquetas"
            accentColor="#6366f1"
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por número o cliente…"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': BRAND }}
            onFocus={(e) => { e.target.style.borderColor = BRAND; }}
            onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <BtnOutline
            onClick={() => exportarVentasExcel(ventas)}
            icon={Download}
          >
            Exportar Excel
          </BtnOutline>
          <BtnOutline
            onClick={() => setShowModalDevolucion(true)}
            icon={RefreshCw}
          >
            Devolución
          </BtnOutline>
          <BtnPrimary
            onClick={() => setShowModalAgregar(true)}
            icon={Plus}
          >
            Nueva Venta
          </BtnPrimary>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div
          className="overflow-x-auto"
          style={{ transform: 'rotateX(180deg)' }}
        >
          <div style={{ transform: 'rotateX(180deg)' }}>

            {/* Sticky header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {[
                      'ID Venta', 'Cliente', 'Productos', 'Total',
                      'Estado', 'Fecha', 'Acciones'
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-white sticky top-0 z-10"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable body */}
            <div className="overflow-auto" style={{ maxHeight: '500px' }}>
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {loading && ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-14 text-center text-sm text-gray-400">
                        Cargando ventas…
                      </td>
                    </tr>
                  ) : ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-14 text-center text-sm text-gray-400">
                        No hay ventas registradas
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((venta) => (
                      <tr
                        key={venta.id}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: BRAND }}
                            >
                              {venta.numero_venta}
                            </span>
                            {venta.tiene_devolucion && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                                <RefreshCw size={9} />
                                Dev.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                          {venta.cliente_nombre}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {venta.total_productos} prod.
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${venta.total.toFixed(2)}
                          </div>
                          {venta.estado === 'Pendiente' && (
                            <div className="text-xs text-red-500 mt-0.5">
                              Debe: ${Math.max(0, venta.total - (venta.monto_pagado - (venta.cambio || 0))).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge estado={venta.estado} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(venta.fecha)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleVerDetalle(venta)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                              title="Ver detalle"
                            >
                              <Eye size={16} />
                            </button>
                            {venta.estado !== 'Cancelado' && (
                              <button
                                onClick={() => handleCancelarVenta(venta)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                                title="Cancelar venta"
                              >
                                <X size={16} />
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
        </div>
      </div>

      {/* ── Modals ── */}
      {showModalConfirm && ventaAConfirmar && (
        <ModalConfirmacion
          titulo="Cancelar Venta"
          mensaje={`¿Cancelar la venta ${ventaAConfirmar.numero_venta}? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarCancelacion}
          onCancelar={() => { setShowModalConfirm(false); setVentaAConfirmar(null); }}
        />
      )}

      {showModalAgregar && (
        <ModalAgregarVenta
          onClose={() => setShowModalAgregar(false)}
          onSuccess={() => { setShowModalAgregar(false); cargarVentas(); }}
        />
      )}

      {showModalDevolucion && (
        <ModalDevolucion
          onClose={() => setShowModalDevolucion(false)}
          onSuccess={() => {
            setShowModalDevolucion(false);
            cargarVentas();
            mostrarToast('Devolución registrada exitosamente', 'exito');
          }}
        />
      )}

      {showModalDetalle && ventaSeleccionada && (
        <ModalDetalleVenta
          venta={ventaSeleccionada}
          onClose={() => { setShowModalDetalle(false); setVentaSeleccionada(null); }}
        />
      )}
    </div>
  );
};

export default Ventas;