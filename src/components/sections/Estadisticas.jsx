import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  PiggyBank,
  Package,
  Info,
  Handshake,
  ShoppingBag,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { ipcRenderer } = window.require('electron');

const BRAND = '#82bbbd';

// ============================================
// COMPONENTE: Selector de Período Flexible
// ============================================
const PeriodSelector = ({ onPeriodChange }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    if (!inicializado) {
      aplicarFiltroRapido('este_mes');
      setInicializado(true);
    }
  }, [inicializado]);

  const aplicarFiltroRapido = (filtro) => {
    const hoy = new Date();
    let inicio, fin;

    switch (filtro) {
      case 'este_mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = hoy;
        break;
      case 'mes_anterior':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'ultimos_30_dias':
        inicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        fin = hoy;
        break;
      case 'ultimos_3_meses':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
        fin = hoy;
        break;
      case 'ultimos_6_meses':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
        fin = hoy;
        break;
      case 'este_ano':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = hoy;
        break;
      default:
        return;
    }

    const inicioStr = inicio.toISOString().split('T')[0];
    const finStr = fin.toISOString().split('T')[0];

    setFechaInicio(inicioStr);
    setFechaFin(finStr);
    setPeriodoSeleccionado(filtro);
    onPeriodChange({ inicio: inicioStr, fin: finStr, tipo: filtro });
  };

  const aplicarFechasPersonalizadas = () => {
    if (fechaInicio && fechaFin) {
      setPeriodoSeleccionado('personalizado');
      onPeriodChange({ inicio: fechaInicio, fin: fechaFin, tipo: 'personalizado' });
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-6 mb-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Período de Análisis</h3>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona un rango de fechas o usa los filtros rápidos</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="text-gray-400 flex-shrink-0" size={17} />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value);
              setPeriodoSeleccionado('personalizado');
            }}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': BRAND }}
            onFocus={(e) => { e.target.style.borderColor = BRAND; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>

        <span className="text-gray-300">—</span>

        <div className="flex items-center gap-2 flex-1">
          <Calendar className="text-gray-400 flex-shrink-0" size={17} />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => {
              setFechaFin(e.target.value);
              setPeriodoSeleccionado('personalizado');
            }}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': BRAND }}
            onFocus={(e) => { e.target.style.borderColor = BRAND; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>

        <button
          onClick={aplicarFechasPersonalizadas}
          disabled={!fechaInicio || !fechaFin}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ backgroundColor: BRAND, color: '#fff' }}
          onMouseEnter={(e) => { if (fechaInicio && fechaFin) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Aplicar
        </button>
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Filtros rápidos</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'este_mes', label: 'Este mes' },
            { id: 'mes_anterior', label: 'Mes anterior' },
            { id: 'ultimos_30_dias', label: 'Últimos 30 días' },
            { id: 'ultimos_3_meses', label: 'Últimos 3 meses' },
            { id: 'ultimos_6_meses', label: 'Últimos 6 meses' },
            { id: 'este_ano', label: 'Este año' }
          ].map((filtro) => {
            const active = periodoSeleccionado === filtro.id;
            return (
              <button
                key={filtro.id}
                onClick={() => aplicarFiltroRapido(filtro.id)}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                style={active
                  ? { backgroundColor: BRAND, color: '#fff' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                }
              >
                {filtro.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Estadística
// ============================================
const StatCard = ({ title, value, icon: Icon, trend, subtitle, accentColor = BRAND }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
      {Icon && <Icon size={16} style={{ color: accentColor }} />}
    </div>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    {trend !== undefined ? (
      <div className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {Math.abs(trend)}% {subtitle || 'vs período anterior'}
      </div>
    ) : subtitle ? (
      <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>
    ) : null}
  </div>
);

// ============================================
// COMPONENTE: Resumen de Período
// ============================================
const PeriodSummary = ({ data }) => {
  const {
    ventasPropias = 0,
    ingresoMarcasAliadas = 0,
    totalCostoProductos = 0,
    totalCostosAdicionales = 0,
    totalGastos = 0,
    gananciaNeta = 0
  } = data;

  return (
    <div
      className="bg-white rounded-xl p-6 mb-6"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#f0fdfa' }}>
          <Calendar size={20} style={{ color: BRAND }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Resumen del Período — Ingresos Reales</h3>
          <p className="text-xs text-gray-500">Solo tu dinero (sin el 90% de marcas aliadas)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="text-center rounded-lg p-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#FAFBFC' }}>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Ventas Propias</div>
          <div className="text-base font-bold" style={{ color: '#059669' }}>
            ${ventasPropias.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center rounded-lg p-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#FAFBFC' }}>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Comisión 10%</div>
          <div className="text-base font-bold" style={{ color: BRAND }}>
            +${ingresoMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center rounded-lg p-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#FAFBFC' }}>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Costo Productos</div>
          <div className="text-base font-bold" style={{ color: '#d97706' }}>
            -${totalCostoProductos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center rounded-lg p-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#FAFBFC' }}>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Costos Extras</div>
          <div className="text-base font-bold" style={{ color: '#b45309' }}>
            -${totalCostosAdicionales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center rounded-lg p-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#FAFBFC' }}>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Gastos</div>
          <div className="text-base font-bold text-red-600">
            -${totalGastos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center rounded-lg p-3" style={{ border: `1px solid ${BRAND}`, backgroundColor: '#f0fdfa' }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: BRAND }}>Ganancia Neta</div>
          <div className={`text-base font-bold ${gananciaNeta >= 0 ? '' : 'text-red-600'}`} style={gananciaNeta >= 0 ? { color: BRAND } : undefined}>
            {gananciaNeta >= 0 ? '$' : '-$'}
            {Math.abs(gananciaNeta).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Modal Detalle Producto
// ============================================
const DetalleProductoModal = ({ producto, periodo, onClose }) => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await ipcRenderer.invoke('obtener-detalle-producto-top', producto.nombre, periodo);
        setDetalles(data);
      } catch (err) {
        console.error('Error al cargar detalle:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [producto, periodo]);

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{producto.nombre}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {detalles.length} venta(s) · {producto.cantidad?.toFixed(0)} unidades totales
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }}></div>
            </div>
          ) : detalles.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No hay detalles disponibles</div>
          ) : (
            <div className="space-y-3">
              {detalles.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 flex items-center justify-between transition-colors hover:bg-gray-50/70"
                  style={{ border: '1px solid #f1f5f9' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: '#f0fdfa', color: BRAND }}
                    >
                      x{item.cantidad}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Ref: <span style={{ color: BRAND }}>{item.referencia}</span>
                        {item.talla && item.talla !== 'Única' && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 text-xs rounded-full">
                            {item.talla}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        Venta #{item.numero_venta} · {item.cliente_nombre}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: '#059669' }}>
                      ${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-400">{formatFecha(item.fecha)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con totales */}
        {!loading && detalles.length > 0 && (
          <div className="p-4 rounded-b-2xl flex justify-between items-center" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#F8FAFC' }}>
            <span className="text-sm text-gray-500 font-medium">Total del período</span>
            <span className="text-lg font-bold" style={{ color: '#059669' }}>
              ${producto.total_ventas?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Top Productos (con modal al hacer clic)
// ============================================
const TopProductos = ({ productos, periodoActual }) => {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const colores = [
    { bg: '#fffbeb', bar: '#f59e0b', text: '#d97706', icon: '🥇' },
    { bg: '#f9fafb', bar: '#9ca3af', text: '#6b7280', icon: '🥈' },
    { bg: '#fff7ed', bar: '#fb923c', text: '#ea580c', icon: '🥉' },
    { bg: '#f0fdfa', bar: BRAND, text: BRAND, icon: '4️⃣' },
    { bg: '#faf5ff', bar: '#a78bfa', text: '#7c3aed', icon: '5️⃣' }
  ];

  if (!productos || productos.length === 0) {
    return (
      <div
        className="bg-white rounded-xl p-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <h3 className="text-base font-bold text-gray-900 mb-4">Top 5 Productos Más Vendidos</h3>
        <div className="text-center py-8 text-gray-400 text-sm">No hay datos de productos vendidos en este período</div>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white rounded-xl p-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Top 5 Productos Propios Más Vendidos</h3>
          <p className="text-xs text-gray-500 mt-0.5">Haz clic en un producto para ver el detalle de ventas</p>
        </div>

        <div className="space-y-3">
          {productos.map((producto, index) => {
            const porcentaje = productos[0].cantidad > 0 ? (producto.cantidad / productos[0].cantidad) * 100 : 0;
            const color = colores[index];

            return (
              <div
                key={index}
                onClick={() => setProductoSeleccionado(producto)}
                className="rounded-lg p-4 transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]"
                style={{ backgroundColor: color.bg }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{color.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{producto.nombre}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span>Toca para ver detalle</span>
                        <span>→</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: color.text }}>{producto.cantidad?.toFixed(0)}</div>
                    <div className="text-xs text-gray-400">unidades</div>
                  </div>
                </div>
                <div className="w-full bg-white bg-opacity-60 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%`, backgroundColor: color.bar }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    Ingresos: <span className="font-semibold" style={{ color: '#059669' }}>
                      ${producto.total_ventas?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                  <span className="text-gray-400">{porcentaje.toFixed(1)}% del líder</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {productoSeleccionado && (
        <DetalleProductoModal
          producto={productoSeleccionado}
          periodo={periodoActual}
          onClose={() => setProductoSeleccionado(null)}
        />
      )}
    </>
  );
};

// ============================================
// COMPONENTE PRINCIPAL: Estadísticas
// ============================================
const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [periodoActual, setPeriodoActual] = useState(null);
  const cargarEstadisticas = async (periodo) => {
    if (!periodo || !periodo.inicio || !periodo.fin) {
      console.error('Período inválido:', periodo);
      return;
    }
    setPeriodoActual(periodo);
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Cargando estadísticas:', periodo);

      const stats = await ipcRenderer.invoke('obtener-estadisticas-periodo', periodo);
      console.log('✅ Estadísticas:', stats);
      setEstadisticas(stats);

      const grafica = await ipcRenderer.invoke('obtener-grafica-periodo', periodo);
      console.log('✅ Gráfica:', grafica?.length, 'meses');
      setDatosGrafica(grafica || []);

      const productos = await ipcRenderer.invoke('obtener-top-productos-periodo', periodo);
      console.log('✅ Top productos:', productos?.length);
      setTopProductos(productos || []);
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-8" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Negocio</h1>
          <p className="text-gray-500 mt-1 text-sm">Análisis detallado de ventas, gastos y ganancias</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return 0;
    return (((actual - anterior) / anterior) * 100).toFixed(2);
  };

  const renderContent = () => {
    if (loading || !estadisticas) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderColor: BRAND }}></div>
          <div className="text-gray-400 text-sm">Cargando estadísticas…</div>
        </div>
      );
    }

    const cambioVentas = calcularCambio(estadisticas.ventasTotales, estadisticas.ventasMesAnterior);

    // Calcular totales del período
    const totalVentasPropias = datosGrafica.reduce((sum, item) => sum + (item.ventasPropias || 0), 0);
    const totalIngresoMarcas = datosGrafica.reduce((sum, item) => sum + (item.ingresoMarcasAliadas || 0), 0);
    const totalCostoProductos = datosGrafica.reduce((sum, item) => sum + (item.costoProductos || 0), 0);
    const totalCostosAdicionales = datosGrafica.reduce((sum, item) => sum + (item.costosAdicionales || 0), 0);
    const totalGastos = datosGrafica.reduce((sum, item) => sum + (item.gastos || 0), 0);
    const gananciaPeriodo = totalVentasPropias + totalIngresoMarcas - totalCostoProductos - totalCostosAdicionales - totalGastos;

    return (
      <>
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-blue-800">
            <strong>Nota:</strong> Los gastos con categoría "Inventario" o "Proveedores" NO se incluyen en el cálculo de ganancia neta.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard
            title="Facturación Total"
            value={`$${estadisticas.ventasTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            trend={parseFloat(cambioVentas)}
            subtitle="Propias + Marcas (referencial)"
            accentColor="#6b7280"
          />
          <StatCard
            title="Ingresos Reales"
            value={`$${estadisticas.ingresosReales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            subtitle="Tu dinero real (propias + 10%)"
            accentColor="#059669"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Ventas Propias"
            value={`$${estadisticas.ventasPropias.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={ShoppingBag}
            subtitle="Productos de tu tienda"
            accentColor="#059669"
          />
          <StatCard
            title="Ventas Marcas Aliadas"
            value={`$${estadisticas.ventasMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Handshake}
            subtitle="Monto total (referencial)"
            accentColor="#7c3aed"
          />
          <StatCard
            title="Tu Comisión (10%)"
            value={`$${estadisticas.ingresoMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            subtitle="Tu ingreso de marcas"
            accentColor={BRAND}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Costo Productos Propios"
            value={`$${estadisticas.costoProductosVendidos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Package}
            subtitle="Solo tus productos"
            accentColor="#d97706"
          />
          <StatCard
            title="Gastos Operativos"
            value={`$${estadisticas.gastosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingDown}
            subtitle="Sin inventario"
            accentColor="#dc2626"
          />
          <StatCard
            title="Inversión Inventario"
            value={`$${estadisticas.gastosInventario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Package}
            subtitle="No afecta ganancia neta"
            accentColor="#6366f1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Ganancia Bruta"
            value={`$${estadisticas.gananciaBruta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={PiggyBank}
            subtitle="Ingresos - Costos"
            accentColor="#2563eb"
          />
          <StatCard
            title="Margen Bruto"
            value={`${estadisticas.margenBruto.toFixed(1)}%`}
            icon={BarChart3}
            subtitle="Antes de gastos"
            accentColor="#2563eb"
          />
          <StatCard
            title="Ganancia Neta"
            value={`$${estadisticas.gananciaNeta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            subtitle="✓ Ya incluye marcas"
            accentColor="#059669"
          />
          <StatCard
            title="Margen Neto"
            value={`${estadisticas.margenNeto.toFixed(1)}%`}
            icon={BarChart3}
            subtitle="Real sobre ingresos"
            accentColor={BRAND}
          />
        </div>

        <PeriodSummary
          data={{
            ventasPropias: totalVentasPropias,
            ingresoMarcasAliadas: totalIngresoMarcas,
            totalCostoProductos,
            totalCostosAdicionales,
            totalGastos,
            gananciaNeta: gananciaPeriodo
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            className="bg-white rounded-xl p-6"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
          >
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">Ingresos Reales vs Gastos</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tu dinero real (propias + comisión 10%)</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" style={{ fontSize: '12px' }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: '12px' }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="ventasPropias" stroke="#059669" strokeWidth={2} name="Ventas Propias" />
                <Line type="monotone" dataKey="ingresoMarcasAliadas" stroke={BRAND} strokeWidth={2} name="Comisión 10%" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            className="bg-white rounded-xl p-6"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
          >
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">Ganancia Neta</h3>
              <p className="text-xs text-gray-500 mt-0.5">Utilidad después de gastos (calculada correctamente)</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" style={{ fontSize: '12px' }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: '12px' }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value) => `${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="ganancia" fill={BRAND} name="Ganancia" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TopProductos productos={topProductos} periodoActual={periodoActual} />
      </>
    );
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Negocio</h1>
        <p className="text-gray-500 mt-1 text-sm">Análisis detallado con ingresos reales (marcas aliadas corregidas)</p>
      </div>

      <PeriodSelector onPeriodChange={cargarEstadisticas} />

      {renderContent()}
    </div>
  );
};

export default Estadisticas;