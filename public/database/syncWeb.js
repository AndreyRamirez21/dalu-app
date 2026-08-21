const { createClient } = require('@supabase/supabase-js');
const { Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔗 Conectando a:', SUPABASE_URL);

const MAPEO_CATEGORIAS = {
  'Essence': 'pijamas',
  'Deluxe': 'pijamas',
  'Pantuflas': 'pantuflas',
  'Antifaces': 'antifaces',
  'Scrunchies': 'accesorios',
  'Gorros en Satín': 'accesorios',
  'Lámparas': 'accesorios',
  'Cuelleros': 'accesorios',
  'Fundas': 'accesorios',
  'Rizadores': 'accesorios',
  'Varios': 'accesorios',
  'Humidificadores': 'accesorios',
};

function mapearCategoria(categoriaOriginal, coleccion) {
  if (coleccion) return 'pijamas';
  return MAPEO_CATEGORIAS[categoriaOriginal] || null;
}

// ==================== VERIFICAR INTERNET ====================
function verificarConexion() {
  return new Promise((resolve) => {
    const req = https.get(process.env.SUPABASE_URL,  { timeout: 5000 }, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function generarSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ==================== CONTROL DE ESTADO DE SINCRONIZACIÓN ====================
function getSyncStatePath(userDataPath) {
  return path.join(userDataPath, 'sync-web-state.json');
}

function obtenerEstadoSync(userDataPath) {
  const filePath = getSyncStatePath(userDataPath);
  if (!fs.existsSync(filePath)) {
    return { ultimaSync: '2000-01-01 00:00:00', imagenesSincronizadas: {} };
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      ultimaSync: data.ultimaSync || '2000-01-01 00:00:00',
      imagenesSincronizadas: data.imagenesSincronizadas || {},
    };
  } catch {
    return { ultimaSync: '2000-01-01 00:00:00', imagenesSincronizadas: {} };
  }
}

function guardarEstadoSync(userDataPath, fecha, imagenesSincronizadas) {
  const filePath = getSyncStatePath(userDataPath);
  fs.writeFileSync(filePath, JSON.stringify({ ultimaSync: fecha, imagenesSincronizadas }));
}

// ==================== NOTIFICACIÓN DE FALLO ====================
function notificarFalloSync(motivo) {
  const notification = new Notification({
    title: '⚠️ Sincronización web pendiente',
    body: motivo,
    urgency: 'normal',
  });
  notification.show();
}

function obtenerFechaLocalSQLite() {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000; // en milisegundos
  const local = new Date(ahora.getTime() - offset);
  return local.toISOString().slice(0, 19).replace('T', ' ');
}

// ==================== SUBIDA DE IMÁGENES ====================
async function subirImagenProducto(referencia, indice, rutaImagenLocal) {
  if (!rutaImagenLocal || !fs.existsSync(rutaImagenLocal)) {
    return null;
  }

  try {
    const buffer = fs.readFileSync(rutaImagenLocal);
    const nombreArchivo = `${referencia}/${indice + 1}.jpg`;

    const { error: errorUpload } = await supabase.storage
      .from('productos-imagenes')
      .upload(nombreArchivo, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (errorUpload) {
      console.error(`⚠️ Error al subir imagen de ${referencia}:`, errorUpload.message);
      return null;
    }

    const { data } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  } catch (error) {
    console.error(`⚠️ Error inesperado al subir imagen de ${referencia}:`, error.message);
    return null;
  }
}

// ==================== SINCRONIZACIÓN PRINCIPAL ====================
async function sincronizarCatalogoWeb(db, userDataPath) {
  const online = await verificarConexion();

  if (!online) {
    console.log('⚠️ Sin internet, sincronización pospuesta');
    notificarFalloSync('Sin conexión a internet. Los cambios se subirán cuando vuelva la señal.');
    return { success: false, motivo: 'sin_internet' };
  }

  const { ultimaSync, imagenesSincronizadas } = obtenerEstadoSync(userDataPath);
  const fechaInicioEjecucion = obtenerFechaLocalSQLite();

  return new Promise((resolve) => {
    // ✅ Sin filtro de "activo" aquí — necesitamos detectar también
    // los productos que se acaban de desactivar (soft delete)
    db.db.all(
      `SELECT * FROM productos WHERE fecha_actualizado > ?`,
      [ultimaSync],
      async (err, productos) => {
        if (err) {
          console.error('❌ Error al leer productos para sync:', err);
          notificarFalloSync('Error al leer productos locales. Revisa la consola.');
          resolve({ success: false, motivo: 'error_lectura' });
          return;
        }

        console.log(`🔄 Sincronizando ${productos.length} producto(s) modificado(s)...`);

        let migrados = 0;
        let errores = 0;
        let imagenesSubidas = 0;
        const nuevasImagenesSincronizadas = { ...imagenesSincronizadas };

        for (const p of productos) {
          const slugCategoria = mapearCategoria(p.categoria, p.coleccion);
          if (!slugCategoria) {
            console.warn(`⚠️ Categoría no mapeada, se omite: ${p.categoria}`);
            continue;
          }

          try {
            const datosUpsert = {
              referencia: p.referencia,
              nombre: p.nombre,
              slug: generarSlug(p.referencia),
              categoria: slugCategoria,
              coleccion: p.coleccion || (
                slugCategoria === 'accesorios' || ['Essence', 'Deluxe'].includes(p.categoria)
                  ? p.categoria.toLowerCase()
                  : null
              ),
              coleccion_visible: p.coleccion_oculta !== 1,
              descripcion: p.descripcion || null,
              precio_venta_base: p.precio_venta_base,
              activo: p.activo === 1 && p.publicado_web === 1,
              actualizado_en: new Date().toISOString(),
            };

            let imagenesLocales = [];
            try {
              imagenesLocales = JSON.parse(p.imagenes || '[]');
            } catch {
              imagenesLocales = [];
            }
            if (!Array.isArray(imagenesLocales) || imagenesLocales.length === 0) {
              imagenesLocales = p.imagen ? [p.imagen] : [];
            }
            imagenesLocales = imagenesLocales.filter(Boolean).slice(0, 4);
            const firmaImagenes = JSON.stringify(imagenesLocales);
            if (imagenesSincronizadas[p.referencia] !== firmaImagenes) {
              const urls = (await Promise.all(imagenesLocales.map((ruta, indice) => subirImagenProducto(p.referencia, indice, ruta)))).filter(Boolean);
              datosUpsert.imagen_url = urls[0] || null;
              datosUpsert.imagenes_urls = urls;
              nuevasImagenesSincronizadas[p.referencia] = firmaImagenes;
              imagenesSubidas += urls.length;
            }

            const { data: productoWeb, error: errProducto } = await supabase
              .from('productos_web')
              .upsert(datosUpsert, { onConflict: 'referencia' })
              .select('id')
              .single();

            if (errProducto) throw errProducto;

            // Sincronizar variantes de este producto
            const variantes = await new Promise((res, rej) => {
              db.db.all(
                `SELECT * FROM variantes_producto WHERE producto_id = ?`,
                [p.id],
                (errV, rows) => (errV ? rej(errV) : res(rows))
              );
            });

            for (const v of variantes) {
              await supabase.from('variantes_web').upsert(
                {
                  producto_id: productoWeb.id,
                  talla: v.talla,
                  stock: v.cantidad,
                  ajuste_precio: v.ajuste_precio,
                  actualizado_en: new Date().toISOString(),
                },
                { onConflict: 'producto_id,talla' }
              );
            }

            migrados++;
          } catch (error) {
            console.error(`❌ Error al sincronizar "${p.referencia}":`, error.message);
            errores++;
          }
        }

        guardarEstadoSync(userDataPath, fechaInicioEjecucion, nuevasImagenesSincronizadas);

        console.log(`✅ Sincronización completa: ${migrados} actualizados, ${imagenesSubidas} imagen(es) subida(s), ${errores} errores`);

        if (errores > 0) {
          notificarFalloSync(`Sincronización parcial: ${errores} producto(s) con error. Revisa la consola.`);
        }

        resolve({ success: true, migrados, errores, imagenesSubidas });
      }
    );
  });
}

module.exports = { sincronizarCatalogoWeb };
