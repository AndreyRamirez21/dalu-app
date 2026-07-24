// src/components/sections/Gastos.jsx
import React, { useState } from 'react';
import {
  Search, Plus, Edit, Trash2, X, Calendar, DollarSign, Tag, FileText,
  CreditCard, Building, Download, CalendarRange, TrendingUp, TrendingDown,
  Activity, Target, BarChart2
} from 'lucide-react';
import { useGastos } from '../../api/useGastos';
import { Notificacion } from '../common/Notificacion';
import { ModalConfirmacionEliminar } from '../common/ModalConfirmacionEliminar';

const BRAND = '#82bbbd';

/* ─── Stat card (idéntica a Ventas) ────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{
      borderTop: `2px solid ${accentColor}`,
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

/* ─── Button helpers (idénticos a Ventas) ──────────────────────── */
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

/* ─── Chip para filtros rápidos ─────────────────────────────────── */
const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
    style={active
      ? { backgroundColor: `${BRAND}1A`, borderColor: BRAND, color: BRAND }
      : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
    }
  >
    {children}
  </button>
);

const Gastos = () => {
  const gastos = useGastos();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const comparacion = gastos.getComparacionMesAnterior();

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Cantidad"
          value={gastos.gastosFiltrados.length}
          sub="gastos registrados"
          accentColor={BRAND}
        />
        <StatCard
          label="Total Gastado"
          value={`$${gastos.totalGastos.toFixed(2)}`}
          sub="según filtros actuales"
          accentColor="#dc2626"
        />
        <StatCard
          label="Promedio Diario"
          value={`$${gastos.getGastoPromedioPorDia().toFixed(2)}`}
          sub="del mes actual"
          accentColor="#6366f1"
        />
        <StatCard
          label="Proyección Mensual"
          value={`$${gastos.getProyeccionMensual().toFixed(2)}`}
          sub="estimado al final del mes"
          accentColor="#8B5CF6"
        />
      </div>

      {/* ── Card principal ── */}
      <div
        className="bg-white rounded-xl overflow-hidden mb-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Historial de Gastos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Controla y registra todos tus gastos</p>
            </div>
            <div className="flex gap-2">
              <BtnOutline onClick={() => setShowAnalytics(true)} icon={BarChart2}>
                Análisis
              </BtnOutline>
              <BtnOutline onClick={gastos.exportarGastosExcel} icon={Download}>
                Exportar Excel
              </BtnOutline>
              <BtnPrimary onClick={() => gastos.setShowModal(true)} icon={Plus}>
                Añadir Gasto
              </BtnPrimary>
            </div>
          </div>

          <div className="space-y-3">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar gasto…"
                value={gastos.searchTerm}
                onChange={(e) => gastos.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
                style={{ '--tw-ring-color': BRAND }}
                onFocus={(e) => { e.target.style.borderColor = BRAND; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            {/* Rango de fechas */}
            <div className="flex items-center gap-3">
              <CalendarRange size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <input
                  type="date"
                  value={gastos.fechaInicio}
                  onChange={(e) => gastos.setFechaInicio(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                />
                <span className="text-gray-300 text-sm">—</span>
                <input
                  type="date"
                  value={gastos.fechaFin}
                  onChange={(e) => gastos.setFechaFin(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                />
                {(gastos.fechaInicio || gastos.fechaFin) && (
                  <button
                    onClick={gastos.limpiarFiltrosFecha}
                    className="px-3 py-2 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Filtros rápidos:</span>
              <Chip
                onClick={() => {
                  const hoy = new Date();
                  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                  gastos.setFechaInicio(inicio.toISOString().split('T')[0]);
                  gastos.setFechaFin(hoy.toISOString().split('T')[0]);
                }}
              >
                Este mes
              </Chip>
              <Chip
                onClick={() => {
                  const hoy = new Date();
                  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                  gastos.setFechaInicio(inicioMesAnterior.toISOString().split('T')[0]);
                  gastos.setFechaFin(finMesAnterior.toISOString().split('T')[0]);
                }}
              >
                Mes anterior
              </Chip>
              <Chip
                onClick={() => {
                  const hoy = new Date();
                  const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
                  gastos.setFechaInicio(hace30dias.toISOString().split('T')[0]);
                  gastos.setFechaFin(hoy.toISOString().split('T')[0]);
                }}
              >
                Últimos 30 días
              </Chip>
            </div>

            {(gastos.fechaInicio || gastos.fechaFin) && (
              <div
                className="text-xs font-medium rounded-lg px-3.5 py-2.5"
                style={{ backgroundColor: `${BRAND}0D`, border: `1px solid ${BRAND}4D`, color: '#3f6b6d' }}
              >
                Mostrando {gastos.gastosFiltrados.length} gasto(s)
                {gastos.fechaInicio && gastos.fechaFin && (
                  <> desde <strong>{gastos.fechaInicio}</strong> hasta <strong>{gastos.fechaFin}</strong></>
                )}
                {gastos.fechaInicio && !gastos.fechaFin && (
                  <> desde <strong>{gastos.fechaInicio}</strong></>
                )}
                {!gastos.fechaInicio && gastos.fechaFin && (
                  <> hasta <strong>{gastos.fechaFin}</strong></>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabla (encabezado sticky + cuerpo con scroll, igual a Ventas) ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Fecha', 'Descripción', 'Categoría', 'Método de Pago', 'Monto', 'Acciones'].map((h) => (
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

        <div className="overflow-auto" style={{ maxHeight: '520px' }}>
          <table className="w-full">
            <tbody className="divide-y divide-gray-50">
              {gastos.loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-sm text-gray-400">
                    Cargando gastos…
                  </td>
                </tr>
              ) : gastos.gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-sm text-gray-400">
                    No hay gastos registrados
                  </td>
                </tr>
              ) : (
                gastos.gastosFiltrados.map((gasto) => (
                  <tr key={gasto.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                      {gastos.formatDate(gasto.fecha)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                      {gasto.proveedor && (
                        <div className="text-xs text-gray-400 mt-0.5">Proveedor: {gasto.proveedor}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${gastos.getCategoriaColor(gasto.categoria)}`}>
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gasto.metodo_pago}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                        ${parseFloat(gasto.monto).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => gastos.handleEdit(gasto)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                          title="Editar gasto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => gastos.handleDelete(gasto)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Eliminar gasto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel de Análisis (overlay derecho) ── */}
      {showAnalytics && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowAnalytics(false)}
          />

          <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND}22` }}
                >
                  <BarChart2 size={18} style={{ color: BRAND }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Análisis de Gastos</h3>
                  <p className="text-xs text-gray-400">Estadísticas y métricas</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Gráfica de dona */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Gastos por Categoría
                </p>
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-full h-56">
                    {gastos.estadisticas.length > 0 ? (
                      (() => {
                        const totalGeneral = gastos.estadisticas.reduce((acc, item) => acc + item.total, 0);
                        let acumulado = 0;
                        const colors = [BRAND, '#EC4899', '#3B82F6', '#F59E0B', '#6366F1'];
                        return gastos.estadisticas.map((item, index) => {
                          const porcentaje = (item.total / totalGeneral) * 440;
                          const dasharray = `${porcentaje} ${440 - porcentaje}`;
                          const dashoffset = -acumulado;
                          acumulado += porcentaje;
                          return (
                            <circle
                              key={index}
                              cx="100" cy="100" r="70"
                              fill="none"
                              stroke={colors[index % colors.length]}
                              strokeWidth="35"
                              strokeDasharray={dasharray}
                              strokeDashoffset={dashoffset}
                              transform="rotate(-90 100 100)"
                            />
                          );
                        });
                      })()
                    ) : (
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#e5e7eb" strokeWidth="35" />
                    )}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {gastos.estadisticas.map((item, index) => {
                    const dotColors = [BRAND, '#EC4899', '#3B82F6', '#F59E0B', '#6366F1'];
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColors[index % dotColors.length] }}
                        />
                        <span className="text-xs text-gray-500 truncate">
                          {item.categoria} (${item.total.toFixed(2)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métricas del mes */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Métricas del Mes
                </p>
                <div className="space-y-3">
                  {(() => {
                    const gastoMasAlto = gastos.getGastoMasAlto();
                    return gastoMasAlto ? (
                      <div className="bg-white rounded-xl p-4" style={{ borderTop: '2px solid #dc2626', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Gasto Más Alto</span>
                          <Target size={15} className="text-red-500" />
                        </div>
                        <div className="text-xl font-bold text-gray-900">${parseFloat(gastoMasAlto.monto).toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">{gastoMasAlto.descripcion}</div>
                      </div>
                    ) : null;
                  })()}

                  <div className="bg-white rounded-xl p-4" style={{ borderTop: '2px solid #6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Promedio por Día</span>
                      <Activity size={15} className="text-indigo-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">${gastos.getGastoPromedioPorDia().toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">Del mes actual</div>
                  </div>

                  <div className="bg-white rounded-xl p-4" style={{ borderTop: '2px solid #8B5CF6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Proyección Mensual</span>
                      <TrendingUp size={15} className="text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">${gastos.getProyeccionMensual().toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">Estimado al final del mes</div>
                  </div>

                  {comparacion && (
                    <div
                      className="bg-white rounded-xl p-4"
                      style={{ borderTop: `2px solid ${comparacion.esAumento ? '#f59e0b' : '#059669'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">vs Mes Anterior</span>
                        {comparacion.esAumento
                          ? <TrendingUp size={15} className="text-amber-500" />
                          : <TrendingDown size={15} className="text-emerald-500" />}
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {comparacion.esAumento ? '+' : ''}{comparacion.porcentaje.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ${comparacion.totalActual.toFixed(2)} vs ${comparacion.totalAnterior.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtrar por categoría */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Filtrar por Categoría
                </p>
                <div className="space-y-1">
                  {gastos.categorias.map((categoria, index) => {
                    const active = gastos.selectedCategory === categoria.nombre;
                    return (
                      <button
                        key={index}
                        onClick={() => gastos.setSelectedCategory(categoria.nombre)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
                        style={active ? { backgroundColor: `${BRAND}1A`, color: BRAND } : { color: '#374151' }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <span className={`font-medium text-sm ${!active ? categoria.color : ''}`}>{categoria.nombre}</span>
                        <span className="text-sm font-bold" style={{ color: active ? BRAND : '#9ca3af' }}>
                          {gastos.getCategoriaCount(categoria.nombre)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="bg-white rounded-xl p-4" style={{ borderTop: '2px solid #dc2626', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total de Gastos</span>
                  <span className="text-xl font-bold text-red-600">${gastos.totalGastos.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Modal agregar/editar ── */}
      {gastos.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {gastos.editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h3>
              <button
                onClick={() => { gastos.setShowModal(false); gastos.resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <Calendar size={14} /><span>Fecha *</span>
                  </label>
                  <input
                    type="date"
                    value={gastos.formData.fecha}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, fecha: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': BRAND }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <Tag size={14} /><span>Categoría *</span>
                  </label>
                  <select
                    value={gastos.formData.categoria}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, categoria: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': BRAND }}
                  >
                    {gastos.categorias.slice(1).map((cat) => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Descripción *</span>
                </label>
                <input
                  type="text"
                  value={gastos.formData.descripcion}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                  placeholder="Ej: Compra de telas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <DollarSign size={14} /><span>Monto *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gastos.formData.monto}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, monto: e.target.value })}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': BRAND }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <CreditCard size={14} /><span>Método de Pago *</span>
                  </label>
                  <select
                    value={gastos.formData.metodo_pago}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, metodo_pago: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': BRAND }}
                  >
                    {gastos.metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>{metodo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Building size={14} /><span>Proveedor (opcional)</span>
                </label>
                <input
                  type="text"
                  value={gastos.formData.proveedor}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, proveedor: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Notas (opcional)</span>
                </label>
                <textarea
                  value={gastos.formData.notas}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, notas: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': BRAND }}
                  rows="3"
                  placeholder="Información adicional…"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <BtnOutline onClick={() => { gastos.setShowModal(false); gastos.resetForm(); }}>
                  Cancelar
                </BtnOutline>
                <div className="flex-1">
                  <button
                    onClick={gastos.handleSubmit}
                    className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
                    style={{ backgroundColor: BRAND }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {gastos.editingGasto ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gastos.notificacion && (
        <Notificacion
          mensaje={gastos.notificacion.mensaje}
          tipo={gastos.notificacion.tipo}
          onClose={() => gastos.setNotificacion(null)}
        />
      )}

      {gastos.modalConfirmacion && (
        <ModalConfirmacionEliminar
          mensaje={gastos.modalConfirmacion.mensaje}
          onConfirmar={gastos.modalConfirmacion.onConfirmar}
          onCancelar={gastos.modalConfirmacion.onCancelar}
        />
      )}
    </div>
  );
};

export default Gastos;