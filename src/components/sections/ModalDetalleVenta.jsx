import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingCart, Eye, User, Calendar, CreditCard, FileText, Package, Download, AlertCircle, Edit2, Check, XCircle, Phone, Mail, Lock, TrendingUp, EyeOff } from 'lucide-react';
import { generarPDFVenta } from '../../utils/generarPDFVenta';

const { ipcRenderer } = window.require('electron');

const PIN_ADMIN = '0872'; // ← mismo PIN que en Clientes.jsx

// ── Mini modal PIN ──
const ModalPinEdicion = ({ onConfirm, onClose, titulo = 'PIN de Administrador', subtitulo = 'Ingresa el PIN para continuar' }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);
    if (value && index < 3) inputsRef.current[index + 1]?.focus();
    if (index === 3 && value) verificarPin([...newPin.slice(0, 3), value].join(''));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const verificarPin = (pinIngresado) => {
    const final = pinIngresado || pin.join('');
    if (final === PIN_ADMIN) {
      onConfirm();
    } else {
      setError(true);
      setShake(true);
      setPin(['', '', '', '']);
      setTimeout(() => { setShake(false); inputsRef.current[0]?.focus(); }, 600);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden ${shake ? 'animate-shake' : ''}`}>
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-5 text-center">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">{titulo}</h3>
          <p className="text-teal-100 text-sm mt-1">{subtitulo}</p>
        </div>
        <div className="p-5">
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
                className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                  ${error ? 'border-red-400 bg-red-50 text-red-600'
                    : digit ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-300 bg-gray-50 focus:border-teal-400 focus:bg-teal-50'}`}
              />
            ))}
          </div>
          {error && (
            <p className="text-center text-sm text-red-500 font-medium mb-3 flex items-center justify-center space-x-1">
              <X size={13} /><span>PIN incorrecto</span>
            </p>
          )}
          <div className="flex space-x-2">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition text-sm">Cancelar</button>
            <button onClick={() => verificarPin()} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition text-sm">Confirmar</button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)} 45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)} 75%{transform:translateX(-4px)} 90%{transform:translateX(4px)}
        }
        .animate-shake{animation:shake 0.6s ease-in-out}
      `}</style>
    </div>
  );
};

const ModalDetalleVenta = ({ venta, onClose }) => {
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Estado PIN ──
  const [mostrarPin, setMostrarPin] = useState(false);
  const [pinPropósito, setPinPropósito] = useState(null); // 'editar' | 'ganancia'

  // ── Estado ganancia ──
  const [gananciaVisible, setGananciaVisible] = useState(false);

  // ── Estado edición cliente ──
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [datosClienteEdit, setDatosClienteEdit] = useState({
    nombre: '',
    cedula: '',
    celular: '',
    correo: ''
  });
  const [mensajeEdit, setMensajeEdit] = useState(null); // { tipo: 'exito'|'error', texto: '' }

  useEffect(() => {
    cargarDetalleCompleto();
  }, [venta.id]);

  const cargarDetalleCompleto = async () => {
    try {
      setLoading(true);
      setError(null);
      const detalle = await ipcRenderer.invoke('obtener-venta-por-id', venta.id);
      setDetalleCompleto(detalle);
      // Inicializar campos de edición con los datos actuales
      setDatosClienteEdit({
        nombre: detalle.cliente_nombre || '',
        cedula: '',
        celular: '',
        correo: ''
      });
      // Si hay cliente_id, cargar sus datos completos
      if (detalle.cliente_id) {
        try {
          const cliente = await ipcRenderer.invoke('obtener-cliente', detalle.cliente_id);
          if (cliente) {
            setDatosClienteEdit({
              nombre: cliente.nombre || detalle.cliente_nombre || '',
              cedula: cliente.cedula || '',
              celular: cliente.celular || '',
              correo: cliente.correo || ''
            });
          }
        } catch (e) {
          // Si falla cargar el cliente, usamos solo el nombre de la venta
        }
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setError('No se pudo cargar el detalle de la venta');
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar cambios del cliente ──
  const guardarCambiosCliente = async () => {
    if (!datosClienteEdit.nombre.trim()) {
      setMensajeEdit({ tipo: 'error', texto: 'El nombre no puede estar vacío' });
      setTimeout(() => setMensajeEdit(null), 3000);
      return;
    }

    setGuardandoCliente(true);
    try {
      // 1. Actualizar cliente_nombre en la venta
      await ipcRenderer.invoke('actualizar-nombre-cliente-venta', venta.id, datosClienteEdit.nombre.trim());

      // 2. Si existe cliente asociado, actualizar también en la tabla clientes
      if (detalleCompleto.cliente_id) {
        await ipcRenderer.invoke('guardar-cliente', {
          id: detalleCompleto.cliente_id,
          nombre: datosClienteEdit.nombre.trim(),
          cedula: datosClienteEdit.cedula.trim() || null,
          correo: datosClienteEdit.correo.trim() || null,
          celular: datosClienteEdit.celular.trim() || null
        });
      }

      // 3. Actualizar el estado local
      setDetalleCompleto(prev => ({
        ...prev,
        cliente_nombre: datosClienteEdit.nombre.trim()
      }));

      setEditandoCliente(false);
      setMensajeEdit({ tipo: 'exito', texto: '✅ Datos actualizados correctamente' });
      setTimeout(() => setMensajeEdit(null), 3000);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      setMensajeEdit({ tipo: 'error', texto: 'Error al guardar los cambios' });
      setTimeout(() => setMensajeEdit(null), 3000);
    } finally {
      setGuardandoCliente(false);
    }
  };

  const cancelarEdicion = () => {
    // Restaurar valores originales
    setDatosClienteEdit({
      nombre: detalleCompleto.cliente_nombre || '',
      cedula: datosClienteEdit.cedula,
      celular: datosClienteEdit.celular,
      correo: datosClienteEdit.correo
    });
    setEditandoCliente(false);
    setMensajeEdit(null);
  };

  const handleDescargarPDF = () => {
    if (detalleCompleto) {
      generarPDFVenta(detalleCompleto);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'Pagado': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Cancelado': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center text-gray-600">Cargando detalle...</div>
        </div>
      </div>
    );
  }

  if (error || !detalleCompleto) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar el detalle de la venta'}</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const productos = detalleCompleto.productos || [];
  const costosAdicionales = detalleCompleto.costos_adicionales || [];
  const totalCostosAdicionales = detalleCompleto.total_costos_adicionales || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">

        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-blue-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Detalle de Venta</h3>
              <p className="text-teal-600 font-semibold mt-1">{detalleCompleto.numero_venta}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ─────────────────────────────────────────
              SECCIÓN CLIENTE (con edición inline)
          ───────────────────────────────────────── */}
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            {/* Cabecera de la sección */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
              <div className="flex items-center space-x-2 text-gray-700 font-bold">
                <User size={18} />
                <span>Datos del Cliente</span>
              </div>
              {!editandoCliente ? (
                <button
                  onClick={() => { setPinPropósito('editar'); setMostrarPin(true); }}
                  className="flex items-center space-x-1 text-sm text-teal-600 hover:text-teal-800 font-medium px-3 py-1.5 rounded-lg hover:bg-teal-50 transition"
                >
                  <Edit2 size={15} />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={cancelarEdicion}
                    disabled={guardandoCliente}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                  >
                    <XCircle size={15} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={guardarCambiosCliente}
                    disabled={guardandoCliente}
                    className="flex items-center space-x-1 text-sm text-white bg-teal-500 hover:bg-teal-600 font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                  >
                    <Check size={15} />
                    <span>{guardandoCliente ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Toast de éxito / error dentro de la sección */}
            {mensajeEdit && (
              <div className={`px-5 py-2 text-sm font-medium ${
                mensajeEdit.tipo === 'exito'
                  ? 'bg-green-50 text-green-700 border-b border-green-200'
                  : 'bg-red-50 text-red-700 border-b border-red-200'
              }`}>
                {mensajeEdit.texto}
              </div>
            )}

            {/* Campos */}
            <div className="p-5">
              {!editandoCliente ? (
                /* ── MODO LECTURA ── */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nombre</p>
                    <p className="font-semibold text-gray-800">{detalleCompleto.cliente_nombre || 'Cliente General'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cédula</p>
                    <p className="font-semibold text-gray-800">{datosClienteEdit.cedula || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Celular</p>
                    <p className="font-semibold text-gray-800">{datosClienteEdit.celular || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Correo</p>
                    <p className="font-semibold text-gray-800">{datosClienteEdit.correo || '—'}</p>
                  </div>
                </div>
              ) : (
                /* ── MODO EDICIÓN ── */
                <div className="grid grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="col-span-2">
                    <label className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-1.5">
                      <User size={14} />
                      <span>Nombre Completo <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={datosClienteEdit.nombre}
                      onChange={(e) => setDatosClienteEdit({ ...datosClienteEdit, nombre: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 transition"
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  {/* Cédula */}
                  <div>
                    <label className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-1.5">
                      <CreditCard size={14} />
                      <span>Cédula</span>
                    </label>
                    <input
                      type="text"
                      value={datosClienteEdit.cedula}
                      onChange={(e) => setDatosClienteEdit({ ...datosClienteEdit, cedula: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 transition"
                      placeholder="Número de cédula"
                    />
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-1.5">
                      <Phone size={14} />
                      <span>Celular</span>
                    </label>
                    <input
                      type="tel"
                      value={datosClienteEdit.celular}
                      onChange={(e) => setDatosClienteEdit({ ...datosClienteEdit, celular: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 transition"
                      placeholder="Número de celular"
                    />
                  </div>

                  {/* Correo */}
                  <div className="col-span-2">
                    <label className="flex items-center space-x-1 text-sm font-medium text-gray-700 mb-1.5">
                      <Mail size={14} />
                      <span>Correo Electrónico</span>
                    </label>
                    <input
                      type="email"
                      value={datosClienteEdit.correo}
                      onChange={(e) => setDatosClienteEdit({ ...datosClienteEdit, correo: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 transition"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {!detalleCompleto.cliente_id && (
                    <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                      ⚠️ Esta venta no tiene un cliente registrado en la base de datos. Solo se actualizará el nombre en la venta.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fecha y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Calendar size={18} />
                <span className="text-sm font-medium">Fecha</span>
              </div>
              <div className="font-semibold text-gray-800">{formatDate(detalleCompleto.fecha)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <ShoppingCart size={18} />
                <span className="text-sm font-medium">Estado</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(detalleCompleto.estado)}`}>
                {detalleCompleto.estado}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg col-span-2">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <CreditCard size={18} />
                <span className="text-sm font-medium">Método de Pago</span>
              </div>
              <div className="font-semibold text-gray-800">{detalleCompleto.metodo_pago || 'No especificado'}</div>
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center space-x-2 text-gray-700 font-bold mb-3">
              <Package size={20} />
              <h4>Productos</h4>
            </div>

            {productos.length > 0 ? (
              <div className="space-y-4">
                {/* Productos Propios */}
                {detalleCompleto.productos_propios && detalleCompleto.productos_propios.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Productos Propios</h5>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {detalleCompleto.productos_propios.map((producto, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  <div className="font-medium">{producto.producto_nombre || 'Producto sin nombre'}</div>
                                  {producto.producto_referencia && (
                                    <div className="text-xs text-gray-400 mt-0.5">Ref: {producto.producto_referencia}</div>
                                  )}
                                </td>                              <td className="px-4 py-3 text-sm text-gray-600">{producto.talla || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-800 text-center">{producto.cantidad}</td>
                              <td className="px-4 py-3 text-sm text-gray-800 text-right">${Number(producto.precio_unitario).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">${Number(producto.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Productos de Marcas Aliadas */}
                {detalleCompleto.productos_marca_aliada && detalleCompleto.productos_marca_aliada.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-purple-700 mb-2">Productos de Marcas Aliadas</h5>
                    <div className="border border-purple-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-purple-50 border-b border-purple-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Marca</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Talla</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase">Cant.</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Precio Unit.</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100">
                          {detalleCompleto.productos_marca_aliada.map((producto, index) => (
                            <tr key={index} className="hover:bg-purple-50">
                              <td className="px-4 py-3 text-sm text-gray-800">{producto.producto_nombre || 'Producto sin nombre'}</td>
                              <td className="px-4 py-3 text-sm text-purple-600 font-medium">{producto.marca_nombre}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{producto.talla || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-800 text-center">{producto.cantidad}</td>
                              <td className="px-4 py-3 text-sm text-gray-800 text-right">${Number(producto.precio_unitario).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">${Number(producto.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay productos registrados en esta venta</p>
              </div>
            )}
          </div>

          {/* Resumen Financiero */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border">
            <h4 className="font-bold text-gray-800 mb-4">Resumen Financiero</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal productos propios:</span>
                <span className="font-medium text-gray-800">${Number(detalleCompleto.subtotal || 0).toFixed(2)}</span>
              </div>

              {detalleCompleto.productos_marca_aliada && detalleCompleto.productos_marca_aliada.length > 0 && (
                <div className="flex justify-between text-sm bg-purple-50 -mx-3 px-3 py-2 rounded">
                  <span className="text-purple-700 font-medium">Productos marcas aliadas:</span>
                  <span className="font-bold text-purple-700">
                    ${detalleCompleto.productos_marca_aliada.reduce((sum, p) => sum + Number(p.subtotal), 0).toFixed(2)}
                  </span>
                </div>
              )}

              {totalCostosAdicionales > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Costos adicionales:</span>
                  <span className="font-medium text-gray-800">${Number(totalCostosAdicionales).toFixed(2)}</span>
                </div>
              )}

              {detalleCompleto.descuento_porcentaje > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 -mx-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 font-medium">
                      🎉 Descuento de fidelidad ({detalleCompleto.descuento_porcentaje}%):
                    </span>
                    <span className="font-bold text-green-600">-${Number(detalleCompleto.descuento_monto || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

          {/* Nota de devolución */}
          {detalleCompleto.tiene_devolucion === 1 && detalleCompleto.notas &&
            detalleCompleto.notas.includes('Devolución') && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 -mx-3">
              <div className="text-sm">
                <span className="text-purple-700 font-medium">
                  {detalleCompleto.notas
                    .split(' | ')
                    .filter(n => n.includes('Devolución'))
                    .map((nota, i) => (
                      <div key={i} className="flex items-start gap-2 mt-1 first:mt-0">
                        <span>🔄</span>
                        <span>{nota.replace('🔄 ', '')}</span>
                      </div>
                    ))
                  }
                </span>
              </div>
            </div>
          )}

              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-xl text-teal-600">${Number(detalleCompleto.total).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto pagado:</span>
                <span className={`font-medium ${detalleCompleto.monto_pagado >= detalleCompleto.total ? 'text-green-600' : 'text-orange-600'}`}>
                  ${Number(detalleCompleto.monto_pagado).toFixed(2)}
                </span>
              </div>

              {detalleCompleto.cambio > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cambio devuelto:</span>
                  <span className="font-medium text-blue-600">${Number(detalleCompleto.cambio).toFixed(2)}</span>
                </div>
              )}

              {detalleCompleto.estado === 'Pendiente' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-yellow-800">Monto pendiente:</span>
                    <span className="font-bold text-lg text-red-600">
                      ${(Number(detalleCompleto.total) - Number(detalleCompleto.monto_pagado)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── GANANCIA BRUTA (protegida por PIN) ── */}
              <div className="border-t pt-3 mt-1">
                {!gananciaVisible ? (
                  <button
                    onClick={() => { setPinPropósito('ganancia'); setMostrarPin(true); }}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition text-sm font-medium"
                  >
                    <Lock size={15} />
                    <span>Ver Ganancia Bruta</span>
                  </button>
                ) : (() => {
                  // ── Igual que exportarVentasExcel: usar detalleCompleto.items ──
                  let gananciaPropios = 0;
                  let gananciaMarcas = 0;

                  const items = detalleCompleto.items || [];

                  if (items.length > 0) {
                    // Mismo cálculo que el Excel
                    items.forEach(item => {
                      const subtotalItem = item.cantidad * item.precio;
                      if (item.tipo === 'Propio') {
                        const costoTotal = (item.costo_unitario || 0) * item.cantidad;
                        gananciaPropios += subtotalItem - costoTotal;
                      } else {
                        gananciaMarcas += (item.ganancia_tienda || 0) * item.cantidad;
                      }
                    });
                  } else {
                    // Fallback: usar productos_propios si no hay items
                    gananciaPropios = (detalleCompleto.productos_propios || []).reduce((sum, p) => {
                      const costoTotal = Number(p.costo_base || 0) + Number(p.costos_adicionales_producto || 0);
                      return sum + (Number(p.precio_unitario) - costoTotal) * Number(p.cantidad);
                    }, 0);
                    gananciaMarcas = (detalleCompleto.productos_marca_aliada || []).reduce((sum, p) => {
                      return sum + Number(p.ganancia_tienda || 0);
                    }, 0);
                  }

                  const gananciaBruta = gananciaPropios + gananciaMarcas;
                  const porcentaje = detalleCompleto.total > 0
                    ? ((gananciaBruta / detalleCompleto.total) * 100).toFixed(1)
                    : 0;
                  const esPositiva = gananciaBruta >= 0;
                  const hayMarcas = (detalleCompleto.productos_marca_aliada || []).length > 0;

                  return (
                    <div className={`rounded-xl p-4 border-2 ${esPositiva ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp size={18} className={esPositiva ? 'text-emerald-600' : 'text-red-600'} />
                          <span className={`font-bold text-sm ${esPositiva ? 'text-emerald-700' : 'text-red-700'}`}>
                            Ganancia Bruta
                          </span>
                        </div>
                        <button
                          onClick={() => setGananciaVisible(false)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Ocultar"
                        >
                          <EyeOff size={15} />
                        </button>
                      </div>
                      <div className={`text-2xl font-bold ${esPositiva ? 'text-emerald-700' : 'text-red-700'}`}>
                        ${gananciaBruta.toFixed(2)}
                      </div>
                      <div className={`text-xs mt-1 font-medium ${esPositiva ? 'text-emerald-600' : 'text-red-600'}`}>
                        Margen: {porcentaje}% sobre el total
                      </div>
                      {hayMarcas && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 space-y-1">
                          <div className="flex justify-between text-xs text-emerald-700">
                            <span>Ganancia productos propios:</span>
                            <span className="font-medium">${gananciaPropios.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-purple-700">
                            <span>Ganancia marcas aliadas:</span>
                            <span className="font-medium">${gananciaMarcas.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Notas */}
          {detalleCompleto.notas && (
            <div>
              <div className="flex items-center space-x-2 text-gray-700 font-bold mb-2">
                <FileText size={18} />
                <h4>Notas</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{detalleCompleto.notas}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center sticky bottom-0">
          <button
            onClick={handleDescargarPDF}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            <Download size={18} />
            <span>Descargar Comprobante</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal PIN para edición / ganancia */}
      {mostrarPin && (
        <ModalPinEdicion
          titulo={pinPropósito === 'ganancia' ? 'Ver Ganancia' : 'Editar Cliente'}
          subtitulo={pinPropósito === 'ganancia' ? 'Ingresa el PIN para ver la ganancia' : 'Ingresa el PIN para editar'}
          onConfirm={() => {
            setMostrarPin(false);
            if (pinPropósito === 'ganancia') {
              setGananciaVisible(true);
            } else {
              setEditandoCliente(true);
            }
            setPinPropósito(null);
          }}
          onClose={() => { setMostrarPin(false); setPinPropósito(null); }}
        />
      )}
    </div>
  );
};

export default ModalDetalleVenta;
