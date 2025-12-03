import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, AlertCircle, Package, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { exportarInventarioExcel, calcularMargen } from "../../utils/exportExcel";

// Helper para IPC de Electron
const getIPC = () => {
  if (window.require) {
    const { ipcRenderer } = window.require('electron');
    return ipcRenderer;
  }
  return null;
};

// Componente de notificación
const Notificacion = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const estilos = tipo === 'exito'
    ? 'bg-green-50 border-green-500 text-green-800'
    : tipo === 'error'
    ? 'bg-red-50 border-red-500 text-red-800'
    : 'bg-yellow-50 border-yellow-500 text-yellow-800';

  const Icono = tipo === 'exito' ? '✓' : tipo === 'error' ? '✕' : '⚠';

  return (
    <div className={`fixed top-4 right-4 z-50 ${estilos} border-l-4 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md`}>
      <span className="text-2xl">{Icono}</span>
      <p className="flex-1 font-medium">{mensaje}</p>
      <button onClick={onClose} className="hover:opacity-70 text-xl font-bold">
        ×
      </button>
    </div>
  );
};

// Modal de confirmación
const ModalConfirmacion = ({ mensaje, onConfirmar, onCancelar }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle size={24} className="text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-800">Confirmar acción</h3>
        </div>
        <p className="text-gray-600 mb-6">{mensaje}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

const Inventario = () => {
  const [vista, setVista] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [productos, setProductos] = useState([]);
  const [productoEditar, setProductoEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [productosExpandidos, setProductosExpandidos] = useState({});

  const categorias = ['Todos', 'Deluxe', 'Essence', 'Pantuflas', 'Antifaces', 'Humidificadores', 'Fundas', 'Scrunchies', 'Varios'];
  const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

const formularioInicial = {
  referencia: '',
  nombre: '',
  categoria: 'Deluxe',
  costo_base: '',
  precio_venta_base: '',
  variantes: []
};

const [formulario, setFormulario] = useState(formularioInicial);


// Función para cargar productos
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

// Cargar productos desde la base de datos
useEffect(() => {
  cargarProductos();
}, []);



  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

const toggleExpandirProducto = (productoId) => {
    setProductosExpandidos(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const calcularStockTotal = (variantes) => {
    if (!variantes || variantes.length === 0) return 0;
    return variantes.reduce((total, v) => total + v.cantidad, 0);
  };

  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => {
    const stockTotal = calcularStockTotal(p.variantes);
    return stockTotal > 0 && stockTotal < 10;
  }).length;
  const agotados = productos.filter(p => calcularStockTotal(p.variantes) === 0).length;

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

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormulario(prev => ({ ...prev, [name]: value }));
};
  const agregarVariante = () => {
    setFormulario(prev => ({
      ...prev,
      variantes: [...prev.variantes, { talla: 'S', cantidad: 0, ajuste_precio: 0 }]
    }));
  };

  const actualizarVariante = (index, campo, valor) => {
    setFormulario(prev => {
      const nuevasVariantes = [...prev.variantes];
      nuevasVariantes[index] = { ...nuevasVariantes[index], [campo]: valor };
      return { ...prev, variantes: nuevasVariantes };
    });
  };

  const eliminarVariante = (index) => {
    setFormulario(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index)
    }));
  };

  const handleGuardarProducto = async () => {
    const ipc = getIPC();
       if (!ipc) {
           setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
           return;
        }

        if (!formulario.referencia || !formulario.nombre || !formulario.costo_base || !formulario.precio_venta_base) {
          setNotificacion({ mensaje: 'Por favor completa todos los campos obligatorios', tipo: 'advertencia' });
          return;
        }

        if (formulario.variantes.length === 0) {
          setNotificacion({ mensaje: 'Debes agregar al menos una talla/variante', tipo: 'advertencia' });
          return;
        }

    // Validar referencia duplicada
    const referenciaExiste = productos.some(p =>
      p.referencia.toLowerCase() === formulario.referencia.trim().toLowerCase()
    );
    if (referenciaExiste) {
      setNotificacion({ mensaje: `Ya existe un producto con la referencia "${formulario.referencia}"`, tipo: 'error' });
      return;
    }

    const tallas = formulario.variantes.map(v => v.talla);
    const tallasDuplicadas = tallas.filter((t, i) => tallas.indexOf(t) !== i);
        if (tallasDuplicadas.length > 0) {
          setNotificacion({ mensaje: 'No puedes tener tallas duplicadas: ' + tallasDuplicadas.join(', '), tipo: 'advertencia' });
          return;
        }
    const nuevoProducto = {
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      costo_base: parseFloat(formulario.costo_base),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      }))
    };

