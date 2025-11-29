import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, Edit, Trash2, AlertTriangle, AlertCircle, User } from 'lucide-react';

const Inventario = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const productos = [
    {
      id: 1,
      nombre: 'Pijama Nube',
      descripcion: 'Algodón, Talla M',
      sku: 'PJ-001-M',
      stock: 8,
      precio: 45.00,
      estado: 'Stock Bajo'
    },
    {
      id: 2,
      nombre: 'Pijama Sol',
      descripcion: 'Seda, Talla S',
      sku: 'PJ-002-S',
      stock: 15,
      precio: 60.00,
      estado: 'En Stock'
    },
    {
      id: 3,
      nombre: 'Pijama Luna',
      descripcion: 'Franela, Talla L',
      sku: 'PJ-003-L',
      stock: 22,
      precio: 50.00,
      estado: 'En Stock'
    },
    {
      id: 4,
      nombre: 'Pijama Estrella',
      descripcion: 'Satén, Talla M',
      sku: 'PJ-004-M',
      stock: 0,
      precio: 65.00,
      estado: 'Agotado'
    }
  ];

  const getEstadoStyle = (estado, stock) => {
    if (estado === 'Agotado' || stock === 0) {
      return 'bg-red-100 text-red-700';
    } else if (estado === 'Stock Bajo' || stock < 10) {
      return 'bg-yellow-100 text-yellow-700';
    } else {
      return 'bg-green-100 text-green-700';
    }
  };

  const getStockIcon = (stock) => {
    if (stock === 0) {
      return <AlertCircle size={16} className="text-red-600" />;
    } else if (stock < 10) {
      return <AlertTriangle size={16} className="text-yellow-600" />;
    }
    return null;
  };

  const totalProductos = 256;
  const stockBajo = 12;
  const agotados = 3;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h2>
          <p className="text-gray-500 mt-1">Administra los productos, stock y precios.</p>
        </div>
        <button className="flex items-center space-x-2 px-5 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium shadow-sm">
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Productos</div>
          <div className="text-3xl font-bold text-gray-800">{totalProductos}</div>
          <div className="text-sm text-gray-500 mt-1">Items en inventario</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Stock Bajo</div>
          <div className="text-3xl font-bold text-yellow-600">{stockBajo}</div>
          <div className="text-sm text-gray-500 mt-1">Productos requieren reabastecimiento</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase mb-2">Agotados</div>
          <div className="text-3xl font-bold text-red-600">{agotados}</div>
          <div className="text-sm text-gray-500 mt-1">Productos sin stock</div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Lista de Productos ({totalProductos})</h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar producto..."
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
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
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
              {productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User size={24} className="text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{producto.nombre}</div>
                        <div className="text-sm text-gray-500">{producto.descripcion}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{producto.sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${
                        producto.stock === 0 ? 'text-red-600' :
                        producto.stock < 10 ? 'text-yellow-600' :
                        'text-gray-800'
                      }`}>
                        {producto.stock}
                      </span>
                      {getStockIcon(producto.stock)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">
                      ${producto.precio.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(producto.estado, producto.stock)}`}>
                      {producto.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Editar producto">
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Eliminar producto">
                        <Trash2 size={18} className="text-gray-600" />
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
            Mostrando 1 a 4 de {totalProductos} productos
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
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
              ...
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventario;