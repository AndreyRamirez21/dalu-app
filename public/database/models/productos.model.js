const db = require('../config/connection');

// ==================== FUNCIONES PARA PRODUCTOS E INVENTARIO ====================

function agregarProducto(datos, callback) {
  const {
    referencia,
    nombre,
    categoria,
    descripcion,
    coleccion,
    costo_base,
    precio_calculado,
    precio_venta_base,
    variantes,
    costos_adicionales
  } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // ✅ ACTUALIZADO: Incluir fecha_ingreso explícitamente
const sqlProducto = `
  INSERT INTO productos
  (referencia, nombre, categoria, descripcion, coleccion, costo_base, precio_calculado, precio_venta_base, tiene_variantes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    const tieneVariantes = variantes?.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, descripcion || null, coleccion || null, costo_base, precio_calculado, precio_venta_base, tieneVariantes],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return callback(err);
        }

        const productoId = this.lastID;

        const costosValidos = (costos_adicionales || []).filter(
          c => c.concepto && c.monto
        );

        const insertarVariantes = () => {
          if (!variantes || variantes.length === 0) {
            db.run('COMMIT');
            return callback(null, { id: productoId });
          }

          // ✅ ACTUALIZADO: Incluir fecha_ingreso en variantes
const sqlVariante = `
  INSERT INTO variantes_producto
  (producto_id, talla, cantidad, ajuste_precio, fecha_ingreso)
  VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
`;

          let insertadas = 0;

          variantes.forEach(v => {
            db.run(
              sqlVariante,
              [productoId, v.talla, v.cantidad, v.ajuste_precio || 0],
              err => {
                if (err) {
                  db.run('ROLLBACK');
                  return callback(err);
                }

                insertadas++;
                if (insertadas === variantes.length) {
                  db.run('COMMIT');
                  callback(null, { id: productoId });
                }
              }
            );
          });
        };

        if (costosValidos.length === 0) {
          return insertarVariantes();
        }

        const sqlCosto = `
          INSERT INTO costos_adicionales_producto
          (producto_id, concepto, monto)
          VALUES (?, ?, ?)
        `;

        let insertados = 0;

        costosValidos.forEach(c => {
          db.run(sqlCosto, [productoId, c.concepto, c.monto], err => {
            if (err) {
              db.run('ROLLBACK');
              return callback(err);
            }

            insertados++;
            if (insertados === costosValidos.length) {
              insertarVariantes();
            }
          });
        });
      }
    );
  });
}


function obtenerProductos(callback) {
  const sql = `SELECT p.*,
               (SELECT GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|')
                FROM variantes_producto v
                WHERE v.producto_id = p.id) as variantes_data,
               (SELECT GROUP_CONCAT(ca.id || ':' || ca.concepto || ':' || ca.monto, '|')
                FROM costos_adicionales_producto ca
                WHERE ca.producto_id = p.id) as costos_adicionales_data
               FROM productos p
               WHERE p.activo = 1
               ORDER BY p.fecha_creado DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    const productos = rows.map((row) => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map((v) => {
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

      if (row.costos_adicionales_data && row.costos_adicionales_data !== '') {
        producto.costos_adicionales = row.costos_adicionales_data.split('|').map((c) => {
          const [id, concepto, monto] = c.split(':');
          return {
            id: parseInt(id),
            concepto,
            monto: parseFloat(monto)
          };
        });
      } else {
        producto.costos_adicionales = [];
      }

      delete producto.variantes_data;
      delete producto.costos_adicionales_data;
      return producto;
    });

    callback(null, productos);
  });
}

function obtenerProductosPorCategoria(categoria, callback) {
  const sql = `SELECT p.*,
               (SELECT GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|')
                FROM variantes_producto v
                WHERE v.producto_id = p.id) as variantes_data,
               (SELECT GROUP_CONCAT(ca.id || ':' || ca.concepto || ':' || ca.monto, '|')
                FROM costos_adicionales_producto ca
                WHERE ca.producto_id = p.id) as costos_adicionales_data
               FROM productos p
               WHERE p.categoria = ? AND p.activo = 1
               ORDER BY p.fecha_creado DESC`;

  db.all(sql, [categoria], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    const productos = rows.map((row) => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map((v) => {
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

      if (row.costos_adicionales_data && row.costos_adicionales_data !== '') {
        producto.costos_adicionales = row.costos_adicionales_data.split('|').map((c) => {
          const [id, concepto, monto] = c.split(':');
          return {
            id: parseInt(id),
            concepto,
            monto: parseFloat(monto)
          };
        });
      } else {
        producto.costos_adicionales = [];
      }

      delete producto.variantes_data;
      delete producto.costos_adicionales_data;
      return producto;
    });

    callback(null, productos);
  });
}

