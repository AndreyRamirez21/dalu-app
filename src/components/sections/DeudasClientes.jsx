import React, { useState } from 'react';
import {
  Search, User, DollarSign, Receipt, X, CreditCard, FileText,
  CheckCircle, AlertCircle, Plus, Store, Users, Edit2, Trash2, Calendar
} from 'lucide-react';
import { useDeudasClientes } from '../../api/useDeudasClientes';
import { useDeudas } from '../../api/useDeudas';

const BRAND = '#82bbbd';     // Módulo "Deudas de Clientes"
const ACCENT = '#6366f1';    // Módulo "Mis Deudas" (indigo)

/* ─── Stat card (mismo patrón que Ventas / Gastos) ─────────────── */
const StatCard = ({ label, value, sub, accentColor }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {label}
    </p>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
  </div>
);

/* ─── Botones ────────────────────────────────────────────────── */
const BtnSolid = ({ onClick, disabled, icon: Icon, color, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
    style={{ backgroundColor: color }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const BtnOutline = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm ${className}`}
  >
    {children}
  </button>
);

/* ─── Badge de estado ───────────────────────────────────────────── */
const ESTADO_STYLE = {
  Pagado:    { color: '#059669', bg: '#f0fdf4', border: '#86efac' },
  Pendiente: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  Vencida:   { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
};

const EstadoBadge = ({ estado }) => {
  const s = ESTADO_STYLE[estado] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {estado}
    </span>
  );
};

/* ─── Icon button de acciones ───────────────────────────────────── */
const IconAction = ({ onClick, title, tone, children }) => {
  const tones = {
    green:  'hover:bg-green-50 text-gray-400 hover:text-green-600',
    indigo: 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600',
    red:    'hover:bg-red-50 text-gray-400 hover:text-red-500',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
};

const DeudasCompleto = () => {
  // Hooks para deudas de clientes
  const {
    deudas: deudasClientes,
    estadisticas: statsClientes,
    loading: loadingClientes,
    registrarAbono,
    buscarDeudas: buscarDeudasClientes,
    cargarDeudas: cargarDeudasClientes,
    obtenerHistorialAbonos
  } = useDeudasClientes();

  // Hooks para deudas propias
  const {
    deudas: deudasPropias,
    estadisticas: statsPropias,
    loading: loadingPropias,
    agregarDeuda,
    registrarPago,
    actualizarDeuda,
    eliminarDeuda,
    buscarDeudas: buscarDeudasPropias,
    obtenerHistorialPagos
  } = useDeudas();

  const [pestanaActiva, setPestanaActiva] = useState('clientes'); // 'clientes' o 'propias'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Modales para deudas de clientes
  const [showModalAbonoCliente, setShowModalAbonoCliente] = useState(false);
  const [showModalHistorialCliente, setShowModalHistorialCliente] = useState(false);
  const [deudaClienteSeleccionada, setDeudaClienteSeleccionada] = useState(null);
  const [historialAbonosCliente, setHistorialAbonosCliente] = useState([]);

  // Modales para deudas propias
  const [showModalNuevaDeuda, setShowModalNuevaDeuda] = useState(false);
  const [showModalEditarDeuda, setShowModalEditarDeuda] = useState(false);
  const [showModalPagoPropio, setShowModalPagoPropio] = useState(false);
  const [showModalHistorialPropio, setShowModalHistorialPropio] = useState(false);
  const [deudaPropiaSeleccionada, setDeudaPropiaSeleccionada] = useState(null);
  const [historialPagosPropio, setHistorialPagosPropio] = useState([]);

  const [formAbonoCliente, setFormAbonoCliente] = useState({
    monto_abono: '',
    monto_recibido: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  const [formNuevaDeuda, setFormNuevaDeuda] = useState({
    acreedor: '',
    factura: '',
    tipo_acreedor: 'Otro',
    monto_total: '',
    monto_pagado: '',
    notas: '',
    fecha_recordatorio: ''
  });

  const [formPagoPropio, setFormPagoPropio] = useState({
    monto_pago: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];
  const tiposAcreedor = ['Banco', 'Proveedor', 'Servicios', 'Préstamo Personal', 'Otro'];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      if (pestanaActiva === 'clientes') {
        buscarDeudasClientes(value);
      } else {
        buscarDeudasPropias(value);
      }
    } else {
      if (pestanaActiva === 'clientes') {
        cargarDeudasClientes();
      } else {
        // Se recargará automáticamente por el useEffect del hook
      }
    }
  };

  // ==================== FUNCIONES DEUDAS DE CLIENTES ====================

  const handleRegistrarAbonoCliente = (deuda) => {
    setDeudaClienteSeleccionada(deuda);
    setFormAbonoCliente({
      monto_abono: '',
      monto_recibido: '',
      metodo_pago: 'Efectivo',
      notas: ''
    });
    setShowModalAbonoCliente(true);
  };

  const handleVerHistorialCliente = async (deuda) => {
    setDeudaClienteSeleccionada(deuda);
    const historial = await obtenerHistorialAbonos(deuda.id);
    setHistorialAbonosCliente(historial || []);
    setShowModalHistorialCliente(true);
  };

  const handleSubmitAbonoCliente = async () => {
    if (!formAbonoCliente.monto_abono || parseFloat(formAbonoCliente.monto_abono) <= 0) {
      showNotification('Ingresa un monto de abono válido', 'error');
      return;
    }

    if (!formAbonoCliente.monto_recibido || parseFloat(formAbonoCliente.monto_recibido) <= 0) {
      showNotification('Ingresa el monto recibido del cliente', 'error');
      return;
    }

    const montoAbono = parseFloat(formAbonoCliente.monto_abono);
    const montoRecibido = parseFloat(formAbonoCliente.monto_recibido);
    const montoPendiente = deudaClienteSeleccionada.monto_pendiente;

    if (montoRecibido < montoAbono) {
      showNotification('El monto recibido debe ser mayor o igual al abono', 'error');
      return;
    }

    if (montoAbono > montoPendiente + 0.01) {
      showNotification(`El monto excede la deuda pendiente de $${montoPendiente.toFixed(2)}`, 'error');
      return;
    }

    try {
      await registrarAbono(
        deudaClienteSeleccionada.id,
        montoAbono,
        formAbonoCliente.metodo_pago,
        formAbonoCliente.notas
      );

      const cambio = montoRecibido - montoAbono;

      setShowModalAbonoCliente(false);
      setDeudaClienteSeleccionada(null);
      showNotification(
        cambio > 0
          ? `Abono registrado. Devolver $${cambio.toFixed(2)} al cliente`
          : 'Abono registrado exitosamente',
        'success'
      );
    } catch (error) {
      console.error('Error al registrar abono:', error);
      showNotification('Error al registrar el abono', 'error');
    }
  };

  // ==================== FUNCIONES DEUDAS PROPIAS ====================

  const handleNuevaDeuda = () => {
    setFormNuevaDeuda({
      acreedor: '',
      factura: '',
      tipo_acreedor: 'Otro',
      monto_total: '',
      monto_pagado: '',
      notas: '',
      fecha_recordatorio: ''
    });
    setShowModalNuevaDeuda(true);
  };

  const handleSubmitNuevaDeuda = async () => {
    if (!formNuevaDeuda.acreedor || !formNuevaDeuda.monto_total) {
      showNotification('Completa los campos obligatorios', 'error');
      return;
    }

    const resultado = await agregarDeuda({
      ...formNuevaDeuda,
      monto_total: parseFloat(formNuevaDeuda.monto_total),
      monto_pagado: formNuevaDeuda.monto_pagado ? parseFloat(formNuevaDeuda.monto_pagado) : 0
    });

    if (resultado.success) {
      setShowModalNuevaDeuda(false);
      showNotification('Deuda registrada exitosamente', 'success');
    } else {
      showNotification('Error al registrar la deuda', 'error');
    }
  };

  const handleEditarDeuda = (deuda) => {
    setDeudaPropiaSeleccionada(deuda);
    setFormNuevaDeuda({
      acreedor: deuda.acreedor,
      factura: deuda.factura || '',
      tipo_acreedor: deuda.tipo_acreedor,
      monto_total: deuda.monto_total,
      monto_pagado: deuda.monto_pagado,
      notas: deuda.notas || '',
      fecha_recordatorio: deuda.fecha_recordatorio || ''
    });
    setShowModalEditarDeuda(true);
  };

  const handleSubmitEditarDeuda = async () => {
    if (!formNuevaDeuda.acreedor || !formNuevaDeuda.monto_total) {
      showNotification('Completa los campos obligatorios', 'error');
      return;
    }

    const resultado = await actualizarDeuda(deudaPropiaSeleccionada.id, {
      ...formNuevaDeuda,
      monto_total: parseFloat(formNuevaDeuda.monto_total)
    });

    if (resultado.success) {
      setShowModalEditarDeuda(false);
      setDeudaPropiaSeleccionada(null);
      showNotification('Deuda actualizada exitosamente', 'success');
    } else {
      showNotification('Error al actualizar la deuda', 'error');
    }
  };

  const handleEliminarDeuda = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta deuda?')) {
      const resultado = await eliminarDeuda(id);
      if (resultado.success) {
        showNotification('Deuda eliminada exitosamente', 'success');
      } else {
        showNotification('Error al eliminar la deuda', 'error');
      }
    }
  };

  const handleRegistrarPagoPropio = (deuda) => {
    setDeudaPropiaSeleccionada(deuda);
    setFormPagoPropio({
      monto_pago: '',
      metodo_pago: 'Efectivo',
      notas: ''
    });
    setShowModalPagoPropio(true);
  };

  const handleSubmitPagoPropio = async () => {
    if (!formPagoPropio.monto_pago || parseFloat(formPagoPropio.monto_pago) <= 0) {
      showNotification('Ingresa un monto válido', 'error');
      return;
    }

    const montoPendiente = deudaPropiaSeleccionada.monto_total - deudaPropiaSeleccionada.monto_pagado;
    const montoPago = parseFloat(formPagoPropio.monto_pago);

    if (montoPago > montoPendiente + 0.01) {
      showNotification(`El monto excede la deuda pendiente de $${montoPendiente.toFixed(2)}`, 'error');
      return;
    }

    const resultado = await registrarPago(
      deudaPropiaSeleccionada.id,
      montoPago,
      formPagoPropio.metodo_pago,
      formPagoPropio.notas
    );

    if (resultado.success) {
      setShowModalPagoPropio(false);
      setDeudaPropiaSeleccionada(null);
      showNotification('Pago registrado exitosamente', 'success');
    } else {
      showNotification('Error al registrar el pago', 'error');
    }
  };

  const handleVerHistorialPropio = async (deuda) => {
    setDeudaPropiaSeleccionada(deuda);
    const historial = await obtenerHistorialPagos(deuda.id);
    setHistorialPagosPropio(historial || []);
    setShowModalHistorialPropio(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estadisticas = pestanaActiva === 'clientes' ? statsClientes : statsPropias;
  const deudasMostrar = pestanaActiva === 'clientes' ? deudasClientes : deudasPropias;
  const loading = pestanaActiva === 'clientes' ? loadingClientes : loadingPropias;
  const moduleColor = pestanaActiva === 'clientes' ? BRAND : ACCENT;

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {/* Notificación */}
      {notification && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {notification.type === 'success' ? (
                  <CheckCircle size={44} style={{ color: '#059669' }} />
                ) : (
                  <AlertCircle size={44} style={{ color: '#dc2626' }} />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {notification.type === 'success' ? 'Éxito' : 'Error'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
                style={{ backgroundColor: notification.type === 'success' ? BRAND : '#dc2626' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Deudas</h2>
          <p className="text-sm text-gray-400 mt-1">
            {pestanaActiva === 'clientes'
              ? 'Administra las deudas pendientes de tus clientes'
              : 'Gestiona los préstamos y deudas de tu negocio'}
          </p>
        </div>
        {pestanaActiva === 'propias' && (
          <BtnSolid onClick={handleNuevaDeuda} icon={Plus} color={ACCENT}>
            Nueva Deuda
          </BtnSolid>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <button
          onClick={() => { setPestanaActiva('clientes'); setSearchTerm(''); }}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
          style={pestanaActiva === 'clientes'
            ? { backgroundColor: BRAND, color: '#fff' }
            : { color: '#6b7280' }
          }
        >
          <Users size={18} />
          <span>Deudas de Clientes</span>
        </button>
        <button
          onClick={() => { setPestanaActiva('propias'); setSearchTerm(''); }}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
          style={pestanaActiva === 'propias'
            ? { backgroundColor: ACCENT, color: '#fff' }
            : { color: '#6b7280' }
          }
        >
          <Store size={18} />
          <span>Mis Deudas</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pestanaActiva === 'clientes' ? (
          <>
            <StatCard
              label="Total en Deudas"
              value={`$${estadisticas?.monto_total_pendiente?.toFixed(2) || '0.00'}`}
              sub={`${estadisticas?.total_deudas || 0} deudas activas`}
              accentColor="#dc2626"
            />
            <StatCard
              label="Total Pagado"
              value={`$${estadisticas?.monto_total_pagado?.toFixed(2) || '0.00'}`}
              sub="en abonos realizados"
              accentColor="#059669"
            />
            <StatCard
              label="Clientes con Deuda"
              value={estadisticas?.clientes_con_deuda || 0}
              sub="clientes únicos"
              accentColor="#d97706"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Total Adeudado"
              value={`$${estadisticas?.total_adeudado?.toFixed(2) || '0.00'}`}
              sub={`${estadisticas?.total_deudas || 0} deudas registradas`}
              accentColor="#dc2626"
            />
            <StatCard
              label="Total Pagado"
              value={`$${estadisticas?.total_pagado?.toFixed(2) || '0.00'}`}
              sub="en pagos realizados"
              accentColor="#059669"
            />
            <StatCard
              label="Saldo Pendiente"
              value={`$${estadisticas?.total_pendiente?.toFixed(2) || '0.00'}`}
              sub={`${estadisticas?.deudas_pendientes || 0} pendientes`}
              accentColor="#d97706"
            />
          </>
        )}
      </div>

      {/* Lista de Deudas */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {pestanaActiva === 'clientes' ? 'Deudas Pendientes' : 'Mis Deudas Activas'}
          </h3>

          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                pestanaActiva === 'clientes'
                  ? 'Buscar por cliente o número de venta…'
                  : 'Buscar por acreedor o factura…'
              }
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': moduleColor }}
              onFocus={(e) => { e.target.style.borderColor = moduleColor; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && deudasMostrar.length === 0 ? (
            <div className="p-14 text-center text-sm text-gray-400">Cargando…</div>
          ) : deudasMostrar.length === 0 ? (
            <div className="p-14 text-center text-sm text-gray-400">
              {pestanaActiva === 'clientes'
                ? 'No hay deudas pendientes 🎉'
                : 'No tienes deudas registradas'}
            </div>
          ) : pestanaActiva === 'clientes' ? (
            // Tabla de Deudas de Clientes
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  {['Cliente', 'Venta', 'Total Deuda', 'Pagado', 'Pendiente', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deudasMostrar.map((deuda) => (
                  <tr key={deuda.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${BRAND}22` }}
                        >
                          <User size={17} style={{ color: BRAND }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{deuda.cliente_nombre}</div>
                          {deuda.total_abonos > 0 && (
                            <div className="text-xs text-gray-400">{deuda.total_abonos} abono(s)</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold" style={{ color: BRAND }}>{deuda.numero_venta}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${deuda.monto_total.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#059669' }}>${deuda.monto_pagado.toFixed(2)}</div>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(deuda.monto_pagado / deuda.monto_total) * 100}%`, backgroundColor: '#059669' }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: '#dc2626' }}>
                      ${deuda.monto_pendiente.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">{formatDate(deuda.fecha_creacion)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <IconAction onClick={() => handleRegistrarAbonoCliente(deuda)} title="Registrar abono" tone="green">
                          <DollarSign size={16} />
                        </IconAction>
                        {deuda.total_abonos > 0 && (
                          <IconAction onClick={() => handleVerHistorialCliente(deuda)} title="Ver historial" tone="indigo">
                            <Receipt size={16} />
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Tabla de Mis Deudas
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  {['Acreedor', 'Tipo', 'Factura', 'Total', 'Pagado', 'Pendiente', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deudasMostrar.map((deuda) => {
                  const montoPendiente = deuda.monto_total - deuda.monto_pagado;
                  return (
                    <tr key={deuda.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${ACCENT}22` }}
                          >
                            <Store size={17} style={{ color: ACCENT }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{deuda.acreedor}</div>
                            {deuda.notas && (
                              <div className="text-xs text-gray-400 truncate max-w-[160px]">{deuda.notas}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                          {deuda.tipo_acreedor}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{deuda.factura || '-'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${deuda.monto_total.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: '#059669' }}>${deuda.monto_pagado.toFixed(2)}</div>
                        <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${(deuda.monto_pagado / deuda.monto_total) * 100}%`, backgroundColor: '#059669' }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: '#dc2626' }}>
                        ${montoPendiente.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <EstadoBadge estado={deuda.estado} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {deuda.estado !== 'Pagado' && (
                            <IconAction onClick={() => handleRegistrarPagoPropio(deuda)} title="Registrar pago" tone="green">
                              <DollarSign size={16} />
                            </IconAction>
                          )}
                          <IconAction onClick={() => handleEditarDeuda(deuda)} title="Editar" tone="indigo">
                            <Edit2 size={16} />
                          </IconAction>
                          {deuda.total_pagos > 0 && (
                            <IconAction onClick={() => handleVerHistorialPropio(deuda)} title="Ver historial" tone="indigo">
                              <Receipt size={16} />
                            </IconAction>
                          )}
                          <IconAction onClick={() => handleEliminarDeuda(deuda.id)} title="Eliminar" tone="red">
                            <Trash2 size={16} />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Registrar Abono Cliente ── */}
      {showModalAbonoCliente && deudaClienteSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Registrar Abono</h3>
              <button
                onClick={() => { setShowModalAbonoCliente(false); setDeudaClienteSeleccionada(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${BRAND}0D`, border: `1px solid ${BRAND}33` }}>
                <div className="text-xs text-gray-500 mb-1">Cliente</div>
                <div className="font-bold text-gray-900 text-base mb-3">{deudaClienteSeleccionada.cliente_nombre}</div>
                <div className="text-xs text-gray-500 mb-1">Venta: {deudaClienteSeleccionada.numero_venta}</div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND}33` }}>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total</div>
                    <div className="font-semibold text-gray-900 text-sm">${deudaClienteSeleccionada.monto_total.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Pagado</div>
                    <div className="font-semibold text-sm" style={{ color: '#059669' }}>${deudaClienteSeleccionada.monto_pagado.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND}33` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Pendiente</span>
                    <span className="font-bold text-lg" style={{ color: '#dc2626' }}>
                      ${deudaClienteSeleccionada.monto_pendiente.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto del Abono *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formAbonoCliente.monto_abono}
                  onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, monto_abono: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto Recibido del Cliente *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formAbonoCliente.monto_recibido}
                  onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, monto_recibido: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                  placeholder="0.00"
                />
              </div>

              {formAbonoCliente.monto_abono && formAbonoCliente.monto_recibido && (
                <div className="rounded-lg p-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Cambio a Devolver</span>
                    <span className="font-bold text-xl" style={{ color: '#d97706' }}>
                      ${(parseFloat(formAbonoCliente.monto_recibido) - parseFloat(formAbonoCliente.monto_abono)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <CreditCard size={14} /><span>Método de Pago</span>
                </label>
                <select
                  value={formAbonoCliente.metodo_pago}
                  onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, metodo_pago: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                >
                  {metodosPago.map((metodo) => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Notas (opcional)</span>
                </label>
                <textarea
                  value={formAbonoCliente.notas}
                  onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, notas: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': BRAND }}
                  rows="2"
                  placeholder="Información adicional…"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
              <BtnOutline onClick={() => { setShowModalAbonoCliente(false); setDeudaClienteSeleccionada(null); }}>
                Cancelar
              </BtnOutline>
              <div className="flex-1">
                <BtnSolid onClick={handleSubmitAbonoCliente} disabled={loading} color="#059669">
                  Registrar Abono
                </BtnSolid>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Historial de Abonos Cliente ── */}
      {showModalHistorialCliente && deudaClienteSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Historial de Abonos</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cliente: {deudaClienteSeleccionada.cliente_nombre} — {deudaClienteSeleccionada.numero_venta}
                </p>
              </div>
              <button
                onClick={() => { setShowModalHistorialCliente(false); setDeudaClienteSeleccionada(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {historialAbonosCliente.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">No hay abonos registrados</div>
              ) : (
                <div className="space-y-2.5">
                  {historialAbonosCliente.map((abono, index) => (
                    <div key={index} className="bg-white rounded-lg p-4" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base" style={{ color: '#059669' }}>${abono.monto_abono.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{formatDate(abono.fecha_abono)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CreditCard size={13} />
                          <span>{abono.metodo_pago}</span>
                        </div>
                        {abono.notas && (
                          <div className="flex items-center gap-1">
                            <FileText size={13} />
                            <span>{abono.notas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nueva Deuda ── */}
      {showModalNuevaDeuda && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Nueva Deuda</h3>
              <button
                onClick={() => setShowModalNuevaDeuda(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Store size={14} /><span>Acreedor *</span>
                </label>
                <input
                  type="text"
                  value={formNuevaDeuda.acreedor}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, acreedor: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="Nombre del acreedor"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Tipo de Acreedor
                </label>
                <select
                  value={formNuevaDeuda.tipo_acreedor}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, tipo_acreedor: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                >
                  {tiposAcreedor.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Número de Factura</span>
                </label>
                <input
                  type="text"
                  value={formNuevaDeuda.factura}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, factura: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="Ej: FAC-001"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto Total *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formNuevaDeuda.monto_total}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_total: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto Pagado</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formNuevaDeuda.monto_pagado}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_pagado: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Calendar size={14} /><span>Fecha de Recordatorio</span>
                </label>
                <input
                  type="date"
                  value={formNuevaDeuda.fecha_recordatorio}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, fecha_recordatorio: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Notas</span>
                </label>
                <textarea
                  value={formNuevaDeuda.notas}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, notas: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': ACCENT }}
                  rows="3"
                  placeholder="Información adicional…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <BtnOutline onClick={() => setShowModalNuevaDeuda(false)}>Cancelar</BtnOutline>
                <div className="flex-1">
                  <BtnSolid onClick={handleSubmitNuevaDeuda} disabled={loading} color={ACCENT}>
                    Guardar Deuda
                  </BtnSolid>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Deuda ── */}
      {showModalEditarDeuda && deudaPropiaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Editar Deuda</h3>
              <button
                onClick={() => { setShowModalEditarDeuda(false); setDeudaPropiaSeleccionada(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Store size={14} /><span>Acreedor *</span>
                </label>
                <input
                  type="text"
                  value={formNuevaDeuda.acreedor}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, acreedor: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="Nombre del acreedor"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Tipo de Acreedor
                </label>
                <select
                  value={formNuevaDeuda.tipo_acreedor}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, tipo_acreedor: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                >
                  {tiposAcreedor.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Número de Factura</span>
                </label>
                <input
                  type="text"
                  value={formNuevaDeuda.factura}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, factura: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="Ej: FAC-001"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto Total *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formNuevaDeuda.monto_total}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_total: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Calendar size={14} /><span>Fecha de Recordatorio</span>
                </label>
                <input
                  type="date"
                  value={formNuevaDeuda.fecha_recordatorio}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, fecha_recordatorio: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Notas</span>
                </label>
                <textarea
                  value={formNuevaDeuda.notas}
                  onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, notas: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': ACCENT }}
                  rows="3"
                  placeholder="Información adicional…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <BtnOutline onClick={() => { setShowModalEditarDeuda(false); setDeudaPropiaSeleccionada(null); }}>
                  Cancelar
                </BtnOutline>
                <div className="flex-1">
                  <BtnSolid onClick={handleSubmitEditarDeuda} disabled={loading} color={ACCENT}>
                    Actualizar Deuda
                  </BtnSolid>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Registrar Pago Propio ── */}
      {showModalPagoPropio && deudaPropiaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Registrar Pago</h3>
              <button
                onClick={() => { setShowModalPagoPropio(false); setDeudaPropiaSeleccionada(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${ACCENT}0D`, border: `1px solid ${ACCENT}33` }}>
                <div className="text-xs text-gray-500 mb-1">Acreedor</div>
                <div className="font-bold text-gray-900 text-base mb-3">{deudaPropiaSeleccionada.acreedor}</div>
                {deudaPropiaSeleccionada.factura && (
                  <div className="text-xs text-gray-500 mb-1">Factura: {deudaPropiaSeleccionada.factura}</div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${ACCENT}33` }}>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total</div>
                    <div className="font-semibold text-gray-900 text-sm">${deudaPropiaSeleccionada.monto_total.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Pagado</div>
                    <div className="font-semibold text-sm" style={{ color: '#059669' }}>${deudaPropiaSeleccionada.monto_pagado.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${ACCENT}33` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Pendiente</span>
                    <span className="font-bold text-lg" style={{ color: '#dc2626' }}>
                      ${(deudaPropiaSeleccionada.monto_total - deudaPropiaSeleccionada.monto_pagado).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <DollarSign size={14} /><span>Monto del Pago *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formPagoPropio.monto_pago}
                  onChange={(e) => setFormPagoPropio({ ...formPagoPropio, monto_pago: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <CreditCard size={14} /><span>Método de Pago</span>
                </label>
                <select
                  value={formPagoPropio.metodo_pago}
                  onChange={(e) => setFormPagoPropio({ ...formPagoPropio, metodo_pago: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': ACCENT }}
                >
                  {metodosPago.map((metodo) => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <FileText size={14} /><span>Notas (opcional)</span>
                </label>
                <textarea
                  value={formPagoPropio.notas}
                  onChange={(e) => setFormPagoPropio({ ...formPagoPropio, notas: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition resize-none"
                  style={{ '--tw-ring-color': ACCENT }}
                  rows="2"
                  placeholder="Información adicional…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <BtnOutline onClick={() => { setShowModalPagoPropio(false); setDeudaPropiaSeleccionada(null); }}>
                  Cancelar
                </BtnOutline>
                <div className="flex-1">
                  <BtnSolid onClick={handleSubmitPagoPropio} disabled={loading} color="#059669">
                    Registrar Pago
                  </BtnSolid>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Historial de Pagos Propio ── */}
      {showModalHistorialPropio && deudaPropiaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Historial de Pagos</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Acreedor: {deudaPropiaSeleccionada.acreedor}
                  {deudaPropiaSeleccionada.factura && ` — ${deudaPropiaSeleccionada.factura}`}
                </p>
              </div>
              <button
                onClick={() => { setShowModalHistorialPropio(false); setDeudaPropiaSeleccionada(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {historialPagosPropio.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">No hay pagos registrados</div>
              ) : (
                <div className="space-y-2.5">
                  {historialPagosPropio.map((pago, index) => (
                    <div key={index} className="bg-white rounded-lg p-4" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base" style={{ color: '#059669' }}>${pago.monto_pago.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{formatDate(pago.fecha_pago)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CreditCard size={13} />
                          <span>{pago.metodo_pago}</span>
                        </div>
                        {pago.notas && (
                          <div className="flex items-center gap-1">
                            <FileText size={13} />
                            <span>{pago.notas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeudasCompleto;