// src/components/sections/inventario/VistaLista.jsx
import React, { useState, memo } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { exportarInventarioExcel } from "../../../utils/exportExcel";
import { ImagenProducto } from './ImagenProducto'; // ✅ IMPORTAR COMPONENTE OPTIMIZADO

// ✅ Modal para ver imagen ampliada (CORREGIDO)
const ModalImagen = ({ imagenBase64, nombreProducto, onCerrar }) => {
  if (!imagenBase64) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic en el contenido
      >
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition z-10"
        >
          <X size={24} className="text-gray-700" />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{nombreProducto}</h3>
          {/* ✅ MOSTRAR IMAGEN DIRECTAMENTE (ya está en base64) */}
          <img
            src={imagenBase64}
            alt={nombreProducto}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
export const VistaLista = ({ inventario }) => {
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [nombreProductoAmpliado, setNombreProductoAmpliado] = useState('');

  const getStockIcon = (stock) => {
    if (stock === 0) return <AlertCircle size={16} className="text-red-600" />;
    if (stock <= 2) return <AlertCircle size={16} className="text-yellow-600" />;
    return null;
  };

  const abrirImagenAmpliada = (imagenBase64, nombreProducto) => {
    setImagenAmpliada(imagenBase64);
    setNombreProductoAmpliado(nombreProducto);
  };

  const cerrarImagenAmpliada = () => {
    setImagenAmpliada(null);
    setNombreProductoAmpliado('');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Modal de imagen ampliada */}
      {imagenAmpliada && (
        <ModalImagen
          imagenBase64={imagenAmpliada}
          nombreProducto={nombreProductoAmpliado}
          onCerrar={cerrarImagenAmpliada}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div></div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportarInventarioExcel(inventario.productos)}
            className="flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm"
          >
            <Package size={20} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              inventario.resetFormulario();
              inventario.setVista('agregar');
            }}
            className="flex items-center space-x-2 px-5 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Productos</div>
          <div className="text-3xl font-bold text-gray-800">{inventario.totalProductos}</div>
          <div className="text-sm text-gray-500 mt-1">Productos registrados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Unidades</div>
          <div className="text-3xl font-bold text-blue-600">{inventario.totalUnidades}</div>
          <div className="text-sm text-gray-500 mt-1">Items en inventario</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Bajo</div>
          <div className="text-3xl font-bold text-yellow-600">{inventario.stockBajo}</div>
          <div className="text-sm text-gray-500 mt-1">Requieren reabastecimiento</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Agotados</div>
          <div className="text-3xl font-bold text-red-600">{inventario.agotados}</div>
          <div className="text-sm text-gray-500 mt-1">Productos sin stock</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Lista de Productos ({inventario.productosFiltrados.length})</h3>
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar producto o referencia..."
                value={inventario.searchTerm}
                onChange={(e) => inventario.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {inventario.categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => inventario.setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  inventario.categoriaActiva === cat
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {inventario.productosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hay productos registrados</p>
              <p className="text-gray-400 text-sm mt-2">Haz clic en "Nuevo Producto" para agregar uno</p>
            </div>
          ) : (
            <>
              {/* Encabezados */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="px-6 py-3 flex items-center">
                  <div className="w-8 mr-3"></div>
                  <div className="flex-1 flex items-center">
                    <div className="w-24 flex-shrink-0 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Referencia</span>
                    </div>
                    <div className="flex-1 min-w-[200px] text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Producto</span>
                    </div>
                    <div className="w-32 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoría</span>
                    </div>
                    <div className="w-24 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stock</span>
                    </div>
                    <div className="w-28 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</span>
                    </div>
                    <div className="w-24"></div>
                  </div>
                </div>
              </div>

              {/* Filas de productos */}
              <div className="divide-y divide-gray-200">
                {inventario.productosAgrupados.map((grupo) => {
                  const expandidoGrupo = inventario.productosExpandidos[grupo.id];

                  return (
                    <div key={grupo.id} className="bg-white hover:bg-gray-50 transition">
                      {/* Fila principal del GRUPO */}
                      <div className="px-6 py-4 flex items-center">
                        <button
                          onClick={() => inventario.toggleExpandirProducto(grupo.id)}
                          className="mr-3 p-1 hover:bg-gray-200 rounded transition"
                        >
                          {expandidoGrupo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        <div className="flex-1 flex items-center">
                          <div className="w-24 flex-shrink-0">
                            <div className="text-sm font-bold text-teal-600">
                              {grupo.referencias.length} ref(s)
                            </div>
                          </div>

                          <div className="flex-1 min-w-[200px]">
                            <div className="font-bold text-lg text-gray-800">{grupo.nombre}</div>
                          </div>

                          <div className="w-32 flex justify-start">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {grupo.categoria}
                            </span>
                          </div>

                          <div className="w-24">
                            <div className="flex items-center justify-start space-x-2">
                              <span className={`text-lg font-bold ${
                                grupo.stockTotal === 0 ? 'text-red-600' :
                                grupo.stockTotal <= 5 ? 'text-yellow-600' :
                                'text-gray-800'
                              }`}>
                                {grupo.stockTotal}
                              </span>
                              {getStockIcon(grupo.stockTotal)}
                            </div>
                          </div>

                          <div className="w-28 flex justify-start">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${inventario.getEstadoStyle(grupo.stockTotal)}`}>
                              {inventario.getEstadoTexto(grupo.stockTotal)}
                            </span>
                          </div>

                          <div className="w-24"></div>
                        </div>
                      </div>

                      {/* Referencias expandidas */}
                      {expandidoGrupo && (
                        <div className="px-6 pb-4 ml-12 bg-gray-50">
                          <div className="border-l-2 border-teal-300 pl-6 space-y-3">
                            {grupo.referencias.map((producto) => {
                              const stockReferencia = inventario.calcularStockTotal(producto.variantes);
                              const expandidoReferencia = inventario.referenciasExpandidas[producto.id];

                              return (
                                <div key={producto.id} className="bg-white border rounded-lg p-4">
                                  {/* Cabecera de la referencia CON IMAGEN */}
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => inventario.toggleExpandirReferencia(producto.id)}
                                      className="mr-3 p-1 hover:bg-gray-200 rounded transition"
                                    >
                                      {expandidoReferencia ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {/* ✅ IMAGEN OPTIMIZADA CON LAZY LOADING */}
                                        <div className="mr-3">
                                          <ImagenProducto
                                            rutaImagen={producto.imagen}
                                            rutaThumbnail={producto.imagenThumbnail} // ✅ AGREGAR ESTO
                                            nombreProducto={`${producto.nombre} - ${producto.referencia}`}
                                            onClickImagen={(img) => abrirImagenAmpliada(img, `${producto.nombre} - ${producto.referencia}`)}
                                            useThumbnail={true} // Usa thumbnail en la lista
                                          />
                                        </div>

                                    <div className="flex-1 grid grid-cols-8 gap-3 items-center">
                                      {/* Referencia */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">REFERENCIA</div>
                                        <div className="text-sm font-mono text-gray-800 font-semibold">{producto.referencia}</div>
                                      </div>

                                      {/* Costo Base */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">COSTO BASE</div>
                                        <div className="text-sm text-gray-700">${producto.costo_base.toFixed(2)}</div>
                                      </div>

                                      {/* Costos Extras */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">COSTOS EXTRAS</div>
                                        <div className="text-sm">
                                          {(() => {
                                            const costosAdicionales = producto.costos_adicionales || [];
                                            const totalCostosExtrasUnitario = costosAdicionales.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
                                            const stockTotal = producto.variantes
                                              ? producto.variantes.reduce((s, v) => s + v.cantidad, 0)
                                              : 0;
                                            const totalCostosExtras = totalCostosExtrasUnitario * stockTotal;

                                            if (costosAdicionales.length === 0) {
                                              return <span className="text-gray-400 text-xs">Sin costos</span>;
                                            }

                                            return (
                                              <div className="flex flex-col">
                                                <span className="text-orange-600 font-bold">${totalCostosExtras.toFixed(2)}</span>
                                                <span className="text-xs text-gray-500">({costosAdicionales.length} item{costosAdicionales.length > 1 ? 's' : ''} × {stockTotal})</span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      {/* Precio Venta */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">PRECIO VENTA</div>
                                        <div className="text-sm font-medium text-gray-900">${producto.precio_venta_base.toFixed(2)}</div>
                                      </div>

                                      {/* Margen Real */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">MARGEN REAL</div>
                                        <div className="text-sm text-green-600 font-bold">
                                          {(() => {
                                            const costoBase = parseFloat(producto.costo_base) || 0;
                                            const precioVenta = parseFloat(producto.precio_venta_base) || 0;
                                            const costosAdicionales = producto.costos_adicionales
                                              ? producto.costos_adicionales.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
                                              : 0;
                                            const costoTotal = costoBase + costosAdicionales;

                                            if (!costoTotal || !precioVenta) return '0.0%';
                                            const margenReal = ((precioVenta - costoTotal) / precioVenta) * 100;
                                            return `${margenReal.toFixed(1)}%`;
                                          })()}
                                        </div>
                                      </div>

                                      {/* Stock */}
                                      <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">STOCK</div>
                                        <div className={`text-sm font-bold ${
                                          stockReferencia === 0 ? 'text-red-600' :
                                          stockReferencia <= 2 ? 'text-yellow-600' :
                                          'text-gray-800'
                                        }`}>
                                          {stockReferencia}
                                        </div>
                                      </div>

                                      {/* Acciones */}
                                      <div className="col-span-2">
                                        <div className="text-xs text-gray-500 font-medium mb-1">ACCIONES</div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => inventario.handleEditarProducto(producto)}
                                            className="p-2 hover:bg-teal-50 rounded-lg transition"
                                            title="Editar referencia"
                                          >
                                            <Edit size={16} className="text-teal-600" />
                                          </button>
                                          <button
                                            onClick={() => inventario.handleEliminarProducto(producto.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar referencia"
                                          >
                                            <Trash2 size={16} className="text-red-600" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Variantes */}
                                  {expandidoReferencia && producto.variantes && producto.variantes.length > 0 && (
                                    <div className="mt-4 ml-8 border-l-2 border-blue-200 pl-4">
                                      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                                        Tallas / Variantes ({producto.variantes.length})
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {producto.variantes.map((variante) => (
                                          <div
                                            key={variante.id}
                                            className="bg-gray-50 border rounded-lg p-3 flex items-center justify-between"
                                          >
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                                <span className="text-xs font-bold text-blue-600">{variante.talla}</span>
                                              </div>
                                              <div>
                                                <div className="text-sm font-medium text-gray-700">Talla {variante.talla}</div>
                                                <div className="text-xs text-gray-500">
                                                  Stock: <span className={`font-semibold ${
                                                    variante.cantidad === 0 ? 'text-red-600' :
                                                    variante.cantidad < 5 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                  }`}>{variante.cantidad}</span>
                                                </div>
                                              </div>
                                            </div>
                                            {variante.ajuste_precio !== 0 && (
                                              <div className="text-xs text-blue-600 font-medium">
                                                {variante.ajuste_precio > 0 ? '+' : ''} ${variante.ajuste_precio.toFixed(2)}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};