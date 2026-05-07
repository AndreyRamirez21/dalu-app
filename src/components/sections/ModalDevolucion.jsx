// ModalDevolucion.jsx
// Colócalo en: src/components/sections/ModalDevolucion.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ArrowRight, AlertCircle, CheckCircle, ChevronDown, X, Package } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

// ─── Utilidad de formato ───────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

// ─── Componente principal ──────────────────────────────────────────
const ModalDevolucion = ({ onClose, onSuccess }) => {
  // ── Paso del wizard ──
  const [paso, setPaso] = useState(1); // 1: buscar venta | 2: seleccionar devuelto | 3: seleccionar nuevo | 4: confirmar

  // ── Búsqueda de venta ──
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [resultadosVenta, setResultadosVenta] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [cargandoVenta, setCargandoVenta] = useState(false);

  // ── Producto devuelto ──
  const [productoDevuelto, setProductoDevuelto] = useState(null);    // item de venta_productos
  const [varianteDevuelta, setVarianteDevuelta] = useState(null);

  // ── Producto nuevo ──
  const [busquedaNuevo, setBusquedaNuevo] = useState('');
  const [resultadosNuevo, setResultadosNuevo] = useState([]);
  const [productoNuevo, setProductoNuevo] = useState(null);
  const [varianteNueva, setVarianteNueva] = useState(null);
  const [cargandoNuevo, setCargandoNuevo] = useState(false);

  // ── Deuda del cliente ──
  const [deudaCliente, setDeudaCliente] = useState(null);

  // ── Notas ──
  const [notas, setNotas] = useState('');

  // ── Estado final ──
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // ────────────────────────────────────────────────────────────────
  // PASO 1 – Buscar la venta original
  // ────────────────────────────────────────────────────────────────
  const buscarVenta = useCallback(async (termino) => {
    if (!termino.trim()) { setResultadosVenta([]); return; }
    setCargandoVenta(true);
    try {
      const ventas = await ipcRenderer.invoke('buscar-ventas', termino);
      // Solo mostrar ventas pagadas o pendientes (no canceladas)
      setResultadosVenta((ventas || []).filter(v => v.estado !== 'Cancelado'));
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoVenta(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarVenta(busquedaVenta), 350);
    return () => clearTimeout(t);
  }, [busquedaVenta, buscarVenta]);

  const seleccionarVenta = async (venta) => {
    // Cargar detalle completo para ver los productos
    const detalle = await ipcRenderer.invoke('obtener-venta-por-id', venta.id);
    setVentaSeleccionada(detalle);
    setResultadosVenta([]);
    setBusquedaVenta('');

    // Ver si el cliente tiene deuda
    if (detalle.cliente_id) {
      const deuda = await ipcRenderer.invoke('obtener-deuda-pendiente-cliente', detalle.cliente_id);
      setDeudaCliente(deuda);
    }

    setPaso(2);
  };

  // ────────────────────────────────────────────────────────────────
  // PASO 2 – Seleccionar el producto que devuelve el cliente
  // ────────────────────────────────────────────────────────────────
  const seleccionarDevuelto = (producto) => {
    setProductoDevuelto(producto);
    // Si tiene variante, la seteamos
    setVarianteDevuelta(producto.variante_id ? { id: producto.variante_id, talla: producto.talla } : null);
    setPaso(3);
  };

  // ────────────────────────────────────────────────────────────────
  // PASO 3 – Buscar producto de reemplazo en inventario
  // ────────────────────────────────────────────────────────────────
  const buscarProductoNuevo = useCallback(async (termino) => {
    if (!termino.trim()) { setResultadosNuevo([]); return; }
    setCargandoNuevo(true);
    try {
      const productos = await ipcRenderer.invoke('buscar-productos', termino);
      setResultadosNuevo(productos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoNuevo(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarProductoNuevo(busquedaNuevo), 350);
    return () => clearTimeout(t);
  }, [busquedaNuevo, buscarProductoNuevo]);

  const seleccionarProductoNuevo = (producto) => {
    setProductoNuevo(producto);
    setVarianteNueva(null); // resetear variante
  };

  const seleccionarVarianteNueva = (variante) => {
    setVarianteNueva(variante);
    if (variante.cantidad > 0) {
      setResultadosNuevo([]);
      setBusquedaNuevo('');
      setPaso(4);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // CÁLCULO DE DIFERENCIA
  // ────────────────────────────────────────────────────────────────
  const calcularDiferencia = () => {
    if (!productoDevuelto || !productoNuevo) return { diferencia: 0, tipo: 'sin_diferencia' };

    const precioViejo = productoDevuelto.precio_unitario;
    const precioNuevo = varianteNueva
      ? productoNuevo.precio_venta_base + (varianteNueva.ajuste_precio || 0)
      : productoNuevo.precio_venta_base;

    const diferencia = precioNuevo - precioViejo;

    let tipo = 'sin_diferencia';
    if (diferencia > 0.01) tipo = 'cobro';
    else if (diferencia < -0.01) tipo = 'devolucion';

    return { diferencia, tipo, precioViejo, precioNuevo };
  };

  const { diferencia, tipo: tipoDiferencia, precioViejo, precioNuevo } = calcularDiferencia();

  // ¿Cuánto se aplica a deuda vs se devuelve en efectivo?
  const calcularAplicacionDeuda = () => {
    if (tipoDiferencia !== 'devolucion' || !deudaCliente) {
      return { aplicadoDeuda: 0, devolverEfectivo: Math.abs(diferencia) };
    }
    const aFavor = Math.abs(diferencia);
    const deudaPendiente = deudaCliente.monto_pendiente || 0;
    const aplicadoDeuda = Math.min(aFavor, deudaPendiente);
    const devolverEfectivo = aFavor - aplicadoDeuda;
    return { aplicadoDeuda, devolverEfectivo };
  };

  const { aplicadoDeuda, devolverEfectivo } = calcularAplicacionDeuda();

  // ────────────────────────────────────────────────────────────────
  // PASO 4 – Confirmar y guardar
  // ────────────────────────────────────────────────────────────────
  const confirmarDevolucion = async () => {
    if (!ventaSeleccionada || !productoDevuelto || !productoNuevo) return;

    setGuardando(true);
    setError('');

    try {
      const precioNuevoFinal = varianteNueva
        ? productoNuevo.precio_venta_base + (varianteNueva.ajuste_precio || 0)
        : productoNuevo.precio_venta_base;

      const datos = {
        venta_id: ventaSeleccionada.id,
        cliente_id: ventaSeleccionada.cliente_id || null,
        cliente_nombre: ventaSeleccionada.cliente_nombre,

        // Devuelto
        producto_devuelto_id: productoDevuelto.producto_id,
        variante_devuelta_id: productoDevuelto.variante_id || null,
        producto_devuelto_nombre: productoDevuelto.producto_nombre,
        talla_devuelta: productoDevuelto.talla || null,
        cantidad_devuelta: 1,
        precio_original: productoDevuelto.precio_unitario,

        // Nuevo
        producto_nuevo_id: productoNuevo.id,
        variante_nueva_id: varianteNueva?.id || null,
        producto_nuevo_nombre: productoNuevo.nombre,
        talla_nueva: varianteNueva?.talla || null,
        cantidad_nueva: 1,
        precio_nuevo: precioNuevoFinal,

        // Dinero
        monto_cobrado: tipoDiferencia === 'cobro' ? diferencia : 0,
        monto_devuelto: tipoDiferencia === 'devolucion' ? Math.abs(diferencia) : 0,
        aplicado_a_deuda: aplicadoDeuda,
        deuda_afectada_id: aplicadoDeuda > 0 ? deudaCliente?.id : null,
        deuda_reducida: aplicadoDeuda,

        notas: notas.trim() || null
      };

      const resultado = await ipcRenderer.invoke('registrar-devolucion', datos);

      if (resultado?.success) {
        onSuccess && onSuccess(resultado);
        onClose();
      } else {
        setError('Error al registrar la devolución. Intenta de nuevo.');
      }
    } catch (e) {
      console.error(e);
      setError('Error inesperado al registrar la devolución.');
    } finally {
      setGuardando(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ────────────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { n: 1, label: 'Venta' },
        { n: 2, label: 'Devuelve' },
        { n: 3, label: 'Recibe' },
        { n: 4, label: 'Confirmar' }
      ].map(({ n, label }, i, arr) => (
        <React.Fragment key={n}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${paso === n ? 'bg-teal-500 text-white shadow-md scale-110' :
                paso > n ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
              {paso > n ? <CheckCircle size={16} /> : n}
            </div>
            <span className={`text-xs mt-1 ${paso === n ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < arr.length - 1 && (
            <div className={`w-10 h-0.5 mb-4 transition-all ${paso > n ? 'bg-teal-300' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Render paso 1: buscar venta ──
  const renderPaso1 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Busca la venta original</h3>
      <p className="text-sm text-gray-500 mb-4">Ingresa el número de venta o el nombre del cliente.</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          autoFocus
          type="text"
          placeholder="Ej: V260417-0003 o Cliente General..."
          value={busquedaVenta}
          onChange={e => setBusquedaVenta(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
        />
      </div>

      {cargandoVenta && <p className="text-xs text-gray-400 mt-2 text-center">Buscando...</p>}

      {resultadosVenta.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {resultadosVenta.map(v => (
            <button
              key={v.id}
              onClick={() => seleccionarVenta(v)}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-teal-600 font-semibold text-sm">{v.numero_venta}</span>
                  <span className="text-gray-500 text-sm ml-2">· {v.cliente_nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-800 font-medium text-sm">${fmt(v.total)}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                    ${v.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {v.estado}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{v.total_productos} producto(s)</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Render paso 2: seleccionar producto devuelto ──
  const renderPaso2 = () => {
    const productos = ventaSeleccionada?.productos_propios || ventaSeleccionada?.productos || [];

    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setPaso(1)} className="text-gray-400 hover:text-gray-600 transition">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">¿Qué producto devuelve el cliente?</h3>
        </div>
        <p className="text-sm text-gray-500 mb-1 ml-6">Venta: <span className="font-medium text-teal-600">{ventaSeleccionada?.numero_venta}</span> · {ventaSeleccionada?.cliente_nombre}</p>

        {deudaCliente && (
          <div className="mx-0 mb-4 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-700">
              Este cliente tiene una deuda pendiente de <strong>${fmt(deudaCliente.monto_pendiente)}</strong>. Si hay dinero a su favor, se aplicará primero a la deuda.
            </p>
          </div>
        )}

        <div className="space-y-2 mt-3">
          {productos.filter(p => p.tipo !== 'marca_aliada').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No hay productos propios en esta venta.</p>
          )}
          {productos
            .filter(p => p.tipo !== 'marca_aliada')
            .map((p, i) => (
              <button
                key={i}
                onClick={() => seleccionarDevuelto(p)}
                className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-teal-400 hover:bg-teal-50 transition group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Package size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm group-hover:text-teal-700">
                        {p.producto_nombre}
                      </p>
                      {p.talla && <p className="text-xs text-gray-500">Talla: {p.talla}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 text-sm">${fmt(p.precio_unitario)}</p>
                    <p className="text-xs text-gray-400">c/u</p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    );
  };

  // ── Render paso 3: buscar producto nuevo ──
  const renderPaso3 = () => (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => { setPaso(2); setProductoNuevo(null); setVarianteNueva(null); }} className="text-gray-400 hover:text-gray-600 transition">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">¿Qué producto se lleva?</h3>
      </div>

      {/* Resumen del devuelto */}
      <div className="ml-6 mb-4 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-500">Devuelve:</span>
        <span className="text-xs font-medium text-gray-700">
          {productoDevuelto?.producto_nombre}
          {productoDevuelto?.talla ? ` · Talla ${productoDevuelto?.talla}` : ''} —
          <span className="text-teal-600"> ${fmt(productoDevuelto?.precio_unitario)}</span>
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          autoFocus
          type="text"
          placeholder="Buscar producto de reemplazo..."
          value={busquedaNuevo}
          onChange={e => setBusquedaNuevo(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
        />
      </div>

      {cargandoNuevo && <p className="text-xs text-gray-400 mt-2 text-center">Buscando...</p>}

      {/* Lista de productos encontrados */}
      {resultadosNuevo.length > 0 && !productoNuevo && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-56 overflow-y-auto">
          {resultadosNuevo.map(p => (
            <button
              key={p.id}
              onClick={() => seleccionarProductoNuevo(p)}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{p.referencia}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">${fmt(p.precio_venta_base)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selección de variante del producto nuevo */}
      {productoNuevo && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Selecciona la talla de <span className="text-teal-600">{productoNuevo.nombre}</span>:</p>
          <div className="grid grid-cols-3 gap-2">
            {(productoNuevo.variantes || []).map(v => {
              const precioFinal = productoNuevo.precio_venta_base + (v.ajuste_precio || 0);
              const sinStock = v.cantidad <= 0;
              return (
                <button
                  key={v.id}
                  disabled={sinStock}
                  onClick={() => seleccionarVarianteNueva(v)}
                  className={`border rounded-lg px-3 py-2.5 text-center transition
                    ${sinStock
                      ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer'
                    }`}
                >
                  <p className="font-semibold text-gray-800 text-sm">{v.talla}</p>
                  <p className="text-xs text-gray-500">{v.cantidad} uds</p>
                  <p className="text-xs font-medium text-teal-600">${fmt(precioFinal)}</p>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { setProductoNuevo(null); setVarianteNueva(null); }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            ← Buscar otro producto
          </button>
        </div>
      )}
    </div>
  );

  // ── Render paso 4: resumen y confirmación ──
  const renderPaso4 = () => {
    const precioNuevoFinal = varianteNueva
      ? productoNuevo.precio_venta_base + (varianteNueva.ajuste_precio || 0)
      : productoNuevo.precio_venta_base;

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setPaso(3)} className="text-gray-400 hover:text-gray-600 transition">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">Resumen de la devolución</h3>
        </div>

        {/* Intercambio visual */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Producto que devuelve */}
            <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-red-500 font-medium mb-1">↩ Devuelve</p>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{productoDevuelto?.producto_nombre}</p>
              {productoDevuelto?.talla && <p className="text-xs text-gray-500 mt-0.5">Talla: {productoDevuelto.talla}</p>}
              <p className="text-base font-bold text-red-600 mt-1">${fmt(productoDevuelto?.precio_unitario)}</p>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight size={20} className="text-teal-500" />
            </div>

            {/* Producto que se lleva */}
            <div className="flex-1 bg-teal-50 border border-teal-100 rounded-xl p-3">
              <p className="text-xs text-teal-600 font-medium mb-1">✅ Recibe</p>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{productoNuevo?.nombre}</p>
              {varianteNueva?.talla && <p className="text-xs text-gray-500 mt-0.5">Talla: {varianteNueva.talla}</p>}
              <p className="text-base font-bold text-teal-600 mt-1">${fmt(precioNuevoFinal)}</p>
            </div>
          </div>
        </div>

        {/* Panel de diferencia */}
        {tipoDiferencia === 'sin_diferencia' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Sin diferencia de precio</p>
              <p className="text-xs text-green-600">El intercambio es exacto. No hay cobro ni devolución de dinero.</p>
            </div>
          </div>
        )}

        {tipoDiferencia === 'cobro' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-orange-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-orange-800">El cliente debe pagar la diferencia</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Diferencia a cobrar:</span>
              <span className="text-xl font-bold text-orange-600">${fmt(diferencia)}</span>
            </div>
          </div>
        )}

        {tipoDiferencia === 'devolucion' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={18} className="text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-blue-800">La tienda devuelve dinero al cliente</p>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-blue-700">Total a favor del cliente:</span>
              <span className="text-lg font-bold text-blue-600">${fmt(Math.abs(diferencia))}</span>
            </div>
            {aplicadoDeuda > 0 && (
              <>
                <div className="border-t border-blue-200 mt-2 pt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-700 font-medium">→ Se aplica a deuda pendiente:</span>
                    <span className="font-semibold text-yellow-700">-${fmt(aplicadoDeuda)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-700 font-medium">→ Se devuelve en efectivo:</span>
                    <span className="font-semibold text-blue-700">${fmt(devolverEfectivo)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            rows={2}
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Motivo de la devolución, observaciones..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={confirmarDevolucion}
          disabled={guardando}
          className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          {guardando ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Confirmar devolución
            </>
          )}
        </button>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <RefreshCw size={20} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Devolución</h2>
              <p className="text-xs text-gray-500">Intercambio de producto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <StepIndicator />
          {paso === 1 && renderPaso1()}
          {paso === 2 && renderPaso2()}
          {paso === 3 && renderPaso3()}
          {paso === 4 && renderPaso4()}
        </div>
      </div>
    </div>
  );
};

export default ModalDevolucion;