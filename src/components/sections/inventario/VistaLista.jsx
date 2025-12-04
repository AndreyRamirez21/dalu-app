// src/components/sections/inventario/VistaLista.jsx
import React, { useState, useEffect, memo } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { exportarInventarioExcel } from "../../../utils/exportExcel";


// ✅ Modal para ver imagen ampliada
const ModalImagen = ({ imagenBase64, nombreProducto, onCerrar }) => {
  if (!imagenBase64) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition z-10"
        >
          <X size={24} className="text-gray-700" />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{nombreProducto}</h3>
          <img
            src={imagenBase64}
            alt={nombreProducto}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

// ✅ Componente de imagen clickeable
const ImagenProducto = memo(({ rutaImagen, nombreProducto, onClickImagen }) => {
  const [imagenBase64, setImagenBase64] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;

    const cargarImagen = async () => {
      if (!rutaImagen) {
        if (montado) setCargando(false);
        return;
      }

      try {
        setCargando(true);
        const ipc = window.require ? window.require('electron').ipcRenderer : null;
        if (!ipc) throw new Error('IPC no disponible');
        const base64Data = await ipc.invoke('cargar-imagen', rutaImagen);
        if (montado) {
          if (base64Data) {
            setImagenBase64(base64Data);
            setError(false);
          } else {
            setError(true);
          }
          setCargando(false);
        }
      } catch (err) {
        console.error('Error al cargar imagen:', err);
        if (montado) {
          setError(true);
          setCargando(false);
        }
      }
    };

    cargarImagen();

    return () => {
      montado = false;
    };
  }, [rutaImagen]);

  // Mostrar placeholder mientras carga
  if (cargando) {
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
        <Package size={16} className="text-gray-400" />
      </div>
    );
  }

  // Si no hay imagen o hubo error
  if (!rutaImagen || error || !imagenBase64) {
    return (
      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-teal-600" />
      </div>
    );
  }

  // Mostrar imagen clickeable
  return (
    <img
      src={imagenBase64}
      alt={nombreProducto}
      className="w-10 h-10 rounded-lg object-cover border-2 border-teal-200 flex-shrink-0 cursor-pointer hover:border-teal-400 hover:shadow-md transition"
      onClick={() => onClickImagen(imagenBase64)}
      onError={() => {
        console.error('Error al renderizar imagen');
        setError(true);
      }}
      title="Click para ampliar"
    />
  );
});

ImagenProducto.displayName = 'ImagenProducto';

export const VistaLista = ({ inventario }) => {
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [nombreProductoAmpliado, setNombreProductoAmpliado] = useState('');

  const getStockIcon = (stock) => {
    if (stock === 0) return <AlertCircle size={16} className="text-red-600" />;
    if (stock < 10) return <AlertCircle size={16} className="text-yellow-600" />;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Productos</div>
          <div className="text-3xl font-bold text-gray-800">{inventario.totalProductos}</div>
          <div className="text-sm text-gray-500 mt-1">Items en inventario</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Bajo</div>
          <div className="text-3xl font-bold text-yellow-600">{inventario.stockBajo}</div>
          <div className="text-sm text-gray-500 mt-1">Productos requieren reabastecimiento</div>
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
            <div className="divide-y divide-gray-200">
              {inventario.productosFiltrados.map((producto) => {
                const stockTotal = inventario.calcularStockTotal(producto.variantes);
                const expandido = inventario.productosExpandidos[producto.id];

                return (
                  <div key={producto.id} className="bg-white hover:bg-gray-50 transition">
                    <div className="px-6 py-4 flex items-center">
                      <button
                        onClick={() => inventario.toggleExpandirProducto(producto.id)}
                        className="mr-3 p-1 hover:bg-gray-200 rounded transition"
                      >
                        {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1">
                          <div className="text-sm font-mono text-gray-600">{producto.referencia}</div>
                        </div>

                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            {/* ✅ IMAGEN CLICKEABLE */}
                            <ImagenProducto
                              rutaImagen={producto.imagen}
                              nombreProducto={producto.nombre}
                              onClickImagen={(img) => abrirImagenAmpliada(img, producto.nombre)}
                            />
                            <div className="font-medium text-gray-800">{producto.nombre}</div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {producto.categoria}
                          </span>
                        </div>

                        <div className="col-span-1">
                          <div className="text-sm text-gray-600">${producto.costo_base.toFixed(2)}</div>
                        </div>

                        <div className="col-span-1">
                          <div className="text-sm font-medium text-gray-800">${producto.precio_venta_base.toFixed(2)}</div>
                        </div>

                        <div className="col-span-1">
                          <div className="text-sm text-green-600 font-medium">
                            {((producto.precio_venta_base - producto.costo_base) / producto.costo_base * 100).toFixed(1)}%
                          </div>
                        </div>

                        <div className="col-span-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${
                              stockTotal === 0 ? 'text-red-600' :
                              stockTotal < 10 ? 'text-yellow-600' :
                              'text-gray-800'
                            }`}>
                              {stockTotal}
                            </span>
                            {getStockIcon(stockTotal)}
                          </div>
                        </div>

                        <div className="col-span-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${inventario.getEstadoStyle(stockTotal)}`}>
                            {inventario.getEstadoTexto(stockTotal)}
                          </span>
                        </div>

                        <div className="col-span-1 flex items-center space-x-2">
                          <button
                            onClick={() => inventario.handleEditarProducto(producto)}
                            className="p-2 hover:bg-teal-50 rounded-lg transition"
                            title="Editar producto"
                          >
                            <Edit size={18} className="text-teal-600" />
                          </button>
                          <button
                            onClick={() => inventario.handleEliminarProducto(producto.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar producto"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandido && producto.variantes && producto.variantes.length > 0 && (
                      <div className="px-6 pb-4 ml-12 bg-gray-50">
                        <div className="border-l-2 border-teal-300 pl-6">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            Tallas / Variantes ({producto.variantes.length})
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {producto.variantes.map((variante) => (
                              <div
                                key={variante.id}
                                className="bg-white border rounded-lg p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-teal-50 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-teal-600">{variante.talla}</span>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};