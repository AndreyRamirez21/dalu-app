const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const url = require('url');


// Registrar protocolo personalizado para cargar imágenes locales
app.whenReady().then(() => {
  protocol.registerFileProtocol('dalu-file', (request, callback) => {
    const url = request.url.replace('dalu-file://', '');
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error('Error al cargar imagen:', error);
    }
  });
});


// Importar funciones de base de datos
const {
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario,
  actualizarStockVariante
} = require('./database/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Dalú',
    icon: path.join(__dirname, 'electron', 'Dalu-desktop.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
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
    mainWindow.webContents.openDevTools();

    console.log('🚀 Modo PRODUCCIÓN');
    console.log('📂 Cargando desde:', startUrl);
    console.log('📂 __dirname:', __dirname);
    console.log('📂 build path:', path.join(__dirname, '..', 'build'));
  }

  // Verificar que los archivos existan
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

// Función para obtener/crear carpeta de imágenes
function getCarpetaImagenes() {
  const carpeta = path.join(app.getPath('userData'), 'productos-imagenes');

  // Crear carpeta si no existe
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }

  return carpeta;
}

// Función para guardar imagen desde base64
function guardarImagen(referencia, imagenData) {
  try {
    const carpeta = getCarpetaImagenes();

    // Extraer extensión del nombre o usar .jpg por defecto
    const matches = imagenData.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const extension = matches ? matches[0] : '.jpg';

    // Nombre único: referencia + timestamp
    const nombreArchivo = `${referencia}-${Date.now()}${extension}`;
    const rutaCompleta = path.join(carpeta, nombreArchivo);

    // Convertir base64 a buffer y guardar
    const base64Data = imagenData.data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(rutaCompleta, buffer);

    return rutaCompleta;
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    return null;
  }
}

// Función para eliminar imagen
function eliminarImagen(rutaImagen) {
  try {
    if (rutaImagen && fs.existsSync(rutaImagen)) {
      fs.unlinkSync(rutaImagen);
    }
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
  }
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
ipcMain.handle('agregar-producto', async (event, producto) => {
  return new Promise((resolve, reject) => {
    // Guardar imagen si existe
    let rutaImagen = null;
    if (producto.imagen) {
      rutaImagen = guardarImagen(producto.referencia, producto.imagen);
    }

    // Preparar datos con la ruta de imagen
    const datosProducto = {
      referencia: producto.referencia,
      nombre: producto.nombre,
      categoria: producto.categoria,
      costo_base: producto.costo_base,
      precio_venta_base: producto.precio_venta_base,
      variantes: producto.variantes || []
    };

    // Usar la función de db.js
    agregarProducto(datosProducto, (err, resultado) => {
      if (err) {
        // Si falla, eliminar imagen guardada
        if (rutaImagen) eliminarImagen(rutaImagen);
        console.error('❌ Error al agregar producto:', err);
        reject(err);
        return;
      }

      // Si el producto se guardó exitosamente, actualizar la imagen en la BD
      if (rutaImagen) {
        const { db } = require('./database/db');
        db.run(
          'UPDATE productos SET imagen = ? WHERE id = ?',
          [rutaImagen, resultado.id],
          (errImg) => {
            if (errImg) {
              console.error('⚠️ Producto guardado pero error al actualizar imagen:', errImg);
            }
          }
        );
      }

      console.log('✅ Producto agregado:', resultado);
      resolve({ success: true, id: resultado.id });
    });
  });
});

// Actualizar producto
ipcMain.handle('actualizar-producto', async (event, id, datosActualizados) => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database/db');

    // Obtener imagen anterior para eliminarla si se actualiza
    db.get(`SELECT imagen FROM productos WHERE id = ?`, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      const imagenAnterior = row ? row.imagen : null;
      let nuevaRutaImagen = imagenAnterior; // Mantener la anterior por defecto

      // Si hay nueva imagen, guardarla
      if (datosActualizados.imagen) {
        nuevaRutaImagen = guardarImagen(datosActualizados.referencia, datosActualizados.imagen);

        // Eliminar imagen anterior si existía
        if (imagenAnterior) {
          eliminarImagen(imagenAnterior);
        }
      }

      // Preparar datos para actualizar
      const datosParaActualizar = {
        referencia: datosActualizados.referencia,
        nombre: datosActualizados.nombre,
        categoria: datosActualizados.categoria,
        costo_base: datosActualizados.costo_base,
        precio_venta_base: datosActualizados.precio_venta_base,
        variantes: datosActualizados.variantes || []
      };

      // Usar la función de db.js
      actualizarProducto(id, datosParaActualizar, (err, resultado) => {
        if (err) {
          console.error('❌ Error al actualizar producto:', err);
          reject(err);
          return;
        }

        // Si el producto se actualizó exitosamente, actualizar la imagen en la BD
        if (nuevaRutaImagen) {
          db.run(
            'UPDATE productos SET imagen = ? WHERE id = ?',
            [nuevaRutaImagen, id],
            (errImg) => {
              if (errImg) {
                console.error('⚠️ Producto actualizado pero error al actualizar imagen:', errImg);
              }
            }
          );
        }

        console.log('✅ Producto actualizado:', resultado);
        resolve({ success: true });
      });
    });
  });
});


