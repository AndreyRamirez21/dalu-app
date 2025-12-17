const db = require('../config/connection');

// ==================== FUNCIONES PARA PRODUCTOS E INVENTARIO ====================

function agregarProducto(datos, callback) {
  const {
    referencia,
    nombre,
    categoria,
    costo_base,
    precio_calculado,
    precio_venta_base,
    variantes,
    costos_adicionales
  } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const sqlProducto = `
      INSERT INTO productos
      (referencia, nombre, categoria, costo_base, precio_calculado, precio_venta_base, tiene_variantes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const tieneVariantes = variantes?.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, costo_base, precio_calculado, precio_venta_base, tieneVariantes],
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

          const sqlVariante = `
            INSERT INTO variantes_producto
            (producto_id, talla, cantidad, ajuste_precio)
            VALUES (?, ?, ?, ?)
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
               ORDER BY p.fecha_creado DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }

    // Procesar las variantes y costos adicionales
    const productos = rows.map((row) => {
      const producto = { ...row };

      // Procesar variantes
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

      // Procesar costos adicionales
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
               WHERE p.categoria = ?
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
               WHERE p.nombre LIKE ? OR p.referencia LIKE ? OR p.categoria LIKE ?
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
      SET referencia = ?, nombre = ?, categoria = ?, costo_base = ?,
          precio_calculado = ?, precio_venta_base = ?, tiene_variantes = ?,
          fecha_actualizado = datetime('now', 'localtime')
      WHERE id = ?
    `;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, costo_base, precio_calculado, precio_venta_base, tieneVariantes, id],
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

                  const sqlVariante = `
                    INSERT INTO variantes_producto
                    (producto_id, talla, cantidad, ajuste_precio)
                    VALUES (?, ?, ?, ?)
                  `;

                  let insertadas = 0;

                  variantes.forEach((v) => {
                    db.run(
                      sqlVariante,
                      [id, v.talla, v.cantidad, v.ajuste_precio || 0],
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


function eliminarProducto(id, callback) {
  // El CASCADE en la definición de la tabla se encarga de eliminar las variantes y costos adicionales
  db.run('DELETE FROM productos WHERE id = ?', [id], function (err) {
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
  const sql = `UPDATE variantes_producto SET cantidad = ? WHERE id = ?`;

  db.run(sql, [nuevaCantidad, varianteId], function (err) {
    if (err) {
      callback(err, null);
    } else {
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
  actualizarStockVariante
};