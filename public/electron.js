const { app, BrowserWindow, ipcMain, protocol, Menu } = require('electron');const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;
const url = require('url');
const sharp = require('sharp');
const devolucionesModel = require('./database/models/devoluciones.model');
const cajaModel = require('./database/models/caja.model');

// Registrar protocolo personalizado para cargar imágenes locales
app.setAppUserModelId('com.dalu.app'); // Identificador para agrupar ventanas y mostrar icono correcto

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

const db = require('./database');
const clientesModel = require('./database/models/clientes.model'); // ← AGREGAR ESTA LÍNEA

const BackupService = require('./database/backupService');

let mainWindow;
let backupService;




const getIconPath = () => {
  if (isDev) {
    // En desarrollo, usar desde la carpeta build/
    return path.join(__dirname, '../build/icon.ico');
  } else {
    // En producción, usar desde la carpeta de recursos
    return path.join(process.resourcesPath, '../build/icon.ico');
  }
};

function createWindow() {


  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Dalú',
    icon: getIconPath(), // ✅ Usar función para obtener path correcto
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

devolucionesModel.inicializarTablas();
crearMenuPersonalizado();

function crearMenuPersonalizado() {
  const template = [
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de Dalú',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              title: 'Dalú v1.0',
              message: 'Sistema de Gestión de Dalú',
              detail: 'Desarrollado por Andrey Ramírez\n\nGestión de inventario, ventas, gastos y clientes.\n\n 2026'
            });
          }
        },
        {
          type: 'separator' // Línea separadora
        },
{
  label: 'Recordatorio',
  click: () => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      title: 'Para mi mejor amiga',
      message: 'Para ti, Luisa',
        detail: 'Esta app fue hecha con mucho cariño para ti.\n\n' +
        'Espero que te sirva para materializar ese sueño que tanto anhelas.\n\n' +
        'Estoy muy orgulloso de ti y de todo el esfuerzo que has hecho.\n\n' +
        'Y estoy seguro de que cumplirás todo lo que te propongas.\n\n' +
        'Con todo mi cariño,\nAndreu'
    });
  }
}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

  // CORREGIDO: Inicialización del Backup Service
  const dbPath = path.join(app.getPath('userData'), 'dalu.db');
  backupService = new BackupService(dbPath);
  iniciarApiMovil();

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
    //mainWindow.webContents.openDevTools();

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

