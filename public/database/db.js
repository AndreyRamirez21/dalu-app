const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Determinar la ruta correcta según el entorno
let dbPath;

if (app.isPackaged) {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'dalu.db');
} else {
  dbPath = path.join(app.getPath('userData'), 'dalu.db');
}

console.log('📂 Base de datos en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conectado a SQLite');
    initDatabase();
  }
});

// Crear tablas
function initDatabase() {
  db.serialize(() => {
    // Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE,
      telefono TEXT,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

// Productos (ahora sin talla individual)
db.run(`CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referencia TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  costo_base REAL NOT NULL,
  precio_venta_base REAL NOT NULL,
  tiene_variantes INTEGER DEFAULT 0,
  imagen TEXT,
  fecha_creado DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Agregar columna imagen si no existe (para bases de datos existentes)
db.run(`ALTER TABLE productos ADD COLUMN imagen TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error al agregar columna imagen:', err);
  }
});

    // Nueva tabla de variantes
    db.run(`CREATE TABLE IF NOT EXISTS variantes_producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      talla TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0,
      ajuste_precio REAL DEFAULT 0,
      fecha_creado DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      UNIQUE(producto_id, talla)
    )`);

    // Ventas
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      total REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    // Detalle de ventas (actualizado para variantes)
    db.run(`CREATE TABLE IF NOT EXISTS venta_productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      variante_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      FOREIGN KEY(venta_id) REFERENCES ventas(id),
      FOREIGN KEY(producto_id) REFERENCES productos(id),
      FOREIGN KEY(variante_id) REFERENCES variantes_producto(id)
    )`);

   // ==================== FUNCIONES PARA GASTOS ====================


   // Crear tabla de gastos mejorada
     db.run(`CREATE TABLE IF NOT EXISTS gastos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       fecha DATE NOT NULL,
       descripcion TEXT NOT NULL,
       categoria TEXT NOT NULL,
       monto REAL NOT NULL,
       metodo_pago TEXT NOT NULL,
       proveedor TEXT,
       notas TEXT,
       fecha_creado DATETIME DEFAULT CURRENT_TIMESTAMP,
       fecha_actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
     )`, (err) => {
       if (err) {
         console.error('Error al crear tabla gastos:', err);
       } else {
         console.log('✅ Tabla gastos creada/verificada');
       }
     });


db.run(`CREATE TABLE IF NOT EXISTS deudas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acreedor TEXT NOT NULL,
    factura TEXT,
    tipo_acreedor TEXT,
    monto_total REAL NOT NULL,
    monto_pagado REAL DEFAULT 0,
    notas TEXT,
    fecha_creacion DATE DEFAULT CURRENT_TIMESTAMP,
    fecha_recordatorio DATE,
    estado TEXT DEFAULT 'Pendiente',
    fecha_actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla deudas:', err);
    } else {
      console.log('✅ Tabla deudas creada/verificada');
    }
  });

  // Tabla para historial de pagos
  db.run(`CREATE TABLE IF NOT EXISTS pagos_deuda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deuda_id INTEGER NOT NULL,
    monto_pago REAL NOT NULL,
    fecha_pago DATE DEFAULT CURRENT_TIMESTAMP,
    metodo_pago TEXT,
    notas TEXT,
    FOREIGN KEY(deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla pagos_deuda:', err);
    } else {
      console.log('✅ Tabla pagos_deuda creada/verificada');
    }
  });






    console.log('✅ Tablas creadas correctamente');
  });
}


 // ==================== FUNCIONES PARA GASTOS ====================

   // Agregar gasto
   function agregarGasto(datos, callback) {
     const { fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas } = datos;

     const sql = `INSERT INTO gastos (fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`;

     db.run(sql, [fecha, descripcion, categoria, monto, metodo_pago, proveedor || null, notas || null], function(err) {
       if (err) {
         console.error('❌ Error al agregar gasto:', err);
         callback(err, null);
       } else {
         console.log('✅ Gasto agregado con ID:', this.lastID);
         callback(null, { id: this.lastID, ...datos });
       }
     });
   }

   // Obtener todos los gastos
   function obtenerGastos(callback) {
     const sql = `SELECT * FROM gastos ORDER BY fecha DESC, fecha_creado DESC`;

     db.all(sql, [], (err, rows) => {
       if (err) {
         console.error('❌ Error al obtener gastos:', err);
         callback(err, null);
       } else {
         console.log('✅ Gastos obtenidos:', rows.length);
         callback(null, rows);
       }
     });
   }

   // Obtener gastos por categoría
   function obtenerGastosPorCategoria(categoria, callback) {
     const sql = `SELECT * FROM gastos WHERE categoria = ? ORDER BY fecha DESC`;

     db.all(sql, [categoria], (err, rows) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, rows);
       }
     });
   }

   // Obtener gastos por rango de fechas
   function obtenerGastosPorFecha(fechaInicio, fechaFin, callback) {
     const sql = `SELECT * FROM gastos WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC`;

     db.all(sql, [fechaInicio, fechaFin], (err, rows) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, rows);
       }
     });
   }

   // Buscar gastos
   function buscarGastos(termino, callback) {
     const sql = `SELECT * FROM gastos
                  WHERE descripcion LIKE ? OR proveedor LIKE ? OR notas LIKE ?
                  ORDER BY fecha DESC`;

     const searchTerm = `%${termino}%`;

     db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, rows);
       }
     });
   }

   // Actualizar gasto
   function actualizarGasto(id, datos, callback) {
     const { fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas } = datos;

     const sql = `UPDATE gastos
                  SET fecha = ?, descripcion = ?, categoria = ?, monto = ?,
                      metodo_pago = ?, proveedor = ?, notas = ?,
                      fecha_actualizado = CURRENT_TIMESTAMP
                  WHERE id = ?`;

     db.run(sql, [fecha, descripcion, categoria, monto, metodo_pago, proveedor || null, notas || null, id], function(err) {
       if (err) {
         console.error('❌ Error al actualizar gasto:', err);
         callback(err, null);
       } else {
         console.log('✅ Gasto actualizado:', id);
         callback(null, { id, ...datos, updated: this.changes });
       }
     });
   }

   // Eliminar gasto
   function eliminarGasto(id, callback) {
     const sql = `DELETE FROM gastos WHERE id = ?`;

     db.run(sql, [id], function(err) {
       if (err) {
         console.error('❌ Error al eliminar gasto:', err);
         callback(err, null);
       } else {
         console.log('✅ Gasto eliminado:', id);
         callback(null, { deleted: this.changes });
       }
     });
   }

   // Obtener estadísticas de gastos
   function obtenerEstadisticasGastos(callback) {
     const sql = `SELECT
                    categoria,
                    COUNT(*) as cantidad,
                    SUM(monto) as total,
                    AVG(monto) as promedio
                  FROM gastos
                  GROUP BY categoria
                  ORDER BY total DESC`;

     db.all(sql, [], (err, rows) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, rows);
       }
     });
   }

   // Obtener total de gastos
   function obtenerTotalGastos(callback) {
     const sql = `SELECT
                    COUNT(*) as total_registros,
                    SUM(monto) as total_gastado,
                    AVG(monto) as gasto_promedio
                  FROM gastos`;

     db.get(sql, [], (err, row) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, row);
       }
     });
   }

   // Obtener gastos del mes actual
   function obtenerGastosMesActual(callback) {
     const sql = `SELECT * FROM gastos
                  WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
                  ORDER BY fecha DESC`;

     db.all(sql, [], (err, rows) => {
       if (err) {
         callback(err, null);
       } else {
         callback(null, rows);
       }
     });
   }



