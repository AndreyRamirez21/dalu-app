import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, CreditCard, Truck, Scissors, Package } from 'lucide-react';

const Deudas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const deudas = [
    {
      id: 1,
      acreedor: 'Telas del Norte S.A.',
      factura: '#FACTURA-T0987',
      icon: 'fabric',
      montoTotal: 1250.00,
      montoPagado: 625.00,
      fechaVencimiento: '15 de Jul, 2024',
      estado: 'Vencida'
    },
    {
      id: 2,
      acreedor: 'Logística Rápida',
      factura: '#FACTURA-L0123',
      icon: 'truck',
      montoTotal: 480.00,
      montoPagado: 0.00,
      fechaVencimiento: '30 de Jul, 2024',
      estado: 'Pendiente'
    },
    {
      id: 3,
      acreedor: 'Diseños Creativos Co.',
      factura: '#FACTURA-D456',
      icon: 'scissors',
      montoTotal: 950.00,
      montoPagado: 0.00,
      fechaVencimiento: '05 de Ago, 2024',
      estado: 'Pendiente'
    },
    {
      id: 4,
      acreedor: 'Empaques y Cajas',
      factura: '#FACTURA-E789',
      icon: 'package',
      montoTotal: 310.00,
      montoPagado: 310.00,
      fechaVencimiento: '-',
      estado: 'Pagado'
    }
  ];

  const getEstadoStyle = (estado) => {
    const styles = {
      'Vencida': 'bg-red-100 text-red-700',
      'Pendiente': 'bg-yellow-100 text-yellow-700',
      'Pagado': 'bg-green-100 text-green-700'
    };
    return styles[estado] || 'bg-gray-100 text-gray-700';
  };

  const getIcon = (iconType) => {
    const icons = {
      'fabric': <CreditCard size={24} className="text-gray-600" />,
      'truck': <Truck size={24} className="text-gray-600" />,
      'scissors': <Scissors size={24} className="text-gray-600" />,
      'package': <Package size={24} className="text-gray-600" />
    };
    return icons[iconType] || <CreditCard size={24} className="text-gray-600" />;
  };

  const totalDeudas = deudas.reduce((sum, deuda) => sum + deuda.montoTotal, 0);
  const totalPagado = deudas.reduce((sum, deuda) => sum + deuda.montoPagado, 0);
  const totalPendiente = totalDeudas - totalPagado;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Control de Deudas</h2>
          <p className="text-gray-500 mt-1">Gestiona las deudas pendientes con tus acreedores.</p>
        </div>
        <button className="flex items-center space-x-2 px-5 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium shadow-sm">
          <Plus size={20} />
          <span>Añadir Deuda</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Adeudado</div>
          <div className="text-3xl font-bold text-gray-800">${totalDeudas.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">{deudas.length} acreedores</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Pagado</div>
          <div className="text-3xl font-bold text-green-600">${totalPagado.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">{deudas.filter(d => d.estado === 'Pagado').length} pagos completados</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Pendiente de Pago</div>
          <div className="text-3xl font-bold text-red-600">${totalPendiente.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">{deudas.filter(d => d.estado !== 'Pagado').length} deudas activas</div>
        </div>
      </div>

      {/* Tabla de Deudas */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <SlidersHorizontal size={18} className="text-gray-600" />
              <span className="text-gray-600 font-medium">Filtrar</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
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
                  Fecha de Vencimiento
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
              {deudas.map((deuda) => (
                <tr key={deuda.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getIcon(deuda.icon)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{deuda.acreedor}</div>
                        <div className="text-sm text-gray-500">{deuda.factura}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">
                      ${deuda.montoTotal.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      ${deuda.montoPagado.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {deuda.fechaVencimiento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(deuda.estado)}`}>
                      {deuda.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Ver detalles">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Registrar pago">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando 1 a 4 de 15 deudas
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              Anterior
            </button>
            <button className="px-3 py-2 text-sm bg-teal-500 text-white rounded-lg font-medium">
              1
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              2
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              3
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deudas;