// src/components/sections/marcas/FormularioProductoMarca.jsx
import React from 'react';
import { ArrowLeft, Save, Package, DollarSign, Tag, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';

export const FormularioProductoMarca = ({ productosMarca, marcaNombre }) => {
  const esEdicion = productosMarca.vistaProducto === 'editar';

  const handleSubmit = (e) => {
    e.preventDefault();

    // Debug: ver qué datos se están enviando
    console.log('Formulario a guardar:', productosMarca.formulario);
    console.log('Funciones disponibles:', {
      handleGuardarProducto: typeof productosMarca.handleGuardarProducto,
      handleActualizarProducto: typeof productosMarca.handleActualizarProducto
    });

    if (esEdicion) {
      if (productosMarca.handleActualizarProducto) {
        productosMarca.handleActualizarProducto();
      } else {
        console.error('handleActualizarProducto no está definido');
      }
    } else {
      if (productosMarca.handleGuardarProducto) {
        productosMarca.handleGuardarProducto();
      } else {
        console.error('handleGuardarProducto no está definido');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={productosMarca.handleCancelar}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {esEdicion ? 'Editar Producto' : 'Nuevo Producto'} - {marcaNombre}
            </h2>
            <p className="text-gray-600 mt-1">
              {esEdicion ? 'Actualiza la información del producto' : 'Agrega un nuevo producto a esta marca'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8">
          {/* Información básica */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Package className="mr-2 text-purple-600" size={20} />
              Información del Producto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="referencia"
                  value={productosMarca.formulario.referencia}
                  onChange={productosMarca.handleInputChange}
                  placeholder="Ej: MAR-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={productosMarca.formulario.nombre}
                  onChange={productosMarca.handleInputChange}
                  placeholder="Ej: Pijama Deluxe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="mb-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <DollarSign className="mr-2 text-purple-600" size={20} />
              Precio de Venta
            </h3>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="precio_venta_base"
                  value={productosMarca.formulario.precio_venta_base}
                  onChange={productosMarca.handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Precio establecido por la marca</p>
            </div>
          </div>

          {/* Imagen */}
          <div className="mb-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <ImageIcon className="mr-2 text-purple-600" size={20} />
              Imagen del Producto
            </h3>

            <div className="flex items-start space-x-4">
              {productosMarca.formulario.imagenPreview ? (
                <div className="relative">
                  <img
                    src={productosMarca.formulario.imagenPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-purple-200"
                  />
                  <button
                    type="button"
                    onClick={productosMarca.eliminarImagen}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Package size={32} className="text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={productosMarca.handleImagenChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-2">JPG, PNG o GIF (máx. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Variantes/Tallas */}
          <div className="mb-8 pt-8 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Tag className="mr-2 text-purple-600" size={20} />
                Tallas / Variantes
              </h3>
              <button
                type="button"
                onClick={productosMarca.agregarVariante}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
              >
                <Plus size={16} />
                <span>Agregar Talla</span>
              </button>
            </div>

            {productosMarca.formulario.variantes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">No hay tallas agregadas</p>
                <p className="text-sm text-gray-400 mt-1">Haz clic en "Agregar Talla" para empezar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productosMarca.formulario.variantes.map((variante, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                    {/* Talla */}
                    <div className="flex-1">
                      {variante.tallaManual ? (
                        <input
                          type="text"
                          value={variante.talla}
                          onChange={(e) => productosMarca.actualizarVariante(index, 'talla', e.target.value)}
                          placeholder="Ingresa talla"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <select
                          value={variante.talla}
                          onChange={(e) => productosMarca.actualizarVariante(index, 'talla', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          {productosMarca.tallasDisponibles.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                          <option value="__MANUAL__">✏️ Escribir manualmente...</option>
                        </select>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="w-24">
                      <input
                        type="number"
                        value={variante.cantidad}
                        onChange={(e) => productosMarca.actualizarVariante(index, 'cantidad', e.target.value)}
                        placeholder="Stock"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Ajuste precio */}
                    <div className="w-28">
                      <input
                        type="number"
                        value={variante.ajuste_precio}
                        onChange={(e) => productosMarca.actualizarVariante(index, 'ajuste_precio', e.target.value)}
                        placeholder="± Precio"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => productosMarca.eliminarVariante(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={productosMarca.handleCancelar}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium"
            >
              <Save size={20} />
              <span>{esEdicion ? 'Actualizar' : 'Guardar'} Producto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};