import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, Edit, Trash2, PieChart } from 'lucide-react';

const Gastos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las Categorías');

  const gastos = [
    {
      id: 1,
      fecha: '15 de Jul, 2024',
      descripcion: 'Pago de envío a proveedor de telas',
      categoria: 'Logística',
      monto: 45.50
    },
    {
      id: 2,
      fecha: '12 de Jul, 2024',
      descripcion: 'Publicidad en redes sociales',
      categoria: 'Marketing',
      monto: 120.00
    },
    {
      id: 3,
      fecha: '10 de Jul, 2024',
      descripcion: 'Compra de insumos (hilos, botones)',
      categoria: 'Proveedores',
      monto: 85.20
    },
    {
      id: 4,
      fecha: '05 de Jul, 2024',
      descripcion: 'Suscripción software de diseño',
      categoria: 'Software',
      monto: 25.00
    },
    {
      id: 5,
      fecha: '01 de Jul, 2024',
      descripcion: 'Pago de servicio de luz',
      categoria: 'Servicios',
      monto: 68.75
    }
  ];

  const categorias = [
    { nombre: 'Todas las Categorías', count: 34, color: 'text-gray-700' },
    { nombre: 'Logística', count: 8, color: 'text-blue-600' },
    { nombre: 'Marketing', count: 5, color: 'text-purple-600' },
    { nombre: 'Proveedores', count: 12, color: 'text-orange-600' },
    { nombre: 'Software', count: 3, color: 'text-indigo-600' },
    { nombre: 'Servicios', count: 6, color: 'text-pink-600' }
  ];

  const getCategoriaColor = (categoria) => {
    const colors = {
      'Logística': 'bg-blue-100 text-blue-700',
      'Marketing': 'bg-purple-100 text-purple-700',
      'Proveedores': 'bg-orange-100 text-orange-700',
      'Software': 'bg-indigo-100 text-indigo-700',
      'Servicios': 'bg-pink-100 text-pink-700'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Contenido Principal */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Registro de Gastos</h2>
          <p className="text-gray-500 mt-1">Administra y registra todos los gastos de tu negocio.</p>
        </div>

        {/* Historial de Gastos */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Historial de Gastos</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium">
                <Plus size={18} />
                <span>Añadir Gasto</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar gasto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <SlidersHorizontal size={18} className="text-gray-600" />
                <span className="text-gray-600 font-medium">Filtros</span>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {gasto.fecha}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {gasto.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoriaColor(gasto.categoria)}`}>
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -${gasto.monto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <Edit size={18} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <Trash2 size={18} className="text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar Derecho */}
      <div className="w-96 bg-white border-l p-6 overflow-auto">
        {/* Gráfica de Dona */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Gastos por Categoría</h3>
          <div className="relative">
            <svg viewBox="0 0 200 200" className="w-full h-64">
              {/* Dona Chart - aproximación visual */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="35"
                strokeDasharray="110 330"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#EC4899"
                strokeWidth="35"
                strokeDasharray="80 360"
                strokeDashoffset="-110"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="35"
                strokeDasharray="50 390"
                strokeDashoffset="-190"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="35"
                strokeDasharray="60 380"
                strokeDashoffset="-240"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#6366F1"
                strokeWidth="35"
                strokeDasharray="40 400"
                strokeDashoffset="-300"
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>

          {/* Leyenda */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">Marketing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-600">Proveedores</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Logística</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-sm text-gray-600">Servicios</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-sm text-gray-600">Software</span>
            </div>
          </div>
        </div>

        {/* Filtrar por Categoría */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filtrar por Categoría</h3>
          <div className="space-y-2">
            {categorias.map((categoria, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(categoria.nombre)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  selectedCategory === categoria.nombre
                    ? 'bg-teal-50 text-teal-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={`font-medium ${categoria.color}`}>
                  {categoria.nombre}
                </span>
                <span className={`text-sm font-bold ${
                  selectedCategory === categoria.nombre
                    ? 'text-teal-600'
                    : 'text-gray-400'
                }`}>
                  {categoria.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total de Gastos</span>
            <span className="text-2xl font-bold text-red-600">
              -${totalGastos.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gastos;