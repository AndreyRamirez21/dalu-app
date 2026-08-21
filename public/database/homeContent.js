const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// El mismo bucket público que ya usa el catálogo. Las piezas de la portada se
// guardan en una carpeta propia para no mezclarlas con fotos de productos.
const SUPABASE_URL = 'https://gfxnsufzqselsikkzmbo.supabase.co';
const BUCKET = 'productos-imagenes';
const CONFIG_PATH = 'pagina-inicio/config.json';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const defaultContent = {
  hero: { title: 'Comodidad que te acompaña', subtitle: 'Pijamas, pantuflas y accesorios para tus mejores momentos.', primaryLink: '/pijamas', slides: [] },
  categories: [],
  collection: { mediaUrl: '', mediaType: 'image', eyebrow: 'Colección del mes', title: 'Comodidad para quedarte un rato más', description: 'Descubre una selección especial de pijamas para tus momentos más tranquilos.', link: '/pijamas' },
  video: { mediaUrl: '', posterUrl: '', title: 'Momentos que se sienten como en casa', description: 'Descubre cómo se mueve Dalú en cada detalle.', link: '/pijamas' },
  featuredReferences: [],
};

function getPublicUrl(objectPath) {
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function obtenerContenidoInicio() {
  const { data, error } = await supabase.storage.from(BUCKET).download(CONFIG_PATH);
  if (error) {
    // La primera vez aún no hay archivo; la interfaz parte de una portada vacía.
    if (error.message?.toLowerCase().includes('not found') || error.statusCode === '404') return defaultContent;
    throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  }
  try {
    return { ...defaultContent, ...JSON.parse(await data.text()) };
  } catch {
    throw new Error('La configuración publicada de la página web no es válida.');
  }
}

function validarArchivo(filePath, type) {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('El archivo seleccionado ya no está disponible.');
  const extension = path.extname(filePath).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const videoExtensions = ['.mp4', '.webm'];
  if (type === 'video' ? !videoExtensions.includes(extension) : !imageExtensions.includes(extension)) {
    throw new Error(type === 'video' ? 'El video debe ser MP4 o WEBM.' : 'La imagen debe ser JPG, PNG o WEBP.');
  }
  const maxBytes = type === 'video' ? 60 * 1024 * 1024 : 10 * 1024 * 1024;
  if (fs.statSync(filePath).size > maxBytes) throw new Error(`El archivo supera el límite de ${type === 'video' ? '60 MB' : '10 MB'}.`);
  return extension;
}

async function subirArchivoInicio(filePath, type, slot) {
  const extension = validarArchivo(filePath, type);
  const objectPath = `pagina-inicio/${slot}-${Date.now()}${extension}`;
  const contentType = type === 'video'
    ? (extension === '.webm' ? 'video/webm' : 'video/mp4')
    : `image/${extension === '.jpg' ? 'jpeg' : extension.slice(1)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, fs.readFileSync(filePath), { contentType, upsert: false });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
  return getPublicUrl(objectPath);
}

async function guardarContenidoInicio(content) {
  const payload = JSON.stringify({ ...content, updatedAt: new Date().toISOString() }, null, 2);
  const { error } = await supabase.storage.from(BUCKET).upload(CONFIG_PATH, Buffer.from(payload), {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  });
  if (error) throw new Error(`No se pudo publicar la configuración: ${error.message}`);

  // La web actual ya usa esta columna para renderizar destacados. Al mantenerla
  // sincronizada, la selección hecha en Electron funciona incluso antes de que
  // la web adopte el archivo de configuración para respetar el orden exacto.
  const { error: clearFeaturedError } = await supabase
    .from('productos_web')
    .update({ featured: false })
    .eq('featured', true);
  if (clearFeaturedError) throw new Error(`La configuración se guardó, pero no se pudieron actualizar los destacados: ${clearFeaturedError.message}`);

  const references = Array.isArray(content.featuredReferences) ? content.featuredReferences : [];
  if (references.length > 0) {
    const { error: setFeaturedError } = await supabase
      .from('productos_web')
      .update({ featured: true })
      .in('referencia', references);
    if (setFeaturedError) throw new Error(`La configuración se guardó, pero no se pudieron marcar los destacados: ${setFeaturedError.message}`);
  }
  return { success: true, publicUrl: getPublicUrl(CONFIG_PATH) };
}

module.exports = { defaultContent, obtenerContenidoInicio, subirArchivoInicio, guardarContenidoInicio };