// ==================== FUNCIONES PARA PRODUCTOS CON VARIANTES ====================

function agregarProducto(datos, callback) {
  const { referencia, nombre, categoria, costo_base, precio_venta_base, variantes } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insertar producto principal
    const sqlProducto = `INSERT INTO productos (referencia, nombre, categoria, costo_base, precio_venta_base, tiene_variantes)
                         VALUES (?, ?, ?, ?, ?, ?)`;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(sqlProducto, [referencia, nombre, categoria, costo_base, precio_venta_base, tieneVariantes], function(err) {
      if (err) {
        db.run('ROLLBACK');
        callback(err, null);
        return;
      }

      const productoId = this.lastID;

      // Si hay variantes, insertarlas
      if (variantes && variantes.length > 0) {
        const sqlVariante = `INSERT INTO variantes_producto (producto_id, talla, cantidad, ajuste_precio)
                             VALUES (?, ?, ?, ?)`;

        let variantesInsertadas = 0;
        let errorOcurrido = false;

        variantes.forEach((variante) => {
          db.run(sqlVariante, [productoId, variante.talla, variante.cantidad, variante.ajuste_precio || 0], (err) => {
            if (err && !errorOcurrido) {
              errorOcurrido = true;
              db.run('ROLLBACK');
              callback(err, null);
              return;
            }

            variantesInsertadas++;

            if (variantesInsertadas === variantes.length && !errorOcurrido) {
              db.run('COMMIT');
              callback(null, { id: productoId, ...datos });
            }
          });
        });
      } else {
        db.run('COMMIT');
        callback(null, { id: productoId, ...datos });
      }
    });
  });
}

