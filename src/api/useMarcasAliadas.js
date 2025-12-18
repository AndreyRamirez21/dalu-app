// src/api/useMarcasAliadas.js
import { useState, useEffect } from 'react';

const getIPC = () => {
  try {
    if (typeof window !== 'undefined' && window.require) {
      const electron = window.require('electron');
      return electron.ipcRenderer;
    }
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      return window.ipcRenderer;
    }
    console.warn('IPC no disponible');
    return null;
  } catch (error) {
    console.error('Error al acceder a IPC:', error);
    return null;
  }
};

export const useMarcasAliadas = () => {
  const [vista, setVista] = useState('lista'); // lista, agregar, editar, productos
  const [marcas, setMarcas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [productosMarca, setProductosMarca] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  const formularioMarcaInicial = {
    nombre: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    porcentaje_comision: '0',
    notas: '',
    activo: true
  };

  const [formularioMarca, setFormularioMarca] = useState(formularioMarcaInicial);

  // Categorías disponibles (las mismas que tu inventario)
  const categorias = [
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

  const tallasDisponibles = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'
  ];

  // ==================== CARGAR MARCAS ====================
  const cargarMarcas = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setError('Electron IPC no disponible');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const marcasDB = await ipc.invoke('obtener-marcas-aliadas');
      setMarcas(marcasDB);
      setError(null);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
      setError('Error al cargar marcas aliadas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMarcas();
  }, []);

  // ==================== GESTIÓN DE MARCAS ====================
  const handleInputMarcaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormularioMarca(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardarMarca = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    if (!formularioMarca.nombre.trim()) {
      setNotificacion({ mensaje: 'El nombre de la marca es obligatorio', tipo: 'advertencia' });
      return;
    }

    const marcaExiste = marcas.some(m =>
      m.nombre.toLowerCase() === formularioMarca.nombre.trim().toLowerCase()
    );
    if (marcaExiste) {
      setNotificacion({ mensaje: 'Ya existe una marca con ese nombre', tipo: 'error' });
      return;
    }

    const nuevaMarca = {
      nombre: formularioMarca.nombre.trim(),
      contacto_nombre: formularioMarca.contacto_nombre.trim(),
      contacto_telefono: formularioMarca.contacto_telefono.trim(),
      contacto_email: formularioMarca.contacto_email.trim(),
      porcentaje_comision: parseFloat(formularioMarca.porcentaje_comision) || 0,
      notas: formularioMarca.notas.trim(),
      activo: formularioMarca.activo ? 1 : 0
    };

    try {
      await ipc.invoke('agregar-marca-aliada', nuevaMarca);
      await cargarMarcas();
      setFormularioMarca(formularioMarcaInicial);
      setVista('lista');
      setTimeout(() => {
        setNotificacion({ mensaje: 'Marca aliada agregada exitosamente', tipo: 'exito' });
      }, 300);
    } catch (err) {
      console.error('Error al guardar marca:', err);
      setNotificacion({ mensaje: 'Error al guardar la marca: ' + err.message, tipo: 'error' });
    }
  };

  const handleEditarMarca = (marca) => {
    setFormularioMarca({
      nombre: marca.nombre,
      contacto_nombre: marca.contacto_nombre || '',
      contacto_telefono: marca.contacto_telefono || '',
      contacto_email: marca.contacto_email || '',
      porcentaje_comision: marca.porcentaje_comision.toString(),
      notas: marca.notas || '',
      activo: marca.activo === 1
    });
    setMarcaSeleccionada(marca);
    setVista('editar');
  };

  const handleActualizarMarca = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    if (!formularioMarca.nombre.trim()) {
      setNotificacion({ mensaje: 'El nombre de la marca es obligatorio', tipo: 'advertencia' });
      return;
    }

    const marcaExiste = marcas.some(m =>
      m.nombre.toLowerCase() === formularioMarca.nombre.trim().toLowerCase() &&
      m.id !== marcaSeleccionada.id
    );
    if (marcaExiste) {
      setNotificacion({ mensaje: 'Ya existe otra marca con ese nombre', tipo: 'error' });
      return;
    }

    const datosActualizados = {
      nombre: formularioMarca.nombre.trim(),
      contacto_nombre: formularioMarca.contacto_nombre.trim(),
      contacto_telefono: formularioMarca.contacto_telefono.trim(),
      contacto_email: formularioMarca.contacto_email.trim(),
      porcentaje_comision: parseFloat(formularioMarca.porcentaje_comision) || 0,
      notas: formularioMarca.notas.trim(),
      activo: formularioMarca.activo ? 1 : 0
    };

    try {
      await ipc.invoke('actualizar-marca-aliada', marcaSeleccionada.id, datosActualizados);
      await cargarMarcas();
      setFormularioMarca(formularioMarcaInicial);
      setMarcaSeleccionada(null);
      setNotificacion({ mensaje: 'Marca actualizada exitosamente', tipo: 'exito' });
      setVista('lista');
    } catch (err) {
      console.error('Error al actualizar marca:', err);
      setNotificacion({ mensaje: 'Error al actualizar la marca: ' + err.message, tipo: 'error' });
    }
  };

  const handleEliminarMarca = async (id) => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    setModalConfirmacion({
      mensaje: '¿Estás seguro de eliminar esta marca aliada? Se eliminarán también todos sus productos. Esta acción no se puede deshacer.',
      onConfirmar: async () => {
        setModalConfirmacion(null);
        try {
          await ipc.invoke('eliminar-marca-aliada', id);
          await cargarMarcas();
          setNotificacion({ mensaje: 'Marca eliminada exitosamente', tipo: 'exito' });
        } catch (err) {
          console.error('Error al eliminar marca:', err);
          setNotificacion({ mensaje: 'Error al eliminar la marca: ' + err.message, tipo: 'error' });
        }
      },
      onCancelar: () => setModalConfirmacion(null)
    });
  };

  const handleVerProductos = async (marca) => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    try {
      setMarcaSeleccionada(marca);
      const productos = await ipc.invoke('obtener-productos-marca-aliada', marca.id);
      setProductosMarca(productos);
      setVista('productos');
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setNotificacion({ mensaje: 'Error al cargar productos de la marca', tipo: 'error' });
    }
  };

  const handleCancelar = () => {
    setVista('lista');
    setFormularioMarca(formularioMarcaInicial);
    setMarcaSeleccionada(null);
  };

  // ==================== ESTADÍSTICAS ====================
  const totalMarcas = marcas.length;
  const marcasActivas = marcas.filter(m => m.activo === 1).length;
  const totalProductosMarcas = marcas.reduce((sum, m) => sum + (m.total_productos || 0), 0);

  return {
    // Estados
    vista,
    setVista,
    marcas,
    marcaSeleccionada,
    productosMarca,
    cargando,
    error,
    notificacion,
    setNotificacion,
    modalConfirmacion,
    formularioMarca,

    // Constantes
    categorias,
    tallasDisponibles,

    // Estadísticas
    totalMarcas,
    marcasActivas,
    totalProductosMarcas,

    // Funciones
    cargarMarcas,
    handleInputMarcaChange,
    handleGuardarMarca,
    handleEditarMarca,
    handleActualizarMarca,
    handleEliminarMarca,
    handleVerProductos,
    handleCancelar
  };
};