// ModalDevolucion.jsx — versión 2
// src/components/sections/ModalDevolucion.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ArrowRight, AlertCircle, CheckCircle,
  ChevronDown, X, Package, Trash2, Info
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const DIFERENCIA_MINIMA = 5000; // Si la tienda devuelve dinero, mínimo $5.000

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

const ModalDevolucion = ({ onClose, onSuccess }) => {
  const [paso, setPaso] = useState(1);

  // Venta
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [resultadosVenta, setResultadosVenta] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [cargandoVenta, setCargandoVenta] = useState(false);

  // Producto devuelto
  const [productoDevuelto, setProductoDevuelto] = useState(null);

  // Productos nuevos (puede ser varios)
  // Cada item: { producto, variante, precio, key }
  const [productosNuevos, setProductosNuevos] = useState([]);

  // Búsqueda producto nuevo
  const [busquedaNuevo, setBusquedaNuevo] = useState('');
  const [resultadosNuevo, setResultadosNuevo] = useState([]);
  const [productoStagging, setProductoStagging] = useState(null);
  const [cargandoNuevo, setCargandoNuevo] = useState(false);

  // Deuda, notas, estado
  const [deudaCliente, setDeudaCliente] = useState(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // ── Cálculos ──
  const precioDevuelto = productoDevuelto?.precio_unitario || 0;
  const subtotalNuevos = productosNuevos.reduce((sum, p) => sum + p.precio, 0);
  const diferencia = subtotalNuevos - precioDevuelto;
  const tipoDiferencia =
    diferencia > 0.5 ? 'cobro' :
    diferencia < -0.5 ? 'devolucion' :
    'sin_diferencia';
  const devolucionInsuficiente =
    tipoDiferencia === 'devolucion' && Math.abs(diferencia) < DIFERENCIA_MINIMA;
  const faltanteParaMinimo = devolucionInsuficiente
    ? DIFERENCIA_MINIMA - Math.abs(diferencia)
    : 0;

  const calcularDeuda = () => {
    if (tipoDiferencia !== 'devolucion' || !deudaCliente)
      return { aplicadoDeuda: 0, devolverEfectivo: Math.abs(diferencia) };
    const aFavor = Math.abs(diferencia);
    const deudaPendiente = deudaCliente.monto_pendiente || 0;
    const aplicadoDeuda = Math.min(aFavor, deudaPendiente);
    return { aplicadoDeuda, devolverEfectivo: aFavor - aplicadoDeuda };
  };
  const { aplicadoDeuda, devolverEfectivo } = calcularDeuda();

  // ── Paso 1: Buscar venta ──
  const buscarVenta = useCallback(async (t) => {
    if (!t.trim()) { setResultadosVenta([]); return; }
    setCargandoVenta(true);
    try {
      const v = await ipcRenderer.invoke('buscar-ventas', t);
      setResultadosVenta((v || []).filter(x => x.estado !== 'Cancelado'));
    } finally { setCargandoVenta(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarVenta(busquedaVenta), 350);
    return () => clearTimeout(t);
  }, [busquedaVenta, buscarVenta]);

const seleccionarVenta = async (v) => {
  const det = await ipcRenderer.invoke('obtener-venta-por-id', v.id);
  setVentaSeleccionada(det);
  setResultadosVenta([]);
  setBusquedaVenta('');

  // Solo cargar deuda si pertenece a ESTA venta específica
  if (det.cliente_id) {
    const deuda = await ipcRenderer.invoke('obtener-deuda-pendiente-cliente', det.cliente_id);
    // Solo aplicar si la deuda es de esta misma venta
    if (deuda && deuda.venta_id === det.id) {
      setDeudaCliente(deuda);
    } else {
      setDeudaCliente(null); // deuda de otra venta → ignorar
    }
  }
  setPaso(2);
};
  // ── Paso 2: Seleccionar devuelto ──
  const seleccionarDevuelto = (p) => {
    setProductoDevuelto(p);
    setProductosNuevos([]);
    setPaso(3);
  };

  // ── Paso 3: Agregar productos nuevos ──
  const buscarProductoNuevo = useCallback(async (t) => {
    if (!t.trim()) { setResultadosNuevo([]); return; }
    setCargandoNuevo(true);
    try {
      const ps = await ipcRenderer.invoke('buscar-productos', t);
      setResultadosNuevo(ps || []);
    } finally { setCargandoNuevo(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarProductoNuevo(busquedaNuevo), 350);
    return () => clearTimeout(t);
  }, [busquedaNuevo, buscarProductoNuevo]);

  const elegirProductoStagging = (p) => {
    setProductoStagging(p);
    setResultadosNuevo([]);
    setBusquedaNuevo('');
  };

  const agregarVariante = (variante) => {
    if (variante.cantidad <= 0) return;
    const precio = productoStagging.precio_venta_base + (variante.ajuste_precio || 0);
    setProductosNuevos(prev => [
      ...prev,
      { producto: productoStagging, variante, precio, key: Date.now() + Math.random() }
    ]);
    setProductoStagging(null);
    setBusquedaNuevo('');
  };

  const quitarProductoNuevo = (key) => {
    setProductosNuevos(prev => prev.filter(p => p.key !== key));
  };

  // ── Paso 4: Confirmar ──
const confirmarDevolucion = async () => {
  if (!productosNuevos.length || devolucionInsuficiente) return;
  setGuardando(true);
  setError('');
  try {
    const datos = {
      venta_id: ventaSeleccionada.id,
      cliente_id: ventaSeleccionada.cliente_id || null,
      cliente_nombre: ventaSeleccionada.cliente_nombre,
      producto_devuelto_id: productoDevuelto.producto_id,
      variante_devuelta_id: productoDevuelto.variante_id || null,
      producto_devuelto_nombre: productoDevuelto.producto_nombre,
      talla_devuelta: productoDevuelto.talla || null,
      cantidad_devuelta: 1,
      precio_original: precioDevuelto,
      productosNuevos: productosNuevos.map(p => ({
        producto_id: p.producto.id,
        variante_id: p.variante?.id || null,
        producto_nombre: p.producto.nombre,
        talla: p.variante?.talla || null,
        cantidad: 1,
        precio_unitario: p.precio
      })),
      monto_cobrado: tipoDiferencia === 'cobro' ? diferencia : 0,
      monto_devuelto: tipoDiferencia === 'devolucion' ? Math.abs(diferencia) : 0,
      aplicado_a_deuda: aplicadoDeuda,
      deuda_afectada_id: aplicadoDeuda > 0 ? deudaCliente?.id : null,
      deuda_reducida: aplicadoDeuda,
      notas: notas.trim() || null
    };
console.log('📤 Datos enviados a registrar-devolucion:', {
  aplicado_a_deuda: datos.aplicado_a_deuda,
  monto_devuelto: datos.monto_devuelto,
  monto_cobrado: datos.monto_cobrado,
  deuda_afectada_id: datos.deuda_afectada_id
});
    const resultado = await ipcRenderer.invoke('registrar-devolucion', datos);

    if (resultado?.success) {
      onSuccess && onSuccess(resultado);
      onClose();
    } else {
      setError('Error al registrar la devolución.');
    }
  } catch (e) {
    console.error(e);
    setError('Error inesperado al registrar la devolución.');
  } finally {
    setGuardando(false);
  }
};

  // ── Step Indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[{ n: 1, label: 'Venta' }, { n: 2, label: 'Devuelve' }, { n: 3, label: 'Recibe' }, { n: 4, label: 'Confirmar' }]
        .map(({ n, label }, i, arr) => (
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

  const renderPaso1 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Busca la venta original</h3>
      <p className="text-sm text-gray-500 mb-4">Número de venta o nombre del cliente.</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input autoFocus type="text"
          placeholder="Ej: V260519-0009 o LUISA DANIELA..."
          value={busquedaVenta}
          onChange={e => setBusquedaVenta(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
        />
      </div>
      {cargandoVenta && <p className="text-xs text-gray-400 mt-2 text-center">Buscando...</p>}
      {resultadosVenta.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {resultadosVenta.map(v => (
            <button key={v.id} onClick={() => seleccionarVenta(v)}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition border-b border-gray-100 last:border-0">
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

  const renderPaso2 = () => {
    const productos = ventaSeleccionada?.productos_propios || ventaSeleccionada?.productos || [];
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setPaso(1)} className="text-gray-400 hover:text-gray-600 transition">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">¿Qué producto devuelve?</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3 ml-6">
          <span className="font-medium text-teal-600">{ventaSeleccionada?.numero_venta}</span> · {ventaSeleccionada?.cliente_nombre}
        </p>
        {deudaCliente && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertCircle size={15} className="text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-700">
              Cliente con deuda de <strong>${fmt(deudaCliente.monto_pendiente)}</strong>. El saldo a favor se aplica primero a la deuda.
            </p>
          </div>
        )}
        <div className="space-y-2 mt-3">
          {productos.filter(p => p.tipo !== 'marca_aliada').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">No hay productos propios en esta venta.</p>
          )}
          {productos.filter(p => p.tipo !== 'marca_aliada').map((p, i) => (
            <button key={i} onClick={() => seleccionarDevuelto(p)}
              className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-teal-400 hover:bg-teal-50 transition group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Package size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm group-hover:text-teal-700">{p.producto_nombre}</p>
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

  const renderPaso3 = () => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => { setPaso(2); setProductosNuevos([]); setProductoStagging(null); }}
          className="text-gray-400 hover:text-gray-600 transition">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">Productos de reemplazo</h3>
      </div>

      {/* Devuelto */}
      <div className="ml-6 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex justify-between items-center">
        <div>
          <p className="text-xs text-red-500 font-medium">↩ Devuelve</p>
          <p className="text-sm font-semibold text-gray-800">
            {productoDevuelto?.producto_nombre}{productoDevuelto?.talla ? ` · T${productoDevuelto.talla}` : ''}
          </p>
        </div>
        <p className="text-base font-bold text-red-600">${fmt(precioDevuelto)}</p>
      </div>

      {/* Aviso regla mínima */}
      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 flex gap-2">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Si el nuevo cuesta menos, la diferencia a devolver debe ser
          <strong> mínimo ${fmt(DIFERENCIA_MINIMA)}</strong>. Agrega más productos si hace falta.
        </p>
      </div>

      {/* Lista de productos ya agregados */}
      {productosNuevos.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recibe:</p>
          {productosNuevos.map(item => (
            <div key={item.key} className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.producto.nombre}</p>
                <p className="text-xs text-gray-500">Talla: {item.variante.talla}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-teal-600 text-sm">${fmt(item.precio)}</span>
                <button onClick={() => quitarProductoNuevo(item.key)} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Balance en tiempo real */}
          <div className={`rounded-xl px-4 py-3 mt-1 border-2 ${
            devolucionInsuficiente ? 'bg-orange-50 border-orange-300' :
            tipoDiferencia === 'cobro' ? 'bg-orange-50 border-orange-200' :
            tipoDiferencia === 'devolucion' ? 'bg-blue-50 border-blue-200' :
            'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total recibe:</span>
              <span className="font-bold">${fmt(subtotalNuevos)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">Diferencia:</span>
              <span className={`font-bold text-lg ${diferencia > 0 ? 'text-orange-600' : diferencia < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                {diferencia > 0 ? '+' : ''}{fmt(diferencia)}
              </span>
            </div>
            {devolucionInsuficiente && (
              <div className="mt-2 pt-2 border-t border-orange-300">
                <p className="text-xs text-orange-700 font-semibold flex items-center gap-1">
                  <AlertCircle size={13} />
                  Agrega productos por al menos <strong>${fmt(faltanteParaMinimo)}</strong> más.
                </p>
              </div>
            )}
            {tipoDiferencia === 'cobro' && (
              <p className="text-xs text-orange-700 mt-1 font-medium">El cliente paga ${fmt(diferencia)} adicionales.</p>
            )}
            {tipoDiferencia === 'devolucion' && !devolucionInsuficiente && (
              <p className="text-xs text-blue-700 mt-1 font-medium">La tienda devuelve ${fmt(Math.abs(diferencia))} al cliente.</p>
            )}
            {tipoDiferencia === 'sin_diferencia' && (
              <p className="text-xs text-green-700 mt-1 font-medium">Intercambio exacto, sin diferencia.</p>
            )}
          </div>
        </div>
      )}

      {/* Selector */}
      {!productoStagging ? (
        <>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text"
              placeholder={productosNuevos.length > 0 ? 'Agregar otro producto...' : 'Buscar producto de reemplazo...'}
              value={busquedaNuevo}
              onChange={e => setBusquedaNuevo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            />
          </div>
          {cargandoNuevo && <p className="text-xs text-gray-400 text-center">Buscando...</p>}
          {resultadosNuevo.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
              {resultadosNuevo.map(p => (
                <button key={p.id} onClick={() => elegirProductoStagging(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50 transition border-b border-gray-100 last:border-0">
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
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Talla de <span className="text-teal-600">{productoStagging.nombre}</span>:
            </p>
            <button onClick={() => setProductoStagging(null)} className="text-xs text-gray-400 hover:text-gray-600">
              ← Cambiar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(productoStagging.variantes || []).map(v => {
              const pf = productoStagging.precio_venta_base + (v.ajuste_precio || 0);
              const sinStock = v.cantidad <= 0;
              return (
                <button key={v.id} disabled={sinStock} onClick={() => agregarVariante(v)}
                  className={`border rounded-lg px-3 py-2.5 text-center transition
                    ${sinStock ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer'}`}>
                  <p className="font-semibold text-gray-800 text-sm">{v.talla}</p>
                  <p className="text-xs text-gray-500">{v.cantidad} uds</p>
                  <p className="text-xs font-medium text-teal-600">${fmt(pf)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {productosNuevos.length > 0 && (
        <button onClick={() => setPaso(4)} disabled={devolucionInsuficiente}
          className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2
            ${devolucionInsuficiente
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600 text-white'}`}>
          <ArrowRight size={16} />
          {devolucionInsuficiente
            ? `Agrega $${fmt(faltanteParaMinimo)} más en productos`
            : 'Continuar a confirmación'}
        </button>
      )}
    </div>
  );

  const renderPaso4 = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setPaso(3)} className="text-gray-400 hover:text-gray-600 transition">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">Confirmar devolución</h3>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs text-red-500 font-semibold mb-1">↩ DEVUELVE</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{productoDevuelto?.producto_nombre}</p>
              {productoDevuelto?.talla && <p className="text-xs text-gray-500">Talla: {productoDevuelto.talla}</p>}
            </div>
            <p className="font-bold text-red-600">${fmt(precioDevuelto)}</p>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
          <p className="text-xs text-teal-600 font-semibold mb-2">
            RECIBE ({productosNuevos.length} producto{productosNuevos.length > 1 ? 's' : ''})
          </p>
          <div className="space-y-1.5">
            {productosNuevos.map(item => (
              <div key={item.key} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.producto.nombre}</p>
                  <p className="text-xs text-gray-500">Talla: {item.variante.talla}</p>
                </div>
                <p className="font-bold text-teal-700 text-sm">${fmt(item.precio)}</p>
              </div>
            ))}
            <div className="border-t border-teal-200 pt-1 mt-1 flex justify-between">
              <span className="text-xs text-teal-700 font-semibold">Total nuevos:</span>
              <span className="font-bold text-teal-700">${fmt(subtotalNuevos)}</span>
            </div>
          </div>
        </div>
      </div>

      {tipoDiferencia === 'sin_diferencia' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Intercambio exacto</p>
            <p className="text-xs text-green-600">Sin cobro ni devolución de dinero.</p>
          </div>
        </div>
      )}

      {tipoDiferencia === 'cobro' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={18} className="text-orange-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-orange-800">El cliente paga la diferencia</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-orange-700">A cobrar:</span>
            <span className="text-2xl font-bold text-orange-600">${fmt(diferencia)}</span>
          </div>
        </div>
      )}

      {tipoDiferencia === 'devolucion' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={18} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-blue-800">La tienda devuelve dinero</p>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-blue-700">Total a favor:</span>
            <span className="text-2xl font-bold text-blue-600">${fmt(Math.abs(diferencia))}</span>
          </div>
          {aplicadoDeuda > 0 && (
            <div className="border-t border-blue-200 mt-2 pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-700 font-medium">→ Aplicado a deuda:</span>
                <span className="font-semibold text-yellow-700">-${fmt(aplicadoDeuda)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700 font-medium">→ Devolver en efectivo:</span>
                <span className="font-semibold text-blue-700">${fmt(devolverEfectivo)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
        <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Motivo de la devolución..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 resize-none" />
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button onClick={confirmarDevolucion} disabled={guardando}
        className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2">
        {guardando
          ? <><RefreshCw size={16} className="animate-spin" />Registrando...</>
          : <><CheckCircle size={16} />Confirmar devolución</>}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <RefreshCw size={20} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Devolución</h2>
              <p className="text-xs text-gray-500">Intercambio de producto</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
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