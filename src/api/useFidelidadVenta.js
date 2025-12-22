import { useState } from 'react';

const { ipcRenderer } = window.require('electron');

/**
 * ✅ Hook corregido para fidelidad
 * - Detecta descuento 10% cuando compras_con_tarjeta >= 3
 * - Detecta descuento 15% cuando compras_con_tarjeta >= 6
 */
export const useFidelidadVenta = () => {
  const [estadoFidelidad, setEstadoFidelidad] = useState(null);
  const [clienteActual, setClienteActual] = useState(null);
  const [descuentoAplicable, setDescuentoAplicable] = useState(0);
  const [mostrarAlertaTarjeta, setMostrarAlertaTarjeta] = useState(false);
  const [tarjetaPresentada, setTarjetaPresentada] = useState(false);
  const [descuentoActivo, setDescuentoActivo] = useState(false);

  /**
   * Verifica el estado de fidelidad del cliente
   */
  const verificarFidelidadCliente = async (clienteId) => {
    try {
      const resultado = await ipcRenderer.invoke('verificar-descuento-fidelidad', clienteId);

      console.log('🔍 Estado fidelidad recibido:', resultado);
      console.log('  - compras_con_tarjeta:', resultado.compras_con_tarjeta);
      console.log('  - descuento_aplicado_3:', resultado.descuento_aplicado_3);
      console.log('  - descuento_aplicado_6:', resultado.descuento_aplicado_6);
      console.log('  - estado_fidelidad:', resultado.estado_fidelidad);

      setEstadoFidelidad(resultado.estado_fidelidad);
      setClienteActual(resultado);
      setTarjetaPresentada(false);
      setDescuentoAplicable(0);
      setDescuentoActivo(false);

      // Alerta para primera compra
      if (resultado.estado_fidelidad === 'entrega_tarjeta') {
        setMostrarAlertaTarjeta(true);
      } else {
        setMostrarAlertaTarjeta(false);
      }

      // ✅ CORREGIDO: Detectar descuentos basados en compras_con_tarjeta
      if (resultado.estado_fidelidad === 'descuento_15') {
        console.log('✅ Descuento 15% disponible (6+ compras con tarjeta)');
        setDescuentoAplicable(15);
      } else if (resultado.estado_fidelidad === 'descuento_10') {
        console.log('✅ Descuento 10% disponible (3+ compras con tarjeta)');
        setDescuentoAplicable(10);
      }

      return resultado;
    } catch (error) {
      console.error('❌ Error al verificar fidelidad:', error);
      return null;
    }
  };

  /**
   * Registra presentación de tarjeta
   */
  const registrarPresentacionTarjeta = () => {
    setTarjetaPresentada(!tarjetaPresentada);
  };

  /**
   * Toggle descuento activo/inactivo
   */
  const toggleDescuento = () => {
    setDescuentoActivo(!descuentoActivo);
  };

  /**
   * Aplica descuento al monto
   */
  const aplicarDescuentoFidelidad = (monto) => {
    if (!descuentoActivo || descuentoAplicable === 0) {
      return monto;
    }

    const descuento = (monto * descuentoAplicable) / 100;
    return monto - descuento;
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
   * ✅ CORREGIDO: Procesa fidelidad POST-venta
   * - Si aplicó descuento → Marca como usado Y registra presentación
   * - Si NO aplicó descuento pero presentó tarjeta → Solo registra presentación
   */
  const procesarFidelidadPostVenta = async (clienteId, totalVenta) => {
    try {
      const esCompraGrande = totalVenta > 30000;

      console.log('📋 Procesando fidelidad post-venta:', {
        clienteId,
        totalVenta,
        esCompraGrande,
        estadoFidelidad,
        tarjetaPresentada,
        descuentoAplicable,
        descuentoActivo
      });

      // 1️⃣ Si es primera compra >= $30k, ya se manejó en backend
      if (estadoFidelidad === 'entrega_tarjeta') {
        console.log('ℹ️ Primera compra - Tarjeta ya procesada en backend');
        return true;
      }

      // 2️⃣ ✅ SI APLICÓ DESCUENTO → Marcar como usado Y registrar presentación
      if (descuentoActivo && descuentoAplicable > 0 && tarjetaPresentada && esCompraGrande) {
        console.log(`🎉 Aplicando descuento del ${descuentoAplicable}%...`);

        // Primero registrar presentación de tarjeta (esto suma +1)
        await ipcRenderer.invoke('registrar-presentacion-tarjeta', clienteId);
        console.log('✅ Presentación de tarjeta registrada (+1)');

        // Luego marcar el descuento como usado
        if (descuentoAplicable === 10) {
          await ipcRenderer.invoke('marcar-descuento-aplicado-3', clienteId);
          console.log('✅ Descuento del 10% marcado como aplicado');
        } else if (descuentoAplicable === 15) {
          await ipcRenderer.invoke('marcar-descuento-aplicado-6', clienteId);
          console.log('✅ Descuento del 15% marcado como aplicado');
        }

        return true;
      }

      // 3️⃣ Si NO aplicó descuento pero SÍ presentó tarjeta → Solo registrar
      if (tarjetaPresentada && esCompraGrande && !descuentoActivo) {
        await ipcRenderer.invoke('registrar-presentacion-tarjeta', clienteId);
        console.log('✅ Presentación de tarjeta registrada sin descuento');
        return true;
      }

      console.log('ℹ️ No se procesó fidelidad (no cumple requisitos)');
      return true;
    } catch (error) {
      console.error('❌ Error al procesar fidelidad post-venta:', error);
      return false;
    }
  };

  /**
   * Resetea el estado
   */
  const resetearFidelidad = () => {
    setEstadoFidelidad(null);
    setClienteActual(null);
    setDescuentoAplicable(0);
    setMostrarAlertaTarjeta(false);
    setTarjetaPresentada(false);
    setDescuentoActivo(false);
  };

  return {
    // Estado
    estadoFidelidad,
    clienteActual,
    descuentoAplicable,
    mostrarAlertaTarjeta,
    tarjetaPresentada,
    descuentoActivo,

    // Acciones
    verificarFidelidadCliente,
    registrarPresentacionTarjeta,
    toggleDescuento,
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