import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

    setStats({
      totalClientes,
      clientesVIP,
      totalGastado,
      comprasPromedio
    });
  };

  const getNivelFidelidad = (numCompras) => {
    if (numCompras >= 10) return { nivel: 'Diamante', color: 'bg-purple-100 text-purple-700', icon: '💎' };
    if (numCompras >= 5) return { nivel: 'Oro', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' };
    if (numCompras >= 3) return { nivel: 'Plata', color: 'bg-gray-100 text-gray-700', icon: '🥈' };
    return { nivel: 'Nuevo', color: 'bg-blue-100 text-blue-700', icon: '⭐' };
  };

  const getDescuentoFidelidad = (numCompras) => {
    if (numCompras >= 10) return 15;
    if (numCompras >= 5) return 10;
    if (numCompras >= 3) return 5;
    return 0;
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cedula && cliente.cedula.includes(searchTerm)) ||
    (cliente.celular && cliente.celular.includes(searchTerm))
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
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

      {/* Programa de Fidelidad Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="text-purple-600" size={28} />
          <h3 className="text-xl font-bold text-gray-800">Programa de Fidelidad</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🥈</span>
              <div className="font-bold text-gray-800">Nivel Plata</div>
            </div>
            <div className="text-sm text-gray-600">3-4 compras</div>
            <div className="text-lg font-bold text-teal-600 mt-1">5% descuento</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🥇</span>
              <div className="font-bold text-gray-800">Nivel Oro</div>
            </div>
            <div className="text-sm text-gray-600">5-9 compras</div>
            <div className="text-lg font-bold text-yellow-600 mt-1">10% descuento</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💎</span>
              <div className="font-bold text-gray-800">Nivel Diamante</div>
            </div>
            <div className="text-sm text-gray-600">10+ compras</div>
            <div className="text-lg font-bold text-purple-600 mt-1">15% descuento</div>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Lista de Clientes ({clientesFiltrados.length})</h3>
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Nivel Fidelidad</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Descuento</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => {
                  const fidelidad = getNivelFidelidad(cliente.numero_compras);
                  const descuento = getDescuentoFidelidad(cliente.numero_compras);

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition">
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
                        {descuento > 0 ? (
                          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                            {descuento}% OFF
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin descuento</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-600">
                          {cliente.ultima_compra
                            ? new Date(cliente.ultima_compra).toLocaleDateString('es-ES')
                            : 'N/A'
                          }
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
    </div>
  );
};

export default Clientes;