// hooks/useDeudasClientes.js
import { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

export const useDeudasClientes = () => {
  const [deudas, setDeudas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar deudas de clientes
  const cargarDeudas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ipcRenderer.invoke('obtener-deudas-clientes');
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
      const stats = await ipcRenderer.invoke('obtener-estadisticas-deudas-clientes');
      setEstadisticas(stats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Obtener deuda por ID
  const obtenerDeudaPorId = async (id) => {
    try {
      const deuda = await ipcRenderer.invoke('obtener-deuda-cliente-por-id', id);
      return deuda;
    } catch (err) {
      console.error('Error al obtener deuda:', err);
      return null;
    }
  };

  // Registrar abono
  const registrarAbono = async (deudaId, montoAbono, metodoPago, notas) => {
    try {
      setLoading(true);
      setError(null);
      const resultado = await ipcRenderer.invoke('registrar-abono-deuda-cliente', deudaId, montoAbono, metodoPago, notas);
      await cargarDeudas();
      await cargarEstadisticas();
      return { success: true, ...resultado };
    } catch (err) {
      console.error('Error al registrar abono:', err);
      setError('Error al registrar el abono');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener deudas por cliente
  const obtenerDeudasPorCliente = async (clienteId) => {
    try {
      const deudas = await ipcRenderer.invoke('obtener-deudas-por-cliente', clienteId);
      return deudas;
    } catch (err) {
      console.error('Error al obtener deudas del cliente:', err);
      return [];
    }
  };

  // Buscar deudas
  const buscarDeudas = async (termino) => {
    try {
      setLoading(true);
      const resultados = await ipcRenderer.invoke('buscar-deudas-clientes', termino);
      setDeudas(resultados || []);
    } catch (err) {
      console.error('Error al buscar deudas:', err);
      setError('Error al buscar deudas');
    } finally {
      setLoading(false);
    }
  };

  // Obtener historial de abonos
  const obtenerHistorialAbonos = async (deudaId) => {
    try {
      const abonos = await ipcRenderer.invoke('obtener-historial-abonos', deudaId);
      return abonos;
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
    obtenerDeudaPorId,
    registrarAbono,
    obtenerDeudasPorCliente,
    buscarDeudas,
    obtenerHistorialAbonos
  };
};