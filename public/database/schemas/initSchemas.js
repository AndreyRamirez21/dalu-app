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
      numero_compras INTEGER DEFAULT 0,
      tarjeta_fidelidad_entregada INTEGER DEFAULT 0,
      fecha_primera_compra DATETIME,
      compras_con_tarjeta INTEGER DEFAULT 0,
      descuento_aplicado_3 INTEGER DEFAULT 0,
      descuento_aplicado_6 INTEGER DEFAULT 0
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre)`);

    // ==================== TABLA DE PRODUCTOS ====================
    db.run(`CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referencia TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      coleccion TEXT,
      coleccion_oculta INTEGER DEFAULT 0,
      costo_base REAL NOT NULL,
      precio_calculado REAL,
      precio_venta_base REAL NOT NULL,
      tiene_variantes INTEGER DEFAULT 0,
      imagen TEXT,
      imagenes TEXT,
      -- ✅ NUEVO: Fecha de ingreso del producto al inventario
      fecha_ingreso DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);

    // Agregar columna imagen si no existe
    db.run(`ALTER TABLE productos ADD COLUMN imagen TEXT`, () => {});
    db.run(`ALTER TABLE productos ADD COLUMN imagenes TEXT`, () => {});
    db.run(`
      ALTER TABLE productos ADD COLUMN imagenThumbnail TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar columna imagenThumbnail:', err);
      }
    });

    // ✅ NUEVO: Agregar fecha_ingreso si no existe (para bases de datos ya creadas)
db.run(`ALTER TABLE productos ADD COLUMN fecha_ingreso DATETIME`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar columna fecha_ingreso:', err);
  }
});

// ✅ NUEVO: activo para soft-delete (permite ocultar productos sin perder historial)
db.run(`ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar columna activo:', err);
  }
});

db.run(`ALTER TABLE productos ADD COLUMN publicado_web INTEGER DEFAULT 1`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar columna publicado_web:', err);
  }
});

// Campos opcionales para la ficha web. Las bases de datos existentes los reciben sin perder productos.
db.run(`ALTER TABLE productos ADD COLUMN descripcion TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar descripción a productos:', err);
  }
});

db.run(`ALTER TABLE productos ADD COLUMN coleccion TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar colección a productos:', err);
  }
});

