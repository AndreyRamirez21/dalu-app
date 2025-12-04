// src/api/useInventario.js
import { useState, useEffect } from 'react';

// Helper para IPC de Electron
const getIPC = () => {
  try {
    // Intentar acceder a electron desde window.require
    if (typeof window !== 'undefined' && window.require) {
      const electron = window.require('electron');
      return electron.ipcRenderer;
    }

    // Fallback: verificar si ipcRenderer está disponible directamente
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      return window.ipcRenderer;
    }

    console.warn('IPC no disponible - no estamos en entorno Electron');
    return null;
  } catch (error) {
    console.error('Error al acceder a IPC:', error);
    return null;
  }
};
export const useInventario = () => {
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
    variantes: [],
    imagen: null,
    imagenPreview: null
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

  // Cargar productos al montar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Productos filtrados
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

  // Estadísticas
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  // ✅ CORREGIDO: Manejo de imagen mejorado
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setNotificacion({ mensaje: 'Por favor selecciona una imagen válida (JPG, PNG, etc.)', tipo: 'advertencia' });
      e.target.value = ''; // Limpiar input
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotificacion({ mensaje: 'La imagen no debe pesar más de 5MB', tipo: 'advertencia' });
      e.target.value = ''; // Limpiar input
      return;
    }

    // Leer archivo para preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormulario(prev => ({
        ...prev,
        imagen: file,
        imagenPreview: event.target.result // Base64 completo con data:image/...
      }));
    };
    reader.readAsDataURL(file);
  };

  // ✅ CORREGIDO: Eliminar imagen
  const eliminarImagen = () => {
    setFormulario(prev => ({
      ...prev,
      imagen: null,
      imagenPreview: null
    }));

    // Limpiar el input file
    const inputFile = document.querySelector('input[type="file"][accept="image/*"]');
    if (inputFile) {
      inputFile.value = '';
    }
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

  const resetFormulario = () => {
    setFormulario(formularioInicial);
    setProductoEditar(null);
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
      })),
      imagen: formulario.imagen ? {
        name: formulario.imagen.name,
        data: formulario.imagenPreview // Base64
      } : null
    };

    try {
      await ipc.invoke('agregar-producto', nuevoProducto);
      await cargarProductos();
      resetFormulario();
      setVista('lista');
      setTimeout(() => {
        setNotificacion({ mensaje: 'Producto agregado exitosamente', tipo: 'exito' });
      }, 300);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setNotificacion({ mensaje: 'Error al guardar el producto: ' + err.message, tipo: 'error' });
    }
  };

  // ✅ CORREGIDO: Cargar imagen al editar
  const handleEditarProducto = async (producto) => {
    const ipc = getIPC();

    setProductoEditar(producto);

    // Cargar preview de imagen si existe
    let imagenPreview = null;
    if (producto.imagen && ipc) {
      try {
        imagenPreview = await ipc.invoke('cargar-imagen', producto.imagen);
      } catch (error) {
        console.error('Error al cargar imagen:', error);
      }
    }

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
      })),
      imagen: null, // No enviamos el archivo, solo si se selecciona uno nuevo
      imagenPreview: imagenPreview // Base64 de la imagen existente
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
      })),
      // Solo enviamos imagen si se seleccionó una nueva
      imagen: formulario.imagen ? {
        name: formulario.imagen.name,
        data: formulario.imagenPreview
      } : null
    };

    try {
      await ipc.invoke('actualizar-producto', productoEditar.id, datosActualizados);
      await cargarProductos();
      resetFormulario();
      setNotificacion({ mensaje: 'Producto actualizado exitosamente', tipo: 'exito' });
      setVista('lista');
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      setNotificacion({ mensaje: 'Error al guardar el producto: ' + err.message, tipo: 'error' });
    }
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

  const handleCancelar = () => {
    setVista('lista');
    resetFormulario();
  };

  return {
    // Estados
    vista,
    setVista,
    searchTerm,
    setSearchTerm,
    categoriaActiva,
    setCategoriaActiva,
    productos,
    productoEditar,
    cargando,
    error,
    notificacion,
    setNotificacion,
    modalConfirmacion,
    productosExpandidos,
    formulario,

    // Constantes
    categorias,
    tallasDisponibles,

    // Datos computados
    productosFiltrados,
    totalProductos,
    stockBajo,
    agotados,

    // Funciones
    cargarProductos,
    toggleExpandirProducto,
    calcularStockTotal,
    getEstadoStyle,
    getEstadoTexto,
    handleInputChange,
    handleImagenChange, // ✅ Ahora exportada correctamente
    eliminarImagen, // ✅ Ahora exportada correctamente
    agregarVariante,
    actualizarVariante,
    eliminarVariante,
    resetFormulario,
    handleGuardarProducto,
    handleEditarProducto,
    handleActualizarProducto,
    handleEliminarProducto,
    handleCancelar
  };
};