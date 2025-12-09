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
  db,
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario,
  actualizarStockVariante
} = require('./database/db');

const BackupService = require('./database/backupService');

let mainWindow;
let backupService;


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

  // CORREGIDO: Inicialización del Backup Service
  const dbPath = path.join(app.getPath('userData'), 'dalu.db');
  backupService = new BackupService(dbPath);



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


// ==================== HANDLERS PARA CLIENTES (CORREGIDOS) ====================

// Buscar clientes por nombre, cédula o celular
ipcMain.handle('buscar-clientes', async (event, termino) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM clientes
      WHERE nombre LIKE ? OR cedula LIKE ? OR celular LIKE ?
      ORDER BY nombre ASC
      LIMIT 10
    `;
    const searchTerm = `%${termino}%`;

    db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
      if (err) {
        console.error('Error al buscar clientes:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Obtener cliente por ID
ipcMain.handle('obtener-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, row) => {
      if (err) {
        console.error('Error al obtener cliente:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
});

// Crear o actualizar cliente
ipcMain.handle('guardar-cliente', async (event, datosCliente) => {
  return new Promise((resolve, reject) => {
    const { id, nombre, cedula, correo, celular } = datosCliente;

    // Si tiene ID, actualizar
    if (id) {
      const query = `
        UPDATE clientes
        SET nombre = ?, cedula = ?, correo = ?, celular = ?
        WHERE id = ?
      `;

      db.run(query, [nombre, cedula, correo, celular, id], function (err) {
        if (err) {
          console.error('Error al actualizar cliente:', err);
          reject(err);
        } else {
          resolve({ id, success: true });
        }
      });
    } else {
      // Verificar si ya existe un cliente con esa cédula
      if (cedula) {
        db.get('SELECT id FROM clientes WHERE cedula = ?', [cedula], (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // Ya existe, devolver el ID existente
            resolve({ id: row.id, success: true, existente: true });
          } else {
            // Crear nuevo
            insertarNuevoCliente();
          }
        });
      } else {
        // No tiene cédula, crear directamente
        insertarNuevoCliente();
      }
    }

    function insertarNuevoCliente() {
      const query = `
        INSERT INTO clientes (nombre, cedula, correo, celular)
        VALUES (?, ?, ?, ?)
      `;

      db.run(query, [nombre, cedula, correo, celular], function (err) {
        if (err) {
          console.error('Error al crear cliente:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, success: true, nuevo: true });
        }
      });
    }
  });
});

// ✅ NUEVA: Revertir estadísticas cuando se cancela una venta
ipcMain.handle('revertir-estadisticas-cliente', async (event, clienteId, totalCompra) => {
  return new Promise((resolve, reject) => {
    // Primero obtenemos las estadísticas actuales
    db.get('SELECT numero_compras, total_compras FROM clientes WHERE id = ?', [clienteId], (err, cliente) => {
      if (err) {
        console.error('Error al obtener cliente:', err);
        reject(err);
        return;
      }

      if (!cliente) {
        resolve({ success: false, error: 'Cliente no encontrado' });
        return;
      }

      // Calcular los nuevos valores
      const nuevoNumeroCompras = Math.max(0, (cliente.numero_compras || 0) - 1);
      const nuevoTotalCompras = Math.max(0, (cliente.total_compras || 0) - totalCompra);

      // Actualizar el cliente
      const query = `
        UPDATE clientes
        SET numero_compras = ?,
            total_compras = ?
        WHERE id = ?
      `;

      db.run(query, [nuevoNumeroCompras, nuevoTotalCompras, clienteId], function (err) {
        if (err) {
          console.error('Error al revertir estadísticas del cliente:', err);
          reject(err);
        } else {
          console.log(`✅ Estadísticas revertidas para cliente ${clienteId}: -1 compra, -$${totalCompra}`);
          resolve({ success: true });
        }
      });
    });
  });
});

// Actualizar estadísticas de compra del cliente (cuando se crea una venta)
ipcMain.handle('actualizar-estadisticas-cliente', async (event, clienteId, totalCompra) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE clientes
      SET ultima_compra = datetime('now'),
          total_compras = total_compras + ?,
          numero_compras = numero_compras + 1
      WHERE id = ?
    `;

    db.run(query, [totalCompra, clienteId], function (err) {
      if (err) {
        console.error('Error al actualizar estadísticas del cliente:', err);
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Obtener todos los clientes con estadísticas de ventas
ipcMain.handle('obtener-clientes-con-estadisticas', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT
        c.id,
        c.nombre,
        c.cedula,
        c.correo,
        c.celular,
        COUNT(CASE WHEN v.estado = 'Pagado' THEN v.id END) as numero_compras,
        SUM(CASE WHEN v.estado = 'Pagado' THEN v.total ELSE 0 END) as total_compras,
        MAX(CASE WHEN v.estado = 'Pagado' THEN v.fecha END) as ultima_compra
      FROM clientes c
      LEFT JOIN ventas v ON c.id = v.cliente_id
      GROUP BY c.id
      ORDER BY numero_compras DESC, total_compras DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Error al obtener clientes:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Obtener todos los clientes (simple)
ipcMain.handle('obtener-clientes', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM clientes ORDER BY nombre ASC', [], (err, rows) => {
      if (err) {
        console.error('Error al obtener clientes:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Obtener estadísticas de un cliente específico
ipcMain.handle('obtener-estadisticas-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        c.*,
        COUNT(CASE WHEN v.estado = 'Pagado' THEN v.id END) as total_ventas,
        SUM(CASE WHEN v.estado = 'Pagado' THEN v.total ELSE 0 END) as total_gastado,
        MAX(CASE WHEN v.estado = 'Pagado' THEN v.fecha_registro END) as ultima_venta
      FROM clientes c
      LEFT JOIN ventas v ON c.id = v.cliente_id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    db.get(query, [clienteId], (err, row) => {
      if (err) {
        console.error('Error al obtener estadísticas del cliente:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
});

// Eliminar cliente
ipcMain.handle('eliminar-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    // Primero verificar si tiene ventas asociadas
    db.get('SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?', [clienteId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        resolve({
          success: false,
          error: 'No se puede eliminar un cliente con ventas asociadas'
        });
      } else {
        db.run('DELETE FROM clientes WHERE id = ?', [clienteId], function (err) {
          if (err) {
            console.error('Error al eliminar cliente:', err);
            reject(err);
          } else {
            resolve({ success: true });
          }
        });
      }
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



const {
  generarNumeroVenta,
  crearVenta,
  obtenerVentas,
  obtenerVentaPorId,
  buscarVentas,
  obtenerEstadisticasVentas,
  cancelarVenta,
  // Deudas de clientes
  obtenerDeudasClientes,
  obtenerDeudaClientePorId,
  registrarAbonoDeudaCliente,
  obtenerDeudasPorCliente,
  buscarDeudasClientes,
  obtenerEstadisticasDeudasClientes,
  obtenerHistorialAbonos
} = require('./database/ventas');

// Generar número de venta
ipcMain.handle('generar-numero-venta', async () => {
  return new Promise((resolve, reject) => {
    generarNumeroVenta((err, numero) => {
      if (err) reject(err);
      else resolve(numero);
    });
  });
});

// Reemplaza el handler 'crear-venta' en tu archivo IPC principal

ipcMain.handle('crear-venta', async (event, datosVenta) => {
  return new Promise((resolve, reject) => {
    console.log('📝 Creando venta con datos:', datosVenta);

    // 1. Manejar cliente si existe
    let clienteId = null;
    let clienteNombre = 'Cliente General';

    if (datosVenta.cliente && datosVenta.cliente.nombre) {
      clienteId = datosVenta.cliente.id || null;
      clienteNombre = datosVenta.cliente.nombre;
    }

    // 2. Preparar datos de venta
    const datosVentaDB = {
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      productos: datosVenta.productos,
      costos_adicionales: datosVenta.costos_adicionales,
      subtotal: datosVenta.subtotal,
      total: datosVenta.total,
      monto_pagado: datosVenta.monto_pagado,
      cambio: datosVenta.cambio,
      metodo_pago: datosVenta.metodo_pago,
      notas: datosVenta.notas
    };

    console.log('📦 Productos a guardar:', datosVenta.productos);
    console.log('💰 Costos adicionales a guardar:', datosVenta.costos_adicionales); // ← AGREGAR ESTE LOG


    // 3. Usar la función crearVenta del módulo
    crearVenta(datosVentaDB, async (err, resultado) => {
      if (err) {
        console.error('❌ Error al crear venta:', err);
        reject(err);
        return;
      }

      console.log('✅ Venta creada con ID:', resultado.id);

      try {
        // 4. Verificar que los productos se guardaron
        db.all(
          'SELECT * FROM venta_productos WHERE venta_id = ?',
          [resultado.id],
          (err, productosGuardados) => {
            if (err) {
              console.error('❌ Error al verificar productos:', err);
            } else {
              console.log('✅ Productos guardados en DB:', productosGuardados);
            }
          }
        );


        // 5. Crear deuda si hay saldo pendiente
        const tieneDeuda = datosVenta.monto_pagado < datosVenta.total;
        if (tieneDeuda) {
          await crearDeudaCliente(
            resultado.id,
            clienteId,
            clienteNombre,
            datosVenta.total,
            datosVenta.monto_pagado
          );
        }

        // 6. Actualizar estadísticas del cliente si existe
        if (clienteId) {
          db.run(`
            UPDATE clientes
            SET ultima_compra = datetime('now'),
                total_compras = total_compras + ?,
                numero_compras = numero_compras + 1
            WHERE id = ?
          `, [datosVenta.total, clienteId], (err) => {
            if (err) {
              console.error('❌ Error al actualizar cliente:', err);
            }
          });
        }

        // 7. Si hay cliente nuevo (con datos pero sin ID), crearlo
        if (!clienteId && datosVenta.cliente && datosVenta.cliente.nombre) {
          const nuevoCliente = await guardarClienteNuevo(datosVenta.cliente);

          // Actualizar la venta con el ID del nuevo cliente
          if (nuevoCliente && nuevoCliente.id) {
            db.run(`UPDATE ventas SET cliente_id = ? WHERE id = ?`, [nuevoCliente.id, resultado.id]);
          }
        }

        resolve({
          success: true,
          numero_venta: resultado.numero_venta,
          venta_id: resultado.id,
          tiene_deuda: tieneDeuda
        });

      } catch (innerError) {
        console.error('❌ Error procesando detalles de venta:', innerError);
        reject(innerError);
      }
    });
  });
});

// Función auxiliar para guardar cliente nuevo
async function guardarClienteNuevo(datosCliente) {
  return new Promise((resolve, reject) => {
    const { nombre, cedula, correo, celular } = datosCliente;

    // Verificar si ya existe por cédula
    if (cedula) {
      db.get('SELECT id FROM clientes WHERE cedula = ?', [cedula], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Ya existe, devolver el ID existente
          resolve({ id: row.id, existente: true });
        } else {
          // Crear nuevo cliente
          insertarCliente();
        }
      });
    } else {
      // No tiene cédula, crear directamente
      insertarCliente();
    }

    function insertarCliente() {
      const query = `
        INSERT INTO clientes (nombre, cedula, correo, celular)
        VALUES (?, ?, ?, ?)
      `;

      db.run(query, [nombre, cedula || null, correo || null, celular || null], function(err) {
        if (err) {
          console.error('Error al crear cliente:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, nuevo: true });
        }
      });
    }
  });
}

async function guardarCostoAdicional(ventaId, costo) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO costos_adicionales (venta_id, concepto, monto)
      VALUES (?, ?, ?)
    `;

    db.run(query, [ventaId, costo.concepto, costo.monto], (err) => {
      if (err) {
        console.error('❌ Error al guardar costo adicional:', err);
        reject(err);
      } else {
        console.log('✅ Costo adicional guardado');
        resolve();
      }
    });
  });
}

async function crearDeudaCliente(ventaId, clienteId, clienteNombre, montoTotal, montoPagado) {
  return new Promise((resolve, reject) => {
    const montoPendiente = montoTotal - montoPagado;
    const query = `
      INSERT INTO deudas_clientes (venta_id, cliente_id, cliente_nombre, monto_total, monto_pagado, monto_pendiente, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')
    `;

    db.run(query, [ventaId, clienteId, clienteNombre, montoTotal, montoPagado, montoPendiente], (err) => {
      if (err) {
        console.error('❌ Error al crear deuda:', err);
        reject(err);
      } else {
        console.log('✅ Deuda creada');
        resolve();
      }
    });
  });
}

// Función auxiliar para guardar cliente nuevo
async function guardarClienteNuevo(datosCliente) {
  return new Promise((resolve, reject) => {
    const { nombre, cedula, correo, celular } = datosCliente;

    // Verificar si ya existe por cédula
    if (cedula) {
      db.get('SELECT id FROM clientes WHERE cedula = ?', [cedula], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Ya existe, devolver el ID existente
          resolve({ id: row.id, existente: true });
        } else {
          // Crear nuevo cliente
          insertarCliente();
        }
      });
    } else {
      // No tiene cédula, crear directamente
      insertarCliente();
    }

    function insertarCliente() {
      const query = `
        INSERT INTO clientes (nombre, cedula, correo, celular)
        VALUES (?, ?, ?, ?)
      `;

      db.run(query, [nombre, cedula || null, correo || null, celular || null], function(err) {
        if (err) {
          console.error('Error al crear cliente:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, nuevo: true });
        }
      });
    }
  });
}


async function guardarDetalleVenta(ventaId, producto) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO venta_productos (venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [ventaId, producto.producto_id, producto.variante_id, producto.cantidad, producto.precio_unitario, producto.subtotal],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function actualizarStock(producto) {
  return new Promise((resolve, reject) => {
    if (producto.variante_id) {
      db.run(
        'UPDATE variantes_producto SET cantidad = cantidad - ? WHERE id = ?',
        [producto.cantidad, producto.variante_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    } else {
      resolve();
    }
  });
}

async function guardarCostoAdicional(ventaId, costo) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO costos_adicionales (venta_id, concepto, monto)
      VALUES (?, ?, ?)
    `;

    db.run(query, [ventaId, costo.concepto, costo.monto], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function crearDeudaCliente(ventaId, clienteId, clienteNombre, montoTotal, montoPagado) {
  return new Promise((resolve, reject) => {
    const montoPendiente = montoTotal - montoPagado;
    const query = `
      INSERT INTO deudas_clientes (venta_id, cliente_id, cliente_nombre, monto_total, monto_pagado, monto_pendiente, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')
    `;

    db.run(query, [ventaId, clienteId, clienteNombre, montoTotal, montoPagado, montoPendiente], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Obtener todas las ventas
ipcMain.handle('obtener-ventas', async () => {
  return new Promise((resolve, reject) => {
    obtenerVentas((err, ventas) => {
      if (err) {
        console.error('❌ Error al obtener ventas:', err);
        reject(err);
      } else {
        console.log('✅ Ventas obtenidas:', ventas.length);
        resolve(ventas);
      }
    });
  });
});


// Obtener venta por ID
ipcMain.handle('obtener-venta-por-id', async (event, id) => {
  return new Promise((resolve, reject) => {
    obtenerVentaPorId(id, (err, venta) => {
      if (err) reject(err);
      else resolve(venta);
    });
  });
});

// Buscar ventas
ipcMain.handle('buscar-ventas', async (event, termino) => {
  return new Promise((resolve, reject) => {
    buscarVentas(termino, (err, ventas) => {
      if (err) reject(err);
      else resolve(ventas);
    });
  });
});

// Obtener estadísticas de ventas
ipcMain.handle('obtener-estadisticas-ventas', async () => {
  return new Promise((resolve, reject) => {
    obtenerEstadisticasVentas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

ipcMain.handle('cancelar-venta', async (event, ventaId) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 1. Obtener información de la venta ANTES de cancelarla
      db.get('SELECT cliente_id, total, estado FROM ventas WHERE id = ?', [ventaId], (err, venta) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('❌ Error al obtener venta:', err);
          reject(err);
          return;
        }

        if (!venta) {
          db.run('ROLLBACK');
          reject(new Error('Venta no encontrada'));
          return;
        }

        // Verificar que no esté ya cancelada
        if (venta.estado === 'Cancelado') {
          db.run('ROLLBACK');
          resolve({ success: false, error: 'La venta ya está cancelada' });
          return;
        }

        console.log(`🔄 Cancelando venta ${ventaId} - Cliente: ${venta.cliente_id}, Total: $${venta.total}`);

        // 2. Obtener los productos de la venta para restaurar stock
        db.all('SELECT producto_id, variante_id, cantidad FROM venta_productos WHERE venta_id = ?', [ventaId], (err, productos) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('❌ Error al obtener productos:', err);
            reject(err);
            return;
          }

          console.log(`📦 Productos a restaurar: ${productos.length}`);

          // 3. Restaurar stock de cada producto
          let erroresStock = [];
          let procesados = 0;

          if (productos.length === 0) {
            // Si no hay productos, continuar directamente
            continuarCancelacion();
          } else {
            productos.forEach((item) => {
              if (item.variante_id) {
                // Restaurar stock de variante
                db.run(
                  'UPDATE variantes SET cantidad = cantidad + ? WHERE id = ?',
                  [item.cantidad, item.variante_id],
                  (err) => {
                    if (err) {
                      console.error(`❌ Error al restaurar stock de variante ${item.variante_id}:`, err);
                      erroresStock.push(err);
                    } else {
                      console.log(`✅ Stock restaurado: Variante ${item.variante_id} +${item.cantidad}`);
                    }
                    procesados++;
                    if (procesados === productos.length) continuarCancelacion();
                  }
                );
              } else {
                // Si no tiene variante, solo contar como procesado
                procesados++;
                if (procesados === productos.length) continuarCancelacion();
              }
            });
          }

          function continuarCancelacion() {
            if (erroresStock.length > 0) {
              db.run('ROLLBACK');
              reject(erroresStock[0]);
              return;
            }

            // 4. ✅ REVERTIR ESTADÍSTICAS DEL CLIENTE (si tiene cliente asociado)
            if (venta.cliente_id) {
              console.log(`🔄 Revirtiendo estadísticas del cliente ${venta.cliente_id}`);

              db.run(
                `UPDATE clientes
                 SET numero_compras = CASE
                       WHEN numero_compras > 0 THEN numero_compras - 1
                       ELSE 0
                     END,
                     total_compras = CASE
                       WHEN total_compras >= ? THEN total_compras - ?
                       ELSE 0
                     END
                 WHERE id = ?`,
                [venta.total, venta.total, venta.cliente_id],
                (err) => {
                  if (err) {
                    console.error('❌ Error al revertir estadísticas del cliente:', err);
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  console.log(`✅ Estadísticas del cliente ${venta.cliente_id} revertidas: -1 compra, -$${venta.total}`);
                  finalizarCancelacion();
                }
              );
            } else {
              // Si no tiene cliente, continuar directamente
              finalizarCancelacion();
            }

            function finalizarCancelacion() {
              // 5. Marcar la venta como cancelada
              db.run(
                "UPDATE ventas SET estado = 'Cancelado' WHERE id = ?",
                [ventaId],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('❌ Error al actualizar estado de venta:', err);
                    reject(err);
                  } else {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Error al hacer commit:', err);
                        reject(err);
                      } else {
                        console.log(`✅ Venta ${ventaId} cancelada correctamente`);
                        if (venta.cliente_id) {
                          console.log(`✅ Estadísticas del cliente ${venta.cliente_id} actualizadas`);
                        }
                        resolve({ success: true });
                      }
                    });
                  }
                }
              );
            }
          }
        });
      });
    });
  });
});

// ==================== IPC HANDLERS PARA DEUDAS DE CLIENTES ====================

// Obtener deudas de clientes
ipcMain.handle('obtener-deudas-clientes', async () => {
  return new Promise((resolve, reject) => {
    obtenerDeudasClientes((err, deudas) => {
      if (err) {
        console.error('❌ Error al obtener deudas de clientes:', err);
        reject(err);
      } else {
        console.log('✅ Deudas de clientes obtenidas:', deudas.length);
        resolve(deudas);
      }
    });
  });
});

// Obtener deuda de cliente por ID
ipcMain.handle('obtener-deuda-cliente-por-id', async (event, id) => {
  return new Promise((resolve, reject) => {
    obtenerDeudaClientePorId(id, (err, deuda) => {
      if (err) reject(err);
      else resolve(deuda);
    });
  });
});

// Registrar abono a deuda de cliente
ipcMain.handle('registrar-abono-deuda-cliente', async (event, deudaId, montoAbono, metodoPago, notas) => {
  return new Promise((resolve, reject) => {
    registrarAbonoDeudaCliente(deudaId, montoAbono, metodoPago, notas, (err, resultado) => {
      if (err) {
        console.error('❌ Error al registrar abono:', err);
        reject(err);
      } else {
        console.log('✅ Abono registrado:', resultado);
        resolve(resultado);
      }
    });
  });
});

// Obtener deudas por cliente
ipcMain.handle('obtener-deudas-por-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    obtenerDeudasPorCliente(clienteId, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Buscar deudas de clientes
ipcMain.handle('buscar-deudas-clientes', async (event, termino) => {
  return new Promise((resolve, reject) => {
    buscarDeudasClientes(termino, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener estadísticas de deudas de clientes
ipcMain.handle('obtener-estadisticas-deudas-clientes', async () => {
  return new Promise((resolve, reject) => {
    obtenerEstadisticasDeudasClientes((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener historial de abonos
ipcMain.handle('obtener-historial-abonos', async (event, deudaId) => {
  return new Promise((resolve, reject) => {
    obtenerHistorialAbonos(deudaId, (err, abonos) => {
      if (err) reject(err);
      else resolve(abonos);
    });
  });
});


ipcMain.handle('obtener-dashboard-stats', async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Obtener fecha del mes actual y anterior
      const fechaActual = new Date();
      const primerDiaMesActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const primerDiaMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);

      let estadisticas = {
        ventasTotales: 0,
        ventasMesAnterior: 0,
        gastosTotales: 0,
        gastosMesAnterior: 0,
        deudasPendientes: 0,
        clientesConDeuda: 0,
        itemsInventario: 0,
        productosStockBajo: 0
      };

      let actividades = [];

      // 1. Ventas del mes actual
      db.get(`
        SELECT SUM(total) as total
        FROM ventas
        WHERE estado = 'Pagado'
        AND date(fecha) >= date('now', 'start of month')
      `, [], (err, row) => {
        if (!err && row) {
          estadisticas.ventasTotales = row.total || 0;
        }

        // 2. Ventas del mes anterior
        db.get(`
          SELECT SUM(total) as total
          FROM ventas
          WHERE estado = 'Pagado'
          AND date(fecha) >= date('now', 'start of month', '-1 month')
          AND date(fecha) < date('now', 'start of month')
        `, [], (err, row) => {
          if (!err && row) {
            estadisticas.ventasMesAnterior = row.total || 0;
          }

          // 3. Gastos del mes actual
          db.get(`
            SELECT SUM(monto) as total
            FROM gastos
            WHERE date(fecha) >= date('now', 'start of month')
          `, [], (err, row) => {
            if (!err && row) {
              estadisticas.gastosTotales = row.total || 0;
            }

            // 4. Gastos del mes anterior
            db.get(`
              SELECT SUM(monto) as total
              FROM gastos
              WHERE date(fecha) >= date('now', 'start of month', '-1 month')
              AND date(fecha) < date('now', 'start of month')
            `, [], (err, row) => {
              if (!err && row) {
                estadisticas.gastosMesAnterior = row.total || 0;
              }

              // 5. Deudas pendientes (CORREGIDO - usar deudas_clientes)
              db.get(`
                SELECT SUM(monto_pendiente) as total, COUNT(DISTINCT cliente_id) as clientes
                FROM deudas_clientes
                WHERE estado = 'Pendiente'
              `, [], (err, row) => {
                if (!err && row) {
                  estadisticas.deudasPendientes = row.total || 0;
                  estadisticas.clientesConDeuda = row.clientes || 0;
                }

                // 6. Items en inventario y stock bajo
                db.get(`
                  SELECT
                    SUM(v.cantidad) as total_items,
                    SUM(CASE WHEN v.cantidad < 10 THEN 1 ELSE 0 END) as stock_bajo
                  FROM variantes_producto v
                `, [], (err, row) => {
                  if (err) {
                    console.error('❌ Error al obtener inventario:', err);
                  }

                  if (!err && row) {
                    estadisticas.itemsInventario = row.total_items || 0;
                    estadisticas.productosStockBajo = row.stock_bajo || 0;
                  }

                  // 7. Actividad reciente (últimas 10)
                  obtenerActividadReciente((actividadesResult) => {
                    actividades = actividadesResult;
                    resolve({ estadisticas, actividades });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});




function obtenerActividadReciente(callback) {
  const actividades = [];

  // Ventas recientes
  db.all(`
    SELECT 'Venta' as tipo,
           'Venta a cliente #' || numero_venta as descripcion,
           '$' || printf('%.2f', total) as monto,
           fecha
    FROM ventas
    WHERE estado = 'Pagado'
    ORDER BY fecha DESC
    LIMIT 3
  `, [], (err, ventas) => {
    if (!err && ventas) {
      actividades.push(...ventas);
    }

    // Gastos recientes
    db.all(`
      SELECT 'Gasto' as tipo,
             'Pago de ' || descripcion as descripcion,
             '-$' || printf('%.2f', monto) as monto,
             fecha
      FROM gastos
      ORDER BY fecha DESC
      LIMIT 3
    `, [], (err, gastos) => {
      if (!err && gastos) {
        actividades.push(...gastos);
      }

      // Inventario reciente (productos nuevos agregados)
            db.all(`
              SELECT 'Inventario' as tipo,
                     'Producto agregado: ' || p.nombre as descripcion,
                     '+' || COALESCE(SUM(v.cantidad), 0) || ' unidades' as monto,
                     p.fecha_creado as fecha
              FROM productos p
              LEFT JOIN variantes_producto v ON v.producto_id = p.id
              WHERE date(p.fecha_creado) >= date('now', '-7 days')
              GROUP BY p.id
              ORDER BY p.fecha_creado DESC
              LIMIT 2
            `, [], (err, inventario) => {
              if (err) {
                console.error('❌ Error al obtener inventario reciente:', err);
              }
              if (!err && inventario) {
                actividades.push(...inventario);
              }

// Deudas de clientes recientes
        db.all(`
          SELECT 'Deuda' as tipo,
                 d.cliente_nombre || ' debe $' || printf('%.2f', d.monto_pendiente) as descripcion,
                 '$' || printf('%.2f', d.monto_pendiente) as monto,
                 d.fecha_creacion as fecha
          FROM deudas_clientes d
          WHERE d.estado = 'Pendiente'
          ORDER BY d.fecha_creacion DESC
          LIMIT 2
        `, [], (err, deudas) => {
          if (err) {
            console.error('❌ Error al obtener deudas recientes:', err);
          }
          if (!err && deudas) {
            actividades.push(...deudas);
          }

          // Ordenar todas las actividades por fecha
          actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

          // Limitar a las 10 más recientes
          callback(actividades.slice(0, 10));
        });
      });
    });
  });
}

// Agregar este handler en electron.js

ipcMain.handle('obtener-datos-grafica', async () => {
  return new Promise((resolve, reject) => {
    // Obtener últimos 6 meses
    const meses = [];
    const fechaActual = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-CO', { month: 'short' });
      const año = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      meses.push({
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        año: año,
        mesNumero: mes
      });
    }

    // Obtener datos de cada mes
    let procesados = 0;
    const datos = [];

    meses.forEach((mesInfo, index) => {
      const primerDia = `${mesInfo.año}-${String(mesInfo.mesNumero).padStart(2, '0')}-01`;
      const ultimoDia = new Date(mesInfo.año, mesInfo.mesNumero, 0).getDate();
      const ultimoDiaFecha = `${mesInfo.año}-${String(mesInfo.mesNumero).padStart(2, '0')}-${ultimoDia}`;

      // Ventas del mes
      db.get(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE estado = 'Pagado'
        AND date(fecha) >= date(?)
        AND date(fecha) <= date(?)
      `, [primerDia, ultimoDiaFecha], (err, ventasRow) => {
        const ventas = ventasRow ? ventasRow.total : 0;

        // Gastos del mes
        db.get(`
          SELECT COALESCE(SUM(monto), 0) as total
          FROM gastos
          WHERE date(fecha) >= date(?)
          AND date(fecha) <= date(?)
        `, [primerDia, ultimoDiaFecha], (err, gastosRow) => {
          const gastos = gastosRow ? gastosRow.total : 0;
          const ganancia = ventas - gastos;

          datos[index] = {
            mes: mesInfo.mes,
            ventas: ventas,
            gastos: gastos,
            ganancia: ganancia
          };

          procesados++;

          if (procesados === meses.length) {
            resolve(datos);
          }
        });
      });
    });
  });
});

// ==================== HANDLERS DE BACKUP ====================

// Crear backup manual
ipcMain.handle('crear-backup', async () => {
  try {
    if (!backupService) {
      return { success: false, error: 'Servicio de backup no inicializado' };
    }
    const resultado = await backupService.crearBackup();
    return resultado;
  } catch (error) {
    console.error('Error al crear backup:', error);
    return { success: false, error: error.message };
  }
});

// Listar backups disponibles
ipcMain.handle('listar-backups', async () => {
  try {
    if (!backupService) {
      return { success: false, backups: [] };
    }
    const backups = await backupService.listarBackups();
    return { success: true, backups };
  } catch (error) {
    console.error('Error al listar backups:', error);
    return { success: false, backups: [], error: error.message };
  }
});

// Restaurar backup
ipcMain.handle('restaurar-backup', async (event, fileName) => {
  try {
    if (!backupService) {
      return { success: false, error: 'Servicio de backup no inicializado' };
    }

    const resultado = await backupService.restaurarBackup(fileName);

    if (resultado.success) {
      // Reiniciar la app después de restaurar
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 2000);
    }

    return resultado;
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    return { success: false, error: error.message };
  }
});
// ==================== APP LIFECYCLE ====================

app.on('ready', () => {
  console.log('✅ App iniciada');
  console.log('📂 userData:', app.getPath('userData'));
  console.log('📂 appPath:', app.getAppPath());
  createWindow();
  setTimeout(() => {
    if (backupService) {
      backupService.iniciarBackupAutomatico(24);
    }
  }, 10000); // Esperar 10 segundos después de que inicie la app
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
