// src/components/sections/marcas/VistaMarcas.jsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Phone, Mail, Percent, Search, Eye, Store, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

const BRAND = '#82bbbd';

/* ─── Stat card (idéntica a Ventas) ────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor, icon: Icon, valueSize = 'text-2xl' }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      {Icon && <Icon size={16} style={{ color: accentColor }} />}
    </div>
    <p className={`${valueSize} font-bold text-gray-900 tracking-tight`}>{value}</p>
    {sub && <p className="mt-1.5 text-xs text-gray-400">{sub}</p>}
  </div>
);

/* ─── Botón primario (idéntico a Ventas) ───────────────────────── */
const BtnPrimary = ({ onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity"
    style={{ backgroundColor: BRAND, color: '#fff' }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

export const VistaMarcas = ({ marcasAliadas }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const marcasFiltradas = marcasAliadas.marcas.filter(marca =>
    marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (marca.contacto_nombre && marca.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { estadisticasGenerales } = marcasAliadas;

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marcas Aliadas</h2>
          <p className="text-gray-500 mt-1 text-sm">Gestiona las marcas que venden en tu tienda</p>
        </div>
        <BtnPrimary onClick={() => marcasAliadas.setVista('agregar')} icon={Plus}>
          Nueva Marca
        </BtnPrimary>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Marcas"
          value={marcasAliadas.totalMarcas}
          accentColor={BRAND}
          icon={Store}
          valueSize="text-4xl"
        />
        <StatCard
          label="Marcas Activas"
          value={marcasAliadas.marcasActivas}
          accentColor="#059669"
          icon={Store}
          valueSize="text-4xl"
        />
        <StatCard
          label="Productos Total"
          value={marcasAliadas.totalProductosMarcas}
          accentColor="#6366f1"
          icon={Package}
          valueSize="text-4xl"
        />
        <StatCard
          label="Comisiones Marcas"
          value={`$${(estadisticasGenerales?.total_comision_marcas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Total pagado a marcas"
          accentColor="#7c3aed"
          icon={TrendingUp}
        />
        <StatCard
          label="Ganancia Tienda"
          value={`$${(estadisticasGenerales?.total_ganancia_tienda || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="De ventas de marcas"
          accentColor="#d97706"
          icon={DollarSign}
        />
      </div>

      {/* Buscador */}
      <div
        className="bg-white rounded-xl mb-5 p-5"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar marca por nombre o contacto…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': BRAND }}
            onFocus={(e) => { e.target.style.borderColor = BRAND; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>
      </div>

      {/* Lista de marcas */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        {marcasAliadas.cargando ? (
          <div className="p-14 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: BRAND }}></div>
            <p className="text-gray-400 text-sm mt-4">Cargando marcas…</p>
          </div>
        ) : marcasFiltradas.length === 0 ? (
          <div className="p-14 text-center">
            <Store size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No hay marcas registradas</p>
            <p className="text-gray-400 text-xs mt-1">Haz clic en "Nueva Marca" para agregar una</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {marcasFiltradas.map((marca) => (
              <div key={marca.id} className="p-6 transition-colors hover:bg-gray-50/70">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{marca.nombre}</h3>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={marca.activo === 1
                          ? { color: '#059669', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }
                          : { color: '#6b7280', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }
                        }
                      >
                        {marca.activo === 1 ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      {marca.contacto_nombre && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail size={14} className="text-gray-400" />
                          <span>{marca.contacto_nombre}</span>
                        </div>
                      )}

                      {marca.contacto_telefono && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone size={14} className="text-gray-400" />
                          <span>{marca.contacto_telefono}</span>
                        </div>
                      )}

                      {marca.contacto_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail size={14} className="text-gray-400" />
                          <span>{marca.contacto_email}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Percent size={14} className="text-gray-400" />
                        <span>Comisión: {marca.porcentaje_comision}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package size={14} style={{ color: '#6366f1' }} />
                        <span className="text-gray-500">
                          <span className="font-semibold text-gray-800">{marca.total_productos || 0}</span> productos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package size={14} style={{ color: '#059669' }} />
                        <span className="text-gray-500">
                          <span className="font-semibold text-gray-800">{marca.total_stock || 0}</span> unidades
                        </span>
                      </div>
                    </div>

                    {marca.notas && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FAFBFC', border: '1px solid #f1f5f9' }}>
                        <p className="text-sm text-gray-500 italic">{marca.notas}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => marcasAliadas.handleVerVentas(marca)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                      style={{ color: BRAND }}
                      title="Ver ventas y estadísticas"
                    >
                      <BarChart3 size={18} />
                    </button>
                    <button
                      onClick={() => marcasAliadas.handleVerProductos(marca)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                      title="Ver productos"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => marcasAliadas.handleEditarMarca(marca)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                      title="Editar marca"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => marcasAliadas.handleEliminarMarca(marca.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Eliminar marca"
                    >
                      <Trash2 size={18} />
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