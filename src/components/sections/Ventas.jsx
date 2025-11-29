import React, { useState } from 'react';
import { ShoppingCart, Eye, Edit, Plus, Search, Calendar } from 'lucide-react';

const Ventas = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const ventas = [
    {
      id: '#1024',
      cliente: 'Ana Torres',
      productos: 'Pijama Nube (M), Pijama Luna (S)',
      monto: 150.00,
      estado: 'Pagado',
      fecha: '15 Jul, 2024'
    },
    {
      id: '#1023',
      cliente: 'Carlos Méndez',
      productos: 'Pijama Estrella (L)',
      monto: 75.00,
      estado: 'Pendiente',
      fecha: '14 Jul, 2024'
    },
    {
      id: '#1022',
      cliente: 'Sofía Vargas',
      productos: 'Pijama Sol (M)',
      monto: 85.50,
      estado: 'Pagado',
      fecha: '14 Jul, 2024'
    },
    {
      id: '#1021',
      cliente: 'Laura Jiménez',
      productos: 'Pijama Nube (XS)',
      monto: 65.00,
      estado: 'Cancelado',
      fecha: '13 Jul, 2024'
    },
    {
      id: '#1020',
      cliente: 'Mario Castro',
      productos: 'Pijama Galaxia (L), Pijama Cometa (L)',
      monto: 180.00,
      estado: 'Pagado',
      fecha: '12 Jul, 2024'
    }
  ];

  const getEstadoColor = (estado) => {
    const colors = {
      'Pagado': 'bg-green-100 text-green-700',
      'Pendiente': 'bg-yellow-100 text-yellow-700',
      'Cancelado': 'bg-red-100 text-red-700'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8">
      {/* Header de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium uppercase mb-2">
              <ShoppingCart size={20} className="text-teal-500" />
              <span>Ventas Totales (Este Mes)</span>
            </div>
            <div className="text-4xl font-bold text-gray-800">
              $8,320.50
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Calendar size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">01 Jul, 2024 - 31 Jul, 2024</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button className="flex items-center space-x-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium">
            <Plus size={20} />
            <span>Agregar Venta</span>
          </button>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Venta
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto(s)
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
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
            {ventas.map((venta) => (
              <tr key={venta.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {venta.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {venta.cliente}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {venta.productos}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${venta.monto.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                    {venta.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {venta.fecha}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Edit size={18} className="text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando 1-5 de 25 ventas
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              ‹
            </button>
            <button className="px-3 py-2 text-sm bg-teal-500 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">2</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">3</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">...</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">5</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas;