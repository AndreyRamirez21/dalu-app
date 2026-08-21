import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, AlertCircle, CheckCircle, Clock, HardDrive, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const BRAND = '#82bbbd';

/* ─── Info card con figurita ─────────────────────────────────── */
const InfoCard = ({ icon: Icon, accentColor, title, sub, children }) => (
  <div
    className="bg-white rounded-xl p-6"
    style={{ borderTop: `2px solid ${accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}1A` }}>
        <Icon size={22} style={{ color: accentColor }} />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);

/* ─── Botones ────────────────────────────────────────────────── */
const BtnSolid = ({ onClick, disabled, icon: Icon, color = BRAND, children, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{ backgroundColor: color }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.88'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const BtnOutline = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-6 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
  >
    {children}
  </button>
);

/* ─── Chip de filtro ─────────────────────────────────────────── */
const Chip = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border"
    style={active
      ? { backgroundColor: `${BRAND}1A`, borderColor: BRAND, color: BRAND }
      : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
    }
  >
    {Icon && <Icon size={14} />}
    {children}
  </button>
);

const MENSAJE_STYLE = {
  success: { color: '#059669', bg: '#f0fdf4', border: '#86efac', Icon: CheckCircle },
  error:   { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: AlertCircle },
  info:    { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', Icon: Clock },
};

const Modal = ({ isOpen, onClose, onConfirm, titulo, mensaje, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#fffbeb' }}>
              <AlertCircle style={{ color: '#d97706' }} size={20} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{mensaje}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <BtnOutline onClick={onClose} disabled={loading}>Cancelar</BtnOutline>
          <BtnSolid onClick={onConfirm} disabled={loading}>
            {loading ? 'Restaurando…' : 'Confirmar Restauración'}
          </BtnSolid>
        </div>
      </div>
    </div>
  );
};

const GestionBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [modalRestaurar, setModalRestaurar] = useState({
    isOpen: false,
    backupSeleccionado: null
  });
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const backupsPorPagina = 20;

  useEffect(() => {
    cargarBackups();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroFecha, fechaInicio, fechaFin]);

  const cargarBackups = async () => {
    try {
      setLoading(true);
      const resultado = await ipcRenderer.invoke('listar-backups');

      if (resultado.success) {
        setBackups(resultado.backups);
      }
    } catch (error) {
      console.error('Error al cargar backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearBackup = async () => {
    try {
      setLoading(true);
      setMensaje({ tipo: 'info', texto: 'Creando backup...' });

      const resultado = await ipcRenderer.invoke('crear-backup');

      if (resultado.success) {
        setMensaje({ tipo: 'success', texto: 'Backup creado exitosamente' });
        cargarBackups();
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al crear backup' });
    } finally {
      setLoading(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const abrirModalRestaurar = (backup) => {
    setModalRestaurar({
      isOpen: true,
      backupSeleccionado: backup
    });
  };

  const cerrarModalRestaurar = () => {
    if (!loading) {
      setModalRestaurar({
        isOpen: false,
        backupSeleccionado: null
      });
    }
  };

  const confirmarRestauracion = async () => {
    const { backupSeleccionado } = modalRestaurar;
    if (!backupSeleccionado) return;

    try {
      setLoading(true);
      setMensaje({ tipo: 'info', texto: 'Restaurando backup...' });

      const resultado = await ipcRenderer.invoke('restaurar-backup', backupSeleccionado.fileName);

      if (resultado.success) {
        setMensaje({ tipo: 'success', texto: 'Backup restaurado. La aplicación se reiniciará.' });
        cerrarModalRestaurar();
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al restaurar backup' });
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filtrarBackups = () => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    return backups.filter(backup => {
      const fechaBackup = new Date(backup.lastModified);

      if (filtroFecha === 'personalizado') {
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          return fechaBackup >= inicio && fechaBackup <= fin;
        }
        return true;
      }

      switch(filtroFecha) {
        case 'hoy':
          return fechaBackup >= hoy;
        case 'semana':
          return fechaBackup >= hace7Dias;
        case 'mes':
          return fechaBackup >= hace30Dias;
        default:
          return true;
      }
    });
  };

  const backupsFiltrados = filtrarBackups();

  const totalPaginas = Math.ceil(backupsFiltrados.length / backupsPorPagina);
  const indiceInicio = (paginaActual - 1) * backupsPorPagina;
  const indiceFin = indiceInicio + backupsPorPagina;
  const backupsPaginados = backupsFiltrados.slice(indiceInicio, indiceFin);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const cambiarFiltro = (nuevoFiltro) => {
    setFiltroFecha(nuevoFiltro);
    if (nuevoFiltro !== 'personalizado') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Backups</h1>
        <p className="text-sm text-gray-400 mt-1">Copia de seguridad automática en la nube</p>
      </div>

      {/* Mensaje */}
      {mensaje && (() => {
        const s = MENSAJE_STYLE[mensaje.tipo] ?? MENSAJE_STYLE.info;
        const MsgIcon = s.Icon;
        return (
          <div
            className="mb-6 px-4 py-3.5 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
          >
            <MsgIcon size={18} style={{ color: s.color }} />
            <span className="text-sm font-medium" style={{ color: s.color }}>{mensaje.texto}</span>
          </div>
        );
      })()}

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoCard icon={Cloud} accentColor={BRAND} title="Backup Automático" sub="Cada 24 horas">
          <p className="text-xs text-gray-500 leading-relaxed">
            Los backups se crean automáticamente y se guardan en la nube de forma segura.
          </p>
        </InfoCard>

        <InfoCard icon={Upload} accentColor="#6366f1" title="Crear Backup Manual" sub="Bajo demanda">
          <BtnSolid onClick={crearBackup} disabled={loading} color="#6366f1" className="w-full mt-1">
            {loading ? 'Creando…' : 'Crear Backup Ahora'}
          </BtnSolid>
        </InfoCard>

        <InfoCard icon={HardDrive} accentColor="#d97706" title="Backups Disponibles" sub={`${backups.length} copias`}>
          <p className="text-xs text-gray-500 leading-relaxed">
            Puedes restaurar cualquier backup anterior desde la lista.
          </p>
        </InfoCard>
      </div>

      {/* Lista de Backups */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}
      >
        <div className="p-6 border-b border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Historial de Backups</h3>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 mr-1">Filtrar:</span>
            <Chip active={filtroFecha === 'todos'} onClick={() => cambiarFiltro('todos')}>Todos</Chip>
            <Chip active={filtroFecha === 'hoy'} onClick={() => cambiarFiltro('hoy')}>Hoy</Chip>
            <Chip active={filtroFecha === 'semana'} onClick={() => cambiarFiltro('semana')}>Última semana</Chip>
            <Chip active={filtroFecha === 'mes'} onClick={() => cambiarFiltro('mes')}>Último mes</Chip>
            <Chip active={filtroFecha === 'personalizado'} onClick={() => cambiarFiltro('personalizado')} icon={Calendar}>
              Rango personalizado
            </Chip>
          </div>

          {/* Selector de fechas personalizado */}
          {filtroFecha === 'personalizado' && (
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: `${BRAND}0D`, border: `1px solid ${BRAND}33` }}>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ '--tw-ring-color': BRAND }}
                />
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Mostrando {backupsFiltrados.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, backupsFiltrados.length)} de {backupsFiltrados.length} backups
              {filtroFecha !== 'todos' && ` (${backups.length} en total)`}
            </span>
            {totalPaginas > 1 && (
              <span>Página {paginaActual} de {totalPaginas}</span>
            )}
          </div>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-14 text-center text-sm text-gray-400">Cargando backups…</div>
        ) : backupsFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <Cloud size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 font-medium">
              {backups.length === 0 ? 'No hay backups disponibles' : 'No hay backups en este período'}
            </p>
            <p className="text-gray-400 text-xs mt-1.5">
              {backups.length === 0
                ? 'Crea tu primer backup usando el botón de arriba'
                : 'Intenta con otro filtro de fecha'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Nombre</th>
                    <th className="px-6 py-3.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Tamaño</th>
                    <th className="px-6 py-3.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {backupsPaginados.map((backup, index) => (
                    <tr key={index} className="transition-colors hover:bg-gray-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-gray-300" />
                          <span className="text-sm text-gray-600">{formatearFecha(backup.lastModified)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-500">{backup.fileName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">{backup.sizeFormatted}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => abrirModalRestaurar(backup)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity disabled:opacity-50"
                            style={{ backgroundColor: BRAND }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                          >
                            <Download size={14} />
                            Restaurar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <ChevronLeft size={17} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {[...Array(totalPaginas)].map((_, i) => {
                    const pagina = i + 1;
                    if (
                      pagina === 1 ||
                      pagina === totalPaginas ||
                      (pagina >= paginaActual - 2 && pagina <= paginaActual + 2)
                    ) {
                      const active = paginaActual === pagina;
                      return (
                        <button
                          key={pagina}
                          onClick={() => cambiarPagina(pagina)}
                          className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={active
                            ? { backgroundColor: BRAND, color: '#fff' }
                            : { backgroundColor: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' }
                          }
                        >
                          {pagina}
                        </button>
                      );
                    } else if (
                      pagina === paginaActual - 3 ||
                      pagina === paginaActual + 3
                    ) {
                      return <span key={pagina} className="text-gray-300 px-1">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={modalRestaurar.isOpen}
        onClose={cerrarModalRestaurar}
        onConfirm={confirmarRestauracion}
        titulo="Confirmar Restauración"
        mensaje={`¿Estás seguro de restaurar este backup? La base de datos actual será reemplazada completamente y no podrás deshacer esta acción.${
          modalRestaurar.backupSeleccionado
            ? `\n\nBackup: ${modalRestaurar.backupSeleccionado.fileName}`
            : ''
        }`}
        loading={loading}
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GestionBackups;
