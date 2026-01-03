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


// Función auxiliar para obtener fecha local en formato YYYY-MM-DD
const getFechaLocal = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
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
  const [modalConfirmacion, setModalConfirmacion] = useState(null);


const [formData, setFormData] = useState({
  fecha: getFechaLocal(), // ✅ CAMBIADO
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

const resetForm = () => {
  setFormData({
    fecha: getFechaLocal(), // ✅ CAMBIADO
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
const handleDelete = async (gasto) => {
  // Mostrar modal de confirmación
  setModalConfirmacion({
    mensaje: `¿Estás seguro de eliminar el gasto "${gasto.descripcion}"?`,
    onConfirmar: async () => {
      const ipc = getIPC();
      if (!ipc) {
        setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
        setModalConfirmacion(null);
        return;
      }

      try {
        await ipc.invoke('eliminar-gasto', gasto.id);
        await cargarGastos();
        await cargarEstadisticas();
        setNotificacion({ mensaje: 'Gasto eliminado exitosamente', tipo: 'exito' });
      } catch (error) {
        console.error('Error al eliminar gasto:', error);
        setNotificacion({ mensaje: 'Error al eliminar el gasto', tipo: 'error' });
      } finally {
        setModalConfirmacion(null);
      }
    },
    onCancelar: () => {
      setModalConfirmacion(null);
    }
  });
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

const exportarGastosExcel = () => {
  const XLSX = require('sheetjs-style');

  // Preparar los datos para Excel
  const datosExcel = gastosFiltrados.map(gasto => ({
    Fecha: formatDate(gasto.fecha),
    Descripcion: gasto.descripcion,
    Categoria: gasto.categoria,
    MetodoPago: gasto.metodo_pago,
    Proveedor: gasto.proveedor || 'N/A',
    Monto: parseFloat(gasto.monto),
    Notas: gasto.notas || ''
  }));

  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.json_to_sheet(datosExcel);

  // ===== CALCULAR TOTALES =====
  const totalMonto = datosExcel.reduce((sum, item) => sum + (item.Monto || 0), 0);
  const filaTotales = datosExcel.length + 1;

  // Agregar fila de totales
  XLSX.utils.sheet_add_aoa(hoja, [[
    "", // Fecha
    "", // Descripcion
    "", // Categoria
    "", // MetodoPago
    "TOTAL", // Proveedor
    totalMonto, // Monto
    "" // Notas
  ]], {
    origin: { r: filaTotales, c: 0 }
  });

  // Actualizar rango después de agregar totales
  hoja["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: filaTotales, c: 6 }
  });

  // ----- ESTILOS DE HEADER -----
  for (let C = 0; C <= 6; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "F97316" } }, // Color naranja para gastos
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // ----- ESTILOS PARA FILA DE TOTALES -----
  for (let C = 0; C <= 6; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: filaTotales, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "FFF2CC" } },
        font: { bold: true },
        alignment: { horizontal: C === 4 ? "left" : "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // ----- COLOREAR CATEGORÍAS -----
  const colCategoria = 2; // Columna de Categoría
  for (let R = 1; R < filaTotales; R++) {
    const cellCategoria = hoja[XLSX.utils.encode_cell({ r: R, c: colCategoria })];
    if (cellCategoria) {
      const categoria = cellCategoria.v;
      let bgColor = "FFFFFF";

      // Colores por categoría
      if (categoria === "Proveedores") bgColor = "FFEDD5"; // Naranja claro
      else if (categoria === "Marketing") bgColor = "F3E8FF"; // Púrpura claro
      else if (categoria === "Logistica") bgColor = "DBEAFE"; // Azul claro
      else if (categoria === "Servicios") bgColor = "FCE7F3"; // Rosa claro
      else if (categoria === "Renta de Local") bgColor = "D1FAE5"; // Verde claro
      else if (categoria === "Otros") bgColor = "F3F4F6"; // Gris claro

      cellCategoria.s = {
        fill: { fgColor: { rgb: bgColor } },
        font: { bold: true },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  // ----- BORDES PARA TODAS LAS CELDAS -----
  for (let R = 0; R <= filaTotales; R++) {
    for (let C = 0; C <= 6; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = hoja[cellAddr];
      if (cell && !cell.s) {
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
          },
        };
      }
    }
  }

  // ----- AUTO ANCHO DE COLUMNAS -----
  hoja["!cols"] = [
    { wch: 15 }, // Fecha
    { wch: 35 }, // Descripcion
    { wch: 18 }, // Categoria
    { wch: 18 }, // MetodoPago
    { wch: 25 }, // Proveedor
    { wch: 15 }, // Monto
    { wch: 30 }  // Notas
  ];

  XLSX.utils.book_append_sheet(libro, hoja, 'Gastos');

  // Generar nombre de archivo con fecha
  const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
  XLSX.writeFile(libro, `gastos_Dalu_${fecha}.xlsx`);
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
    modalConfirmacion,


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