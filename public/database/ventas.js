const { db } = require('./db');

// Crear tablas necesarias (sin migraciones)
function crearTablas() {
    // Tabla de ventas
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_venta TEXT,
        cliente_id INTEGER,
        cliente_nombre TEXT,
        subtotal REAL,
        total REAL NOT NULL,
        monto_pagado REAL DEFAULT 0,
        cambio REAL DEFAULT 0,
        estado TEXT DEFAULT 'Pendiente',
        metodo_pago TEXT,
        notas TEXT,
        fecha DATETIME DEFAULT (datetime('now', 'localtime')),
        fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla ventas:', err);
        }
    });

    // Tabla de productos vendidos
    db.run(`CREATE TABLE IF NOT EXISTS venta_productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        variante_id INTEGER,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY(venta_id) REFERENCES ventas(id),
        FOREIGN KEY(producto_id) REFERENCES productos(id),
        FOREIGN KEY(variante_id) REFERENCES variantes_producto(id)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla venta_productos:', err);
        }
    });

    // Tabla de costos adicionales
    db.run(`CREATE TABLE IF NOT EXISTS costos_adicionales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        concepto TEXT NOT NULL,
        monto REAL NOT NULL,
        FOREIGN KEY(venta_id) REFERENCES ventas(id)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla costos_adicionales:', err);
        }
    });

    // Tabla de deudas de clientes
    db.run(`CREATE TABLE IF NOT EXISTS deudas_clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER,
        cliente_id INTEGER,
        cliente_nombre TEXT,
        monto_total REAL NOT NULL,
        monto_pagado REAL DEFAULT 0,
        monto_pendiente REAL,
        estado TEXT DEFAULT 'Pendiente',
        fecha_creacion DATETIME DEFAULT (datetime('now', 'localtime')),
        fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY(venta_id) REFERENCES ventas(id)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla deudas_clientes:', err);
        }
    });

    // Tabla de abonos a deudas
    db.run(`CREATE TABLE IF NOT EXISTS abonos_deuda_cliente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deuda_cliente_id INTEGER NOT NULL,
        monto_abono REAL NOT NULL,
        metodo_pago TEXT,
        notas TEXT,
        fecha_abono DATETIME DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY(deuda_cliente_id) REFERENCES deudas_clientes(id)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla abonos_deuda_cliente:', err);
        }
    });

    console.log('✅ Tablas de ventas creadas correctamente');
}

// Ejecutar creación de tablas al cargar el módulo
crearTablas();

// ==================== FUNCIONES PARA VENTAS ====================

function generarNumeroVenta(callback) {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const prefijo = `V${año}${mes}${dia}`;

    db.get(`SELECT numero_venta FROM ventas WHERE numero_venta LIKE ? ORDER BY numero_venta DESC LIMIT 1`, [`${prefijo}%`], (err, row) => {
        if (err) { callback(err, null); return; }
        let consecutivo = 1;
        if (row && row.numero_venta) {
            consecutivo = parseInt(row.numero_venta.slice(-4)) + 1;
        }
        callback(null, `${prefijo}-${consecutivo.toString().padStart(4, '0')}`);
    });
}

