// database/models/devoluciones.model.js
// Modelo para gestión de devoluciones con intercambio de productos
// v2: soporte multi-producto nuevo, regla mínima $5.000, marca venta con devolución

const db = require('../index');
const DIFERENCIA_MINIMA = 5000;

function inicializarTablas(callback) {
  db.db.serialize(() => {
    db.db.run(`DROP TABLE IF EXISTS devolucion_items`);
    db.db.run(`DROP TABLE IF EXISTS devoluciones`);

    db.db.run(`
      CREATE TABLE IF NOT EXISTS devoluciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_devolucion TEXT UNIQUE NOT NULL,
        venta_id INTEGER NOT NULL,
        cliente_id INTEGER,
        cliente_nombre TEXT NOT NULL,
        producto_devuelto_id INTEGER,
        variante_devuelta_id INTEGER,
        producto_devuelto_nombre TEXT NOT NULL,
        talla_devuelta TEXT,
        cantidad_devuelta INTEGER NOT NULL DEFAULT 1,
        precio_original REAL NOT NULL,
        subtotal_devuelto REAL NOT NULL,
        subtotal_nuevos REAL NOT NULL DEFAULT 0,
        diferencia REAL NOT NULL DEFAULT 0,
        tipo_diferencia TEXT NOT NULL,
        monto_cobrado REAL DEFAULT 0,
        monto_devuelto REAL DEFAULT 0,
        notas TEXT,
        fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      )
    `, (err) => {
      if (err) { console.error('❌ Error tabla devoluciones:', err); if (callback) callback(err); return; }

      db.db.run(`
        CREATE TABLE IF NOT EXISTS devolucion_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          devolucion_id INTEGER NOT NULL,
          producto_id INTEGER,
          variante_id INTEGER,
          producto_nombre TEXT NOT NULL,
          talla TEXT,
          cantidad INTEGER NOT NULL DEFAULT 1,
          precio_unitario REAL NOT NULL,
          subtotal REAL NOT NULL,
          FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id)
        )
      `, (err2) => {
        if (err2) { console.error('❌ Error tabla devolucion_items:', err2); if (callback) callback(err2); return; }
        db.db.run(`ALTER TABLE ventas ADD COLUMN tiene_devolucion INTEGER DEFAULT 0`, () => {
          console.log('✅ Tablas de devoluciones listas');
          if (callback) callback(null);
        });
      });
    });
  });
}

function generarNumeroDevolucion(callback) {
  const hoy = new Date();
  const yy = String(hoy.getFullYear()).slice(2);
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const prefijo = `D${yy}${mm}${dd}`;
  db.db.get(
    `SELECT COUNT(*) as total FROM devoluciones WHERE numero_devolucion LIKE ?`,
    [`${prefijo}%`],
    (err, row) => {
      if (err) return callback(err);
      const secuencia = String((row.total || 0) + 1).padStart(4, '0');
      callback(null, `${prefijo}-${secuencia}`);
    }
  );
}

