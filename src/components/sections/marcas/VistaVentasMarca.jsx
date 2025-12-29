// src/components/sections/marcas/VistaVentasMarca.jsx
import React, { useState } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, ShoppingCart, Package, Calendar, User, Eye, AlertCircle } from 'lucide-react';

export const VistaVentasMarca = ({ marcasAliadas }) => {
  const { marcaSeleccionada, ventasMarca, estadisticasMarca, productosMasVendidos, cargando } = marcasAliadas;
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  if (!marcaSeleccionada) return null;

  if (cargando) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-500 mt-4">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => marcasAliadas.handleCancelar()}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800">
            Ventas de {marcaSeleccionada.nombre}
          </h2>
          <p className="text-gray-600 mt-1">Análisis detallado de ventas y comisiones</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={24} className="opacity-80" />
            <span className="text-xs opacity-80 uppercase font-semibold">Total Ventas</span>
          </div>
          <div className="text-3xl font-bold">{estadisticasMarca?.total_ventas || 0}</div>
          <div className="text-sm opacity-80 mt-1">Transacciones realizadas</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs opacity-80 uppercase font-semibold">Total Vendido</span>
          </div>
          <div className="text-3xl font-bold">
            ${(estadisticasMarca?.total_vendido || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm opacity-80 mt-1">Ingresos brutos pagados</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="opacity-80" />
            <span className="text-xs opacity-80 uppercase font-semibold">Comisión Marca</span>
          </div>
          <div className="text-3xl font-bold">
            ${(estadisticasMarca?.total_comision_marca || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm opacity-80 mt-1">
            {marcaSeleccionada.porcentaje_comision}% del total pagado
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs opacity-80 uppercase font-semibold">Ganancia Tienda</span>
          </div>
          <div className="text-3xl font-bold">
            ${(estadisticasMarca?.total_ganancia_tienda || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm opacity-80 mt-1">
            {100 - marcaSeleccionada.porcentaje_comision}% del total pagado
          </div>
        </div>
      </div>

      {/* Productos más vendidos */}
      {productosMasVendidos && productosMasVendidos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-8 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Package size={24} className="text-purple-600 mr-2" />
            Top 5 Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {productosMasVendidos.map((producto, index) => (
              <div key={producto.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{producto.nombre}</div>
                    <div className="text-sm text-gray-500">Ref: {producto.referencia}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{(producto.total_vendido || 0).toFixed(1)} unidades</div>
                  <div className="text-sm text-green-600">${(producto.total_ingresos || 0).toFixed(2)} vendidos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de ventas */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <ShoppingCart size={24} className="text-purple-600 mr-2" />
            Historial de Ventas ({ventasMarca.length})
          </h3>
        </div>

        {ventasMarca.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hay ventas registradas</p>
            <p className="text-gray-400 text-sm mt-2">Las ventas aparecerán aquí cuando se realicen</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Número Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Estado Pago
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Total Venta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Comisión Marca
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Ganancia Tienda
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventasMarca.map((venta) => {
                  const porcentajePagado = venta.porcentaje_pagado || 0;
                  const isParcial = porcentajePagado > 0 && porcentajePagado < 100;
                  const isPendiente = porcentajePagado === 0;

                  return (
                    <tr key={venta.venta_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-800">
                          {venta.numero_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(venta.fecha).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-800">
                            {venta.cliente_nombre || 'Cliente General'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={venta.productos}>
                          {venta.productos}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isPendiente ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} className="mr-1" />
                            Pendiente
                          </span>
                        ) : isParcial ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {porcentajePagado.toFixed(0)}% pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Pagado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-800">
                          ${(venta.total_venta_pagado || 0).toFixed(2)}
                        </div>
                        {(venta.total_venta_total || venta.total_venta) !== (venta.total_venta_pagado || 0) && (
                          <div className="text-xs text-gray-500">
                            de ${(venta.total_venta_total || venta.total_venta || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-purple-600">
                          ${(venta.comision_marca_pagado || 0).toFixed(2)}
                        </div>
                        {(venta.comision_marca_total || venta.comision_marca) !== (venta.comision_marca_pagado || 0) && (
                          <div className="text-xs text-gray-500">
                            de ${(venta.comision_marca_total || venta.comision_marca || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-teal-600">
                          ${(venta.ganancia_tienda_pagado || 0).toFixed(2)}
                        </div>
                        {(venta.ganancia_tienda_total || venta.ganancia_tienda) !== (venta.ganancia_tienda_pagado || 0) && (
                          <div className="text-xs text-gray-500">
                            de ${(venta.ganancia_tienda_total || venta.ganancia_tienda || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setVentaSeleccionada(venta)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles de venta */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Detalles de Venta {ventaSeleccionada.numero_venta}
              </h3>
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Fecha</div>
                  <div className="font-medium">
                    {new Date(ventaSeleccionada.fecha).toLocaleString('es-ES')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Cliente</div>
                  <div className="font-medium">
                    {ventaSeleccionada.cliente_nombre || 'Cliente General'}
                  </div>
                </div>
              </div>

              {/* Estado de pago */}
              {ventaSeleccionada.saldo_pendiente > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                    <AlertCircle size={20} />
                    <span className="font-semibold">Pago Parcial</span>
                  </div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>Monto pagado: ${(ventaSeleccionada.monto_pagado || 0).toFixed(2)}</div>
                    <div>Total venta: ${(ventaSeleccionada.total || 0).toFixed(2)}</div>
                    <div className="font-semibold">Saldo pendiente: ${(ventaSeleccionada.saldo_pendiente || 0).toFixed(2)}</div>
                    <div className="text-xs mt-2">
                      Las comisiones mostradas son proporcionales al {(ventaSeleccionada.porcentaje_pagado || 0).toFixed(1)}% pagado
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Productos</div>
                <div className="text-sm text-gray-600">{ventaSeleccionada.productos}</div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Total de productos de marca</div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monto total:</span>
                    <span className="font-bold text-gray-800">
                      ${(ventaSeleccionada.total_venta_total || ventaSeleccionada.total_venta || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-green-600 text-sm">Monto pagado:</span>
                    <span className="font-bold text-green-600">
                      ${(ventaSeleccionada.total_venta_pagado || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-purple-600">Comisión {marcaSeleccionada.nombre} ({marcaSeleccionada.porcentaje_comision}%):</span>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">
                      ${(ventaSeleccionada.comision_marca_pagado || 0).toFixed(2)}
                    </div>
                    {(ventaSeleccionada.comision_marca_total || ventaSeleccionada.comision_marca) !== (ventaSeleccionada.comision_marca_pagado || 0) && (
                      <div className="text-xs text-gray-500">
                        de ${(ventaSeleccionada.comision_marca_total || ventaSeleccionada.comision_marca || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-teal-600">Ganancia Tienda ({100 - marcaSeleccionada.porcentaje_comision}%):</span>
                  <div className="text-right">
                    <div className="font-bold text-teal-600">
                      ${(ventaSeleccionada.ganancia_tienda_pagado || 0).toFixed(2)}
                    </div>
                    {(ventaSeleccionada.ganancia_tienda_total || ventaSeleccionada.ganancia_tienda) !== (ventaSeleccionada.ganancia_tienda_pagado || 0) && (
                      <div className="text-xs text-gray-500">
                        de ${(ventaSeleccionada.ganancia_tienda_total || ventaSeleccionada.ganancia_tienda || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};