function obtenerProductos(callback) {
  const sql = `SELECT p.*,
                GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|') as variantes_data
               FROM productos p
               LEFT JOIN variantes_producto v ON p.id = v.producto_id
               GROUP BY p.id
               ORDER BY p.fecha_creado DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    // Procesar las variantes
    const productos = rows.map(row => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map(v => {
          const [id, talla, cantidad, ajuste_precio] = v.split(':');
          return {
            id: parseInt(id),
            talla,
            cantidad: parseInt(cantidad),
            ajuste_precio: parseFloat(ajuste_precio)
          };
        });
      } else {
        producto.variantes = [];
      }

      delete producto.variantes_data;
      return producto;
    });

    callback(null, productos);
  });
}

function obtenerProductosPorCategoria(categoria, callback) {
  const sql = `SELECT p.*,
                GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|') as variantes_data
               FROM productos p
               LEFT JOIN variantes_producto v ON p.id = v.producto_id
               WHERE p.categoria = ?
               GROUP BY p.id
               ORDER BY p.fecha_creado DESC`;

  db.all(sql, [categoria], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    const productos = rows.map(row => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map(v => {
          const [id, talla, cantidad, ajuste_precio] = v.split(':');
          return {
            id: parseInt(id),
            talla,
            cantidad: parseInt(cantidad),
            ajuste_precio: parseFloat(ajuste_precio)
          };
        });
      } else {
        producto.variantes = [];
      }

      delete producto.variantes_data;
      return producto;
    });

    callback(null, productos);
  });
}

function buscarProductos(termino, callback) {
  const sql = `SELECT p.*,
                GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|') as variantes_data
               FROM productos p
               LEFT JOIN variantes_producto v ON p.id = v.producto_id
               WHERE p.nombre LIKE ? OR p.referencia LIKE ? OR p.categoria LIKE ?
               GROUP BY p.id
               ORDER BY p.fecha_creado DESC`;

  const searchTerm = `%${termino}%`;

  db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    const productos = rows.map(row => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map(v => {
          const [id, talla, cantidad, ajuste_precio] = v.split(':');
          return {
            id: parseInt(id),
            talla,
            cantidad: parseInt(cantidad),
            ajuste_precio: parseFloat(ajuste_precio)
          };
        });
      } else {
        producto.variantes = [];
      }

      delete producto.variantes_data;
      return producto;
    });

    callback(null, productos);
  });
}

function actualizarProducto(id, datos, callback) {
  const { referencia, nombre, categoria, costo_base, precio_venta_base, variantes } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Actualizar producto principal
    const sqlProducto = `UPDATE productos
                         SET referencia = ?, nombre = ?, categoria = ?, costo_base = ?,
                             precio_venta_base = ?, tiene_variantes = ?, fecha_actualizado = CURRENT_TIMESTAMP
                         WHERE id = ?`;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(sqlProducto, [referencia, nombre, categoria, costo_base, precio_venta_base, tieneVariantes, id], function(err) {
      if (err) {
        db.run('ROLLBACK');
        callback(err, null);
        return;
      }

      // Eliminar variantes antiguas
      db.run('DELETE FROM variantes_producto WHERE producto_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        // Insertar nuevas variantes
        if (variantes && variantes.length > 0) {
          const sqlVariante = `INSERT INTO variantes_producto (producto_id, talla, cantidad, ajuste_precio)
                               VALUES (?, ?, ?, ?)`;

          let variantesInsertadas = 0;
          let errorOcurrido = false;

          variantes.forEach((variante) => {
            db.run(sqlVariante, [id, variante.talla, variante.cantidad, variante.ajuste_precio || 0], (err) => {
              if (err && !errorOcurrido) {
                errorOcurrido = true;
                db.run('ROLLBACK');
                callback(err, null);
                return;
              }

              variantesInsertadas++;

              if (variantesInsertadas === variantes.length && !errorOcurrido) {
                db.run('COMMIT');
                callback(null, { id, ...datos });
              }
            });
          });
        } else {
          db.run('COMMIT');
          callback(null, { id, ...datos });
        }
      });
    });
  });
}

function eliminarProducto(id, callback) {
  // El CASCADE en la definición de la tabla se encarga de eliminar las variantes
  db.run('DELETE FROM productos WHERE id = ?', [id], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { deleted: this.changes });
    }
  });
}

function obtenerEstadisticasInventario(callback) {
  const sql = `SELECT
                 COUNT(DISTINCT p.id) as total,
                 SUM(CASE
                   WHEN p.tiene_variantes = 0 THEN 0
                   WHEN EXISTS (
                     SELECT 1 FROM variantes_producto v
                     WHERE v.producto_id = p.id AND v.cantidad < 10 AND v.cantidad > 0
                   ) THEN 1
                   ELSE 0
                 END) as stock_bajo,
                 SUM(CASE
                   WHEN p.tiene_variantes = 0 THEN 0
                   WHEN NOT EXISTS (
                     SELECT 1 FROM variantes_producto v
                     WHERE v.producto_id = p.id AND v.cantidad > 0
                   ) THEN 1
                   ELSE 0
                 END) as agotados
               FROM productos p`;

  db.get(sql, [], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

// Función auxiliar para actualizar stock de una variante específica
function actualizarStockVariante(varianteId, nuevaCantidad, callback) {
  const sql = `UPDATE variantes_producto SET cantidad = ? WHERE id = ?`;

  db.run(sql, [nuevaCantidad, varianteId], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { updated: this.changes });
    }
  });
}



// Agregar deuda
function agregarDeuda(datos, callback) {
  const { acreedor, factura, tipo_acreedor, monto_total, monto_pagado, notas, fecha_recordatorio } = datos;

  const sql = `INSERT INTO deudas (acreedor, factura, tipo_acreedor, monto_total, monto_pagado, notas, fecha_recordatorio, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const montoPagado = monto_pagado || 0;
  const estado = montoPagado >= monto_total ? 'Pagado' : 'Pendiente';

  db.run(sql, [acreedor, factura || null, tipo_acreedor || 'Otro', monto_total, montoPagado, notas || null, fecha_recordatorio || null, estado], function(err) {
    if (err) {
      console.error('❌ Error al agregar deuda:', err);
      callback(err, null);
    } else {
      console.log('✅ Deuda agregada con ID:', this.lastID);
      callback(null, { id: this.lastID, ...datos });
    }
  });
}

// Obtener todas las deudas
function obtenerDeudas(callback) {
  const sql = `SELECT * FROM deudas ORDER BY
               CASE
                 WHEN estado = 'Pendiente' THEN 1
                 WHEN estado = 'Vencida' THEN 0
                 ELSE 2
               END,
               fecha_creacion DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener deudas:', err);
      callback(err, null);
    } else {
      console.log('✅ Deudas obtenidas:', rows.length);
      callback(null, rows);
    }
  });
}

// Obtener deudas pendientes
function obtenerDeudasPendientes(callback) {
  const sql = `SELECT * FROM deudas WHERE estado IN ('Pendiente', 'Vencida') ORDER BY fecha_creacion DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Obtener deuda por ID con historial de pagos
function obtenerDeudaPorId(id, callback) {
  const sqlDeuda = `SELECT * FROM deudas WHERE id = ?`;
  const sqlPagos = `SELECT * FROM pagos_deuda WHERE deuda_id = ? ORDER BY fecha_pago DESC`;

  db.get(sqlDeuda, [id], (err, deuda) => {
    if (err) {
      callback(err, null);
      return;
    }

    if (!deuda) {
      callback(new Error('Deuda no encontrada'), null);
      return;
    }

    db.all(sqlPagos, [id], (err, pagos) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { ...deuda, pagos: pagos });
      }
    });
  });
}

