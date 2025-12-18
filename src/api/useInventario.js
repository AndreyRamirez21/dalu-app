// src/api/useInventario.js
import { useState, useEffect } from 'react';

// Helper para IPC de Electron
const getIPC = () => {
  try {
    if (typeof window !== 'undefined' && window.require) {
      const electron = window.require('electron');
      return electron.ipcRenderer;
    }
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
  const [referenciasExpandidas, setReferenciasExpandidas] = useState({}); // ← NUEVO


  // ✅ ACTUALIZADO: Nuevas categorías agregadas
  const categorias = [
    'Todos',
    'Deluxe',
    'Essence',
    'Pantuflas',
    'Antifaces',
    'Humidificadores',
    'Fundas',
    'Scrunchies',
    'Rizadores',
    'Gorros en Satín',
    'Lámparas',
    'Cuelleros',
    'Varios'
  ];

  // ✅ ACTUALIZADO: Solo tallas de ropa (sin números de calzado)
  const tallasDisponibles = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'
  ];

  // ✅ NUEVO: Conceptos predefinidos para costos adicionales
  const conceptosCostosDisponibles = [
    'Bolsa protectora',
    'Bolsa de despacho',
    'Etiqueta tarjeta',
    'Sticker',
    'Olor',
    'Etiqueta de referencia',
    'Marquilla',
    'Hilo',
    'Protector zona v',
    'Envio',
    'Costo extra (bolsa de regalo decoración personalizada)'
  ];

  // ✅ ACTUALIZADO: Formulario inicial con costos adicionales
const formularioInicial = {
  referencia: '',
  nombre: '',
  categoria: 'Deluxe',
  costo_base: '',
  precio_venta_base: '',
  precio_calculado: 0,  // ← AGREGAR ESTO
  variantes: [],
  costos_adicionales: [],
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

  useEffect(() => {
    cargarProductos();
  }, []);

  // ✅ NUEVO: Actualizar precio_calculado cuando cambien los costos
  useEffect(() => {
    const nuevoPrecioCalculado = calcularPrecioSugerido();
    setFormulario(prev => ({
      ...prev,
      precio_calculado: nuevoPrecioCalculado
    }));
  }, [formulario.costo_base, formulario.costos_adicionales]);

  // Productos filtrados
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

    const calcularStockTotal = (variantes) => {
      if (!variantes || variantes.length === 0) return 0;
      return variantes.reduce((total, v) => total + v.cantidad, 0);
    };



// ✅ NUEVO: Agrupar productos por nombre
const productosAgrupados = productosFiltrados.reduce((grupos, producto) => {
  const clave = `${producto.nombre}-${producto.categoria}`; // Agrupar por nombre + categoría

  if (!grupos[clave]) {
    grupos[clave] = {
      id: clave, // ID único para el grupo
      nombre: producto.nombre,
      categoria: producto.categoria,
      referencias: [],
      stockTotal: 0,
      imagen: producto.imagen // Tomar la primera imagen encontrada
    };
  }

  // Agregar esta referencia al grupo
  grupos[clave].referencias.push(producto);
  grupos[clave].stockTotal += calcularStockTotal(producto.variantes);

  return grupos;
}, {});

// Convertir objeto a array
const productosAgrupadosArray = Object.values(productosAgrupados);


  const toggleExpandirProducto = (productoId) => {
    setProductosExpandidos(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  // ✅ NUEVO: Toggle para referencias individuales
  const toggleExpandirReferencia = (referenciaId) => {
    setReferenciasExpandidas(prev => ({
      ...prev,
      [referenciaId]: !prev[referenciaId]
    }));
  };


  // Estadísticas
  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => {
    const stockTotal = calcularStockTotal(p.variantes);
    return stockTotal > 0 && stockTotal <= 2;
  }).length;
  const agotados = productos.filter(p => calcularStockTotal(p.variantes) === 0).length;

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

  const totalUnidades = productos.reduce((total, producto) => {
    return total + calcularStockTotal(producto.variantes);
  }, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotificacion({ mensaje: 'Por favor selecciona una imagen válida (JPG, PNG, etc.)', tipo: 'advertencia' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotificacion({ mensaje: 'La imagen no debe pesar más de 5MB', tipo: 'advertencia' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormulario(prev => ({
        ...prev,
        imagen: file,
        imagenPreview: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const eliminarImagen = () => {
    setFormulario(prev => ({
      ...prev,
      imagen: null,
      imagenPreview: null
    }));

    const inputFile = document.querySelector('input[type="file"][accept="image/*"]');
    if (inputFile) {
      inputFile.value = '';
    }
  };

  // ✅ ACTUALIZADO: Agregar variante con control de modo manual
  const agregarVariante = () => {
    setFormulario(prev => ({
      ...prev,
      variantes: [...prev.variantes, { talla: 'S', cantidad: 0, ajuste_precio: 0, tallaManual: false }]
    }));
  };
const actualizarVariante = (index, campo, valor) => {
  setFormulario(prev => {
    const nuevasVariantes = [...prev.variantes];

    // Si se está cambiando la talla y es "manual", activar modo manual
    if (campo === 'talla' && valor === '__MANUAL__') {
      nuevasVariantes[index] = {
        ...nuevasVariantes[index],
        talla: '',
        tallaManual: true
      };
    } else if (campo === 'tallaManual') {
      // Permite desactivar el modo manual
      nuevasVariantes[index] = {
        ...nuevasVariantes[index],
        tallaManual: valor,
        talla: valor ? nuevasVariantes[index].talla : 'S'
      };
    } else {
      // Para cualquier otro cambio (incluido escribir en el input)
      nuevasVariantes[index] = {
        ...nuevasVariantes[index],
        [campo]: valor
      };
    }

    return { ...prev, variantes: nuevasVariantes };
  });
};

  const eliminarVariante = (index) => {
    setFormulario(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index)
    }));
  };

  // ✅ ACTUALIZADO: Agregar costo adicional con control de modo manual
  const agregarCostoAdicional = () => {
    setFormulario(prev => ({
      ...prev,
      costos_adicionales: [
        ...prev.costos_adicionales,
        { concepto: '', monto: 0, conceptoManual: false }
      ]
    }));
  };

  const actualizarCostoAdicional = (index, campo, valor) => {
    setFormulario(prev => {
      const nuevosCostos = [...prev.costos_adicionales];

      // Si se está cambiando el concepto y es "manual", activar modo manual
      if (campo === 'concepto' && valor === '__MANUAL__') {
        nuevosCostos[index] = {
          ...nuevosCostos[index],
          concepto: '',
          conceptoManual: true
        };
      } else if (campo === 'conceptoManual') {
        // Permite desactivar el modo manual
        nuevosCostos[index] = {
          ...nuevosCostos[index],
          conceptoManual: valor,
          concepto: valor ? nuevosCostos[index].concepto : ''
        };
      } else {
        // Para cualquier otro cambio (incluido escribir en el input)
        nuevosCostos[index] = {
          ...nuevosCostos[index],
          [campo]: valor
        };
      }

      return { ...prev, costos_adicionales: nuevosCostos };
    });
  };
  const eliminarCostoAdicional = (index) => {
    setFormulario(prev => ({
      ...prev,
      costos_adicionales: prev.costos_adicionales.filter((_, i) => i !== index)
    }));
  };

  // ✅ NUEVO: Calcular total de costos adicionales
  const calcularTotalCostosAdicionales = () => {
    return formulario.costos_adicionales.reduce((total, costo) => {
      return total + (parseFloat(costo.monto) || 0);
    }, 0);
  };

const calcularPrecioSugerido = () => {
  const costoBase = parseFloat(formulario.costo_base) || 0;
  const totalCostosAdicionales = calcularTotalCostosAdicionales();

  // ✅ margen SOLO al costo base
  const precioCalculado = (costoBase / 0.65) + totalCostosAdicionales;

  // Redondear a miles
  const precioRedondeado = Math.ceil(precioCalculado / 1000) * 1000;

  return precioRedondeado;
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

// ✅ ACTUALIZADO: Preparar datos con costos adicionales y precio calculado
const nuevoProducto = {
  referencia: formulario.referencia.trim(),
  nombre: formulario.nombre.trim(),
  categoria: formulario.categoria,
  costo_base: parseFloat(formulario.costo_base),
  precio_calculado: calcularPrecioSugerido(),  // ← AGREGAR ESTO
  precio_venta_base: parseFloat(formulario.precio_venta_base),
  variantes: formulario.variantes.map(v => ({
    talla: v.talla,
    cantidad: parseInt(v.cantidad),
    ajuste_precio: parseFloat(v.ajuste_precio) || 0
  })),
  costos_adicionales: formulario.costos_adicionales
    .filter(c => c.concepto.trim() !== '')
    .map(c => ({
      concepto: c.concepto.trim(),
      monto: parseFloat(c.monto)
    })),
  imagen: formulario.imagen ? {
    name: formulario.imagen.name,
    data: formulario.imagenPreview
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

  const handleEditarProducto = async (producto) => {
    const ipc = getIPC();

    setProductoEditar(producto);

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
  precio_calculado: producto.precio_calculado || 0,  // ← AGREGAR ESTO
  variantes: producto.variantes.map(v => ({
    talla: v.talla,
    cantidad: v.cantidad,
    ajuste_precio: v.ajuste_precio || 0,
    tallaManual: false
  })),
  costos_adicionales: (producto.costos_adicionales || []).map(c => ({
    concepto: c.concepto,
    monto: c.monto,
    conceptoManual: false
  })),
  imagen: null,
  imagenPreview: imagenPreview
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
  precio_calculado: calcularPrecioSugerido(),  // ← AGREGAR ESTO
  precio_venta_base: parseFloat(formulario.precio_venta_base),
  variantes: formulario.variantes.map(v => ({
    talla: v.talla,
    cantidad: parseInt(v.cantidad),
    ajuste_precio: parseFloat(v.ajuste_precio) || 0
  })),
  costos_adicionales: formulario.costos_adicionales
    .filter(c => c.concepto.trim() !== '')
    .map(c => ({
      concepto: c.concepto.trim(),
      monto: parseFloat(c.monto)
    })),
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
    referenciasExpandidas, // ← AGREGAR ESTO
    formulario,

    // Constantes
    categorias,
    tallasDisponibles,
    conceptosCostosDisponibles,

    // Datos computados
    productosFiltrados,
    productosAgrupados: productosAgrupadosArray, // ← AGREGAR ESTO

    totalProductos,
    stockBajo,
    agotados,

    // Funciones
    cargarProductos,
    totalUnidades,
    toggleExpandirProducto,
    toggleExpandirReferencia, // ← AGREGAR ESTO
    calcularStockTotal,
    getEstadoStyle,
    getEstadoTexto,
    handleInputChange,
    handleImagenChange,
    eliminarImagen,
    agregarVariante,
    actualizarVariante,
    eliminarVariante,
    agregarCostoAdicional,
    actualizarCostoAdicional,
    eliminarCostoAdicional,
    calcularTotalCostosAdicionales,
    calcularPrecioSugerido,  // ← AGREGAR ESTO
    resetFormulario,
    handleGuardarProducto,
    handleEditarProducto,
    handleActualizarProducto,
    handleEliminarProducto,
    handleCancelar
  };
};