function buscarProductos(termino, callback) {
  const sql = `SELECT p.*,
               (SELECT GROUP_CONCAT(v.id || ':' || v.talla || ':' || v.cantidad || ':' || v.ajuste_precio, '|')
                FROM variantes_producto v
                WHERE v.producto_id = p.id) as variantes_data,
               (SELECT GROUP_CONCAT(ca.id || ':' || ca.concepto || ':' || ca.monto, '|')
                FROM costos_adicionales_producto ca
                WHERE ca.producto_id = p.id) as costos_adicionales_data
                FROM productos p
                WHERE (p.nombre LIKE ? OR p.referencia LIKE ? OR p.categoria LIKE ?) AND p.activo = 1
                ORDER BY p.fecha_creado DESC`;

  const searchTerm = `%${termino}%`;

  db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    const productos = rows.map((row) => {
      const producto = { ...row };

      if (row.variantes_data) {
        producto.variantes = row.variantes_data.split('|').map((v) => {
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

      if (row.costos_adicionales_data && row.costos_adicionales_data !== '') {
        producto.costos_adicionales = row.costos_adicionales_data.split('|').map((c) => {
          const [id, concepto, monto] = c.split(':');
          return {
            id: parseInt(id),
            concepto,
            monto: parseFloat(monto)
          };
        });
      } else {
        producto.costos_adicionales = [];
      }

      delete producto.variantes_data;
      delete producto.costos_adicionales_data;
      return producto;
    });

    callback(null, productos);
  });
}

function actualizarProducto(id, datos, callback) {
  const {
    referencia,
    nombre,
    categoria,
    descripcion,
    coleccion,
    costo_base,
    precio_calculado,
    precio_venta_base,
    variantes,
    costos_adicionales
  } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const sqlProducto = `
      UPDATE productos
      SET referencia = ?, nombre = ?, categoria = ?, descripcion = ?, coleccion = ?, costo_base = ?,
          precio_calculado = ?, precio_venta_base = ?, tiene_variantes = ?,
          fecha_actualizado = datetime('now', 'localtime')
      WHERE id = ?
    `;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, descripcion || null, coleccion || null, costo_base, precio_calculado, precio_venta_base, tieneVariantes, id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return callback(err);
        }

        db.run(
          'DELETE FROM costos_adicionales_producto WHERE producto_id = ?',
          [id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return callback(err);
            }

            const costosValidos = (costos_adicionales || []).filter(
              c => c.concepto && c.monto
            );

            const actualizarVariantes = () => {
              // ✅ ACTUALIZADO: Al actualizar variantes, conservar fechas de ingreso y ventas existentes
              // Primero obtenemos las variantes existentes para preservar sus fechas
              db.all(
                'SELECT id, talla, fecha_ingreso, fecha_primera_venta, fecha_ultima_venta, total_unidades_vendidas FROM variantes_producto WHERE producto_id = ?',
                [id],
                (err, variantesExistentes) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return callback(err);
                  }

                  // Crear mapa de variantes existentes por talla
                  const mapaVariantes = {};
                  variantesExistentes.forEach(v => {
                    mapaVariantes[v.talla] = v;
                  });

                  db.run(
                    'DELETE FROM variantes_producto WHERE producto_id = ?',
                    [id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return callback(err);
                      }

                      if (!variantes || variantes.length === 0) {
                        db.run('COMMIT');
                        return callback(null, { id, ...datos });
                      }

                      // ✅ ACTUALIZADO: Preservar fecha_ingreso original si la talla ya existía
                        const sqlVariante = `
                          INSERT INTO variantes_producto
                          (producto_id, talla, cantidad, ajuste_precio, fecha_ingreso, fecha_primera_venta, fecha_ultima_venta, total_unidades_vendidas)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                      let insertadas = 0;

                      variantes.forEach((v) => {
                        const varianteAnterior = mapaVariantes[v.talla];
                        const fechaIngreso = varianteAnterior
                          ? varianteAnterior.fecha_ingreso
                          : `datetime('now', 'localtime')`;
                        const fechaPrimeraVenta = varianteAnterior ? varianteAnterior.fecha_primera_venta : null;
                        const fechaUltimaVenta = varianteAnterior ? varianteAnterior.fecha_ultima_venta : null;
                        const totalVendidas = varianteAnterior ? varianteAnterior.total_unidades_vendidas : 0;

                        db.run(
                          sqlVariante,
                          [id, v.talla, v.cantidad, v.ajuste_precio || 0,
                           varianteAnterior ? varianteAnterior.fecha_ingreso : null,
                           fechaPrimeraVenta,
                           fechaUltimaVenta,
                           totalVendidas],
                          (err) => {
                            if (err) {
                              db.run('ROLLBACK');
                              return callback(err);
                            }

                            insertadas++;
                            if (insertadas === variantes.length) {
                              db.run('COMMIT');
                              callback(null, { id, ...datos });
                            }
                          }
                        );
                      });
                    }
                  );
                }
              );
            };

            if (costosValidos.length === 0) {
              return actualizarVariantes();
            }

            const sqlCosto = `
              INSERT INTO costos_adicionales_producto
              (producto_id, concepto, monto)
              VALUES (?, ?, ?)
            `;

            let insertados = 0;

            costosValidos.forEach((c) => {
              db.run(sqlCosto, [id, c.concepto, c.monto], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return callback(err);
                }

                insertados++;
                if (insertados === costosValidos.length) {
                  actualizarVariantes();
                }
              });
            });
          }
        );
      }
    );
  });
}

// ✅ NUEVA: Registrar venta en historial de variante y actualizar fechas de rotación
function registrarVentaVariante(varianteId, productoId, ventaId, cantidadVendida, precioVenta, callback) {
  db.run(
    `INSERT INTO historial_ventas_variante
     (variante_id, producto_id, venta_id, cantidad_vendida, precio_venta, fecha_venta)
     VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [varianteId, productoId, ventaId, cantidadVendida, precioVenta],
    (err) => {
      if (err) {
        console.error('Error al insertar historial de venta variante:', err);
        return callback && callback(err);
      }

      db.run(
        `UPDATE variantes_producto SET
           fecha_primera_venta = COALESCE(fecha_primera_venta, datetime('now', 'localtime')),
           fecha_ultima_venta  = datetime('now', 'localtime'),
           total_unidades_vendidas = COALESCE(total_unidades_vendidas, 0) + ?,
           fecha_actualizado = datetime('now', 'localtime')
         WHERE id = ?`,
        [cantidadVendida, varianteId],
        (err) => {
          if (err) {
            console.error('Error al actualizar fechas de variante:', err);
          }

          // ✅ NUEVO: marcar también el producto padre
          db.run(
            `UPDATE productos SET fecha_actualizado = datetime('now', 'localtime') WHERE id = ?`,
            [productoId]
          );

          callback && callback(null);
        }
      );
    }
  );
}

// ✅ NUEVA: Obtener datos de rotación completos para el panel
function obtenerRotacionInventario(callback) {
  const sql = `
    SELECT
      p.id as producto_id,
      p.referencia,
      p.nombre,
      p.categoria,
p.fecha_creado as fecha_ingreso_producto,
      p.precio_venta_base,
      p.costo_base,

      -- Datos de la variante
      vp.id as variante_id,
      vp.talla,
      vp.cantidad as stock_actual,
      vp.fecha_ingreso as fecha_ingreso_variante,
      vp.fecha_primera_venta,
      vp.fecha_ultima_venta,
      vp.total_unidades_vendidas,

      -- Días en inventario desde ingreso
      CAST(
        (julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado)))
        AS INTEGER
      ) as dias_en_inventario,

      -- Días hasta primera venta (tiempo de primera rotación)
      CASE
        WHEN vp.fecha_primera_venta IS NOT NULL THEN
          CAST(
            (julianday(vp.fecha_primera_venta) - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado)))
            AS INTEGER
          )
        ELSE NULL
      END as dias_hasta_primera_venta,

      -- Días desde última venta
      CASE
        WHEN vp.fecha_ultima_venta IS NOT NULL THEN
          CAST((julianday('now') - julianday(vp.fecha_ultima_venta)) AS INTEGER)
        ELSE NULL
      END as dias_desde_ultima_venta,

      -- Estado de rotación
      CASE
        WHEN vp.cantidad = 0 AND vp.fecha_ultima_venta IS NOT NULL THEN 'Agotado'
        WHEN vp.fecha_primera_venta IS NULL AND
             CAST((julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))) AS INTEGER) > 60
             THEN 'Sin movimiento'
        WHEN vp.fecha_primera_venta IS NULL THEN 'Nuevo'
        WHEN CAST((julianday('now') - julianday(vp.fecha_ultima_venta)) AS INTEGER) > 30
             THEN 'Rotación lenta'
        ELSE 'Rotación normal'
      END as estado_rotacion,

      -- Total ventas en pesos de esta variante
      COALESCE((
        SELECT SUM(hvv.cantidad_vendida * hvv.precio_venta)
        FROM historial_ventas_variante hvv
        WHERE hvv.variante_id = vp.id
      ), 0) as total_ingresos_variante,

      -- Número de veces que se vendió
      COALESCE((
        SELECT COUNT(DISTINCT hvv.venta_id)
        FROM historial_ventas_variante hvv
        WHERE hvv.variante_id = vp.id
      ), 0) as numero_ventas

    FROM productos p
    INNER JOIN variantes_producto vp ON vp.producto_id = p.id
    ORDER BY
      CASE
        WHEN vp.fecha_primera_venta IS NULL AND
             CAST((julianday('now') - julianday(COALESCE(vp.fecha_ingreso, p.fecha_creado))) AS INTEGER) > 60
             THEN 0
        WHEN CAST((julianday('now') - julianday(COALESCE(vp.fecha_ultima_venta, vp.fecha_ingreso, p.fecha_creado))) AS INTEGER) > 30
             THEN 1
        ELSE 2
      END ASC,
      dias_en_inventario DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener rotación de inventario:', err);
      return callback(err, null);
    }

    // Agrupar por producto
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
        total_unidades_vendidas: row.total_unidades_vendidas || 0,
        dias_en_inventario: row.dias_en_inventario,
        dias_hasta_primera_venta: row.dias_hasta_primera_venta,
        dias_desde_ultima_venta: row.dias_desde_ultima_venta,
        estado_rotacion: row.estado_rotacion,
        total_ingresos_variante: row.total_ingresos_variante || 0,
        numero_ventas: row.numero_ventas || 0
      });
    });

    const resultado = Object.values(productosMap);
    callback(null, resultado);
  });
}

// ✅ NUEVA: Obtener historial de ventas de una variante específica
function obtenerHistorialVariante(varianteId, callback) {
  const sql = `
    SELECT
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
    ORDER BY hvv.fecha_venta DESC
  `;

  db.all(sql, [varianteId], (err, rows) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, rows);
  });
}

function eliminarProducto(id, callback) {
  db.run(
    `UPDATE productos SET
       activo = 0,
       fecha_actualizado = datetime('now', 'localtime')
     WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { deleted: this.changes });
      }
    }
  );
}

