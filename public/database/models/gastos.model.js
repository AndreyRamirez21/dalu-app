const db = require('../config/connection');

// ==================== FUNCIONES PARA GASTOS ====================

function agregarGasto(datos, callback) {
  const { fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas } = datos;

  const sql = `INSERT INTO gastos(fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas)
               VALUES(?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [fecha, descripcion, categoria, monto, metodo_pago, proveedor || null, notas || null],
    function (err) {
      if (err) {
        console.error('❌ Error al agregar gasto:', err);
        callback(err, null);
      } else {
        console.log('✅ Gasto agregado con ID:', this.lastID);
        callback(null, { id: this.lastID, ...datos });
      }
    }
  );
}

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

function actualizarGasto(id, datos, callback) {
  const { fecha, descripcion, categoria, monto, metodo_pago, proveedor, notas } = datos;

  const sql = `UPDATE gastos
               SET fecha = ?, descripcion = ?, categoria = ?, monto = ?,
                   metodo_pago = ?, proveedor = ?, notas = ?,
                   fecha_actualizado = datetime('now', 'localtime')
               WHERE id = ?`;

  db.run(
    sql,
    [fecha, descripcion, categoria, monto, metodo_pago, proveedor || null, notas || null, id],
    function (err) {
      if (err) {
        console.error('❌ Error al actualizar gasto:', err);
        callback(err, null);
      } else {
        console.log('✅ Gasto actualizado:', id);
        callback(null, { id, ...datos, updated: this.changes });
      }
    }
  );
}

function eliminarGasto(id, callback) {
  const sql = `DELETE FROM gastos WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('❌ Error al eliminar gasto:', err);
      callback(err, null);
    } else {
      console.log('✅ Gasto eliminado:', id);
      callback(null, { deleted: this.changes });
    }
  });
}

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

module.exports = {
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
};