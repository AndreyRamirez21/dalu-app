import React, { useState } from 'react';
import {
  Search, User, DollarSign, Receipt, X, CreditCard, FileText,
  CheckCircle, AlertCircle, Plus, Store, Users, Edit2, Trash2, Calendar
} from 'lucide-react';
import { useDeudasClientes } from '../../api/useDeudasClientes';
import { useDeudas } from '../../api/useDeudas';

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
  monto_recibido: '', // NUEVO CAMPO
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
    monto_recibido: '', // Agregar este campo
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Notificación */}
      {notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {notification.type === 'success' ? (
                  <CheckCircle size={48} className="text-green-500" />
                ) : (
                  <AlertCircle size={48} className="text-red-500" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {notification.type === 'success' ? 'Éxito' : 'Error'}
              </h3>
              <p className="text-gray-600 mb-6">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Deudas</h2>
          <p className="text-gray-500 mt-1">
            {pestanaActiva === 'clientes'
              ? 'Administra las deudas pendientes de tus clientes'
              : 'Gestiona los préstamos y deudas de tu negocio'}
          </p>
        </div>
        {pestanaActiva === 'propias' && (
          <button
            onClick={handleNuevaDeuda}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            <Plus size={20} />
            <span>Nueva Deuda</span>
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex space-x-2 mb-6 bg-white rounded-xl shadow-sm border p-2">
        <button
          onClick={() => {
            setPestanaActiva('clientes');
            setSearchTerm('');
          }}
          className={`flex items-center space-x-2 flex-1 px-6 py-3 rounded-lg font-medium transition ${
            pestanaActiva === 'clientes'
              ? 'bg-teal-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={20} />
          <span>Deudas de Clientes</span>
        </button>
        <button
          onClick={() => {
            setPestanaActiva('propias');
            setSearchTerm('');
          }}
          className={`flex items-center space-x-2 flex-1 px-6 py-3 rounded-lg font-medium transition ${
            pestanaActiva === 'propias'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Store size={20} />
          <span>Mis Deudas</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {pestanaActiva === 'clientes' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total en Deudas</div>
              <div className="text-3xl font-bold text-red-600">
                ${estadisticas?.monto_total_pendiente?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {estadisticas?.total_deudas || 0} deudas activas
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Pagado</div>
              <div className="text-3xl font-bold text-green-600">
                ${estadisticas?.monto_total_pagado?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">En abonos realizados</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Clientes con Deuda</div>
              <div className="text-3xl font-bold text-orange-600">
                {estadisticas?.clientes_con_deuda || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Clientes únicos</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Adeudado</div>
              <div className="text-3xl font-bold text-red-600">
                ${estadisticas?.total_adeudado?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {estadisticas?.total_deudas || 0} deudas registradas
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Pagado</div>
              <div className="text-3xl font-bold text-green-600">
                ${estadisticas?.total_pagado?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">En pagos realizados</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Saldo Pendiente</div>
              <div className="text-3xl font-bold text-orange-600">
                ${estadisticas?.total_pendiente?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {estadisticas?.deudas_pendientes || 0} pendientes
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lista de Deudas */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {pestanaActiva === 'clientes' ? 'Deudas Pendientes' : 'Mis Deudas Activas'}
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={
                  pestanaActiva === 'clientes'
                    ? 'Buscar por cliente o número de venta...'
                    : 'Buscar por acreedor o factura...'
                }
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && deudasMostrar.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : deudasMostrar.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {pestanaActiva === 'clientes'
                ? 'No hay deudas pendientes 🎉'
                : 'No tienes deudas registradas'}
            </div>
          ) : pestanaActiva === 'clientes' ? (
            // Tabla de Deudas de Clientes
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total Deuda</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deudasMostrar.map((deuda) => (
                  <tr key={deuda.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-teal-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{deuda.cliente_nombre}</div>
                          {deuda.total_abonos > 0 && (
                            <div className="text-xs text-gray-500">{deuda.total_abonos} abono(s)</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-teal-600">{deuda.numero_venta}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">${deuda.monto_total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600">${deuda.monto_pagado.toFixed(2)}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${(deuda.monto_pagado / deuda.monto_total) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-red-600">${deuda.monto_pendiente.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(deuda.fecha_creacion)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRegistrarAbonoCliente(deuda)}
                          className="p-2 hover:bg-green-50 rounded-lg transition"
                          title="Registrar abono"
                        >
                          <DollarSign size={18} className="text-green-600" />
                        </button>
                        {deuda.total_abonos > 0 && (
                          <button
                            onClick={() => handleVerHistorialCliente(deuda)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Ver historial"
                          >
                            <Receipt size={18} className="text-blue-600" />
                          </button>
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
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Acreedor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deudasMostrar.map((deuda) => {
                  const montoPendiente = deuda.monto_total - deuda.monto_pagado;
                  return (
                    <tr key={deuda.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Store size={20} className="text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{deuda.acreedor}</div>
                            {deuda.notas && (
                              <div className="text-xs text-gray-500">{deuda.notas}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {deuda.tipo_acreedor}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{deuda.factura || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        ${deuda.monto_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-green-600">
                          ${deuda.monto_pagado.toFixed(2)}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${(deuda.monto_pagado / deuda.monto_total) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-red-600">${montoPendiente.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            deuda.estado === 'Pagado'
                              ? 'bg-green-100 text-green-700'
                              : deuda.estado === 'Vencida'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {deuda.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                        {deuda.estado !== 'Pagado' && (
                                                  <button
                                                    onClick={() => handleRegistrarPagoPropio(deuda)}
                                                    className="p-2 hover:bg-green-50 rounded-lg transition"
                                                    title="Registrar pago"
                                                  >
                                                    <DollarSign size={18} className="text-green-600" />
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => handleEditarDeuda(deuda)}
                                                  className="p-2 hover:bg-blue-50 rounded-lg transition"
                                                  title="Editar"
                                                >
                                                  <Edit2 size={18} className="text-blue-600" />
                                                </button>
                                                {deuda.total_pagos > 0 && (
                                                  <button
                                                    onClick={() => handleVerHistorialPropio(deuda)}
                                                    className="p-2 hover:bg-purple-50 rounded-lg transition"
                                                    title="Ver historial"
                                                  >
                                                    <Receipt size={18} className="text-purple-600" />
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => handleEliminarDeuda(deuda.id)}
                                                  className="p-2 hover:bg-red-50 rounded-lg transition"
                                                  title="Eliminar"
                                                >
                                                  <Trash2 size={18} className="text-red-600" />
                                                </button>
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

{/* Modal Registrar Abono Cliente */}
{showModalAbonoCliente && deudaClienteSeleccionada && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
      {/* Header fijo */}
      <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-800">Registrar Abono</h3>
        <button
          onClick={() => {
            setShowModalAbonoCliente(false);
            setDeudaClienteSeleccionada(null);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contenido con scroll */}
      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
          <div className="text-sm text-gray-600 mb-1">Cliente:</div>
          <div className="font-bold text-gray-800 text-lg mb-3">{deudaClienteSeleccionada.cliente_nombre}</div>
          <div className="text-sm text-gray-600 mb-1">Venta: {deudaClienteSeleccionada.numero_venta}</div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-teal-200">
            <div>
              <div className="text-xs text-gray-600">Total</div>
              <div className="font-semibold text-gray-800">${deudaClienteSeleccionada.monto_total.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Pagado</div>
              <div className="font-semibold text-green-600">${deudaClienteSeleccionada.monto_pagado.toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-teal-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pendiente:</span>
              <span className="font-bold text-xl text-red-600">
                ${deudaClienteSeleccionada.monto_pendiente.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign size={16} />
            <span>Monto del Abono *</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formAbonoCliente.monto_abono}
            onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, monto_abono: e.target.value })}
            onWheel={(e) => e.target.blur()}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign size={16} />
            <span>Monto Recibido del Cliente *</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formAbonoCliente.monto_recibido}
            onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, monto_recibido: e.target.value })}
            onWheel={(e) => e.target.blur()}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="0.00"
          />
        </div>

        {/* Mostrar el cambio a devolver */}
        {formAbonoCliente.monto_abono && formAbonoCliente.monto_recibido && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cambio a Devolver:</span>
              <span className="font-bold text-2xl text-orange-600">
                ${(parseFloat(formAbonoCliente.monto_recibido) - parseFloat(formAbonoCliente.monto_abono)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <CreditCard size={16} />
            <span>Método de Pago</span>
          </label>
          <select
            value={formAbonoCliente.metodo_pago}
            onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, metodo_pago: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {metodosPago.map((metodo) => (
              <option key={metodo} value={metodo}>{metodo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <FileText size={16} />
            <span>Notas (opcional)</span>
          </label>
          <textarea
            value={formAbonoCliente.notas}
            onChange={(e) => setFormAbonoCliente({ ...formAbonoCliente, notas: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows="2"
            placeholder="Información adicional..."
          />
        </div>
      </div>

      {/* Footer fijo con botones */}
      <div className="p-6 border-t bg-gray-50 flex space-x-3 flex-shrink-0">
        <button
          onClick={() => {
            setShowModalAbonoCliente(false);
            setDeudaClienteSeleccionada(null);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmitAbonoCliente}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
        >
          Registrar Abono
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal Historial de Abonos Cliente */}
{showModalHistorialCliente && deudaClienteSeleccionada && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
      <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Historial de Abonos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Cliente: {deudaClienteSeleccionada.cliente_nombre} - {deudaClienteSeleccionada.numero_venta}
          </p>
        </div>
        <button
          onClick={() => {
            setShowModalHistorialCliente(false);
            setDeudaClienteSeleccionada(null);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {historialAbonosCliente.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No hay abonos registrados</div>
        ) : (
          <div className="space-y-3">
            {historialAbonosCliente.map((abono, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-green-600 text-lg">${abono.monto_abono.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(abono.fecha_abono)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CreditCard size={14} />
                    <span>{abono.metodo_pago}</span>
                  </div>
                  {abono.notas && (
                    <div className="flex items-center space-x-1">
                      <FileText size={14} />
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
                            {/* Modal Nueva Deuda */}
                            {showModalNuevaDeuda && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
                                  <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                                    <h3 className="text-xl font-bold text-gray-800">Nueva Deuda</h3>
                                    <button
                                      onClick={() => setShowModalNuevaDeuda(false)}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div className="p-6 space-y-4">
                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Store size={16} />
                                        <span>Acreedor *</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={formNuevaDeuda.acreedor}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, acreedor: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Nombre del acreedor"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Tipo de Acreedor
                                      </label>
                                      <select
                                        value={formNuevaDeuda.tipo_acreedor}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, tipo_acreedor: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        {tiposAcreedor.map((tipo) => (
                                          <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText size={16} />
                                        <span>Número de Factura</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={formNuevaDeuda.factura}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, factura: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Ej: FAC-001"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign size={16} />
                                        <span>Monto Total *</span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={formNuevaDeuda.monto_total}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_total: e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign size={16} />
                                        <span>Monto Pagado</span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={formNuevaDeuda.monto_pagado}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_pagado: e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Calendar size={16} />
                                        <span>Fecha de Recordatorio</span>
                                      </label>
                                      <input
                                        type="date"
                                        value={formNuevaDeuda.fecha_recordatorio}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, fecha_recordatorio: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText size={16} />
                                        <span>Notas</span>
                                      </label>
                                      <textarea
                                        value={formNuevaDeuda.notas}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, notas: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        rows="3"
                                        placeholder="Información adicional..."
                                      />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                      <button
                                        onClick={() => setShowModalNuevaDeuda(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleSubmitNuevaDeuda}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
                                      >
                                        Guardar Deuda
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Modal Editar Deuda */}
                            {showModalEditarDeuda && deudaPropiaSeleccionada && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
                                  <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                                    <h3 className="text-xl font-bold text-gray-800">Editar Deuda</h3>
                                    <button
                                      onClick={() => {
                                        setShowModalEditarDeuda(false);
                                        setDeudaPropiaSeleccionada(null);
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div className="p-6 space-y-4">
                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Store size={16} />
                                        <span>Acreedor *</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={formNuevaDeuda.acreedor}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, acreedor: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Nombre del acreedor"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Tipo de Acreedor
                                      </label>
                                      <select
                                        value={formNuevaDeuda.tipo_acreedor}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, tipo_acreedor: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        {tiposAcreedor.map((tipo) => (
                                          <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText size={16} />
                                        <span>Número de Factura</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={formNuevaDeuda.factura}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, factura: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Ej: FAC-001"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign size={16} />
                                        <span>Monto Total *</span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={formNuevaDeuda.monto_total}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, monto_total: e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Calendar size={16} />
                                        <span>Fecha de Recordatorio</span>
                                      </label>
                                      <input
                                        type="date"
                                        value={formNuevaDeuda.fecha_recordatorio}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, fecha_recordatorio: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText size={16} />
                                        <span>Notas</span>
                                      </label>
                                      <textarea
                                        value={formNuevaDeuda.notas}
                                        onChange={(e) => setFormNuevaDeuda({ ...formNuevaDeuda, notas: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        rows="3"
                                        placeholder="Información adicional..."
                                      />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                      <button
                                        onClick={() => {
                                          setShowModalEditarDeuda(false);
                                          setDeudaPropiaSeleccionada(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleSubmitEditarDeuda}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50"
                                      >
                                        Actualizar Deuda
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Modal Registrar Pago Propio */}
                            {showModalPagoPropio && deudaPropiaSeleccionada && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                                  <div className="p-6 border-b flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-800">Registrar Pago</h3>
                                    <button
                                      onClick={() => {
                                        setShowModalPagoPropio(false);
                                        setDeudaPropiaSeleccionada(null);
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div className="p-6 space-y-4">
                                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                                      <div className="text-sm text-gray-600 mb-1">Acreedor:</div>
                                      <div className="font-bold text-gray-800 text-lg mb-3">{deudaPropiaSeleccionada.acreedor}</div>
                                      {deudaPropiaSeleccionada.factura && (
                                        <div className="text-sm text-gray-600 mb-1">Factura: {deudaPropiaSeleccionada.factura}</div>
                                      )}
                                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-orange-200">
                                        <div>
                                          <div className="text-xs text-gray-600">Total</div>
                                          <div className="font-semibold text-gray-800">${deudaPropiaSeleccionada.monto_total.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-600">Pagado</div>
                                          <div className="font-semibold text-green-600">${deudaPropiaSeleccionada.monto_pagado.toFixed(2)}</div>
                                        </div>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-orange-200">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Pendiente:</span>
                                          <span className="font-bold text-xl text-red-600">
                                            ${(deudaPropiaSeleccionada.monto_total - deudaPropiaSeleccionada.monto_pagado).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign size={16} />
                                        <span>Monto del Pago *</span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={formPagoPropio.monto_pago}
                                        onChange={(e) => setFormPagoPropio({ ...formPagoPropio, monto_pago: e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <CreditCard size={16} />
                                        <span>Método de Pago</span>
                                      </label>
                                      <select
                                        value={formPagoPropio.metodo_pago}
                                        onChange={(e) => setFormPagoPropio({ ...formPagoPropio, metodo_pago: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        {metodosPago.map((metodo) => (
                                          <option key={metodo} value={metodo}>{metodo}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText size={16} />
                                        <span>Notas (opcional)</span>
                                      </label>
                                      <textarea
                                        value={formPagoPropio.notas}
                                        onChange={(e) => setFormPagoPropio({ ...formPagoPropio, notas: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        rows="2"
                                        placeholder="Información adicional..."
                                      />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                      <button
                                        onClick={() => {
                                          setShowModalPagoPropio(false);
                                          setDeudaPropiaSeleccionada(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleSubmitPagoPropio}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                                      >
                                        Registrar Pago
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Modal Historial de Pagos Propio */}
                            {showModalHistorialPropio && deudaPropiaSeleccionada && (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
                                  <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-800">Historial de Pagos</h3>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Acreedor: {deudaPropiaSeleccionada.acreedor}
                                        {deudaPropiaSeleccionada.factura && ` - ${deudaPropiaSeleccionada.factura}`}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setShowModalHistorialPropio(false);
                                        setDeudaPropiaSeleccionada(null);
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div className="p-6">
                                    {historialPagosPropio.length === 0 ? (
                                      <div className="text-center text-gray-500 py-8">No hay pagos registrados</div>
                                    ) : (
                                      <div className="space-y-3">
                                        {historialPagosPropio.map((pago, index) => (
                                          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-bold text-green-600 text-lg">${pago.monto_pago.toFixed(2)}</span>
                                              <span className="text-sm text-gray-500">
                                                {formatDate(pago.fecha_pago)}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                              <div className="flex items-center space-x-1">
                                                <CreditCard size={14} />
                                                <span>{pago.metodo_pago}</span>
                                              </div>
                                              {pago.notas && (
                                                <div className="flex items-center space-x-1">
                                                  <FileText size={14} />
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