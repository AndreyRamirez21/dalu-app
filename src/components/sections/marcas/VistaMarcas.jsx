// src/components/sections/marcas/VistaMarcas.jsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Phone, Mail, Percent, Search, Eye, Store } from 'lucide-react';

export const VistaMarcas = ({ marcasAliadas }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const marcasFiltradas = marcasAliadas.marcas.filter(marca =>
    marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (marca.contacto_nombre && marca.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Marcas Aliadas</h2>
          <p className="text-gray-600 mt-1">Gestiona las marcas que venden en tu tienda</p>
        </div>
        <button
          onClick={() => marcasAliadas.setVista('agregar')}
          className="flex items-center space-x-2 px-5 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Nueva Marca</span>
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Total Marcas</div>
              <div className="text-3xl font-bold text-gray-800">{marcasAliadas.totalMarcas}</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Store className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Marcas Activas</div>
              <div className="text-3xl font-bold text-green-600">{marcasAliadas.marcasActivas}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Store className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase mb-2">Productos Total</div>
              <div className="text-3xl font-bold text-blue-600">{marcasAliadas.totalProductosMarcas}</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border mb-6 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar marca por nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Lista de marcas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {marcasAliadas.cargando ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando marcas...</p>
          </div>
        ) : marcasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hay marcas registradas</p>
            <p className="text-gray-400 text-sm mt-2">Haz clic en "Nueva Marca" para agregar una</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {marcasFiltradas.map((marca) => (
              <div key={marca.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">{marca.nombre}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        marca.activo === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {marca.activo === 1 ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      {marca.contacto_nombre && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail size={16} className="text-gray-400" />
                          <span>{marca.contacto_nombre}</span>
                        </div>
                      )}

                      {marca.contacto_telefono && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone size={16} className="text-gray-400" />
                          <span>{marca.contacto_telefono}</span>
                        </div>
                      )}

                      {marca.contacto_email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail size={16} className="text-gray-400" />
                          <span>{marca.contacto_email}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Percent size={16} className="text-gray-400" />
                        <span>Comisión: {marca.porcentaje_comision}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Package size={16} className="text-blue-500" />
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-800">{marca.total_productos || 0}</span> productos
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package size={16} className="text-green-500" />
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-800">{marca.total_stock || 0}</span> unidades
                        </span>
                      </div>
                    </div>

                    {marca.notas && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 italic">{marca.notas}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => marcasAliadas.handleVerProductos(marca)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition"
                      title="Ver productos"
                    >
                      <Eye size={20} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => marcasAliadas.handleEditarMarca(marca)}
                      className="p-2 hover:bg-purple-50 rounded-lg transition"
                      title="Editar marca"
                    >
                      <Edit size={20} className="text-purple-600" />
                    </button>
                    <button
                      onClick={() => marcasAliadas.handleEliminarMarca(marca.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar marca"
                    >
                      <Trash2 size={20} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};