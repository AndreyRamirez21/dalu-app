import React, { useState, useEffect, useCallback } from 'react';

const { ipcRenderer } = window.require('electron');

const BRAND = '#82bbbd';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const fmtFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtHora = (f) => {
  if (!f) return '';
  const d = new Date(f);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

// ─── Íconos SVG inline ───────────────────────────────────────────────────────

const IconArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IconWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 12h2"/><path d="M6 1v4M10 1v4"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconMinus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─── Toast (mismo lenguaje que Ventas) ─────────────────────────────────── */
const Toast = ({ mensaje, tipo = 'exito', onDone }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ backgroundColor: tipo === 'exito' ? BRAND : '#dc2626' }}
    >
      {tipo === 'exito' ? <IconCheck /> : <IconAlert />}
      <span className="text-white font-medium text-sm">{mensaje}</span>
    </div>
  );
};

/* ─── Stat card (idéntica a Ventas) ─────────────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor, icon }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      {icon && <div style={{ color: accentColor }}>{icon}</div>}
    </div>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
  </div>
);

// ─── Badge de tipo ────────────────────────────────────────────────────────────

const TipoBadge = ({ tipo, origen }) => {
  const config = {
    apertura: { label: 'Apertura', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
    entrada:  { label: origen === 'venta' ? 'Venta' : 'Entrada', color: '#059669', bg: '#f0fdf4', border: '#86efac' },
    salida:   { label: origen === 'gasto' ? 'Gasto' : 'Salida', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    ajuste:   { label: 'Ajuste', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  };
  const c = config[tipo] || config.ajuste;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
};

// ─── Paginación ───────────────────────────────────────────────────────────────

const ITEMS_POR_PAGINA = 10;

const Paginacion = ({ paginaActual, totalPaginas, onChange, totalItems, itemsEnPagina }) => {
  if (totalPaginas <= 1) return null;

  const getPages = () => {
    const pages = [];
    let start = Math.max(1, paginaActual - 2);
    let end   = Math.min(totalPaginas, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const desde = (paginaActual - 1) * ITEMS_POR_PAGINA + 1;
  const hasta = desde + itemsEnPagina - 1;

  return (
    <div className="px-6 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: '1px solid #f1f5f9' }}>
      <span className="text-xs text-gray-400">
        Mostrando <b className="text-gray-600">{desde}–{hasta}</b> de <b className="text-gray-600">{totalItems}</b> movimientos
      </span>

      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onChange(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="min-w-[36px] h-9 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <IconChevronLeft />
        </button>

        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="min-w-[36px] h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
            style={p === paginaActual
              ? { border: `1.5px solid ${BRAND}`, backgroundColor: '#f0fdfa', color: BRAND }
              : { border: '1.5px solid #e5e7eb', backgroundColor: '#fff', color: '#374151' }
            }
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onChange(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="min-w-[36px] h-9 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
};

// ─── Modal de movimiento ──────────────────────────────────────────────────────

const ModalMovimiento = ({ tipo: tipoInicial, onClose, onSuccess }) => {
  const [tipo, setTipo] = useState(tipoInicial || 'entrada');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const conceptosSugeridos = {
    entrada: ['Venta en efectivo', 'Cobro de deuda', 'Depósito', 'Otro ingreso'],
    salida:  ['Retiro personal', 'Pago a proveedor', 'Gasto operativo', 'Otro egreso'],
    ajuste:  ['Ajuste de cuadre', 'Corrección de saldo', 'Diferencia de caja'],
  };

  const handleSubmit = async () => {
    if (!concepto.trim()) return setError('Escribe un concepto.');
    const montoNum = parseFloat(monto.replace(/\./g, '').replace(',', '.'));
    if (!montoNum || montoNum <= 0) return setError('Ingresa un monto válido mayor a 0.');
    setError('');
    setLoading(true);
    try {
      const resultado = await ipcRenderer.invoke('caja-registrar-movimiento', {
        tipo, concepto: concepto.trim(), monto: montoNum, notas: notas.trim() || null
      });
      onSuccess(resultado);
      onClose();
    } catch (e) {
      setError(e.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const tipoColores = {
    entrada: { color: '#059669', bg: '#f0fdf4', border: '#86efac', solid: '#059669' },
    salida:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', solid: '#dc2626' },
    ajuste:  { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', solid: '#d97706' },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Registrar movimiento</h2>

        {/* Tipo */}
        <div className="flex gap-2 mb-5">
          {[
            { v: 'entrada', label: '↑ Entrada' },
            { v: 'salida',  label: '↓ Salida' },
            { v: 'ajuste',  label: '⟳ Ajuste' },
          ].map(opt => {
            const c = tipoColores[opt.v];
            const active = tipo === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => setTipo(opt.v)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                style={active
                  ? { border: `2px solid ${c.border}`, backgroundColor: c.bg, color: c.color }
                  : { border: '2px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#6b7280' }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Concepto */}
        <label className="block mb-1.5 text-xs font-semibold text-gray-600">Concepto *</label>
        <input
          value={concepto} onChange={e => setConcepto(e.target.value)}
          placeholder="Describe el movimiento…"
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm mb-2 outline-none focus:ring-2 transition"
          style={{ '--tw-ring-color': BRAND }}
          onFocus={e => { e.target.style.borderColor = BRAND; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
        />
        <div className="flex gap-1.5 flex-wrap mb-4">
          {(conceptosSugeridos[tipo] || []).map(s => (
            <button
              key={s}
              onClick={() => setConcepto(s)}
              className="px-2.5 py-1 rounded-full text-[11px] border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Monto */}
        <label className="block mb-1.5 text-xs font-semibold text-gray-600">Monto *</label>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
          <input
            type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)}
            placeholder="0"
            className="w-full pl-7 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': BRAND }}
            onFocus={e => { e.target.style.borderColor = BRAND; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>

        {/* Notas */}
        <label className="block mb-1.5 text-xs font-semibold text-gray-600">Notas (opcional)</label>
        <textarea
          value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Información adicional…"
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm mb-5 outline-none resize-none focus:ring-2 transition"
          style={{ '--tw-ring-color': BRAND, fontFamily: 'inherit' }}
          onFocus={e => { e.target.style.borderColor = BRAND; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
        />

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: tipoColores[tipo].solid }}
          >
            {loading ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de saldo inicial ───────────────────────────────────────────────────

const ModalSaldoInicial = ({ onClose, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum < 0) return setError('Ingresa un monto válido.');
    setLoading(true);
    try {
      const resultado = await ipcRenderer.invoke('caja-configurar-saldo-inicial', montoNum);
      onSuccess(resultado);
      onClose();
    } catch (e) {
      setError(e.message || 'Error al configurar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-9 w-full max-w-sm text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
          style={{ backgroundColor: '#f0fdfa' }}
        >
          💰
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Configurar saldo inicial</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Ingresa el dinero que tienes actualmente en caja. Este será el punto de partida de tu registro.
        </p>
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
          <input
            type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-gray-200 text-xl font-bold text-center outline-none transition"
            onFocus={e => { e.target.style.borderColor = BRAND; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? 'Guardando…' : 'Confirmar saldo inicial'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de reiniciar caja (con contraseña) ─────────────────────────────────

const ModalReiniciarCaja = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) return setError('Ingresa la contraseña.');
    setError('');
    setLoading(true);
    try {
      const resultado = await ipcRenderer.invoke('caja-reiniciar', password.trim());
      if (!resultado.success) {
        setError(resultado.error || 'No se pudo reiniciar la caja.');
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al reiniciar la caja.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-9 w-full max-w-sm text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
          style={{ backgroundColor: '#fef2f2' }}
        >
          ⚠️
        </div>

        {!confirmando ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reiniciar caja</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Esto <b>borrará permanentemente</b> todo el historial de movimientos de caja
              (saldo inicial, entradas, salidas y ajustes). Esta acción no se puede deshacer.
            </p>

            <label className="block mb-1.5 text-xs font-semibold text-gray-600 text-left">
              Contraseña de administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && setConfirmando(true)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-base text-center tracking-[4px] outline-none mb-4 transition"
              onFocus={e => { e.target.style.borderColor = '#dc2626'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!password.trim()) return setError('Ingresa la contraseña.');
                  setError('');
                  setConfirmando(true);
                }}
                className="flex-[2] py-3 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-red-600 mb-2">¿Estás completamente seguro?</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Vas a eliminar <b>todos</b> los movimientos de caja registrados hasta hoy.
              Después de esto tendrás que configurar un nuevo saldo inicial.
            </p>

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmando(false)}
                className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-3 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Reiniciando…' : 'Sí, reiniciar caja'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const Caja = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [resumenDia, setResumenDia] = useState({ total_entradas: 0, total_salidas: 0, total_movimientos: 0 });
  const [loading, setLoading] = useState(true);
  const [modalTipo, setModalTipo] = useState(null);
  const [modalSaldoInicial, setModalSaldoInicial] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalReiniciar, setModalReiniciar] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [saldoRes, movRes, resumenRes] = await Promise.all([
        ipcRenderer.invoke('caja-obtener-saldo'),
        ipcRenderer.invoke('caja-obtener-movimientos'),
        ipcRenderer.invoke('caja-resumen-dia'),
      ]);
      setSaldo(saldoRes?.saldo_actual || 0);
      setMovimientos(movRes || []);
      setResumenDia(resumenRes || { total_entradas: 0, total_salidas: 0, total_movimientos: 0 });
    } catch (e) {
      console.error('Error al cargar caja:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => { setPaginaActual(1); }, [filtro, busqueda]);

  const mostrarToast = (msg, tipo = 'exito') => setToast({ mensaje: msg, tipo });

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento? Solo se puede si es el último registrado.')) return;
    try {
      await ipcRenderer.invoke('caja-eliminar-movimiento', id);
      mostrarToast('Movimiento eliminado.');
      cargarDatos();
    } catch (e) {
      mostrarToast(e.message || 'No se pudo eliminar.', 'error');
    }
  };

  const movsFiltrados = movimientos.filter(m => {
    const matchFiltro = filtro === 'todos' || m.tipo === filtro;
    const matchBusqueda = !busqueda || m.concepto.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const totalPaginas = Math.max(1, Math.ceil(movsFiltrados.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const movsPagina = movsFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const esSaldoBajo = saldo < 50000;
  const esSaldoMedio = saldo >= 50000 && saldo < 200000;
  const saldoColor = esSaldoBajo ? '#dc2626' : esSaldoMedio ? '#d97706' : '#059669';
  const saldoBg = esSaldoBajo ? '#fef2f2' : esSaldoMedio ? '#fffbeb' : '#f0fdf4';

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onDone={() => setToast(null)} />
      )}

      {/* ── Tarjetas superiores ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        {/* Saldo actual */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: saldoBg, border: `1.5px solid ${saldoColor}33`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: saldoColor }}>Saldo en Caja</span>
            <div className="rounded-lg p-1.5" style={{ backgroundColor: saldoColor + '22', color: saldoColor }}>
              <IconWallet />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: saldoColor }}>
            {loading ? '…' : fmt(saldo)}
          </div>
          <div className="mt-1.5 text-xs" style={{ color: saldoColor + 'aa' }}>
            {esSaldoBajo ? '⚠ Saldo bajo' : esSaldoMedio ? '• Saldo moderado' : '✓ Saldo saludable'}
          </div>
        </div>

        {/* Entradas hoy */}
        <StatCard
          label="Entradas Hoy"
          value={loading ? '…' : fmt(resumenDia.total_entradas)}
          sub={`${resumenDia.total_movimientos} movimiento${resumenDia.total_movimientos !== 1 ? 's' : ''} hoy`}
          accentColor="#059669"
          icon={<IconArrowDown />}
        />

        {/* Salidas hoy */}
        <StatCard
          label="Salidas Hoy"
          value={loading ? '…' : fmt(resumenDia.total_salidas)}
          sub={`Balance: ${fmt(resumenDia.total_entradas - resumenDia.total_salidas)}`}
          accentColor="#dc2626"
          icon={<IconArrowUp />}
        />

        {/* Acciones rápidas */}
        <div
          className="bg-white rounded-xl p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Acciones Rápidas</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setModalTipo('entrada')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs w-full transition-colors"
              style={{ backgroundColor: '#f0fdf4', color: '#059669' }}
            >
              <IconPlus /> Registrar entrada
            </button>
            <button
              onClick={() => setModalTipo('salida')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs w-full transition-colors"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
            >
              <IconMinus /> Registrar salida
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabla de movimientos ── */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        {/* Cabecera de tabla */}
        <div className="p-6 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">Movimientos de caja</h3>
            <span className="bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {movsFiltrados.length}
            </span>
          </div>

          <div className="flex gap-2.5 items-center flex-wrap">
            {/* Búsqueda */}
            <div className="relative">
              <input
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar concepto…"
                className="pl-3.5 pr-3.5 py-2 rounded-lg border border-gray-200 text-sm outline-none w-44 focus:ring-2 transition"
                style={{ '--tw-ring-color': BRAND }}
                onFocus={e => { e.target.style.borderColor = BRAND; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            {/* Filtro tipo */}
            <div className="flex gap-1">
              {[
                { v: 'todos',   label: 'Todos' },
                { v: 'entrada', label: 'Entradas' },
                { v: 'salida',  label: 'Salidas' },
                { v: 'ajuste',  label: 'Ajustes' },
              ].map(opt => {
                const active = filtro === opt.v;
                return (
                  <button
                    key={opt.v}
                    onClick={() => setFiltro(opt.v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={active
                      ? { backgroundColor: BRAND, color: '#fff' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Botón ajuste / saldo inicial */}
            <button
              onClick={() => {
                if (movimientos.length === 0) setModalSaldoInicial(true);
                else setModalTipo('ajuste');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium text-xs hover:bg-gray-50 transition-colors"
            >
              <IconFilter />
              {movimientos.length === 0 ? 'Saldo inicial' : 'Ajuste'}
            </button>
            {/* Botón reiniciar caja */}
            <button
              onClick={() => setModalReiniciar(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-red-600 font-medium text-xs hover:bg-red-50 transition-colors"
              style={{ borderColor: '#fecaca' }}
            >
              <IconTrash /> Reiniciar caja
            </button>
            {/* Refresh */}
            <button
              onClick={cargarDatos}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium text-xs hover:bg-gray-50 transition-colors"
            >
              <IconRefresh /> Actualizar
            </button>
          </div>
        </div>

        {/* Sin movimientos */}
        {!loading && movimientos.length === 0 && (
          <div className="text-center py-16 px-5">
            <div className="text-5xl mb-3">💼</div>
            <p className="text-gray-600 text-sm font-semibold">No hay movimientos registrados</p>
            <p className="text-gray-400 text-xs mb-5 mt-1">
              Comienza configurando el saldo que tienes actualmente en caja.
            </p>
            <button
              onClick={() => setModalSaldoInicial(true)}
              className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              Configurar saldo inicial
            </button>
          </div>
        )}

        {/* Tabla */}
        {movimientos.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    {['Tipo', 'Concepto', 'Monto', 'Saldo resultante', 'Fecha', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Cargando…</td></tr>
                  ) : movsPagina.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Sin resultados</td></tr>
                  ) : movsPagina.map((m, idx) => {
                    const esSalida = m.tipo === 'salida';
                    const esElUltimo = paginaSegura === 1 && idx === 0;
                    return (
                      <tr key={m.id} className="transition-colors hover:bg-gray-50/70">
                        <td className="px-5 py-4">
                          <TipoBadge tipo={m.tipo} origen={m.origen} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-gray-900">{m.concepto}</div>
                          {m.notas && <div className="text-xs text-gray-400 mt-0.5">{m.notas}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-sm" style={{ color: esSalida ? '#dc2626' : '#059669' }}>
                            {esSalida ? '−' : '+'}{fmt(m.monto)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                          {fmt(m.saldo_resultante)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-700">{fmtFecha(m.fecha)}</div>
                          <div className="text-xs text-gray-400">{fmtHora(m.fecha)}</div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {esElUltimo && (
                            <button
                              onClick={() => handleEliminar(m.id)}
                              title="Eliminar (solo si es el último)"
                              className="p-1.5 rounded-lg border transition-colors hover:bg-red-50 text-red-500"
                              style={{ borderColor: '#fecaca' }}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ── */}
            <Paginacion
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              onChange={setPaginaActual}
              totalItems={movsFiltrados.length}
              itemsEnPagina={movsPagina.length}
            />
          </>
        )}
      </div>

      {/* Modales */}
      {modalTipo && (
        <ModalMovimiento
          tipo={modalTipo}
          onClose={() => setModalTipo(null)}
          onSuccess={() => { mostrarToast('Movimiento registrado ✓'); cargarDatos(); }}
        />
      )}
      {modalSaldoInicial && (
        <ModalSaldoInicial
          onClose={() => setModalSaldoInicial(false)}
          onSuccess={() => { mostrarToast('Saldo inicial configurado ✓'); cargarDatos(); }}
        />
      )}

      {modalReiniciar && (
        <ModalReiniciarCaja
          onClose={() => setModalReiniciar(false)}
          onSuccess={() => { mostrarToast('Caja reiniciada. Configura el saldo inicial.'); cargarDatos(); }}
        />
      )}
    </div>
  );
};

export default Caja;