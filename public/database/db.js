const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Determinar la ruta correcta según el entorno
let dbPath;

if (app.isPackaged) {
  // En producción (empaquetado)
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'dalu.db');
} else {
  // En desarrollo
  dbPath = path.join(app.getPath('userData'), 'dalu.db');
}

console.log('📂 Base de datos en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conectado a SQLite');
    initDatabase();
  }
});

// Crear tablas
function initDatabase() {
  db.serialize(() => {
    // Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE,
      telefono TEXT,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Productos
    db.run(`CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referencia TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      costo REAL NOT NULL,
      precio_venta REAL NOT NULL,
      talla TEXT,
      cantidad INTEGER DEFAULT 0,
      fecha_creado DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ventas
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      total REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    // Detalle de ventas
    db.run(`CREATE TABLE IF NOT EXISTS venta_productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      FOREIGN KEY(venta_id) REFERENCES ventas(id),
      FOREIGN KEY(producto_id) REFERENCES productos(id)
    )`);

    // Gastos
    db.run(`CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Deudas
    db.run(`CREATE TABLE IF NOT EXISTS deudas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      pagado BOOLEAN DEFAULT 0,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    console.log('✅ Tablas creadas correctamente');
  });
}

// ==================== FUNCIONES PARA PRODUCTOS ====================

function agregarProducto(datos, callback) {
  const { referencia, nombre, categoria, costo, precio_venta, talla, cantidad } = datos;

  const sql = `INSERT INTO productos (referencia, nombre, categoria, costo, precio_venta, talla, cantidad)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [referencia, nombre, categoria, costo, precio_venta, talla || null, cantidad], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { id: this.lastID, ...datos });
    }
  });
}

function obtenerProductos(callback) {
  db.all('SELECT * FROM productos ORDER BY fecha_creado DESC', [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function obtenerProductosPorCategoria(categoria, callback) {
  db.all('SELECT * FROM productos WHERE categoria = ? ORDER BY fecha_creado DESC', [categoria], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function buscarProductos(termino, callback) {
  const sql = `SELECT * FROM productos
               WHERE nombre LIKE ? OR referencia LIKE ? OR categoria LIKE ?
               ORDER BY fecha_creado DESC`;
  const searchTerm = `%${termino}%`;

  db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function actualizarProducto(id, datos, callback) {
  const { referencia, nombre, categoria, costo, precio_venta, talla, cantidad } = datos;

  const sql = `UPDATE productos
               SET referencia = ?, nombre = ?, categoria = ?, costo = ?,
                   precio_venta = ?, talla = ?, cantidad = ?, fecha_actualizado = CURRENT_TIMESTAMP
               WHERE id = ?`;

  db.run(sql, [referencia, nombre, categoria, costo, precio_venta, talla, cantidad, id], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { id, ...datos });
    }
  });
}

function eliminarProducto(id, callback) {
  db.run('DELETE FROM productos WHERE id = ?', [id], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { deleted: this.changes });
    }
  });
}

function obtenerEstadisticasInventario(callback) {
  const sql = `SELECT
                 COUNT(*) as total,
                 SUM(CASE WHEN cantidad < 10 AND cantidad > 0 THEN 1 ELSE 0 END) as stock_bajo,
                 SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as agotados
               FROM productos`;

  db.get(sql, [], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

module.exports = {
  db,
  agregarProducto,
  obtenerProductos,
  obtenerProductosPorCategoria,
  buscarProductos,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticasInventario
};