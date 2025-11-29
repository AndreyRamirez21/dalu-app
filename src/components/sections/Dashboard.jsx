import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const stats = {
    totalSales: 12450.00,
    salesChange: '+15.2%',
    totalExpenses: 3120.50,
    expensesChange: '+5.8%',
    debts: 850.00,
    debtClients: 3,
    inventory: 256,
    lowStock: 12
  };

  const activities = [
    { id: 1, type: 'Venta', description: 'Venta a cliente #1024', amount: '$150.00', time: 'Hace 2 horas' },
    { id: 2, type: 'Gasto', description: 'Pago de envío a proveedor', amount: '-$45.50', time: 'Hace 5 horas' },
    { id: 3, type: 'Inventario', description: 'Reabastecimiento de "Pijama Nube"', amount: '+20 unidades', time: 'Ayer' },
    { id: 4, type: 'Deuda', description: 'Recordatorio de pago enviado', amount: '$75.00', time: 'Ayer' }
  ];

  const getTypeColor = (type) => {
    const colors = {
      'Venta': 'bg-green-100 text-green-700',
      'Gasto': 'bg-red-100 text-red-700',
      'Inventario': 'bg-blue-100 text-blue-700',
      'Deuda': 'bg-yellow-100 text-yellow-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium uppercase">Ventas Totales</span>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            ${stats.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-green-500 text-sm font-medium">
            {stats.salesChange} vs mes anterior
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium uppercase">Gastos Totales</span>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            ${stats.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-red-500 text-sm font-medium">
            {stats.expensesChange} vs mes anterior
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium uppercase">Deudas por Cobrar</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            ${stats.debts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-gray-500 text-sm">
            {stats.debtClients} clientes con saldo pendiente
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium uppercase">Items en Inventario</span>
            <span className="text-2xl">📦</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {stats.inventory}
          </div>
          <div className="text-gray-500 text-sm">
            {stats.lowStock} productos bajos en stock
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">Actividad Reciente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {activity.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;