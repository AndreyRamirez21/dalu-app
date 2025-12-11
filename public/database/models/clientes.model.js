const db = require('../config/connection');

// ==================== FUNCIONES PARA CLIENTES ====================

function agregarCliente(datos, callback) {
  const { nombre, cedula, correo, celular } = datos;

  const sql = `INSERT INTO clientes(nombre, cedula, correo, celular)
               VALUES(?, ?, ?, ?)`;

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
  obtenerTopClientes
};