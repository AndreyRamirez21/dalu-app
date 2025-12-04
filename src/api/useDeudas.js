// hooks/useDeudas.js
import { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');




export const useDeudas = () => {
  const [deudas, setDeudas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar deudas
  const cargarDeudas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ipcRenderer.invoke('obtener-deudas');
      setDeudas(data || []);
    } catch (err) {
      console.error('Error al cargar deudas:', err);
      setError('Error al cargar las deudas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const stats = await ipcRenderer.invoke('obtener-estadisticas-deudas');
      setEstadisticas(stats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Agregar deuda
  const agregarDeuda = async (nuevaDeuda) => {
    try {
      setLoading(true);
      setError(null);
      await ipcRenderer.invoke('agregar-deuda', nuevaDeuda);
      await cargarDeudas();
      await cargarEstadisticas();
      return { success: true };
    } catch (err) {
      console.error('Error al agregar deuda:', err);
      setError('Error al agregar la deuda');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Registrar pago
  const registrarPago = async (deudaId, montoPago, metodoPago, notas) => {
    try {
      setLoading(true);
      setError(null);
      const resultado = await ipcRenderer.invoke('registrar-pago-deuda', deudaId, montoPago, metodoPago, notas);
      await cargarDeudas();
      await cargarEstadisticas();
      return { success: true, ...resultado };
    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError('Error al registrar el pago');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar deuda
  const actualizarDeuda = async (id, datosActualizados) => {
    try {
      setLoading(true);
      setError(null);
      await ipcRenderer.invoke('actualizar-deuda', id, datosActualizados);
      await cargarDeudas();
      await cargarEstadisticas();
      return { success: true };
    } catch (err) {
      console.error('Error al actualizar deuda:', err);
      setError('Error al actualizar la deuda');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar deuda
  const eliminarDeuda = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await ipcRenderer.invoke('eliminar-deuda', id);
      await cargarDeudas();
      await cargarEstadisticas();
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar deuda:', err);
      setError('Error al eliminar la deuda');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Buscar deudas
  const buscarDeudas = async (termino) => {
    try {
      setLoading(true);
      const resultados = await ipcRenderer.invoke('buscar-deudas', termino);
      setDeudas(resultados || []);
    } catch (err) {
      console.error('Error al buscar deudas:', err);
      setError('Error al buscar deudas');
    } finally {
      setLoading(false);
    }
  };

  // Obtener deuda por ID
  const obtenerDeudaPorId = async (id) => {
    try {
      const deuda = await ipcRenderer.invoke('obtener-deuda-por-id', id);
      return deuda;
    } catch (err) {
      console.error('Error al obtener deuda:', err);
      return null;
    }
  };

  // Obtener historial de pagos
  const obtenerHistorialPagos = async (deudaId) => {
    try {
      const pagos = await ipcRenderer.invoke('obtener-historial-pagos', deudaId);
      return pagos;
    } catch (err) {
      console.error('Error al obtener historial:', err);
      return [];
    }
  };

  // Efecto inicial
  useEffect(() => {
    cargarDeudas();
    cargarEstadisticas();
  }, []);

  return {
    deudas,
    estadisticas,
    loading,
    error,
    cargarDeudas,
    cargarEstadisticas,
    agregarDeuda,
    registrarPago,
    actualizarDeuda,
    eliminarDeuda,
    buscarDeudas,
    obtenerDeudaPorId,
    obtenerHistorialPagos
  };
};