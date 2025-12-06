// src/components/sections/Gastos.jsx
import React from 'react';
import { Search, Plus, Edit, Trash2, X, Calendar, DollarSign, Tag, FileText, CreditCard, Building, Download, CalendarRange, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { useGastos } from '../../api/useGastos';
import { Notificacion } from '../common/Notificacion';

const Gastos = () => {
  const gastos = useGastos();

  return (
    <div className="flex h-full bg-gray-50">
      {/* Contenido principal */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Registro de Gastos</h2>
          <p className="text-gray-500 mt-1">Administra y registra todos los gastos de tu negocio.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Historial de Gastos</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={gastos.exportarGastosExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                  <Download size={18} />
                  <span>Exportar Excel</span>
                </button>
                <button
                  onClick={() => gastos.setShowModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
                >
                  <Plus size={18} />
                  <span>Añadir Gasto</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Búsqueda por texto */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar gasto..."
                    value={gastos.searchTerm}
                    onChange={(e) => gastos.setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Filtro por rango de fechas */}
              <div className="flex items-center space-x-3">
                <CalendarRange size={20} className="text-gray-400" />
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="date"
                    value={gastos.fechaInicio}
                    onChange={(e) => gastos.setFechaInicio(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Desde"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="date"
                    value={gastos.fechaFin}
                    onChange={(e) => gastos.setFechaFin(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Hasta"
                  />
                  {(gastos.fechaInicio || gastos.fechaFin) && (
                    <button
                      onClick={gastos.limpiarFiltrosFecha}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros rápidos de fecha */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filtros rápidos:</span>
                <button
                  onClick={() => {
                    const hoy = new Date();
                    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    gastos.setFechaInicio(inicio.toISOString().split('T')[0]);
                    gastos.setFechaFin(hoy.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-xs bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition"
                >
                  Este mes
                </button>
                <button
                  onClick={() => {
                    const hoy = new Date();
                    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                    gastos.setFechaInicio(inicioMesAnterior.toISOString().split('T')[0]);
                    gastos.setFechaFin(finMesAnterior.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
                >
                  Mes anterior
                </button>
                <button
                  onClick={() => {
                    const hoy = new Date();
                    const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
                    gastos.setFechaInicio(hace30dias.toISOString().split('T')[0]);
                    gastos.setFechaFin(hoy.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                >
                  Últimos 30 días
                </button>
              </div>

              {/* Indicador de resultados filtrados */}
              {(gastos.fechaInicio || gastos.fechaFin) && (
                <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
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

          <div className="overflow-x-auto">
            {gastos.loading ? (
              <div className="p-8 text-center text-gray-500">Cargando gastos...</div>
            ) : gastos.gastosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No hay gastos registrados</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gastos.gastosFiltrados.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {gastos.formatDate(gasto.fecha)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <div>{gasto.descripcion}</div>
                        {gasto.proveedor && (
                          <div className="text-xs text-gray-500 mt-1">Proveedor: {gasto.proveedor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${gastos.getCategoriaColor(gasto.categoria)}`}>
                          {gasto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{gasto.metodo_pago}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ${parseFloat(gasto.monto).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => gastos.handleEdit(gasto)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => gastos.handleDelete(gasto.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Trash2 size={18} className="text-gray-600" />
                          </button>
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

      {/* Sidebar derecho */}
      <div className="w-96 bg-white border-l p-6 overflow-auto">
        {/* Gráfica de dona */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Gastos por Categoría</h3>
          <div className="relative">
            <svg viewBox="0 0 200 200" className="w-full h-64">
              {gastos.estadisticas.length > 0 ? (
                (() => {
                  const totalGeneral = gastos.estadisticas.reduce((acc, item) => acc + item.total, 0);
                  let acumulado = 0;
                  const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#F59E0B", "#6366F1"];

                  return gastos.estadisticas.map((item, index) => {
                    const porcentaje = (item.total / totalGeneral) * 440;
                    const dasharray = `${porcentaje} ${440 - porcentaje}`;
                    const dashoffset = -acumulado;
                    acumulado += porcentaje;

                    return (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="70"
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

          {/* Leyenda */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {gastos.estadisticas.map((item, index) => {
              const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-orange-500", "bg-indigo-500"];
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <span className="text-sm text-gray-600">{item.categoria} (${item.total.toFixed(2)})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Métricas del mes */}
        <div className="mb-8 space-y-3">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Métricas del Mes</h3>

          {/* Gasto más alto */}
          {(() => {
            const gastoMasAlto = gastos.getGastoMasAlto();
            return gastoMasAlto ? (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-red-700">Gasto Más Alto</span>
                  <Target size={16} className="text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-700">${parseFloat(gastoMasAlto.monto).toFixed(2)}</div>
                <div className="text-xs text-red-600 mt-1 truncate">{gastoMasAlto.descripcion}</div>
              </div>
            ) : null;
          })()}

          {/* Gasto promedio por día */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">Promedio por Día</span>
              <Activity size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              ${gastos.getGastoPromedioPorDia().toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 mt-1">Del mes actual</div>
          </div>

          {/* Proyección mensual */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">Proyección Mensual</span>
              <TrendingUp size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">
              ${gastos.getProyeccionMensual().toFixed(2)}
            </div>
            <div className="text-xs text-purple-600 mt-1">Estimado al final del mes</div>
          </div>

          {/* Comparación con mes anterior */}
          {(() => {
            const comparacion = gastos.getComparacionMesAnterior();
            if (!comparacion) return null;

            return (
              <div className={`bg-gradient-to-br ${comparacion.esAumento
                  ? 'from-orange-50 to-orange-100 border-orange-200'
                  : 'from-green-50 to-green-100 border-green-200'
                } rounded-lg p-4 border`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${comparacion.esAumento ? 'text-orange-700' : 'text-green-700'
                    }`}>
                    vs Mes Anterior
                  </span>
                  {comparacion.esAumento ? (
                    <TrendingUp size={16} className="text-orange-600" />
                  ) : (
                    <TrendingDown size={16} className="text-green-600" />
                  )}
                </div>
                <div className={`text-2xl font-bold ${comparacion.esAumento ? 'text-orange-700' : 'text-green-700'
                  }`}>
                  {comparacion.esAumento ? '+' : ''}{comparacion.porcentaje.toFixed(1)}%
                </div>
                <div className={`text-xs mt-1 ${comparacion.esAumento ? 'text-orange-600' : 'text-green-600'
                  }`}>
                  ${comparacion.totalActual.toFixed(2)} vs ${comparacion.totalAnterior.toFixed(2)}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Filtros por categoría */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filtrar por Categoría</h3>
          <div className="space-y-2">
            {gastos.categorias.map((categoria, index) => (
              <button
                key={index}
                onClick={() => gastos.setSelectedCategory(categoria.nombre)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${gastos.selectedCategory === categoria.nombre
                  ? 'bg-teal-50 text-teal-600'
                  : 'hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <span className={`font-medium ${categoria.color}`}>{categoria.nombre}</span>
                <span className={`text-sm font-bold ${gastos.selectedCategory === categoria.nombre ? 'text-teal-600' : 'text-gray-400'
                  }`}>
                  {gastos.getCategoriaCount(categoria.nombre)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700">Total de Gastos</span>
            <span className="text-2xl font-bold text-red-600">${gastos.totalGastos.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {gastos.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {gastos.editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h3>
              <button
                onClick={() => {
                  gastos.setShowModal(false);
                  gastos.resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} />
                    <span>Fecha *</span>
                  </label>
                  <input
                    type="date"
                    value={gastos.formData.fecha}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, fecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag size={16} />
                    <span>Categoría *</span>
                  </label>
                  <select
                    value={gastos.formData.categoria}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {gastos.categorias.slice(1).map((cat) => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} />
                  <span>Descripción *</span>
                </label>
                <input
                  type="text"
                  value={gastos.formData.descripcion}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Compra de telas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign size={16} />
                    <span>Monto *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gastos.formData.monto}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, monto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <CreditCard size={16} />
                    <span>Método de Pago *</span>
                  </label>
                  <select
                    value={gastos.formData.metodo_pago}
                    onChange={(e) => gastos.setFormData({ ...gastos.formData, metodo_pago: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {gastos.metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>{metodo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} />
                  <span>Proveedor (opcional)</span>
                </label>
                <input
                  type="text"
                  value={gastos.formData.proveedor}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, proveedor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} />
                  <span>Notas (opcional)</span>
                </label>
                <textarea
                  value={gastos.formData.notas}
                  onChange={(e) => gastos.setFormData({ ...gastos.formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows="3"
                  placeholder="Información adicional..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    gastos.setShowModal(false);
                    gastos.resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={gastos.handleSubmit}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
                >
                  {gastos.editingGasto ? 'Actualizar' : 'Guardar'}
                </button>
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
    </div>

  );
};

export default Gastos;