function obtenerEstadisticasInventario(callback) {
  const sql = `SELECT
               COUNT(DISTINCT p.id) as total,
               SUM(CASE
                   WHEN p.tiene_variantes = 0 THEN 0
                   WHEN EXISTS(
                     SELECT 1 FROM variantes_producto v
                     WHERE v.producto_id = p.id AND v.cantidad < 10 AND v.cantidad > 0
                   ) THEN 1
                   ELSE 0
                 END) as stock_bajo,
               SUM(CASE
                   WHEN p.tiene_variantes = 0 THEN 0
                   WHEN NOT EXISTS(
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

function actualizarStockVariante(varianteId, nuevaCantidad, callback) {
  const sql = `UPDATE variantes_producto SET
                 cantidad = ?,
                 fecha_actualizado = datetime('now', 'localtime')
               WHERE id = ?`;

  db.run(sql, [nuevaCantidad, varianteId], function (err) {
    if (err) {
      callback(err, null);
    } else {
      // ✅ NUEVO: marcar también el producto padre
      db.run(
        `UPDATE productos SET fecha_actualizado = datetime('now', 'localtime')
         WHERE id = (SELECT producto_id FROM variantes_producto WHERE id = ?)`,
        [varianteId]
      );
      callback(null, { updated: this.changes });
    }
  });
}

module.exports = {
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario,
  actualizarStockVariante,
  // ✅ NUEVAS exportaciones
  registrarVentaVariante,
  obtenerRotacionInventario,
  obtenerHistorialVariante
};
