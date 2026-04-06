// src/api/useInventario.js
import { useState, useEffect } from 'react';
import { validarImagen, procesarImagen } from '../utils/imagenUtils';

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

const normalizarTexto = (texto) => {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const useInventario = () => {
  const [vista, setVista] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('Todas');
  const [busquedaTallaExacta, setBusquedaTallaExacta] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [productos, setProductos] = useState([]);
  const [productoEditar, setProductoEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [productosExpandidos, setProductosExpandidos] = useState({});
  const [referenciasExpandidas, setReferenciasExpandidas] = useState({});
  const [errorImagen, setErrorImagen] = useState(null);

  // ✅ NUEVO: Estados para el panel de rotación
  const [panelRotacionAbierto, setPanelRotacionAbierto] = useState(false);
  const [rotacionData, setRotacionData] = useState([]);
  const [cargandoRotacion, setCargandoRotacion] = useState(false);
  const [errorRotacion, setErrorRotacion] = useState(null);
  const [filtroEstadoRotacion, setFiltroEstadoRotacion] = useState('Todos');
  const [searchRotacion, setSearchRotacion] = useState('');
  const [productoRotacionExpandido, setProductoRotacionExpandido] = useState(null);
  const [historialVariante, setHistorialVariante] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

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

  const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

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

  const formularioInicial = {
    referencia: '',
    nombre: '',
    categoria: 'Deluxe',
    costo_base: '',
    precio_venta_base: '',
    precio_calculado: 0,
    variantes: [],
    costos_adicionales: [],
    imagen: null,
    imagenThumbnail: null,
    rutaImagen: null,
    imagenPreview: null,
    cargandoImagen: false,
  };

  const [formulario, setFormulario] = useState(formularioInicial);

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

  useEffect(() => {
    const nuevoPrecioCalculado = calcularPrecioSugerido();
    setFormulario(prev => ({
      ...prev,
      precio_calculado: nuevoPrecioCalculado
    }));
  }, [formulario.costo_base, formulario.costos_adicionales]);

  // ====================================================================
  // ✅ NUEVO: Funciones del panel de rotación
  // ====================================================================

  const abrirPanelRotacion = async () => {
    setPanelRotacionAbierto(true);
    await cargarRotacion();
  };

  const cerrarPanelRotacion = () => {
    setPanelRotacionAbierto(false);
    setProductoRotacionExpandido(null);
    setHistorialVariante(null);
    setSearchRotacion('');
    setFiltroEstadoRotacion('Todos');
  };

  const cargarRotacion = async () => {
    const ipc = getIPC();
    if (!ipc) return;

    try {
      setCargandoRotacion(true);
      setErrorRotacion(null);
      const data = await ipc.invoke('obtener-rotacion-inventario');
      setRotacionData(data);
    } catch (err) {
      console.error('Error al cargar rotación:', err);
      setErrorRotacion('No se pudo cargar la información de rotación');
    } finally {
      setCargandoRotacion(false);
    }
  };

  const cargarHistorialVariante = async (varianteId, talla, nombreProducto) => {
    const ipc = getIPC();
    if (!ipc) return;

    try {
      setCargandoHistorial(true);
      const historial = await ipc.invoke('obtener-historial-variante', varianteId);
      setHistorialVariante({
        varianteId,
        talla,
        nombreProducto,
        datos: historial
      });
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Filtrar datos de rotación por estado y búsqueda
  const rotacionFiltrada = rotacionData.filter(producto => {
    const coincideBusqueda =
      !searchRotacion ||
      producto.nombre.toLowerCase().includes(searchRotacion.toLowerCase()) ||
      producto.referencia.toLowerCase().includes(searchRotacion.toLowerCase());

    const coincideEstado =
      filtroEstadoRotacion === 'Todos' ||
      producto.variantes.some(v => v.estado_rotacion === filtroEstadoRotacion);

    return coincideBusqueda && coincideEstado;
  });

  // Resumen estadístico de rotación
  const resumenRotacion = (() => {
    let sinMovimiento = 0;
    let rotacionLenta = 0;
    let rotacionNormal = 0;
    let nuevos = 0;
    let agotados = 0;
    let promDiasHastaPrimeraVenta = [];
    let promDiasSinVenta = [];

    rotacionData.forEach(producto => {
      producto.variantes.forEach(v => {
        switch (v.estado_rotacion) {
          case 'Sin movimiento': sinMovimiento++; break;
          case 'Rotación lenta': rotacionLenta++; break;
          case 'Rotación normal': rotacionNormal++; break;
          case 'Nuevo': nuevos++; break;
          case 'Agotado': agotados++; break;
        }
        if (v.dias_hasta_primera_venta != null) {
          promDiasHastaPrimeraVenta.push(v.dias_hasta_primera_venta);
        }
        if (v.dias_desde_ultima_venta != null) {
          promDiasSinVenta.push(v.dias_desde_ultima_venta);
        }
      });
    });

    const promedio = arr =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return {
      sinMovimiento,
      rotacionLenta,
      rotacionNormal,
      nuevos,
      agotados,
      promedioDiasHastaPrimeraVenta: promedio(promDiasHastaPrimeraVenta),
      promedioDiasSinVenta: promedio(promDiasSinVenta)
    };
  })();

  // Helper: color del badge de estado
  const getColorEstadoRotacion = (estado) => {
    switch (estado) {
      case 'Sin movimiento': return 'bg-red-100 text-red-700 border border-red-200';
      case 'Rotación lenta': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Rotación normal': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Nuevo': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Agotado': return 'bg-gray-100 text-gray-600 border border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Helper: formatear fecha legible
  const formatearFechaRotacion = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  // ====================================================================
  // Lógica existente (sin cambios)
  // ====================================================================

  const productosFiltrados = productos.filter(p => {
    const terminoBusqueda = searchTerm.toLowerCase();
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(terminoBusqueda) ||
      p.referencia.toLowerCase().includes(terminoBusqueda);
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideTalla =
      tallaFiltro === 'Todas' ||
      !tallaFiltro.trim() ||
      (p.variantes && p.variantes.some(v => {
        const tallaNormalizada = normalizarTexto(v.talla);
        const filtroNormalizado = normalizarTexto(tallaFiltro);
        if (v.cantidad <= 0) return false;
        if (busquedaTallaExacta) {
          return tallaNormalizada === filtroNormalizado;
        } else {
          return tallaNormalizada.includes(filtroNormalizado);
        }
      }));
    return coincideBusqueda && coincideCategoria && coincideTalla;
  });

  const calcularStockTotal = (variantes) => {
    if (!variantes || variantes.length === 0) return 0;
    return variantes.reduce((total, v) => total + v.cantidad, 0);
  };

  const productosAgrupados = productosFiltrados.reduce((grupos, producto) => {
    const clave = `${producto.nombre}-${producto.categoria}`;
    if (!grupos[clave]) {
      grupos[clave] = {
        id: clave,
        nombre: producto.nombre,
        categoria: producto.categoria,
        referencias: [],
        stockTotal: 0,
        imagen: producto.imagen
      };
    }
    grupos[clave].referencias.push(producto);
    grupos[clave].stockTotal += calcularStockTotal(producto.variantes);
    return grupos;
  }, {});

  const productosAgrupadosArray = Object.values(productosAgrupados);

  const toggleExpandirProducto = (productoId) => {
    setProductosExpandidos(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const toggleExpandirReferencia = (referenciaId) => {
    setReferenciasExpandidas(prev => ({
      ...prev,
      [referenciaId]: !prev[referenciaId]
    }));
  };

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

  const handleImagenChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validacion = validarImagen(file, 5);
    if (!validacion.valido) {
      setErrorImagen(validacion.error);
      e.target.value = '';
      return;
    }

    setFormulario(prev => ({ ...prev, cargandoImagen: true }));

    try {
      const imagenProcesada = await procesarImagen(file);
      setFormulario(prev => ({
        ...prev,
        imagen: imagenProcesada.imagenCompleta,
        imagenThumbnail: imagenProcesada.thumbnail,
        imagenPreview: imagenProcesada.thumbnail,
        cargandoImagen: false
      }));
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      setErrorImagen(error.message || 'Error al procesar la imagen');
      e.target.value = '';
      setFormulario(prev => ({ ...prev, cargandoImagen: false }));
    }
  };

  const eliminarImagen = () => {
    setFormulario(prev => ({
      ...prev,
      imagen: null,
      imagenThumbnail: null,
      imagenPreview: null,
      rutaImagen: null
    }));
  };

  const agregarVariante = () => {
    setFormulario(prev => ({
      ...prev,
      variantes: [...prev.variantes, { talla: 'S', cantidad: 0, ajuste_precio: 0, tallaManual: false }]
    }));
  };

  const actualizarVariante = (index, campo, valor) => {
    setFormulario(prev => {
      const nuevasVariantes = [...prev.variantes];
      if (campo === 'talla' && valor === '__MANUAL__') {
        nuevasVariantes[index] = { ...nuevasVariantes[index], talla: '', tallaManual: true };
      } else if (campo === 'tallaManual') {
        nuevasVariantes[index] = {
          ...nuevasVariantes[index],
          tallaManual: valor,
          talla: valor ? nuevasVariantes[index].talla : 'S'
        };
      } else {
        nuevasVariantes[index] = { ...nuevasVariantes[index], [campo]: valor };
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

  const agregarCostoAdicional = () => {
    setFormulario(prev => ({
      ...prev,
      costos_adicionales: [...prev.costos_adicionales, { concepto: '', monto: 0, conceptoManual: false }]
    }));
  };

  const actualizarCostoAdicional = (index, campo, valor) => {
    setFormulario(prev => {
      const nuevosCostos = [...prev.costos_adicionales];
      if (campo === 'concepto' && valor === '__MANUAL__') {
        nuevosCostos[index] = { ...nuevosCostos[index], concepto: '', conceptoManual: true };
      } else if (campo === 'conceptoManual') {
        nuevosCostos[index] = {
          ...nuevosCostos[index],
          conceptoManual: valor,
          concepto: valor ? nuevosCostos[index].concepto : ''
        };
      } else {
        nuevosCostos[index] = { ...nuevosCostos[index], [campo]: valor };
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

  const calcularTotalCostosAdicionales = () => {
    return formulario.costos_adicionales.reduce((total, costo) => {
      return total + (parseFloat(costo.monto) || 0);
    }, 0);
  };

  const calcularPrecioSugerido = () => {
    const costoBase = parseFloat(formulario.costo_base) || 0;
    const totalCostosAdicionales = calcularTotalCostosAdicionales();
    const precioCalculado = (costoBase / 0.65) + totalCostosAdicionales;
    return Math.ceil(precioCalculado / 1000) * 1000;
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
      precio_calculado: calcularPrecioSugerido(),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      })),
      costos_adicionales: formulario.costos_adicionales
        .filter(c => c.concepto.trim() !== '')
        .map(c => ({ concepto: c.concepto.trim(), monto: parseFloat(c.monto) })),
      imagen: formulario.imagen ? {
        name: `${formulario.referencia}_${Date.now()}.jpg`,
        data: formulario.imagen,
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
      precio_calculado: producto.precio_calculado || 0,
      variantes: producto.variantes.map(v => ({
        talla: v.talla,
        cantidad: v.cantidad,
        ajuste_precio: v.ajuste_precio || 0,
        tallaManual: !tallasDisponibles.includes(v.talla)
      })),
      costos_adicionales: (producto.costos_adicionales || []).map(c => ({
        concepto: c.concepto,
        monto: c.monto,
        conceptoManual: !conceptosCostosDisponibles.includes(c.concepto)
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
      precio_calculado: calcularPrecioSugerido(),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      })),
      costos_adicionales: formulario.costos_adicionales
        .filter(c => c.concepto.trim() !== '')
        .map(c => ({ concepto: c.concepto.trim(), monto: parseFloat(c.monto) })),
      imagen: formulario.imagen ? {
        name: `${formulario.referencia}_${Date.now()}.jpg`,
        data: formulario.imagen,
        thumbnail: formulario.imagenThumbnail
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
    // Estados existentes
    vista,
    setVista,
    searchTerm,
    setSearchTerm,
    busquedaTallaExacta,
    setBusquedaTallaExacta,
    tallaFiltro,
    setTallaFiltro,
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
    referenciasExpandidas,
    formulario,
    errorImagen,
    setErrorImagen,

    // Constantes
    categorias,
    tallasDisponibles,
    conceptosCostosDisponibles,

    // Datos computados
    productosFiltrados,
    productosAgrupados: productosAgrupadosArray,
    totalProductos,
    stockBajo,
    agotados,
    totalUnidades,

    // Funciones existentes
    cargarProductos,
    toggleExpandirProducto,
    toggleExpandirReferencia,
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
    calcularPrecioSugerido,
    resetFormulario,
    handleGuardarProducto,
    handleEditarProducto,
    handleActualizarProducto,
    handleEliminarProducto,
    handleCancelar,

    // ✅ NUEVO: Panel de rotación
    panelRotacionAbierto,
    abrirPanelRotacion,
    cerrarPanelRotacion,
    cargarRotacion,
    rotacionData,
    rotacionFiltrada,
    resumenRotacion,
    cargandoRotacion,
    errorRotacion,
    filtroEstadoRotacion,
    setFiltroEstadoRotacion,
    searchRotacion,
    setSearchRotacion,
    productoRotacionExpandido,
    setProductoRotacionExpandido,
    historialVariante,
    setHistorialVariante,
    cargandoHistorial,
    cargarHistorialVariante,
    getColorEstadoRotacion,
    formatearFechaRotacion
  };
};