function registrarDevolucion(datos, callback) {
  const {
    venta_id, cliente_id, cliente_nombre,
    producto_devuelto_id, variante_devuelta_id,
    producto_devuelto_nombre, talla_devuelta,
    cantidad_devuelta, precio_original,
    productosNuevos = [],
    monto_cobrado, monto_devuelto,
    notas
  } = datos;

  const subtotal_devuelto = precio_original * cantidad_devuelta;
  const subtotal_nuevos = productosNuevos.reduce((s, p) => s + p.precio_unitario * p.cantidad, 0);
  const diferencia = subtotal_nuevos - subtotal_devuelto;

  let tipo_diferencia = 'sin_diferencia';
  if (diferencia > 0.01) tipo_diferencia = 'cobro';
  else if (diferencia < -0.01) tipo_diferencia = 'devolucion';

  generarNumeroDevolucion((err, numero) => {
    if (err) return callback(err);

    db.db.serialize(() => {
      db.db.run('BEGIN TRANSACTION');

      db.db.run(`
        INSERT INTO devoluciones (
          numero_devolucion, venta_id, cliente_id, cliente_nombre,
          producto_devuelto_id, variante_devuelta_id, producto_devuelto_nombre,
          talla_devuelta, cantidad_devuelta, precio_original, subtotal_devuelto,
          subtotal_nuevos, diferencia, tipo_diferencia,
          monto_cobrado, monto_devuelto, notas
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        numero, venta_id, cliente_id || null, cliente_nombre,
        producto_devuelto_id || null, variante_devuelta_id || null,
        producto_devuelto_nombre, talla_devuelta || null,
        cantidad_devuelta, precio_original, subtotal_devuelto,
        subtotal_nuevos, diferencia, tipo_diferencia,
        monto_cobrado || 0, monto_devuelto || 0,
        notas || null
      ], function(err) {
        if (err) { db.db.run('ROLLBACK'); return callback(err); }

        const devolucionId = this.lastID;
        const runSerial = (tasks) => tasks.reduce((p, task) => p.then(task), Promise.resolve());

        runSerial([

          // PASO 1: Insertar items de devolución
          () => Promise.all(productosNuevos.map(p => new Promise((res, rej) => {
            db.db.run(`
              INSERT INTO devolucion_items
                (devolucion_id, producto_id, variante_id, producto_nombre, talla, cantidad, precio_unitario, subtotal)
              VALUES (?,?,?,?,?,?,?,?)
            `, [devolucionId, p.producto_id || null, p.variante_id || null,
                p.producto_nombre, p.talla || null, p.cantidad,
                p.precio_unitario, p.precio_unitario * p.cantidad],
              err => err ? rej(err) : res());
          }))),

          // PASO 2: Restaurar stock del producto DEVUELTO
          () => new Promise((res, rej) => {
            if (!variante_devuelta_id) return res();
            db.db.run('UPDATE variantes_producto SET cantidad = cantidad + ? WHERE id = ?',
              [cantidad_devuelta, variante_devuelta_id],
              err => err ? rej(err) : res());
          }),

          // PASO 3: Eliminar el producto devuelto de venta_productos
          () => new Promise((res, rej) => {
            const sql = variante_devuelta_id
              ? `SELECT id FROM venta_productos WHERE venta_id = ? AND variante_id = ? LIMIT 1`
              : `SELECT id FROM venta_productos WHERE venta_id = ? AND producto_id = ? LIMIT 1`;
            const params = variante_devuelta_id
              ? [venta_id, variante_devuelta_id]
              : [venta_id, producto_devuelto_id];
            db.db.get(sql, params, (err, row) => {
              if (err) return rej(err);
              if (!row) { console.log('⚠️ Producto no encontrado en venta_productos'); return res(); }
              db.db.run('DELETE FROM venta_productos WHERE id = ?', [row.id],
                err => err ? rej(err) : res());
            });
          }),

          // PASO 4: Insertar los productos NUEVOS en venta_productos
          () => Promise.all(productosNuevos.filter(p => p.producto_id).map(p => new Promise((res, rej) => {
            db.db.run(
              `INSERT INTO venta_productos (venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [venta_id, p.producto_id, p.variante_id || null, p.cantidad, p.precio_unitario, p.precio_unitario * p.cantidad],
              err => err ? rej(err) : res());
          }))),

          // PASO 5: Descontar stock de productos NUEVOS
          () => Promise.all(productosNuevos.filter(p => p.variante_id).map(p => new Promise((res, rej) => {
            db.db.run('UPDATE variantes_producto SET cantidad = cantidad - ? WHERE id = ?',
              [p.cantidad, p.variante_id],
              err => err ? rej(err) : res());
          }))),

          // PASO 6: Recalcular total — SIN tocar monto_pagado
          () => new Promise((res, rej) => {
            db.db.get(
              `SELECT COALESCE(SUM(precio_unitario * cantidad), 0) as nuevo_total FROM venta_productos WHERE venta_id = ?`,
              [venta_id],
              (err, row) => {
                if (err) return rej(err);
                const nuevoTotal = row.nuevo_total;
                db.db.get(`SELECT monto_pagado, cambio FROM ventas WHERE id = ?`, [venta_id], (err2, ventaActual) => {
                  if (err2) return rej(err2);
                  const pagadoEfectivo = (ventaActual?.monto_pagado || 0) - (ventaActual?.cambio || 0);
                  const nuevoEstado = pagadoEfectivo >= nuevoTotal ? 'Pagado' : 'Pendiente';
                  db.db.run(
                    `UPDATE ventas SET subtotal = ?, total = ?, estado = ?, fecha_actualizado = datetime('now', 'localtime') WHERE id = ?`,
                    [nuevoTotal, nuevoTotal, nuevoEstado, venta_id],
                    err3 => err3 ? rej(err3) : res());
                });
              }
            );
          }),

          // PASO 7: Marcar venta con devolución
          () => new Promise((res, rej) => {
            db.db.run('UPDATE ventas SET tiene_devolucion = 1 WHERE id = ?', [venta_id],
              err => err ? rej(err) : res());
          }),

          // PASO 8: Añadir nota a la venta
          () => new Promise((res, rej) => {
            const prodDevueltos = `${producto_devuelto_nombre}${talla_devuelta ? ' T:' + talla_devuelta : ''} ($${precio_original.toLocaleString('es-CO')})`;
            const prodRecibidos = productosNuevos
              .map(p => `${p.producto_nombre}${p.talla ? ' T:' + p.talla : ''} ($${p.precio_unitario.toLocaleString('es-CO')})`)
              .join(', ');
            const notaDevolucion = `🔄 Devolución ${numero}: devolvió ${prodDevueltos} → recibió ${prodRecibidos}`;
            db.db.run(
              `UPDATE ventas SET notas = CASE WHEN notas IS NULL OR notas = '' THEN ? ELSE notas || ' | ' || ? END WHERE id = ?`,
              [notaDevolucion, notaDevolucion, venta_id],
              err => err ? rej(err) : res());
          }),

          // PASO 9: Actualizar deuda y corregir monto_pagado en ventas
          () => new Promise((res, rej) => {
            db.db.get(
              `SELECT id, monto_total, monto_pagado, monto_pendiente FROM deudas_clientes WHERE venta_id = ? AND estado = 'Pendiente' LIMIT 1`,
              [venta_id],
              (err, deudaExistente) => {
                if (err) return rej(err);
                if (!deudaExistente) return res();

                const yaAbonado = deudaExistente.monto_pagado || 0;
                const nuevoMontoTotal = subtotal_nuevos;
                const nuevoMontoPendiente = Math.max(0, nuevoMontoTotal - yaAbonado);
                const nuevoEstado = nuevoMontoPendiente <= 0 ? 'Pagado' : 'Pendiente';

                db.db.run(
                  `UPDATE deudas_clientes SET monto_total = ?, monto_pendiente = ?, estado = ?, fecha_actualizado = datetime('now', 'localtime') WHERE id = ?`,
                  [nuevoMontoTotal, nuevoMontoPendiente, nuevoEstado, deudaExistente.id],
                  err2 => {
                    if (err2) return rej(err2);
                    db.db.run(`UPDATE ventas SET monto_pagado = ? WHERE id = ?`,
                      [yaAbonado, venta_id],
                      err3 => err3 ? rej(err3) : res());
                  }
                );
              }
            );
          }),

          // PASO 9.5: Registrar en caja SOLO dinero físico que entra o sale
          () => new Promise((res, rej) => {
            const diferenciaCaja = subtotal_nuevos - subtotal_devuelto;

            console.log('🔍 PASO 9.5:', { subtotal_nuevos, subtotal_devuelto, diferenciaCaja, aplicado_a_deuda: datos.aplicado_a_deuda });

            if (Math.abs(diferenciaCaja) < 1) return res();

            const aplicadoDeuda = datos.aplicado_a_deuda || 0;
            const montoEfectivo = Math.abs(diferenciaCaja) - aplicadoDeuda;

            console.log('🔍 montoEfectivo:', montoEfectivo, '| aplicadoDeuda:', aplicadoDeuda);

            // Si toda la diferencia se aplicó a deuda, no hay movimiento físico
            if (montoEfectivo < 1) return res();

            db.db.get(
              `SELECT COALESCE((SELECT saldo_resultante FROM caja_movimientos ORDER BY id DESC LIMIT 1), 0) as saldo_actual`,
              [],
              (err, row) => {
                if (err) return rej(err);
                const saldoActual = row ? row.saldo_actual : 0;
                const esSalida = diferenciaCaja < 0;
                const nuevoSaldo = esSalida ? saldoActual - montoEfectivo : saldoActual + montoEfectivo;

                db.db.run(
                  `INSERT INTO caja_movimientos (tipo, concepto, monto, saldo_resultante, origen, referencia_id)
                   VALUES (?, ?, ?, ?, 'devolucion', ?)`,
                  [
                    esSalida ? 'salida' : 'entrada',
                    `Devolución efectivo: ${producto_devuelto_nombre} → ${productosNuevos.map(p => p.producto_nombre).join(', ')}`,
                    montoEfectivo,
                    nuevoSaldo,
                    venta_id
                  ],
                  err => err ? rej(err) : res());
              }
            );
          }),

        ])
        .then(() => {
          db.db.run('COMMIT', err => {
            if (err) return callback(err);
            console.log(`✅ Devolución ${numero} registrada correctamente`);
            callback(null, { success: true, id: devolucionId, numero_devolucion: numero, diferencia, tipo_diferencia });
          });
        })
        .catch(err => {
          db.db.run('ROLLBACK');
          console.error('❌ Error en devolución:', err);
          callback(err);
        });
      });
    });
  });
}

function obtener(callback) {
  db.db.all(`
    SELECT d.*, v.numero_venta FROM devoluciones d
    LEFT JOIN ventas v ON d.venta_id = v.id
    ORDER BY d.fecha DESC
  `, [], callback);
}

function obtenerPorVenta(ventaId, callback) {
  db.db.all(`
    SELECT d.*, di.producto_nombre as item_nombre, di.talla as item_talla,
           di.cantidad as item_cantidad, di.precio_unitario as item_precio,
           di.subtotal as item_subtotal
    FROM devoluciones d
    LEFT JOIN devolucion_items di ON di.devolucion_id = d.id
    WHERE d.venta_id = ?
    ORDER BY d.fecha DESC
  `, [ventaId], callback);
}

module.exports = { inicializarTablas, generarNumeroDevolucion, registrarDevolucion, obtener, obtenerPorVenta, DIFERENCIA_MINIMA };