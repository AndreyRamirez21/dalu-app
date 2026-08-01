// src/components/sections/inventario/VistaLista.jsx
import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle, Package, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { exportarInventarioExcel } from "../../../utils/exportExcel";
import { ImagenProducto } from './ImagenProducto';
import PanelRotacion from './PanelRotacion'; // ✅ NUEVO

const BRAND = '#82bbbd';

/* ─── Stat card (idéntica a Ventas) ────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor }) => (
  <div
    className="bg-white rounded-xl p-5"
    style={{
      borderTop: `2px solid ${accentColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {label}
    </p>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="mt-1.5 text-xs text-gray-400">{sub}</p>
  </div>
);

/* ─── Badge de estado (mismo lenguaje visual que Ventas) ───────── */
const ESTADO_BADGE = {
  'En Stock':   { color: '#059669', bg: '#f0fdf4', border: '#86efac' },
  'Stock Bajo': { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  'Agotado':    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const EstadoBadge = ({ texto }) => {
  const s = ESTADO_BADGE[texto] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {texto}
    </span>
  );
};

/* ─── Botones (idénticos a Ventas) ─────────────────────────────── */
const BtnPrimary = ({ onClick, disabled, icon: Icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
    style={{ backgroundColor: BRAND, color: '#fff' }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const BtnOutline = ({ onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50"
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

// ── Modal imagen ampliada ────────────────────────────────────────
const ModalImagen = ({ imagenBase64, nombreProducto, onCerrar }) => {
  if (!imagenBase64) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition z-10"
        >
          <X size={24} className="text-gray-700" />
        </button>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{nombreProducto}</h3>
          <img
            src={imagenBase64}
            alt={nombreProducto}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────
export const VistaLista = ({ inventario }) => {
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [nombreProductoAmpliado, setNombreProductoAmpliado] = useState('');

  const getStockIcon = (stock) => {
    if (stock === 0) return <AlertCircle size={16} className="text-red-600" />;
    if (stock <= 2) return <AlertCircle size={16} className="text-yellow-600" />;
    return null;
  };

  const abrirImagenAmpliada = (imagenBase64, nombre) => {
    setImagenAmpliada(imagenBase64);
    setNombreProductoAmpliado(nombre);
  };

  const cerrarImagenAmpliada = () => {
    setImagenAmpliada(null);
    setNombreProductoAmpliado('');
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {/* Modal imagen */}
      {imagenAmpliada && (
        <ModalImagen
          imagenBase64={imagenAmpliada}
          nombreProducto={nombreProductoAmpliado}
          onCerrar={cerrarImagenAmpliada}
        />
      )}

      {/* ✅ Panel de rotación (se monta aquí, se muestra/oculta solo) */}
      <PanelRotacion
        panelRotacionAbierto={inventario.panelRotacionAbierto}
        cerrarPanelRotacion={inventario.cerrarPanelRotacion}
        cargarRotacion={inventario.cargarRotacion}
        rotacionFiltrada={inventario.rotacionFiltrada}
        resumenRotacion={inventario.resumenRotacion}
        cargandoRotacion={inventario.cargandoRotacion}
        errorRotacion={inventario.errorRotacion}
        filtroEstadoRotacion={inventario.filtroEstadoRotacion}
        setFiltroEstadoRotacion={inventario.setFiltroEstadoRotacion}
        searchRotacion={inventario.searchRotacion}
        setSearchRotacion={inventario.setSearchRotacion}
        productoRotacionExpandido={inventario.productoRotacionExpandido}
        setProductoRotacionExpandido={inventario.setProductoRotacionExpandido}
        historialVariante={inventario.historialVariante}
        setHistorialVariante={inventario.setHistorialVariante}
        cargandoHistorial={inventario.cargandoHistorial}
        cargarHistorialVariante={inventario.cargarHistorialVariante}
        getColorEstadoRotacion={inventario.getColorEstadoRotacion}
        formatearFechaRotacion={inventario.formatearFechaRotacion}
      />

      {/* ── Barra de botones superior ── */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <BtnOutline onClick={inventario.abrirPanelRotacion} icon={RefreshCw}>
          Rotación
        </BtnOutline>
        <BtnOutline
          onClick={() => exportarInventarioExcel(inventario.productos)}
          icon={Package}
        >
          Exportar Excel
        </BtnOutline>
        <BtnPrimary
          onClick={() => {
            inventario.resetFormulario();
            inventario.setVista('agregar');
          }}
          icon={Plus}
        >
          Nuevo Producto
        </BtnPrimary>
      </div>

      {/* ── Tarjetas de estadísticas ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Productos"
          value={inventario.totalProductos}
          sub="productos registrados"
          accentColor={BRAND}
        />
        <StatCard
          label="Total Unidades"
          value={inventario.totalUnidades}
          sub="items en inventario"
          accentColor="#6366f1"
        />
        <StatCard
          label="Stock Bajo"
          value={inventario.stockBajo}
          sub="requieren reabastecimiento"
          accentColor="#d97706"
        />
        <StatCard
          label="Agotados"
          value={inventario.agotados}
          sub="productos sin stock"
          accentColor="#dc2626"
        />
      </div>

      {/* ── Tabla de productos ── */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Lista de Productos ({inventario.productosFiltrados.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar producto o referencia…"
                value={inventario.searchTerm}
                onChange={(e) => inventario.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
                style={{ '--tw-ring-color': BRAND }}
                onFocus={(e) => { e.target.style.borderColor = BRAND; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por talla…"
                value={inventario.tallaFiltro === 'Todas' ? '' : inventario.tallaFiltro}
                onChange={(e) => inventario.setTallaFiltro(e.target.value || 'Todas')}
                className="w-44 pl-3.5 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 transition"
                style={{ '--tw-ring-color': BRAND }}
                onFocus={(e) => { e.target.style.borderColor = BRAND; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
              {inventario.tallaFiltro !== 'Todas' && (
                <button
                  onClick={() => inventario.setTallaFiltro('Todas')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Limpiar filtro"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => inventario.setBusquedaTallaExacta(!inventario.busquedaTallaExacta)}
              className="px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors border"
              style={
                inventario.busquedaTallaExacta
                  ? { backgroundColor: '#f0fdfa', color: BRAND, borderColor: BRAND }
                  : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
              }
              title={inventario.busquedaTallaExacta ? 'Búsqueda exacta' : 'Búsqueda flexible'}
            >
              {inventario.busquedaTallaExacta ? '=' : '~'}
            </button>

            {/* Filtro por rango de precio */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap uppercase tracking-wide">$ Precio</span>
              <input
                type="number"
                placeholder="Mín"
                value={inventario.precioMin}
                onChange={(e) => inventario.setPrecioMin(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-20 text-sm border-none outline-none text-gray-700 placeholder-gray-300"
              />
              <span className="text-gray-300 text-sm">—</span>
              <input
                type="number"
                placeholder="Máx"
                value={inventario.precioMax}
                onChange={(e) => inventario.setPrecioMax(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-20 text-sm border-none outline-none text-gray-700 placeholder-gray-300"
              />
              {(inventario.precioMin !== '' || inventario.precioMax !== '') && (
                <button
                  onClick={() => { inventario.setPrecioMin(''); inventario.setPrecioMax(''); }}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                  title="Limpiar filtro de precio"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {inventario.categorias.map((cat) => {
              const active = inventario.categoriaActiva === cat;
              return (
                <button
                  key={cat}
                  onClick={() => inventario.setCategoriaActiva(cat)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150"
                  style={active
                    ? { backgroundColor: BRAND, color: '#fff' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {inventario.productosFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No hay productos registrados</p>
            <p className="text-gray-400 text-xs mt-1">Haz clic en "Nuevo Producto" para agregar uno</p>
          </div>
        ) : (
          <>
            {/* Encabezados */}
            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="px-6 py-3.5 flex items-center">
                <div className="w-8 mr-3"></div>
                <div className="flex-1 flex items-center">
                  <div className="w-24 flex-shrink-0 text-left">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Referencia</span>
                  </div>
                  <div className="flex-1 min-w-[200px] text-left">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Producto</span>
                  </div>
                  <div className="w-32 text-left">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Categoría</span>
                  </div>
                  <div className="w-24 text-left">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Stock</span>
                  </div>
                  <div className="w-28 text-left">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Estado</span>
                  </div>
                  <div className="w-24"></div>
                </div>
              </div>
            </div>

            {/* Filas de productos */}
            <div className="divide-y divide-gray-50">
              {inventario.productosAgrupados.map((grupo) => {
                const expandidoGrupo = inventario.productosExpandidos[grupo.id];

                return (
                  <div key={grupo.id} className="bg-white transition-colors hover:bg-gray-50/70">
                    {/* Fila del grupo */}
                    <div className="px-6 py-4 flex items-center">
                      <button
                        onClick={() => inventario.toggleExpandirProducto(grupo.id)}
                        className="mr-3 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        {expandidoGrupo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      <div className="flex-1 flex items-center">
                        <div className="w-24 flex-shrink-0">
                          <span className="text-sm font-semibold" style={{ color: BRAND }}>
                            {grupo.referencias.length} ref(s)
                          </span>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <div className="text-sm font-semibold text-gray-900">{grupo.nombre}</div>
                        </div>
                        <div className="w-32 flex justify-start">
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-full text-xs font-medium">
                            {grupo.categoria}
                          </span>
                        </div>
                        <div className="w-24">
                          <div className="flex items-center justify-start gap-2">
                            <span className={`text-sm font-semibold ${
                              grupo.stockTotal === 0 ? 'text-red-600' :
                              grupo.stockTotal <= 5 ? 'text-yellow-600' :
                              'text-gray-900'
                            }`}>
                              {grupo.stockTotal}
                            </span>
                            {getStockIcon(grupo.stockTotal)}
                          </div>
                        </div>
                        <div className="w-28 flex justify-start">
                          <EstadoBadge texto={inventario.getEstadoTexto(grupo.stockTotal)} />
                        </div>
                        <div className="w-24"></div>
                      </div>
                    </div>

                    {/* Referencias expandidas */}
                    {expandidoGrupo && (
                      <div className="px-6 pb-4 ml-12" style={{ backgroundColor: '#FAFBFC' }}>
                        <div className="pl-6 space-y-3" style={{ borderLeft: `2px solid ${BRAND}55` }}>
                          {grupo.referencias.map((producto) => {
                            const stockReferencia = inventario.calcularStockTotal(producto.variantes);
                            const expandidoReferencia = inventario.referenciasExpandidas[producto.id];

                            return (
                              <div
                                key={producto.id}
                                className="bg-white rounded-xl p-4"
                                style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                              >
                                {/* Cabecera de referencia */}
                                <div className="flex items-center">
                                  <button
                                    onClick={() => inventario.toggleExpandirReferencia(producto.id)}
                                    className="mr-3 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                                  >
                                    {expandidoReferencia ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>

                                  <div className="mr-3">
                                    <ImagenProducto
                                      rutaImagen={producto.imagen}
                                      rutaThumbnail={producto.imagenThumbnail}
                                      nombreProducto={`${producto.nombre} - ${producto.referencia}`}
                                      onClickImagen={(img) => abrirImagenAmpliada(img, `${producto.nombre} - ${producto.referencia}`)}
                                      useThumbnail={true}
                                    />
                                  </div>

                                  <div className="flex-1 grid grid-cols-8 gap-3 items-center">
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Referencia</div>
                                      <div className="text-sm font-mono text-gray-800 font-semibold">{producto.referencia}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Costo Base</div>
                                      <div className="text-sm text-gray-700">${producto.costo_base.toFixed(2)}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Costos Extras</div>
                                      <div className="text-sm">
                                        {(() => {
                                          const costosAdicionales = producto.costos_adicionales || [];
                                          const totalUnitario = costosAdicionales.reduce((s, c) => s + parseFloat(c.monto || 0), 0);
                                          const stockTotal = producto.variantes?.reduce((s, v) => s + v.cantidad, 0) || 0;
                                          const totalExtras = totalUnitario * stockTotal;
                                          if (costosAdicionales.length === 0) return <span className="text-gray-300 text-xs">Sin costos</span>;
                                          return (
                                            <div className="flex flex-col">
                                              <span className="font-semibold" style={{ color: '#6366f1' }}>${totalExtras.toFixed(2)}</span>
                                              <span className="text-xs text-gray-400">({costosAdicionales.length} item{costosAdicionales.length > 1 ? 's' : ''} × {stockTotal})</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Precio Venta</div>
                                      <div className="text-sm font-semibold text-gray-900">${producto.precio_venta_base.toFixed(2)}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Margen Real</div>
                                      <div className="text-sm font-semibold" style={{ color: '#059669' }}>
                                        {(() => {
                                          const costoBase = parseFloat(producto.costo_base) || 0;
                                          const precioVenta = parseFloat(producto.precio_venta_base) || 0;
                                          const costosAd = (producto.costos_adicionales || []).reduce((s, c) => s + parseFloat(c.monto || 0), 0);
                                          const costoTotal = costoBase + costosAd;
                                          if (!costoTotal || !precioVenta) return '0.0%';
                                          return `${(((precioVenta - costoTotal) / precioVenta) * 100).toFixed(1)}%`;
                                        })()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Stock</div>
                                      <div className={`text-sm font-semibold ${
                                        stockReferencia === 0 ? 'text-red-600' :
                                        stockReferencia <= 2 ? 'text-yellow-600' : 'text-gray-900'
                                      }`}>
                                        {stockReferencia}
                                      </div>
                                    </div>
                                    <div className="col-span-2">
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Acciones</div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => inventario.handleEditarProducto(producto)}
                                          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                                          title="Editar referencia"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button
                                          onClick={() => inventario.handleEliminarProducto(producto.id)}
                                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                                          title="Eliminar referencia"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Variantes */}
                                {expandidoReferencia && producto.variantes?.length > 0 && (
                                  <div className="mt-4 ml-8 pl-4" style={{ borderLeft: '2px solid #e5e7eb' }}>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                      Tallas / Variantes ({producto.variantes.length})
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {producto.variantes.map((variante) => (
                                        <div
                                          key={variante.id}
                                          className="rounded-lg p-3 flex items-center justify-between"
                                          style={{ backgroundColor: '#FAFBFC', border: '1px solid #f1f5f9' }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className="w-8 h-8 rounded flex items-center justify-center"
                                              style={{ backgroundColor: '#f0fdfa' }}
                                            >
                                              <span className="text-xs font-bold" style={{ color: BRAND }}>{variante.talla}</span>
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium text-gray-700">Talla {variante.talla}</div>
                                              <div className="text-xs text-gray-400">
                                                Stock: <span className={`font-semibold ${
                                                  variante.cantidad === 0 ? 'text-red-600' :
                                                  variante.cantidad < 5 ? 'text-yellow-600' : 'text-emerald-600'
                                                }`}>{variante.cantidad}</span>
                                              </div>
                                            </div>
                                          </div>
                                          {variante.ajuste_precio !== 0 && (
                                            <div className="text-xs font-medium" style={{ color: BRAND }}>
                                              {variante.ajuste_precio > 0 ? '+' : ''}${variante.ajuste_precio.toFixed(2)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};