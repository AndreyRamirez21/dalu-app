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
  Trash2,
  CreditCard,
  CheckCircle
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
    if (numCompras >= 6) return { nivel: 'Premium', color: 'bg-blue-100 text-blue-700', icon: '💎' };
    if (numCompras >= 3) return { nivel: 'Gold', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' };
    if (numCompras >= 1) return { nivel: 'Activo', color: 'bg-green-100 text-green-700', icon: '⭐' };
    return { nivel: 'Nuevo', color: 'bg-gray-100 text-gray-700', icon: '👤' };
  };

const getIconoEstadoFidelidad = (cliente) => {
  const { numero_compras, compras_con_tarjeta, tarjeta_fidelidad_entregada,
          descuento_aplicado_3, descuento_aplicado_6, fecha_primera_compra } = cliente;

  console.log('🔍 Cliente:', cliente.nombre, {
    numero_compras,
    compras_con_tarjeta,
    tarjeta_fidelidad_entregada,
    descuento_aplicado_3,
    descuento_aplicado_6
  });

  // Verificar si pasaron 10 meses
  const fechaPrimeraCompra = fecha_primera_compra ? new Date(fecha_primera_compra) : null;
  const hace10Meses = fechaPrimeraCompra ?
    (Date.now() - fechaPrimeraCompra.getTime()) / (1000 * 60 * 60 * 24 * 30) > 10 : false;

  // Alerta: Entregar tarjeta en la 1ra compra
  if (numero_compras === 1 && !tarjeta_fidelidad_entregada) {
    return {
      icono: '🎁',
      mensaje: 'Entregar tarjeta de fidelidad',
      color: 'text-purple-600 bg-purple-50',
      border: 'border-purple-300'
    };
  }

  // Alerta: Descuento del 10% disponible (3ra compra)
  if (numero_compras === 3 && compras_con_tarjeta >= 2 && !descuento_aplicado_3) {
    return {
      icono: '🎉',
      mensaje: '10% descuento disponible',
      color: 'text-green-600 bg-green-50',
      border: 'border-green-300'
    };
  }

  // Alerta: Descuento del 15% disponible (6ta compra)
  if (numero_compras === 6 && compras_con_tarjeta >= 5 && !descuento_aplicado_6 && !hace10Meses) {
    return {
      icono: '💎',
      mensaje: '15% descuento disponible',
      color: 'text-blue-600 bg-blue-50',
      border: 'border-blue-300'
    };
  }

  // Alerta: Fidelidad vencida
  if (hace10Meses && numero_compras < 3) {
    return {
      icono: '⏰',
      mensaje: 'Fidelidad vencida',
      color: 'text-red-600 bg-red-50',
      border: 'border-red-300'
    };
  }

  // Cliente activo con tarjeta
  if (tarjeta_fidelidad_entregada && numero_compras >= 1) {
    return {
      icono: '✅',
      mensaje: `${compras_con_tarjeta || 0} compras con tarjeta`,
      color: 'text-gray-600 bg-gray-50',
      border: 'border-gray-200'
    };
  }

  return null;
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

      {/* Programa de Fidelidad Info - ACTUALIZADO */}
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
            <li>En la <strong>segunda compra</strong>, entrega la tarjeta de fidelidad al cliente</li>
            <li>El cliente debe presentar la tarjeta en cada compra para acumular beneficios</li>
            <li>Los descuentos se aplican automáticamente al cumplir los requisitos</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🎉</span>
              <div className="font-bold text-gray-800">Descuento 10%</div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✓ En la <strong>3ra compra</strong></div>
              <div>✓ Haber presentado tarjeta en compras #2 y #3</div>
            </div>
            <div className="text-lg font-bold text-green-600 mt-2">10% OFF</div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💎</span>
              <div className="font-bold text-gray-800">Descuento 15%</div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✓ En la <strong>6ta compra</strong></div>
              <div>✓ Haber presentado tarjeta desde compra #2 hasta #6</div>
              <div>✓ Compra mayor a <strong>$30,000</strong></div>
              <div>✓ Dentro de <strong>10 meses</strong> desde 1ra compra</div>
            </div>
            <div className="text-lg font-bold text-blue-600 mt-2">15% OFF</div>
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Nivel</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado Fidelidad</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => {
                  const fidelidad = getNivelFidelidad(cliente.numero_compras);
                  const estadoFidelidad = getIconoEstadoFidelidad(cliente);

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
                        {estadoFidelidad ? (
                          <div className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border ${estadoFidelidad.color} ${estadoFidelidad.border}`}>
                            <span className="text-2xl mb-1">{estadoFidelidad.icono}</span>
                            <span className="text-xs font-medium">{estadoFidelidad.mensaje}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
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