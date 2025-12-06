// src/api/useGastos.js
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

export const useGastos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las Categorias');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [gastos, setGastos] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoria: 'Proveedores',
    monto: '',
    metodo_pago: 'Efectivo',
    proveedor: '',
    notas: ''
  });

  const categorias = [
    { nombre: 'Todas las Categorias', color: 'text-gray-700' },
    { nombre: 'Proveedores', color: 'text-orange-600' },
    { nombre: 'Marketing', color: 'text-purple-600' },
    { nombre: 'Logistica', color: 'text-blue-600' },
    { nombre: 'Servicios', color: 'text-pink-600' },
    { nombre: 'Renta de Local', color: 'text-green-600' },
    { nombre: 'Otros', color: 'text-gray-600' }
  ];

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

  // Cargar gastos
  const cargarGastos = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await ipc.invoke('obtener-gastos');
      setGastos(data || []);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadisticas
  const cargarEstadisticas = async () => {
    const ipc = getIPC();
    if (!ipc) return;

    try {
      const stats = await ipc.invoke('obtener-estadisticas-gastos');
      setEstadisticas(stats || []);
    } catch (error) {
      console.error('Error al cargar estadisticas:', error);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    cargarGastos();
    cargarEstadisticas();
  }, []);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      categoria: 'Proveedores',
      monto: '',
      metodo_pago: 'Efectivo',
      proveedor: '',
      notas: ''
    });
    setEditingGasto(null);
  };

  // Guardar o actualizar gasto
  const handleSubmit = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    if (!formData.descripcion || !formData.monto) {
      setNotificacion({ mensaje: 'Por favor completa los campos obligatorios', tipo: 'advertencia' });
      return;
    }

    try {
      if (editingGasto) {
        await ipc.invoke('actualizar-gasto', editingGasto.id, formData);
      } else {
        await ipc.invoke('agregar-gasto', formData);
      }

      setShowModal(false);
      resetForm();
      cargarGastos();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      setNotificacion({ mensaje: 'Error al guardar el gasto', tipo: 'error' });
    }
  };

  // Editar gasto
  const handleEdit = (gasto) => {
    setEditingGasto(gasto);
    setFormData({
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      categoria: gasto.categoria,
      monto: gasto.monto.toString(),
      metodo_pago: gasto.metodo_pago,
      proveedor: gasto.proveedor || '',
      notas: gasto.notas || ''
    });
    setShowModal(true);
  };

  // Eliminar gasto
  const handleDelete = async (id) => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    if (window.confirm('Estas seguro de eliminar este gasto?')) {
      try {
        await ipc.invoke('eliminar-gasto', id);
        cargarGastos();
        cargarEstadisticas();
      } catch (error) {
        console.error('Error al eliminar gasto:', error);
      }
    }
  };

  // Obtener color de categoria
  const getCategoriaColor = (categoria) => {
    const colors = {
      'Proveedores': 'bg-orange-100 text-orange-700',
      'Marketing': 'bg-purple-100 text-purple-700',
      'Logistica': 'bg-blue-100 text-blue-700',
      'Servicios': 'bg-pink-100 text-pink-700',
      'Renta de Local': 'bg-green-100 text-green-700',
      'Otros': 'bg-gray-100 text-gray-700'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    const matchSearch = gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gasto.proveedor && gasto.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = selectedCategory === 'Todas las Categorias' || gasto.categoria === selectedCategory;

    // Filtro por rango de fechas
    let matchFecha = true;
    if (fechaInicio || fechaFin) {
      const fechaGasto = new Date(gasto.fecha + 'T00:00:00');

      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio + 'T00:00:00');
        const fin = new Date(fechaFin + 'T23:59:59');
        matchFecha = fechaGasto >= inicio && fechaGasto <= fin;
      } else if (fechaInicio) {
        const inicio = new Date(fechaInicio + 'T00:00:00');
        matchFecha = fechaGasto >= inicio;
      } else if (fechaFin) {
        const fin = new Date(fechaFin + 'T23:59:59');
        matchFecha = fechaGasto <= fin;
      }
    }

    return matchSearch && matchCategory && matchFecha;
  });

  // Total de gastos filtrados
  const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);

  // Contar gastos por categoria
  const getCategoriaCount = (nombreCategoria) => {
    if (nombreCategoria === 'Todas las Categorias') return gastos.length;
    return gastos.filter(g => g.categoria === nombreCategoria).length;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Limpiar filtros de fecha
  const limpiarFiltrosFecha = () => {
    setFechaInicio('');
    setFechaFin('');
  };

  // Obtener gasto mas alto del mes actual
  const getGastoMasAlto = () => {
    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();

    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha + 'T00:00:00');
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    if (gastosDelMes.length === 0) return null;

    return gastosDelMes.reduce((max, gasto) =>
      parseFloat(gasto.monto) > parseFloat(max.monto) ? gasto : max
    );
  };

  // Calcular gasto promedio por dia del mes actual
  const getGastoPromedioPorDia = () => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    const diaActual = hoy.getDate();

    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha + 'T00:00:00');
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    const totalMes = gastosDelMes.reduce((sum, g) => sum + parseFloat(g.monto), 0);

    return diaActual > 0 ? totalMes / diaActual : 0;
  };

  // Calcular proyeccion de gasto mensual
  const getProyeccionMensual = () => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    const diaActual = hoy.getDate();
    const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate();

    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha + 'T00:00:00');
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    const totalMes = gastosDelMes.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const promedioDiario = diaActual > 0 ? totalMes / diaActual : 0;

    return promedioDiario * diasDelMes;
  };

  // Calcular comparacion con mes anterior
  const getComparacionMesAnterior = () => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Gastos mes actual
    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha + 'T00:00:00');
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    // Gastos mes anterior
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;

    const gastosMesAnterior = gastos.filter(g => {
      const fecha = new Date(g.fecha + 'T00:00:00');
      return fecha.getMonth() === mesAnterior && fecha.getFullYear() === anioAnterior;
    });

    const totalMesActual = gastosDelMes.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const totalMesAnterior = gastosMesAnterior.reduce((sum, g) => sum + parseFloat(g.monto), 0);

    if (totalMesAnterior === 0) return null;

    const porcentajeCambio = ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100;

    return {
      porcentaje: porcentajeCambio,
      totalActual: totalMesActual,
      totalAnterior: totalMesAnterior,
      esAumento: porcentajeCambio > 0
    };
  };

  // Exportar gastos a Excel
  const exportarGastosExcel = () => {
    const XLSX = require('xlsx');

    // Preparar los datos para Excel
    const datosExcel = gastosFiltrados.map(gasto => ({
      'Fecha': formatDate(gasto.fecha),
      'Descripcion': gasto.descripcion,
      'Categoria': gasto.categoria,
      'Metodo de Pago': gasto.metodo_pago,
      'Proveedor': gasto.proveedor || 'N/A',
      'Monto': `$${parseFloat(gasto.monto).toFixed(2)}`,
      'Notas': gasto.notas || ''
    }));

    // Agregar fila de total
    datosExcel.push({
      'Fecha': '',
      'Descripcion': '',
      'Categoria': '',
      'Metodo de Pago': '',
      'Proveedor': 'TOTAL',
      'Monto': `$${totalGastos.toFixed(2)}`,
      'Notas': ''
    });

    // Crear libro de Excel
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datosExcel);

    // Ajustar ancho de columnas
    const anchoColumnas = [
      { wch: 15 }, // Fecha
      { wch: 35 }, // Descripcion
      { wch: 18 }, // Categoria
      { wch: 18 }, // Metodo de Pago
      { wch: 25 }, // Proveedor
      { wch: 15 }, // Monto
      { wch: 30 }  // Notas
    ];
    hoja['!cols'] = anchoColumnas;

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(libro, hoja, 'Gastos');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `gastos_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(libro, nombreArchivo);
  };

  return {
    // Estados
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    gastos,
    estadisticas,
    loading,
    showModal,
    setShowModal,
    editingGasto,
    formData,
    notificacion,
    setNotificacion,
    setFormData,

    // Constantes
    categorias,
    metodosPago,

    // Datos computados
    gastosFiltrados,
    totalGastos,

    // Funciones
    cargarGastos,
    cargarEstadisticas,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
    getCategoriaColor,
    getCategoriaCount,
    formatDate,
    exportarGastosExcel,
    limpiarFiltrosFecha,
    getGastoMasAlto,
    getGastoPromedioPorDia,
    getProyeccionMensual,
    getComparacionMesAnterior
  };
};