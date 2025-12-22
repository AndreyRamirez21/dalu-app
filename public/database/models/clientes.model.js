const db = require('../config/connection');

// ==================== FUNCIONES PARA CLIENTES ====================

function agregarCliente(datos, callback) {
  const { nombre, cedula, correo, celular } = datos;

  const sql = `INSERT INTO clientes(nombre, cedula, correo, celular, fecha_primera_compra)
               VALUES(?, ?, ?, ?, datetime('now', 'localtime'))`;

  db.run(sql, [nombre, cedula || null, correo || null, celular || null], function (err) {
    if (err) {
      console.error('❌ Error al agregar cliente:', err);
      callback(err, null);
    } else {
      console.log('✅ Cliente agregado con ID:', this.lastID);
      callback(null, { id: this.lastID, ...datos });
    }
  });
}

function obtenerClientes(callback) {
  const sql = `SELECT * FROM clientes ORDER BY nombre ASC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener clientes:', err);
      callback(err, null);
    } else {
      console.log('✅ Clientes obtenidos:', rows.length);
      callback(null, rows);
    }
  });
}

function obtenerClientePorId(id, callback) {
  const sql = `SELECT * FROM clientes WHERE id = ?`;

  db.get(sql, [id], (err, row) => {
    if (err) {
      callback(err, null);
    } else if (!row) {
      callback(new Error('Cliente no encontrado'), null);
    } else {
      callback(null, row);
    }
  });
}

function obtenerClientePorCedula(cedula, callback) {
  const sql = `SELECT * FROM clientes WHERE cedula = ?`;

  db.get(sql, [cedula], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

function buscarClientes(termino, callback) {
  const sql = `SELECT * FROM clientes
               WHERE nombre LIKE ? OR cedula LIKE ? OR correo LIKE ? OR celular LIKE ?
               ORDER BY nombre ASC`;

  const searchTerm = `%${termino}%`;

  db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function actualizarCliente(id, datos, callback) {
  const { nombre, cedula, correo, celular } = datos;

  const sql = `UPDATE clientes
               SET nombre = ?, cedula = ?, correo = ?, celular = ?
               WHERE id = ?`;

  db.run(sql, [nombre, cedula || null, correo || null, celular || null, id], function (err) {
    if (err) {
      console.error('❌ Error al actualizar cliente:', err);
      callback(err, null);
    } else {
      console.log('✅ Cliente actualizado:', id);
      callback(null, { id, ...datos, updated: this.changes });
    }
  });
}

function eliminarCliente(id, callback) {
  const sql = `DELETE FROM clientes WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('❌ Error al eliminar cliente:', err);
      callback(err, null);
    } else {
      console.log('✅ Cliente eliminado:', id);
      callback(null, { deleted: this.changes });
    }
  });
}

function actualizarEstadisticasCliente(clienteId, montoCompra, callback) {
  const sql = `UPDATE clientes
               SET ultima_compra = datetime('now', 'localtime'),
                   total_compras = total_compras + ?,
                   numero_compras = numero_compras + 1
               WHERE id = ?`;

  db.run(sql, [montoCompra, clienteId], function (err) {
    if (err) {
      console.error('❌ Error al actualizar estadísticas del cliente:', err);
      callback(err, null);
    } else {
      console.log('✅ Estadísticas del cliente actualizadas');
      callback(null, { updated: this.changes });
    }
  });
}

function obtenerEstadisticasCliente(clienteId, callback) {
  const sql = `SELECT
               c.*,
               COUNT(v.id) as total_ventas,
               SUM(v.total) as total_gastado,
               AVG(v.total) as promedio_compra
               FROM clientes c
               LEFT JOIN ventas v ON c.id = v.cliente_id
               WHERE c.id = ?
               GROUP BY c.id`;

  db.get(sql, [clienteId], (err, row) => {
    if (err) {
      callback(err, null);
    } else if (!row) {
      callback(new Error('Cliente no encontrado'), null);
    } else {
      callback(null, row);
    }
  });
}

