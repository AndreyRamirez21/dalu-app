// src/components/sections/inventario/ImagenProducto.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import { Package } from 'lucide-react';

// ✅ Cache global para imágenes ya cargadas
const imageCache = new Map();

export const ImagenProducto = memo(({
  rutaImagen,
  rutaThumbnail,
  nombreProducto,
  onClickImagen,
  useThumbnail = true
}) => {
  const [imagenBase64, setImagenBase64] = useState(null);
  const [imagenCompletaBase64, setImagenCompletaBase64] = useState(null);
  const [deberiaCargar, setDeberiaCargar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // 🎯 LAZY LOADING - Solo carga cuando es visible
  useEffect(() => {
    if (!rutaImagen) {
      setCargando(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDeberiaCargar(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [rutaImagen]);

  // 🖼️ CARGA DE IMAGEN (con soporte para thumbnail)
  useEffect(() => {
    if (!deberiaCargar || !rutaImagen) return;

    let montado = true;

    const cargarImagenes = async () => {
      try {
        setCargando(true);

        // 1. Cargar thumbnail (si existe) para mostrar en lista
        const rutaThumbnailACargar = (useThumbnail && rutaThumbnail) ? rutaThumbnail : rutaImagen;
        const cacheThumbnail = rutaThumbnailACargar;

        let thumbnailCargado;
        if (imageCache.has(cacheThumbnail)) {
          thumbnailCargado = imageCache.get(cacheThumbnail);
        } else {
          thumbnailCargado = await cargarImagenDesdeElectron(rutaThumbnailACargar);
          if (thumbnailCargado) {
            imageCache.set(cacheThumbnail, thumbnailCargado);
          }
        }

        // 2. Cargar imagen COMPLETA (para el modal)
        const cacheCompleta = rutaImagen;
        let imagenCompleta;
        if (imageCache.has(cacheCompleta)) {
          imagenCompleta = imageCache.get(cacheCompleta);
        } else {
          imagenCompleta = await cargarImagenDesdeElectron(rutaImagen);
          if (imagenCompleta) {
            imageCache.set(cacheCompleta, imagenCompleta);
          }
        }

        if (montado) {
          setImagenBase64(thumbnailCargado); // Muestra el thumbnail
          setImagenCompletaBase64(imagenCompleta); // Guarda la completa para el modal
          setError(false);
          setCargando(false);
        }
      } catch (err) {
        console.error('Error al cargar imágenes:', err);
        if (montado) {
          setError(true);
          setCargando(false);
        }
      }
    };

    cargarImagenes();

    return () => {
      montado = false;
    };
  }, [deberiaCargar, rutaImagen, rutaThumbnail, useThumbnail]);

  // 🎨 RENDERIZADO
  if (cargando) {
    return (
      <div
        ref={imgRef}
        className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse"
      >
        <Package size={16} className="text-gray-400" />
      </div>
    );
  }

  if (!rutaImagen || error || !imagenBase64) {
    return (
      <div
        ref={imgRef}
        className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0"
      >
        <Package size={20} className="text-teal-600" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imagenBase64}
      alt={nombreProducto}
      className="w-10 h-10 rounded-lg object-cover border-2 border-teal-200 flex-shrink-0 cursor-pointer hover:border-teal-400 hover:shadow-md transition"
      onClick={() => onClickImagen && onClickImagen(imagenCompletaBase64)} // ✅ PASAR LA IMAGEN COMPLETA
      onError={() => setError(true)}
      title="Click para ampliar"
      loading="lazy"
    />
  );
});

ImagenProducto.displayName = 'ImagenProducto';

// ✅ Función para cargar imagen desde Electron
const cargarImagenDesdeElectron = async (rutaImagen) => {
  try {
    const ipc = window.ipcRenderer || window.require?.('electron')?.ipcRenderer;

    if (!ipc) {
      console.warn('IPC no disponible');
      return null;
    }

    const imagenBase64 = await ipc.invoke('cargar-imagen', rutaImagen);
    return imagenBase64;
  } catch (error) {
    console.error('Error al cargar imagen desde Electron:', error);
    return null;
  }
};

export const limpiarCacheImagenes = () => {
  imageCache.clear();
};