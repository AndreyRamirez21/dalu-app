const db = require('../index');

const cajaModel = {

// Reiniciar caja por completo (borra todos los movimientos y config)
  reiniciarCaja: (callback) => {
    db.db.serialize(() => {
      db.db.run('DELETE FROM caja_movimientos', [], (err) => {
        if (err) return callback(err);

        db.db.run('DELETE FROM caja_config', [], (err2) => {
          if (err2) return callback(err2);
          console.log('🔄 Caja reiniciada por completo');
          callback(null, { success: true });
        });
      });
    });
  },

  // Obtener saldo actual (suma de todos los movimientos)
  obtenerSaldo: (callback) => {
    db.db.get(`
      SELECT COALESCE(
        (SELECT saldo_resultante FROM caja_movimientos ORDER BY id DESC LIMIT 1),
        (SELECT saldo_inicial FROM caja_config WHERE id = 1),
        0
      ) as saldo_actual
    `, [], callback);
  },

  // Obtener todos los movimientos
  obtenerMovimientos: (callback) => {
    db.db.all(`
      SELECT * FROM caja_movimientos
      ORDER BY fecha DESC, id DESC
    `, [], callback);
  },

  // Obtener movimientos por rango de fechas
  obtenerPorPeriodo: (fechaInicio, fechaFin, callback) => {
    db.db.all(`
      SELECT * FROM caja_movimientos
      WHERE date(fecha) BETWEEN date(?) AND date(?)
      ORDER BY fecha DESC, id DESC
    `, [fechaInicio, fechaFin], callback);
  },

  // Registrar un movimiento manual
  registrarMovimiento: (datos, callback) => {
    // Primero obtener el saldo actual
    cajaModel.obtenerSaldo((err, row) => {
      if (err) return callback(err);

      const saldoActual = row ? row.saldo_actual : 0;
      const esSalida = datos.tipo === 'salida';
      const nuevoSaldo = esSalida
        ? saldoActual - Math.abs(datos.monto)
        : saldoActual + Math.abs(datos.monto);

      db.db.run(`
        INSERT INTO caja_movimientos
          (tipo, concepto, monto, saldo_resultante, origen, referencia_id, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.tipo,
        datos.concepto,
        datos.monto,
        nuevoSaldo,
        datos.origen || 'manual',
        datos.referencia_id || null,
        datos.notas || null
      ], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, saldo_nuevo: nuevoSaldo });
      });
    });
  },

  // Configurar saldo inicial (solo se usa una vez o para ajuste)
  configurarSaldoInicial: (monto, callback) => {
    // Verificar si ya hay movimientos
    db.db.get('SELECT COUNT(*) as total FROM caja_movimientos', [], (err, row) => {
      if (err) return callback(err);

      if (row.total > 0) {
        return callback(new Error('Ya existen movimientos en caja. Use un ajuste manual.'));
      }

      db.db.run(`
        INSERT OR REPLACE INTO caja_config (id, saldo_inicial, fecha_apertura)
        VALUES (1, ?, datetime('now', 'localtime'))
      `, [monto], (err) => {
        if (err) return callback(err);

        // Registrar como movimiento de apertura
        db.db.run(`
          INSERT INTO caja_movimientos
            (tipo, concepto, monto, saldo_resultante, origen)
          VALUES ('apertura', 'Saldo inicial de caja', ?, ?, 'manual')
        `, [monto, monto], function(err) {
          if (err) return callback(err);
          callback(null, { success: true, saldo: monto });
        });
      });
    });
  },

  // Obtener resumen del día
  obtenerResumenDia: (callback) => {
    db.db.get(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END), 0) as total_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END), 0) as total_salidas,
        COUNT(*) as total_movimientos
      FROM caja_movimientos
      WHERE date(fecha) = date('now', 'localtime')
    `, [], callback);
  },

  eliminarMovimiento: (id, callback) => {
    // No permitir eliminar si hay movimientos posteriores (rompería el saldo)
    db.db.get(
      'SELECT id FROM caja_movimientos WHERE id > ? LIMIT 1', [id],
      (err, row) => {
        if (err) return callback(err);
        if (row) return callback(new Error('No se puede eliminar: hay movimientos posteriores que dependen de este saldo.'));

        db.db.run('DELETE FROM caja_movimientos WHERE id = ?', [id], function(err) {
          if (err) return callback(err);
          callback(null, { success: true });
        });
      }
    );
  }
};

module.exports = cajaModel;