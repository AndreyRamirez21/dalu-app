// src/api/useProductosMarca.js
import { useState } from 'react';

const getIPC = () => {
  try {
    if (typeof window !== 'undefined' && window.require) {
      const electron = window.require('electron');
      return electron.ipcRenderer;
    }
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      return window.ipcRenderer;
    }
    return null;
  } catch (error) {
    console.error('Error al acceder a IPC:', error);
    return null;
  }
};

export const useProductosMarca = (marcaId, onActualizar) => {
  const [vistaProducto, setVistaProducto] = useState('lista'); // lista, agregar, editar
  const [productoEditar, setProductoEditar] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const tallasDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

  const formularioInicial = {
    marca_aliada_id: marcaId,
    referencia: '',
    nombre: '',
    precio_venta_base: '',
    variantes: [],
    imagen: null,
    imagenPreview: null
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotificacion({ mensaje: 'Por favor selecciona una imagen válida', tipo: 'advertencia' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotificacion({ mensaje: 'La imagen no debe pesar más de 5MB', tipo: 'advertencia' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormulario(prev => ({
        ...prev,
        imagen: file,
        imagenPreview: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const eliminarImagen = () => {
    setFormulario(prev => ({ ...prev, imagen: null, imagenPreview: null }));
    const inputFile = document.querySelector('input[type="file"][accept="image/*"]');
    if (inputFile) inputFile.value = '';
  };

  const agregarVariante = () => {
    setFormulario(prev => ({
      ...prev,
      variantes: [...prev.variantes, { talla: 'S', cantidad: 0, ajuste_precio: 0, tallaManual: false }]
    }));
  };

  const actualizarVariante = (index, campo, valor) => {
    setFormulario(prev => {
      const nuevasVariantes = [...prev.variantes];
      if (campo === 'talla' && valor === '__MANUAL__') {
        nuevasVariantes[index] = { ...nuevasVariantes[index], talla: '', tallaManual: true };
      } else if (campo === 'tallaManual') {
        nuevasVariantes[index] = { ...nuevasVariantes[index], tallaManual: valor, talla: valor ? nuevasVariantes[index].talla : 'S' };
      } else {
        nuevasVariantes[index] = { ...nuevasVariantes[index], [campo]: valor };
      }
      return { ...prev, variantes: nuevasVariantes };
    });
  };

  const eliminarVariante = (index) => {
    setFormulario(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index)
    }));
  };

  const resetFormulario = () => {
    setFormulario({ ...formularioInicial, marca_aliada_id: marcaId });
    setProductoEditar(null);
  };

  const handleGuardarProducto = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    // Validaciones actualizadas (sin costo_base ni categoria)
    if (!formulario.referencia || !formulario.nombre || !formulario.precio_venta_base) {
      setNotificacion({ mensaje: 'Por favor completa todos los campos obligatorios', tipo: 'advertencia' });
      return;
    }

    if (formulario.variantes.length === 0) {
      setNotificacion({ mensaje: 'Debes agregar al menos una talla/variante', tipo: 'advertencia' });
      return;
    }

    const tallas = formulario.variantes.map(v => v.talla);
    const tallasDuplicadas = tallas.filter((t, i) => tallas.indexOf(t) !== i);
    if (tallasDuplicadas.length > 0) {
      setNotificacion({ mensaje: 'No puedes tener tallas duplicadas', tipo: 'advertencia' });
      return;
    }

    const nuevoProducto = {
      marca_aliada_id: marcaId,
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      })),
      imagen: formulario.imagen ? {
        name: formulario.imagen.name,
        data: formulario.imagenPreview
      } : null
    };

    try {
      await ipc.invoke('agregar-producto-marca-aliada', nuevoProducto);
      resetFormulario();
      setVistaProducto('lista');
      if (onActualizar) onActualizar();
      setTimeout(() => {
        setNotificacion({ mensaje: 'Producto agregado exitosamente', tipo: 'exito' });
      }, 300);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setNotificacion({ mensaje: 'Error al guardar el producto: ' + err.message, tipo: 'error' });
    }
  };

  const handleEditarProducto = async (producto) => {
    const ipc = getIPC();
    setProductoEditar(producto);

    let imagenPreview = null;
    if (producto.imagen && ipc) {
      try {
        imagenPreview = await ipc.invoke('cargar-imagen', producto.imagen);
      } catch (error) {
        console.error('Error al cargar imagen:', error);
      }
    }

    setFormulario({
      marca_aliada_id: marcaId,
      referencia: producto.referencia,
      nombre: producto.nombre,
      precio_venta_base: producto.precio_venta_base.toString(),
      variantes: producto.variantes.map(v => ({
        talla: v.talla,
        cantidad: v.cantidad,
        ajuste_precio: v.ajuste_precio || 0,
        tallaManual: false
      })),
      imagen: null,
      imagenPreview: imagenPreview
    });

    setVistaProducto('editar');
  };

  const handleActualizarProducto = async () => {
    const ipc = getIPC();
    if (!ipc) {
      setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
      return;
    }

    // Validaciones actualizadas (sin costo_base ni categoria)
    if (!formulario.referencia || !formulario.nombre || !formulario.precio_venta_base) {
      setNotificacion({ mensaje: 'Por favor completa todos los campos obligatorios', tipo: 'advertencia' });
      return;
    }

    if (formulario.variantes.length === 0) {
      setNotificacion({ mensaje: 'Debes agregar al menos una talla/variante', tipo: 'advertencia' });
      return;
    }

    const datosActualizados = {
      marca_aliada_id: marcaId,
      referencia: formulario.referencia.trim(),
      nombre: formulario.nombre.trim(),
      precio_venta_base: parseFloat(formulario.precio_venta_base),
      variantes: formulario.variantes.map(v => ({
        talla: v.talla,
        cantidad: parseInt(v.cantidad),
        ajuste_precio: parseFloat(v.ajuste_precio) || 0
      })),
      imagen: formulario.imagen ? {
        name: formulario.imagen.name,
        data: formulario.imagenPreview
      } : null
    };

    try {
      await ipc.invoke('actualizar-producto-marca-aliada', productoEditar.id, datosActualizados);
      resetFormulario();
      setNotificacion({ mensaje: 'Producto actualizado exitosamente', tipo: 'exito' });
      setVistaProducto('lista');
      if (onActualizar) onActualizar();
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      setNotificacion({ mensaje: 'Error al actualizar el producto: ' + err.message, tipo: 'error' });
    }
  };

  const handleEliminarProducto = async (id, onConfirmar) => {
    if (onConfirmar) {
      onConfirmar(async () => {
        const ipc = getIPC();
        if (!ipc) {
          setNotificacion({ mensaje: 'Error: Electron IPC no disponible', tipo: 'error' });
          return;
        }

        try {
          await ipc.invoke('eliminar-producto-marca-aliada', id);
          if (onActualizar) onActualizar();
          setNotificacion({ mensaje: 'Producto eliminado exitosamente', tipo: 'exito' });
        } catch (err) {
          console.error('Error al eliminar producto:', err);
          setNotificacion({ mensaje: 'Error al eliminar el producto: ' + err.message, tipo: 'error' });
        }
      });
    }
  };

  const handleCancelar = () => {
    setVistaProducto('lista');
    resetFormulario();
  };

  return {
    vistaProducto,
    setVistaProducto,
    productoEditar,
    notificacion,
    setNotificacion,
    formulario,
    tallasDisponibles,
    handleInputChange,
    handleImagenChange,
    eliminarImagen,
    agregarVariante,
    actualizarVariante,
    eliminarVariante,
    resetFormulario,
    handleGuardarProducto,
    handleEditarProducto,
    handleActualizarProducto,
    handleEliminarProducto,
    handleCancelar
  };
};