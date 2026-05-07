// database/models/devoluciones.model.js
// Modelo para gestión de devoluciones con intercambio de productos

const db = require('../index'); // ajusta la ruta según tu proyecto

// ══════════════════════════════════════════════
// INICIALIZAR TABLAS DE DEVOLUCIONES
// ══════════════════════════════════════════════
function inicializarTablas(callback) {
  db.db.serialize(() => {
    // Tabla principal de devoluciones
    db.db.run(`
      CREATE TABLE IF NOT EXISTS devoluciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_devolucion TEXT UNIQUE NOT NULL,
        venta_id INTEGER NOT NULL,
        cliente_id INTEGER,
        cliente_nombre TEXT NOT NULL,

        -- Producto devuelto (el que trae el cliente)
        producto_devuelto_id INTEGER,
        variante_devuelta_id INTEGER,
        producto_devuelto_nombre TEXT NOT NULL,
        talla_devuelta TEXT,
        cantidad_devuelta INTEGER NOT NULL DEFAULT 1,
        precio_original REAL NOT NULL,        -- precio al que se vendió
        subtotal_devuelto REAL NOT NULL,      -- precio_original * cantidad

        -- Producto de reemplazo (el que se lleva el cliente)
        producto_nuevo_id INTEGER,
        variante_nueva_id INTEGER,
        producto_nuevo_nombre TEXT NOT NULL,
        talla_nueva TEXT,
        cantidad_nueva INTEGER NOT NULL DEFAULT 1,
        precio_nuevo REAL NOT NULL,           -- precio actual del producto nuevo
        subtotal_nuevo REAL NOT NULL,         -- precio_nuevo * cantidad

        -- Diferencia económica
        diferencia REAL NOT NULL DEFAULT 0,   -- subtotal_nuevo - subtotal_devuelto
        -- positivo = cliente paga más
        -- negativo = tienda devuelve dinero

        tipo_diferencia TEXT NOT NULL,        -- 'cobro', 'devolucion', 'sin_diferencia'
        monto_cobrado REAL DEFAULT 0,         -- lo que pagó el cliente adicional
        monto_devuelto REAL DEFAULT 0,        -- lo que devolvió la tienda al cliente
        aplicado_a_deuda REAL DEFAULT 0,      -- si había deuda, cuánto se descontó de la deuda

        -- Deuda relacionada
        deuda_afectada_id INTEGER,            -- ID de deuda_cliente si se afectó una deuda
        deuda_reducida REAL DEFAULT 0,        -- cuánto se redujo la deuda (si aplica)

        notas TEXT,
        fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla devoluciones:', err);
        if (callback) callback(err);
        return;
      }
      console.log('✅ Tabla devoluciones lista');
      if (callback) callback(null);
    });
  });
}

// ══════════════════════════════════════════════
// GENERAR NÚMERO DE DEVOLUCIÓN
// ══════════════════════════════════════════════
function generarNumeroDevolucion(callback) {
  const hoy = new Date();
  const yy = String(hoy.getFullYear()).slice(2);
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const prefijo = `D${yy}${mm}${dd}`;

  db.db.get(
    `SELECT COUNT(*) as total FROM devoluciones
     WHERE numero_devolucion LIKE ?`,
    [`${prefijo}%`],
    (err, row) => {
      if (err) return callback(err);
      const secuencia = String((row.total || 0) + 1).padStart(4, '0');
      callback(null, `${prefijo}-${secuencia}`);
    }
  );
}

// ══════════════════════════════════════════════
// REGISTRAR DEVOLUCIÓN
// ══════════════════════════════════════════════
function registrarDevolucion(datos, callback) {
  const {
    venta_id,
    cliente_id,
    cliente_nombre,
    // Producto devuelto
    producto_devuelto_id,
    variante_devuelta_id,
    producto_devuelto_nombre,
    talla_devuelta,
    cantidad_devuelta,
    precio_original,
    // Producto nuevo
    producto_nuevo_id,
    variante_nueva_id,
    producto_nuevo_nombre,
    talla_nueva,
    cantidad_nueva,
    precio_nuevo,
    // Diferencia
    monto_cobrado,
    monto_devuelto,
    aplicado_a_deuda,
    deuda_afectada_id,
    deuda_reducida,
    notas
  } = datos;

  const subtotal_devuelto = precio_original * cantidad_devuelta;
  const subtotal_nuevo = precio_nuevo * cantidad_nueva;
  const diferencia = subtotal_nuevo - subtotal_devuelto;

  let tipo_diferencia = 'sin_diferencia';
  if (diferencia > 0) tipo_diferencia = 'cobro';
  else if (diferencia < 0) tipo_diferencia = 'devolucion';

  generarNumeroDevolucion((err, numero) => {
    if (err) return callback(err);

    db.db.serialize(() => {
      db.db.run('BEGIN TRANSACTION');

      // 1. Insertar la devolución
      db.db.run(`
        INSERT INTO devoluciones (
          numero_devolucion, venta_id, cliente_id, cliente_nombre,
          producto_devuelto_id, variante_devuelta_id, producto_devuelto_nombre,
          talla_devuelta, cantidad_devuelta, precio_original, subtotal_devuelto,
          producto_nuevo_id, variante_nueva_id, producto_nuevo_nombre,
          talla_nueva, cantidad_nueva, precio_nuevo, subtotal_nuevo,
          diferencia, tipo_diferencia,
          monto_cobrado, monto_devuelto, aplicado_a_deuda,
          deuda_afectada_id, deuda_reducida, notas
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        numero, venta_id, cliente_id || null, cliente_nombre,
        producto_devuelto_id || null, variante_devuelta_id || null,
        producto_devuelto_nombre, talla_devuelta || null,
        cantidad_devuelta, precio_original, subtotal_devuelto,
        producto_nuevo_id || null, variante_nueva_id || null,
        producto_nuevo_nombre, talla_nueva || null,
        cantidad_nueva, precio_nuevo, subtotal_nuevo,
        diferencia, tipo_diferencia,
        monto_cobrado || 0, monto_devuelto || 0, aplicado_a_deuda || 0,
        deuda_afectada_id || null, deuda_reducida || 0,
        notas || null
      ], function (err) {
        if (err) {
          db.db.run('ROLLBACK');
          console.error('❌ Error al insertar devolución:', err);
          return callback(err);
        }

        const devolucionId = this.lastID;

        // 2. Restaurar stock del producto devuelto
        const restaurarStock = new Promise((resolve, reject) => {
          if (!variante_devuelta_id) return resolve();
          db.db.run(
            'UPDATE variantes_producto SET cantidad = cantidad + ? WHERE id = ?',
            [cantidad_devuelta, variante_devuelta_id],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`✅ Stock restaurado: variante ${variante_devuelta_id} +${cantidad_devuelta}`);
                resolve();
              }
            }
          );
        });

        // 3. Descontar stock del producto nuevo que sale
        const descontarStock = new Promise((resolve, reject) => {
          if (!variante_nueva_id) return resolve();
          db.db.run(
            'UPDATE variantes_producto SET cantidad = cantidad - ? WHERE id = ?',
            [cantidad_nueva, variante_nueva_id],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`✅ Stock descontado: variante ${variante_nueva_id} -${cantidad_nueva}`);
                resolve();
              }
            }
          );
        });

        // 4. Si hay deuda del cliente y se aplica a la deuda
        const actualizarDeuda = new Promise((resolve, reject) => {
          if (!deuda_afectada_id || !deuda_reducida || deuda_reducida <= 0) return resolve();

          db.db.run(`
            UPDATE deudas_clientes
            SET monto_pagado = monto_pagado + ?,
                monto_pendiente = MAX(0, monto_pendiente - ?),
                estado = CASE
                  WHEN (monto_pendiente - ?) <= 0 THEN 'Pagado'
                  ELSE estado
                END,
                fecha_actualizado = datetime('now', 'localtime')
            WHERE id = ?
          `, [deuda_reducida, deuda_reducida, deuda_reducida, deuda_afectada_id],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`✅ Deuda ${deuda_afectada_id} reducida en $${deuda_reducida}`);
                resolve();
              }
            }
          );
        });

        Promise.all([restaurarStock, descontarStock, actualizarDeuda])
          .then(() => {
            db.db.run('COMMIT', (err) => {
              if (err) {
                console.error('❌ Error en COMMIT:', err);
                return callback(err);
              }
              console.log(`✅ Devolución ${numero} registrada correctamente`);
              callback(null, {
                success: true,
                id: devolucionId,
                numero_devolucion: numero,
                diferencia,
                tipo_diferencia
              });
            });
          })
          .catch((err) => {
            db.db.run('ROLLBACK');
            console.error('❌ Error en operaciones de devolución:', err);
            callback(err);
          });
      });
    });
  });
}

// ══════════════════════════════════════════════
// OBTENER DEVOLUCIONES
// ══════════════════════════════════════════════
function obtener(callback) {
  db.db.all(`
    SELECT d.*, v.numero_venta
    FROM devoluciones d
    LEFT JOIN ventas v ON d.venta_id = v.id
    ORDER BY d.fecha DESC
  `, [], callback);
}

// ══════════════════════════════════════════════
// OBTENER DEVOLUCIONES DE UNA VENTA
// ══════════════════════════════════════════════
function obtenerPorVenta(ventaId, callback) {
  db.db.all(`
    SELECT * FROM devoluciones
    WHERE venta_id = ?
    ORDER BY fecha DESC
  `, [ventaId], callback);
}

module.exports = {
  inicializarTablas,
  generarNumeroDevolucion,
  registrarDevolucion,
  obtener,
  obtenerPorVenta
};