function obtenerTopClientes(limite = 10, callback) {
  const sql = `SELECT * FROM clientes
               ORDER BY total_compras DESC, numero_compras DESC
               LIMIT ?`;

  db.all(sql, [limite], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// ==================== FUNCIONES DE FIDELIDAD ====================

/**
 * Verifica si el cliente califica para descuento de fidelidad
 * ✅ CORREGIDO: Cuenta ventas INDIVIDUALES mayores a $30,000
 */
function verificarDescuentoFidelidad(clienteId, callback) {
  const sql = `
    SELECT
      c.*,
      -- 🎯 Contar VENTAS INDIVIDUALES mayores a $30,000
      (
        SELECT COUNT(*)
        FROM ventas v
        WHERE v.cliente_id = c.id
          AND v.estado = 'Pagado'
          AND v.total > 30000
      ) as ventas_mayores_30k,

      CASE
        -- ✅ Primera compra: entregar tarjeta
        WHEN c.numero_compras = 0 THEN 'entrega_tarjeta'

        -- ✅ SEXTA compra con tarjeta (15%)
        -- Califica cuando tiene EXACTAMENTE 5 compras previas con tarjeta
        -- Esta será la 6ta compra que active el descuento
        WHEN c.compras_con_tarjeta = 5
        AND c.descuento_aplicado_6 = 0
        AND c.fecha_primera_compra IS NOT NULL
        AND julianday('now') - julianday(c.fecha_primera_compra) <= 300
        THEN 'descuento_15'

        -- ✅ TERCERA compra con tarjeta (10%)
        -- Califica cuando tiene EXACTAMENTE 2 compras previas con tarjeta
        -- Esta será la 3ra compra que active el descuento
        WHEN c.compras_con_tarjeta = 2
        AND c.descuento_aplicado_3 = 0
        THEN 'descuento_10'

        ELSE 'ninguno'
      END as estado_fidelidad
    FROM clientes c
    WHERE c.id = ?
  `;

  db.get(sql, [clienteId], (err, row) => {
    if (err) {
      console.error('❌ Error al verificar fidelidad:', err);
      callback(err, null);
    } else {
      console.log('🔍 Verificación fidelidad:', {
        cliente_id: clienteId,
        numero_compras: row?.numero_compras,
        compras_con_tarjeta: row?.compras_con_tarjeta,
        descuento_aplicado_3: row?.descuento_aplicado_3,
        descuento_aplicado_6: row?.descuento_aplicado_6,
        estado: row?.estado_fidelidad
      });
      callback(null, row);
    }
  });
}
/**
 * Registra que se entregó tarjeta de fidelidad
 */
function registrarEntregaTarjeta(clienteId, callback) {
  const sql = `UPDATE clientes
               SET tarjeta_fidelidad_entregada = 1
               WHERE id = ?`;

  db.run(sql, [clienteId], function (err) {
    if (err) {
      console.error('❌ Error al registrar entrega de tarjeta:', err);
      callback(err, null);
    } else {
      console.log('✅ Tarjeta de fidelidad registrada para cliente:', clienteId);
      callback(null, { success: true });
    }
  });
}

/**
 * Registra que el cliente presentó la tarjeta en la compra
 */
function registrarPresentacionTarjeta(clienteId, callback) {
  const sql = `UPDATE clientes
               SET compras_con_tarjeta = compras_con_tarjeta + 1
               WHERE id = ?`;

  db.run(sql, [clienteId], function (err) {
    if (err) {
      console.error('❌ Error al registrar presentación de tarjeta:', err);
      callback(err, null);
    } else {
      console.log('✅ Presentación de tarjeta registrada para cliente:', clienteId);
      callback(null, { success: true });
    }
  });
}

/**
 * Marca que se aplicó descuento del 10% (3ra compra)
 */
function marcarDescuentoAplicado3(clienteId, callback) {
  const sql = `UPDATE clientes
               SET descuento_aplicado_3 = 1
               WHERE id = ?`;

  db.run(sql, [clienteId], function (err) {
    if (err) {
      console.error('❌ Error al marcar descuento del 10%:', err);
      callback(err, null);
    } else {
      console.log('✅ Descuento del 10% marcado para cliente:', clienteId);
      callback(null, { success: true });
    }
  });
}

/**
 * Marca que se aplicó descuento del 15% (6ta compra)
 */
function marcarDescuentoAplicado6(clienteId, callback) {
  const sql = `UPDATE clientes
               SET descuento_aplicado_6 = 1
               WHERE id = ?`;

  db.run(sql, [clienteId], function (err) {
    if (err) {
      console.error('❌ Error al marcar descuento del 15%:', err);
      callback(err, null);
    } else {
      console.log('✅ Descuento del 15% marcado para cliente:', clienteId);
      callback(null, { success: true });
    }
  });
}

/**
 * Reinicia el programa de fidelidad del cliente
 */
function reiniciarFidelidad(clienteId, callback) {
  const sql = `UPDATE clientes
               SET tarjeta_fidelidad_entregada = 0,
                   fecha_primera_compra = NULL,
                   compras_con_tarjeta = 0,
                   descuento_aplicado_3 = 0,
                   descuento_aplicado_6 = 0
               WHERE id = ?`;

  db.run(sql, [clienteId], function (err) {
    if (err) {
      console.error('❌ Error al reiniciar fidelidad:', err);
      callback(err, null);
    } else {
      console.log('✅ Fidelidad reiniciada para cliente:', clienteId);
      callback(null, { success: true });
    }
  });
}

/**
 * Verifica y reinicia fidelidad si han pasado 10 meses sin cumplir requisitos
 */
function verificarYReiniciarFidelidad(callback) {
  // Clientes que no llegaron a la 3ra compra en 10 meses
  const sql = `UPDATE clientes
               SET tarjeta_fidelidad_entregada = 0,
                   fecha_primera_compra = NULL,
                   compras_con_tarjeta = 0,
                   descuento_aplicado_3 = 0,
                   descuento_aplicado_6 = 0
               WHERE fecha_primera_compra IS NOT NULL
               AND numero_compras < 3
               AND julianday('now') - julianday(fecha_primera_compra) > 300`;

  db.run(sql, [], function (err) {
    if (err) {
      console.error('❌ Error al verificar y reiniciar fidelidad:', err);
      callback(err, null);
    } else {
      console.log(`✅ ${this.changes} clientes tuvieron su fidelidad reiniciada`);
      callback(null, { clientes_reiniciados: this.changes });
    }
  });
}

module.exports = {
  agregarCliente,
  obtenerClientes,
  obtenerClientePorId,
  obtenerClientePorCedula,
  buscarClientes,
  actualizarCliente,
  eliminarCliente,
  actualizarEstadisticasCliente,
  obtenerEstadisticasCliente,
  obtenerTopClientes,
  // Funciones de fidelidad
  verificarDescuentoFidelidad,
  registrarEntregaTarjeta,
  registrarPresentacionTarjeta,
  marcarDescuentoAplicado3,
  marcarDescuentoAplicado6,
  reiniciarFidelidad,
  verificarYReiniciarFidelidad
};