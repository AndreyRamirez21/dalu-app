import { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

/**
 * Hook para manejar el sistema de fidelidad durante una venta
 */
export const useFidelidadVenta = () => {
  const [estadoFidelidad, setEstadoFidelidad] = useState(null);
  const [clienteActual, setClienteActual] = useState(null);
  const [descuentoAplicable, setDescuentoAplicable] = useState(0);
  const [mostrarAlertaTarjeta, setMostrarAlertaTarjeta] = useState(false);
  const [tarjetaPresentada, setTarjetaPresentada] = useState(false);
const [descuentoActivo, setDescuentoActivo] = useState(false); // ← AGREGAR


  /**
   * Verifica el estado de fidelidad cuando se selecciona un cliente
   */
  const verificarFidelidadCliente = async (clienteId) => {
    try {
      const resultado = await ipcRenderer.invoke('verificar-descuento-fidelidad', clienteId);

      console.log('🔍 Estado fidelidad recibido:', resultado);

      setEstadoFidelidad(resultado.estado_fidelidad);
      setClienteActual(resultado);
      setTarjetaPresentada(false);
      setDescuentoAplicable(0);

      // Mostrar alerta de entrega de tarjeta en la PRIMERA compra
      if (resultado.estado_fidelidad === 'entrega_tarjeta') {
        setMostrarAlertaTarjeta(true);
      } else {
        setMostrarAlertaTarjeta(false);
      }

      // Determinar descuento disponible
      if (resultado.estado_fidelidad === 'descuento_10') {
        setDescuentoAplicable(10);
      } else if (resultado.estado_fidelidad === 'descuento_15') {
        setDescuentoAplicable(15);
      }

      return resultado;
    } catch (error) {
      console.error('❌ Error al verificar fidelidad:', error);
      return null;
    }
  };

  /**
   * Registra que el cliente presentó la tarjeta
   */
  const registrarPresentacionTarjeta = () => {
    setTarjetaPresentada(!tarjetaPresentada);
  };

  /**
   * Aplica el descuento al total de la venta
   */
const aplicarDescuentoFidelidad = (monto) => {
  if (!descuentoActivo || descuentoAplicable === 0) {
    return monto; // Sin descuento
  }

  const descuento = (monto * descuentoAplicable) / 100;
  return monto - descuento;
};

const toggleDescuento = () => {
  setDescuentoActivo(!descuentoActivo);
};
  /**
   * Calcula el monto del descuento
   */
  const calcularMontoDescuento = (totalSinDescuento) => {
    if (descuentoAplicable === 0 || !tarjetaPresentada) {
      return 0;
    }

    return totalSinDescuento * (descuentoAplicable / 100);
  };

  /**
   * Procesa la fidelidad después de completar la venta
   */
  const procesarFidelidadPostVenta = async (clienteId, totalVenta) => {
    try {
      // 1. Si es la primera compra, registrar entrega de tarjeta
      if (estadoFidelidad === 'entrega_tarjeta') {
        await ipcRenderer.invoke('registrar-entrega-tarjeta', clienteId);
        console.log('✅ Tarjeta de fidelidad entregada');
      }

      // 2. Si presentó tarjeta, registrar la presentación
      if (tarjetaPresentada && clienteActual) {
        await ipcRenderer.invoke('registrar-presentacion-tarjeta', clienteId);
        console.log('✅ Presentación de tarjeta registrada');
      }

      // 3. Si aplicó descuento del 10%, marcar como usado
      if (descuentoAplicable === 10 && tarjetaPresentada) {
        await ipcRenderer.invoke('marcar-descuento-aplicado-3', clienteId);
        console.log('✅ Descuento del 10% marcado como aplicado');
      }

      // 4. Si aplicó descuento del 15%, marcar como usado
      if (descuentoAplicable === 15 && tarjetaPresentada) {
        await ipcRenderer.invoke('marcar-descuento-aplicado-6', clienteId);
        console.log('✅ Descuento del 15% marcado como aplicado');
      }

      return true;
    } catch (error) {
      console.error('❌ Error al procesar fidelidad post-venta:', error);
      return false;
    }
  };

  /**
   * Resetea el estado de fidelidad
   */
  const resetearFidelidad = () => {
    setEstadoFidelidad(null);
    setClienteActual(null);
    setDescuentoAplicable(0);
    setMostrarAlertaTarjeta(false);
    setTarjetaPresentada(false);

  };

  return {
    // Estado
    estadoFidelidad,
    clienteActual,
    descuentoAplicable,
    mostrarAlertaTarjeta,
    tarjetaPresentada,
    descuentoActivo,        // ← AGREGAR
    toggleDescuento,

    // Acciones
    verificarFidelidadCliente,
    registrarPresentacionTarjeta,
    aplicarDescuentoFidelidad,
    calcularMontoDescuento,
    procesarFidelidadPostVenta,
    resetearFidelidad,

    // Utilidades
    tieneDescuentoDisponible: descuentoAplicable > 0,
    requiereEntregarTarjeta: estadoFidelidad === 'entrega_tarjeta',
    puedeAplicarDescuento: estadoFidelidad === 'descuento_10' || estadoFidelidad === 'descuento_15'
  };
};

export default useFidelidadVenta;