// src/components/sections/inventario/VistaFormulario.jsx
import React from 'react';
import { X, Save, Plus, Trash2, Package, DollarSign, Edit3 } from 'lucide-react';
import { calcularMargen } from "../../../utils/exportExcel";
import { ModalErrorImagen } from '../../common/ModalErrorImagen';


export const VistaFormulario = ({ inventario }) => {
  const esEdicion = inventario.vista === 'editar';
  const coleccionesPijamas = [...new Set(inventario.productos.map((producto) => producto.coleccion).filter(Boolean))].sort();

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colección de pijamas (opcional)
              </label>
              <input
                type="text"
                name="coleccion"
                list="colecciones-pijamas"
                value={inventario.formulario.coleccion}
                onChange={inventario.handleInputChange}
                placeholder="Ej: Línea San Valentín"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <datalist id="colecciones-pijamas">
                {coleccionesPijamas.map((coleccion) => <option key={coleccion} value={coleccion} />)}
              </datalist>
              <p className="mt-1 text-xs text-gray-500">Si la completas, este producto aparecerá como pijama en esa colección de la web.</p>
              {coleccionesPijamas.length > 0 && (
                <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-teal-700">Gestionar colecciones de pijamas</summary>
                  <div className="mt-3 space-y-2">
                    {coleccionesPijamas.map((coleccion) => {
                      const productosColeccion = inventario.productos.filter((producto) => producto.coleccion === coleccion);
                      const oculta = productosColeccion.every((producto) => producto.coleccion_oculta === 1);
                      return (
                        <div key={coleccion} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                          <span className="text-gray-700">{coleccion} <span className="text-xs text-gray-400">({productosColeccion.length})</span></span>
                          <button
                            type="button"
                            onClick={() => inventario.cambiarVisibilidadColeccion(coleccion, !oculta)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium ${oculta ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            {oculta ? 'Mostrar en la web' : 'Ocultar de la web'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del producto (opcional)
              </label>
              <textarea
                name="descripcion"
                value={inventario.formulario.descripcion}
                onChange={inventario.handleInputChange}
                rows={4}
                placeholder="Escribe una descripción que verán las clientas en la página web..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
              />
            </div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Imágenes del Producto (opcional)
  </label>
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={inventario.handleImagenChange}
    disabled={inventario.formulario.cargandoImagen}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
  />

  {/* Indicador de carga */}
  {inventario.formulario.cargandoImagen && (
    <div className="mt-3 flex items-center space-x-2 text-teal-600">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
      <span className="text-sm">Procesando imagen...</span>
    </div>
  )}

  {/* Previsualizaciones */}
  {inventario.formulario.imagenes.length > 0 && !inventario.formulario.cargandoImagen && (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {inventario.formulario.imagenes.map((imagen, indice) => (
        <div key={`${indice}-${imagen.data?.slice(-12) || ''}`} className="relative">
          <img
            src={imagen.thumbnail || imagen.data}
            alt={`Vista previa ${indice + 1}`}
            className="w-full aspect-square object-cover rounded-lg border-2 border-teal-200 shadow-sm"
          />
          <button
            type="button"
            onClick={() => inventario.eliminarImagen(indice)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-sm leading-none shadow hover:bg-red-700"
            aria-label={`Eliminar imagen ${indice + 1}`}
          >
            ×
          </button>
          <p className="mt-1 text-xs text-gray-500 text-center">Imagen {indice + 1}</p>
        </div>
      ))}
    </div>
  )}

  <p className="mt-2 text-xs text-gray-500">
    📸 JPG, PNG o WEBP; máximo 5 MB cada una. Puedes elegir hasta 4 imágenes y la primera será la principal.
  </p>
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
                  onWheel={(e) => e.target.blur()}  // ⭐ AGREGAR ESTA LÍNEA

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
                  onWheel={(e) => e.target.blur()}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {/* PRECIO SUGERIDO */}
              {inventario.formulario.costo_base && parseFloat(inventario.formulario.costo_base) > 0 && (
                <div className="mt-2 text-sm bg-purple-50 border border-purple-200 rounded px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Precio sugerido:</span>
                    <span className="font-bold text-purple-700">
                      ${inventario.calcularPrecioSugerido().toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-purple-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Costo base con margen (35%):</span>
                      <span>${(parseFloat(inventario.formulario.costo_base) / 0.65).toFixed(2)}</span>
                    </div>
                    {inventario.formulario.costos_adicionales.length > 0 && (
                      <div className="flex justify-between">
                        <span>+ Costos adicionales:</span>
                        <span>${inventario.calcularTotalCostosAdicionales().toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 border-t border-purple-200 pt-2">
                    💡 Fórmula: (Costo Base / 0.65) + Costos Adicionales
                  </p>
                </div>
              )}
            </div>

            {/* MARGEN REAL */}
            {inventario.formulario.costo_base && inventario.formulario.precio_venta_base && (
              <div className="md:col-span-2">
                <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-teal-800">
                        {inventario.formulario.costos_adicionales.length > 0 ? 'Margen Real:' : 'Margen Base:'}
                      </span>
                      {inventario.formulario.costos_adicionales.length > 0 && (
                        <p className="text-xs text-teal-600 mt-1">
                          Incluye ${inventario.calcularTotalCostosAdicionales().toFixed(2)} en costos adicionales
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-teal-600">
                      {(() => {
                        const costoBase = parseFloat(inventario.formulario.costo_base) || 0;
                        const costosAdicionales = inventario.calcularTotalCostosAdicionales();
                        const precioVenta = parseFloat(inventario.formulario.precio_venta_base) || 0;
                        const costoTotal = costoBase + costosAdicionales;

                        if (!costoTotal || !precioVenta) return '0.0';

                        return (((precioVenta - costoTotal) / precioVenta) * 100).toFixed(1);
                      })()}%
                    </span>
                  </div>

                  {/* Desglose de costos */}
                  {inventario.formulario.costos_adicionales.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-teal-200 text-xs text-teal-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Precio de venta:</span>
                        <span className="font-medium">${parseFloat(inventario.formulario.precio_venta_base).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Costo Base:</span>
                        <span className="font-medium">${parseFloat(inventario.formulario.costo_base).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Costos Adicionales:</span>
                        <span className="font-medium">${inventario.calcularTotalCostosAdicionales().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t border-teal-200 mt-1">
                        <span>= Ganancia neta:</span>
                        <span>
                          ${(parseFloat(inventario.formulario.precio_venta_base) - parseFloat(inventario.formulario.costo_base) - inventario.calcularTotalCostosAdicionales()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COSTOS ADICIONALES */}
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
                            onWheel={(e) => e.target.blur()}
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
                          value={costo.monto || ''}
                          onChange={(e) => inventario.actualizarCostoAdicional(index, 'monto', e.target.value)}
                          onWheel={(e) => e.target.blur()}
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

        {/* TALLAS / VARIANTES */}
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
                            onWheel={(e) => e.target.blur()}
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
                        value={variante.cantidad || ''}
                        onChange={(e) => inventario.actualizarVariante(index, 'cantidad', e.target.value)}
                        onWheel={(e) => e.target.blur()}
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
                          value={variante.ajuste_precio || ''}
                          onChange={(e) => inventario.actualizarVariante(index, 'ajuste_precio', e.target.value)}
                          onWheel={(e) => e.target.blur()}
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

              {inventario.errorImagen && (
                <ModalErrorImagen
                  mensaje={inventario.errorImagen}
                  onCerrar={() => inventario.setErrorImagen(null)}
                />
              )}

      </div>
    </div>
  );
};
