import React from 'react';
import { ShoppingCart, CreditCard, DollarSign, Package, LogOut, Users, BarChart3, HardDrive, Store, Wallet,Sparkles } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  return (
<div className="w-64 bg-white shadow-lg flex flex-col h-screen">
      <div className="p-6 border-b">
        <div className="flex flex-col items-center space-y-2">
          <img
            src={process.env.PUBLIC_URL + '/logooo1.png'}
            alt="Dalú Logo"
            className="w-[80px] h-[80px] object-contain"
          />
          <p className="text-xs text-teal-500 uppercase tracking-wide font-semibold">
          </p>
        </div>
      </div>

<nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">        <button
          onClick={() => setActiveSection('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
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
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            activeSection === 'estadisticas'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={20} />
          <span className="font-medium">Estadísticas</span>
        </button>

        {/* ── CAJA ── */}
        <button
          onClick={() => setActiveSection('caja')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            activeSection === 'caja'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Wallet size={20} />
          <span className="font-medium">Caja</span>
        </button>

        <button
          onClick={() => setActiveSection('backups')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            activeSection === 'backups'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <HardDrive size={20} />
          <span className="font-medium">Respaldos</span>
        </button>

        <button
          onClick={() => setActiveSection('marcas-aliadas')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
            activeSection === 'marcas-aliadas'
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Store size={20} />
          <span className="font-medium">Marcas aliadas</span>
        </button>

                {/* ── Separador ── */}
                <div className="border-t border-gray-100 my-2" />

                {/* ── IA ── */}
                <button onClick={() => setActiveSection('ia')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                    activeSection === 'ia'
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-500'
                  }`}>
                  <Sparkles size={20} />
                  <span className="font-medium">Asistente IA</span>
                </button>
      </nav>

    </div>
  );
};

export default Sidebar;