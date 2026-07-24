import React, { useState, useEffect, useCallback } from 'react';

const { ipcRenderer } = window.require('electron');

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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Badge de tipo ────────────────────────────────────────────────────────────

const TipoBadge = ({ tipo, origen }) => {
  const config = {
    apertura: { label: 'Apertura', bg: '#e0f2fe', color: '#0369a1' },
    entrada:  { label: origen === 'venta' ? 'Venta' : 'Entrada',  bg: '#dcfce7', color: '#15803d' },
    salida:   { label: origen === 'gasto' ? 'Gasto' : 'Salida',   bg: '#fee2e2', color: '#dc2626' },
    ajuste:   { label: 'Ajuste',  bg: '#fef9c3', color: '#a16207' },
  };
  const c = config[tipo] || config.ajuste;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, background: c.bg, color: c.color
    }}>
      {c.label}
    </span>
  );
};

// ─── Paginación ───────────────────────────────────────────────────────────────

const ITEMS_POR_PAGINA = 10;

const Paginacion = ({ paginaActual, totalPaginas, onChange, totalItems, itemsEnPagina }) => {
  if (totalPaginas <= 1) return null;

  // Genera los números de página visibles (máx 5 botones)
  const getPages = () => {
    const pages = [];
    let start = Math.max(1, paginaActual - 2);
    let end   = Math.min(totalPaginas, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const btnBase = {
    minWidth: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
    background: '#fff', color: '#374151', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s', lineHeight: 0,
  };
  const btnActivo = {
    ...btnBase,
    border: '1.5px solid #6366f1', background: '#ede9fe', color: '#6366f1',
  };
  const btnDisabled = {
    ...btnBase, opacity: 0.4, cursor: 'not-allowed',
  };

  const desde = (paginaActual - 1) * ITEMS_POR_PAGINA + 1;
  const hasta = desde + itemsEnPagina - 1;

  return (
    <div style={{
      padding: '14px 24px',
      borderTop: '1px solid #f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '12px',
    }}>
      {/* Info */}
      <span style={{ fontSize: '13px', color: '#9ca3af' }}>
        Mostrando <b style={{ color: '#374151' }}>{desde}–{hasta}</b> de{' '}
        <b style={{ color: '#374151' }}>{totalItems}</b> movimientos
      </span>

      {/* Controles */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* Anterior */}
        <button
          onClick={() => onChange(paginaActual - 1)}
          disabled={paginaActual === 1}
          style={paginaActual === 1 ? btnDisabled : btnBase}
        >
          <IconChevronLeft />
        </button>

        {/* Páginas */}
        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={p === paginaActual ? btnActivo : btnBase}
          >
            {p}
          </button>
        ))}

        {/* Siguiente */}
        <button
          onClick={() => onChange(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          style={paginaActual === totalPaginas ? btnDisabled : btnBase}
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '32px', width: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700, color: '#111' }}>
          Registrar movimiento
        </h2>

        {/* Tipo */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { v: 'entrada', label: '↑ Entrada', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
            { v: 'salida',  label: '↓ Salida',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
            { v: 'ajuste',  label: '⟳ Ajuste',  color: '#a16207', bg: '#fef9c3', border: '#fde047' },
          ].map(opt => (
            <button key={opt.v} onClick={() => setTipo(opt.v)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px', transition: 'all .15s',
              border: tipo === opt.v ? `2px solid ${opt.border}` : '2px solid #e5e7eb',
              background: tipo === opt.v ? opt.bg : '#f9fafb',
              color: tipo === opt.v ? opt.color : '#6b7280',
            }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Concepto */}
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Concepto *
        </label>
        <input
          value={concepto} onChange={e => setConcepto(e.target.value)}
          placeholder="Describe el movimiento..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '8px',
            border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box',
            outline: 'none', transition: 'border .15s',
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        {/* Sugerencias */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {(conceptosSugeridos[tipo] || []).map(s => (
            <button key={s} onClick={() => setConcepto(s)} style={{
              padding: '4px 10px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer',
              border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#6b7280',
              transition: 'all .1s',
            }}
            onMouseEnter={e => { e.target.style.background='#e5e7eb'; e.target.style.color='#111'; }}
            onMouseLeave={e => { e.target.style.background='#f3f4f6'; e.target.style.color='#6b7280'; }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Monto */}
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Monto *
        </label>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: '#9ca3af', fontWeight: 700, fontSize: '14px'
          }}>$</span>
          <input
            type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', padding: '10px 14px 10px 28px', borderRadius: '10px',
              border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box',
              outline: 'none', transition: 'border .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Notas */}
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Notas (opcional)
        </label>
        <textarea
          value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Información adicional..."
          rows={2}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px',
            border: '1.5px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box',
            resize: 'none', outline: 'none', transition: 'border .15s', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
            background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '11px', borderRadius: '10px', border: 'none',
            background: tipo === 'entrada' ? '#16a34a' : tipo === 'salida' ? '#dc2626' : '#d97706',
            color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Guardando...' : 'Registrar'}
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '36px', width: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '28px'
        }}>
          💰
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111' }}>
          Configurar saldo inicial
        </h2>
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
          Ingresa el dinero que tienes actualmente en caja. Este será el punto de partida de tu registro.
        </p>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            color: '#9ca3af', fontWeight: 700, fontSize: '16px'
          }}>$</span>
          <input
            type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)}
            placeholder="0"
            autoFocus
            style={{
              width: '100%', padding: '14px 16px 14px 32px', borderRadius: '12px',
              border: '2px solid #e5e7eb', fontSize: '20px', fontWeight: 700,
              boxSizing: 'border-box', outline: 'none', textAlign: 'center',
              transition: 'border .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
            background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff',
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Guardando...' : 'Confirmar saldo inicial'}
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '36px', width: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '28px'
        }}>
          ⚠️
        </div>

        {!confirmando ? (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111' }}>
              Reiniciar caja
            </h2>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
              Esto <b>borrará permanentemente</b> todo el historial de movimientos de caja
              (saldo inicial, entradas, salidas y ajustes). Esta acción no se puede deshacer.
            </p>

            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Contraseña de administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && setConfirmando(true)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '16px', letterSpacing: '4px',
                boxSizing: 'border-box', outline: 'none', textAlign: 'center',
                transition: 'border .15s', marginBottom: '16px',
              }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
                background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!password.trim()) return setError('Ingresa la contraseña.');
                  setError('');
                  setConfirmando(true);
                }}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                  background: '#dc2626', color: '#fff',
                  fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                }}>
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>
              ¿Estás completamente seguro?
            </h2>
            <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
              Vas a eliminar <b>todos</b> los movimientos de caja registrados hasta hoy.
              Después de esto tendrás que configurar un nuevo saldo inicial.
            </p>

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmando(false)} style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
                background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
              }}>
                Volver
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                background: '#dc2626', color: '#fff',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Reiniciando...' : 'Sí, reiniciar caja'}
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

  // Resetear página al cambiar filtros o búsqueda
  useEffect(() => { setPaginaActual(1); }, [filtro, busqueda]);

  const mostrarToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

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

  // ── Filtrado ──
  const movsFiltrados = movimientos.filter(m => {
    const matchFiltro = filtro === 'todos' || m.tipo === filtro;
    const matchBusqueda = !busqueda || m.concepto.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  // ── Paginación ──
  const totalPaginas = Math.max(1, Math.ceil(movsFiltrados.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const movsPagina = movsFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const esSaldoBajo = saldo < 50000;
  const esSaldoMedio = saldo >= 50000 && saldo < 200000;
  const saldoColor = esSaldoBajo ? '#dc2626' : esSaldoMedio ? '#d97706' : '#16a34a';
  const saldoBg = esSaldoBajo ? '#fee2e2' : esSaldoMedio ? '#fef3c7' : '#dcfce7';

  return (
    <div style={{ padding: '28px', maxWidth: '1600px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
          background: toast.tipo === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.tipo === 'error' ? '#dc2626' : '#15803d',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'fadeIn .2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Tarjetas superiores ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>

        {/* Saldo actual */}
        <div style={{
          gridColumn: '1 / 2',
          background: saldoBg, borderRadius: '16px', padding: '20px 24px',
          border: `1.5px solid ${saldoColor}22`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: saldoColor, textTransform: 'uppercase' }}>
              SALDO EN CAJA
            </span>
            <div style={{ background: saldoColor + '22', borderRadius: '8px', padding: '6px', color: saldoColor }}>
              <IconWallet />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: saldoColor, lineHeight: 1.1 }}>
            {loading ? '...' : fmt(saldo)}
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: saldoColor + 'aa' }}>
            {esSaldoBajo ? '⚠ Saldo bajo' : esSaldoMedio ? '• Saldo moderado' : '✓ Saldo saludable'}
          </div>
        </div>

        {/* Entradas hoy */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#6b7280', textTransform: 'uppercase' }}>
              ENTRADAS HOY
            </span>
            <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '6px', color: '#16a34a' }}>
              <IconArrowDown />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>
            {loading ? '...' : fmt(resumenDia.total_entradas)}
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#9ca3af' }}>
            {resumenDia.total_movimientos} movimiento{resumenDia.total_movimientos !== 1 ? 's' : ''} hoy
          </div>
        </div>

        {/* Salidas hoy */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#6b7280', textTransform: 'uppercase' }}>
              SALIDAS HOY
            </span>
            <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '6px', color: '#dc2626' }}>
              <IconArrowUp />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>
            {loading ? '...' : fmt(resumenDia.total_salidas)}
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#9ca3af' }}>
            Balance: {fmt(resumenDia.total_entradas - resumenDia.total_salidas)}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#6b7280', textTransform: 'uppercase' }}>
              ACCIONES RÁPIDAS
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setModalTipo('entrada')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
              borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#15803d',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer', width: '100%',
            }}>
              <IconPlus /> Registrar entrada
            </button>
            <button onClick={() => setModalTipo('salida')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
              borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer', width: '100%',
            }}>
              <IconMinus /> Registrar salida
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabla de movimientos ── */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Cabecera de tabla */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>
              Movimientos de caja
            </h3>
            <span style={{
              background: '#f3f4f6', color: '#6b7280', borderRadius: '999px',
              padding: '2px 10px', fontSize: '12px', fontWeight: 600,
            }}>
              {movsFiltrados.length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Búsqueda */}
            <input
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar concepto..."
              style={{
                padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
                fontSize: '13px', outline: 'none', width: '180px',
              }}
            />

            {/* Filtro tipo */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { v: 'todos',   label: 'Todos' },
                { v: 'entrada', label: 'Entradas' },
                { v: 'salida',  label: 'Salidas' },
                { v: 'ajuste',  label: 'Ajustes' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setFiltro(opt.v)} style={{
                  padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all .1s',
                  border: filtro === opt.v ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                  background: filtro === opt.v ? '#ede9fe' : '#fff',
                  color: filtro === opt.v ? '#6366f1' : '#6b7280',
                }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Botón ajuste / saldo inicial */}
            <button onClick={() => {
              if (movimientos.length === 0) setModalSaldoInicial(true);
              else setModalTipo('ajuste');
            }} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#6b7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}>
              <IconFilter />
              {movimientos.length === 0 ? 'Saldo inicial' : 'Ajuste'}
            </button>
            {/* Botón reiniciar caja */}
            <button onClick={() => setModalReiniciar(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              borderRadius: '10px', border: '1.5px solid #fecaca', background: '#fff',
              color: '#dc2626', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}>
              <IconTrash /> Reiniciar caja
            </button>
            {/* Refresh */}
            <button onClick={cargarDatos} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px',
              borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#6b7280', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            }}>
              <IconRefresh /> Actualizar
            </button>
          </div>
        </div>

        {/* Sin movimientos */}
        {!loading && movimientos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💼</div>
            <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: 600 }}>
              No hay movimientos registrados
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
              Comienza configurando el saldo que tienes actualmente en caja.
            </p>
            <button onClick={() => setModalSaldoInicial(true)} style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
            }}>
              Configurar saldo inicial
            </button>
          </div>
        )}

        {/* Tabla */}
        {movimientos.length > 0 && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Tipo', 'Concepto', 'Monto', 'Saldo resultante', 'Fecha', ''].map(h => (
                      <th key={h} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: '11px', fontWeight: 700, color: '#6b7280',
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        borderBottom: '1px solid #f3f4f6',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Cargando...</td></tr>
                  ) : movsPagina.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Sin resultados</td></tr>
                  ) : movsPagina.map((m, idx) => {
                    const esSalida = m.tipo === 'salida';
                    // El botón de eliminar solo aparece en el movimiento #1 global (idx===0 en pág 1)
                    const esElUltimo = paginaSegura === 1 && idx === 0;
                    return (
                      <tr key={m.id} style={{
                        borderBottom: '1px solid #f9fafb',
                        background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <TipoBadge tipo={m.tipo} origen={m.origen} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#111' }}>{m.concepto}</div>
                          {m.notas && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{m.notas}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '14px',
                            color: esSalida ? '#dc2626' : '#16a34a',
                          }}>
                            {esSalida ? '−' : '+'}{fmt(m.monto)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                          {fmt(m.saldo_resultante)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', color: '#374151' }}>{fmtFecha(m.fecha)}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtHora(m.fecha)}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {esElUltimo && (
                            <button onClick={() => handleEliminar(m.id)} style={{
                              padding: '5px 8px', borderRadius: '7px', border: '1px solid #fee2e2',
                              background: '#fff', color: '#dc2626', cursor: 'pointer', lineHeight: 0,
                            }}
                            title="Eliminar (solo si es el último)"
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

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Caja;