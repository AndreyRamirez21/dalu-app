const db = require('../config/connection');

// ==================== FUNCIONES PARA DEUDAS DE CLIENTES ====================

function obtenerDeudasClientes(callback) {
  db.all(
    `SELECT * FROM deudas_clientes WHERE estado = 'Pendiente' ORDER BY fecha_creacion DESC`,
    [],
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    }
  );
}

function obtenerDeudaClientePorId(id, callback) {
  db.get(`SELECT * FROM deudas_clientes WHERE id = ?`, [id], (err, deuda) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (!deuda) {
      callback(new Error('Deuda no encontrada'), null);
      return;
    }
    db.all(
      `SELECT * FROM abonos_deuda_cliente WHERE deuda_cliente_id = ? ORDER BY fecha_abono DESC`,
      [id],
      (err, abonos) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, { ...deuda, abonos });
        }
      }
    );
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
        function (err) {
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

              // Actualizar también la venta relacionada si existe
              if (deuda.venta_id) {
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
              } else {
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
            }
          );
        }
      );
    });
  });
}

function obtenerDeudasPorCliente(clienteId, callback) {
  db.all(
    `SELECT * FROM deudas_clientes WHERE cliente_id = ? AND estado = 'Pendiente' ORDER BY fecha_creacion DESC`,
    [clienteId],
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    }
  );
}

function buscarDeudasClientes(termino, callback) {
  const t = `%${termino}%`;
  db.all(
    `SELECT * FROM deudas_clientes WHERE cliente_nombre LIKE ? ORDER BY fecha_creacion DESC`,
    [t],
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    }
  );
}

function obtenerEstadisticasDeudasClientes(callback) {
  db.get(
    `SELECT
      COUNT(DISTINCT id) as total_deudas,
      COUNT(DISTINCT cliente_id) as clientes_con_deuda,
      SUM(monto_total) as monto_total_deuda,
      SUM(monto_pagado) as monto_total_pagado,
      SUM(monto_pendiente) as monto_total_pendiente
    FROM deudas_clientes
    WHERE estado = 'Pendiente'`,
    [],
    (err, row) => {
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
    }
  );
}

function obtenerHistorialAbonos(deudaId, callback) {
  db.all(
    `SELECT * FROM abonos_deuda_cliente WHERE deuda_cliente_id = ? ORDER BY fecha_abono DESC`,
    [deudaId],
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    }
  );
}

module.exports = {
  obtenerDeudasClientes,
  obtenerDeudaClientePorId,
  registrarAbonoDeudaCliente,
  obtenerDeudasPorCliente,
  buscarDeudasClientes,
  obtenerEstadisticasDeudasClientes,
  obtenerHistorialAbonos
};