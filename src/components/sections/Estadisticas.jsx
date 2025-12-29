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
  ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { ipcRenderer } = window.require('electron');

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
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Período de Análisis</h3>
        <p className="text-sm text-gray-500">Selecciona un rango de fechas o usa los filtros rápidos</p>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2 flex-1">
          <Calendar className="text-gray-400" size={20} />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value);
              setPeriodoSeleccionado('personalizado');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <span className="text-gray-400">—</span>

        <div className="flex items-center space-x-2 flex-1">
          <Calendar className="text-gray-400" size={20} />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => {
              setFechaFin(e.target.value);
              setPeriodoSeleccionado('personalizado');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={aplicarFechasPersonalizadas}
          disabled={!fechaInicio || !fechaFin}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Aplicar
        </button>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-3 font-medium">Filtros rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'este_mes', label: 'Este mes' },
            { id: 'mes_anterior', label: 'Mes anterior' },
            { id: 'ultimos_30_dias', label: 'Últimos 30 días' },
            { id: 'ultimos_3_meses', label: 'Últimos 3 meses' },
            { id: 'ultimos_6_meses', label: 'Últimos 6 meses' },
            { id: 'este_ano', label: 'Este año' }
          ].map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => aplicarFiltroRapido(filtro.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                periodoSeleccionado === filtro.id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Estadística
// ============================================
const StatCard = ({ title, value, icon: Icon, trend, subtitle, bgColor = 'bg-white', iconBg = 'bg-blue-100', iconColor = 'text-blue-600' }) => (
  <div className={`${bgColor} rounded-xl shadow-sm border p-6`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="text-sm font-medium text-gray-500 uppercase mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
      <div className={`p-3 ${iconBg} rounded-lg`}>
        <Icon className={iconColor} size={24} />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`text-sm font-medium flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {Math.abs(trend)}% {subtitle || 'vs período anterior'}
      </div>
    )}
    {!trend && subtitle && (
      <div className="text-sm text-gray-500">{subtitle}</div>
    )}
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

  const ingresosReales = ventasPropias + ingresoMarcasAliadas;

  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border p-6 mb-8">
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Calendar className="text-teal-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Resumen del Período - Ingresos Reales</h3>
            <p className="text-sm text-gray-600">Solo tu dinero (sin el 90% de marcas aliadas)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="text-center bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 uppercase mb-1">Ventas Propias</div>
          <div className="text-lg font-bold text-green-600">
            ${ventasPropias.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 uppercase mb-1">Comisión 10%</div>
          <div className="text-lg font-bold text-teal-600">
            +${ingresoMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 uppercase mb-1">Costo Productos</div>
          <div className="text-lg font-bold text-orange-600">
            -${totalCostoProductos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 uppercase mb-1">Costos Extras</div>
          <div className="text-lg font-bold text-amber-600">
            -${totalCostosAdicionales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 uppercase mb-1">Gastos</div>
          <div className="text-lg font-bold text-red-600">
            -${totalGastos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-3 shadow-sm border-2 border-blue-300">
          <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Ganancia Neta</div>
          <div className={`text-lg font-bold ${gananciaNeta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {gananciaNeta >= 0 ? '$' : '-$'}
            {Math.abs(gananciaNeta).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Top Productos
// ============================================
const TopProductos = ({ productos }) => {
  const colores = [
    { bg: 'bg-yellow-100', bar: 'bg-yellow-500', text: 'text-yellow-700', icon: '🥇' },
    { bg: 'bg-gray-100', bar: 'bg-gray-400', text: 'text-gray-600', icon: '🥈' },
    { bg: 'bg-orange-100', bar: 'bg-orange-400', text: 'text-orange-600', icon: '🥉' },
    { bg: 'bg-blue-50', bar: 'bg-blue-400', text: 'text-blue-600', icon: '4️⃣' },
    { bg: 'bg-purple-50', bar: 'bg-purple-400', text: 'text-purple-600', icon: '5️⃣' }
  ];

  if (!productos || productos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Productos Más Vendidos</h3>
        <div className="text-center py-8 text-gray-400">No hay datos de productos vendidos en este período</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">Top 5 Productos Propios Más Vendidos</h3>
        <p className="text-sm text-gray-500">Basado en cantidad vendida en el período seleccionado</p>
      </div>

      <div className="space-y-4">
        {productos.map((producto, index) => {
          const porcentaje = productos[0].cantidad > 0 ? (producto.cantidad / productos[0].cantidad) * 100 : 0;
          const color = colores[index];

          return (
            <div key={index} className={`${color.bg} rounded-lg p-4 transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{color.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{producto.nombre}</h4>
                    <p className="text-xs text-gray-500">Código: {producto.codigo || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${color.text}`}>{producto.cantidad}</div>
                  <div className="text-xs text-gray-500">unidades</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className={`${color.bar} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Ingresos: <span className="font-semibold text-green-600">
                    ${producto.total_ventas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </span>
                <span className="text-gray-500">{porcentaje.toFixed(1)}% del líder</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

  const cargarEstadisticas = async (periodo) => {
    if (!periodo || !periodo.inicio || !periodo.fin) {
      console.error('Período inválido:', periodo);
      return;
    }

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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Estadísticas del Negocio</h1>
          <p className="text-gray-500 mt-2">Análisis detallado de ventas, gastos y ganancias</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Cargando estadísticas...</div>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <strong>Nota:</strong> Los gastos con categoría "Inventario" o "Proveedores" NO se incluyen en el cálculo de ganancia neta.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatCard
            title="Facturación Total"
            value={`$${estadisticas.ventasTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            trend={parseFloat(cambioVentas)}
            subtitle="Propias + Marcas (referencial)"
            iconBg="bg-gray-100"
            iconColor="text-gray-600"
          />
          <StatCard
            title="Ingresos Reales"
            value={`$${estadisticas.ingresosReales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            subtitle="Tu dinero real (propias + 10%)"
            bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
            iconBg="bg-green-200"
            iconColor="text-green-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Ventas Propias"
            value={`$${estadisticas.ventasPropias.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={ShoppingBag}
            subtitle="Productos de tu tienda"
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Ventas Marcas Aliadas"
            value={`$${estadisticas.ventasMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Handshake}
            subtitle="Monto total (referencial)"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Tu Comisión (10%)"
            value={`$${estadisticas.ingresoMarcasAliadas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            subtitle="Tu ingreso de marcas"
            bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
            iconBg="bg-teal-200"
            iconColor="text-teal-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Costo Productos Propios"
            value={`$${estadisticas.costoProductosVendidos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Package}
            subtitle="Solo tus productos"
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
          <StatCard
            title="Gastos Operativos"
            value={`$${estadisticas.gastosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={TrendingDown}
            subtitle="Sin inventario"
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
          <StatCard
            title="Inversión Inventario"
            value={`$${estadisticas.gastosInventario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={Package}
            subtitle="No afecta ganancia neta"
            bgColor="bg-gradient-to-br from-indigo-50 to-purple-50"
            iconBg="bg-indigo-200"
            iconColor="text-indigo-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ganancia Bruta"
            value={`$${estadisticas.gananciaBruta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={PiggyBank}
            subtitle="Ingresos - Costos"
            bgColor="bg-gradient-to-br from-blue-50 to-cyan-50"
            iconBg="bg-blue-200"
            iconColor="text-blue-700"
          />
          <StatCard
            title="Margen Bruto"
            value={`${estadisticas.margenBruto.toFixed(1)}%`}
            icon={BarChart3}
            subtitle="Antes de gastos"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Ganancia Neta"
            value={`$${estadisticas.gananciaNeta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            subtitle="✓ Ya incluye marcas"
            bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
            iconBg="bg-green-200"
            iconColor="text-green-700"
          />
          <StatCard
            title="Margen Neto"
            value={`${estadisticas.margenNeto.toFixed(1)}%`}
            icon={BarChart3}
            subtitle="Real sobre ingresos"
            bgColor="bg-gradient-to-br from-emerald-50 to-teal-50"
            iconBg="bg-emerald-200"
            iconColor="text-emerald-700"
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Ingresos Reales vs Gastos</h3>
              <p className="text-sm text-gray-500">Tu dinero real (propias + comisión 10%)</p>
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
                <Line type="monotone" dataKey="ventasPropias" stroke="#10b981" strokeWidth={2} name="Ventas Propias" />
                <Line type="monotone" dataKey="ingresoMarcasAliadas" stroke="#14b8a6" strokeWidth={2} name="Comisión 10%" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Ganancia Neta</h3>
              <p className="text-sm text-gray-500">Utilidad después de gastos (calculada correctamente)</p>
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
                <Bar dataKey="ganancia" fill="#3b82f6" name="Ganancia" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TopProductos productos={topProductos} />
      </>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Estadísticas del Negocio</h1>
        <p className="text-gray-500 mt-2">Análisis detallado con ingresos reales (marcas aliadas corregidas)</p>
      </div>

      <PeriodSelector onPeriodChange={cargarEstadisticas} />

      {renderContent()}
    </div>
  );
};

export default Estadisticas;