// public/database/models/marcas.model.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const getDB = () => {
  const dbPath = path.join(app.getPath('userData'), 'database.db');
  return new Database(dbPath);
};

// ==================== MARCAS ALIADAS ====================

const obtenerMarcasAliadas = () => {
  const db = getDB();
  try {
    const marcas = db.prepare(`
      SELECT
        m.*,
        COUNT(DISTINCT p.id) as total_productos,
        COALESCE(SUM(v.cantidad), 0) as total_stock
      FROM marcas_aliadas m
      LEFT JOIN productos_marca_aliada p ON m.id = p.marca_aliada_id
      LEFT JOIN variantes_marca_aliada v ON p.id = v.producto_marca_id
      GROUP BY m.id
      ORDER BY m.nombre ASC
    `).all();
    return marcas;
  } finally {
    db.close();
  }
};

const agregarMarcaAliada = (marca) => {
  const db = getDB();
  try {
    const stmt = db.prepare(`
      INSERT INTO marcas_aliadas (
        nombre, contacto_nombre, contacto_telefono, contacto_email,
        porcentaje_comision, notas, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      marca.nombre,
      marca.contacto_nombre || null,
      marca.contacto_telefono || null,
      marca.contacto_email || null,
      marca.porcentaje_comision || 0,
      marca.notas || null,
      marca.activo ? 1 : 0
    );

    return { id: result.lastInsertRowid };
  } finally {
    db.close();
  }
};

const actualizarMarcaAliada = (id, marca) => {
  const db = getDB();
  try {
    const stmt = db.prepare(`
      UPDATE marcas_aliadas SET
        nombre = ?,
        contacto_nombre = ?,
        contacto_telefono = ?,
        contacto_email = ?,
        porcentaje_comision = ?,
        notas = ?,
        activo = ?,
        fecha_actualizacion = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(
      marca.nombre,
      marca.contacto_nombre || null,
      marca.contacto_telefono || null,
      marca.contacto_email || null,
      marca.porcentaje_comision || 0,
      marca.notas || null,
      marca.activo ? 1 : 0,
      id
    );

    return { success: true };
  } finally {
    db.close();
  }
};

const eliminarMarcaAliada = (id) => {
  const db = getDB();
  try {
    // ON DELETE CASCADE eliminará automáticamente productos y variantes
    db.prepare('DELETE FROM marcas_aliadas WHERE id = ?').run(id);
    return { success: true };
  } finally {
    db.close();
  }
};

// ==================== PRODUCTOS DE MARCA ALIADA ====================

const obtenerProductosMarcaAliada = (marcaId) => {
  const db = getDB();
  try {
    // Obtener productos
    const productos = db.prepare(`
      SELECT * FROM productos_marca_aliada
      WHERE marca_aliada_id = ?
      ORDER BY nombre ASC
    `).all(marcaId);

    // Obtener variantes para cada producto
    for (let producto of productos) {
      producto.variantes = db.prepare(`
        SELECT * FROM variantes_marca_aliada
        WHERE producto_marca_id = ?
        ORDER BY talla ASC
      `).all(producto.id);
    }

    return productos;
  } finally {
    db.close();
  }
};

const agregarProductoMarcaAliada = (producto, rutaImagen = null) => {
  const db = getDB();
  try {
    // Insertar producto (SIN categoria y costo_base)
    const stmt = db.prepare(`
      INSERT INTO productos_marca_aliada (
        marca_aliada_id, referencia, nombre, precio_venta_base, imagen
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      producto.marca_aliada_id,
      producto.referencia,
      producto.nombre,
      producto.precio_venta_base,
      rutaImagen
    );

    const productoId = result.lastInsertRowid;

    // Insertar variantes
    if (producto.variantes && producto.variantes.length > 0) {
      const stmtVariante = db.prepare(`
        INSERT INTO variantes_marca_aliada (
          producto_marca_id, talla, cantidad, ajuste_precio
        ) VALUES (?, ?, ?, ?)
      `);

      for (let variante of producto.variantes) {
        stmtVariante.run(
          productoId,
          variante.talla,
          variante.cantidad || 0,
          variante.ajuste_precio || 0
        );
      }
    }

    return { id: productoId };
  } finally {
    db.close();
  }
};

const actualizarProductoMarcaAliada = (id, producto, rutaImagen = null) => {
  const db = getDB();
  try {
    // Actualizar producto (SIN categoria y costo_base)
    if (rutaImagen) {
      db.prepare(`
        UPDATE productos_marca_aliada SET
          referencia = ?,
          nombre = ?,
          precio_venta_base = ?,
          imagen = ?,
          fecha_actualizacion = datetime('now', 'localtime')
        WHERE id = ?
      `).run(
        producto.referencia,
        producto.nombre,
        producto.precio_venta_base,
        rutaImagen,
        id
      );
    } else {
      db.prepare(`
        UPDATE productos_marca_aliada SET
          referencia = ?,
          nombre = ?,
          precio_venta_base = ?,
          fecha_actualizacion = datetime('now', 'localtime')
        WHERE id = ?
      `).run(
        producto.referencia,
        producto.nombre,
        producto.precio_venta_base,
        id
      );
    }

    // Eliminar variantes anteriores
    db.prepare('DELETE FROM variantes_marca_aliada WHERE producto_marca_id = ?').run(id);

    // Insertar nuevas variantes
    if (producto.variantes && producto.variantes.length > 0) {
      const stmtVariante = db.prepare(`
        INSERT INTO variantes_marca_aliada (
          producto_marca_id, talla, cantidad, ajuste_precio
        ) VALUES (?, ?, ?, ?)
      `);

      for (let variante of producto.variantes) {
        stmtVariante.run(
          id,
          variante.talla,
          variante.cantidad || 0,
          variante.ajuste_precio || 0
        );
      }
    }

    return { success: true };
  } finally {
    db.close();
  }
};

const eliminarProductoMarcaAliada = (id) => {
  const db = getDB();
  try {
    // Obtener ruta de imagen antes de eliminar
    const producto = db.prepare('SELECT imagen FROM productos_marca_aliada WHERE id = ?').get(id);

    // Eliminar producto (CASCADE eliminará variantes)
    db.prepare('DELETE FROM productos_marca_aliada WHERE id = ?').run(id);

    return { success: true, imagenPath: producto?.imagen };
  } finally {
    db.close();
  }
};

module.exports = {
  obtenerMarcasAliadas,
  agregarMarcaAliada,
  actualizarMarcaAliada,
  eliminarMarcaAliada,
  obtenerProductosMarcaAliada,
  agregarProductoMarcaAliada,
  actualizarProductoMarcaAliada,
  eliminarProductoMarcaAliada
};