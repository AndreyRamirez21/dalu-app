import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Package
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const BRAND = '#82bbbd';

/* ─── Stat card con figurita (icono en badge de color) ─────────── */
const StatCard = ({ label, value, icon: Icon, accentColor, footer }) => (
  <div
    className="bg-white rounded-xl p-6"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}1A` }}>
        <Icon size={22} style={{ color: accentColor }} />
      </div>
    </div>
    {footer}
  </div>
);

/* ─── Badge de tipo de actividad ────────────────────────────────── */
const TIPO_STYLE = {
  Venta:      { color: '#059669', bg: '#f0fdf4', border: '#86efac' },
  Gasto:      { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  Inventario: { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  Deuda:      { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
};

const TipoBadge = ({ tipo }) => {
  const s = TIPO_STYLE[tipo] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {tipo}
    </span>
  );
};

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    ventasTotales: 0,
    ventasMesAnterior: 0,
    gastosTotales: 0,
    gastosMesAnterior: 0,
    deudasPendientes: 0,
    clientesConDeuda: 0,
    itemsInventario: 0,
    productosStockBajo: 0
  });

  const [actividadReciente, setActividadReciente] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const datos = await ipcRenderer.invoke('obtener-dashboard-stats');
      setEstadisticas(datos.estadisticas);
      setActividadReciente(datos.actividades);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return 0;
    return (((actual - anterior) / anterior) * 100).toFixed(2);
  };

  const cambioVentas = calcularCambio(estadisticas.ventasTotales, estadisticas.ventasMesAnterior);
  const cambioGastos = calcularCambio(estadisticas.gastosTotales, estadisticas.gastosMesAnterior);

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diffMs = ahora - fechaActividad;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHoras < 1) {
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      return `Hace ${diffMinutos} minuto${diffMinutos !== 1 ? 's' : ''}`;
    } else if (diffHoras < 24) {
      return `Hace ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
    } else {
      return fechaActividad.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-sm text-gray-400">Cargando dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Ventas Totales */}
        <StatCard
          label="Ventas Totales"
          value={`$${estadisticas.ventasTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          accentColor="#059669"
          footer={
            <div
              className="text-xs font-semibold flex items-center"
              style={{ color: cambioVentas >= 0 ? '#059669' : '#dc2626' }}
            >
              {cambioVentas >= 0 ? '+' : ''}{cambioVentas}% vs mes anterior
            </div>
          }
        />

        {/* Gastos Totales */}
        <StatCard
          label="Gastos Totales"
          value={`$${estadisticas.gastosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          accentColor="#dc2626"
          footer={
            <div
              className="text-xs font-semibold flex items-center"
              style={{ color: cambioGastos >= 0 ? '#dc2626' : '#059669' }}
            >
              {cambioGastos >= 0 ? '+' : ''}{cambioGastos}% vs mes anterior
            </div>
          }
        />

        {/* Deudas por Cobrar */}
        <StatCard
          label="Deudas por Cobrar"
          value={`$${estadisticas.deudasPendientes.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          accentColor="#d97706"
          footer={
            <div className="text-xs text-gray-400">
              {estadisticas.clientesConDeuda} cliente{estadisticas.clientesConDeuda !== 1 ? 's' : ''} con saldo pendiente
            </div>
          }
        />

        {/* Items en Inventario */}
        <StatCard
          label="Items en Inventario"
          value={estadisticas.itemsInventario}
          icon={Package}
          accentColor={BRAND}
          footer={
            <div className="text-xs text-gray-400">
              {estadisticas.productosStockBajo} producto{estadisticas.productosStockBajo !== 1 ? 's' : ''} bajos en stock
            </div>
          }
        />
      </div>

      {/* Actividad Reciente */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="overflow-x-auto">
          {actividadReciente.length === 0 ? (
            <div className="text-center py-14">
              <AlertCircle size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-gray-400">No hay actividad reciente</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Tipo
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Descripción
                  </th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Monto
                  </th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actividadReciente.map((actividad, index) => (
                  <tr key={index} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <TipoBadge tipo={actividad.tipo} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{actividad.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className="font-bold text-sm"
                        style={{
                          color: actividad.tipo === 'Venta' || actividad.tipo === 'Deuda'
                            ? '#059669'
                            : actividad.tipo === 'Gasto'
                              ? '#dc2626'
                              : '#6366f1'
                        }}
                      >
                        {actividad.monto}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs text-gray-400">
                        {formatearFecha(actividad.fecha)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;