import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, AlertCircle, CheckCircle, Clock, HardDrive } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const GestionBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarBackups();
  }, []);

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

  const restaurarBackup = async (fileName) => {
    if (!window.confirm('¿Estás seguro de restaurar este backup? La base de datos actual será reemplazada.')) {
      return;
    }

    try {
      setLoading(true);
      setMensaje({ tipo: 'info', texto: 'Restaurando backup...' });

      const resultado = await ipcRenderer.invoke('restaurar-backup', fileName);

      if (resultado.success) {
        setMensaje({ tipo: 'success', texto: 'Backup restaurado. La aplicación se reiniciará.' });
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
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Historial de Backups</h3>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500">Cargando backups...</div>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center">
            <Cloud size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hay backups disponibles</p>
            <p className="text-gray-400 text-sm mt-2">Crea tu primer backup usando el botón de arriba</p>
          </div>
        ) : (
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
                {backups.map((backup, index) => (
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
                          onClick={() => restaurarBackup(backup.fileName)}
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
        )}
      </div>
    </div>
  );
};

export default GestionBackups;