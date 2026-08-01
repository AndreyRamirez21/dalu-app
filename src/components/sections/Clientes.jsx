import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Trophy,
  ShoppingBag,
  Mail,
  Phone,
  TrendingUp,
  Gift,
  Trash2,
  CreditCard,
  CheckCircle,
  X,
  Calendar,
  Shield,
  AlertTriangle,
  Lock
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const BRAND = '#82bbbd';

// ==================== PIN ADMIN ====================
const PIN_ADMIN = '0872'; // ← CAMBIA ESTE PIN POR EL QUE QUIERAS

/* ─── Toast (idéntico a Ventas) ─────────────────────────────────── */
const Toast = ({ mensaje, tipo = 'exito', onDone }) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ backgroundColor: tipo === 'exito' ? BRAND : '#dc2626' }}
    >
      {tipo === 'exito'
        ? <CheckCircle size={18} className="text-white flex-shrink-0" />
        : <AlertTriangle size={18} className="text-white flex-shrink-0" />}
      <span className="text-white font-medium text-sm">{mensaje}</span>
    </div>
  );
};

/* ─── Stat card (idéntica a Ventas) ─────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor, icon: Icon }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{
      borderTop: `2px solid ${accentColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </p>
      {Icon && <Icon size={16} style={{ color: accentColor }} />}
    </div>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
  </div>
);

/* ─── Badge genérico con borde suave (mismo lenguaje que Ventas) ── */
const SoftBadge = ({ texto, icon, color, bg, border }) => (
  <span
    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
    style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
  >
    {icon && <span>{icon}</span>}
    {texto}
  </span>
);

