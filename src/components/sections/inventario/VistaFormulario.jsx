// src/components/sections/inventario/VistaFormulario.jsx
import React from 'react';
import { X, Save, Plus, Trash2, Package, DollarSign, Edit3 } from 'lucide-react';
import { calcularMargen } from "../../../utils/exportExcel";

export const VistaFormulario = ({ inventario }) => {
  const esEdicion = inventario.vista === 'editar';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {esEdicion ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <p className="text-gray-500 mt-1">
            {esEdicion ? 'Actualiza la información del producto y sus variantes' : 'Completa los datos del nuevo producto y sus tallas'}
          </p>
        </div>
        <button
          onClick={inventario.handleCancelar}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X size={20} />
          <span>Cancelar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-5xl">
        {/* INFORMACIÓN GENERAL */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia del Producto *
              </label>
              <input
                type="text"
                name="referencia"
                value={inventario.formulario.referencia}
                onChange={inventario.handleInputChange}
                placeholder="Ej: DLX-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={inventario.formulario.nombre}
                onChange={inventario.handleInputChange}
                placeholder="Ej: Pijama Nube Premium"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                name="categoria"
                value={inventario.formulario.categoria}
                onChange={inventario.handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {inventario.categorias.filter(c => c !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* IMAGEN DEL PRODUCTO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={inventario.handleImagenChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {inventario.formulario.imagenPreview && (
                <div className="mt-3 flex items-center space-x-4">
                  <img
                    src={inventario.formulario.imagenPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-teal-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={inventario.eliminarImagen}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                  >
                    Eliminar imagen
                  </button>
                </div>
              )}
            </div>

            {/* COSTOS BASE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Base *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="costo_base"
                  value={inventario.formulario.costo_base}
                  onChange={inventario.handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta Base *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="precio_venta_base"
                  value={inventario.formulario.precio_venta_base}
                  onChange={inventario.handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
                    {/* Reemplaza el div del "Precio sugerido" con esto: */}
                    {inventario.formulario.costo_base && parseFloat(inventario.formulario.costo_base) > 0 && (
                      <div className="mt-2 text-sm bg-purple-50 border border-purple-200 rounded px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Precio sugerido:</span>
                            <span className="font-bold text-purple-700">
                              ${inventario.calcularPrecioSugerido().toFixed(2)}
                            </span>

                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Este es el precio recomendado. Puedes ajustarlo según el mercado.
                        </p>
                      </div>
                    )}
            </div>

            {/* MARGEN BASE */}
            {inventario.formulario.costo_base && inventario.formulario.precio_venta_base && (
              <div className="md:col-span-2 bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-800">Margen Base:</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {calcularMargen(parseFloat(inventario.formulario.costo_base), parseFloat(inventario.formulario.precio_venta_base))}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ NUEVO: COSTOS ADICIONALES CON SELECT MEJORADO */}
        <div className="border-t pt-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Costos Adicionales (opcional)</h3>
              <p className="text-sm text-gray-500 mt-1">Agrega gastos extras como empaque, etiquetas, envío, etc.</p>
            </div>
            <button
              onClick={inventario.agregarCostoAdicional}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <Plus size={16} />
              <span>Agregar Costo</span>
            </button>
          </div>

          {inventario.formulario.costos_adicionales.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No hay costos adicionales</p>
              <p className="text-gray-400 text-xs mt-1">Haz clic en "Agregar Costo" para incluir gastos extras</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventario.formulario.costos_adicionales.map((costo, index) => (
                <div key={index} className="bg-gray-50 border rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Concepto</label>
                      {costo.conceptoManual ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={costo.concepto}
                            onChange={(e) => inventario.actualizarCostoAdicional(index, 'concepto', e.target.value)}
                            placeholder="Escribe el concepto..."
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => inventario.actualizarCostoAdicional(index, 'conceptoManual', false)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Volver a seleccionar"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={costo.conceptoManual ? '__MANUAL__' : costo.concepto}
                            onChange={(e) => {
                              if (e.target.value === '__MANUAL__') {
                                inventario.actualizarCostoAdicional(index, 'concepto', '__MANUAL__');
                              } else {
                                inventario.actualizarCostoAdicional(index, 'concepto', e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                          >
                            <option value="">Selecciona un concepto...</option>
                            {inventario.conceptosCostosDisponibles.map(concepto => (
                              <option key={concepto} value={concepto}>{concepto}</option>
                            ))}
                            <option value="__MANUAL__">✏️ Escribir manualmente...</option>
                          </select>
                          <Edit3 size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={costo.monto}
                          onChange={(e) => inventario.actualizarCostoAdicional(index, 'monto', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end justify-end">
                      <button
                        onClick={() => inventario.eliminarCostoAdicional(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar costo"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* TOTAL DE COSTOS ADICIONALES */}
              {inventario.formulario.costos_adicionales.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Total Costos Adicionales:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${inventario.calcularTotalCostosAdicionales().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ✅ ACTUALIZADO: TALLAS / VARIANTES CON SELECT MEJORADO */}
        <div className="border-t pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Tallas / Variantes *</h3>
            <button
              onClick={inventario.agregarVariante}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm"
            >
              <Plus size={16} />
              <span>Agregar Talla</span>
            </button>
          </div>

          {inventario.formulario.variantes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay tallas agregadas</p>
              <p className="text-gray-400 text-sm mt-1">Haz clic en "Agregar Talla" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventario.formulario.variantes.map((variante, index) => (
                <div key={index} className="bg-gray-50 border rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                      {variante.tallaManual ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={variante.talla}
                            onChange={(e) => inventario.actualizarVariante(index, 'talla', e.target.value)}
                            placeholder="Ej: 34, 35, etc"
                            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => inventario.actualizarVariante(index, 'tallaManual', false)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Volver a seleccionar"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={variante.tallaManual ? '__MANUAL__' : variante.talla}
                            onChange={(e) => {
                              if (e.target.value === '__MANUAL__') {
                                inventario.actualizarVariante(index, 'talla', '__MANUAL__');
                              } else {
                                inventario.actualizarVariante(index, 'talla', e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm appearance-none"
                          >
                            {inventario.tallasDisponibles.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                            <option value="__MANUAL__">✏️ Escribir manualmente...</option>
                          </select>
                          <Edit3 size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad Stock</label>
                      <input
                        type="number"
                        value={variante.cantidad}
                        onChange={(e) => inventario.actualizarVariante(index, 'cantidad', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ajuste Precio (opcional)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          value={variante.ajuste_precio}
                          onChange={(e) => inventario.actualizarVariante(index, 'ajuste_precio', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
                      <button
                        onClick={() => inventario.eliminarVariante(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar talla"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                  {variante.ajuste_precio !== 0 && inventario.formulario.precio_venta_base && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      Precio final para talla {variante.talla}: ${(parseFloat(inventario.formulario.precio_venta_base) + parseFloat(variante.ajuste_precio || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center space-x-4 mt-8 pt-6 border-t">
          <button
            onClick={esEdicion ? inventario.handleActualizarProducto : inventario.handleGuardarProducto}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            <Save size={20} />
            <span>{esEdicion ? 'Actualizar Producto' : 'Guardar Producto'}</span>
          </button>
          <button
            onClick={inventario.handleCancelar}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};