try {
  await ipc.invoke('agregar-producto', nuevoProducto);
  await cargarProductos();
  setFormulario({
    referencia: '',
    nombre: '',
    categoria: 'Deluxe',
    costo_base: '',
    precio_venta_base: '',
    variantes: []
  });
  setVista('lista');
  setTimeout(() => {
    setNotificacion({ mensaje: 'Producto agregado exitosamente', tipo: 'exito' });
  }, 300);
} catch (err) {
  console.error('Error al guardar producto:', err);
  setNotificacion({ mensaje: 'Error al guardar el producto: ' + err.message, tipo: 'error' });
}
  };

  const handleEditarProducto = (producto) => {
    setProductoEditar(producto);
    setFormulario({
      referencia: producto.referencia,
      nombre: producto.nombre,
      categoria: producto.categoria,
      costo_base: producto.costo_base.toString(),
      precio_venta_base: producto.precio_venta_base.toString(),
      variantes: producto.variantes.map(v => ({
        talla: v.talla,
        cantidad: v.cantidad,
        ajuste_precio: v.ajuste_precio || 0
      }))
    });
    setVista('editar');
  };

  const handleActualizarProducto = async () => {
    const ipc = getIPC();
        if (!ipc) {
          setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
          return;
        }

        if (!formulario.referencia || !formulario.nombre || !formulario.costo_base || !formulario.precio_venta_base) {
          setNotificacion({ mensaje: 'Por favor completa todos los campos obligatorios', tipo: 'advertencia' });
          return;
        }

        if (formulario.variantes.length === 0) {
          setNotificacion({ mensaje: 'Debes agregar al menos una talla/variante', tipo: 'advertencia' });
          return;
        }

        // Validar referencia duplicada (excepto el producto actual)
        const referenciaExiste = productos.some(p =>
          p.referencia.toLowerCase() === formulario.referencia.trim().toLowerCase() &&
          p.id !== productoEditar.id
        );
        if (referenciaExiste) {
          setNotificacion({ mensaje: `Ya existe otro producto con la referencia "${formulario.referencia}"`, tipo: 'error' });
          return;
        }

    const tallas = formulario.variantes.map(v => v.talla);
    const tallasDuplicadas = tallas.filter((t, i) => tallas.indexOf(t) !== i);
        if (tallasDuplicadas.length > 0) {
          setNotificacion({ mensaje: 'No puedes tener tallas duplicadas: ' + tallasDuplicadas.join(', '), tipo: 'advertencia' });
          return;
        }

    const datosActualizados = {
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      costo_base: parseFloat(formulario.costo_base),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      }))
    };

    try {
      await ipc.invoke('actualizar-producto', productoEditar.id, datosActualizados);
      await cargarProductos();
      setProductoEditar(null);
      setFormulario({
        referencia: '',
        nombre: '',
        categoria: 'Deluxe',
        costo_base: '',
        precio_venta_base: '',
        variantes: []
      });
      setNotificacion({ mensaje: 'Producto actualizado exitosamente', tipo: 'exito' });
      setVista('lista');
    } catch (err) {
      console.error('Error al actualizar producto:', err);
        setNotificacion({ mensaje: 'Error al guardar el producto: ' + err.message, tipo: 'error' });    }
  };