async function guardarImagen(referencia, imagenData) {
  try {
    const carpeta = getCarpetaImagenes();
    const timestamp = Date.now();

    // ✅ CORREGIDO: imagenData puede ser un string directo o un objeto
    const base64String = typeof imagenData === 'string' ? imagenData : imagenData.data;

    if (!base64String) {
      console.error('❌ No hay datos de imagen');
      return null;
    }

    // Detectar extensión del base64
    let extension = '.jpg';
    if (base64String.includes('image/png')) extension = '.png';
    else if (base64String.includes('image/webp')) extension = '.webp';
    else if (base64String.includes('image/gif')) extension = '.gif';

    // Convertir base64 a buffer
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Rutas de archivos
    const nombreCompleta = `${referencia}-${timestamp}${extension}`;
    const nombreThumbnail = `${referencia}-${timestamp}_thumb.jpg`;
    const rutaCompleta = path.join(carpeta, nombreCompleta);
    const rutaThumbnail = path.join(carpeta, nombreThumbnail);

    // ✅ Procesar ambas imágenes en paralelo
    await Promise.all([
      // Guardar imagen completa optimizada (max 800x800)
      sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(rutaCompleta),

      // Crear thumbnail (50x50)
      sharp(buffer)
        .resize(50, 50, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toFile(rutaThumbnail)
    ]);

    console.log('✅ Imágenes procesadas y guardadas');
    console.log(`   📸 Completa: ${rutaCompleta}`);
    console.log(`   🖼️  Thumbnail: ${rutaThumbnail}`);

    return {
      completa: rutaCompleta,
      thumbnail: rutaThumbnail
    };
  } catch (error) {
    console.error('❌ Error al procesar imágenes:', error);
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
// ✅ CORREGIR EN electron.js

// Obtener todos los productos
ipcMain.handle('obtener-productos', async () => {
  return new Promise((resolve, reject) => {
    // ✅ AGREGAR imagenThumbnail a la consulta
    const query = `
      SELECT
        p.*,
        p.imagen,
        p.imagenThumbnail
      FROM productos p
      ORDER BY p.fecha_creado DESC
    `;

    db.db.all(query, [], (err, productos) => {
      if (err) {
        console.error('❌ Error al obtener productos:', err);
        reject(err);
        return;
      }

      // Obtener variantes para cada producto
      if (productos.length === 0) {
        resolve([]);
        return;
      }

      let procesados = 0;
      productos.forEach((producto) => {
        db.db.all(
          'SELECT * FROM variantes_producto WHERE producto_id = ?',
          [producto.id],
          (err, variantes) => {
            if (!err) {
              producto.variantes = variantes;
            } else {
              producto.variantes = [];
            }

            // Obtener costos adicionales
            db.db.all(
              'SELECT * FROM costos_adicionales_producto WHERE producto_id = ?',
              [producto.id],
              (err, costos) => {
                if (!err) {
                  producto.costos_adicionales = costos;
                } else {
                  producto.costos_adicionales = [];
                }

                procesados++;
                if (procesados === productos.length) {
                  console.log('✅ Productos obtenidos con thumbnails:', productos.length);
                  resolve(productos);
                }
              }
            );
          }
        );
      });
    });
  });
});
// Obtener productos por categoría
ipcMain.handle('obtener-productos-categoria', async (event, categoria) => {
  return new Promise((resolve, reject) => {
    db.productos.obtenerPorCategoria(categoria, (err, productos) => {
      if (err) reject(err);
      else resolve(productos);
    });
  });
});

// Buscar productos
ipcMain.handle('buscar-productos', async (event, termino) => {
  return new Promise((resolve, reject) => {
    db.productos.buscar(termino, (err, productos) => {
      if (err) reject(err);
      else resolve(productos);
    });
  });
});

// Agregar producto
// ✅ Actualizar los handlers para usar await
ipcMain.handle('agregar-producto', async (event, producto) => {
  return new Promise(async (resolve, reject) => {
    // ✅ Usar await porque guardarImagen ahora es asíncrono
    let rutasImagen = { completa: null, thumbnail: null };
    if (producto.imagen) {
      rutasImagen = await guardarImagen(producto.referencia, producto.imagen);
    }

    const datosProducto = {
      referencia: producto.referencia,
      nombre: producto.nombre,
      categoria: producto.categoria,
      costo_base: producto.costo_base,
      precio_calculado: producto.precio_calculado,
      precio_venta_base: producto.precio_venta_base,
      variantes: producto.variantes || [],
      costos_adicionales: producto.costos_adicionales || []
    };

    db.productos.agregar(datosProducto, (err, resultado) => {
      if (err) {
        // Si falla, eliminar imágenes guardadas
        if (rutasImagen.completa) eliminarImagen(rutasImagen.completa);
        if (rutasImagen.thumbnail) eliminarImagen(rutasImagen.thumbnail);
        console.error('❌ Error al agregar producto:', err);
        reject(err);
        return;
      }

      // ✅ Actualizar ambas rutas en la BD
      if (rutasImagen.completa) {
        db.db.run(
          'UPDATE productos SET imagen = ?, imagenThumbnail = ? WHERE id = ?',
          [rutasImagen.completa, rutasImagen.thumbnail, resultado.id],
          (errImg) => {
            if (errImg) {
              console.error('⚠️ Producto guardado pero error al actualizar imagen:', errImg);
            }
          }
        );
      }

      console.log('✅ Producto agregado con imágenes optimizadas');
      resolve({ success: true, id: resultado.id });
    });
  });
});


// Actualizar producto
// Actualizar producto
ipcMain.handle('actualizar-producto', async (event, id, datosActualizados) => {
  return new Promise(async (resolve, reject) => {
    db.db.get(`SELECT imagen, imagenThumbnail FROM productos WHERE id = ?`, [id], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      const imagenAnterior = row ? row.imagen : null;
      const thumbnailAnterior = row ? row.imagenThumbnail : null;
      let rutasImagen = { completa: imagenAnterior, thumbnail: thumbnailAnterior };

      // ✅ Usar await si hay nueva imagen
      if (datosActualizados.imagen) {
        rutasImagen = await guardarImagen(datosActualizados.referencia, datosActualizados.imagen);

        // Eliminar imágenes anteriores si existían
        if (imagenAnterior) eliminarImagen(imagenAnterior);
        if (thumbnailAnterior) eliminarImagen(thumbnailAnterior);
      }

      const datosParaActualizar = {
        referencia: datosActualizados.referencia,
        nombre: datosActualizados.nombre,
        categoria: datosActualizados.categoria,
        costo_base: datosActualizados.costo_base,
        precio_calculado: datosActualizados.precio_calculado,
        precio_venta_base: datosActualizados.precio_venta_base,
        variantes: datosActualizados.variantes || [],
        costos_adicionales: datosActualizados.costos_adicionales || []
      };

      db.productos.actualizar(id, datosParaActualizar, (err, resultado) => {
        if (err) {
          console.error('❌ Error al actualizar producto:', err);
          reject(err);
          return;
        }

        // ✅ Actualizar rutas de imagen
        if (rutasImagen.completa) {
          db.db.run(
            'UPDATE productos SET imagen = ?, imagenThumbnail = ? WHERE id = ?',
            [rutasImagen.completa, rutasImagen.thumbnail, id],
            (errImg) => {
              if (errImg) {
                console.error('⚠️ Producto actualizado pero error al actualizar imagen:', errImg);
              }
            }
          );
        }

        console.log('✅ Producto actualizado con imágenes optimizadas');
        resolve({ success: true });
      });
    });
  });
});


// Eliminar producto
ipcMain.handle('eliminar-producto', async (event, id) => {
  return new Promise((resolve, reject) => {

    // Primero obtener la ruta de la imagen
    db.db.get(`SELECT imagen FROM productos WHERE id = ?`, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      const rutaImagen = row ? row.imagen : null;

      // Usar la función de db.js para eliminar (CASCADE se encarga de las variantes)
      db.productos.eliminar(id, (err, resultado) => {
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
    db.productos.obtenerEstadisticas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Actualizar stock de variante
ipcMain.handle('actualizar-stock-variante', async (event, varianteId, nuevaCantidad) => {
  return new Promise((resolve, reject) => {
    db.productos.actualizarStockVariante(varianteId, nuevaCantidad, (err, result) => {
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


// Obtener todos los gastos
ipcMain.handle('obtener-gastos', async () => {
  return new Promise((resolve, reject) => {
    db.gastos.obtener((err, gastos) => {
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
    db.gastos.agregar(gasto, (err, resultado) => {
      if (err) {
        console.error('❌ Error al agregar gasto:', err);
        reject(err);
      } else {
        console.log('✅ Gasto agregado:', resultado);

        // ✅ Registrar en caja automáticamente
        cajaModel.registrarMovimiento({
          tipo: 'salida',
          concepto: `Gasto: ${gasto.descripcion}`,
          monto: gasto.monto,
          origen: 'gasto',
          referencia_id: resultado.id
        }, (errCaja) => {
          if (errCaja) console.error('⚠️ Error al registrar gasto en caja:', errCaja);
        });

        resolve({ success: true, ...resultado });
      }
    });
  });
});

// Actualizar gasto
ipcMain.handle('actualizar-gasto', async (event, id, datos) => {
  return new Promise((resolve, reject) => {
    // 1️⃣ Obtener el monto ANTERIOR antes de sobreescribirlo
    db.db.get('SELECT monto, descripcion FROM gastos WHERE id = ?', [id], (errGet, gastoAnterior) => {
      if (errGet) {
        console.error('❌ Error al obtener gasto anterior:', errGet);
        reject(errGet);
        return;
      }

      const montoAnterior = gastoAnterior ? parseFloat(gastoAnterior.monto) : 0;

      // 2️⃣ Actualizar el gasto
      db.gastos.actualizar(id, datos, (err, resultado) => {
        if (err) {
          console.error('❌ Error al actualizar gasto:', err);
          reject(err);
          return;
        }

        console.log('✅ Gasto actualizado:', resultado);

        // 3️⃣ Calcular diferencia y ajustar caja si cambió el monto
        const montoNuevo = parseFloat(datos.monto);
        const diferencia = montoNuevo - montoAnterior;

        if (diferencia !== 0 && !isNaN(diferencia)) {
          const esAumento = diferencia > 0;

          cajaModel.registrarMovimiento({
            // Si el gasto AUMENTÓ, sale más plata de caja → 'salida'
            // Si el gasto DISMINUYÓ, esa plata "vuelve" → 'entrada'
            tipo: esAumento ? 'salida' : 'entrada',
            concepto: `Ajuste gasto: ${datos.descripcion} (${esAumento ? '+' : '-'}$${Math.abs(diferencia).toLocaleString('es-CO')})`,
            monto: Math.abs(diferencia),
            origen: 'gasto',
            referencia_id: id,
            notas: `Monto anterior: $${montoAnterior.toLocaleString('es-CO')} → Monto nuevo: $${montoNuevo.toLocaleString('es-CO')}`
          }, (errCaja) => {
            if (errCaja) console.error('⚠️ Error al ajustar caja por edición de gasto:', errCaja);
            else console.log(`✅ Caja ajustada por edición de gasto: ${esAumento ? '+' : '-'}$${Math.abs(diferencia)}`);
          });
        }

        resolve({ success: true });
      });
    });
  });
});

ipcMain.handle('eliminar-gasto', async (event, id) => {
  return new Promise((resolve, reject) => {
    // Obtener el gasto antes de eliminarlo, para revertir la caja
    db.db.get('SELECT monto, descripcion FROM gastos WHERE id = ?', [id], (errGet, gasto) => {
      db.gastos.eliminar(id, (err, resultado) => {
        if (err) {
          console.error('❌ Error al eliminar gasto:', err);
          reject(err);
          return;
        }

        console.log('✅ Gasto eliminado:', resultado);

        if (gasto) {
          cajaModel.registrarMovimiento({
            tipo: 'entrada',
            concepto: `Reversión por eliminación de gasto: ${gasto.descripcion}`,
            monto: gasto.monto,
            origen: 'gasto',
            referencia_id: id
          }, (errCaja) => {
            if (errCaja) console.error('⚠️ Error al revertir caja por eliminación de gasto:', errCaja);
          });
        }

        resolve({ success: true });
      });
    });
  });
});


// Buscar gastos
ipcMain.handle('buscar-gastos', async (event, termino) => {
  return new Promise((resolve, reject) => {
    db.gastos.buscar(termino, (err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});

// Obtener gastos por categoría
ipcMain.handle('obtener-gastos-categoria', async (event, categoria) => {
  return new Promise((resolve, reject) => {
    db.gastos.obtenerPorCategoria(categoria, (err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});

// Obtener estadísticas de gastos
ipcMain.handle('obtener-estadisticas-gastos', async () => {
  return new Promise((resolve, reject) => {
    db.gastos.obtenerEstadisticas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener total de gastos
ipcMain.handle('obtener-total-gastos', async () => {
  return new Promise((resolve, reject) => {
    db.gastos.obtenerTotal((err, totales) => {
      if (err) reject(err);
      else resolve(totales);
    });
  });
});

// Obtener gastos del mes actual
ipcMain.handle('obtener-gastos-mes', async () => {
  return new Promise((resolve, reject) => {
    db.gastos.obtenerMesActual((err, gastos) => {
      if (err) reject(err);
      else resolve(gastos);
    });
  });
});



const { Notification } = require('electron');

// HANDLERS PARA DEUDAS

// Obtener todas las deudas
ipcMain.handle('obtener-deudas', async () => {
  return new Promise((resolve, reject) => {
    db.deudas.obtener((err, deudas) => {
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
    db.deudas.obtenerPendientes((err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener deuda por ID
ipcMain.handle('obtener-deuda-por-id', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.deudas.obtenerPorId(id, (err, deuda) => {
      if (err) reject(err);
      else resolve(deuda);
    });
  });
});

// Agregar deuda
ipcMain.handle('agregar-deuda', async (event, deuda) => {
  return new Promise((resolve, reject) => {
    db.deudas.agregar(deuda, (err, resultado) => {
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
    db.deudas.registrarPago(deudaId, montoPago, metodoPago, notas, (err, resultado) => {
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
    db.deudas.actualizar(id, datos, (err, resultado) => {
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
    db.deudas.eliminar(id, (err, resultado) => {
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
    db.deudas.buscar(termino, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener estadísticas
ipcMain.handle('obtener-estadisticas-deudas', async () => {
  return new Promise((resolve, reject) => {
    db.deudas.obtenerEstadisticas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener historial de pagos
ipcMain.handle('obtener-historial-pagos', async (event, deudaId) => {
  return new Promise((resolve, reject) => {
    db.deudas.obtenerHistorialPagos(deudaId, (err, pagos) => {
      if (err) reject(err);
      else resolve(pagos);
    });
  });
});


//---------------------DEVOLUCIONES----------------------------------------------
// ── Registrar devolución completa ──
ipcMain.handle('registrar-devolucion', async (event, datos) => {
  return new Promise((resolve, reject) => {
    devolucionesModel.registrarDevolucion(datos, (err, resultado) => {
      if (err) {
        console.error('❌ Error al registrar devolución:', err);
        reject(err);
      } else {
        console.log('✅ Devolución registrada:', resultado);
        resolve(resultado);
      }
    });
  });
});

// ── Obtener todas las devoluciones ──
ipcMain.handle('obtener-devoluciones', async () => {
  return new Promise((resolve, reject) => {
    devolucionesModel.obtener((err, devoluciones) => {
      if (err) reject(err);
      else resolve(devoluciones);
    });
  });
});

// ── Obtener devoluciones de una venta específica ──
ipcMain.handle('obtener-devoluciones-venta', async (event, ventaId) => {
  return new Promise((resolve, reject) => {
    devolucionesModel.obtenerPorVenta(ventaId, (err, devoluciones) => {
      if (err) reject(err);
      else resolve(devoluciones);
    });
  });
});

// ── Obtener deuda pendiente de un cliente (para la UI de devoluciones) ──
ipcMain.handle('obtener-deuda-pendiente-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.db.get(`
      SELECT id, monto_pendiente, venta_id, monto_pagado
      FROM deudas_clientes
      WHERE cliente_id = ? AND estado = 'Pendiente'
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `, [clienteId], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
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

    db.db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
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
    db.db.get('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, row) => {
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

      db.db.run(query, [nombre, cedula, correo, celular, id], function (err) {
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
        db.db.get('SELECT id FROM clientes WHERE cedula = ?', [cedula], (err, row) => {
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

      db.db.run(query, [nombre, cedula, correo, celular], function (err) {
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
    db.db.get('SELECT numero_compras, total_compras FROM clientes WHERE id = ?', [clienteId], (err, cliente) => {
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

      db.db.run(query, [nuevoNumeroCompras, nuevoTotalCompras, clienteId], function (err) {
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

    db.db.run(query, [totalCompra, clienteId], function (err) {
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
    db.db.all(`
      SELECT
        c.id,
        c.nombre,
        c.cedula,
        c.correo,
        c.celular,
        c.tarjeta_fidelidad_entregada,
        c.fecha_primera_compra,
        c.compras_con_tarjeta,
        c.descuento_aplicado_3,
        c.descuento_aplicado_6,
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
        console.log('✅ Clientes con estadísticas:', rows.length);
        resolve(rows);
      }
    });
  });
});

// Obtener todos los clientes (simple)
ipcMain.handle('obtener-clientes', async () => {
  return new Promise((resolve, reject) => {
    db.db.all('SELECT * FROM clientes ORDER BY nombre ASC', [], (err, rows) => {
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

    db.db.get(query, [clienteId], (err, row) => {
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
    // Solo bloquear si tiene ventas ACTIVAS (no canceladas)
    db.db.get(
      "SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ? AND estado != 'Cancelado'",
      [clienteId],
      (err, row) => {
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
          db.db.run('DELETE FROM clientes WHERE id = ?', [clienteId], function (err) {
            if (err) {
              console.error('Error al eliminar cliente:', err);
              reject(err);
            } else {
              resolve({ success: true });
            }
          });
        }
      }
    );
  });
});
// ==================== HANDLERS DE FIDELIDAD ====================

// Verificar estado de fidelidad del cliente
ipcMain.handle('verificar-fidelidad-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.clientes.verificarDescuentoFidelidad(clienteId, (err, resultado) => {
      if (err) {
        console.error('❌ Error al verificar fidelidad:', err);
        reject(err);
      } else {
        resolve(resultado);
      }
    });
  });
});





// Marcar descuento del 10% aplicado
ipcMain.handle('marcar-descuento-3-aplicado', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.clientes.marcarDescuentoAplicado3(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

// Marcar descuento del 15% aplicado
ipcMain.handle('marcar-descuento-6-aplicado', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.clientes.marcarDescuentoAplicado6(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

// Reiniciar fidelidad manualmente
ipcMain.handle('reiniciar-fidelidad-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.clientes.reiniciarFidelidad(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

// Verificar y reiniciar fidelidades vencidas (ejecutar periódicamente)
ipcMain.handle('verificar-fidelidades-vencidas', async () => {
  return new Promise((resolve, reject) => {
    db.clientes.verificarYReiniciarFidelidad((err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

ipcMain.handle('verificar-descuento-fidelidad', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.verificarDescuentoFidelidad(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

ipcMain.handle('registrar-entrega-tarjeta', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.registrarEntregaTarjeta(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

ipcMain.handle('registrar-presentacion-tarjeta', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.registrarPresentacionTarjeta(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

ipcMain.handle('marcar-descuento-aplicado-3', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.marcarDescuentoAplicado3(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

ipcMain.handle('marcar-descuento-aplicado-6', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.marcarDescuentoAplicado6(clienteId, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

/**
 * ✅ NUEVO: Reiniciar fidelidad si expiró (cliente completó programa y pasaron 10 meses)
 */
ipcMain.handle('reiniciar-fidelidad-si-expirada', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    clientesModel.reiniciarFidelidadSiExpirada(clienteId, (err, resultado) => {
      if (err) {
        console.error('❌ Error al verificar expiración:', err);
        reject(err);
      } else {
        resolve(resultado);
      }
    });
  });
});

/**
 * ✅ NUEVO: Verificar y reiniciar fidelidad de todos los clientes (ejecutar periódicamente)
 * Este ya existía como 'verificar-fidelidades-vencidas', pero lo renombramos para consistencia
 */
ipcMain.handle('verificar-reinicio-fidelidad-todos', async () => {
  return new Promise((resolve, reject) => {
    clientesModel.verificarYReiniciarFidelidad((err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
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



//VENTAS

// Generar número de venta
ipcMain.handle('generar-numero-venta', async () => {
  return new Promise((resolve, reject) => {
    db.ventas.generarNumeroVenta((err, numero) => {
      if (err) reject(err);
      else resolve(numero);
    });
  });
});

// ACTUALIZAR la función crear-venta en electron.js

ipcMain.handle('crear-venta', async (event, datosVenta) => {
  return new Promise((resolve, reject) => {
    console.log('📝 Creando venta con datos:', datosVenta);

    // 1️⃣ RESOLVER CLIENTE
    resolverCliente(datosVenta, async (err, clienteId, clienteNombre) => {
      if (err) {
        console.error('❌ Error al resolver cliente:', err);
        reject(err);
        return;
      }

      // 2️⃣ ARMAR DATOS DE LA VENTA
      const datosVentaDB = {
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        productos: datosVenta.productos,
        productos_marca_aliada: datosVenta.productos_marca_aliada || [], // ⬅️ NUEVO
        costos_adicionales: datosVenta.costos_adicionales,
        subtotal: datosVenta.subtotal,
        total_marcas: datosVenta.total_marcas || 0, // ⬅️ NUEVO
        total: datosVenta.total,
        monto_pagado: datosVenta.monto_pagado,
        cambio: datosVenta.cambio,
        metodo_pago: datosVenta.metodo_pago,
        notas: datosVenta.notas,
        descuento_porcentaje: datosVenta.descuento_porcentaje || 0,
        descuento_monto: datosVenta.descuento_monto || 0
      };

      console.log('💰 Productos marca aliada:', datosVentaDB.productos_marca_aliada);

      // ✅ VERIFICAR SI YA TIENE TARJETA **ANTES** DE CREAR LA VENTA
      let noTieneTarjeta = false;
      if (clienteId) {
        await new Promise((resolve) => {
          db.db.get(
            'SELECT tarjeta_fidelidad_entregada FROM clientes WHERE id = ?',
            [clienteId],
            (err, cliente) => {
              if (!err && cliente) {
                noTieneTarjeta = cliente.tarjeta_fidelidad_entregada === 0;
              }
              resolve();
            }
          );
        });
      }

      // 3️⃣ CREAR VENTA
      db.ventas.crear(datosVentaDB, async (err, resultado) => {
        if (err) {
          console.error('❌ Error al crear venta:', err);
          reject(err);
          return;
        }

        console.log('✅ Venta creada con ID:', resultado.id);

       // 4️⃣ GUARDAR PRODUCTOS DE MARCAS ALIADAS (CORREGIDO)
       if (datosVentaDB.productos_marca_aliada && datosVentaDB.productos_marca_aliada.length > 0) {
         console.log(`💜 Guardando ${datosVentaDB.productos_marca_aliada.length} productos de marcas aliadas...`);

         for (const producto of datosVentaDB.productos_marca_aliada) {
           try {
             // Insertar en ventas_marca_aliada
             await new Promise((resolve, reject) => {
               db.db.run(
                 `INSERT INTO ventas_marca_aliada (
                   venta_id, marca_aliada_id, producto_marca_id, variante_id,
                   cantidad, precio_unitario, subtotal, comision_marca, ganancia_tienda
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                 [
                   resultado.id,
                   producto.marca_aliada_id,
                   producto.producto_marca_id,
                   producto.variante_id || null,
                   producto.cantidad,
                   producto.precio_unitario,
                   producto.subtotal,
                   (producto.subtotal * producto.porcentaje_comision / 100),
                   (producto.subtotal * (100 - producto.porcentaje_comision) / 100)
                 ],
                 (err) => {
                   if (err) {
                     console.error('❌ Error al guardar producto marca aliada:', err);
                     reject(err);
                   } else {
                     console.log(`✅ Producto marca aliada guardado: ${producto.nombre}`);
                     resolve();
                   }
                 }
               );
             });

             // ✅ ACTUALIZAR STOCK COMO OPERACIÓN SEPARADA
             if (producto.variante_id) {
               await new Promise((resolve, reject) => {
                 db.db.run(
                   'UPDATE variantes_marca_aliada SET cantidad = cantidad - ? WHERE id = ?',
                   [producto.cantidad, producto.variante_id],
                   (err) => {
                     if (err) {
                       console.error('❌ Error al actualizar stock marca aliada:', err);
                       reject(err);
                     } else {
                       console.log(`✅ Stock actualizado: variante ${producto.variante_id} -${producto.cantidad}`);
                       resolve();
                     }
                   }
                 );
               });
             }
           } catch (error) {
             console.error('❌ Error procesando producto marca aliada:', error);
             // Puedes decidir si continuar con los demás productos o hacer rollback
           }
         }
       }

       // 4️⃣B ACTUALIZAR STOCK DE PRODUCTOS PROPIOS
       if (datosVentaDB.productos && datosVentaDB.productos.length > 0) {
         for (const producto of datosVentaDB.productos) {
           await actualizarStock(producto, resultado.id);
         }
       }

        // 5️⃣ CREAR DEUDA SI APLICA
        const tieneDeuda = datosVenta.monto_pagado < datosVenta.total;

        if (tieneDeuda && clienteId) {
          await crearDeudaCliente(
            resultado.id,
            clienteId,
            clienteNombre,
            datosVenta.total,
            datosVenta.monto_pagado
          ).catch(err => {
            console.error('❌ Error al crear deuda:', err);
          });
        }

        // 6️⃣ ACTUALIZAR ESTADÍSTICAS DEL CLIENTE
        if (clienteId) {
          const esCompraGrande = datosVenta.subtotal > 30000;

          await new Promise((resolve) => {
            db.db.run(
              `UPDATE clientes
               SET ultima_compra = datetime('now', 'localtime'),
                   total_compras = total_compras + ?,
                   numero_compras = numero_compras + 1,
                   fecha_primera_compra = COALESCE(fecha_primera_compra, datetime('now', 'localtime'))
               WHERE id = ?`,
              [datosVenta.total, clienteId],
              (err) => {
                if (err) {
                  console.error('❌ Error al actualizar cliente:', err);
                }
                resolve();
              }
            );
          });

          if (noTieneTarjeta && esCompraGrande) {
            await new Promise((resolve) => {
              db.db.run(
                `UPDATE clientes
                 SET tarjeta_fidelidad_entregada = 1,
                     compras_con_tarjeta = 1,
                     fecha_primera_compra = COALESCE(fecha_primera_compra, datetime('now', 'localtime'))
                 WHERE id = ?`,
                [clienteId],
                (err) => {
                  if (err) {
                    console.error('❌ Error al entregar tarjeta automática:', err);
                  } else {
                    console.log('✅ Tarjeta entregada automáticamente');
                  }
                  resolve();
                }
              );
            });
          }
        }

// 7️⃣ RESPUESTA FINAL

        // ✅ Registrar en caja automáticamente
        if (datosVenta.monto_pagado > 0) {
          cajaModel.registrarMovimiento({
            tipo: 'entrada',
            concepto: `Venta #${resultado.numero_venta} - ${clienteNombre}`,
            monto: datosVenta.monto_pagado - (datosVenta.cambio || 0),
            origen: 'venta',
            referencia_id: resultado.id
          }, (err) => {
            if (err) console.error('⚠️ Error al registrar venta en caja:', err);
          });
        }

        resolve({
          success: true,
          venta_id: resultado.id,
          numero_venta: resultado.numero_venta,
          tiene_deuda: tieneDeuda
        });
      });
    });
  });
});

function resolverCliente(datosVenta, callback) {
  const cliente = datosVenta.cliente;

  // 1️⃣ Cliente EXISTENTE (seleccionado)
  if (cliente?.id && Number.isInteger(cliente.id)) {
    return callback(null, cliente.id, cliente.nombre);
  }

  // 2️⃣ Cliente NUEVO (nombre válido)
  if (cliente?.nombre && cliente.nombre.trim().length > 0) {
    guardarClienteNuevo(
      {
        nombre: cliente.nombre.trim(),
        cedula: cliente.cedula || null,
        correo: cliente.correo || null,
        celular: cliente.celular || null
      },
      (err, nuevo) => {
        if (err) return callback(err);
        return callback(null, nuevo.id, cliente.nombre.trim());
      }
    );
    return;
  }

  // 3️⃣ SIN CLIENTE
  callback(null, null, 'Cliente General');
}

// ✅ FUNCIÓN AUXILIAR: Guardar cliente nuevo (con callback)
function guardarClienteNuevo(datosCliente, callback) {
  const { nombre, cedula, correo, celular } = datosCliente;

  // 1. Si tiene cédula, buscar por cédula primero (ya existía)
  if (cedula) {
    db.db.get(
      'SELECT id FROM clientes WHERE cedula = ?',
      [cedula],
      (err, row) => {
        if (err) return callback(err);
        if (row) {
          // Actualizar datos del cliente existente con la nueva info
          db.db.run(
            `UPDATE clientes SET
              nombre = ?,
              correo = COALESCE(NULLIF(?, ''), correo),
              celular = COALESCE(NULLIF(?, ''), celular)
             WHERE id = ?`,
            [nombre, correo, celular, row.id],
            (err) => {
              if (err) return callback(err);
              callback(null, { id: row.id, existente: true });
            }
          );
        } else {
          buscarPorNombreOInsertar();
        }
      }
    );
  } else {
    buscarPorNombreOInsertar();
  }

  // 2. NUEVO: Buscar por nombre similar antes de insertar
  function buscarPorNombreOInsertar() {
    const nombreNormalizado = nombre.trim().toUpperCase();
    db.db.get(
      `SELECT id FROM clientes
       WHERE UPPER(TRIM(nombre)) = ?`,
      [nombreNormalizado],
      (err, row) => {
        if (err) return callback(err);

        if (row) {
          // Cliente con mismo nombre existe → actualizar sus datos si hay info nueva
          db.db.run(
            `UPDATE clientes SET
              cedula = COALESCE(NULLIF(?, ''), cedula),
              correo = COALESCE(NULLIF(?, ''), correo),
              celular = COALESCE(NULLIF(?, ''), celular)
             WHERE id = ?`,
            [cedula, correo, celular, row.id],
            (err) => {
              if (err) return callback(err);
              console.log(`✅ Cliente existente encontrado por nombre: ${nombre}, ID: ${row.id}`);
              callback(null, { id: row.id, existente: true });
            }
          );
        } else {
          insertarCliente();
        }
      }
    );
  }

  function insertarCliente() {
    db.db.run(
      `INSERT INTO clientes (nombre, cedula, correo, celular)
       VALUES (?, ?, ?, ?)`,
      [nombre, cedula || null, correo || null, celular || null],
      function (err) {
        if (err) return callback(err);
        console.log('✅ Cliente nuevo creado con ID:', this.lastID);
        callback(null, { id: this.lastID, nuevo: true });
      }
    );
  }
}

async function guardarCostoAdicional(ventaId, costo) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO costos_adicionales (venta_id, concepto, monto)
      VALUES (?, ?, ?)
    `;

    db.db.run(query, [ventaId, costo.concepto, costo.monto], (err) => {
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

    db.db.run(query, [ventaId, clienteId, clienteNombre, montoTotal, montoPagado, montoPendiente], (err) => {
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




async function guardarDetalleVenta(ventaId, producto) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO venta_productos (venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.db.run(
      query,
      [ventaId, producto.producto_id, producto.variante_id, producto.cantidad, producto.precio_unitario, producto.subtotal],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function actualizarStock(producto, ventaId) {
  return new Promise((resolve, reject) => {
    if (!producto.variante_id) return resolve();

    // ✅ NO descontamos stock aquí (ya lo hace db.ventas.crear internamente)
    // Solo registramos en historial de rotación y actualizamos fechas

    db.db.run(
      `INSERT INTO historial_ventas_variante
       (variante_id, producto_id, venta_id, cantidad_vendida, precio_venta, fecha_venta)
       VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      [producto.variante_id, producto.producto_id, ventaId, producto.cantidad, producto.precio_unitario],
      (errH) => {
        if (errH) {
          console.error('⚠️ Error historial variante:', errH);
        }

        db.db.run(
          `UPDATE variantes_producto SET
             fecha_primera_venta = COALESCE(fecha_primera_venta, datetime('now', 'localtime')),
             fecha_ultima_venta  = datetime('now', 'localtime'),
             total_unidades_vendidas = COALESCE(total_unidades_vendidas, 0) + ?
           WHERE id = ?`,
          [producto.cantidad, producto.variante_id],
          (errF) => {
            if (errF) console.error('⚠️ Error fechas variante:', errF);
            resolve();
          }
        );
      }
    );
  });
}





// Obtener todas las ventas
ipcMain.handle('obtener-ventas', async () => {
  return new Promise((resolve, reject) => {
    db.ventas.obtener((err, ventas) => {
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


ipcMain.handle('obtener-venta-por-id', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.db.get(`SELECT * FROM ventas WHERE id = ?`, [id], (err, venta) => {
      if (err) {
        console.error('❌ Error al obtener venta:', err);
        reject(err);
        return;
      }
      if (!venta) {
        reject(new Error('Venta no encontrada'));
        return;
      }

      console.log('📦 Venta encontrada:', venta);

      // Obtener productos propios ← AGREGADO: costos_adicionales_producto y costo_unitario_total
      db.db.all(
        `SELECT
          vp.id,
          vp.venta_id,
          vp.producto_id,
          vp.variante_id,
          vp.cantidad,
          vp.precio_unitario,
          p.nombre as producto_nombre,
          p.referencia as producto_referencia,
          p.costo_base,
          COALESCE(
            (SELECT SUM(cap.monto)
             FROM costos_adicionales_producto cap
             WHERE cap.producto_id = p.id),
            0
          ) as costos_adicionales_producto,
          (p.costo_base + COALESCE(
            (SELECT SUM(cap.monto)
             FROM costos_adicionales_producto cap
             WHERE cap.producto_id = p.id),
            0
          )) as costo_unitario_total,
          v.talla as talla,
          (vp.cantidad * vp.precio_unitario) as subtotal,
          'Propio' as tipo
        FROM venta_productos vp
        LEFT JOIN productos p ON vp.producto_id = p.id
        LEFT JOIN variantes_producto v ON vp.variante_id = v.id
        WHERE vp.venta_id = ?`,
        [id],
        (err, productos) => {
          if (err) {
            console.error('❌ Error al obtener productos:', err);
            reject(err);
            return;
          }

          console.log('📦 Productos propios encontrados:', productos);

          // Obtener productos de marcas aliadas
          db.db.all(
            `SELECT
              vma.id,
              vma.venta_id,
              vma.producto_marca_id,
              vma.variante_id,
              vma.cantidad,
              vma.precio_unitario,
              vma.subtotal,
              vma.comision_marca,
              vma.ganancia_tienda,
              pma.nombre as producto_nombre,
              pma.referencia as producto_referencia,
              vma_var.talla as talla,
              ma.nombre as marca_nombre,
              'marca_aliada' as tipo_producto
            FROM ventas_marca_aliada vma
            LEFT JOIN productos_marca_aliada pma ON vma.producto_marca_id = pma.id
            LEFT JOIN variantes_marca_aliada vma_var ON vma.variante_id = vma_var.id
            LEFT JOIN marcas_aliadas ma ON vma.marca_aliada_id = ma.id
            WHERE vma.venta_id = ?`,
            [id],
            (err, productosMarca) => {
              if (err) {
                console.error('❌ Error al obtener productos marca aliada:', err);
                reject(err);
                return;
              }

              console.log('💜 Productos marca aliada encontrados:', productosMarca);

              // Obtener costos adicionales
              db.db.all(
                `SELECT * FROM costos_adicionales WHERE venta_id = ?`,
                [id],
                (err, costosAdicionales) => {
                  if (err) {
                    console.error('❌ Error al obtener costos adicionales:', err);
                    reject(err);
                    return;
                  }

                  console.log('💰 Costos adicionales:', costosAdicionales);

                  const totalCostosAdicionales = costosAdicionales
                    ? costosAdicionales.reduce((sum, costo) => sum + Number(costo.monto || 0), 0)
                    : 0;

                  // ── Construir items unificados (igual que usa el Excel) ──
                  const itemsPropios = (productos || []).map(p => ({
                    nombre: p.producto_nombre,
                    talla: p.talla,
                    cantidad: p.cantidad,
                    precio: p.precio_unitario,
                    costo_unitario: p.costo_unitario_total, // costo_base + costos_adicionales_producto
                    tipo: 'Propio',
                    subtotal: p.subtotal
                  }));

                  const itemsMarcas = (productosMarca || []).map(p => ({
                    nombre: p.producto_nombre,
                    talla: p.talla,
                    cantidad: p.cantidad,
                    precio: p.precio_unitario,
                    ganancia_tienda: p.ganancia_tienda,
                    tipo: p.marca_nombre || 'Marca Aliada',
                    subtotal: p.subtotal
                  }));

                  const todosLosProductos = [
                    ...(productos || []),
                    ...(productosMarca || [])
                  ];

                  const resultado = {
                    ...venta,
                    productos: todosLosProductos,
                    productos_propios: productos || [],
                    productos_marca_aliada: productosMarca || [],
                    costos_adicionales: costosAdicionales || [],
                    total_costos_adicionales: totalCostosAdicionales,
                    items: [...itemsPropios, ...itemsMarcas] // ← para el cálculo de ganancia
                  };

                  console.log('✅ Resultado final:', resultado);
                  resolve(resultado);
                }
              );
            }
          );
        }
      );
    });
  });
});

// Buscar ventas
ipcMain.handle('buscar-ventas', async (event, termino) => {
  return new Promise((resolve, reject) => {
    db.ventas.buscar(termino, (err, ventas) => {
      if (err) reject(err);
      else resolve(ventas);
    });
  });
});

// Obtener estadísticas de ventas
ipcMain.handle('obtener-estadisticas-ventas', async () => {
  return new Promise((resolve, reject) => {
    db.ventas.obtenerEstadisticas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

ipcMain.handle('cancelar-venta', async (event, ventaId) => {
  return new Promise((resolve, reject) => {
    db.db.serialize(() => {
      db.db.run('BEGIN TRANSACTION');

      // 1. Obtener información de la venta ANTES de cancelarla
      db.db.get('SELECT cliente_id, total, estado FROM ventas WHERE id = ?', [ventaId], (err, venta) => {
        if (err) {
          db.db.run('ROLLBACK');
          console.error('❌ Error al obtener venta:', err);
          reject(err);
          return;
        }

        if (!venta) {
          db.db.run('ROLLBACK');
          reject(new Error('Venta no encontrada'));
          return;
        }

        // Verificar que no esté ya cancelada
        if (venta.estado === 'Cancelado') {
          db.db.run('ROLLBACK');
          resolve({ success: false, error: 'La venta ya está cancelada' });
          return;
        }

        console.log(`🔄 Cancelando venta ${ventaId} - Cliente: ${venta.cliente_id}, Total: $${venta.total}`);

        // 2. Obtener los productos de la venta para restaurar stock
        db.db.all('SELECT producto_id, variante_id, cantidad FROM venta_productos WHERE venta_id = ?', [ventaId], (err, productos) => {
          if (err) {
            db.db.run('ROLLBACK');
            console.error('❌ Error al obtener productos:', err);
            reject(err);
            return;
          }

          console.log(`📦 Productos a restaurar: ${productos.length}`);

// 3. Restaurar stock de productos PROPIOS
        let erroresStock = [];
        let procesadosPropios = 0;

        const restaurarStockPropios = () => {
          return new Promise((resolve) => {
            if (productos.length === 0) {
              resolve();
              return;
            }

            productos.forEach((item) => {
              if (item.variante_id) {
                db.db.run(
                  'UPDATE variantes_producto SET cantidad = cantidad + ? WHERE id = ?',
                  [item.cantidad, item.variante_id],
                  (err) => {
                    if (err) {
                      console.error(`❌ Error al restaurar stock de variante ${item.variante_id}:`, err);
                      erroresStock.push(err);
                    } else {
                      console.log(`✅ Stock restaurado: Variante ${item.variante_id} +${item.cantidad}`);
                    }
                    procesadosPropios++;
                    if (procesadosPropios === productos.length) resolve();
                  }
                );
              } else {
                procesadosPropios++;
                if (procesadosPropios === productos.length) resolve();
              }
            });
          });
        };

        // 4. Restaurar stock de productos de MARCAS ALIADAS
        const restaurarStockMarcasAliadas = () => {
          return new Promise((resolve) => {
            db.db.all(
              'SELECT variante_id, cantidad FROM ventas_marca_aliada WHERE venta_id = ?',
              [ventaId],
              (err, productosMarca) => {
                if (err) {
                  console.error('❌ Error al obtener productos marca aliada:', err);
                  erroresStock.push(err);
                  resolve();
                  return;
                }

                if (!productosMarca || productosMarca.length === 0) {
                  console.log('ℹ️ No hay productos de marcas aliadas para restaurar');
                  resolve();
                  return;
                }

                console.log(`🔄 Restaurando stock de ${productosMarca.length} productos de marcas aliadas...`);

                let procesadosMarca = 0;
                productosMarca.forEach((item) => {
                  if (item.variante_id) {
                    db.db.run(
                      'UPDATE variantes_marca_aliada SET cantidad = cantidad + ? WHERE id = ?',
                      [item.cantidad, item.variante_id],
                      (err) => {
                        if (err) {
                          console.error(`❌ Error al restaurar stock marca aliada ${item.variante_id}:`, err);
                          erroresStock.push(err);
                        } else {
                          console.log(`✅ Stock marca aliada restaurado: Variante ${item.variante_id} +${item.cantidad}`);
                        }
                        procesadosMarca++;
                        if (procesadosMarca === productosMarca.length) resolve();
                      }
                    );
                  } else {
                    procesadosMarca++;
                    if (procesadosMarca === productosMarca.length) resolve();
                  }
                });
              }
            );
          });
        };

        // Ejecutar restauración de ambos tipos de stock
        Promise.all([restaurarStockPropios(), restaurarStockMarcasAliadas()])
          .then(() => {
            if (erroresStock.length > 0) {
              db.db.run('ROLLBACK');
              reject(erroresStock[0]);
              return;
            }
            continuarCancelacion();
          })
          .catch((error) => {
            console.error('❌ Error en restauración de stock:', error);
            db.db.run('ROLLBACK');
            reject(error);
          });


          function continuarCancelacion() {
            if (erroresStock.length > 0) {
              db.db.run('ROLLBACK');
              reject(erroresStock[0]);
              return;
            }

            // 4. ✅ REVERTIR ESTADÍSTICAS DEL CLIENTE (si tiene cliente asociado)
            if (venta.cliente_id) {
              console.log(`🔄 Revirtiendo estadísticas del cliente ${venta.cliente_id}`);

              db.db.run(
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
                    db.db.run('ROLLBACK');
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
              // 5a. Cancelar la deuda asociada a esta venta (si existe)
              db.db.run(
                `UPDATE deudas_clientes
                 SET estado = 'Cancelado', fecha_actualizado = datetime('now', 'localtime')
                 WHERE venta_id = ? AND estado = 'Pendiente'`,
                [ventaId],
                (err) => {
                  if (err) {
                    console.error('❌ Error al cancelar deuda asociada:', err);
                  } else {
                    console.log(`✅ Deuda asociada a venta ${ventaId} cancelada`);
                  }
                }
              );

              // ✅ NUEVO: Revertir el movimiento de caja asociado a esta venta
              db.db.get(
                `SELECT id, monto FROM caja_movimientos
                 WHERE origen = 'venta' AND referencia_id = ? LIMIT 1`,
                [ventaId],
                (err, movCaja) => {
                  if (!err && movCaja) {
                    // Registrar una salida que anule la entrada original
                    cajaModel.registrarMovimiento({
                      tipo: 'salida',
                      concepto: `Venta cancelada #${ventaId} — reversión`,
                      monto: movCaja.monto,
                      origen: 'manual',
                      referencia_id: ventaId
                    }, (errCaja) => {
                      if (errCaja) {
                        console.error('⚠️ Error al revertir caja por cancelación:', errCaja);
                      } else {
                        console.log(`✅ Movimiento de caja revertido por cancelación de venta ${ventaId}`);
                      }
                    });
                  }
                }
              );

              // 5b. Marcar la venta como cancelada
              db.db.run(
                "UPDATE ventas SET estado = 'Cancelado' WHERE id = ?",
                [ventaId],
                (err) => {
                  if (err) {
                    db.db.run('ROLLBACK');
                    console.error('❌ Error al actualizar estado de venta:', err);
                    reject(err);
                  } else {
                    db.db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Error al hacer commit:', err);
                        reject(err);
                      } else {
                        console.log(`✅ Venta ${ventaId} cancelada correctamente`);
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


// ==================== IPC CLIENTES ====================

// Actualizar nombre del cliente en una venta específica
ipcMain.handle('actualizar-nombre-cliente-venta', async (event, ventaId, nuevoNombre) => {
  return new Promise((resolve, reject) => {
    db.db.run(
      'UPDATE ventas SET cliente_nombre = ? WHERE id = ?',
      [nuevoNombre, ventaId],
      function (err) {
        if (err) {
          console.error('Error al actualizar nombre en venta:', err);
          reject(err);
        } else {
          console.log(`✅ Nombre actualizado en venta ${ventaId}: ${nuevoNombre}`);
          resolve({ success: true });
        }
      }
    );
  });
});


// ==================== IPC HANDLERS PARA DEUDAS DE CLIENTES ====================

// Obtener deudas de clientes
ipcMain.handle('obtener-deudas-clientes', async () => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.obtener((err, deudas) => {
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
    db.deudasClientes.obtenerPorId(id, (err, deuda) => {
      if (err) reject(err);
      else resolve(deuda);
    });
  });
});

// Registrar abono a deuda de cliente
ipcMain.handle('registrar-abono-deuda-cliente', async (event, deudaId, montoAbono, metodoPago, notas) => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.registrarAbono(deudaId, montoAbono, metodoPago, notas, (err, resultado) => {
      if (err) {
        console.error('❌ Error al registrar abono:', err);
        reject(err);
      } else {
        console.log('✅ Abono registrado:', resultado);

        // ✅ Registrar entrada en caja automáticamente
        db.db.get('SELECT cliente_nombre FROM deudas_clientes WHERE id = ?', [deudaId], (errQ, deuda) => {
          const nombreCliente = deuda?.cliente_nombre || 'Cliente';
          cajaModel.registrarMovimiento({
            tipo: 'entrada',
            concepto: `Abono de deuda — ${nombreCliente}`,
            monto: montoAbono,
            origen: 'venta',
            referencia_id: deudaId
          }, (errCaja) => {
            if (errCaja) console.error('⚠️ Error al registrar abono en caja:', errCaja);
          });
        });

        resolve(resultado);
      }
    });
  });
});

// Obtener deudas por cliente
ipcMain.handle('obtener-deudas-por-cliente', async (event, clienteId) => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.obtenerPorCliente(clienteId, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Buscar deudas de clientes
ipcMain.handle('buscar-deudas-clientes', async (event, termino) => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.buscar(termino, (err, deudas) => {
      if (err) reject(err);
      else resolve(deudas);
    });
  });
});

// Obtener estadísticas de deudas de clientes
ipcMain.handle('obtener-estadisticas-deudas-clientes', async () => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.obtenerEstadisticas((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
});

// Obtener historial de abonos
ipcMain.handle('obtener-historial-abonos', async (event, deudaId) => {
  return new Promise((resolve, reject) => {
    db.deudasClientes.obtenerHistorialAbonos(deudaId, (err, abonos) => {
      if (err) reject(err);
      else resolve(abonos);
    });
  });
});



// ✅ REEMPLAZAR HANDLER EN electron.js

ipcMain.handle('obtener-dashboard-stats', async () => {
  return new Promise((resolve, reject) => {
    db.db.serialize(() => {
      let estadisticas = {
        ventasTotales: 0,
        ventasMesAnterior: 0,
        gastosTotales: 0,
        gastosMesAnterior: 0,
        gastosInventario: 0,
        gastosInventarioMesAnterior: 0,
        costoProductosVendidos: 0,
        costosAdicionales: 0,
        comisionMarcas: 0, // ✅ NUEVO: Lo que PAGAS a las marcas
        gananciaMarcasAliadas: 0, // Tu ganancia de marcas
        gananciaMarcasAliadasTotal: 0,
        gananciaBruta: 0,
        gananciaNeta: 0,
        deudasPendientes: 0,
        clientesConDeuda: 0,
        itemsInventario: 0,
        productosStockBajo: 0
      };

      let actividades = [];

      // 1. Ventas del mes actual
      db.db.get(`
        SELECT SUM(monto_pagado - cambio) as total
        FROM ventas
        WHERE estado != 'Cancelado'
        AND date(fecha) >= date('now', 'start of month')
      `, [], (err, row) => {
        if (!err && row) {
          estadisticas.ventasTotales = row.total || 0;
        }

        // 2. Ventas del mes anterior
        db.db.get(`
            SELECT SUM(monto_pagado - cambio) as total
            FROM ventas
            WHERE estado != 'Cancelado'
            AND date(fecha) >= date('now', 'start of month')
          AND date(fecha) < date('now', 'start of month')
        `, [], (err, row) => {
          if (!err && row) {
            estadisticas.ventasMesAnterior = row.total || 0;
          }

          // 3. Gastos operativos del mes actual
          db.db.get(`
            SELECT SUM(monto) as total
            FROM gastos
            WHERE date(fecha) >= date('now', 'start of month')
            AND categoria NOT IN ('Inventario', 'Proveedores')
          `, [], (err, row) => {
            if (!err && row) {
              estadisticas.gastosTotales = row.total || 0;
            }

            // 4. Gastos operativos del mes anterior
            db.db.get(`
              SELECT SUM(monto) as total
              FROM gastos
              WHERE date(fecha) >= date('now', 'start of month', '-1 month')
              AND date(fecha) < date('now', 'start of month')
              AND categoria NOT IN ('Inventario', 'Proveedores')
            `, [], (err, row) => {
              if (!err && row) {
                estadisticas.gastosMesAnterior = row.total || 0;
              }

              // 5. Gastos de inventario del mes actual
              db.db.get(`
                SELECT SUM(monto) as total
                FROM gastos
                WHERE date(fecha) >= date('now', 'start of month')
                AND categoria IN ('Inventario', 'Proveedores')
              `, [], (err, row) => {
                if (!err && row) {
                  estadisticas.gastosInventario = row.total || 0;
                }

                // 6. Gastos de inventario del mes anterior
                db.db.get(`
                  SELECT SUM(monto) as total
                  FROM gastos
                  WHERE date(fecha) >= date('now', 'start of month', '-1 month')
                  AND date(fecha) < date('now', 'start of month')
                  AND categoria IN ('Inventario', 'Proveedores')
                `, [], (err, row) => {
                  if (!err && row) {
                    estadisticas.gastosInventarioMesAnterior = row.total || 0;
                  }

                  // 7. Costo de productos propios vendidos
                    db.db.get(`
                      SELECT COALESCE(
                        SUM(
                          vp.cantidad * (
                            p.costo_base +
                            COALESCE(
                              (SELECT SUM(cap.monto)
                               FROM costos_adicionales_producto cap
                               WHERE cap.producto_id = p.id),
                              0
                            )
                          )
                        ),
                        0
                      ) as total
                      FROM venta_productos vp
                      INNER JOIN productos p ON vp.producto_id = p.id
                      INNER JOIN ventas v ON vp.venta_id = v.id
                      WHERE v.estado != 'Cancelado'
                      AND date(v.fecha) >= date('now', 'start of month')
                    `, [], (err, row) => {
                      if (!err && row) {
                        estadisticas.costoProductosVendidos = row.total || 0;
                      }


                    // 8. Costos adicionales
                    db.db.get(`
                      SELECT COALESCE(SUM(ca.monto), 0) as total
                      FROM costos_adicionales ca
                      INNER JOIN ventas v ON ca.venta_id = v.id
                      WHERE v.estado != 'Cancelado'
                      AND date(v.fecha) >= date('now', 'start of month')
                    `, [], (err, row) => {
                      if (!err && row) {
                        estadisticas.costosAdicionales = row.total || 0;
                      }

                      // ✅ 9. NUEVO: Comisión que PAGAS a las marcas (es un COSTO)
                      db.db.get(`
                        SELECT COALESCE(SUM(vma.comision_marca), 0) as total
                        FROM ventas_marca_aliada vma
                        INNER JOIN ventas v ON vma.venta_id = v.id
                        WHERE v.estado != 'Cancelado'
                        AND date(v.fecha) >= date('now', 'start of month')
                      `, [], (err, row) => {
                        if (!err && row) {
                          estadisticas.comisionMarcas = row.total || 0;
                        }

                        // 10. Tu ganancia de marcas aliadas (mes actual)
                        db.db.get(`
                          SELECT COALESCE(SUM(vma.ganancia_tienda), 0) as total
                          FROM ventas_marca_aliada vma
                          INNER JOIN ventas v ON vma.venta_id = v.id
                          WHERE v.estado != 'Cancelado'
                          AND date(v.fecha) >= date('now', 'start of month')
                        `, [], (err, row) => {
                          if (!err && row) {
                            estadisticas.gananciaMarcasAliadas = row.total || 0;
                          }

                          // 11. Tu ganancia de marcas aliadas (histórico)
                          db.db.get(`
                            SELECT COALESCE(SUM(vma.ganancia_tienda), 0) as total
                            FROM ventas_marca_aliada vma
                            INNER JOIN ventas v ON vma.venta_id = v.id
                            WHERE v.estado != 'Cancelado'
                          `, [], (err, row) => {
                            if (!err && row) {
                              estadisticas.gananciaMarcasAliadasTotal = row.total || 0;
                            }

                            // ✅ CALCULAR GANANCIAS CORRECTAMENTE
                            // Ganancia Bruta = Ventas - TODOS los costos (propios + comisión marcas)
                            estadisticas.gananciaBruta = estadisticas.ventasTotales -
                                                         estadisticas.costoProductosVendidos -
                                                         estadisticas.costosAdicionales -
                                                         estadisticas.comisionMarcas; // ← ESTO FALTABA

                            // Ganancia Neta = Ganancia Bruta - Gastos Operativos
                            estadisticas.gananciaNeta = estadisticas.gananciaBruta -
                                                       estadisticas.gastosTotales;

                            // 12. Deudas pendientes
                            db.db.get(`
                              SELECT SUM(monto_pendiente) as total, COUNT(DISTINCT cliente_id) as clientes
                              FROM deudas_clientes
                              WHERE estado = 'Pendiente'
                            `, [], (err, row) => {
                              if (!err && row) {
                                estadisticas.deudasPendientes = row.total || 0;
                                estadisticas.clientesConDeuda = row.clientes || 0;
                              }

                              // 13. Inventario
                              db.db.get(`
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

                                // 14. Actividad reciente
                                obtenerActividadReciente((actividadesResult) => {
                                  actividades = actividadesResult;

                                  console.log('📊 Estadísticas calculadas CORRECTAMENTE:');
                                  console.log('  - Ventas totales:', estadisticas.ventasTotales);
                                  console.log('  - Costo productos propios:', estadisticas.costoProductosVendidos);
                                  console.log('  - Costos adicionales:', estadisticas.costosAdicionales);
                                  console.log('  - Comisión marcas (COSTO):', estadisticas.comisionMarcas);
                                  console.log('  - Ganancia bruta:', estadisticas.gananciaBruta);
                                  console.log('  - Gastos operativos:', estadisticas.gastosTotales);
                                  console.log('  - Ganancia neta:', estadisticas.gananciaNeta);
                                  console.log('  - Tu ganancia marcas:', estadisticas.gananciaMarcasAliadas);

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
  db.db.all(`
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
    db.db.all(`
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
      db.db.all(`
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
        db.db.all(`
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

// ✅ REEMPLAZAR EN electron.js

ipcMain.handle('obtener-datos-grafica', async () => {
  return new Promise((resolve, reject) => {
    const meses = [];
    const hoy = new Date();

    // Generar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push({
        fecha: fecha,
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        ventas: 0,
        costoProductos: 0,
        costosAdicionales: 0,
        comisionMarcas: 0, // ✅ NUEVO
        gastos: 0,
        gananciaMarcas: 0,
        ganancia: 0
      });
    }

    let promesas = [];

    // 1. Ventas
    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

      promesas.push(
        new Promise((resolveVenta) => {
          db.db.get(`
            SELECT COALESCE(SUM(monto_pagado - cambio), 0) as total
            FROM ventas
            WHERE estado != 'Cancelado'
            AND date(fecha) BETWEEN date(?) AND date(?)
          `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
          (err, row) => {
            if (!err && row) {
              meses[index].ventas = row.total || 0;
            }
            resolveVenta();
          });
        })
      );
    });

// 2. Costo productos propios (CORREGIDO: ahora incluye costos adicionales del producto)
meses.forEach((mes, index) => {
  const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
  const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

  promesas.push(
    new Promise((resolveCosto) => {
      db.db.get(`
        SELECT COALESCE(
          SUM(
            vp.cantidad * (
              p.costo_base +
              COALESCE(
                (SELECT SUM(cap.monto)
                 FROM costos_adicionales_producto cap
                 WHERE cap.producto_id = p.id),
                0
              )
            )
          ),
          0
        ) as total
        FROM venta_productos vp
        INNER JOIN productos p ON vp.producto_id = p.id
        INNER JOIN ventas v ON vp.venta_id = v.id
        WHERE v.estado != 'Cancelado'
        AND date(v.fecha) BETWEEN date(?) AND date(?)
      `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
      (err, row) => {
        if (!err && row) {
          meses[index].costoProductos = row.total || 0;
        }
        resolveCosto();
      });
    })
  );
});

    // 3. Costos adicionales
    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

      promesas.push(
        new Promise((resolveCostoAd) => {
          db.db.get(`
            SELECT COALESCE(SUM(ca.monto), 0) as total
            FROM costos_adicionales ca
            INNER JOIN ventas v ON ca.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
          (err, row) => {
            if (!err && row) {
              meses[index].costosAdicionales = row.total || 0;
            }
            resolveCostoAd();
          });
        })
      );
    });

    // ✅ 4. NUEVO: Comisión marcas (COSTO)
    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

      promesas.push(
        new Promise((resolveComision) => {
          db.db.get(`
            SELECT COALESCE(SUM(vma.comision_marca), 0) as total
            FROM ventas_marca_aliada vma
            INNER JOIN ventas v ON vma.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
          (err, row) => {
            if (!err && row) {
              meses[index].comisionMarcas = row.total || 0;
            }
            resolveComision();
          });
        })
      );
    });

    // 5. Gastos operativos
    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

      promesas.push(
        new Promise((resolveGasto) => {
          db.db.get(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM gastos
            WHERE date(fecha) BETWEEN date(?) AND date(?)
            AND categoria NOT IN ('Inventario', 'Proveedores')
          `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
          (err, row) => {
            if (!err && row) {
              meses[index].gastos = row.total || 0;
            }
            resolveGasto();
          });
        })
      );
    });

    // 6. Ganancia marcas (tu parte)
    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);

      promesas.push(
        new Promise((resolveGanancia) => {
          db.db.get(`
            SELECT COALESCE(SUM(vma.ganancia_tienda), 0) as total
            FROM ventas_marca_aliada vma
            INNER JOIN ventas v ON vma.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [inicioMes.toISOString().split('T')[0], finMes.toISOString().split('T')[0]],
          (err, row) => {
            if (!err && row) {
              meses[index].gananciaMarcas = row.total || 0;
            }
            resolveGanancia();
          });
        })
      );
    });

    // Esperar y calcular
    Promise.all(promesas)
      .then(() => {
        // ✅ FÓRMULA CORRECTA
        meses.forEach(mes => {
          mes.ganancia = mes.ventas -
                        mes.costoProductos -
                        mes.costosAdicionales -
                        mes.comisionMarcas -  // ← ESTO FALTABA
                        mes.gastos;
        });

        console.log('📈 Datos de gráfica (CORREGIDOS):');
        meses.forEach(mes => {
          console.log(`  ${mes.mes}:`);
          console.log(`    Ventas: ${mes.ventas.toFixed(2)}`);
          console.log(`    - Costo productos: ${mes.costoProductos.toFixed(2)}`);
          console.log(`    - Costos adicionales: ${mes.costosAdicionales.toFixed(2)}`);
          console.log(`    - Comisión marcas: ${mes.comisionMarcas.toFixed(2)}`);
          console.log(`    - Gastos operativos: ${mes.gastos.toFixed(2)}`);
          console.log(`    = Ganancia: ${mes.ganancia.toFixed(2)}`);
        });

        resolve(meses);
      })
      .catch(err => {
        console.error('❌ Error:', err);
        reject(err);
      });
  });
});


ipcMain.handle('obtener-top-productos', async () => {
  return new Promise((resolve, reject) => {
    // Obtener fecha de hace 6 meses
    const fechaActual = new Date();
    const hace6Meses = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 6, 1);
    const fechaInicio = `${hace6Meses.getFullYear()}-${String(hace6Meses.getMonth() + 1).padStart(2, '0')}-01`;

    db.db.all(`
      SELECT
        p.id,
        p.nombre,
        p.referencia as codigo,
        SUM(vp.cantidad) as cantidad,
        SUM(vp.precio_unitario * vp.cantidad) as total_ventas
      FROM venta_productos vp
      INNER JOIN productos p ON vp.producto_id = p.id
      INNER JOIN ventas v ON vp.venta_id = v.id
      WHERE v.estado != 'Cancelado'
      AND date(v.fecha) >= date(?)
      GROUP BY p.id, p.nombre, p.referencia
      ORDER BY cantidad DESC
      LIMIT 5
    `, [fechaInicio], (err, rows) => {
      if (err) {
        console.error('Error al obtener top productos:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
});


// ============================================
// ESTADÍSTICAS CON CÁLCULO PROPORCIONAL AL PAGO
// ============================================

// ============================================
// UTILIDADES PARA CÁLCULO DE FECHAS
// ============================================

function generarMesesEntreFechas(fechaInicio, fechaFin) {
  const meses = [];
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const mesActual = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const mesFinal = new Date(fin.getFullYear(), fin.getMonth(), 1);

  while (mesActual <= mesFinal) {
    meses.push({
      fecha: new Date(mesActual),
      mes: mesActual.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      ventas: 0,
      ventasPropias: 0,
      ventasMarcasAliadas: 0,
      costoProductos: 0,
      costosAdicionales: 0,
      ingresoMarcasAliadas: 0,
      gastos: 0,
      ganancia: 0
    });
    mesActual.setMonth(mesActual.getMonth() + 1);
  }

  return meses;
}

function calcularPeriodoAnterior(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferenciaDias = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
  const anteriorFin = new Date(inicio);
  anteriorFin.setDate(anteriorFin.getDate() - 1);
  const anteriorInicio = new Date(anteriorFin);
  anteriorInicio.setDate(anteriorInicio.getDate() - diferenciaDias);

  return {
    inicio: anteriorInicio.toISOString().split('T')[0],
    fin: anteriorFin.toISOString().split('T')[0]
  };
}

// ============================================
// HANDLER: Obtener estadísticas por período (PROPORCIONAL)
// ============================================

ipcMain.handle('obtener-estadisticas-periodo', async (event, periodo) => {
  return new Promise((resolve, reject) => {
    const { inicio: fechaInicio, fin: fechaFin } = periodo;
    const periodoAnterior = calcularPeriodoAnterior(fechaInicio, fechaFin);

    db.db.serialize(() => {
      let estadisticas = {
        ventasTotales: 0,
        ventasMesAnterior: 0,
        ventasPropias: 0,
        ventasMarcasAliadas: 0,
        ingresosReales: 0,
        costoProductosVendidos: 0,
        costosAdicionales: 0,
        ingresoMarcasAliadas: 0,
        gastosTotales: 0,
        gastosMesAnterior: 0,
        gastosInventario: 0,
        gananciaBruta: 0,
        gananciaNeta: 0,
        margenBruto: 0,
        margenNeto: 0
      };

      // 1. Ventas TOTALES (solo monto pagado)
      db.db.get(`
        SELECT SUM(monto_pagado - cambio) as total
        FROM ventas
        WHERE estado != 'Cancelado'
        AND monto_pagado > 0
        AND date(fecha) BETWEEN date(?) AND date(?)
      `, [fechaInicio, fechaFin], (err, row) => {
        if (!err && row) {
          estadisticas.ventasTotales = row.total || 0;
        }

        // 2. Ventas del período anterior
        db.db.get(`
            SELECT SUM(monto_pagado - cambio) as total
            FROM ventas
            WHERE estado != 'Cancelado'
            AND monto_pagado > 0
            AND date(fecha) BETWEEN date(?) AND date(?)
        `, [periodoAnterior.inicio, periodoAnterior.fin], (err, row) => {
          if (!err && row) {
            estadisticas.ventasMesAnterior = row.total || 0;
          }

          // 3. Ventas PROPIAS (PROPORCIONAL al pago)
          db.db.get(`
            SELECT COALESCE(
                SUM(
                  (vp.precio_unitario * vp.cantidad / v.subtotal)
                  * (v.monto_pagado - v.cambio)
                ),
              0
            ) as total
            FROM venta_productos vp
            INNER JOIN ventas v ON vp.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND v.total > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicio, fechaFin], (err, row) => {
            if (!err && row) {
              estadisticas.ventasPropias = row.total || 0;
            }

            // 4. Ventas MARCAS ALIADAS (monto total pagado de ventas con marcas)
            db.db.get(`
              SELECT COALESCE(SUM(DISTINCT (v.monto_pagado - v.cambio)), 0) as total
              FROM ventas v
              INNER JOIN ventas_marca_aliada vma ON vma.venta_id = v.id
              WHERE v.estado != 'Cancelado'
              AND v.monto_pagado > 0
              AND date(v.fecha) BETWEEN date(?) AND date(?)
            `, [fechaInicio, fechaFin], (err, row) => {
              if (!err && row) {
                estadisticas.ventasMarcasAliadas = row.total || 0;
              }

              // 5. Tu INGRESO de marcas aliadas (PROPORCIONAL al pago)
              db.db.get(`
                SELECT COALESCE(
                  SUM(vma.ganancia_tienda * ((v.monto_pagado - v.cambio) / v.total)),
                  0
                ) as total
                FROM ventas_marca_aliada vma
                INNER JOIN ventas v ON vma.venta_id = v.id
                WHERE v.estado != 'Cancelado'
                AND v.monto_pagado > 0
                AND v.total > 0
                AND date(v.fecha) BETWEEN date(?) AND date(?)
              `, [fechaInicio, fechaFin], (err, row) => {
                if (!err && row) {
                  estadisticas.ingresoMarcasAliadas = row.total || 0;
                }

                // 6. Gastos operativos del período actual
                db.db.get(`
                  SELECT SUM(monto) as total
                  FROM gastos
                  WHERE date(fecha) BETWEEN date(?) AND date(?)
                  AND categoria NOT IN ('Inventario', 'Proveedores')
                `, [fechaInicio, fechaFin], (err, row) => {
                  if (!err && row) {
                    estadisticas.gastosTotales = row.total || 0;
                  }

                  // 7. Gastos del período anterior
                  db.db.get(`
                    SELECT SUM(monto) as total
                    FROM gastos
                    WHERE date(fecha) BETWEEN date(?) AND date(?)
                    AND categoria NOT IN ('Inventario', 'Proveedores')
                  `, [periodoAnterior.inicio, periodoAnterior.fin], (err, row) => {
                    if (!err && row) {
                      estadisticas.gastosMesAnterior = row.total || 0;
                    }

                    // 8. Gastos de inventario
                    db.db.get(`
                      SELECT SUM(monto) as total
                      FROM gastos
                      WHERE date(fecha) BETWEEN date(?) AND date(?)
                      AND categoria IN ('Inventario', 'Proveedores')
                    `, [fechaInicio, fechaFin], (err, row) => {
                      if (!err && row) {
                        estadisticas.gastosInventario = row.total || 0;
                      }

                      // 9. Costo productos PROPIOS (PROPORCIONAL al pago)
                      db.db.get(`
                        SELECT COALESCE(
                          SUM(
                            vp.cantidad * (
                              p.costo_base +
                              COALESCE(
                                (SELECT SUM(cap.monto)
                                 FROM costos_adicionales_producto cap
                                 WHERE cap.producto_id = p.id),
                                0
                              )
                            ) * ((v.monto_pagado - v.cambio) / v.total)
                          ),
                          0
                        ) as total
                        FROM venta_productos vp
                        INNER JOIN productos p ON vp.producto_id = p.id
                        INNER JOIN ventas v ON vp.venta_id = v.id
                        WHERE v.estado != 'Cancelado'
                        AND v.monto_pagado > 0
                        AND v.total > 0
                        AND date(v.fecha) BETWEEN date(?) AND date(?)
                      `, [fechaInicio, fechaFin], (err, row) => {
                        if (!err && row) {
                          estadisticas.costoProductosVendidos = row.total || 0;
                        }

                        // 10. Costos adicionales (PROPORCIONAL al pago)
                        db.db.get(`
                          SELECT COALESCE(
                            SUM(ca.monto * ((v.monto_pagado - v.cambio) / v.total)),
                            0
                          ) as total
                          FROM costos_adicionales ca
                          INNER JOIN ventas v ON ca.venta_id = v.id
                          WHERE v.estado != 'Cancelado'
                          AND v.monto_pagado > 0
                          AND v.total > 0
                          AND date(v.fecha) BETWEEN date(?) AND date(?)
                        `, [fechaInicio, fechaFin], (err, row) => {
                          if (!err && row) {
                            estadisticas.costosAdicionales = row.total || 0;
                          }

                          // CÁLCULOS FINALES
                          estadisticas.ingresosReales = estadisticas.ventasPropias + estadisticas.ingresoMarcasAliadas;
                          estadisticas.gananciaBruta = estadisticas.ingresosReales - estadisticas.costoProductosVendidos - estadisticas.costosAdicionales;
                          estadisticas.gananciaNeta = estadisticas.gananciaBruta - estadisticas.gastosTotales;

                          if (estadisticas.ingresosReales > 0) {
                            estadisticas.margenBruto = (estadisticas.gananciaBruta / estadisticas.ingresosReales) * 100;
                            estadisticas.margenNeto = (estadisticas.gananciaNeta / estadisticas.ingresosReales) * 100;
                          }

                          console.log('📊 Estadísticas proporcionales calculadas:');
                          console.log(`  Facturación total: $${estadisticas.ventasTotales.toFixed(2)}`);
                          console.log(`  Ventas propias: $${estadisticas.ventasPropias.toFixed(2)}`);
                          console.log(`  Ingreso marcas (10%): $${estadisticas.ingresoMarcasAliadas.toFixed(2)}`);
                          console.log(`  Ingresos reales: $${estadisticas.ingresosReales.toFixed(2)}`);
                          console.log(`  Ganancia neta: $${estadisticas.gananciaNeta.toFixed(2)}`);

                          resolve(estadisticas);
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
    });
  });
});

// ============================================
// HANDLER: Obtener gráfica (PROPORCIONAL)
// ============================================

ipcMain.handle('obtener-grafica-periodo', async (event, periodo) => {
  return new Promise((resolve, reject) => {
    const { inicio: fechaInicio, fin: fechaFin } = periodo;
    const meses = generarMesesEntreFechas(fechaInicio, fechaFin);
    let promesas = [];

    meses.forEach((mes, index) => {
      const inicioMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth(), 1);
      const finMes = new Date(mes.fecha.getFullYear(), mes.fecha.getMonth() + 1, 0);
      const fechaInicioReal = inicioMes < new Date(fechaInicio) ? fechaInicio : inicioMes.toISOString().split('T')[0];
      const fechaFinReal = finMes > new Date(fechaFin) ? fechaFin : finMes.toISOString().split('T')[0];

      // Ventas PROPIAS (PROPORCIONAL)
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(
            SUM(
              (vp.precio_unitario * vp.cantidad / v.subtotal)
              * (v.monto_pagado - v.cambio)
            ),
              0
            ) as total
            FROM venta_productos vp
            INNER JOIN ventas v ON vp.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND v.total > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].ventasPropias = row.total || 0;
            resolve();
          });
        })
      );

      // Ventas MARCAS ALIADAS (monto pagado)
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(SUM(DISTINCT (v.monto_pagado - v.cambio)), 0) as total

            FROM ventas v
            INNER JOIN ventas_marca_aliada vma ON vma.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].ventasMarcasAliadas = row.total || 0;
            resolve();
          });
        })
      );

      // INGRESO marcas (PROPORCIONAL)
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(
SUM(vma.ganancia_tienda * ((v.monto_pagado - v.cambio) / v.total)),
              0
            ) as total
            FROM ventas_marca_aliada vma
            INNER JOIN ventas v ON vma.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND v.total > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].ingresoMarcasAliadas = row.total || 0;
            resolve();
          });
        })
      );

      // Costo productos (PROPORCIONAL)
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(
              SUM(
                vp.cantidad * (
                  p.costo_base +
                  COALESCE(
                    (SELECT SUM(cap.monto)
                     FROM costos_adicionales_producto cap
                     WHERE cap.producto_id = p.id),
                    0
                  )
                ) * ((v.monto_pagado - v.cambio) / v.total)
              ),
              0
            ) as total
            FROM venta_productos vp
            INNER JOIN productos p ON vp.producto_id = p.id
            INNER JOIN ventas v ON vp.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND v.total > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].costoProductos = row.total || 0;
            resolve();
          });
        })
      );

      // Costos adicionales (PROPORCIONAL)
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(
              SUM(ca.monto * ((v.monto_pagado - v.cambio) / v.total),
              0
            ) as total
            FROM costos_adicionales ca
            INNER JOIN ventas v ON ca.venta_id = v.id
            WHERE v.estado != 'Cancelado'
            AND v.monto_pagado > 0
            AND v.total > 0
            AND date(v.fecha) BETWEEN date(?) AND date(?)
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].costosAdicionales = row.total || 0;
            resolve();
          });
        })
      );

      // Gastos
      promesas.push(
        new Promise((resolve) => {
          db.db.get(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM gastos
            WHERE date(fecha) BETWEEN date(?) AND date(?)
            AND categoria NOT IN ('Inventario', 'Proveedores')
          `, [fechaInicioReal, fechaFinReal], (err, row) => {
            if (!err && row) meses[index].gastos = row.total || 0;
            resolve();
          });
        })
      );
    });

    Promise.all(promesas)
      .then(() => {
        meses.forEach(mes => {
          mes.ventas = mes.ventasPropias + mes.ventasMarcasAliadas;
          mes.ganancia = (mes.ventasPropias - mes.costoProductos - mes.costosAdicionales) + mes.ingresoMarcasAliadas - mes.gastos;
        });

        console.log('📈 Gráfica proporcional generada');
        resolve(meses);
      })
      .catch(reject);
  });
});

// ============================================
// HANDLER: Top productos (PROPORCIONAL)
// ============================================

ipcMain.handle('obtener-top-productos-periodo', async (event, periodo) => {
  return new Promise((resolve, reject) => {
    const { inicio: fechaInicio, fin: fechaFin } = periodo;

db.db.all(`
      SELECT
        p.nombre,
        p.nombre as codigo,
        SUM(vp.cantidad * ((v.monto_pagado - v.cambio) / v.total)) as cantidad,
        SUM(vp.precio_unitario * vp.cantidad * ((v.monto_pagado - v.cambio) / v.total)) as total_ventas
      FROM venta_productos vp
      INNER JOIN productos p ON vp.producto_id = p.id
      INNER JOIN ventas v ON vp.venta_id = v.id
      WHERE v.estado != 'Cancelado'
      AND v.monto_pagado > 0
      AND v.total > 0
      AND date(v.fecha) BETWEEN date(?) AND date(?)
      GROUP BY p.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `, [fechaInicio, fechaFin], (err, rows) => {
      if (err) {
        console.error('Error al obtener top productos:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
});

ipcMain.handle('obtener-detalle-producto-top', async (event, nombreProducto, periodo) => {
  return new Promise((resolve, reject) => {
    const { inicio: fechaInicio, fin: fechaFin } = periodo;

    db.db.all(`
      SELECT
        p.nombre,
        p.referencia,
        vp.cantidad,
        vp.precio_unitario,
        (vp.cantidad * vp.precio_unitario) as subtotal,
        v.fecha,
        v.numero_venta,
        v.cliente_nombre,
        COALESCE(vr.talla, 'Única') as talla
      FROM venta_productos vp
      INNER JOIN productos p ON vp.producto_id = p.id
      INNER JOIN ventas v ON vp.venta_id = v.id
      LEFT JOIN variantes_producto vr ON vp.variante_id = vr.id
      WHERE v.estado != 'Cancelado'
      AND v.monto_pagado > 0
      AND v.total > 0
      AND p.nombre = ?
      AND date(v.fecha) BETWEEN date(?) AND date(?)
      ORDER BY v.fecha DESC
    `, [nombreProducto, fechaInicio, fechaFin], (err, rows) => {
      if (err) {
        console.error('Error al obtener detalle producto top:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
});

ipcMain.handle('obtener-estadisticas-costos-productos', async () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        COUNT(DISTINCT ca.producto_id) as productos_con_costos,
        SUM(ca.monto) as total_costos_adicionales,
        COUNT(ca.id) as total_registros
      FROM costos_adicionales_producto ca
      INNER JOIN productos p ON ca.producto_id = p.id
    `;

    db.db.get(sql, [], (err, row) => {
      if (err) {
        console.error('❌ Error al obtener estadísticas de costos adicionales:', err);
        reject(err);
      } else {
        resolve({
          productos_con_costos: row?.productos_con_costos || 0,
          total_costos_adicionales: row?.total_costos_adicionales || 0,
          total_registros: row?.total_registros || 0
        });
      }
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


// ==================== MARCAS ALIADAS (ACTUALIZADO SIN categoria y costo_base) ====================

// Obtener todas las marcas
ipcMain.handle('obtener-marcas-aliadas', async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        m.*,
        COUNT(DISTINCT p.id) as total_productos,
        COALESCE(SUM(v.cantidad), 0) as total_stock
      FROM marcas_aliadas m
      LEFT JOIN productos_marca_aliada p ON m.id = p.marca_aliada_id
      LEFT JOIN variantes_marca_aliada v ON p.id = v.producto_marca_id
      GROUP BY m.id
      ORDER BY m.nombre ASC
    `;

    db.db.all(query, [], (err, marcas) => {
      if (err) {
        console.error('Error al obtener marcas:', err);
        reject(err);
      } else {
        resolve(marcas);
      }
    });
  });
});

// Agregar marca aliada
ipcMain.handle('agregar-marca-aliada', async (event, marca) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO marcas_aliadas (
        nombre, contacto_nombre, contacto_telefono, contacto_email,
        porcentaje_comision, notas, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.db.run(
      query,
      [
        marca.nombre,
        marca.contacto_nombre,
        marca.contacto_telefono,
        marca.contacto_email,
        marca.porcentaje_comision,
        marca.notas,
        marca.activo
      ],
      function (err) {
        if (err) {
          console.error('Error al agregar marca:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
});

// Actualizar marca aliada
ipcMain.handle('actualizar-marca-aliada', async (event, id, marca) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE marcas_aliadas SET
        nombre = ?,
        contacto_nombre = ?,
        contacto_telefono = ?,
        contacto_email = ?,
        porcentaje_comision = ?,
        notas = ?,
        activo = ?,
        fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `;

    db.db.run(
      query,
      [
        marca.nombre,
        marca.contacto_nombre,
        marca.contacto_telefono,
        marca.contacto_email,
        marca.porcentaje_comision,
        marca.notas,
        marca.activo,
        id
      ],
      function (err) {
        if (err) {
          console.error('Error al actualizar marca:', err);
          reject(err);
        } else {
          resolve({ success: true });
        }
      }
    );
  });
});

// Eliminar marca aliada
ipcMain.handle('eliminar-marca-aliada', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.db.run('DELETE FROM marcas_aliadas WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error al eliminar marca:', err);
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Obtener productos de una marca
ipcMain.handle('obtener-productos-marca-aliada', async (event, marcaId) => {
  return new Promise((resolve, reject) => {
    // Primero obtener productos
    const queryProductos = `
      SELECT * FROM productos_marca_aliada
      WHERE marca_aliada_id = ?
      ORDER BY nombre ASC
    `;

    db.db.all(queryProductos, [marcaId], (err, productos) => {
      if (err) {
        console.error('Error al obtener productos de marca:', err);
        reject(err);
        return;
      }

      // Si no hay productos, devolver array vacío
      if (productos.length === 0) {
        resolve([]);
        return;
      }

      // Obtener variantes para cada producto
      let productosCompletados = 0;
      productos.forEach((producto) => {
        const queryVariantes = `
          SELECT * FROM variantes_marca_aliada
          WHERE producto_marca_id = ?
          ORDER BY talla ASC
        `;

        db.db.all(queryVariantes, [producto.id], (err, variantes) => {
          if (err) {
            console.error('Error al obtener variantes:', err);
            producto.variantes = [];
          } else {
            producto.variantes = variantes;
          }

          productosCompletados++;
          if (productosCompletados === productos.length) {
            resolve(productos);
          }
        });
      });
    });
  });
});

// Agregar producto de marca aliada (SIN categoria y costo_base)
ipcMain.handle('agregar-producto-marca-aliada', async (event, producto) => {
  return new Promise((resolve, reject) => {
    // Guardar imagen si existe
    let rutaImagen = null;
    if (producto.imagen) {
      const imagenesDir = path.join(app.getPath('userData'), 'imagenes');
      if (!fs.existsSync(imagenesDir)) {
        fs.mkdirSync(imagenesDir, { recursive: true });
      }
      rutaImagen = path.join(imagenesDir, `marca_${Date.now()}_${producto.imagen.name}`);
      const base64Data = producto.imagen.data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(rutaImagen, base64Data, 'base64');
    }

    // Insertar producto (SIN categoria y costo_base)
    const queryProducto = `
      INSERT INTO productos_marca_aliada (
        marca_aliada_id, referencia, nombre, precio_venta_base, imagen
      ) VALUES (?, ?, ?, ?, ?)
    `;

    db.db.run(
      queryProducto,
      [
        producto.marca_aliada_id,
        producto.referencia,
        producto.nombre,
        producto.precio_venta_base,
        rutaImagen
      ],
      function (err) {
        if (err) {
          console.error('Error al agregar producto de marca:', err);
          // Eliminar imagen si falla
          if (rutaImagen && fs.existsSync(rutaImagen)) {
            fs.unlinkSync(rutaImagen);
          }
          reject(err);
          return;
        }

        const productoId = this.lastID;

        // Insertar variantes
        if (!producto.variantes || producto.variantes.length === 0) {
          resolve({ id: productoId });
          return;
        }

        const queryVariante = `
          INSERT INTO variantes_marca_aliada (
            producto_marca_id, talla, cantidad, ajuste_precio
          ) VALUES (?, ?, ?, ?)
        `;

        let variantesInsertadas = 0;
        let errorVariante = null;

        producto.variantes.forEach((variante) => {
          db.db.run(
            queryVariante,
            [productoId, variante.talla, variante.cantidad, variante.ajuste_precio],
            (err) => {
              if (err && !errorVariante) {
                errorVariante = err;
              }
              variantesInsertadas++;

              if (variantesInsertadas === producto.variantes.length) {
                if (errorVariante) {
                  console.error('Error al insertar variantes:', errorVariante);
                  reject(errorVariante);
                } else {
                  resolve({ id: productoId });
                }
              }
            }
          );
        });
      }
    );
  });
});

// Actualizar producto de marca aliada (SIN categoria y costo_base)
ipcMain.handle('actualizar-producto-marca-aliada', async (event, id, producto) => {
  return new Promise((resolve, reject) => {
    // Actualizar imagen si hay una nueva
    let rutaImagen = null;
    if (producto.imagen) {
      const imagenesDir = path.join(app.getPath('userData'), 'imagenes');
      if (!fs.existsSync(imagenesDir)) {
        fs.mkdirSync(imagenesDir, { recursive: true });
      }
      rutaImagen = path.join(imagenesDir, `marca_${Date.now()}_${producto.imagen.name}`);
      const base64Data = producto.imagen.data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(rutaImagen, base64Data, 'base64');

      // Eliminar imagen anterior si existe
      db.db.get('SELECT imagen FROM productos_marca_aliada WHERE id = ?', [id], (err, row) => {
        if (!err && row && row.imagen && fs.existsSync(row.imagen)) {
          fs.unlinkSync(row.imagen);
        }
      });
    }

    // Actualizar producto (SIN categoria y costo_base)
    const updateQuery = rutaImagen
      ? `UPDATE productos_marca_aliada SET
          referencia = ?, nombre = ?, precio_venta_base = ?, imagen = ?,
          fecha_actualizacion = datetime('now', 'localtime')
         WHERE id = ?`
      : `UPDATE productos_marca_aliada SET
          referencia = ?, nombre = ?, precio_venta_base = ?,
          fecha_actualizacion = datetime('now', 'localtime')
         WHERE id = ?`;

    const params = rutaImagen
      ? [producto.referencia, producto.nombre, producto.precio_venta_base, rutaImagen, id]
      : [producto.referencia, producto.nombre, producto.precio_venta_base, id];

    db.db.run(updateQuery, params, function (err) {
      if (err) {
        console.error('Error al actualizar producto:', err);
        reject(err);
        return;
      }

      // Eliminar variantes anteriores
      db.db.run('DELETE FROM variantes_marca_aliada WHERE producto_marca_id = ?', [id], (err) => {
        if (err) {
          console.error('Error al eliminar variantes:', err);
          reject(err);
          return;
        }

        // Insertar nuevas variantes
        if (!producto.variantes || producto.variantes.length === 0) {
          resolve({ success: true });
          return;
        }

        const queryVariante = `
          INSERT INTO variantes_marca_aliada (
            producto_marca_id, talla, cantidad, ajuste_precio
          ) VALUES (?, ?, ?, ?)
        `;

        let variantesInsertadas = 0;
        let errorVariante = null;

        producto.variantes.forEach((variante) => {
          db.db.run(
            queryVariante,
            [id, variante.talla, variante.cantidad, variante.ajuste_precio],
            (err) => {
              if (err && !errorVariante) {
                errorVariante = err;
              }
              variantesInsertadas++;

              if (variantesInsertadas === producto.variantes.length) {
                if (errorVariante) {
                  console.error('Error al insertar variantes:', errorVariante);
                  reject(errorVariante);
                } else {
                  resolve({ success: true });
                }
              }
            }
          );
        });
      });
    });
  });
});

// Eliminar producto de marca aliada
ipcMain.handle('eliminar-producto-marca-aliada', async (event, id) => {
  return new Promise((resolve, reject) => {
    // Obtener ruta de imagen para eliminarla
    db.db.get('SELECT imagen FROM productos_marca_aliada WHERE id = ?', [id], (err, producto) => {
      if (err) {
        console.error('Error al obtener producto:', err);
        reject(err);
        return;
      }

      // Eliminar producto (CASCADE eliminará variantes)
      db.db.run('DELETE FROM productos_marca_aliada WHERE id = ?', [id], function (err) {
        if (err) {
          console.error('Error al eliminar producto de marca:', err);
          reject(err);
        } else {
          // Eliminar imagen del sistema de archivos
          if (producto && producto.imagen && fs.existsSync(producto.imagen)) {
            fs.unlinkSync(producto.imagen);
          }
          resolve({ success: true });
        }
      });
    });
  });
});

// ==================== ESTADÍSTICAS Y VENTAS DE MARCAS ALIADAS ====================

// Obtener estadísticas generales de todas las marcas aliadas (PROPORCIONAL al pago)
ipcMain.handle('obtener-estadisticas-marcas-aliadas', async () => {
  return new Promise((resolve, reject) => {
    db.db.get(`
      SELECT
        COUNT(DISTINCT vma.venta_id) as total_ventas,
SUM(vma.subtotal * ((v.monto_pagado - v.cambio) / v.total)) as total_vendido,
SUM(vma.comision_marca * ((v.monto_pagado - v.cambio) / v.total)) as total_comision_marcas,
SUM(vma.ganancia_tienda * ((v.monto_pagado - v.cambio) / v.total)) as total_ganancia_tienda
      FROM ventas_marca_aliada vma
      INNER JOIN ventas v ON vma.venta_id = v.id
      WHERE v.estado != 'Cancelado'
        AND v.monto_pagado > 0
        AND v.total > 0
    `, [], (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas de marcas:', err);
        reject(err);
      } else {
        resolve({
          total_ventas: stats.total_ventas || 0,
          total_vendido: stats.total_vendido || 0,
          total_comision_marcas: stats.total_comision_marcas || 0,
          total_ganancia_tienda: stats.total_ganancia_tienda || 0
        });
      }
    });
  });
});

// Obtener estadísticas de una marca específica (PROPORCIONAL al pago)
ipcMain.handle('obtener-estadisticas-marca', async (event, marcaId) => {
  return new Promise((resolve, reject) => {
    db.db.get(`
      SELECT
        COUNT(DISTINCT vma.venta_id) as total_ventas,
SUM(vma.subtotal * ((v.monto_pagado - v.cambio) / v.total)) as total_vendido,
SUM(vma.comision_marca * ((v.monto_pagado - v.cambio) / v.total)) as total_comision_marca,
SUM(vma.ganancia_tienda * ((v.monto_pagado - v.cambio) / v.total)) as total_ganancia_tienda,
SUM(vma.cantidad * ((v.monto_pagado - v.cambio) / v.total)) as total_unidades_vendidas
      FROM ventas_marca_aliada vma
      INNER JOIN ventas v ON vma.venta_id = v.id
      WHERE vma.marca_aliada_id = ?
        AND v.estado != 'Cancelado'
        AND v.monto_pagado > 0
        AND v.total > 0
    `, [marcaId], (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas de marca:', err);
        reject(err);
      } else {
        resolve({
          total_ventas: stats.total_ventas || 0,
          total_vendido: stats.total_vendido || 0,
          total_comision_marca: stats.total_comision_marca || 0,
          total_ganancia_tienda: stats.total_ganancia_tienda || 0,
          total_unidades_vendidas: stats.total_unidades_vendidas || 0
        });
      }
    });
  });
});

// Obtener todas las ventas de una marca específica
ipcMain.handle('obtener-ventas-marca', async (event, marcaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        v.id as venta_id,
        v.numero_venta,
        v.fecha,
        v.cliente_nombre,
        v.estado,
        v.total,
        v.monto_pagado,
        (v.total - v.monto_pagado) as saldo_pendiente,
        CASE
          WHEN v.total > 0 THEN ROUND(((v.monto_pagado - v.cambio) * 100.0 / v.total), 2)
          ELSE 0
        END as porcentaje_pagado,
        GROUP_CONCAT(
          pma.nombre || ' (' || COALESCE(vma_var.talla, 'Única') || ') x' || vma.cantidad, ', '
        ) as productos,
        COALESCE(SUM(vma.subtotal), 0) as total_venta,
        CASE
          WHEN v.total > 0 THEN COALESCE(SUM(vma.subtotal * ((v.monto_pagado - v.cambio) / v.total)), 0)
          ELSE 0
        END as total_venta_pagado,
        COALESCE(SUM(vma.comision_marca), 0) as comision_marca_total,
        CASE
          WHEN v.total > 0 THEN COALESCE(SUM(vma.comision_marca * ((v.monto_pagado - v.cambio) / v.total)), 0)
          ELSE 0
        END as comision_marca_pagado,
        COALESCE(SUM(vma.ganancia_tienda), 0) as ganancia_tienda_total,
        CASE
          WHEN v.total > 0 THEN COALESCE(SUM(vma.ganancia_tienda * ((v.monto_pagado - v.cambio) / v.total)), 0)
          ELSE 0
        END as ganancia_tienda_pagado
      FROM ventas_marca_aliada vma
      INNER JOIN ventas v ON vma.venta_id = v.id
      INNER JOIN productos_marca_aliada pma ON vma.producto_marca_id = pma.id
      LEFT JOIN variantes_marca_aliada vma_var ON vma.variante_id = vma_var.id
      WHERE vma.marca_aliada_id = ? AND v.estado != 'Cancelado'
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `;

    db.db.all(query, [marcaId], (err, ventas) => {
      if (err) {
        console.error('Error al obtener ventas de marca:', err);
        reject(err);
      } else {
        resolve(ventas || []);
      }
    });
  });
});

// Obtener productos más vendidos de una marca (PROPORCIONAL al pago)
ipcMain.handle('obtener-productos-mas-vendidos-marca', async (event, marcaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        pma.id,
        pma.nombre,
        pma.referencia,
        SUM(vma.cantidad * ((v.monto_pagado - v.cambio) / v.total)) as total_vendido,
        SUM(vma.subtotal * ((v.monto_pagado - v.cambio) / v.total)) as total_ingresos,
        COUNT(DISTINCT vma.venta_id) as num_ventas
      FROM ventas_marca_aliada vma
      INNER JOIN productos_marca_aliada pma ON vma.producto_marca_id = pma.id
      INNER JOIN ventas v ON vma.venta_id = v.id
      WHERE vma.marca_aliada_id = ?
        AND v.estado != 'Cancelado'
        AND v.monto_pagado > 0
        AND v.total > 0
      GROUP BY pma.id
      ORDER BY total_vendido DESC
      LIMIT 5
    `;

    db.db.all(query, [marcaId], (err, productos) => {
      if (err) {
        console.error('Error al obtener productos más vendidos:', err);
        reject(err);
      } else {
        resolve(productos || []);
      }
    });
  });
});


// Handler: Obtener panel de rotación de inventario
ipcMain.handle('obtener-rotacion-inventario', async () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        p.id as producto_id,
        p.referencia,
        p.nombre,
        p.categoria,
        p.precio_venta_base,
        p.costo_base,
        p.fecha_creado as fecha_ingreso_producto,

        vp.id as variante_id,
        vp.talla,
        vp.cantidad as stock_actual,
        COALESCE(vp.fecha_ingreso, p.fecha_creado) as fecha_ingreso_variante,

        -- Fecha primera venta: columna O subconsulta (lo que exista)
        COALESCE(
          vp.fecha_primera_venta,
          (SELECT MIN(v.fecha) FROM venta_productos vp2
           INNER JOIN ventas v ON vp2.venta_id = v.id
           WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
        ) as fecha_primera_venta,

        -- Fecha última venta: columna O subconsulta
        COALESCE(
          vp.fecha_ultima_venta,
          (SELECT MAX(v.fecha) FROM venta_productos vp2
           INNER JOIN ventas v ON vp2.venta_id = v.id
           WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
        ) as fecha_ultima_venta,

        -- Días en inventario
        CAST(
          (julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado)))
          AS INTEGER
        ) as dias_en_inventario,

        -- Días hasta primera venta (usando fecha real)
        CASE
          WHEN COALESCE(vp.fecha_primera_venta,
            (SELECT MIN(v.fecha) FROM venta_productos vp2
             INNER JOIN ventas v ON vp2.venta_id = v.id
             WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
          ) IS NOT NULL THEN
            CAST(
              julianday(COALESCE(vp.fecha_primera_venta,
                (SELECT MIN(v.fecha) FROM venta_productos vp2
                 INNER JOIN ventas v ON vp2.venta_id = v.id
                 WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
              )) - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))
              AS INTEGER
            )
          ELSE NULL
        END as dias_hasta_primera_venta,

        -- Días desde última venta
        CASE
          WHEN COALESCE(vp.fecha_ultima_venta,
            (SELECT MAX(v.fecha) FROM venta_productos vp2
             INNER JOIN ventas v ON vp2.venta_id = v.id
             WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
          ) IS NOT NULL THEN
            CAST((julianday('now') - julianday(COALESCE(vp.fecha_ultima_venta,
              (SELECT MAX(v.fecha) FROM venta_productos vp2
               INNER JOIN ventas v ON vp2.venta_id = v.id
               WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
            ))) AS INTEGER)
          ELSE NULL
        END as dias_desde_ultima_venta,

        -- Estado de rotación: combina velocidad de primera venta + actividad reciente
        CASE
          -- Nunca ha vendido: por tiempo en inventario
          WHEN COALESCE(vp.fecha_primera_venta,
            (SELECT MIN(v.fecha) FROM venta_productos vp2
             INNER JOIN ventas v ON vp2.venta_id = v.id
             WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
          ) IS NULL THEN
            CASE
              WHEN CAST((julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))) AS INTEGER) >= 91
                THEN 'Rotación lenta'
              ELSE 'Rotación normal'
            END

          -- Ya vendió: tomar el PEOR entre días a 1ª venta y días desde última venta
          ELSE
            CASE
              -- Si lleva 91+ días sin vender desde la última venta → lenta (sin importar qué tan rápido vendió antes)
              WHEN CAST((julianday('now') - julianday(COALESCE(vp.fecha_ultima_venta,
                (SELECT MAX(v.fecha) FROM venta_productos vp2
                 INNER JOIN ventas v ON vp2.venta_id = v.id
                 WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
              ))) AS INTEGER) >= 91
                THEN 'Rotación lenta'

              -- Si lleva 46-90 días sin vender → normal
              WHEN CAST((julianday('now') - julianday(COALESCE(vp.fecha_ultima_venta,
                (SELECT MAX(v.fecha) FROM venta_productos vp2
                 INNER JOIN ventas v ON vp2.venta_id = v.id
                 WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
              ))) AS INTEGER) >= 46
                THEN 'Rotación normal'

              -- Si vendió recientemente (últimos 45 días) Y además tardó poco en la primera venta → rápida
              WHEN CAST(
                julianday(COALESCE(vp.fecha_primera_venta,
                  (SELECT MIN(v.fecha) FROM venta_productos vp2
                   INNER JOIN ventas v ON vp2.venta_id = v.id
                   WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado')
                )) - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))
                AS INTEGER) <= 45
                THEN 'Rotación rápida'

              -- Vendió recientemente pero tardó mucho en la primera venta → normal
              ELSE 'Rotación normal'
            END
        END as estado_rotacion,

        -- Total unidades vendidas
        COALESCE((
          SELECT SUM(vp2.cantidad)
          FROM venta_productos vp2
          INNER JOIN ventas v ON vp2.venta_id = v.id
          WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado'
        ), 0) as total_unidades_vendidas,

        -- Ingresos totales
        COALESCE((
          SELECT SUM(vp2.cantidad * vp2.precio_unitario)
          FROM venta_productos vp2
          INNER JOIN ventas v ON vp2.venta_id = v.id
          WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado'
        ), 0) as total_ingresos_variante,

        -- Número de ventas
        COALESCE((
          SELECT COUNT(DISTINCT vp2.venta_id)
          FROM venta_productos vp2
          INNER JOIN ventas v ON vp2.venta_id = v.id
          WHERE vp2.variante_id = vp.id AND v.estado != 'Cancelado'
        ), 0) as numero_ventas

      FROM productos p
      INNER JOIN variantes_producto vp ON vp.producto_id = p.id
      ORDER BY
        COALESCE(vp.fecha_ingreso, p.fecha_creado) DESC,
  CASE
    WHEN vp.fecha_primera_venta IS NULL AND
         CAST((julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))) AS INTEGER) > 60
         THEN 0
    WHEN vp.fecha_ultima_venta IS NOT NULL AND
         CAST((julianday('now') - julianday(vp.fecha_ultima_venta)) AS INTEGER) > 30
         THEN 1
    ELSE 2
  END ASC
    `;

    db.db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('❌ Error al obtener rotación de inventario:', err);
        return reject(err);
      }

      // Agrupar filas por producto
      const productosMap = {};
      rows.forEach(row => {
        const key = row.producto_id;
        if (!productosMap[key]) {
          productosMap[key] = {
            producto_id: row.producto_id,
            referencia: row.referencia,
            nombre: row.nombre,
            categoria: row.categoria,
            fecha_ingreso_producto: row.fecha_ingreso_producto,
            precio_venta_base: row.precio_venta_base,
            costo_base: row.costo_base,
            variantes: []
          };
        }
        productosMap[key].variantes.push({
          variante_id: row.variante_id,
          talla: row.talla,
          stock_actual: row.stock_actual,
          fecha_ingreso_variante: row.fecha_ingreso_variante,
          fecha_primera_venta: row.fecha_primera_venta,
          fecha_ultima_venta: row.fecha_ultima_venta,
          total_unidades_vendidas: row.total_unidades_vendidas,
          dias_en_inventario: row.dias_en_inventario,
          dias_hasta_primera_venta: row.dias_hasta_primera_venta,
          dias_desde_ultima_venta: row.dias_desde_ultima_venta,
          estado_rotacion: row.estado_rotacion,
          total_ingresos_variante: row.total_ingresos_variante,
          numero_ventas: row.numero_ventas
        });
      });

      const resultado = Object.values(productosMap);
      console.log(`✅ Rotación obtenida: ${resultado.length} productos`);
      resolve(resultado);
    });
  });
});

// Handler: Obtener historial detallado de ventas de una variante específica
ipcMain.handle('obtener-historial-variante', async (event, varianteId) => {
  return new Promise((resolve, reject) => {
    db.db.all(
      `SELECT
         hvv.id,
         hvv.cantidad_vendida,
         hvv.precio_venta,
         hvv.fecha_venta,
         hvv.venta_id,
         v.numero_venta,
         v.cliente_nombre
       FROM historial_ventas_variante hvv
       INNER JOIN ventas v ON hvv.venta_id = v.id
       WHERE hvv.variante_id = ?
       ORDER BY hvv.fecha_venta ASC`,
      [varianteId],
      (err, rows) => {
        if (err) {
          console.error('❌ Error al obtener historial de variante:', err);
          return reject(err);
        }
        resolve(rows || []);
      }
    );
  });
});

//Handlers caja


// Reiniciar caja (requiere contraseña)
ipcMain.handle('caja-reiniciar', async (event, password) => {
  return new Promise((resolve, reject) => {
    if (password !== '0872') {
      resolve({ success: false, error: 'Contraseña incorrecta' });
      return;
    }

    cajaModel.reiniciarCaja((err, resultado) => {
      if (err) {
        console.error('❌ Error al reiniciar caja:', err);
        reject(err);
      } else {
        resolve(resultado);
      }
    });
  });
});

// Obtener saldo actual
ipcMain.handle('caja-obtener-saldo', async () => {
  return new Promise((resolve, reject) => {
    cajaModel.obtenerSaldo((err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

// Obtener todos los movimientos
ipcMain.handle('caja-obtener-movimientos', async () => {
  return new Promise((resolve, reject) => {
    cajaModel.obtenerMovimientos((err, movimientos) => {
      if (err) reject(err);
      else resolve(movimientos);
    });
  });
});

// Obtener movimientos por período
ipcMain.handle('caja-obtener-periodo', async (event, fechaInicio, fechaFin) => {
  return new Promise((resolve, reject) => {
    cajaModel.obtenerPorPeriodo(fechaInicio, fechaFin, (err, movimientos) => {
      if (err) reject(err);
      else resolve(movimientos);
    });
  });
});

// Registrar movimiento manual
ipcMain.handle('caja-registrar-movimiento', async (event, datos) => {
  return new Promise((resolve, reject) => {
    cajaModel.registrarMovimiento(datos, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

// Configurar saldo inicial
ipcMain.handle('caja-configurar-saldo-inicial', async (event, monto) => {
  return new Promise((resolve, reject) => {
    cajaModel.configurarSaldoInicial(monto, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});

// Resumen del día
ipcMain.handle('caja-resumen-dia', async () => {
  return new Promise((resolve, reject) => {
    cajaModel.obtenerResumenDia((err, resumen) => {
      if (err) reject(err);
      else resolve(resumen);
    });
  });
});

// Eliminar movimiento
ipcMain.handle('caja-eliminar-movimiento', async (event, id) => {
  return new Promise((resolve, reject) => {
    cajaModel.eliminarMovimiento(id, (err, resultado) => {
      if (err) reject(err);
      else resolve(resultado);
    });
  });
});


// ==================== HANDLERS PARA IA ====================

const IA_CONFIG_PATH = path.join(app.getPath('userData'), 'ia-config.json');

ipcMain.handle('ia-guardar-apikey', async (event, apiKey) => {
  try {
    const config = fs.existsSync(IA_CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(IA_CONFIG_PATH, 'utf8'))
      : {};
    config.apiKey = apiKey;
    fs.writeFileSync(IA_CONFIG_PATH, JSON.stringify(config));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('ia-obtener-apikey', async () => {
  try {
    if (!fs.existsSync(IA_CONFIG_PATH)) return null;
    const config = JSON.parse(fs.readFileSync(IA_CONFIG_PATH, 'utf8'));
    return config.apiKey || null;
  } catch {
    return null;
  }
});

ipcMain.handle('ia-analizar', async (event, { resumen, apiKey }) => {
  return new Promise((resolve) => {
    const https = require('https');

    const prompt = `Eres un asesor experto en retail de moda y accesorios en Colombia.
Analiza estos datos REALES del negocio Dalú y entrega recomendaciones accionables y concretas en español.

═══════════════════════════════════════
DATOS DEL NEGOCIO (${resumen.periodo})
═══════════════════════════════════════

📊 VENTAS DEL MES:
- Transacciones: ${resumen.ventas.total_mes}
- Ingresos cobrados: $${resumen.ventas.ingresos_mes.toLocaleString('es-CO')}
- Pendiente por cobrar: $${resumen.ventas.pendiente_cobrar.toLocaleString('es-CO')}

🏆 PRODUCTOS MÁS VENDIDOS (últimos 6 meses):
${resumen.top_productos.length
  ? resumen.top_productos.map((p, i) => `${i + 1}. ${p.nombre}: ${p.unidades} uds — $${p.ingresos.toLocaleString('es-CO')}`).join('\n')
  : 'Sin datos suficientes'}

📦 ESTADO DEL INVENTARIO:
- Total referencias: ${resumen.inventario.total_productos}
- Con stock bajo (≤2 uds): ${resumen.inventario.stock_bajo}
- Agotados: ${resumen.inventario.agotados}
${resumen.inventario.productos_agotados.length ? `\nPRODUCTOS AGOTADOS:\n${resumen.inventario.productos_agotados.map(p => `• ${p}`).join('\n')}` : ''}
${resumen.inventario.productos_stock_bajo.length ? `\nSTOCK CRÍTICO:\n${resumen.inventario.productos_stock_bajo.map(p => `• ${p}`).join('\n')}` : ''}
${resumen.inventario.rotacion_lenta.length ? `\nROTACIÓN LENTA:\n${resumen.inventario.rotacion_lenta.map(p => `• ${p}`).join('\n')}` : ''}
${resumen.inventario.rotacion_rapida.length ? `\nROTACIÓN RÁPIDA:\n${resumen.inventario.rotacion_rapida.map(p => `• ${p}`).join('\n')}` : ''}

💸 GASTOS POR CATEGORÍA (este mes):
${resumen.gastos.length
  ? resumen.gastos.map(g => `• ${g.categoria}: $${g.total.toLocaleString('es-CO')}`).join('\n')
  : 'Sin gastos registrados este mes'}

════════════════════════════════════════
INSTRUCCIONES DE RESPUESTA
════════════════════════════════════════
Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks, sin texto adicional).
Estructura exacta:
{
  "resumen_ejecutivo": "1-2 oraciones describiendo el estado actual del negocio.",
  "alertas": [
    { "titulo": "Título corto", "descripcion": "Qué está pasando y por qué importa", "accion": "Qué hacer exactamente" }
  ],
  "oportunidades": [
    { "titulo": "Título corto", "descripcion": "Qué oportunidad existe", "accion": "Cómo aprovecharla" }
  ],
  "recomendaciones_compra": [
    { "titulo": "Producto o categoría", "descripcion": "Por qué comprarlo", "cantidad_sugerida": "Cuánto pedir aprox." }
  ]
}
Máximo 3 items por categoría. Sé específico con los nombres de productos cuando aparezcan en los datos.`;

const body = JSON.stringify({
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  max_tokens: 2000,
  temperature: 0.3,
  messages: [{ role: 'user', content: prompt }]
});

const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': `Bearer ${apiKey}`
  }
};



    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ success: false, error: `API Error: ${parsed.error.message}` });
            return;
          }
          const texto = parsed.choices?.[0]?.message?.content;
          if (texto) {
            resolve({ success: true, respuesta: texto.trim() });
          } else {
            resolve({ success: false, error: 'Respuesta vacía de Grok. Intenta de nuevo.' });
          }
        } catch (e) {
          resolve({ success: false, error: 'Error al procesar respuesta: ' + e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(body);
    req.end();
  });
});


const IA_HISTORY_PATH = path.join(app.getPath('userData'), 'ia-historial.json');

ipcMain.handle('ia-guardar-en-historial', async (event, entrada) => {
  try {
    let historial = [];
    if (fs.existsSync(IA_HISTORY_PATH)) {
      historial = JSON.parse(fs.readFileSync(IA_HISTORY_PATH, 'utf8'));
    }
    historial.unshift(entrada);
    historial = historial.slice(0, 10);
    fs.writeFileSync(IA_HISTORY_PATH, JSON.stringify(historial, null, 2));
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('ia-obtener-historial', async () => {
  try {
    if (!fs.existsSync(IA_HISTORY_PATH)) return [];
    return JSON.parse(fs.readFileSync(IA_HISTORY_PATH, 'utf8'));
  } catch { return []; }
});

ipcMain.handle('ia-limpiar-historial', async () => {
  try {
    fs.writeFileSync(IA_HISTORY_PATH, '[]');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('ia-chat', async (event, { mensajes, contexto, apiKey }) => {
  return new Promise((resolve) => {
    const https = require('https');

    const systemPrompt = `Eres el asistente inteligente de Dalú, una tienda de moda y accesorios en Colombia.
Tienes acceso a los datos actuales del negocio y respondes preguntas sobre ventas, inventario, clientes y gastos.
Responde siempre en español, de forma concisa y útil. Usa el formato de pesos colombianos ($) con puntos para miles.

DATOS ACTUALES DEL NEGOCIO:
${contexto}`;

    const body = JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 1000,
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        ...mensajes
      ]
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ success: false, error: parsed.error.message });
            return;
          }
          const texto = parsed.choices?.[0]?.message?.content;
          if (texto) resolve({ success: true, respuesta: texto.trim() });
          else resolve({ success: false, error: 'Sin respuesta del modelo' });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(body);
    req.end();
  });
});

ipcMain.handle('ia-obtener-contexto-completo', async () => {
  return new Promise((resolve) => {
    const resultado = {};
    let pendientes = 9;
    const verificar = () => { if (--pendientes === 0) resolve(resultado); };

    // Ventas por mes (TODOS LOS TIEMPOS)
    db.db.all(`
      SELECT strftime('%Y-%m', fecha) as mes,
        COUNT(*) as num_ventas,
        ROUND(SUM(monto_pagado - cambio), 0) as ingresos,
        ROUND(SUM(CASE WHEN estado='Pendiente' THEN total - monto_pagado ELSE 0 END), 0) as pendiente
      FROM ventas WHERE estado != 'Cancelado'
      GROUP BY mes ORDER BY mes DESC
    `, [], (err, rows) => { resultado.ventas_por_mes = err ? [] : rows; verificar(); });

    // Top 10 productos histórico
    db.db.all(`
      SELECT p.nombre, p.categoria,
        SUM(vp.cantidad) as unidades,
        ROUND(SUM(vp.cantidad * vp.precio_unitario), 0) as ingresos
      FROM venta_productos vp
      INNER JOIN productos p ON vp.producto_id = p.id
      INNER JOIN ventas v ON vp.venta_id = v.id
      WHERE v.estado != 'Cancelado'
      GROUP BY p.id ORDER BY unidades DESC LIMIT 10
    `, [], (err, rows) => { resultado.top_productos = err ? [] : rows; verificar(); });

    // Gastos por mes y categoría (TODOS)
    db.db.all(`
      SELECT strftime('%Y-%m', fecha) as mes, categoria,
        ROUND(SUM(monto), 0) as total, COUNT(*) as num
      FROM gastos GROUP BY mes, categoria ORDER BY mes DESC, total DESC
    `, [], (err, rows) => { resultado.gastos = err ? [] : rows; verificar(); });

    // Inventario con stock
    db.db.all(`
      SELECT p.nombre, p.categoria, p.precio_venta_base,
        vp.talla, vp.cantidad as stock
      FROM variantes_producto vp
      INNER JOIN productos p ON vp.producto_id = p.id
      WHERE vp.cantidad > 0 ORDER BY p.nombre, vp.talla
    `, [], (err, rows) => { resultado.inventario = err ? [] : rows; verificar(); });

    // Productos agotados
    db.db.all(`
      SELECT p.nombre, p.categoria, vp.talla, vp.fecha_ultima_venta
      FROM variantes_producto vp
      INNER JOIN productos p ON vp.producto_id = p.id
      WHERE vp.cantidad = 0 ORDER BY vp.fecha_ultima_venta DESC
    `, [], (err, rows) => { resultado.agotados = err ? [] : rows; verificar(); });

    // Deudas clientes pendientes
    db.db.all(`
      SELECT cliente_nombre,
        ROUND(monto_total, 0) as monto_total,
        ROUND(monto_pendiente, 0) as monto_pendiente,
        fecha_creacion
      FROM deudas_clientes WHERE estado = 'Pendiente'
      ORDER BY monto_pendiente DESC
    `, [], (err, rows) => { resultado.deudas_clientes = err ? [] : rows; verificar(); });

    // Top 10 clientes
    db.db.all(`
      SELECT nombre, numero_compras, ROUND(total_compras, 0) as total_compras, ultima_compra
      FROM clientes WHERE numero_compras > 0
      ORDER BY total_compras DESC LIMIT 50
    `, [], (err, rows) => { resultado.top_clientes = err ? [] : rows; verificar(); });

    // Saldo caja
    db.db.get(`
      SELECT COALESCE(
        (SELECT saldo_resultante FROM caja_movimientos ORDER BY id DESC LIMIT 1), 0
      ) as saldo_actual
    `, [], (err, row) => { resultado.caja = err ? { saldo_actual: 0 } : row; verificar(); });

    // Productos vendidos por mes (DETALLE HISTÓRICO)
    db.db.all(`
      SELECT
        strftime('%Y-%m', v.fecha) as mes,
        p.nombre as producto,
        p.categoria,
        SUM(vp.cantidad) as unidades,
        ROUND(SUM(vp.cantidad * vp.precio_unitario), 0) as ingresos
      FROM venta_productos vp
      INNER JOIN productos p ON vp.producto_id = p.id
      INNER JOIN ventas v ON vp.venta_id = v.id
      WHERE v.estado != 'Cancelado'
      GROUP BY mes, p.id
      ORDER BY mes DESC, unidades DESC
    `, [], (err, rows) => { resultado.productos_por_mes = err ? [] : rows; verificar(); });
  });
});

const IA_CHAT_PATH = path.join(app.getPath('userData'), 'ia-chat-sesiones.json');

ipcMain.handle('ia-guardar-sesion-chat', async (event, sesion) => {
  try {
    let sesiones = fs.existsSync(IA_CHAT_PATH)
      ? JSON.parse(fs.readFileSync(IA_CHAT_PATH, 'utf8')) : [];
    const idx = sesiones.findIndex(s => s.id === sesion.id);
    if (idx >= 0) sesiones[idx] = sesion;
    else sesiones.unshift(sesion);
    sesiones = sesiones.slice(0, 10);
    fs.writeFileSync(IA_CHAT_PATH, JSON.stringify(sesiones, null, 2));
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('ia-obtener-sesiones-chat', async () => {
  try {
    if (!fs.existsSync(IA_CHAT_PATH)) return [];
    return JSON.parse(fs.readFileSync(IA_CHAT_PATH, 'utf8'));
  } catch { return []; }
});

ipcMain.handle('ia-eliminar-sesion-chat', async (event, sesionId) => {
  try {
    if (!fs.existsSync(IA_CHAT_PATH)) return { success: true };
    let sesiones = JSON.parse(fs.readFileSync(IA_CHAT_PATH, 'utf8'));
    sesiones = sesiones.filter(s => s.id !== sesionId);
    fs.writeFileSync(IA_CHAT_PATH, JSON.stringify(sesiones, null, 2));
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('ia-chat-completo', async (event, { mensajes, apiKey }) => {
  const https = require('https');

// ✅ Después (compacto — solo tabla y columnas):
const tablas = await new Promise((resolve) => {
  db.db.all(
    `SELECT m.name AS tabla, p.name AS col, p.type AS tipo
     FROM sqlite_master m
     JOIN pragma_table_info(m.name) p
     WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%'
     ORDER BY m.name, p.cid`,
    [], (err, rows) => resolve(err ? [] : rows)
  );
});

// Agrupa por tabla para que sea más legible
const schemaCompacto = Object.entries(
  tablas.reduce((acc, r) => {
    if (!acc[r.tabla]) acc[r.tabla] = [];
    acc[r.tabla].push(`${r.col}(${r.tipo})`);
    return acc;
  }, {})
).map(([tabla, cols]) => `${tabla}: ${cols.join(', ')}`).join('\n');

const hoy = new Date();
const fechaHoy = hoy.toISOString().split('T')[0];
const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
const mesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`;

const systemPrompt = `Eres el asistente de Dalú, tienda de moda en Colombia.
Usa ejecutar_sql para consultar datos REALES. Nunca inventes. Responde en español con pesos colombianos ($).

FECHA DE HOY: ${fechaHoy}
MES ACTUAL: ${mesActual}
MES ANTERIOR: ${mesAnterior}

TABLAS DISPONIBLES:
${schemaCompacto}

REGLAS DE CÁLCULO (CRÍTICAS — OBLIGATORIAS, nunca las ignores):
- PROHIBIDO usar el campo 'total' en cualquier suma de dinero. Ese campo NO representa dinero recibido.
- El ÚNICO campo válido para calcular ingresos es: (monto_pagado - cambio)
- SIEMPRE incluir WHERE estado != 'Cancelado' en consultas de ventas
- "Lo que se vendió / cobró / recaudó / entró": SUM(monto_pagado - cambio) WHERE estado = 'Pagado' AND strftime('%Y-%m', fecha) = 'YYYY-MM'
- "Facturación / lo vendido incluyendo deudas": SUM(monto_pagado - cambio) WHERE estado IN ('Pagado','Pendiente') AND strftime('%Y-%m', fecha) = 'YYYY-MM'
- "Pendiente por cobrar": SUM(total - monto_pagado) WHERE estado = 'Pendiente'
- Si el usuario pregunta solo "cuánto se vendió" sin aclarar, usar solo estado = 'Pagado'

REGLAS DE CONSULTA DE PRODUCTOS VENDIDOS (OBLIGATORIAS):
- Para contar productos vendidos SIEMPRE hacer JOIN con ventas:
  FROM venta_productos vp INNER JOIN ventas v ON vp.venta_id = v.id
- NUNCA usar vp.fecha_creacion para filtrar fechas. SIEMPRE usar v.fecha
- SIEMPRE incluir WHERE v.estado != 'Cancelado'
- Cantidad de productos = SUM(vp.cantidad)
- Ejemplo correcto:
  SELECT strftime('%Y-%m', v.fecha) as mes, SUM(vp.cantidad) as unidades
  FROM venta_productos vp
  INNER JOIN ventas v ON vp.venta_id = v.id
  WHERE v.estado != 'Cancelado'
  GROUP BY mes ORDER BY unidades DESC

COMPORTAMIENTO OBLIGATORIO:
- NUNCA muestres código SQL al usuario. SIEMPRE ejecútalo con la herramienta ejecutar_sql y responde con los resultados reales.
- Si necesitas datos para responder, úsala. Nunca digas "deberías ejecutar esta consulta".

REGLA ANTI-ALUCINACIÓN (MUY IMPORTANTE):
- NUNCA inventes, asumas ni completes datos que no hayas obtenido de ejecutar_sql
- Si el usuario pregunta detalles de un cliente, producto o venta, SIEMPRE ejecuta un SELECT para obtener esos datos
- Si un dato no aparece en los resultados del query, di "no tengo ese dato en la base de datos"
- Está PROHIBIDO inventar cédulas, teléfonos, direcciones, montos o cualquier dato específico

- Para CADA pregunta nueva, ejecuta SIEMPRE un query fresco.
  NUNCA uses datos de respuestas anteriores en la conversación para responder.
  Los datos pueden haber cambiado o el contexto puede ser diferente.


REGLAS DE FECHA:
- Para filtrar por mes usa: strftime('%Y-%m', fecha) = 'YYYY-MM'
- "este mes" = '${mesActual}', "mes pasado" o "mayo" = '${mesAnterior}'

REGLAS DE NEGOCIO:
- "Top productos" últimos 6 meses, agrupar por p.id y p.nombre, ordenar por SUM(vp.cantidad) DESC
- Gastos operativos excluyen categorías 'Inventario' y 'Proveedores'
- Ganancia bruta = ingresos - costo_productos - costos_adicionales - comision_marcas
- Ganancia neta = ganancia_bruta - gastos_operativos`;

  const tools = [{
    type: 'function',
    function: {
      name: 'ejecutar_sql',
      description: 'Ejecuta un SELECT en la base de datos de Dalú y retorna los resultados reales.',
      parameters: {
        type: 'object',
        properties: { sql: { type: 'string', description: 'Query SELECT válida para SQLite3' } },
        required: ['sql']
      }
    }
  }];

  const llamarGroq = (messages) => new Promise((resolve) => {
    const body = JSON.stringify({
model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 2000,
      temperature: 0.1,
      messages,
      tools,
      tool_choice: 'auto'
    });
    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${apiKey}`
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) resolve({ error: parsed.error.message });
          else resolve({ ok: true, choice: parsed.choices?.[0] });
        } catch (e) { resolve({ error: e.message }); }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(body);
    req.end();
  });

  const ejecutarSQL = (sql) => new Promise((resolve) => {
    const upper = sql.trim().toUpperCase();
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH'))
      return resolve({ error: 'Solo se permiten SELECT' });
    db.db.all(sql, [], (err, rows) => {
      if (err) resolve({ error: err.message });
      else resolve({ filas: rows.slice(0, 300), total: rows.length });
    });
  });

const conversacion = [
  { role: 'system', content: systemPrompt },
  ...mensajes.map(m => ({ role: m.role, content: m.content }))
];
  for (let i = 0; i < 6; i++) {
    const res = await llamarGroq(conversacion);
    if (res.error) return { success: false, error: res.error };

    const { message, finish_reason } = res.choice;

    if (finish_reason === 'tool_calls' && message.tool_calls?.length > 0) {
      conversacion.push(message);
      for (const tc of message.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}
        const resultado = await ejecutarSQL(args.sql || '');
        console.log('🔍 SQL:', args.sql, '→', resultado.total ?? 'error', 'filas');
        conversacion.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(resultado) });
      }
      continue;
    }

    if (message.content) return { success: true, respuesta: message.content.trim() };
    break;
  }
  return { success: false, error: 'El modelo no pudo generar respuesta.' };
});



// ==================== API MÓVIL ====================

function iniciarApiMovil() {
  const express = require('express');
  const cors = require('cors');
  const api = express();
  api.use(cors());
  api.use(express.json());

  // ── Health check ──────────────────────────────────
  api.get('/api/ping', (req, res) => {
    res.json({ ok: true, app: 'Dalú' });
  });

  // ── INVENTARIO ────────────────────────────────────
  api.get('/api/productos', (req, res) => {
    const q = req.query.q || '';
    const where = q ? 'AND (p.nombre LIKE ? OR p.referencia LIKE ?)' : '';
    const params = q ? [`%${q}%`, `%${q}%`] : [];

    db.db.all(`
      SELECT
        p.id, p.nombre, p.referencia, p.categoria, p.precio_venta_base as precio,
        v.id as variante_id, v.talla, v.cantidad as stock
      FROM productos p
      JOIN variantes_producto v ON p.id = v.producto_id
      WHERE v.cantidad >= 0
      ${where}
      ORDER BY p.nombre ASC, v.talla ASC
    `, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Agrupar variantes por producto
      const mapa = {};
      rows.forEach(r => {
        if (!mapa[r.id]) {
          mapa[r.id] = {
            id: r.id,
            nombre: r.nombre,
            referencia: r.referencia,
            categoria: r.categoria,
            precio: r.precio,
            variantes: []
          };
        }
        mapa[r.id].variantes.push({
          id: r.variante_id,
          talla: r.talla,
          stock: r.stock
        });
      });

      res.json(Object.values(mapa));
    });
  });

  // ── VENTAS ────────────────────────────────────────
  api.get('/api/ventas', (req, res) => {
    db.db.all(`
      SELECT id, numero_venta, fecha, total, monto_pagado, cambio,
             metodo_pago, estado, cliente_nombre
      FROM ventas
      WHERE estado != 'Cancelado'
      ORDER BY fecha DESC
      LIMIT 100
    `, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  api.get('/api/ventas/:id', (req, res) => {
    db.db.get('SELECT * FROM ventas WHERE id = ?', [req.params.id], (err, venta) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!venta) return res.status(404).json({ error: 'No encontrada' });

      db.db.all(`
        SELECT vp.cantidad, vp.precio_unitario,
               p.nombre AS producto_nombre, var.talla
        FROM venta_productos vp
        LEFT JOIN productos p ON vp.producto_id = p.id
        LEFT JOIN variantes_producto var ON vp.variante_id = var.id
        WHERE vp.venta_id = ?
      `, [venta.id], (err, productos) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...venta, productos });
      });
    });
  });

  api.post('/api/ventas', async (req, res) => {
    try {
      const datosVenta = req.body;

      resolverCliente(datosVenta, async (err, clienteId, clienteNombre) => {
        if (err) return res.status(500).json({ error: err.message });

        const datosVentaDB = {
          cliente_id: clienteId,
          cliente_nombre: clienteNombre,
          productos: datosVenta.productos,
          productos_marca_aliada: [],
          costos_adicionales: [],
          subtotal: datosVenta.subtotal,
          total_marcas: 0,
          total: datosVenta.total,
          monto_pagado: datosVenta.monto_pagado,
          cambio: datosVenta.cambio || 0,
          metodo_pago: datosVenta.metodo_pago,
          notas: datosVenta.notas || 'Venta desde app móvil',
          descuento_porcentaje: 0,
          descuento_monto: 0
        };

        db.ventas.crear(datosVentaDB, async (err, resultado) => {
          if (err) return res.status(500).json({ error: err.message });

          // Historial de rotación
          for (const p of (datosVentaDB.productos || [])) {
            await actualizarStock(p, resultado.id).catch(console.error);
          }

          // Deuda si pago parcial
          if (datosVenta.monto_pagado < datosVenta.total && clienteId) {
            await crearDeudaCliente(
              resultado.id, clienteId, clienteNombre,
              datosVenta.total, datosVenta.monto_pagado
            ).catch(console.error);
          }

          // Estadísticas del cliente
          if (clienteId) {
            db.db.run(
              `UPDATE clientes SET
                ultima_compra = datetime('now', 'localtime'),
                total_compras = total_compras + ?,
                numero_compras = numero_compras + 1
               WHERE id = ?`,
              [datosVenta.total, clienteId]
            );
          }

          // Registrar en caja
          if (datosVenta.monto_pagado > 0) {
            cajaModel.registrarMovimiento({
              tipo: 'entrada',
              concepto: `Venta #${resultado.numero_venta} (móvil) — ${clienteNombre}`,
              monto: datosVenta.monto_pagado - (datosVenta.cambio || 0),
              origen: 'venta',
              referencia_id: resultado.id
            }, () => {});
          }

          res.json({
            success: true,
            venta_id: resultado.id,
            numero_venta: resultado.numero_venta
          });
        });
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── CLIENTES ──────────────────────────────────────
  api.get('/api/clientes', (req, res) => {
    const q = req.query.q || '';
    db.db.all(`
      SELECT id, nombre, cedula, celular
      FROM clientes
      WHERE nombre LIKE ? OR cedula LIKE ? OR celular LIKE ?
      ORDER BY nombre ASC LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  api.listen(3001, '0.0.0.0', () => {
    console.log('📱 API móvil activa en puerto 3001');
  });
}

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

function verificarReinicioFidelidadAutomatico() {
  console.log('🔄 Verificando reinicio automático de fidelidad...');

  clientesModel.verificarYReiniciarFidelidad((err, resultado) => {
    if (err) {
      console.error('❌ Error al verificar reinicio de fidelidad:', err);
    } else {
      if (resultado.clientes_reiniciados > 0) {
        console.log(`✅ ${resultado.clientes_reiniciados} cliente(s) tuvieron su fidelidad reiniciada automáticamente`);
      } else {
        console.log('✅ Verificación completada. No hay clientes para reiniciar.');
      }
    }
  });
}

// Verificar fidelidad al iniciar
  setTimeout(() => {
    verificarReinicioFidelidadAutomatico();
  }, 5000);

    // Verificar cada 24 horas (86400000 ms)
    setInterval(verificarReinicioFidelidadAutomatico, 24 * 60 * 60 * 1000);

    console.log('✅ Sistema de reinicio automático de fidelidad activado');

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
