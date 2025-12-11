const db = require('../config/connection');

// ==================== FUNCIONES PARA PRODUCTOS E INVENTARIO ====================

function agregarProducto(datos, callback) {
  const { referencia, nombre, categoria, costo_base, precio_venta_base, variantes } = datos;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insertar producto principal
    const sqlProducto = `INSERT INTO productos(referencia, nombre, categoria, costo_base, precio_venta_base, tiene_variantes)
                         VALUES(?, ?, ?, ?, ?, ?)`;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, costo_base, precio_venta_base, tieneVariantes],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        const productoId = this.lastID;

        // Si hay variantes, insertarlas
        if (variantes && variantes.length > 0) {
          const sqlVariante = `INSERT INTO variantes_producto(producto_id, talla, cantidad, ajuste_precio)
                               VALUES(?, ?, ?, ?)`;

          let variantesInsertadas = 0;
          let errorOcurrido = false;

          variantes.forEach((variante) => {
            db.run(
              sqlVariante,
              [productoId, variante.talla, variante.cantidad, variante.ajuste_precio || 0],
              (err) => {
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
              }
            );
          });
        } else {
          db.run('COMMIT');
          callback(null, { id: productoId, ...datos });
        }
      }
    );
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
                             precio_venta_base = ?, tiene_variantes = ?,
                             fecha_actualizado = datetime('now', 'localtime')
                         WHERE id = ?`;

    const tieneVariantes = variantes && variantes.length > 0 ? 1 : 0;

    db.run(
      sqlProducto,
      [referencia, nombre, categoria, costo_base, precio_venta_base, tieneVariantes, id],
      function (err) {
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
            const sqlVariante = `INSERT INTO variantes_producto(producto_id, talla, cantidad, ajuste_precio)
                                 VALUES(?, ?, ?, ?)`;

            let variantesInsertadas = 0;
            let errorOcurrido = false;

            variantes.forEach((variante) => {
              db.run(
                sqlVariante,
                [id, variante.talla, variante.cantidad, variante.ajuste_precio || 0],
                (err) => {
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
                }
              );
            });
          } else {
            db.run('COMMIT');
            callback(null, { id, ...datos });
          }
        });
      }
    );
  });
}

function eliminarProducto(id, callback) {
  // El CASCADE en la definición de la tabla se encarga de eliminar las variantes
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