const handleEliminarProducto = async (id) => {
  const ipc = getIPC();
  if (!ipc) {
    setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
    return;
  }

  setModalConfirmacion({
    mensaje: '¿Estás seguro de eliminar este producto y todas sus variantes? Esta acción no se puede deshacer.',
    onConfirmar: async () => {
      setModalConfirmacion(null);
      try {
        await ipc.invoke('eliminar-producto', id);
        await cargarProductos();
        setNotificacion({ mensaje: 'Producto eliminado exitosamente', tipo: 'exito' });
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        setNotificacion({ mensaje: 'Error al eliminar el producto: ' + err.message, tipo: 'error' });
      }
    },
    onCancelar: () => setModalConfirmacion(null)
  });
};

  // Pantallas de carga y error
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
          </div>
        <div className="flex items-center space-x-3">
          <button
        onClick={() => exportarInventarioExcel(productos)}
            className="flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm"
          >
            <Package size={20} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setFormulario({
                referencia: '',
                nombre: '',
                categoria: 'Deluxe',
                costo_base: '',
                precio_venta_base: '',
                variantes: []
              });
              setProductoEditar(null);
              setVista('agregar');
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
              <div className="divide-y divide-gray-200">
                {productosFiltrados.map((producto) => {
                  const stockTotal = calcularStockTotal(producto.variantes);
                  const expandido = productosExpandidos[producto.id];

                  return (
                    <div key={producto.id} className="bg-white hover:bg-gray-50 transition">
                      <div className="px-6 py-4 flex items-center">
                        <button
                          onClick={() => toggleExpandirProducto(producto.id)}
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
                              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                <Package size={20} className="text-teal-600" />
                              </div>
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
                              {calcularMargen(producto.costo_base, producto.precio_venta_base)}%
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(stockTotal)}`}>
                              {getEstadoTexto(stockTotal)}
                            </span>
                          </div>

                          <div className="col-span-1 flex items-center space-x-2">
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
        {notificacion && notificacion.tipo === 'exito' && (
          <Notificacion
            mensaje={notificacion.mensaje}
            tipo={notificacion.tipo}
            onClose={() => setNotificacion(null)}
          />
        )}

        {modalConfirmacion && (
          <ModalConfirmacion
            mensaje={modalConfirmacion.mensaje}
            onConfirmar={modalConfirmacion.onConfirmar}
            onCancelar={modalConfirmacion.onCancelar}
          />
        )}
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
            {esEdicion ? 'Actualiza la información del producto y sus variantes' : 'Completa los datos del nuevo producto y sus tallas'}
          </p>
        </div>
        <button
          onClick={() => {
            setVista('lista');
            setProductoEditar(null);
            setFormulario({
              referencia: '',
              nombre: '',
              categoria: 'Deluxe',
              costo_base: '',
              precio_venta_base: '',
              variantes: []
            });
          }}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X size={20} />
          <span>Cancelar</span>
        </button>
      </div>

<div className="bg-white rounded-xl shadow-sm border p-8 max-w-5xl">
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
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo Base *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="costo_base"
                    value={formulario.costo_base}
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
                  Precio de Venta Base *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="precio_venta_base"
                    value={formulario.precio_venta_base}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
            {formulario.costo_base && formulario.precio_venta_base && (
              <div className="md:col-span-2 bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-800">Margen Base:</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {calcularMargen(parseFloat(formulario.costo_base), parseFloat(formulario.precio_venta_base))}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Tallas / Variantes *</h3>
            <button
              onClick={agregarVariante}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm"
            >
              <Plus size={16} />
              <span>Agregar Talla</span>
            </button>
          </div>

          {formulario.variantes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay tallas agregadas</p>
              <p className="text-gray-400 text-sm mt-1">Haz clic en "Agregar Talla" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formulario.variantes.map((variante, index) => (
                <div key={index} className="bg-gray-50 border rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                      <select
                        value={variante.talla}
                        onChange={(e) => actualizarVariante(index, 'talla', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        {tallasDisponibles.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad Stock</label>
                      <input
                        type="number"
                        value={variante.cantidad}
                        onChange={(e) => actualizarVariante(index, 'cantidad', e.target.value)}
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
                          onChange={(e) => actualizarVariante(index, 'ajuste_precio', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
                      <button
                        onClick={() => eliminarVariante(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar talla"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                  {variante.ajuste_precio !== 0 && formulario.precio_venta_base && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      Precio final para talla {variante.talla}: ${(parseFloat(formulario.precio_venta_base) + parseFloat(variante.ajuste_precio || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 mt-8 pt-6 border-t">
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
              setFormulario({
                referencia: '',
                nombre: '',
                categoria: 'Deluxe',
                costo_base: '',
                precio_venta_base: '',
                variantes: []
              });
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>

      </div>

      {notificacion && notificacion.tipo !== 'exito' && (
        <Notificacion
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onClose={() => setNotificacion(null)}
        />
      )}

    </div>
  );
};

export default Inventario;

