// hooks/useVentas.js
import { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

export const useVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar ventas
  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ipcRenderer.invoke('obtener-ventas');
      setVentas(data || []);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const stats = await ipcRenderer.invoke('obtener-estadisticas-ventas');
      setEstadisticas(stats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Generar número de venta
  const generarNumeroVenta = async () => {
    try {
      const numero = await ipcRenderer.invoke('generar-numero-venta');
      return numero;
    } catch (err) {
      console.error('Error al generar número de venta:', err);
      return null;
    }
  };

  // Crear venta
  const crearVenta = async (datosVenta) => {
    try {
      setLoading(true);
      setError(null);
      const resultado = await ipcRenderer.invoke('crear-venta', datosVenta);
      await cargarVentas();
      await cargarEstadisticas();
      return { success: true, ...resultado };
    } catch (err) {
      console.error('Error al crear venta:', err);
      setError('Error al crear la venta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener venta por ID
  const obtenerVentaPorId = async (id) => {
    try {
      const venta = await ipcRenderer.invoke('obtener-venta-por-id', id);
      return venta;
    } catch (err) {
      console.error('Error al obtener venta:', err);
      return null;
    }
  };

  // Buscar ventas
  const buscarVentas = async (termino) => {
    try {
      setLoading(true);
      const resultados = await ipcRenderer.invoke('buscar-ventas', termino);
      setVentas(resultados || []);
    } catch (err) {
      console.error('Error al buscar ventas:', err);
      setError('Error al buscar ventas');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar venta
  const cancelarVenta = async (id) => {
    try {
      setLoading(true);
      await ipcRenderer.invoke('cancelar-venta', id);
      await cargarVentas();
      await cargarEstadisticas();
      return { success: true };
    } catch (err) {
      console.error('Error al cancelar venta:', err);
      setError('Error al cancelar la venta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial
  useEffect(() => {
    cargarVentas();
    cargarEstadisticas();
  }, []);

  return {
    ventas,
    estadisticas,
    loading,
    error,
    cargarVentas,
    cargarEstadisticas,
    generarNumeroVenta,
    crearVenta,
    obtenerVentaPorId,
    buscarVentas,
    cancelarVenta
  };
};