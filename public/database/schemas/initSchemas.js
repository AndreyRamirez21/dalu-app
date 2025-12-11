const db = require('../config/connection');

function initDatabase() {
  db.serialize(() => {
    // ==================== TABLA DE CLIENTES ====================
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      cedula TEXT UNIQUE,
      correo TEXT,
      celular TEXT,
      fecha_registro DATETIME DEFAULT (datetime('now', 'localtime')),
      ultima_compra DATETIME DEFAULT (datetime('now', 'localtime')),
      total_compras REAL DEFAULT 0,
      numero_compras INTEGER DEFAULT 0
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre)`);

    // ==================== TABLA DE PRODUCTOS ====================
    db.run(`CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referencia TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      costo_base REAL NOT NULL,
      precio_venta_base REAL NOT NULL,
      tiene_variantes INTEGER DEFAULT 0,
      imagen TEXT,
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);

    // Agregar columna imagen si no existe
    db.run(`ALTER TABLE productos ADD COLUMN imagen TEXT`, () => {});

    // ==================== TABLA DE VARIANTES DE PRODUCTO ====================
    db.run(`CREATE TABLE IF NOT EXISTS variantes_producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      talla TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0,
      ajuste_precio REAL DEFAULT 0,
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      UNIQUE(producto_id, talla)
    )`);

    // ==================== TABLA DE VENTAS ====================
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_venta TEXT,
      cliente_id INTEGER,
      cliente_nombre TEXT,
      subtotal REAL,
      total REAL NOT NULL,
      monto_pagado REAL DEFAULT 0,
      cambio REAL DEFAULT 0,
      estado TEXT DEFAULT 'Pendiente',
      metodo_pago TEXT,
      notas TEXT,
      fecha DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    // Agregar cliente_id si no existe
    db.run(`ALTER TABLE ventas ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)`, () => {});
    db.run(`CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id)`);

    // ==================== TABLA DE PRODUCTOS VENDIDOS ====================
    db.run(`CREATE TABLE IF NOT EXISTS venta_productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      variante_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      fecha_creacion DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(venta_id) REFERENCES ventas(id),
      FOREIGN KEY(producto_id) REFERENCES productos(id),
      FOREIGN KEY(variante_id) REFERENCES variantes_producto(id)
    )`);

    // ==================== TABLA DE COSTOS ADICIONALES ====================
    db.run(`CREATE TABLE IF NOT EXISTS costos_adicionales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      concepto TEXT NOT NULL,
      monto REAL NOT NULL,
      FOREIGN KEY(venta_id) REFERENCES ventas(id)
    )`);

    // ==================== TABLA DE DEUDAS ====================
    db.run(`CREATE TABLE IF NOT EXISTS deudas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acreedor TEXT NOT NULL,
      factura TEXT,
      tipo_acreedor TEXT,
      monto_total REAL NOT NULL,
      monto_pagado REAL DEFAULT 0,
      notas TEXT,
      fecha_recordatorio DATE,
      estado TEXT DEFAULT 'Pendiente',
      fecha_creacion DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);

    // ==================== TABLA DE PAGOS DE DEUDA ====================
    db.run(`CREATE TABLE IF NOT EXISTS pagos_deuda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deuda_id INTEGER NOT NULL,
      monto_pago REAL NOT NULL,
      fecha_pago DATETIME DEFAULT (datetime('now', 'localtime')),
      metodo_pago TEXT,
      notas TEXT,
      FOREIGN KEY(deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
    )`);

    // ==================== TABLA DE DEUDAS DE CLIENTES ====================
    db.run(`CREATE TABLE IF NOT EXISTS deudas_clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      cliente_id INTEGER,
      cliente_nombre TEXT,
      monto_total REAL NOT NULL,
      monto_pagado REAL DEFAULT 0,
      monto_pendiente REAL,
      estado TEXT DEFAULT 'Pendiente',
      fecha_creacion DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(venta_id) REFERENCES ventas(id),
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    // ==================== TABLA DE ABONOS A DEUDAS DE CLIENTES ====================
    db.run(`CREATE TABLE IF NOT EXISTS abonos_deuda_cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deuda_cliente_id INTEGER NOT NULL,
      monto_abono REAL NOT NULL,
      metodo_pago TEXT,
      notas TEXT,
      fecha_abono DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(deuda_cliente_id) REFERENCES deudas_clientes(id)
    )`);

    // ==================== TABLA DE GASTOS ====================
    db.run(`CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATE NOT NULL,
      descripcion TEXT NOT NULL,
      categoria TEXT NOT NULL,
      monto REAL NOT NULL,
      metodo_pago TEXT NOT NULL,
      proveedor TEXT,
      notas TEXT,
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime'))
    )`, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla gastos:', err);
      } else {
        console.log('✅ Tabla gastos creada/verificada');
      }
    });

    console.log('✅ Tablas creadas correctamente');
  });
}

module.exports = initDatabase;