// ==================== MODAL PIN DE SEGURIDAD ====================
const ModalPin = ({ clienteAEliminar, onConfirm, onClose }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-verificar cuando el 4to dígito es ingresado
    if (index === 3 && value) {
      const pinCompleto = [...newPin.slice(0, 3), value].join('');
      verificarPin(pinCompleto);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verificarPin = (pinIngresado) => {
    const pinFinal = pinIngresado || pin.join('');
    if (pinFinal === PIN_ADMIN) {
      onConfirm();
    } else {
      setError(true);
      setShake(true);
      setPin(['', '', '', '']);
      setTimeout(() => {
        setShake(false);
        inputsRef.current[0]?.focus();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${shake ? 'animate-shake' : ''}`}>

        {/* Header rojo */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Acceso Restringido</h3>
          <p className="text-red-100 text-sm mt-1">Ingresa el PIN de administrador</p>
        </div>

        {/* Info del cliente a eliminar */}
        <div className="mx-6 mt-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Vas a eliminar</p>
            <p className="text-sm font-bold text-red-800">{clienteAEliminar?.nombre}</p>
            {clienteAEliminar?.cedula && (
              <p className="text-xs text-red-600">CC: {clienteAEliminar.cedula}</p>
            )}
          </div>
        </div>

        {/* Inputs PIN */}
        <div className="p-6">
          <p className="text-center text-sm text-gray-500 mb-5">
            Esta acción es <span className="font-semibold text-red-600">permanente</span> e irreversible
          </p>

          <div className="flex justify-center space-x-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => inputsRef.current[index] = el}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all"
                style={
                  error
                    ? { borderColor: '#f87171', backgroundColor: '#fef2f2', color: '#dc2626' }
                    : digit
                      ? { borderColor: BRAND, backgroundColor: '#f0fdfa', color: BRAND }
                      : { borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }
                }
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 font-medium mb-4 flex items-center justify-center space-x-1">
              <X size={14} />
              <span>PIN incorrecto. Inténtalo de nuevo.</span>
            </p>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => verificarPin()}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

// ==================== MODAL HISTORIAL ====================
const HISTORIAL_BADGE = {
  Pagado:    { color: '#059669', bg: '#f0fdf4', border: '#86efac' },
  Pendiente: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
};

const ModalHistorialCliente = ({ cliente, onClose }) => {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarVentasCliente();
  }, [cliente.id]);

  const cargarVentasCliente = async () => {
    try {
      setCargando(true);
      const data = await ipcRenderer.invoke('obtener-ventas');
      const ventasCliente = data.filter(v => v.cliente_id === cliente.id);
      setVentas(ventasCliente);
    } catch (error) {
      console.error('Error al cargar ventas del cliente:', error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#F8FAFC' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Historial de Compras</h3>
              <p className="text-sm text-gray-500 mt-1">
                Cliente: <span className="font-medium text-gray-700">{cliente.nombre}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
              <X size={22} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-xl p-3" style={{ border: '1px solid #f1f5f9' }}>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Total Compras</div>
              <div className="text-2xl font-bold text-gray-900">{cliente.numero_compras}</div>
            </div>
            <div className="bg-white rounded-xl p-3" style={{ border: '1px solid #f1f5f9' }}>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Total Gastado</div>
              <div className="text-2xl font-bold" style={{ color: BRAND }}>${(cliente.total_compras || 0).toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl p-3" style={{ border: '1px solid #f1f5f9' }}>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Compras con Tarjeta</div>
              <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>{cliente.compras_con_tarjeta || 0}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {cargando ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400 text-sm">Cargando ventas…</div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingBag size={40} className="text-gray-300 mb-4" />
              <p className="text-gray-400 text-sm">Este cliente no tiene compras registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ventas.map((venta) => {
                const badge = HISTORIAL_BADGE[venta.estado] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
                return (
                  <div
                    key={venta.id}
                    className="bg-white rounded-xl p-4 transition-colors hover:bg-gray-50/70"
                    style={{ border: '1px solid #f1f5f9' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold" style={{ color: BRAND }}>{venta.numero_venta}</span>
                          <SoftBadge texto={venta.estado} color={badge.color} bg={badge.bg} border={badge.border} />
                          {venta.descuento_porcentaje > 0 && (
                            <SoftBadge texto={`-${venta.descuento_porcentaje}% Descuento`} color="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar size={13} className="mr-1.5" />
                            {new Date(venta.fecha).toLocaleString('es-ES', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center">
                            <CreditCard size={13} className="mr-1.5" />
                            {venta.metodo_pago}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Total</div>
                        <div className="text-lg font-bold text-gray-900">${venta.total.toFixed(2)}</div>
                        {venta.descuento_monto > 0 && (
                          <div className="text-xs" style={{ color: '#059669' }}>Ahorro: ${venta.descuento_monto.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    {venta.notas && (
                      <div className="mt-3 pt-3 text-xs text-gray-500" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <span className="font-medium text-gray-600">Notas:</span> {venta.notas}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 flex justify-end" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#F8FAFC' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [mostrarPin, setMostrarPin] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesVIP: 0,
    totalGastado: 0,
    comprasPromedio: 0
  });

  const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const data = await ipcRenderer.invoke('obtener-clientes-con-estadisticas');
      setClientes(data);
      calcularEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const calcularEstadisticas = (clientesData) => {
    const totalClientes = clientesData.length;
    const clientesVIP = clientesData.filter(c => c.numero_compras >= 3).length;
    const totalGastado = clientesData.reduce((sum, c) => sum + (c.total_compras || 0), 0);
    const comprasPromedio = totalClientes > 0 ? totalGastado / totalClientes : 0;
    setStats({ totalClientes, clientesVIP, totalGastado, comprasPromedio });
  };

  // ── Iniciar flujo de eliminación ──
  const iniciarEliminacion = (e, cliente) => {
    e.stopPropagation(); // evitar abrir el modal de historial
    setClienteAEliminar(cliente);
    setMostrarPin(true);
  };

  // ── Ejecutar eliminación después del PIN ──
  const confirmarEliminacion = async () => {
    setMostrarPin(false);
    try {
      const resultado = await ipcRenderer.invoke('eliminar-cliente', clienteAEliminar.id);
      if (resultado.success) {
        mostrarToast(`Cliente "${clienteAEliminar.nombre}" eliminado correctamente`, 'exito');
        await cargarClientes();
      } else {
        mostrarToast(resultado.error || 'No se pudo eliminar el cliente', 'error');
      }
    } catch (error) {
      mostrarToast('Error al eliminar el cliente', 'error');
    } finally {
      setClienteAEliminar(null);
    }
  };

  const getNivelFidelidad = (cliente) => {
    const { descuento_aplicado_3, descuento_aplicado_6 } = cliente;
    if (descuento_aplicado_6 === 1) return { nivel: 'Premium', icon: '💎', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    if (descuento_aplicado_3 === 1) return { nivel: 'Gold', icon: '🥇', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' };
    if (cliente.numero_compras >= 1) return { nivel: 'Activo', icon: '⭐', color: '#059669', bg: '#f0fdf4', border: '#86efac' };
    return { nivel: 'Nuevo', icon: '👤', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  };

  const getEstadoFidelidad = (cliente) => {
    const { compras_con_tarjeta, tarjeta_fidelidad_entregada } = cliente;
    if (!tarjeta_fidelidad_entregada) {
      return { icono: '—', mensaje: 'Sin tarjeta', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' };
    }
    const numCompras = compras_con_tarjeta || 0;
    return {
      icono: '✅',
      mensaje: `${numCompras} compra${numCompras !== 1 ? 's' : ''} con tarjeta`,
      color: BRAND,
      bg: '#f0fdfa',
      border: '#99d6d8'
    };
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cedula && cliente.cedula.includes(searchTerm)) ||
    (cliente.celular && cliente.celular.includes(searchTerm))
  );

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onDone={() => setToast(null)} />
      )}

      {/* ── Tarjetas de estadísticas ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Clientes"
          value={stats.totalClientes}
          sub="registrados"
          accentColor={BRAND}
          icon={Users}
        />
        <StatCard
          label="Clientes VIP"
          value={stats.clientesVIP}
          sub="3+ compras"
          accentColor="#d97706"
          icon={Trophy}
        />
        <StatCard
          label="Total Gastado"
          value={`$${stats.totalGastado.toFixed(2)}`}
          sub="ingresos por clientes"
          accentColor="#059669"
          icon={TrendingUp}
        />
        <StatCard
          label="Ticket Promedio"
          value={`$${stats.comprasPromedio.toFixed(2)}`}
          sub="por cliente"
          accentColor="#6366f1"
          icon={ShoppingBag}
        />
      </div>

      {/* Programa de Fidelidad */}
      <div
        className="bg-white rounded-xl p-6 mb-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Gift size={22} style={{ color: BRAND }} />
          <h3 className="text-lg font-bold text-gray-900">Programa de Fidelidad</h3>
        </div>
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f0fdfa', border: '1px solid #99d6d8' }}>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} style={{ color: BRAND }} />
            <h4 className="font-semibold text-gray-800 text-sm">¿Cómo funciona?</h4>
          </div>
          <ol className="text-sm text-gray-600 space-y-1 ml-6 list-decimal">
            <li>La tarjeta se entrega en la <strong>primera compra mayor a $30,000</strong></li>
            <li>El cliente debe presentar la tarjeta en cada compra para acumular beneficios</li>
            <li>Los descuentos se aplican automáticamente al cumplir los requisitos</li>
          </ol>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ border: '1px solid #fcd34d', backgroundColor: '#fffbeb' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🥇</span>
              <div className="font-semibold text-gray-800 text-sm">Nivel Gold — 10% OFF</div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>✓ En la <strong>3ra compra con tarjeta</strong></div>
              <div>✓ Compra mayor a <strong>$30,000</strong></div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💎</span>
              <div className="font-semibold text-gray-800 text-sm">Nivel Premium — 15% OFF</div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>✓ En la <strong>6ta compra con tarjeta</strong></div>
              <div>✓ Compra mayor a <strong>$30,000</strong></div>
              <div>✓ Dentro de <strong>10 meses</strong> desde recibir tarjeta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Lista de Clientes ({clientesFiltrados.length})</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Shield size={13} className="text-red-400" />
              <span>Eliminar requiere PIN de administrador</span>
            </div>
          </div>
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o celular…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': BRAND }}
              onFocus={(e) => { e.target.style.borderColor = BRAND; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-14 text-center">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No hay clientes registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  {['Cliente', 'Contacto', 'Compras', 'Total Gastado', 'Nivel', 'Estado Fidelidad', 'Última Compra', 'Acciones'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest ${i >= 2 ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientesFiltrados.map((cliente) => {
                  const fidelidad = getNivelFidelidad(cliente);
                  const estadoFidelidad = getEstadoFidelidad(cliente);

                  return (
                    <tr
                      key={cliente.id}
                      onClick={() => setClienteSeleccionado(cliente)}
                      className="transition-colors hover:bg-gray-50/70 cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#f0fdfa' }}
                          >
                            <span className="font-bold text-sm" style={{ color: BRAND }}>
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{cliente.nombre}</div>
                            {cliente.cedula && (
                              <div className="text-xs text-gray-400">CC: {cliente.cedula}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {cliente.celular && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone size={12} className="mr-1.5" />
                              {cliente.celular}
                            </div>
                          )}
                          {cliente.correo && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail size={12} className="mr-1.5" />
                              {cliente.correo}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">{cliente.numero_compras}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="text-sm font-semibold" style={{ color: BRAND }}>${(cliente.total_compras || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <SoftBadge texto={fidelidad.nivel} icon={fidelidad.icon} color={fidelidad.color} bg={fidelidad.bg} border={fidelidad.border} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div
                          className="inline-flex flex-col items-center px-3 py-1.5 rounded-lg"
                          style={{ color: estadoFidelidad.color, backgroundColor: estadoFidelidad.bg, border: `1px solid ${estadoFidelidad.border}` }}
                        >
                          <span className="text-base leading-none mb-1">{estadoFidelidad.icono}</span>
                          <span className="text-[11px] font-medium whitespace-nowrap">{estadoFidelidad.mensaje}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="text-xs text-gray-500">
                          {cliente.ultima_compra
                            ? new Date(cliente.ultima_compra).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </div>
                      </td>

                      {/* ── COLUMNA ACCIONES ── */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={(e) => iniciarEliminacion(e, cliente)}
                          title="Eliminar cliente (requiere PIN)"
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Historial */}
      {clienteSeleccionado && (
        <ModalHistorialCliente
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
        />
      )}

      {/* Modal PIN */}
      {mostrarPin && clienteAEliminar && (
        <ModalPin
          clienteAEliminar={clienteAEliminar}
          onConfirm={confirmarEliminacion}
          onClose={() => {
            setMostrarPin(false);
            setClienteAEliminar(null);
          }}
        />
      )}
    </div>
  );
};

export default Clientes;