// Eliminar producto
ipcMain.handle('eliminar-producto', async (event, id) => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database/db');

    // Primero obtener la ruta de la imagen
    db.get(`SELECT imagen FROM productos WHERE id = ?`, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      const rutaImagen = row ? row.imagen : null;

      // Usar la función de db.js para eliminar (CASCADE se encarga de las variantes)
      eliminarProducto(id, (err, resultado) => {
        if (err) {
          console.error('❌ Error al eliminar producto:', err);
          reject(err);
          return;
        }

        // Eliminar imagen física si existe
        if (rutaImagen) {
          eliminarImagen(rutaImagen);
        }

        console.log('✅ Producto eliminado:', resultado);
        resolve({ success: true });
      });
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

// Actualizar stock de variante
ipcMain.handle('actualizar-stock-variante', async (event, varianteId, nuevaCantidad) => {
  return new Promise((resolve, reject) => {
    actualizarStockVariante(varianteId, nuevaCantidad, (err, result) => {
      if (err) {
        console.error('❌ Error al actualizar stock de variante:', err);
        reject(err);
      } else {
        console.log('✅ Stock de variante actualizado:', result);
        resolve(result);
      }
    });
  });
});


ipcMain.handle('cargar-imagen', async (event, rutaImagen) => {
  console.log('🖼️ Intentando cargar imagen:', rutaImagen);

  try {
    if (!rutaImagen || !fs.existsSync(rutaImagen)) {
      console.log('❌ Imagen no existe:', rutaImagen);
      return null;
    }

    const imagen = fs.readFileSync(rutaImagen);
    const base64 = imagen.toString('base64');

    const extension = path.extname(rutaImagen).toLowerCase();
    let mimeType = 'image/jpeg';

    if (extension === '.png') mimeType = 'image/png';
    else if (extension === '.gif') mimeType = 'image/gif';
    else if (extension === '.webp') mimeType = 'image/webp';

    console.log('✅ Imagen cargada exitosamente. Extensión:', extension, 'MIME:', mimeType);

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('❌ Error al cargar imagen:', error);
    return null;
  }
});

ipcMain.handle('obtener-url-imagen', async (event, rutaImagen) => {
  try {
    if (!rutaImagen || !fs.existsSync(rutaImagen)) {
      return null;
    }

    return `dalu-file://${rutaImagen}`;
  } catch (error) {
    console.error('Error al obtener URL de imagen:', error);
    return null;
  }
});

// ==================== IPC HANDLERS PARA GASTOS ====================
// Agregar estos handlers en tu archivo main.js

const {
  agregarGasto,
  obtenerGastos,
  obtenerGastosPorCategoria,
  obtenerGastosPorFecha,
  buscarGastos,
  actualizarGasto,
  eliminarGasto,
  obtenerEstadisticasGastos,
  obtenerTotalGastos,
  obtenerGastosMesActual
} = require('./database/db');

// Obtener todos los gastos
ipcMain.handle('obtener-gastos', async () => {
  return new Promise((resolve, reject) => {
    obtenerGastos((err, gastos) => {
      if (err) {
        console.error('❌ Error al obtener gastos:', err);
        reject(err);
      } else {
        console.log('✅ Gastos obtenidos:', gastos.length);
        resolve(gastos);
      }
    });
  });
});

// Agregar gasto
ipcMain.handle('agregar-gasto', async (event, gasto) => {
  return new Promise((resolve, reject) => {
    agregarGasto(gasto, (err, resultado) => {
      if (err) {
        console.error('❌ Error al agregar gasto:', err);
        reject(err);
      } else {
        console.log('✅ Gasto agregado:', resultado);
        resolve({ success: true, ...resultado });
      }
    });
  });
});

// Actualizar gasto
ipcMain.handle('actualizar-gasto', async (event, id, datos) => {
  return new Promise((resolve, reject) => {
    actualizarGasto(id, datos, (err, resultado) => {
      if (err) {
        console.error('❌ Error al actualizar gasto:', err);
        reject(err);
      } else {
        console.log('✅ Gasto actualizado:', resultado);
        resolve({ success: true });
      }
    });
  });
});

// Eliminar gasto
ipcMain.handle('eliminar-gasto', async (event, id) => {
  return new Promise((resolve, reject) => {
    eliminarGasto(id, (err, resultado) => {
      if (err) {
        console.error('❌ Error al eliminar gasto:', err);
        reject(err);
      } else {
        console.log('✅ Gasto eliminado:', resultado);
        resolve({ success: true });
      }
    });
  });
});

// Buscar gastos
ipcMain.handle('buscar-gastos', async (event, termino) => {
  return new Promise((resolve, reject) => {
    buscarGastos(termino, (err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});

// Obtener gastos por categoría
ipcMain.handle('obtener-gastos-categoria', async (event, categoria) => {
  return new Promise((resolve, reject) => {
    obtenerGastosPorCategoria(categoria, (err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});

// Obtener estadísticas de gastos
ipcMain.handle('obtener-estadisticas-gastos', async () => {
  return new Promise((resolve, reject) => {
    obtenerEstadisticasGastos((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener total de gastos
ipcMain.handle('obtener-total-gastos', async () => {
  return new Promise((resolve, reject) => {
    obtenerTotalGastos((err, totales) => {
      if (err) reject(err);
      else resolve(totales);
    });
  });
});

// Obtener gastos del mes actual
ipcMain.handle('obtener-gastos-mes', async () => {
  return new Promise((resolve, reject) => {
    obtenerGastosMesActual((err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});



const { Notification } = require('electron');
const {
  agregarDeuda,
  obtenerDeudas,
  obtenerDeudasPendientes,
  obtenerDeudaPorId,
  registrarPagoDeuda,
  actualizarDeuda,
  eliminarDeuda,
  buscarDeudas,
  obtenerEstadisticasDeudas,
  verificarRecordatoriosDeudas,
  debugverificarfechas,
  obtenerHistorialPagos
} = require('./database/db');

// Obtener todas las deudas
ipcMain.handle('obtener-deudas', async () => {
  return new Promise((resolve, reject) => {
    obtenerDeudas((err, deudas) => {
      if (err) {
        console.error('❌ Error al obtener deudas:', err);
        reject(err);
      } else {
        console.log('✅ Deudas obtenidas:', deudas.length);
        resolve(deudas);
      }
    });
  });
});

// Obtener deudas pendientes
ipcMain.handle('obtener-deudas-pendientes', async () => {
  return new Promise((resolve, reject) => {
    obtenerDeudasPendientes((err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener deuda por ID
ipcMain.handle('obtener-deuda-por-id', async (event, id) => {
  return new Promise((resolve, reject) => {
    obtenerDeudaPorId(id, (err, deuda) => {
      if (err) reject(err);
      else resolve(deuda);
    });
  });
});

// Agregar deuda
ipcMain.handle('agregar-deuda', async (event, deuda) => {
  return new Promise((resolve, reject) => {
    agregarDeuda(deuda, (err, resultado) => {
      if (err) {
        console.error('❌ Error al agregar deuda:', err);
        reject(err);
      } else {
        console.log('✅ Deuda agregada:', resultado);
        resolve({ success: true, ...resultado });
      }
    });
  });
});

// Registrar pago de deuda
ipcMain.handle('registrar-pago-deuda', async (event, deudaId, montoPago, metodoPago, notas) => {
  return new Promise((resolve, reject) => {
    registrarPagoDeuda(deudaId, montoPago, metodoPago, notas, (err, resultado) => {
      if (err) {
        console.error('❌ Error al registrar pago:', err);
        reject(err);
      } else {
        console.log('✅ Pago registrado:', resultado);
        resolve(resultado);
      }
    });
  });
});

// Actualizar deuda
ipcMain.handle('actualizar-deuda', async (event, id, datos) => {
  return new Promise((resolve, reject) => {
    actualizarDeuda(id, datos, (err, resultado) => {
      if (err) {
        console.error('❌ Error al actualizar deuda:', err);
        reject(err);
      } else {
        console.log('✅ Deuda actualizada:', resultado);
        resolve({ success: true });
      }
    });
  });
});

// Eliminar deuda
ipcMain.handle('eliminar-deuda', async (event, id) => {
  return new Promise((resolve, reject) => {
    eliminarDeuda(id, (err, resultado) => {
      if (err) {
        console.error('❌ Error al eliminar deuda:', err);
        reject(err);
      } else {
        console.log('✅ Deuda eliminada:', resultado);
        resolve({ success: true });
      }
    });
  });
});

// Buscar deudas
ipcMain.handle('buscar-deudas', async (event, termino) => {
  return new Promise((resolve, reject) => {
    buscarDeudas(termino, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener estadísticas
ipcMain.handle('obtener-estadisticas-deudas', async () => {
  return new Promise((resolve, reject) => {
    obtenerEstadisticasDeudas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener historial de pagos
ipcMain.handle('obtener-historial-pagos', async (event, deudaId) => {
  return new Promise((resolve, reject) => {
    obtenerHistorialPagos(deudaId, (err, pagos) => {
      if (err) reject(err);
      else resolve(pagos);
    });
  });
});






// ==================== SISTEMA DE RECORDATORIOS ====================

// Función para mostrar notificación de recordatorio
function mostrarRecordatorioDeuda(deuda) {
  const montoPendiente = deuda.monto_total - deuda.monto_pagado;

  const notification = new Notification({
    title: '💰 Recordatorio de Deuda - Dalú',
    body: `Deuda pendiente con ${deuda.acreedor}\nMonto: $${montoPendiente.toFixed(2)}`,
    icon: path.join(__dirname, 'assets', 'icon.png'), // Asegúrate de tener un icono
    urgency: 'normal'
  });

  notification.show();

  notification.on('click', () => {
    // Aquí puedes abrir la ventana en la sección de deudas
    if (mainWindow) {
      mainWindow.focus();
    }
  });
}

// Verificar recordatorios al iniciar la app
function verificarRecordatoriosAlIniciar() {
  verificarRecordatoriosDeudas((err, deudas) => {
    if (!err && deudas && deudas.length > 0) {
      console.log(`📢 ${deudas.length} recordatorios de deudas para hoy`);

      deudas.forEach(deuda => {
        mostrarRecordatorioDeuda(deuda);
      });
    }
  });
}

// Verificar recordatorios periódicamente (cada hora)
function configurarVerificacionPeriodica() {
  setInterval(() => {
    verificarRecordatoriosDeudas((err, deudas) => {
      if (!err && deudas && deudas.length > 0) {
        deudas.forEach(deuda => {
          mostrarRecordatorioDeuda(deuda);
        });
      }
    });
  }, 60 * 60 * 1000); // Cada 1 hora
}






// ==================== APP LIFECYCLE ====================

app.on('ready', () => {
  console.log('✅ App iniciada');
  console.log('📂 userData:', app.getPath('userData'));
  console.log('📂 appPath:', app.getAppPath());
  createWindow();
    setTimeout(() => {
      console.log('🔔 Inicializando sistema de notificaciones...');
      verificarRecordatoriosAlIniciar();
      configurarVerificacionPeriodica();
    }, 2000);
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