db.run(`ALTER TABLE productos ADD COLUMN coleccion_oculta INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar visibilidad de colección a productos:', err);
  }
});

    // ==================== TABLA DE VARIANTES DE PRODUCTO ====================
    db.run(`CREATE TABLE IF NOT EXISTS variantes_producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      talla TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0,
      ajuste_precio REAL DEFAULT 0,
      -- ✅ NUEVO: Fechas de rotación por variante
      fecha_ingreso DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_primera_venta DATETIME,
      fecha_ultima_venta DATETIME,
      total_unidades_vendidas INTEGER DEFAULT 0,
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      UNIQUE(producto_id, talla)
    )`);

    // ✅ NUEVO: fecha_actualizado para sincronización con la web
    db.run(`ALTER TABLE variantes_producto ADD COLUMN fecha_actualizado DATETIME`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar fecha_actualizado a variantes:', err);
      } else {
        // Backfill: para las filas ya existentes, ponemos la fecha actual como punto de partida
        db.run(`UPDATE variantes_producto SET fecha_actualizado = datetime('now', 'localtime') WHERE fecha_actualizado IS NULL`);
      }
    });

    // ✅ NUEVO: Agregar columnas de rotación a variantes si no existen (para BDs ya creadas)
db.run(`ALTER TABLE variantes_producto ADD COLUMN fecha_ingreso DATETIME`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error al agregar fecha_ingreso a variantes:', err);
  }
});
    db.run(`ALTER TABLE variantes_producto ADD COLUMN fecha_primera_venta DATETIME`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar fecha_primera_venta a variantes:', err);
      }
    });
    db.run(`ALTER TABLE variantes_producto ADD COLUMN fecha_ultima_venta DATETIME`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar fecha_ultima_venta a variantes:', err);
      }
    });
    db.run(`ALTER TABLE variantes_producto ADD COLUMN total_unidades_vendidas INTEGER DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar total_unidades_vendidas a variantes:', err);
      }
    });

    // ✅ NUEVO: Tabla de historial de ventas por variante (para rastreo detallado)
    db.run(`CREATE TABLE IF NOT EXISTS historial_ventas_variante (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variante_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      venta_id INTEGER NOT NULL,
      cantidad_vendida INTEGER NOT NULL,
      precio_venta REAL NOT NULL,
      fecha_venta DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(variante_id) REFERENCES variantes_producto(id) ON DELETE CASCADE,
      FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      FOREIGN KEY(venta_id) REFERENCES ventas(id)
    )`, (err) => {
      if (err) {
        console.error('Error al crear historial_ventas_variante:', err);
      } else {
        console.log('✅ Tabla historial_ventas_variante creada/verificada');
      }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_historial_variante ON historial_ventas_variante(variante_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_historial_producto ON historial_ventas_variante(producto_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_historial_venta ON historial_ventas_variante(venta_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_ventas_variante(fecha_venta)`);

    // ✅ NUEVO: TABLA DE COSTOS ADICIONALES DEL PRODUCTO
    db.run(`CREATE TABLE IF NOT EXISTS costos_adicionales_producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      concepto TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha_creado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla costos_adicionales_producto:', err);
      } else {
        console.log('✅ Tabla costos_adicionales_producto creada/verificada');
      }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_costos_producto ON costos_adicionales_producto(producto_id)`);

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
      descuento_porcentaje INTEGER DEFAULT 0,
      descuento_monto REAL DEFAULT 0,
      metodo_pago TEXT,
      notas TEXT,
      fecha DATETIME DEFAULT (datetime('now', 'localtime')),
      fecha_actualizado DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

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

    // ==================== TABLA DE COSTOS ADICIONALES (DE VENTAS) ====================
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


  //----------------------------------------------------------
  //--------------- TABLAS DE CAJA------------------
  //----------------------------------------------------------

db.run(`
CREATE TABLE IF NOT EXISTS caja_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida', 'ajuste', 'apertura')),
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  saldo_resultante REAL NOT NULL,
  origen TEXT DEFAULT 'manual',  -- 'manual', 'venta', 'gasto'
  referencia_id INTEGER,         -- id de venta o gasto si aplica
  fecha TEXT DEFAULT (datetime('now', 'localtime')),
  notas TEXT
);`);
db.run(`

CREATE TABLE IF NOT EXISTS caja_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  saldo_inicial REAL DEFAULT 0,
  fecha_apertura TEXT DEFAULT (datetime('now', 'localtime'))
);`);


  //----------------------------------------------------------
  //--------------- TABLAS DE MARCAS ALIADAS------------------
  //----------------------------------------------------------

  db.run(`
    CREATE TABLE IF NOT EXISTS marcas_aliadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      contacto_nombre TEXT,
      contacto_telefono TEXT,
      contacto_email TEXT,
      porcentaje_comision REAL DEFAULT 0,
      notas TEXT,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
      fecha_actualizacion TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS productos_marca_aliada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marca_aliada_id INTEGER NOT NULL,
      referencia TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      precio_venta_base REAL NOT NULL,
      imagen TEXT,
      fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
      fecha_actualizacion TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (marca_aliada_id) REFERENCES marcas_aliadas (id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS variantes_marca_aliada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_marca_id INTEGER NOT NULL,
      talla TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0,
      ajuste_precio REAL DEFAULT 0,
      FOREIGN KEY (producto_marca_id) REFERENCES productos_marca_aliada (id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas_marca_aliada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      marca_aliada_id INTEGER NOT NULL,
      producto_marca_id INTEGER NOT NULL,
      variante_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      comision_marca REAL,
      ganancia_tienda REAL,
      fecha_venta TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (marca_aliada_id) REFERENCES marcas_aliadas (id),
      FOREIGN KEY (producto_marca_id) REFERENCES productos_marca_aliada (id),
      FOREIGN KEY (variante_id) REFERENCES variantes_marca_aliada (id)
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_productos_marca_marca_id ON productos_marca_aliada(marca_aliada_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_variantes_marca_producto_id ON variantes_marca_aliada(producto_marca_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ventas_marca_marca_id ON ventas_marca_aliada(marca_aliada_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ventas_marca_venta_id ON ventas_marca_aliada(venta_id);`);

  console.log('✅ Tablas de Marcas Aliadas creadas exitosamente');
}



module.exports = initDatabase;
