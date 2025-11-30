import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, AlertCircle, Package, X, Save } from 'lucide-react';

// Helper para IPC de Electron
const getIPC = () => {
  if (window.require) {
    const { ipcRenderer } = window.require('electron');
    return ipcRenderer;
  }
  return null;
};

const Inventario = () => {
  const [vista, setVista] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [productos, setProductos] = useState([]);
  const [productoEditar, setProductoEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const categorias = ['Todos', 'Deluxe', 'Essence', 'Pantuflas', 'Antifaces', 'Humidificadores', 'Fundas', 'Scrunchies', 'Varios'];
  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

  const [formulario, setFormulario] = useState({
    referencia: '', nombre: '', categoria: 'Deluxe', costo: '', precio_venta: '', talla: '', cantidad: ''
  });

  // Cargar productos desde la base de datos
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setError('Electron IPC no disponible');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const productosDB = await ipc.invoke('obtener-productos');
      setProductos(productosDB);
      setError(null);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar productos de la base de datos');
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => p.cantidad > 0 && p.cantidad < 10).length;
  const agotados = productos.filter(p => p.cantidad === 0).length;

  const getEstadoStyle = (cantidad) => {
    if (cantidad === 0) return 'bg-red-100 text-red-700';
    if (cantidad < 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getEstadoTexto = (cantidad) => {
    if (cantidad === 0) return 'Agotado';
    if (cantidad < 10) return 'Stock Bajo';
    return 'En Stock';
  };

  const getStockIcon = (stock) => {
    if (stock === 0) return <AlertCircle size={16} className="text-red-600" />;
    if (stock < 10) return <AlertTriangle size={16} className="text-yellow-600" />;
    return null;
  };

  const calcularMargen = (costo, precioVenta) => {
    if (!costo || !precioVenta) return 0;
    return (((precioVenta - costo) / precioVenta) * 100).toFixed(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarProducto = async () => {
    const ipc = getIPC();
    if (!ipc) {
      alert('Error: Electron IPC no disponible');
      return;
    }

    // Validación
    if (!formulario.referencia || !formulario.nombre || !formulario.costo || !formulario.precio_venta || !formulario.cantidad) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const nuevoProducto = {
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      costo: parseFloat(formulario.costo),
      precio_venta: parseFloat(formulario.precio_venta),
      talla: formulario.talla || null,
      cantidad: parseInt(formulario.cantidad)
    };

    try {
      await ipc.invoke('agregar-producto', nuevoProducto);
      await cargarProductos(); // Recargar lista
      setFormulario({ referencia: '', nombre: '', categoria: 'Deluxe', costo: '', precio_venta: '', talla: '', cantidad: '' });
      setVista('lista');
      alert('Producto agregado exitosamente');
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('Error al guardar el producto: ' + err.message);
    }
  };

  const handleEditarProducto = (producto) => {
    setProductoEditar(producto);
    setFormulario({
      referencia: producto.referencia,
      nombre: producto.nombre,
      categoria: producto.categoria,
      costo: producto.costo.toString(),
      precio_venta: producto.precio_venta.toString(),
      talla: producto.talla || '',
      cantidad: producto.cantidad.toString()
    });
    setVista('editar');
  };

  const handleActualizarProducto = async () => {
    const ipc = getIPC();
    if (!ipc) {
      alert('Error: Electron IPC no disponible');
      return;
    }

    // Validación
    if (!formulario.referencia || !formulario.nombre || !formulario.costo || !formulario.precio_venta || !formulario.cantidad) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const datosActualizados = {
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      costo: parseFloat(formulario.costo),
      precio_venta: parseFloat(formulario.precio_venta),
      talla: formulario.talla || null,
      cantidad: parseInt(formulario.cantidad)
    };

    try {
      await ipc.invoke('actualizar-producto', productoEditar.id, datosActualizados);
      await cargarProductos(); // Recargar lista
      setProductoEditar(null);
      setFormulario({ referencia: '', nombre: '', categoria: 'Deluxe', costo: '', precio_venta: '', talla: '', cantidad: '' });
      setVista('lista');
      alert('Producto actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      alert('Error al actualizar el producto: ' + err.message);
    }
  };

  const handleEliminarProducto = async (id) => {
    const ipc = getIPC();
    if (!ipc) {
      alert('Error: Electron IPC no disponible');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await ipc.invoke('eliminar-producto', id);
      await cargarProductos(); // Recargar lista
      alert('Producto eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('Error al eliminar el producto: ' + err.message);
    }
  };

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error al cargar datos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={cargarProductos}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (vista === 'lista') {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h2>
            <p className="text-gray-500 mt-1">Administra los productos, stock y precios.</p>
          </div>
          <button
            onClick={() => setVista('agregar')}
            className="flex items-center space-x-2 px-5 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Productos</div>
            <div className="text-3xl font-bold text-gray-800">{totalProductos}</div>
            <div className="text-sm text-gray-500 mt-1">Items en inventario</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Bajo</div>
            <div className="text-3xl font-bold text-yellow-600">{stockBajo}</div>
            <div className="text-sm text-gray-500 mt-1">Productos requieren reabastecimiento</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500 uppercase mb-2">Agotados</div>
            <div className="text-3xl font-bold text-red-600">{agotados}</div>
            <div className="text-sm text-gray-500 mt-1">Productos sin stock</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Lista de Productos ({productosFiltrados.length})</h3>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar producto o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    categoriaActiva === cat
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
            {productosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No hay productos registrados</p>
                <p className="text-gray-400 text-sm mt-2">Haz clic en "Nuevo Producto" para agregar uno</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-600">{producto.referencia}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-teal-600" />
                          </div>
                          <div className="font-medium text-gray-800">{producto.nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {producto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{producto.talla || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">${producto.costo.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">${producto.precio_venta.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          {calcularMargen(producto.costo, producto.precio_venta)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${
                            producto.cantidad === 0 ? 'text-red-600' :
                            producto.cantidad < 10 ? 'text-yellow-600' :
                            'text-gray-800'
                          }`}>
                            {producto.cantidad}
                          </span>
                          {getStockIcon(producto.cantidad)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(producto.cantidad)}`}>
                          {getEstadoTexto(producto.cantidad)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            className="p-2 hover:bg-teal-50 rounded-lg transition"
                            title="Editar producto"
                          >
                            <Edit size={18} className="text-teal-600" />
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar producto"
                          >
                            <Trash2 size={18} className="text-red-600" />
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
    );
  }

  const esEdicion = vista === 'editar';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {esEdicion ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <p className="text-gray-500 mt-1">
            {esEdicion ? 'Actualiza la información del producto' : 'Completa los datos del nuevo producto'}
          </p>
        </div>
        <button
          onClick={() => {
            setVista('lista');
            setProductoEditar(null);
            setFormulario({ referencia: '', nombre: '', categoria: 'Deluxe', costo: '', precio_venta: '', talla: '', cantidad: '' });
          }}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X size={20} />
          <span>Cancelar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia del Producto *
            </label>
            <input
              type="text"
              name="referencia"
              value={formulario.referencia}
              onChange={handleInputChange}
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
              value={formulario.nombre}
              onChange={handleInputChange}
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
              value={formulario.categoria}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categorias.filter(c => c !== 'Todos').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Talla (opcional)
            </label>
            <select
              name="talla"
              value={formulario.talla}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sin talla</option>
              {tallas.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo (lo que te costó) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                name="costo"
                value={formulario.costo}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                name="precio_venta"
                value={formulario.precio_venta}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad en Stock *
            </label>
            <input
              type="number"
              name="cantidad"
              value={formulario.cantidad}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {formulario.costo && formulario.precio_venta && (
            <div className="md:col-span-2 bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-teal-800">Margen de Ganancia:</span>
                <span className="text-2xl font-bold text-teal-600">
                  {calcularMargen(parseFloat(formulario.costo), parseFloat(formulario.precio_venta))}%
                </span>
              </div>
              <div className="text-xs text-teal-600 mt-1">
                Ganancia por unidad: ${(parseFloat(formulario.precio_venta) - parseFloat(formulario.costo)).toFixed(2)}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4 mt-8">
          <button
            onClick={esEdicion ? handleActualizarProducto : handleGuardarProducto}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            <Save size={20} />
            <span>{esEdicion ? 'Actualizar Producto' : 'Guardar Producto'}</span>
          </button>
          <button
            onClick={() => {
              setVista('lista');
              setProductoEditar(null);
              setFormulario({ referencia: '', nombre: '', categoria: 'Deluxe', costo: '', precio_venta: '', talla: '', cantidad: '' });
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventario;