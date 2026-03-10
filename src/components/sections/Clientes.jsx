import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Trophy,
  ShoppingBag,
  Mail,
  Phone,
  Award,
  TrendingUp,
  UserCheck,
  Gift,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  X,
  Eye,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  Lock
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

// ==================== PIN ADMIN ====================
const PIN_ADMIN = '0872'; // ← CAMBIA ESTE PIN POR EL QUE QUIERAS

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
                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                  ${error
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : digit
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-gray-300 bg-gray-50 text-gray-800 focus:border-teal-400 focus:bg-teal-50'
                  }`}
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
        <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Historial de Compras</h3>
              <p className="text-sm text-gray-600 mt-1">
                Cliente: <span className="font-medium">{cliente.nombre}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 uppercase">Total Compras</div>
              <div className="text-2xl font-bold text-gray-800">{cliente.numero_compras}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 uppercase">Total Gastado</div>
              <div className="text-2xl font-bold text-teal-600">${(cliente.total_compras || 0).toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 uppercase">Compras con Tarjeta</div>
              <div className="text-2xl font-bold text-purple-600">{cliente.compras_con_tarjeta || 0}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {cargando ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Cargando ventas...</div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500">Este cliente no tiene compras registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ventas.map((venta) => (
                <div key={venta.id} className="bg-gray-50 rounded-lg border hover:shadow-md transition p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-bold text-teal-600">{venta.numero_venta}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          venta.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {venta.estado}
                        </span>
                        {venta.descuento_porcentaje > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            -{venta.descuento_porcentaje}% Descuento
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar size={14} className="mr-2" />
                          {new Date(venta.fecha).toLocaleString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CreditCard size={14} className="mr-2" />
                          {venta.metodo_pago}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-2xl font-bold text-gray-800">${venta.total.toFixed(2)}</div>
                      {venta.descuento_monto > 0 && (
                        <div className="text-xs text-green-600">Ahorro: ${venta.descuento_monto.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                  {venta.notas && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      <span className="font-medium">Notas:</span> {venta.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
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
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesVIP: 0,
    totalGastado: 0,
    comprasPromedio: 0
  });

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
        setMensajeExito(`✅ Cliente "${clienteAEliminar.nombre}" eliminado correctamente`);
        setTimeout(() => setMensajeExito(''), 4000);
        await cargarClientes();
      } else {
        setMensajeError(resultado.error || 'No se pudo eliminar el cliente');
        setTimeout(() => setMensajeError(''), 5000);
      }
    } catch (error) {
      setMensajeError('Error al eliminar el cliente');
      setTimeout(() => setMensajeError(''), 5000);
    } finally {
      setClienteAEliminar(null);
    }
  };

  const getNivelFidelidad = (cliente) => {
    const { descuento_aplicado_3, descuento_aplicado_6 } = cliente;
    if (descuento_aplicado_6 === 1) return { nivel: 'Premium', color: 'bg-blue-100 text-blue-700', icon: '💎' };
    if (descuento_aplicado_3 === 1) return { nivel: 'Gold', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' };
    if (cliente.numero_compras >= 1) return { nivel: 'Activo', color: 'bg-green-100 text-green-700', icon: '⭐' };
    return { nivel: 'Nuevo', color: 'bg-gray-100 text-gray-700', icon: '👤' };
  };

  const getEstadoFidelidad = (cliente) => {
    const { compras_con_tarjeta, tarjeta_fidelidad_entregada } = cliente;
    if (!tarjeta_fidelidad_entregada) {
      return { icono: '—', mensaje: 'Sin tarjeta', color: 'text-gray-500 bg-gray-50', border: 'border-gray-200' };
    }
    const numCompras = compras_con_tarjeta || 0;
    return {
      icono: '✅',
      mensaje: `${numCompras} compra${numCompras !== 1 ? 's' : ''} con tarjeta`,
      color: 'text-teal-600 bg-teal-50',
      border: 'border-teal-200'
    };
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cedula && cliente.cedula.includes(searchTerm)) ||
    (cliente.celular && cliente.celular.includes(searchTerm))
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Toast éxito */}
      {mensajeExito && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in">
          <CheckCircle size={20} />
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Toast error */}
      {mensajeError && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3">
          <AlertTriangle size={20} />
          <span className="font-medium">{mensajeError}</span>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500 uppercase">Total Clientes</div>
            <Users className="text-teal-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalClientes}</div>
          <div className="text-sm text-gray-500 mt-1">Registrados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500 uppercase">Clientes VIP</div>
            <Trophy className="text-yellow-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{stats.clientesVIP}</div>
          <div className="text-sm text-gray-500 mt-1">3+ compras</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500 uppercase">Total Gastado</div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-green-600">${stats.totalGastado.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">Ingresos por clientes</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500 uppercase">Ticket Promedio</div>
            <ShoppingBag className="text-blue-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-blue-600">${stats.comprasPromedio.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">Por cliente</div>
        </div>
      </div>

      {/* Programa de Fidelidad */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="text-purple-600" size={28} />
          <h3 className="text-xl font-bold text-gray-800">Programa de Fidelidad</h3>
        </div>
        <div className="bg-white rounded-lg p-4 border border-purple-200 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="text-purple-600" size={20} />
            <h4 className="font-bold text-gray-800">¿Cómo funciona?</h4>
          </div>
          <ol className="text-sm text-gray-700 space-y-1 ml-6 list-decimal">
            <li>La tarjeta se entrega en la <strong>primera compra mayor a $30,000</strong></li>
            <li>El cliente debe presentar la tarjeta en cada compra para acumular beneficios</li>
            <li>Los descuentos se aplican automáticamente al cumplir los requisitos</li>
          </ol>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🥇</span>
              <div className="font-bold text-gray-800">Nivel Gold - 10% OFF</div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✓ En la <strong>3ra compra con tarjeta</strong></div>
              <div>✓ Compra mayor a <strong>$30,000</strong></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💎</span>
              <div className="font-bold text-gray-800">Nivel Premium - 15% OFF</div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✓ En la <strong>6ta compra con tarjeta</strong></div>
              <div>✓ Compra mayor a <strong>$30,000</strong></div>
              <div>✓ Dentro de <strong>10 meses</strong> desde recibir tarjeta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Lista de Clientes ({clientesFiltrados.length})</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border">
              <Shield size={14} className="text-red-400" />
              <span>Eliminar requiere PIN de administrador</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {clientesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hay clientes registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Compras</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total Gastado</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Nivel</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado Fidelidad</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Última Compra</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => {
                  const fidelidad = getNivelFidelidad(cliente);
                  const estadoFidelidad = getEstadoFidelidad(cliente);

                  return (
                    <tr
                      key={cliente.id}
                      onClick={() => setClienteSeleccionado(cliente)}
                      className="hover:bg-teal-50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-bold text-sm">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{cliente.nombre}</div>
                            {cliente.cedula && (
                              <div className="text-xs text-gray-500">CC: {cliente.cedula}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {cliente.celular && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone size={14} className="mr-2" />
                              {cliente.celular}
                            </div>
                          )}
                          {cliente.correo && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail size={14} className="mr-2" />
                              {cliente.correo}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-lg text-gray-800">{cliente.numero_compras}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-teal-600">${(cliente.total_compras || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${fidelidad.color} flex items-center space-x-1`}>
                            <span>{fidelidad.icon}</span>
                            <span>{fidelidad.nivel}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border ${estadoFidelidad.color} ${estadoFidelidad.border}`}>
                          <span className="text-xl mb-1">{estadoFidelidad.icono}</span>
                          <span className="text-xs font-medium whitespace-nowrap">{estadoFidelidad.mensaje}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-600">
                          {cliente.ultima_compra
                            ? new Date(cliente.ultima_compra).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </div>
                      </td>

                      {/* ── COLUMNA ACCIONES ── */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => iniciarEliminacion(e, cliente)}
                          title="Eliminar cliente (requiere PIN)"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                        >
                          <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
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
