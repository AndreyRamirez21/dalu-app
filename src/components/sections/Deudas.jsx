import React, { useState } from 'react';
import { Search, Plus, CreditCard, Truck, Scissors, Package, X, DollarSign, FileText, Calendar, Building, Eye, Receipt } from 'lucide-react';
import { useDeudas } from '../../api/useDeudas';

const { ipcRenderer } = window.require('electron');


const Deudas = () => {
  const {
    deudas,
    estadisticas,
    loading,
    agregarDeuda,
    registrarPago,
    actualizarDeuda,
    eliminarDeuda,
    buscarDeudas,
    cargarDeudas
  } = useDeudas();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModalDeuda, setShowModalDeuda] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [formDeuda, setFormDeuda] = useState({
    acreedor: '',
    factura: '',
    tipo_acreedor: 'Proveedor',
    monto_total: '',
    monto_pagado: '0',
    notas: '',
    fecha_recordatorio: ''
  });
  const [formPago, setFormPago] = useState({
    monto_pago: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  const tiposAcreedor = ['Proveedor', 'Servicio', 'Transporte', 'Otro'];
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

  const handleSubmitDeuda = async () => {
    if (!formDeuda.acreedor || !formDeuda.monto_total) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      if (deudaSeleccionada) {
        await actualizarDeuda(deudaSeleccionada.id, formDeuda);
      } else {
        await agregarDeuda(formDeuda);
      }

      setShowModalDeuda(false);
      resetFormDeuda();
    } catch (error) {
      console.error('Error al guardar deuda:', error);
      alert('Error al guardar la deuda');
    }
  };

  const handleSubmitPago = async () => {
    if (!formPago.monto_pago || parseFloat(formPago.monto_pago) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    const montoPendiente = deudaSeleccionada.monto_total - deudaSeleccionada.monto_pagado;

    if (parseFloat(formPago.monto_pago) > montoPendiente) {
      alert(`El monto excede la deuda pendiente de $${montoPendiente.toFixed(2)}`);
      return;
    }

    try {
      await registrarPago(
        deudaSeleccionada.id,
        parseFloat(formPago.monto_pago),
        formPago.metodo_pago,
        formPago.notas
      );

      setShowModalPago(false);
      resetFormPago();
      setDeudaSeleccionada(null);
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert('Error al registrar el pago');
    }
  };

  const handleEditarDeuda = (deuda) => {
    setDeudaSeleccionada(deuda);
    setFormDeuda({
      acreedor: deuda.acreedor,
      factura: deuda.factura || '',
      tipo_acreedor: deuda.tipo_acreedor,
      monto_total: deuda.monto_total.toString(),
      monto_pagado: deuda.monto_pagado.toString(),
      notas: deuda.notas || '',
      fecha_recordatorio: deuda.fecha_recordatorio || ''
    });
    setShowModalDeuda(true);
  };

  const handleRegistrarPago = (deuda) => {
    setDeudaSeleccionada(deuda);
    setFormPago({
      monto_pago: '',
      metodo_pago: 'Efectivo',
      notas: ''
    });
    setShowModalPago(true);
  };

  const handleEliminarDeuda = async (id, acreedor) => {
    if (window.confirm(`¿Eliminar la deuda con ${acreedor}?`)) {
      await eliminarDeuda(id);
    }
  };

  const resetFormDeuda = () => {
    setFormDeuda({
      acreedor: '',
      factura: '',
      tipo_acreedor: 'Proveedor',
      monto_total: '',
      monto_pagado: '0',
      notas: '',
      fecha_recordatorio: ''
    });
    setDeudaSeleccionada(null);
  };

  const resetFormPago = () => {
    setFormPago({
      monto_pago: '',
      metodo_pago: 'Efectivo',
      notas: ''
    });
  };

  const getEstadoStyle = (estado) => {
    const styles = {
      'Vencida': 'bg-red-100 text-red-700',
      'Pendiente': 'bg-yellow-100 text-yellow-700',
      'Pagado': 'bg-green-100 text-green-700'
    };
    return styles[estado] || 'bg-gray-100 text-gray-700';
  };

  const getIconByType = (tipo) => {
    const icons = {
      'Proveedor': <Package size={24} className="text-purple-600" />,
      'Servicio': <CreditCard size={24} className="text-blue-600" />,
      'Transporte': <Truck size={24} className="text-orange-600" />,
      'Otro': <Scissors size={24} className="text-gray-600" />
    };
    return icons[tipo] || <CreditCard size={24} className="text-gray-600" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const deudasFiltradas = deudas;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Control de Deudas</h2>
          <p className="text-gray-500 mt-1">Gestiona las deudas pendientes con tus acreedores.</p>
        </div>
        <button
          onClick={() => setShowModalDeuda(true)}
          className="flex items-center space-x-2 px-5 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Añadir Deuda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Adeudado</div>
          <div className="text-3xl font-bold text-gray-800">
            ${estadisticas?.total_adeudado?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {estadisticas?.total_deudas || 0} acreedores
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Pagado</div>
          <div className="text-3xl font-bold text-green-600">
            ${estadisticas?.total_pagado?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {estadisticas?.deudas_pagadas || 0} pagos completados
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Pendiente de Pago</div>
          <div className="text-3xl font-bold text-red-600">
            ${estadisticas?.total_pendiente?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {estadisticas?.deudas_pendientes || 0} deudas activas
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Deudas por Pagar</h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar acreedor..."
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
            <div className="p-8 text-center text-gray-500">No hay deudas registradas</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acreedor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Pagado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendiente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deudasFiltradas.map((deuda) => {
                  const montoPendiente = deuda.monto_total - deuda.monto_pagado;
                  return (
                    <tr key={deuda.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getIconByType(deuda.tipo_acreedor)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{deuda.acreedor}</div>
                            {deuda.factura && (
                              <div className="text-sm text-gray-500">{deuda.factura}</div>
                            )}
                          </div>
                        </div>
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          ${montoPendiente.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(deuda.estado)}`}>
                          {deuda.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditarDeuda(deuda)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Editar"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          {deuda.estado !== 'Pagado' && (
                            <button
                              onClick={() => handleRegistrarPago(deuda)}
                              className="p-2 hover:bg-green-50 rounded-lg transition"
                              title="Registrar pago"
                            >
                              <Receipt size={18} className="text-green-600" />
                            </button>
                          )}
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

      {/* Modal Agregar/Editar Deuda */}
      {showModalDeuda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {deudaSeleccionada ? 'Editar Deuda' : 'Nueva Deuda'}
              </h3>
              <button
                onClick={() => {
                  setShowModalDeuda(false);
                  resetFormDeuda();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Building size={16} />
                    <span>Acreedor *</span>
                  </label>
                  <input
                    type="text"
                    value={formDeuda.acreedor}
                    onChange={(e) => setFormDeuda({ ...formDeuda, acreedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nombre del acreedor"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText size={16} />
                    <span>Factura</span>
                  </label>
                  <input
                    type="text"
                    value={formDeuda.factura}
                    onChange={(e) => setFormDeuda({ ...formDeuda, factura: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="#FACTURA-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Package size={16} />
                    <span>Tipo de Acreedor *</span>
                  </label>
                  <select
                    value={formDeuda.tipo_acreedor}
                    onChange={(e) => setFormDeuda({ ...formDeuda, tipo_acreedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {tiposAcreedor.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign size={16} />
                    <span>Monto Total *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDeuda.monto_total}
                    onChange={(e) => setFormDeuda({ ...formDeuda, monto_total: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} />
                  <span>Fecha de Recordatorio</span>
                </label>
                <input
                  type="date"
                  value={formDeuda.fecha_recordatorio}
                  onChange={(e) => setFormDeuda({ ...formDeuda, fecha_recordatorio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recibirás una notificación en esta fecha
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} />
                  <span>Notas</span>
                </label>
                <textarea
                  value={formDeuda.notas}
                  onChange={(e) => setFormDeuda({ ...formDeuda, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows="3"
                  placeholder="Información adicional..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalDeuda(false);
                    resetFormDeuda();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitDeuda}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium disabled:opacity-50"
                >
                  {deudaSeleccionada ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showModalPago && deudaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Registrar Pago</h3>
              <button
                onClick={() => {
                  setShowModalPago(false);
                  resetFormPago();
                  setDeudaSeleccionada(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Deuda con:</div>
                <div className="font-bold text-gray-800 text-lg">{deudaSeleccionada.acreedor}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Monto pendiente:</span>
                  <span className="font-bold text-red-600 text-lg">
                    ${(deudaSeleccionada.monto_total - deudaSeleccionada.monto_pagado).toFixed(2)}
                  </span>
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
                  value={formPago.monto_pago}
                  onChange={(e) => setFormPago({ ...formPago, monto_pago: e.target.value })}
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
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
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
                  <span>Notas</span>
                </label>
                <textarea
                  value={formPago.notas}
                  onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows="2"
                  placeholder="Información adicional..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalPago(false);
                    resetFormPago();
                    setDeudaSeleccionada(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitPago}
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
    </div>
  );
};

export default Deudas;