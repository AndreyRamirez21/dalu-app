const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// Si no está en Electron (modo desarrollo web), usa datos de ejemplo
const usarDatosEjemplo = !ipcRenderer;

export const obtenerProductos = async () => {
  if (usarDatosEjemplo) {
    return [
      { id: 1, referencia: 'DLX-001', nombre: 'Pijama Nube', categoria: 'Deluxe', costo: 30, precio_venta: 65, talla: 'M', cantidad: 8 }
    ];
  }
  return await ipcRenderer.invoke('obtener-productos');
};

export const agregarProducto = async (datos) => {
  if (usarDatosEjemplo) return datos;
  return await ipcRenderer.invoke('agregar-producto', datos);
};

export const actualizarProducto = async (id, datos) => {
  if (usarDatosEjemplo) return datos;
  return await ipcRenderer.invoke('actualizar-producto', id, datos);
};

export const eliminarProducto = async (id) => {
  if (usarDatosEjemplo) return { deleted: 1 };
  return await ipcRenderer.invoke('eliminar-producto', id);
};

export const obtenerEstadisticas = async () => {
  if (usarDatosEjemplo) return { total: 5, stock_bajo: 2, agotados: 1 };
  return await ipcRenderer.invoke('obtener-estadisticas');
};