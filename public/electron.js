const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const url = require('url');

// Importar funciones de base de datos
const {
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario
} = require('./database/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Dalú',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Deshabilitar para desarrollo
    }
  });

  // CORREGIDO: Cargar la app correctamente
  if (isDev) {
    // Desarrollo: cargar desde localhost
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
    console.log('🚀 Modo DESARROLLO');
  } else {
    // Producción: cargar con protocolo file
    const startUrl = url.format({
      pathname: path.join(__dirname, '..', 'build', 'index.html'),
      protocol: 'file:',
      slashes: true
    });

    mainWindow.loadURL(startUrl);

    // Abrir DevTools temporalmente para debuggear
    mainWindow.webContents.openDevTools();

    console.log('🚀 Modo PRODUCCIÓN');
    console.log('📂 Cargando desde:', startUrl);
    console.log('📂 __dirname:', __dirname);
    console.log('📂 build path:', path.join(__dirname, '..', 'build'));
  }

  // Verificar que los archivos existan
  const fs = require('fs');
  const buildPath = path.join(__dirname, '..', 'build');
  const indexPath = path.join(buildPath, 'index.html');

  console.log('📁 ¿Existe build?', fs.existsSync(buildPath));
  console.log('📁 ¿Existe index.html?', fs.existsSync(indexPath));

  if (fs.existsSync(buildPath)) {
    console.log('📁 Archivos en build:', fs.readdirSync(buildPath));
  }

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Error al cargar:', errorCode, errorDescription);
    console.error('❌ URL que falló:', validatedURL);
  });

  // Cuando la página carga
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página cargada exitosamente');
  });

  // Interceptar solicitudes de consola
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message}`);
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

// ==================== IPC HANDLERS ====================

// Obtener todos los productos
ipcMain.handle('obtener-productos', async () => {
  return new Promise((resolve, reject) => {
    obtenerProductos((err, productos) => {
      if (err) {
        console.error('❌ Error al obtener productos:', err);
        reject(err);
      } else {
        console.log('✅ Productos obtenidos:', productos.length);
        resolve(productos);
      }
    });
  });
});

// Obtener productos por categoría
ipcMain.handle('obtener-productos-categoria', async (event, categoria) => {
  return new Promise((resolve, reject) => {
    obtenerProductosPorCategoria(categoria, (err, productos) => {
      if (err) reject(err);
      else resolve(productos);
    });
  });
});

// Buscar productos
ipcMain.handle('buscar-productos', async (event, termino) => {
  return new Promise((resolve, reject) => {
    buscarProductos(termino, (err, productos) => {
      if (err) reject(err);
      else resolve(productos);
    });
  });
});

// Agregar producto
ipcMain.handle('agregar-producto', async (event, datos) => {
  return new Promise((resolve, reject) => {
    agregarProducto(datos, (err, producto) => {
      if (err) {
        console.error('❌ Error al agregar producto:', err);
        reject(err);
      } else {
        console.log('✅ Producto agregado:', producto);
        resolve(producto);
      }
    });
  });
});

// Actualizar producto
ipcMain.handle('actualizar-producto', async (event, id, datos) => {
  return new Promise((resolve, reject) => {
    actualizarProducto(id, datos, (err, producto) => {
      if (err) {
        console.error('❌ Error al actualizar producto:', err);
        reject(err);
      } else {
        console.log('✅ Producto actualizado:', producto);
        resolve(producto);
      }
    });
  });
});

// Eliminar producto
ipcMain.handle('eliminar-producto', async (event, id) => {
  return new Promise((resolve, reject) => {
    eliminarProducto(id, (err, result) => {
      if (err) {
        console.error('❌ Error al eliminar producto:', err);
        reject(err);
      } else {
        console.log('✅ Producto eliminado:', result);
        resolve(result);
      }
    });
  });
});

// Obtener estadísticas
ipcMain.handle('obtener-estadisticas', async () => {
  return new Promise((resolve, reject) => {
    obtenerEstadisticasInventario((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// ==================== APP LIFECYCLE ====================

app.on('ready', () => {
  console.log('✅ App iniciada');
  console.log('📂 userData:', app.getPath('userData'));
  console.log('📂 appPath:', app.getAppPath());
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});