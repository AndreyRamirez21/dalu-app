import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, AlertCircle, CheckCircle, Clock, HardDrive, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const Modal = ({ isOpen, onClose, onConfirm, titulo, mensaje, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-gray-700 leading-relaxed">{mensaje}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Restaurando...' : 'Confirmar Restauración'}
          </button>
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
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Backups</h1>
        <p className="text-gray-500 mt-2">Copia de seguridad automática en la nube</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' :
          mensaje.tipo === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {mensaje.tipo === 'success' && <CheckCircle size={20} />}
          {mensaje.tipo === 'error' && <AlertCircle size={20} />}
          {mensaje.tipo === 'info' && <Clock size={20} />}
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Cloud className="text-teal-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Backup Automático</h3>
              <p className="text-sm text-gray-500">Cada 24 horas</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Los backups se crean automáticamente y se guardan en la nube de forma segura.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Crear Backup Manual</h3>
              <p className="text-sm text-gray-500">Bajo demanda</p>
            </div>
          </div>
          <button
            onClick={crearBackup}
            disabled={loading}
            className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Backup Ahora'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <HardDrive className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Backups Disponibles</h3>
              <p className="text-sm text-gray-500">{backups.length} copias</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Puedes restaurar cualquier backup anterior desde la lista.
          </p>
        </div>
      </div>

      {/* Lista de Backups */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Historial de Backups</h3>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Filtrar:</span>
            <button
              onClick={() => cambiarFiltro('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroFecha === 'todos'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => cambiarFiltro('hoy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroFecha === 'hoy'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => cambiarFiltro('semana')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroFecha === 'semana'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Última semana
            </button>
            <button
              onClick={() => cambiarFiltro('mes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroFecha === 'mes'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Último mes
            </button>
            <button
              onClick={() => cambiarFiltro('personalizado')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                filtroFecha === 'personalizado'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={16} />
              Rango personalizado
            </button>
          </div>

          {/* Selector de fechas personalizado */}
          {filtroFecha === 'personalizado' && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {backupsFiltrados.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, backupsFiltrados.length)} de {backupsFiltrados.length} backups
              {filtroFecha !== 'todos' && ` (${backups.length} en total)`}
            </span>
            {totalPaginas > 1 && (
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
            )}
          </div>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500">Cargando backups...</div>
          </div>
        ) : backupsFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Cloud size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {backups.length === 0 ? 'No hay backups disponibles' : 'No hay backups en este período'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {backups.length === 0
                ? 'Crea tu primer backup usando el botón de arriba'
                : 'Intenta con otro filtro de fecha'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tamaño</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backupsPaginados.map((backup, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{formatearFecha(backup.lastModified)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-600">{backup.fileName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-700">{backup.sizeFormatted}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => abrirModalRestaurar(backup)}
                            disabled={loading}
                            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm disabled:opacity-50"
                          >
                            <Download size={16} className="inline mr-1" />
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
              <div className="p-6 border-t flex items-center justify-between">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center space-x-2">
                  {[...Array(totalPaginas)].map((_, i) => {
                    const pagina = i + 1;
                    if (
                      pagina === 1 ||
                      pagina === totalPaginas ||
                      (pagina >= paginaActual - 2 && pagina <= paginaActual + 2)
                    ) {
                      return (
                        <button
                          key={pagina}
                          onClick={() => cambiarPagina(pagina)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            paginaActual === pagina
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pagina}
                        </button>
                      );
                    } else if (
                      pagina === paginaActual - 3 ||
                      pagina === paginaActual + 3
                    ) {
                      return <span key={pagina} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={20} />
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

      <style jsx>{`
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