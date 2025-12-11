const db = require('../config/connection');

// ==================== FUNCIONES PARA DEUDAS (PROVEEDORES/ACREEDORES) ====================

function agregarDeuda(datos, callback) {
  const { acreedor, factura, tipo_acreedor, monto_total, monto_pagado, notas, fecha_recordatorio } = datos;

  const sql = `INSERT INTO deudas(acreedor, factura, tipo_acreedor, monto_total, monto_pagado, notas, fecha_recordatorio, estado)
               VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;

  const montoPagado = monto_pagado || 0;
  const estado = montoPagado >= monto_total ? 'Pagado' : 'Pendiente';

  db.run(
    sql,
    [acreedor, factura || null, tipo_acreedor || 'Otro', monto_total, montoPagado, notas || null, fecha_recordatorio || null, estado],
    function (err) {
      if (err) {
        console.error('❌ Error al agregar deuda:', err);
        callback(err, null);
      } else {
        console.log('✅ Deuda agregada con ID:', this.lastID);
        callback(null, { id: this.lastID, ...datos });
      }
    }
  );
}

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

function obtenerDeudasPendientes(callback) {
  const sql = `SELECT * FROM deudas WHERE estado IN('Pendiente', 'Vencida') ORDER BY fecha_creacion DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

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
      const sqlPago = `INSERT INTO pagos_deuda(deuda_id, monto_pago, metodo_pago, notas)
                       VALUES(?, ?, ?, ?)`;

      db.run(sqlPago, [deudaId, montoPago, metodoPago, notas || null], function (err) {
        if (err) {
          db.run('ROLLBACK');
          callback(err, null);
          return;
        }

        // Actualizar deuda
        const sqlUpdate = `UPDATE deudas
                           SET monto_pagado = ?, estado = ?,
                               fecha_actualizado = datetime('now', 'localtime')
                           WHERE id = ?`;

        db.run(sqlUpdate, [nuevoMontoPagado, nuevoEstado, deudaId], function (err) {
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

function actualizarDeuda(id, datos, callback) {
  const { acreedor, factura, tipo_acreedor, monto_total, notas, fecha_recordatorio } = datos;

  const sql = `UPDATE deudas
               SET acreedor = ?, factura = ?, tipo_acreedor = ?, monto_total = ?,
                   notas = ?, fecha_recordatorio = ?, fecha_actualizado = datetime('now', 'localtime')
               WHERE id = ?`;

  db.run(
    sql,
    [acreedor, factura || null, tipo_acreedor, monto_total, notas || null, fecha_recordatorio || null, id],
    function (err) {
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
    }
  );
}

function eliminarDeuda(id, callback) {
  const sql = `DELETE FROM deudas WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('❌ Error al eliminar deuda:', err);
      callback(err, null);
    } else {
      console.log('✅ Deuda eliminada:', id);
      callback(null, { deleted: this.changes });
    }
  });
}

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
  agregarDeuda,
  obtenerDeudas,
  obtenerDeudasPendientes,
  obtenerDeudaPorId,
  registrarPagoDeuda,
  actualizarDeuda,
  eliminarDeuda,
  buscarDeudas,
  obtenerEstadisticasDeudas,
  obtenerHistorialPagos
};