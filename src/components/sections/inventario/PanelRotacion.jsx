// src/components/inventario/PanelRotacion.jsx
import React, { useState } from 'react';
import * as XLSX from 'sheetjs-style';

const PanelRotacion = ({
  panelRotacionAbierto,
  cerrarPanelRotacion,
  cargarRotacion,
  rotacionFiltrada,
  resumenRotacion,
  cargandoRotacion,
  errorRotacion,
  filtroEstadoRotacion,
  setFiltroEstadoRotacion,
  searchRotacion,
  setSearchRotacion,
  productoRotacionExpandido,
  setProductoRotacionExpandido,
  historialVariante,
  setHistorialVariante,
  cargandoHistorial,
  cargarHistorialVariante,
  getColorEstadoRotacion,
  formatearFechaRotacion
}) => {

      // ── Estado para gesto de deslizar ────────────────────────────
      const [dragStartX, setDragStartX] = useState(null);
      const [dragOffsetX, setDragOffsetX] = useState(0);
      const [isDragging, setIsDragging] = useState(false);

  if (!panelRotacionAbierto) return null;

  const handleMouseDown = (e) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || dragStartX === null) return;
    const offset = e.clientX - dragStartX;
    if (offset > 0) setDragOffsetX(offset); // solo hacia la derecha
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const offset = e.clientX - (dragStartX ?? e.clientX);
    if (offset > 150) {
      cerrarPanelRotacion();
    }
    setDragOffsetX(0);
    setDragStartX(null);
  };

  const estadosFiltro = [
    { valor: 'Todos',           label: 'Todos',           color: 'bg-gray-100 text-gray-700' },
    { valor: 'Sin movimiento',  label: 'Sin movimiento',  color: 'bg-red-100 text-red-700' },
    { valor: 'Rotación lenta',  label: 'Rotación lenta',  color: 'bg-orange-100 text-orange-700' },
    { valor: 'Rotación normal', label: 'Rotación normal', color: 'bg-green-100 text-green-700' },
    { valor: 'Nuevo',           label: 'Nuevo',           color: 'bg-blue-100 text-blue-700' },
    { valor: 'Agotado',         label: 'Agotado',         color: 'bg-gray-100 text-gray-500' },
  ];

  // ── Exportar a Excel ──────────────────────────────────────────
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const estados = [
      'Sin movimiento',
      'Rotación lenta',
      'Rotación normal',
      'Nuevo',
      'Agotado'
    ];

    const generarFilas = (estadoFiltro) => {
      const filas = [];

      rotacionFiltrada.forEach(producto => {
        const variantesFiltradas = estadoFiltro === 'Todos'
          ? producto.variantes
          : producto.variantes.filter(v => v.estado_rotacion === estadoFiltro);

        variantesFiltradas.forEach(v => {
          filas.push({
            'Producto': producto.nombre,
            'Referencia': producto.referencia,
            'Categoría': producto.categoria,
            'Talla': v.talla,
            'Stock actual': v.stock_actual,
            'Fecha ingreso': formatearFechaRotacion(v.fecha_ingreso_variante),
            '1ª Venta': formatearFechaRotacion(v.fecha_primera_venta),
            'Última venta': formatearFechaRotacion(v.fecha_ultima_venta),
            'Días en inventario': v.dias_en_inventario ?? '',
            'Días hasta 1ª venta': v.dias_hasta_primera_venta ?? '',
            'Días desde última': v.dias_desde_ultima_venta ?? '',
            'Total vendidas': v.total_unidades_vendidas,
            'Nº ventas': v.numero_ventas,
            'Estado': v.estado_rotacion,
            'Precio venta base': producto.precio_venta_base,
            'Costo base': producto.costo_base,
          });
        });
      });

      return filas;
    };

    // 🟣 Hoja general (Todos)
    const filasTodos = generarFilas('Todos');
    const wsTodos = XLSX.utils.json_to_sheet(filasTodos);
    XLSX.utils.book_append_sheet(wb, wsTodos, 'Todos');

    // 🟢 Crear una hoja por cada estado
    estados.forEach(estado => {
      const filas = generarFilas(estado);

      if (filas.length > 0) {
        const ws = XLSX.utils.json_to_sheet(filas);

        ws['!cols'] = [
          { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 8 },
          { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
          { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 13 },
          { wch: 9 },  { wch: 18 }, { wch: 14 }, { wch: 11 },
        ];

        // Excel no permite nombres muy largos
        const nombreHoja = estado.replace('Rotación ', 'Rot. ');
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
      }
    });

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `rotacion_inventario_${fecha}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={cerrarPanelRotacion}
      />

      {/* Panel deslizante desde la derecha */}
      <div
        className="relative ml-auto w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{
          transform: `translateX(${dragOffsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          opacity: isDragging ? Math.max(0.5, 1 - dragOffsetX / 500) : 1,
          cursor: isDragging ? 'grabbing' : 'auto',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >

        {/* ── Header (zona de arrastre) ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b bg-white"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rotación de Inventario</h2>
              <p className="text-xs text-gray-500">Seguimiento de entrada y salida por talla</p>
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            onMouseDown={e => e.stopPropagation()} // evitar que los botones activen el drag
          >
            {/* Botón Exportar Excel */}
            <button
              onClick={exportarExcel}
              disabled={cargandoRotacion || rotacionFiltrada.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition disabled:opacity-40"
              title="Exportar a Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </button>

            {/* Botón Refrescar */}
            <button
              onClick={cargarRotacion}
              disabled={cargandoRotacion}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              title="Actualizar datos"
            >
              <svg className={`w-4 h-4 ${cargandoRotacion ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={cerrarPanelRotacion}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Resumen de estadísticas ── */}
        {!cargandoRotacion && !errorRotacion && (
          <div className="px-6 py-3 bg-gray-50 border-b grid grid-cols-5 gap-3">
            <ResumenCard valor={resumenRotacion.sinMovimiento}  label="Sin movimiento"  color="text-red-600"    bgColor="bg-red-50" />
            <ResumenCard valor={resumenRotacion.rotacionLenta}  label="Rotación lenta"  color="text-orange-600" bgColor="bg-orange-50" />
            <ResumenCard valor={resumenRotacion.rotacionNormal} label="Rotación normal" color="text-green-600"  bgColor="bg-green-50" />
            <ResumenCard valor={resumenRotacion.nuevos}         label="Nuevos"          color="text-blue-600"   bgColor="bg-blue-50" />
            <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-purple-600">
                {resumenRotacion.promedioDiasHastaPrimeraVenta != null
                  ? `${resumenRotacion.promedioDiasHastaPrimeraVenta}d`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 leading-tight">Días prom. a 1ª venta</p>
            </div>
          </div>
        )}

        {/* ── Filtros y búsqueda ── */}
        <div className="px-6 py-3 border-b bg-white flex flex-col gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto o referencia..."
              value={searchRotacion}
              onChange={e => setSearchRotacion(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {estadosFiltro.map(({ valor, label, color }) => (
              <button
                key={valor}
                onClick={() => setFiltroEstadoRotacion(valor)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition border
                  ${filtroEstadoRotacion === valor
                    ? `${color} border-current ring-2 ring-offset-1 ring-current`
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenido principal ── */}
        <div className="flex-1 overflow-y-auto">
          {cargandoRotacion ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm">Cargando rotación...</p>
            </div>
          ) : errorRotacion ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{errorRotacion}</p>
              <button
                onClick={cargarRotacion}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"
              >
                Reintentar
              </button>
            </div>
          ) : rotacionFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium">No hay productos con ese filtro</p>
            </div>
          ) : (
            <div className="divide-y">
              {rotacionFiltrada.map(producto => (
                <ProductoRotacionRow
                  key={producto.producto_id}
                  producto={producto}
                  filtroEstado={filtroEstadoRotacion}
                  expandido={productoRotacionExpandido === producto.producto_id}
                  onToggle={() =>
                    setProductoRotacionExpandido(
                      productoRotacionExpandido === producto.producto_id ? null : producto.producto_id
                    )
                  }
                  historialVariante={historialVariante}
                  cargandoHistorial={cargandoHistorial}
                  onVerHistorial={cargarHistorialVariante}
                  onCerrarHistorial={() => setHistorialVariante(null)}
                  getColorEstadoRotacion={getColorEstadoRotacion}
                  formatearFechaRotacion={formatearFechaRotacion}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ── Sub-componente: tarjeta de resumen ──────────────────────────
const ResumenCard = ({ valor, label, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg px-3 py-2 text-center`}>
    <p className={`text-lg font-bold ${color}`}>{valor}</p>
    <p className="text-xs text-gray-500 leading-tight">{label}</p>
  </div>
);


// ── Sub-componente: fila de producto con variantes ──────────────
const ProductoRotacionRow = ({
  producto,
  filtroEstado,
  expandido,
  onToggle,
  historialVariante,
  cargandoHistorial,
  onVerHistorial,
  onCerrarHistorial,
  getColorEstadoRotacion,
  formatearFechaRotacion
}) => {
  const variantesMostradas = filtroEstado === 'Todos'
    ? producto.variantes
    : producto.variantes.filter(v => v.estado_rotacion === filtroEstado);

  if (variantesMostradas.length === 0) return null;

  const estadoCritico =
    producto.variantes.some(v => v.estado_rotacion === 'Sin movimiento')  ? 'Sin movimiento'  :
    producto.variantes.some(v => v.estado_rotacion === 'Rotación lenta')  ? 'Rotación lenta'  :
    producto.variantes.some(v => v.estado_rotacion === 'Rotación normal') ? 'Rotación normal' :
    producto.variantes.some(v => v.estado_rotacion === 'Nuevo')           ? 'Nuevo'           :
    'Agotado';

  const totalUnidades = producto.variantes.reduce((s, v) => s + (v.stock_actual || 0), 0);
  const totalVendidas = producto.variantes.reduce((s, v) => s + (v.total_unidades_vendidas || 0), 0);

  return (
    <div className="bg-white">
      {/* Cabecera del producto */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{producto.nombre}</span>
            <span className="text-xs text-gray-400 font-mono">{producto.referencia}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{producto.categoria}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>Ingresó: {formatearFechaRotacion(producto.fecha_ingreso_producto)}</span>
            <span>•</span>
            <span>{totalUnidades} en stock</span>
            <span>•</span>
            <span>{totalVendidas} vendidas</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getColorEstadoRotacion(estadoCritico)}`}>
            {estadoCritico}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Detalle de variantes (expandido) */}
      {expandido && (
        <div className="px-6 pb-4 bg-gray-50">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2 font-medium">Talla</th>
                <th className="text-center py-2 font-medium">Stock</th>
                <th className="text-center py-2 font-medium">Ingresó</th>
                <th className="text-center py-2 font-medium">1ª Venta</th>
                <th className="text-center py-2 font-medium">Última venta</th>
                <th className="text-center py-2 font-medium">Días inv.</th>
                <th className="text-center py-2 font-medium">Días 1ª venta</th>
                <th className="text-center py-2 font-medium">Total vendidas</th>
                <th className="text-center py-2 font-medium">Estado</th>
                <th className="text-center py-2 font-medium">Historial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variantesMostradas.map(variante => (
                <tr key={variante.variante_id} className="hover:bg-white transition">
                  <td className="py-2 font-semibold text-gray-800">{variante.talla}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium
                      ${variante.stock_actual === 0
                        ? 'bg-red-100 text-red-600'
                        : variante.stock_actual <= 2
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                      }`}>
                      {variante.stock_actual}
                    </span>
                  </td>
                  <td className="py-2 text-center text-gray-600">
                    {formatearFechaRotacion(variante.fecha_ingreso_variante)}
                  </td>
                  <td className="py-2 text-center text-gray-600">
                    {formatearFechaRotacion(variante.fecha_primera_venta)}
                  </td>
                  <td className="py-2 text-center text-gray-600">
                    {formatearFechaRotacion(variante.fecha_ultima_venta)}
                  </td>
                  <td className="py-2 text-center">
                    <DiasBadge dias={variante.dias_en_inventario} umbralAlerta={60} />
                  </td>
                  <td className="py-2 text-center">
                    {variante.dias_hasta_primera_venta != null
                      ? <DiasBadge dias={variante.dias_hasta_primera_venta} umbralAlerta={30} />
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="py-2 text-center text-gray-700 font-medium">
                    {variante.total_unidades_vendidas}
                  </td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getColorEstadoRotacion(variante.estado_rotacion)}`}>
                      {variante.estado_rotacion}
                    </span>
                    {variante.stock_actual === 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Agotado
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {variante.numero_ventas > 0 ? (
                      <button
                        onClick={() => {
                          if (historialVariante?.varianteId === variante.variante_id) {
                            onCerrarHistorial();
                          } else {
                            onVerHistorial(variante.variante_id, variante.talla, producto.nombre);
                          }
                        }}
                        className="text-purple-600 hover:text-purple-800 underline text-xs"
                      >
                        {variante.numero_ventas} venta{variante.numero_ventas !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin ventas</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Historial inline de la variante seleccionada */}
          {historialVariante &&
           variantesMostradas.some(v => v.variante_id === historialVariante.varianteId) && (
            <div className="mt-4 bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  Historial de ventas — {historialVariante.nombreProducto} talla {historialVariante.talla}
                </h4>
                <button onClick={onCerrarHistorial} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {cargandoHistorial ? (
                <p className="text-xs text-gray-400 text-center py-4">Cargando...</p>
              ) : historialVariante.datos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No hay registros</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left py-1 font-medium">Fecha</th>
                      <th className="text-center py-1 font-medium">Venta #</th>
                      <th className="text-center py-1 font-medium">Cliente</th>
                      <th className="text-center py-1 font-medium">Cantidad</th>
                      <th className="text-right py-1 font-medium">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historialVariante.datos.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="py-1.5 text-gray-600">
                          {new Date(h.fecha_venta).toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="py-1.5 text-center text-purple-600 font-mono">{h.numero_venta}</td>
                        <td className="py-1.5 text-center text-gray-600">{h.cliente_nombre || 'Cliente General'}</td>
                        <td className="py-1.5 text-center font-semibold">{h.cantidad_vendida}</td>
                        <td className="py-1.5 text-right text-gray-700">
                          ${h.precio_venta?.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ── Sub-componente: badge de días con color ─────────────────────
const DiasBadge = ({ dias, umbralAlerta }) => {
  if (dias == null) return <span className="text-gray-400">—</span>;
  const color =
    dias >= umbralAlerta * 2 ? 'text-red-600 font-semibold' :
    dias >= umbralAlerta     ? 'text-orange-500 font-medium' :
                               'text-gray-600';
  return <span className={color}>{dias}d</span>;
};


export default PanelRotacion;