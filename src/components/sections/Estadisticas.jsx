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
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { ipcRenderer } = window.require('electron');

const Estadisticas = () => {
  const [estadisticas, setEstadisticas] = useState({
    ventasTotales: 0,
    ventasMesAnterior: 0,
    gastosTotales: 0,
    gastosMesAnterior: 0,
    gastosInventario: 0,
    gastosInventarioMesAnterior: 0,
    costoProductosVendidos: 0,
    costosAdicionales: 0,
    gananciaBruta: 0,
    gananciaNeta: 0
  });

  const [datosGrafica, setDatosGrafica] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas básicas
      const datos = await ipcRenderer.invoke('obtener-dashboard-stats');
      setEstadisticas(datos.estadisticas);

      // Cargar datos para las gráficas
      const grafica = await ipcRenderer.invoke('obtener-datos-grafica');
      setDatosGrafica(grafica || []);

      // Cargar top productos más vendidos
      const productos = await ipcRenderer.invoke('obtener-top-productos');
      setTopProductos(productos || []);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return 0;
    return (((actual - anterior) / anterior) * 100).toFixed(2);
  };

  const calcularMargenBruto = () => {
    if (estadisticas.ventasTotales === 0) return 0;
    return (estadisticas.gananciaBruta / estadisticas.ventasTotales) * 100;
  };

  const calcularMargenNeto = () => {
    if (estadisticas.ventasTotales === 0) return 0;
    return (estadisticas.gananciaNeta / estadisticas.ventasTotales) * 100;
  };

  const cambioVentas = calcularCambio(estadisticas.ventasTotales, estadisticas.ventasMesAnterior);
  const cambioGastos = calcularCambio(estadisticas.gastosTotales, estadisticas.gastosMesAnterior);
  const margenBruto = calcularMargenBruto();
  const margenNeto = calcularMargenNeto();
  const costoTotalVentas = estadisticas.costoProductosVendidos + estadisticas.costosAdicionales;

  // Calcular totales de los últimos 6 meses
  const totalVentas6Meses = datosGrafica.reduce((sum, item) => sum + (item.ventas || 0), 0);
  const totalCostoProductos6Meses = datosGrafica.reduce((sum, item) => sum + (item.costoProductos || 0), 0);
  const totalCostosAdicionales6Meses = datosGrafica.reduce((sum, item) => sum + (item.costosAdicionales || 0), 0);
  const totalGastos6Meses = datosGrafica.reduce((sum, item) => sum + (item.gastos || 0), 0);
  const ganancia6Meses = totalVentas6Meses - totalCostoProductos6Meses - totalCostosAdicionales6Meses - totalGastos6Meses;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Estadísticas del Negocio</h1>
        <p className="text-gray-500 mt-2">Análisis detallado de ventas, gastos y ganancias</p>
      </div>

      {/* ALERTA INFORMATIVA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <strong>Nota:</strong> Los gastos con categoría "Inventario" o "Proveedores" NO se incluyen en el cálculo de ganancia neta.
          Solo se cuentan los gastos operativos (arriendo, servicios, publicidad, etc.).
        </div>
      </div>

      {/* Tarjetas de resumen del mes actual - FILA 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Ventas del Mes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Ventas del Mes
              </div>
              <div className="text-2xl font-bold text-gray-800">
                ${estadisticas.ventasTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <div className={`text-sm font-medium flex items-center ${
            cambioVentas >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {cambioVentas >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(cambioVentas)}% vs mes anterior
          </div>
        </div>

        {/* Costo Total de Ventas */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Costo Total Ventas
              </div>
              <div className="text-2xl font-bold text-gray-800">
                ${costoTotalVentas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Productos + Adicionales
          </div>
        </div>

        {/* Gastos Operativos del Mes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Gastos Operativos
              </div>
              <div className="text-2xl font-bold text-gray-800">
                ${estadisticas.gastosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          <div className={`text-sm font-medium flex items-center ${
            cambioGastos >= 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {cambioGastos >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(cambioGastos)}% vs mes anterior
          </div>
        </div>

        {/* Inversión en Inventario */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-indigo-700 uppercase mb-1">
                Inversión Inventario
              </div>
              <div className="text-2xl font-bold text-indigo-700">
                ${estadisticas.gastosInventario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-indigo-200 rounded-lg">
              <Package className="text-indigo-700" size={24} />
            </div>
          </div>
          <div className="text-xs text-indigo-600 font-medium">
            No afecta ganancia neta
          </div>
        </div>
      </div>

      {/* FILA 2 - Ganancias y Márgenes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Ganancia Bruta */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          estadisticas.gananciaBruta >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-orange-50 to-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Ganancia Bruta
              </div>
              <div className={`text-2xl font-bold ${
                estadisticas.gananciaBruta >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {estadisticas.gananciaBruta >= 0 ? '$' : '-$'}
                {Math.abs(estadisticas.gananciaBruta).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${
              estadisticas.gananciaBruta >= 0 ? 'bg-blue-200' : 'bg-orange-200'
            }`}>
              <PiggyBank className={estadisticas.gananciaBruta >= 0 ? 'text-blue-700' : 'text-orange-700'} size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Ventas - Costos
          </div>
        </div>

        {/* Margen Bruto % */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Margen Bruto
              </div>
              <div className={`text-2xl font-bold ${
                margenBruto >= 30 ? 'text-blue-600' : margenBruto >= 15 ? 'text-yellow-600' : 'text-orange-600'
              }`}>
                {margenBruto.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Antes de gastos
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          estadisticas.gananciaNeta >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-rose-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Ganancia Neta
              </div>
              <div className={`text-2xl font-bold ${
                estadisticas.gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {estadisticas.gananciaNeta >= 0 ? '$' : '-$'}
                {Math.abs(estadisticas.gananciaNeta).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${
              estadisticas.gananciaNeta >= 0 ? 'bg-green-200' : 'bg-red-200'
            }`}>
              <DollarSign className={estadisticas.gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'} size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {estadisticas.gananciaNeta >= 0 ? '✓ Resultado positivo' : '⚠ Resultado negativo'}
          </div>
        </div>

        {/* Margen Neto % */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Margen Neto
              </div>
              <div className={`text-2xl font-bold ${
                margenNeto >= 20 ? 'text-green-600' : margenNeto >= 10 ? 'text-yellow-600' : margenNeto >= 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {margenNeto.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Después de gastos
          </div>
        </div>
      </div>

      {/* Resumen de últimos 6 meses */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border p-6 mb-8">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Calendar className="text-teal-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Resumen últimos 6 meses</h3>
              <p className="text-sm text-gray-600">Análisis del período completo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-500 uppercase mb-1">Ventas</div>
            <div className="text-lg font-bold text-green-600">
              ${totalVentas6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-500 uppercase mb-1">Costos Productos</div>
            <div className="text-lg font-bold text-orange-600">
              -${totalCostoProductos6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-500 uppercase mb-1">Costos Adicionales</div>
            <div className="text-lg font-bold text-orange-600">
              -${totalCostosAdicionales6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-center bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-500 uppercase mb-1">Gastos Operativos</div>
            <div className="text-lg font-bold text-red-600">
              -${totalGastos6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-3 shadow-sm border-2 border-blue-300">
            <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Ganancia Neta</div>
            <div className={`text-lg font-bold ${ganancia6Meses >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {ganancia6Meses >= 0 ? '$' : '-$'}
              {Math.abs(ganancia6Meses).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfica de Líneas: Ventas vs Gastos */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Ventas vs Gastos Operativos</h3>
            <p className="text-sm text-gray-500">Comparación mensual (sin incluir compras de inventario)</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                style={{ fontSize: '12px' }}
                stroke="#94a3b8"
              />
              <YAxis
                style={{ fontSize: '12px' }}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="#10b981"
                strokeWidth={3}
                name="Ventas"
                dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="gastos"
                stroke="#ef4444"
                strokeWidth={3}
                name="Gastos Operativos"
                dot={{ fill: '#ef4444', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de Barras: Ganancia por Mes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Ganancia Neta Mensual</h3>
            <p className="text-sm text-gray-500">Utilidad después de gastos operativos</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                style={{ fontSize: '12px' }}
                stroke="#94a3b8"
              />
              <YAxis
                style={{ fontSize: '12px' }}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar
                dataKey="ganancia"
                fill="#3b82f6"
                name="Ganancia"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Productos Más Vendidos */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800">Top 5 Productos Más Vendidos</h3>
          <p className="text-sm text-gray-500">Basado en cantidad vendida en los últimos 6 meses</p>
        </div>

        {topProductos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay datos de productos vendidos
          </div>
        ) : (
          <div className="space-y-4">
            {topProductos.map((producto, index) => {
              const porcentaje = topProductos[0].cantidad > 0
                ? (producto.cantidad / topProductos[0].cantidad) * 100
                : 0;

              const colores = [
                { bg: 'bg-yellow-100', bar: 'bg-yellow-500', text: 'text-yellow-700', icon: '🥇' },
                { bg: 'bg-gray-100', bar: 'bg-gray-400', text: 'text-gray-600', icon: '🥈' },
                { bg: 'bg-orange-100', bar: 'bg-orange-400', text: 'text-orange-600', icon: '🥉' },
                { bg: 'bg-blue-50', bar: 'bg-blue-400', text: 'text-blue-600', icon: '4️⃣' },
                { bg: 'bg-purple-50', bar: 'bg-purple-400', text: 'text-purple-600', icon: '5️⃣' }
              ];

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
                      <div className={`text-2xl font-bold ${color.text}`}>
                        {producto.cantidad}
                      </div>
                      <div className="text-xs text-gray-500">unidades</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className={`${color.bar} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Ingresos: <span className="font-semibold text-green-600">
                        ${producto.total_ventas.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                    <span className="text-gray-500">
                      {porcentaje.toFixed(1)}% del líder
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Estadisticas;