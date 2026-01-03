// src/utils/imagenUtils.js

/**
 * 🖼️ Crea un thumbnail optimizado de una imagen
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo del thumbnail
 * @param {number} maxHeight - Alto máximo del thumbnail
 * @param {number} quality - Calidad JPEG (0-1)
 * @returns {Promise<string>} - Base64 del thumbnail
 */
export const crearThumbnail = (file, maxWidth = 50, maxHeight = 50, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcular dimensiones manteniendo aspecto
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 con compresión
        const thumbnail = canvas.toDataURL('image/jpeg', quality);
        resolve(thumbnail);
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * 🖼️ Crea versión completa optimizada de una imagen
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @param {number} quality - Calidad JPEG (0-1)
 * @returns {Promise<string>} - Base64 de la imagen completa
 */
export const crearImagenCompleta = (file, maxWidth = 800, maxHeight = 800, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        // Solo redimensionar si es muy grande
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imagenCompleta = canvas.toDataURL('image/jpeg', quality);
        resolve(imagenCompleta);
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * 📏 Calcula el tamaño de una imagen base64 en KB
 * @param {string} base64String - String base64 de la imagen
 * @returns {number} - Tamaño en KB
 */
export const calcularTamanoImagen = (base64String) => {
  if (!base64String) return 0;

  // Remover el prefijo data:image/...;base64,
  const base64 = base64String.split(',')[1] || base64String;

  // Calcular tamaño en bytes
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = (base64.length * 3 / 4) - padding;

  // Convertir a KB
  return (bytes / 1024).toFixed(2);
};

/**
 * ✅ Valida que un archivo sea una imagen válida
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {Object} - { valido: boolean, error: string }
 */
export const validarImagen = (file, maxSizeMB = 5) => {
  if (!file) {
    return { valido: false, error: 'No se seleccionó ningún archivo' };
  }

  // Validar tipo
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.type)) {
    return {
      valido: false,
      error: 'Formato no válido. Solo se permiten JPG, PNG o WEBP'
    };
  }

  // Validar tamaño
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valido: false,
      error: `La imagen es muy grande (${sizeMB.toFixed(2)}MB). Máximo ${maxSizeMB}MB`
    };
  }

  return { valido: true, error: null };
};

/**
 * 🔄 Procesa una imagen completa: crea thumbnail + versión completa
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} - { thumbnail, imagenCompleta, tamanoThumbnail, tamanoCompleta }
 */
export const procesarImagen = async (file) => {
  try {
    // Validar imagen
    const validacion = validarImagen(file);
    if (!validacion.valido) {
      throw new Error(validacion.error);
    }

    // Crear ambas versiones en paralelo
    const [thumbnail, imagenCompleta] = await Promise.all([
      crearThumbnail(file, 50, 50, 0.7),
      crearImagenCompleta(file, 800, 800, 0.85)
    ]);

    return {
      thumbnail,
      imagenCompleta,
      tamanoThumbnail: calcularTamanoImagen(thumbnail),
      tamanoCompleta: calcularTamanoImagen(imagenCompleta)
    };
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    throw error;
  }
};