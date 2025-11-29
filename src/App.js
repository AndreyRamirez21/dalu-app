import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/sections/Dashboard';
import Ventas from './components/sections/Ventas';
import Gastos from './components/sections/Gastos';
import Deudas from './components/sections/Deudas';
import Inventario from './components/sections/Inventario';

const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'ventas':
        return <Ventas />;
      case 'gastos':
        return <Gastos />;
      case 'deudas':
        return <Deudas />;
      case 'inventario':
        return <Inventario />;
      default:
        return <Dashboard />;
    }
  };

  const getTitleAndSubtitle = () => {
    const titles = {
      dashboard: {
        title: 'Dashboard Principal',
        subtitle: 'Bienvenida de nuevo, aquí está el resumen de tu negocio.'
      },
      ventas: {
        title: 'Gestión de Ventas',
        subtitle: 'Registra y administra las ventas de tu negocio.'
      },
      gastos: {
        title: 'Gestión de Gastos',
        subtitle: 'Controla y registra todos tus gastos.'
      },
      deudas: {
        title: 'Gestión de Deudas',
        subtitle: 'Administra las deudas por cobrar de tus clientes.'
      },
      inventario: {
        title: 'Gestión de Inventario',
        subtitle: 'Controla el stock de tus productos.'
      }
    };
    return titles[activeSection] || titles.dashboard;
  };

  const { title, subtitle } = getTitleAndSubtitle();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto">
        <Header title={title} subtitle={subtitle} />
        {renderContent()}
      </div>
    </div>
  );
};

export default App;;