// Registrar pago de deuda
function registrarPagoDeuda(deudaId, montoPago, metodoPago, notas, callback) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Obtener deuda actual
    db.get('SELECT * FROM deudas WHERE id = ?', [deudaId], (err, deuda) => {
      if (err) {
        db.run('ROLLBACK');
        callback(err, null);
        return;
      }

      if (!deuda) {
        db.run('ROLLBACK');
        callback(new Error('Deuda no encontrada'), null);
        return;
      }

      const nuevoMontoPagado = parseFloat(deuda.monto_pagado) + parseFloat(montoPago);
      const nuevoEstado = nuevoMontoPagado >= parseFloat(deuda.monto_total) ? 'Pagado' : 'Pendiente';

      // Registrar pago
      const sqlPago = `INSERT INTO pagos_deuda (deuda_id, monto_pago, metodo_pago, notas)
                       VALUES (?, ?, ?, ?)`;

      db.run(sqlPago, [deudaId, montoPago, metodoPago, notas || null], function(err) {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        // Actualizar deuda
        const sqlUpdate = `UPDATE deudas
                          SET monto_pagado = ?, estado = ?, fecha_actualizado = CURRENT_TIMESTAMP
                          WHERE id = ?`;

        db.run(sqlUpdate, [nuevoMontoPagado, nuevoEstado, deudaId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            callback(err, null);
          } else {
            db.run('COMMIT');
            console.log('✅ Pago registrado exitosamente');
            callback(null, {
              success: true,
              nuevoMontoPagado,
              nuevoEstado,
              pagoId: this.lastID
            });
          }
        });
      });
    });
  });
}

