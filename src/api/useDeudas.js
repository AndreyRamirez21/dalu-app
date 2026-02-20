import { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

export const useDeudas = () => {
  const [deudas, setDeudas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_deudas: 0,
    total_adeudado: 0,
    total_pagado: 0,
    total_pendiente: 0,
    deudas_pagadas: 0,
    deudas_pendientes: 0
  });
  const [loading, setLoading] = useState(false);

  // Cargar deudas
  const cargarDeudas = async () => {
    try {
      setLoading(true);
      const resultado = await ipcRenderer.invoke('obtener-deudas');
      setDeudas(resultado || []);
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error al cargar deudas:', error);
      setDeudas([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const stats = await ipcRenderer.invoke('obtener-estadisticas-deudas');
      setEstadisticas(stats || {
        total_deudas: 0,
        total_adeudado: 0,
        total_pagado: 0,
        total_pendiente: 0,
        deudas_pagadas: 0,
        deudas_pendientes: 0
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Agregar nueva deuda
  const agregarDeuda = async (datosDeuda) => {
    try {
      setLoading(true);
      await ipcRenderer.invoke('agregar-deuda', datosDeuda);
      await cargarDeudas();
      return { success: true };
    } catch (error) {
      console.error('Error al agregar deuda:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Registrar pago
  const registrarPago = async (deudaId, montoPago, metodoPago, notas) => {
    try {
      setLoading(true);
      await ipcRenderer.invoke('registrar-pago-deuda', deudaId, montoPago, metodoPago, notas);
      await cargarDeudas();
      return { success: true };
    } catch (error) {
      console.error('Error al registrar pago:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar deuda
  const actualizarDeuda = async (id, datos) => {
    try {
      setLoading(true);
      await ipcRenderer.invoke('actualizar-deuda', id, datos);
      await cargarDeudas();
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar deuda:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar deuda
  const eliminarDeuda = async (id) => {
    try {
      setLoading(true);
      await ipcRenderer.invoke('eliminar-deuda', id);
      await cargarDeudas();
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar deuda:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Buscar deudas
  const buscarDeudas = async (termino) => {
    try {
      setLoading(true);
      const resultado = await ipcRenderer.invoke('buscar-deudas', termino);
      setDeudas(resultado || []);
    } catch (error) {
      console.error('Error al buscar deudas:', error);
      setDeudas([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener historial de pagos
  const obtenerHistorialPagos = async (deudaId) => {
    try {
      const historial = await ipcRenderer.invoke('obtener-historial-pagos', deudaId);
      return historial || [];
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  };

  // Obtener deuda por ID
  const obtenerDeudaPorId = async (id) => {
    try {
      const deuda = await ipcRenderer.invoke('obtener-deuda-por-id', id);
      return deuda;
    } catch (error) {
      console.error('Error al obtener deuda:', error);
      return null;
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    cargarDeudas();
  }, []);

  return {
    deudas,
    estadisticas,
    loading,
    agregarDeuda,
    registrarPago,
    actualizarDeuda,
    eliminarDeuda,
    buscarDeudas,
    cargarDeudas,
    obtenerHistorialPagos,
    obtenerDeudaPorId
  };
};