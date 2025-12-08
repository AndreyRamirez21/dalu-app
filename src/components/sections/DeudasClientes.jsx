import React, { useState } from 'react';
import { Search, User, DollarSign, Receipt, X, CreditCard, FileText, Calendar } from 'lucide-react';
import { useDeudasClientes } from '../../api/useDeudasClientes';

const DeudasClientes = () => {
  const {
    deudas,
    estadisticas,
    loading,
    registrarAbono,
    buscarDeudas,
    cargarDeudas,
    obtenerHistorialAbonos
  } = useDeudasClientes();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModalAbono, setShowModalAbono] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [historialAbonos, setHistorialAbonos] = useState([]);

  const [formAbono, setFormAbono] = useState({
    monto_abono: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      buscarDeudas(value);
    } else {
      cargarDeudas();
    }
  };

  const handleRegistrarAbono = (deuda) => {
    setDeudaSeleccionada(deuda);
    setFormAbono({
      monto_abono: '',
      metodo_pago: 'Efectivo',
      notas: ''
    });
    setShowModalAbono(true);
  };

  const handleVerHistorial = async (deuda) => {
    setDeudaSeleccionada(deuda);
    const historial = await obtenerHistorialAbonos(deuda.id);
    setHistorialAbonos(historial || []);
    setShowModalHistorial(true);
  };

  const handleSubmitAbono = async () => {
    if (!formAbono.monto_abono || parseFloat(formAbono.monto_abono) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    const montoPendiente = deudaSeleccionada.monto_pendiente;
    const montoAbono = parseFloat(formAbono.monto_abono);

    if (montoAbono > montoPendiente + 0.01) {
      alert(`El monto excede la deuda pendiente de $${montoPendiente.toFixed(2)}`);
      return;
    }

    try {
      await registrarAbono(
        deudaSeleccionada.id,
        montoAbono, // Usar la variable ya parseada
        formAbono.metodo_pago,
        formAbono.notas
      );

      setShowModalAbono(false);
      setDeudaSeleccionada(null);
      alert('✅ Abono registrado exitosamente');
    } catch (error) {
      console.error('Error al registrar abono:', error);
      alert('Error al registrar el abono');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // SQLite guarda en UTC, así que parseamos como UTC y convertimos a hora local
    const date = new Date(dateString); // La 'Z' indica que es UTC

    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deudasFiltradas = deudas;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Deudas de Clientes</h2>
          <p className="text-gray-500 mt-1">Gestiona las deudas pendientes de tus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <div className="text-sm text-gray-500 mt-1">
            En abonos realizados
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Clientes con Deuda</div>
          <div className="text-3xl font-bold text-orange-600">
            {estadisticas?.clientes_con_deuda || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Clientes únicos
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Deudas Pendientes</h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente o número de venta..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && deudasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Cargando deudas...</div>
          ) : deudasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay deudas pendientes 🎉</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Deuda
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendiente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deudasFiltradas.map((deuda) => (
                  <tr key={deuda.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-teal-600">{deuda.numero_venta}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">
                        ${deuda.monto_total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-red-600">
                        ${deuda.monto_pendiente.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(deuda.fecha_creacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRegistrarAbono(deuda)}
                          className="p-2 hover:bg-green-50 rounded-lg transition"
                          title="Registrar abono"
                        >
                          <DollarSign size={18} className="text-green-600" />
                        </button>
                        {deuda.total_abonos > 0 && (
                          <button
                            onClick={() => handleVerHistorial(deuda)}
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
          )}
        </div>
      </div>

      {/* Modal Registrar Abono */}
      {showModalAbono && deudaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Registrar Abono</h3>
              <button
                onClick={() => {
                  setShowModalAbono(false);
                  setDeudaSeleccionada(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
                <div className="text-sm text-gray-600 mb-1">Cliente:</div>
                <div className="font-bold text-gray-800 text-lg mb-3">{deudaSeleccionada.cliente_nombre}</div>
                <div className="text-sm text-gray-600 mb-1">Venta: {deudaSeleccionada.numero_venta}</div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-teal-200">
                  <div>
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="font-semibold text-gray-800">${deudaSeleccionada.monto_total.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Pagado</div>
                    <div className="font-semibold text-green-600">${deudaSeleccionada.monto_pagado.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Pendiente:</span>
                    <span className="font-bold text-xl text-red-600">
                      ${deudaSeleccionada.monto_pendiente.toFixed(2)}
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
                  value={formAbono.monto_abono}
                  onChange={(e) => setFormAbono({ ...formAbono, monto_abono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <CreditCard size={16} />
                  <span>Método de Pago</span>
                </label>
                <select
                  value={formAbono.metodo_pago}
                  onChange={(e) => setFormAbono({ ...formAbono, metodo_pago: e.target.value })}
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
                  value={formAbono.notas}
                  onChange={(e) => setFormAbono({ ...formAbono, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows="2"
                  placeholder="Información adicional..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalAbono(false);
                    setDeudaSeleccionada(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitAbono}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                >
                  Registrar Abono
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Abonos */}
      {showModalHistorial && deudaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Historial de Abonos</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cliente: {deudaSeleccionada.cliente_nombre} - {deudaSeleccionada.numero_venta}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModalHistorial(false);
                  setDeudaSeleccionada(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {historialAbonos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No hay abonos registrados</div>
              ) : (
                <div className="space-y-3">
                  {historialAbonos.map((abono, index) => (
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
    </div>
  );
};

export default DeudasClientes;