// Actualizar deuda
function actualizarDeuda(id, datos, callback) {
  const { acreedor, factura, tipo_acreedor, monto_total, notas, fecha_recordatorio } = datos;

  const sql = `UPDATE deudas
               SET acreedor = ?, factura = ?, tipo_acreedor = ?, monto_total = ?,
                   notas = ?, fecha_recordatorio = ?, fecha_actualizado = CURRENT_TIMESTAMP
               WHERE id = ?`;

  db.run(sql, [acreedor, factura || null, tipo_acreedor, monto_total, notas || null, fecha_recordatorio || null, id], function(err) {
    if (err) {
      console.error('❌ Error al actualizar deuda:', err);
      callback(err, null);
    } else {
      // Verificar si el estado cambió
      db.get('SELECT monto_pagado, monto_total FROM deudas WHERE id = ?', [id], (err, row) => {
        if (!err && row) {
          const nuevoEstado = row.monto_pagado >= row.monto_total ? 'Pagado' : 'Pendiente';
          db.run('UPDATE deudas SET estado = ? WHERE id = ?', [nuevoEstado, id]);
        }
      });

      console.log('✅ Deuda actualizada:', id);
      callback(null, { id, ...datos, updated: this.changes });
    }
  });
}

// Eliminar deuda
function eliminarDeuda(id, callback) {
  const sql = `DELETE FROM deudas WHERE id = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('❌ Error al eliminar deuda:', err);
      callback(err, null);
    } else {
      console.log('✅ Deuda eliminada:', id);
      callback(null, { deleted: this.changes });
    }
  });
}

// Buscar deudas
function buscarDeudas(termino, callback) {
  const sql = `SELECT * FROM deudas
               WHERE acreedor LIKE ? OR factura LIKE ? OR notas LIKE ?
               ORDER BY fecha_creacion DESC`;

  const searchTerm = `%${termino}%`;

  db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Obtener estadísticas de deudas
function obtenerEstadisticasDeudas(callback) {
  const sql = `SELECT
                 COUNT(*) as total_deudas,
                 SUM(monto_total) as total_adeudado,
                 SUM(monto_pagado) as total_pagado,
                 SUM(monto_total - monto_pagado) as total_pendiente,
                 COUNT(CASE WHEN estado = 'Pagado' THEN 1 END) as deudas_pagadas,
                 COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as deudas_pendientes
               FROM deudas`;

  db.get(sql, [], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

// Verificar deudas con recordatorio para hoy
function verificarRecordatoriosDeudas(callback) {
  const hoy = new Date().toISOString().split('T')[0]; // Ejemplo: "2025-12-03"

  console.log('🔍 Buscando recordatorios para:', hoy);

  // Usar LIKE para ser más flexible con el formato
  const sql = `SELECT * FROM deudas
               WHERE fecha_recordatorio LIKE ?
               AND estado IN ('Pendiente', 'Vencida')`;

  db.all(sql, [`${hoy}%`], (err, rows) => {
    if (err) {
      console.error('❌ Error en verificarRecordatoriosDeudas:', err);
      callback(err, null);
    } else {
      console.log('✅ Recordatorios encontrados:', rows.length);
      if (rows.length > 0) {
        console.log('📋 Detalles:', rows);
      }
      callback(null, rows);
    }
  });
}

// Obtener historial de pagos de una deuda
function obtenerHistorialPagos(deudaId, callback) {
  const sql = `SELECT * FROM pagos_deuda WHERE deuda_id = ? ORDER BY fecha_pago DESC`;

  db.all(sql, [deudaId], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}



module.exports = {

  // Exports de inventario(productos)
  db,
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario,
  actualizarStockVariante,

   // Nuevos exports de gastos
    agregarGasto,
    obtenerGastos,
    obtenerGastosPorCategoria,
    obtenerGastosPorFecha,
    buscarGastos,
    actualizarGasto,
    eliminarGasto,
    obtenerEstadisticasGastos,
    obtenerTotalGastos,
    obtenerGastosMesActual,


    // Nuevos exports de deudas
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
      obtenerHistorialPagos
};