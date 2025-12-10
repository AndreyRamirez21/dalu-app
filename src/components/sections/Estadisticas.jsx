import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { ipcRenderer } = window.require('electron');

const Estadisticas = () => {
  const [estadisticas, setEstadisticas] = useState({
    ventasTotales: 0,
    ventasMesAnterior: 0,
    gastosTotales: 0,
    gastosMesAnterior: 0
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

  const calcularGananciaNeta = () => {
    return estadisticas.ventasTotales - estadisticas.gastosTotales;
  };

  const cambioVentas = calcularCambio(estadisticas.ventasTotales, estadisticas.ventasMesAnterior);
  const cambioGastos = calcularCambio(estadisticas.gastosTotales, estadisticas.gastosMesAnterior);
  const gananciaNeta = calcularGananciaNeta();

  // Calcular totales de los últimos 6 meses
  const totalVentas6Meses = datosGrafica.reduce((sum, item) => sum + (item.ventas || 0), 0);
  const totalGastos6Meses = datosGrafica.reduce((sum, item) => sum + (item.gastos || 0), 0);
  const ganancia6Meses = totalVentas6Meses - totalGastos6Meses;

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

      {/* Tarjetas de resumen del mes actual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Gastos del Mes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Gastos del Mes
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

        {/* Ganancia Neta del Mes */}
        <div className={`rounded-xl shadow-sm border p-6 ${
          gananciaNeta >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-rose-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Ganancia del Mes
              </div>
              <div className={`text-2xl font-bold ${
                gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                ${Math.abs(gananciaNeta).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${
              gananciaNeta >= 0 ? 'bg-green-200' : 'bg-red-200'
            }`}>
              <DollarSign className={gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'} size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {gananciaNeta >= 0 ? '✓ Resultado positivo' : '⚠ Resultado negativo'}
          </div>
        </div>

        {/* Margen de Ganancia */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Margen del Mes
              </div>
              <div className={`text-2xl font-bold ${
                gananciaNeta >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {estadisticas.ventasTotales > 0
                  ? ((gananciaNeta / estadisticas.ventasTotales) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Rentabilidad
          </div>
        </div>
      </div>

      {/* Resumen de últimos 6 meses */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Calendar className="text-teal-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Resumen últimos 6 meses</h3>
              <p className="text-sm text-gray-600">Análisis del período completo</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Ventas</div>
              <div className="text-xl font-bold text-green-600">
                ${totalVentas6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Gastos</div>
              <div className="text-xl font-bold text-red-600">
                ${totalGastos6Meses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase mb-1">Ganancia Neta</div>
              <div className={`text-xl font-bold ${ganancia6Meses >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ${Math.abs(ganancia6Meses).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfica de Líneas: Ventas vs Gastos */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Ventas vs Gastos</h3>
            <p className="text-sm text-gray-500">Comparación mensual de ingresos y egresos</p>
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
                name="Gastos"
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
            <p className="text-sm text-gray-500">Utilidad después de gastos por mes</p>
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