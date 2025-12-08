import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Package,
  ShoppingBag,
  CreditCard,
  Receipt
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

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

  const getTipoColor = (tipo) => {
    const colors = {
      'Venta': 'bg-green-100 text-green-700',
      'Gasto': 'bg-red-100 text-red-700',
      'Inventario': 'bg-blue-100 text-blue-700',
      'Deuda': 'bg-yellow-100 text-yellow-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

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
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Ventas Totales */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Ventas Totales
              </div>
              <div className="text-3xl font-bold text-gray-800">
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
            {cambioVentas >= 0 ? '+' : ''}{cambioVentas}% vs mes anterior
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Gastos Totales
              </div>
              <div className="text-3xl font-bold text-gray-800">
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
            {cambioGastos >= 0 ? '+' : ''}{cambioGastos}% vs mes anterior
          </div>
        </div>

        {/* Deudas por Cobrar */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Deudas por Cobrar
              </div>
              <div className="text-3xl font-bold text-gray-800">
                ${estadisticas.deudasPendientes.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {estadisticas.clientesConDeuda} cliente{estadisticas.clientesConDeuda !== 1 ? 's' : ''} con saldo pendiente
          </div>
        </div>

        {/* Items en Inventario */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-1">
                Items en Inventario
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {estadisticas.itemsInventario}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {estadisticas.productosStockBajo} producto{estadisticas.productosStockBajo !== 1 ? 's' : ''} bajos en stock
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Actividad Reciente</h3>
        </div>
        <div className="overflow-x-auto">
          {actividadReciente.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {actividadReciente.map((actividad, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(actividad.tipo)}`}>
                        {actividad.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{actividad.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold text-lg ${
                        actividad.tipo === 'Venta' || actividad.tipo === 'Deuda'
                          ? 'text-green-600'
                          : actividad.tipo === 'Gasto'
                            ? 'text-red-600'
                            : 'text-blue-600'
                      }`}>
                        {actividad.monto}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-500">
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