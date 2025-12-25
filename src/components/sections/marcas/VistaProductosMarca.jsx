// src/components/sections/marcas/VistaProductosMarca.jsx
import React, { useState } from 'react';
import { ArrowLeft, Plus, Package, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useProductosMarca } from '../../../api/useProductosMarca';
import { FormularioProductoMarca } from './FormularioProductoMarca';

export const VistaProductosMarca = ({ marcasAliadas }) => {
  const { marcaSeleccionada, productosMarca, handleVerProductos } = marcasAliadas;
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  const productosMarcaHook = useProductosMarca(
    marcaSeleccionada?.id,
    () => handleVerProductos(marcaSeleccionada) // Recargar productos después de cambios
  );

  if (!marcaSeleccionada) return null;

  // Si estamos agregando o editando producto, mostrar formulario
  if (productosMarcaHook.vistaProducto === 'agregar' || productosMarcaHook.vistaProducto === 'editar') {
    return <FormularioProductoMarca productosMarca={productosMarcaHook} marcaNombre={marcaSeleccionada.nombre} />;
  }

  const calcularStockTotal = (variantes) => {
    if (!variantes || variantes.length === 0) return 0;
    return variantes.reduce((total, v) => total + v.cantidad, 0);
  };

  const getEstadoStyle = (cantidad) => {
    if (cantidad === 0) return 'bg-red-100 text-red-700';
    if (cantidad <= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getEstadoTexto = (cantidad) => {
    if (cantidad === 0) return 'Agotado';
    if (cantidad <= 2) return 'Stock Bajo';
    return 'En Stock';
  };

  const totalProductos = productosMarca.length;
  const totalStock = productosMarca.reduce((sum, p) => sum + calcularStockTotal(p.variantes), 0);
  const stockBajo = productosMarca.filter(p => {
    const stock = calcularStockTotal(p.variantes);
    return stock > 0 && stock <= 2;
  }).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => marcasAliadas.setVista('lista')}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800">
            Productos de {marcaSeleccionada.nombre}
          </h2>
          <p className="text-gray-600 mt-1">Gestiona el inventario de esta marca</p>
        </div>
        <button
          onClick={() => productosMarcaHook.setVistaProducto('agregar')}
          className="flex items-center space-x-2 px-5 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Estadísticas de la marca */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Productos</div>
          <div className="text-3xl font-bold text-gray-800">{totalProductos}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Total</div>
          <div className="text-3xl font-bold text-blue-600">{totalStock}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Bajo</div>
          <div className="text-3xl font-bold text-yellow-600">{stockBajo}</div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-xl shadow-sm border">
        {productosMarca.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Esta marca no tiene productos</p>
            <p className="text-gray-400 text-sm mt-2">Haz clic en "Agregar Producto" para empezar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Precio Venta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productosMarca.map((producto) => {
                  const stock = calcularStockTotal(producto.variantes);

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">{producto.referencia}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{producto.nombre}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-800">${producto.precio_venta_base.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-sm font-bold ${
                            stock === 0 ? 'text-red-600' :
                            stock <= 2 ? 'text-yellow-600' :
                            'text-gray-800'
                          }`}>
                            {stock}
                          </span>
                          {stock === 0 && <AlertCircle size={16} className="text-red-600" />}
                          {stock > 0 && stock <= 2 && <AlertCircle size={16} className="text-yellow-600" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(stock)}`}>
                          {getEstadoTexto(stock)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => productosMarcaHook.handleEditarProducto(producto)}
                            className="p-2 hover:bg-purple-50 rounded-lg transition"
                            title="Editar producto"
                          >
                            <Edit size={16} className="text-purple-600" />
                          </button>
                          <button
                            onClick={() => {
                              setModalConfirmacion({
                                mensaje: '¿Estás seguro de eliminar este producto?',
                                onConfirmar: () => {
                                  productosMarcaHook.handleEliminarProducto(producto.id, (callback) => {
                                    callback();
                                    setModalConfirmacion(null);
                                  });
                                }
                              });
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar acción</h3>
            <p className="text-gray-600 mb-6">{modalConfirmacion.mensaje}</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setModalConfirmacion(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacion.onConfirmar}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación */}
      {productosMarcaHook.notificacion && (
        <div className={`fixed top-4 right-4 z-50 border-2 rounded-lg shadow-lg p-4 ${
          productosMarcaHook.notificacion.tipo === 'exito' ? 'bg-green-50 border-green-200' :
          productosMarcaHook.notificacion.tipo === 'error' ? 'bg-red-50 border-red-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <span className="font-medium">{productosMarcaHook.notificacion.mensaje}</span>
        </div>
      )}
    </div>
  );
};