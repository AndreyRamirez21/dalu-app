const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, 'dalu.db');

// Conectar a SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a SQLite');
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
      nombre TEXT NOT NULL,
      categoria TEXT,
      talla TEXT,
      color TEXT,
      cantidad INTEGER DEFAULT 0,
      precio REAL NOT NULL,
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

    // Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contraseña TEXT NOT NULL,
      rol TEXT DEFAULT 'vendedor',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Tablas creadas o verificadas correctamente');
  });
}

// Funciones básicas para el backend

// 1. Agregar cliente
function agregarCliente(nombre, email, telefono) {
  const stmt = db.prepare(`INSERT INTO clientes(nombre, email, telefono) VALUES (?, ?, ?)`);
  stmt.run(nombre, email, telefono, function(err) {
    if (err) console.error(err);
    else console.log('Cliente agregado con ID:', this.lastID);
  });
  stmt.finalize();
}

// 2. Agregar producto
function agregarProducto(nombre, categoria, talla, color, cantidad, precio) {
  const stmt = db.prepare(`INSERT INTO productos(nombre, categoria, talla, color, cantidad, precio) VALUES (?, ?, ?, ?, ?, ?)`);
  stmt.run(nombre, categoria, talla, color, cantidad, precio, function(err) {
    if (err) console.error(err);
    else console.log('Producto agregado con ID:', this.lastID);
  });
  stmt.finalize();
}

// 3. Registrar venta
function registrarVenta(cliente_id, productos) {
  // Calcular total
  let total = productos.reduce((sum, p) => sum + p.cantidad * p.precio_unitario, 0);

  db.run(`INSERT INTO ventas(cliente_id, total) VALUES (?, ?)`, [cliente_id, total], function(err) {
    if (err) return console.error(err);
    const ventaId = this.lastID;
    const stmt = db.prepare(`INSERT INTO venta_productos(venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`);

    productos.forEach(p => {
      stmt.run(ventaId, p.producto_id, p.cantidad, p.precio_unitario);
      // Actualizar inventario
      db.run(`UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`, [p.cantidad, p.producto_id]);
    });

    stmt.finalize();
    console.log('Venta registrada con ID:', ventaId);
  });
}

// Exportar funciones y db para usar en otros archivos
module.exports = {
  db,
  agregarCliente,
  agregarProducto,
  registrarVenta
};
