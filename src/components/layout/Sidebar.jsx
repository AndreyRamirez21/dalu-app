import React from 'react';
import { ShoppingCart, CreditCard, DollarSign, Package, LogOut, Users, BarChart3, HardDrive } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex flex-col items-center space-y-2">
            <img
              src={process.env.PUBLIC_URL + '/logooo1.png'}
              alt="Dalú Logo"
              className="w-[100px] h-[100px] object-contain"
            />
            <p className="text-xs text-teal-500 uppercase tracking-wide font-semibold">
            </p>
          </div>
        </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            activeSection === 'dashboard'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Package size={20} />
          <span className="font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSection('ventas')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            activeSection === 'ventas'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ShoppingCart size={20} />
          <span className="font-medium">Ventas</span>
        </button>

        <button
          onClick={() => setActiveSection('gastos')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            activeSection === 'gastos'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CreditCard size={20} />
          <span className="font-medium">Gastos</span>
        </button>

        <button
          onClick={() => setActiveSection('deudas')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            activeSection === 'deudas'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <DollarSign size={20} />
          <span className="font-medium">Deudas</span>
        </button>

        <button
          onClick={() => setActiveSection('inventario')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            activeSection === 'inventario'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Package size={20} />
          <span className="font-medium">Inventario</span>

        </button>

                <button
                  onClick={() => setActiveSection('clientes')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeSection === 'clientes'
                      ? 'bg-teal-50 text-teal-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users size={20} />
                  <span className="font-medium">Clientes</span>

                </button>

                <button
                  onClick={() => setActiveSection('estadisticas')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    setActiveSection === 'estadisticas'
                      ? 'bg-teal-50 text-teal-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span className="font-medium">Estadísticas</span>
                </button>

                                <button
                                  onClick={() => setActiveSection('backups')}
                                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                                    setActiveSection === 'backups'
                                      ? 'bg-teal-50 text-teal-600'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <HardDrive size={20} />
                                  <span className="font-medium">GestionBackups</span>
                                </button>




      </nav>

      <div className="p-4 border-t">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;