function crearVenta(datosVenta, callback) {
    const { cliente_nombre, cliente_id, productos, subtotal, total, monto_pagado, cambio, metodo_pago, notas, costos_adicionales } = datosVenta;

    console.log('🔵 Iniciando creación de venta');
    console.log('🔵 Productos recibidos:', productos);
    console.log('🔵 Costos adicionales recibidos:', costos_adicionales);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        generarNumeroVenta((err, numeroVenta) => {
            if (err) {
                db.run('ROLLBACK');
                callback(err, null);
                return;
            }

            const estado = monto_pagado >= total ? 'Pagado' : 'Pendiente';

            db.run(
                `INSERT INTO ventas (numero_venta, cliente_id, cliente_nombre, subtotal, total, monto_pagado, cambio, estado, metodo_pago, notas)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [numeroVenta, cliente_id || null, cliente_nombre, subtotal, total, monto_pagado, cambio || 0, estado, metodo_pago, notas || null],
                function (err) {
                    if (err) {
                        console.error('❌ Error al insertar venta:', err);
                        db.run('ROLLBACK');
                        callback(err, null);
                        return;
                    }

                    const ventaId = this.lastID;
                    console.log('✅ Venta insertada con ID:', ventaId);

                    if (!productos || productos.length === 0) {
                        console.log('⚠️ No hay productos para guardar');
                        db.run('COMMIT');
                        callback(null, { success: true, id: ventaId, numero_venta: numeroVenta });
                        return;
                    }

                    console.log(`🔵 Guardando ${productos.length} productos...`);

                    let insertados = 0;
                    let hayErrores = false;

                    productos.forEach((p, index) => {
                        console.log(`🔵 Guardando producto ${index + 1}:`, p);

                        const subtotalProducto = p.cantidad * p.precio_unitario;

                        db.run(
                            `INSERT INTO venta_productos (venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [ventaId, p.producto_id, p.variante_id || null, p.cantidad, p.precio_unitario, subtotalProducto],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error al insertar producto ${index + 1}:`, err);
                                    hayErrores = true;
                                }

                                if (p.variante_id) {
                                    db.run(
                                        `UPDATE variantes_producto SET cantidad = cantidad - ? WHERE id = ?`,
                                        [p.cantidad, p.variante_id],
                                        (err) => {
                                            if (err) {
                                                console.error(`❌ Error al actualizar stock de variante ${p.variante_id}:`, err);
                                            } else {
                                                console.log(`✅ Stock actualizado para variante ${p.variante_id}`);
                                            }
                                        }
                                    );
                                }

                                insertados++;
                                console.log(`✅ Producto ${insertados}/${productos.length} guardado`);

                                if (insertados === productos.length) {
                                    if (hayErrores) {
                                        console.error('❌ Hubo errores al guardar productos, haciendo ROLLBACK');
                                        db.run('ROLLBACK');
                                        callback(new Error('Error al guardar productos'), null);
                                    } else {
                                        if (costos_adicionales && costos_adicionales.length > 0) {
                                            console.log(`🔵 Guardando ${costos_adicionales.length} costos adicionales...`);
                                            let costosGuardados = 0;
                                            let errorCostos = false;

                                            costos_adicionales.forEach((costo, idx) => {
                                                db.run(
                                                    `INSERT INTO costos_adicionales (venta_id, concepto, monto) VALUES (?, ?, ?)`,
                                                    [ventaId, costo.concepto, costo.monto],
                                                    (err) => {
                                                        if (err) {
                                                            console.error(`❌ Error al guardar costo adicional ${idx + 1}:`, err);
                                                            errorCostos = true;
                                                        } else {
                                                            console.log(`✅ Costo adicional ${idx + 1} guardado: ${costo.concepto} - $${costo.monto}`);
                                                        }

                                                        costosGuardados++;

                                                        if (costosGuardados === costos_adicionales.length) {
                                                            if (errorCostos) {
                                                                console.error('❌ Error al guardar costos, haciendo ROLLBACK');
                                                                db.run('ROLLBACK');
                                                                callback(new Error('Error al guardar costos adicionales'), null);
                                                            } else {
                                                                console.log('✅ Todos los costos guardados, haciendo COMMIT');
                                                                db.run('COMMIT', (err) => {
                                                                    if (err) {
                                                                        console.error('❌ Error en COMMIT:', err);
                                                                        callback(err, null);
                                                                    } else {
                                                                        console.log('✅ Transacción completada exitosamente');
                                                                        callback(null, { success: true, id: ventaId, numero_venta: numeroVenta });
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                );
                                            });
                                        } else {
                                            console.log('✅ No hay costos adicionales, haciendo COMMIT');
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    console.error('❌ Error en COMMIT:', err);
                                                    callback(err, null);
                                                } else {
                                                    console.log('✅ Transacción completada exitosamente');
                                                    callback(null, { success: true, id: ventaId, numero_venta: numeroVenta });
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        );
                    });
                }
            );
        });
    });
}

function obtenerVentas(callback) {
    db.all(`SELECT * FROM ventas ORDER BY fecha DESC`, [], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

function obtenerVentaPorId(id, callback) {
    db.get(`SELECT * FROM ventas WHERE id = ?`, [id], (err, venta) => {
        if (err) {
            console.error('❌ Error al obtener venta:', err);
            callback(err, null);
            return;
        }
        if (!venta) {
            callback(new Error('Venta no encontrada'), null);
            return;
        }

        console.log('📦 Venta encontrada:', venta);

        db.all(`
            SELECT
                vp.id,
                vp.venta_id,
                vp.producto_id,
                vp.variante_id,
                vp.cantidad,
                vp.precio_unitario,
                p.nombre as producto_nombre,
                p.referencia as producto_referencia,
                p.precio_venta_base as producto_precio_base,
                v.talla as talla,
                (vp.cantidad * vp.precio_unitario) as subtotal
            FROM venta_productos vp
            LEFT JOIN productos p ON vp.producto_id = p.id
            LEFT JOIN variantes_producto v ON vp.variante_id = v.id
            WHERE vp.venta_id = ?
        `, [id], (err, productos) => {
            if (err) {
                console.error('❌ Error al obtener productos:', err);
                callback(err, null);
                return;
            }

            console.log('📦 Productos encontrados:', productos);

            db.all(`
                SELECT * FROM costos_adicionales WHERE venta_id = ?
            `, [id], (err, costosAdicionales) => {
                if (err) {
                    console.error('❌ Error al obtener costos adicionales:', err);
                    callback(err, null);
                    return;
                }

                console.log('💰 Costos adicionales:', costosAdicionales);

                const totalCostosAdicionales = costosAdicionales ?
                    costosAdicionales.reduce((sum, costo) => sum + Number(costo.monto || 0), 0) : 0;

                const resultado = {
                    ...venta,
                    productos: productos || [],
                    costos_adicionales: costosAdicionales || [],
                    total_costos_adicionales: totalCostosAdicionales
                };

                console.log('✅ Resultado final:', resultado);
                callback(null, resultado);
            });
        });
    });
}

function buscarVentas(termino, callback) {
    const t = `%${termino}%`;
    db.all(`SELECT * FROM ventas WHERE numero_venta LIKE ? OR cliente_nombre LIKE ? ORDER BY fecha DESC`, [t, t], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

function obtenerEstadisticasVentas(callback) {
  console.log('📊 Obteniendo estadísticas de ventas...');

  db.get(`
    SELECT
      COUNT(*) as total_ventas,
      SUM(v.total) as total_vendido,
      SUM(CASE WHEN v.estado = 'Pendiente' THEN (v.total - v.monto_pagado) ELSE 0 END) as total_pendiente
    FROM ventas v
    WHERE v.estado != 'Cancelado'
      AND strftime('%Y-%m', v.fecha) = strftime('%Y-%m', 'now', 'localtime')
  `, [], (err, row1) => {
    if (err) {
      console.error('❌ Error en estadísticas ventas:', err);
      callback(err, null);
      return;
    }

    db.get(`
      SELECT COALESCE(SUM(ca.monto), 0) as total_costos_adicionales
      FROM costos_adicionales ca
      INNER JOIN ventas v ON ca.venta_id = v.id
      WHERE v.estado != 'Cancelado'
        AND strftime('%Y-%m', v.fecha) = strftime('%Y-%m', 'now', 'localtime')
    `, [], (err, row2) => {
      if (err) {
        console.error('❌ Error en costos adicionales:', err);
        callback(err, null);
        return;
      }

      console.log('✅ Estadísticas:', {
        ...row1,
        total_costos_adicionales: row2.total_costos_adicionales
      });

      callback(null, {
        total_ventas: row1.total_ventas || 0,
        total_vendido: row1.total_vendido || 0,
        total_pendiente: row1.total_pendiente || 0,
        total_costos_adicionales: row2.total_costos_adicionales || 0
      });
    });
  });
}

function cancelarVenta(id, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.all(`SELECT * FROM venta_productos WHERE venta_id = ?`, [id], (err, productos) => {
            if (err) { db.run('ROLLBACK'); callback(err, null); return; }
            productos.forEach((p) => {
                if (p.variante_id) {
                    db.run(`UPDATE variantes_producto SET cantidad = cantidad + ? WHERE id = ?`, [p.cantidad, p.variante_id]);
                }
            });
            db.run(`UPDATE ventas SET estado = 'Cancelado' WHERE id = ?`, [id], (err) => {
                if (err) { db.run('ROLLBACK'); callback(err, null); return; }
                db.run('COMMIT');
                callback(null, { success: true });
            });
        });
    });
}

// ==================== FUNCIONES PARA DEUDAS DE CLIENTES ====================

function obtenerDeudasClientes(callback) {
    db.all(`SELECT * FROM deudas_clientes WHERE estado = 'Pendiente' ORDER BY fecha_creacion DESC`, [], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

function obtenerDeudaClientePorId(id, callback) {
    db.get(`SELECT * FROM deudas_clientes WHERE id = ?`, [id], (err, deuda) => {
        if (err) { callback(err, null); return; }
        if (!deuda) { callback(new Error('Deuda no encontrada'), null); return; }
        db.all(`SELECT * FROM abonos_deuda_cliente WHERE deuda_cliente_id = ? ORDER BY fecha_abono DESC`, [id], (err, abonos) => {
            if (err) { callback(err, null); } else { callback(null, { ...deuda, abonos }); }
        });
    });
}

function registrarAbonoDeudaCliente(deudaId, montoAbono, metodoPago, notas, callback) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM deudas_clientes WHERE id = ?', [deudaId], (err, deuda) => {
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

      const nuevoMontoPagado = parseFloat(deuda.monto_pagado) + parseFloat(montoAbono);
      const nuevoMontoPendiente = parseFloat(deuda.monto_total) - nuevoMontoPagado;
      const nuevoEstado = nuevoMontoPendiente <= 0.01 ? 'Pagado' : 'Pendiente';

      db.run(
        `INSERT INTO abonos_deuda_cliente (deuda_cliente_id, monto_abono, metodo_pago, notas)
         VALUES (?, ?, ?, ?)`,
        [deudaId, montoAbono, metodoPago, notas || null],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            callback(err, null);
            return;
          }

          db.run(
            `UPDATE deudas_clientes
             SET monto_pagado = ?, monto_pendiente = ?, estado = ?, fecha_actualizado = datetime('now', 'localtime')
             WHERE id = ?`,
            [nuevoMontoPagado, nuevoMontoPendiente, nuevoEstado, deudaId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                callback(err, null);
                return;
              }

              db.run(
                `UPDATE ventas
                 SET monto_pagado = ?, estado = ?, fecha_actualizado = datetime('now', 'localtime')
                 WHERE id = ?`,
                [nuevoMontoPagado, nuevoEstado, deuda.venta_id],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    callback(err, null);
                    return;
                  }

                  db.run('COMMIT', (err) => {
                    if (err) {
                      callback(err, null);
                    } else {
                      callback(null, {
                        success: true,
                        abono_id: this.lastID,
                        nuevo_estado: nuevoEstado
                      });
                    }
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

function obtenerDeudasPorCliente(clienteId, callback) {
    db.all(`SELECT * FROM deudas_clientes WHERE cliente_id = ? AND estado = 'Pendiente' ORDER BY fecha_creacion DESC`, [clienteId], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

function buscarDeudasClientes(termino, callback) {
    const t = `%${termino}%`;
    db.all(`SELECT * FROM deudas_clientes WHERE cliente_nombre LIKE ? ORDER BY fecha_creacion DESC`, [t], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

function obtenerEstadisticasDeudasClientes(callback) {
  db.get(`
    SELECT
      COUNT(DISTINCT id) as total_deudas,
      COUNT(DISTINCT cliente_id) as clientes_con_deuda,
      SUM(monto_total) as monto_total_deuda,
      SUM(monto_pagado) as monto_total_pagado,
      SUM(monto_pendiente) as monto_total_pendiente
    FROM deudas_clientes
    WHERE estado = 'Pendiente'
  `, [], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, {
        total_deudas: row.total_deudas || 0,
        clientes_con_deuda: row.clientes_con_deuda || 0,
        monto_total_deuda: row.monto_total_deuda || 0,
        monto_total_pagado: row.monto_total_pagado || 0,
        monto_total_pendiente: row.monto_total_pendiente || 0
      });
    }
  });
}

function obtenerHistorialAbonos(deudaId, callback) {
    db.all(`SELECT * FROM abonos_deuda_cliente WHERE deuda_cliente_id = ? ORDER BY fecha_abono DESC`, [deudaId], (err, rows) => {
        if (err) { callback(err, null); } else { callback(null, rows); }
    });
}

module.exports = {
    // Ventas
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
};