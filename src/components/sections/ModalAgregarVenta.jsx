import React, { useState, useEffect, useRef, memo } from 'react';
import { X, Plus, Trash2, ShoppingCart, DollarSign, Package, CreditCard, Minus,Gift, Award, Sparkles, User, Store, Phone, Mail, CreditCard as IdCard, Search, ChevronDown } from 'lucide-react';
import { useVentas } from '../../api/useVentas';
import { ModalMensaje } from '../common/ModalMensaje';
import {useFidelidadVenta} from '../../api/useFidelidadVenta';


const { ipcRenderer } = window.require('electron');


  const METODOS_PAGO = {
    'Efectivo': [],
    'Tarjeta': ['Tarjeta Crédito', 'Tarjeta Débito'],
    'Transferencia': ['Davivienda', 'Daviplata', 'Nequi'],
    'Mixto': []
  };



// ✅ Modal para ver imagen ampliada
const ModalImagen = ({ imagenBase64, nombreProducto, onCerrar }) => {
  if (!imagenBase64) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition z-10"
        >
          <X size={24} className="text-gray-700" />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{nombreProducto}</h3>
          <img
            src={imagenBase64}
            alt={nombreProducto}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

// ✅ Componente de imagen clickeable
const ImagenProducto = memo(({ rutaImagen, nombreProducto, onClickImagen }) => {
  const [imagenBase64, setImagenBase64] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;

    const cargarImagen = async () => {
      if (!rutaImagen) {
        if (montado) setCargando(false);
        return;
      }

      try {
        setCargando(true);
        const ipc = window.require ? window.require('electron').ipcRenderer : null;
        if (!ipc) throw new Error('IPC no disponible');
        const base64Data = await ipc.invoke('cargar-imagen', rutaImagen);
        if (montado) {
          if (base64Data) {
            setImagenBase64(base64Data);
            setError(false);
          } else {
            setError(true);
          }
          setCargando(false);
        }
      } catch (err) {
        console.error('Error al cargar imagen:', err);
        if (montado) {
          setError(true);
          setCargando(false);
        }
      }
    };

    cargarImagen();

    return () => {
      montado = false;
    };
  }, [rutaImagen]);

if (cargando) {
    return (
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-500">Cargando...</span>
      </div>
    );
  }

  if (error || !imagenBase64) {
    return (
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
        <Package size={24} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imagenBase64}
      alt={nombreProducto}
      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition"
      onClick={() => onClickImagen && onClickImagen(imagenBase64)}
    />
  );
});


const ComboBoxField = ({ label, value, onChange, options, placeholder, disabled }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const dropdownRef = useRef(null);


useEffect(() => {
  if (value === '') {
    setSearchTerm('');
  } else {
    setSearchTerm(value);
  }
}, [value]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    setSearchTerm(option);
    onChange(option);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    // Si el valor coincide exactamente con una opción, seleccionarla
    const exactMatch = options.find(opt => opt.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      onChange(exactMatch);
    } else {
      onChange('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled}
          className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          disabled={disabled}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {showDropdown && filteredOptions.length > 0 && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2 hover:bg-teal-50 border-b last:border-b-0"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ModalAgregarVenta = ({ onClose, onSuccess }) => {
  const { generarNumeroVenta, crearVenta, loading } = useVentas();

  // ✅ HOOK DE FIDELIDAD (MANTENER ESTO)
  const {
    descuentoAplicable,
    mostrarAlertaTarjeta,
    tarjetaPresentada,
    verificarFidelidadCliente,
    registrarPresentacionTarjeta,
    calcularMontoDescuento, // ⬅️ AGREGAR ESTA LÍNEA
    aplicarDescuentoFidelidad,
    procesarFidelidadPostVenta,
    resetearFidelidad,
    requiereEntregarTarjeta,
    descuentoActivo,      // ← AGREGAR
    toggleDescuento,
    clienteActual  // ⬅️ AGREGAR ESTA LÍNEA

  } = useFidelidadVenta();

  const [paso, setPaso] = useState(1);
  const [numeroVenta, setNumeroVenta] = useState('');
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [nombreProductoAmpliado, setNombreProductoAmpliado] = useState('');

  // Productos
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [nombresDisponibles, setNombresDisponibles] = useState([]);
  const [nombreSeleccionado, setNombreSeleccionado] = useState('');
  const [referenciasDisponibles, setReferenciasDisponibles] = useState([]);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState('');
  const [productoActual, setProductoActual] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [costosAdicionales, setCostosAdicionales] = useState([]);
  const [costoAdicional, setCostoAdicional] = useState('');
  const [busquedaProductoMarca, setBusquedaProductoMarca] = useState('');
  // Cliente
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [datosCliente, setDatosCliente] = useState({
    id: null,
    nombre: '',
    cedula: '',
    correo: '',
    celular: ''
  });


  // Pago
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [subMetodoPago, setSubMetodoPago] = useState(''); // Para Tarjeta Crédito/Débito o Davivienda/Daviplata/Nequi
  const [montoPagado, setMontoPagado] = useState('');
  const [notas, setNotas] = useState('');
  const [descuentoManual, setDescuentoManual] = useState({ tipo: null, valor: 0 });
  const [mostrarDescuento, setMostrarDescuento] = useState(false);
  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'];

  // Marcas aliadas

  const [mostrarMarcasAliadas, setMostrarMarcasAliadas] = useState(false);
  const [marcasAliadas, setMarcasAliadas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [productosMarcaDisponibles, setProductosMarcaDisponibles] = useState([]);
  const [productosMarcaSeleccionados, setProductosMarcaSeleccionados] = useState([]);

// Agregar este useEffect para cargar marcas aliadas
useEffect(() => {
  cargarMarcasAliadas();
}, []);

const cargarMarcasAliadas = async () => {
  try {
    const marcas = await ipcRenderer.invoke('obtener-marcas-aliadas');
    setMarcasAliadas(marcas.filter(m => m.activo === 1)); // Solo marcas activas
  } catch (error) {
    console.error('Error al cargar marcas aliadas:', error);
  }
};


const handleSeleccionarMarca = async (marca) => {
  setMarcaSeleccionada(marca);
    setBusquedaProductoMarca(''); // ← agregar esta línea

  try {
    const productos = await ipcRenderer.invoke('obtener-productos-marca-aliada', marca.id);
    setProductosMarcaDisponibles(productos);
  } catch (error) {
    console.error('Error al cargar productos de marca:', error);
    setMensajeModal('Error al cargar productos de la marca');
    setTipoMensaje('error');
    setMostrarMensaje(true);
  }
};

const agregarProductoMarca = (producto, variante) => {
  if (variante && variante.cantidad <= 0) {
    setMensajeModal(`Sin stock disponible para ${producto.nombre} - Talla ${variante.talla}`);
    setTipoMensaje('error');
    setMostrarMensaje(true);
    return;
  }

  const productoExistente = productosMarcaSeleccionados.find(
    p => p.producto_marca_id === producto.id && p.variante_id === variante?.id
  );

  if (productoExistente) {
    const nuevaCantidad = productoExistente.cantidad + 1;
    if (nuevaCantidad > productoExistente.stock_disponible) {
      setMensajeModal(`Stock insuficiente. Disponible: ${productoExistente.stock_disponible}`);
      setTipoMensaje('error');
      setMostrarMensaje(true);
      return;
    }

    setProductosMarcaSeleccionados(productosMarcaSeleccionados.map(p =>
      p.producto_marca_id === producto.id && p.variante_id === variante?.id
        ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_unitario }
        : p
    ));
  } else {
    const precioUnitario = variante
      ? parseFloat(producto.precio_venta_base) + parseFloat(variante.ajuste_precio || 0)
      : parseFloat(producto.precio_venta_base);

    const nuevoProducto = {
      producto_marca_id: producto.id,
      variante_id: variante?.id || null,
      marca_aliada_id: marcaSeleccionada.id,
      marca_nombre: marcaSeleccionada.nombre,
      nombre: producto.nombre,
      referencia: producto.referencia || 'N/A',
      talla: variante?.talla || null,
      cantidad: 1,
      precio_unitario: precioUnitario,
      subtotal: precioUnitario,
      stock_disponible: variante?.cantidad || 0,
      porcentaje_comision: marcaSeleccionada.porcentaje_comision
    };

    setProductosMarcaSeleccionados([...productosMarcaSeleccionados, nuevoProducto]);
  }
};

const actualizarCantidadMarca = (index, nuevaCantidad) => {
  if (nuevaCantidad < 1) return;

  const producto = productosMarcaSeleccionados[index];

  if (nuevaCantidad > producto.stock_disponible) {
    setMensajeModal(`Stock insuficiente. Disponible: ${producto.stock_disponible}`);
    setTipoMensaje('error');
    setMostrarMensaje(true);
    return;
  }

  setProductosMarcaSeleccionados(productosMarcaSeleccionados.map((p, i) =>
    i === index
      ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_unitario }
      : p
  ));
};

const eliminarProductoMarca = (index) => {
  setProductosMarcaSeleccionados(productosMarcaSeleccionados.filter((_, i) => i !== index));
};

const calcularTotalMarcas = () => {
  return productosMarcaSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
};


  useEffect(() => {
    cargarNumeroVenta();
    cargarCategorias();
  }, []);

  const cargarNumeroVenta = async () => {
    const numero = await generarNumeroVenta();
    setNumeroVenta(numero);
  };

  const cargarCategorias = async () => {
    try {
      const productos = await ipcRenderer.invoke('obtener-productos');
      const categoriasUnicas = [...new Set(productos.map(p => p.categoria))].filter(Boolean);
      setCategorias(categoriasUnicas);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleCategoriaChange = async (categoria) => {
    setCategoriaSeleccionada(categoria);
    setNombreSeleccionado('');
    setReferenciaSeleccionada('');
    setReferenciasDisponibles([]);
    setProductoActual(null);

    if (!categoria) return;

    try {
      const productos = await ipcRenderer.invoke('obtener-productos');
      const productosFiltrados = productos.filter(p => p.categoria === categoria);
      const nombresUnicos = [...new Set(productosFiltrados.map(p => p.nombre))];
      setNombresDisponibles(nombresUnicos);
    } catch (error) {
      console.error('Error al cargar nombres:', error);
    }
  };

  const handleNombreChange = async (nombre) => {
    setNombreSeleccionado(nombre);
    setReferenciaSeleccionada('');
    setProductoActual(null);

    if (!nombre) {
      setReferenciasDisponibles([]);
      return;
    }

    try {
      const productos = await ipcRenderer.invoke('obtener-productos');
      const productosConNombre = productos.filter(
        p => p.categoria === categoriaSeleccionada && p.nombre === nombre
      );
      setReferenciasDisponibles(productosConNombre);
    } catch (error) {
      console.error('Error al cargar referencias:', error);
    }
  };

  const handleReferenciaChange = (referencia) => {
    setReferenciaSeleccionada(referencia);

    if (!referencia) {
      setProductoActual(null);
      return;
    }

    const producto = referenciasDisponibles.find(p => p.referencia === referencia);
    if (producto) {
      setProductoActual(producto);
    }
  };

  const agregarProducto = (producto, variante) => {
    if (variante && variante.cantidad <= 0) {
      setMensajeModal(`Sin stock disponible para ${producto.nombre} - Talla ${variante.talla}`);
      setTipoMensaje('error');
      setMostrarMensaje(true);
      return;
    }

    const productoExistente = productosSeleccionados.find(
      p => p.producto_id === producto.id && p.variante_id === variante?.id
    );

    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + 1;
      if (nuevaCantidad > productoExistente.stock_disponible) {
        setMensajeModal(`Stock insuficiente. Disponible: ${productoExistente.stock_disponible}`);
        setTipoMensaje('error');
        setMostrarMensaje(true);
        return;
      }

      setProductosSeleccionados(productosSeleccionados.map(p =>
        p.producto_id === producto.id && p.variante_id === variante?.id
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_unitario }
          : p
      ));
    } else {
      const precioUnitario = variante
        ? parseFloat(producto.precio_venta_base) + parseFloat(variante.ajuste_precio || 0)
        : parseFloat(producto.precio_venta_base);

      const nuevoProducto = {
        producto_id: producto.id,
        variante_id: variante?.id || null,
        nombre: producto.nombre,
        referencia: producto.referencia || 'N/A',
        talla: variante?.talla || null,
        cantidad: 1,
        precio_unitario: precioUnitario,
        subtotal: precioUnitario,
        stock_disponible: variante?.cantidad || 0
      };

      setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    }

    setCategoriaSeleccionada('');
    setNombreSeleccionado('');
    setReferenciaSeleccionada('');
    setNombresDisponibles([]);
    setReferenciasDisponibles([]);
    setProductoActual(null);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    const producto = productosSeleccionados[index];

    if (nuevaCantidad > producto.stock_disponible) {
      setMensajeModal(`Stock insuficiente. Disponible: ${producto.stock_disponible}`);
      setTipoMensaje('error');
      setMostrarMensaje(true);
      return;
    }

    setProductosSeleccionados(productosSeleccionados.map((p, i) =>
      i === index
        ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_unitario }
        : p
    ));
  };

  const eliminarProducto = (index) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index));
  };

  const agregarCostoAdicional = () => {
    const monto = parseFloat(costoAdicional);

    if (!costoAdicional || monto <= 0 || isNaN(monto)) {
      setMensajeModal("Ingresa un monto válido para los costos adicionales");
      setTipoMensaje('error');
      setMostrarMensaje(true);
      return;
    }

    const costoParaAgregar = {
      concepto: 'Costos Adicionales',
      monto: monto
    };

    setCostosAdicionales([...costosAdicionales, costoParaAgregar]);

    setMensajeModal("Costo adicional agregado exitosamente");
    setTipoMensaje('exito');
    setMostrarMensaje(true);

    setCostoAdicional('');
  };

  const eliminarCostoAdicional = (index) => {
    setCostosAdicionales(costosAdicionales.filter((_, i) => i !== index));
  };

  const buscarClientesBD = async (termino) => {
    if (!termino || termino.length < 2) {
      setClientesEncontrados([]);
      return;
    }

    try {
      const clientes = await ipcRenderer.invoke('buscar-clientes', termino);
      setClientesEncontrados(clientes || []);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  // ✅ USAR LA FUNCIÓN DEL HOOK
  const seleccionarCliente = async (cliente) => {
    setDatosCliente({
      id: cliente.id,
      nombre: cliente.nombre,
      cedula: cliente.cedula || '',
      correo: cliente.correo || '',
      celular: cliente.celular || ''
    });
    setBuscarCliente('');
    setClientesEncontrados([]);

    // ✅ Usar función del hook
    await verificarFidelidadCliente(cliente.id);
  };

  // ❌ ELIMINAR ESTA FUNCIÓN COMPLETA - YA ESTÁ EN EL HOOK
  // const verificarFidelidadCliente = async (clienteId) => { ... }

  const limpiarCliente = () => {
    setDatosCliente({
      id: null,
      nombre: '',
      cedula: '',
      correo: '',
      celular: ''
    });
  setDescuentoManual({ tipo: null, valor: 0 });
    setMostrarDescuento(false);

    // ✅ Usar función del hook
    resetearFidelidad();
  };

  const calcularSubtotal = () => {
    return productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const calcularCostosTotal = () => {
    return costosAdicionales.reduce((sum, c) => sum + c.monto, 0);
  };

const calcularTotal = () => {
  const subtotal = calcularSubtotal();
  const costos = calcularCostosTotal();
  const totalMarcas = calcularTotalMarcas();

  // Descuento fidelidad sobre subtotal propio
  const subtotalConFidelidad = descuentoActivo ? aplicarDescuentoFidelidad(subtotal) : subtotal;

  // Descuento manual también solo sobre subtotal propio
  const descManual = calcularDescuentoManualMonto();
  const subtotalFinal = Math.max(0, subtotalConFidelidad - descManual);

  return subtotalFinal + costos + totalMarcas;
};

const calcularDescuentoManualMonto = () => {
  const subtotal = calcularSubtotal(); // solo productos propios

  if (descuentoManual.tipo === 'porcentaje') return subtotal * descuentoManual.valor / 100;
  if (descuentoManual.tipo === 'fijo') return Math.min(descuentoManual.valor, subtotal);
  return 0;
};

  const calcularCambio = () => {
    const total = calcularTotal();
    const pagado = parseFloat(montoPagado) || 0;
    return Math.max(0, pagado - total);
  };


  const handleMetodoPagoChange = (metodo) => {
    setMetodoPago(metodo);
    setSubMetodoPago(''); // Resetear sub-método al cambiar método principal
  };

  const handleSubmit = async () => {
  if (productosSeleccionados.length === 0 && productosMarcaSeleccionados.length === 0) {
      setMensajeModal("Agrega al menos un producto");
      setTipoMensaje('error');
      setMostrarMensaje(true);
      return;
    }

    const total = calcularTotal();
    const pagado = parseFloat(montoPagado) || 0;




    if (pagado > total && metodoPago !== 'Efectivo') {
      setMensajeModal("El cambio solo aplica para pagos en efectivo");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    if ((metodoPago === 'Tarjeta' || metodoPago === 'Transferencia') && !subMetodoPago) {
      setMensajeModal(`Por favor selecciona el tipo de ${metodoPago.toLowerCase()}`);
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    // ✅ Validar presentación de tarjeta si hay descuento
    if (descuentoActivo && !tarjetaPresentada) {
      setMensajeModal("Debes marcar que el cliente presentó su tarjeta para aplicar el descuento");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    let clienteData = null;
    if (datosCliente.nombre.trim()) {
      clienteData = {
        id: datosCliente.id,
        nombre: datosCliente.nombre.trim(),
        cedula: datosCliente.cedula.trim() || null,
        correo: datosCliente.correo.trim() || null,
        celular: datosCliente.celular.trim() || null
      };
    }

// ✅ CRÍTICO: Calcular correctamente el descuento SOLO sobre subtotal
    const subtotalBase = calcularSubtotal(); // ✅ Solo productos, SIN costos
    const montoDescuento = descuentoActivo ? calcularMontoDescuento(subtotalBase) : 0;
    const porcentajeDescuento = descuentoActivo ? descuentoAplicable : 0;

const metodoPagoCompleto = subMetodoPago
      ? `${metodoPago} - ${subMetodoPago}`
      : metodoPago;

    // 🔥 LOGGING PARA DEBUGGING
    console.log('📝 Valores de descuento antes de enviar:');
    console.log('  - descuentoActivo:', descuentoActivo);
    console.log('  - descuentoAplicable:', descuentoAplicable);
    console.log('  - subtotalBase:', subtotalBase);
    console.log('  - montoDescuento:', montoDescuento);
    console.log('  - porcentajeDescuento:', porcentajeDescuento);

    const datosVenta = {
      cliente: clienteData,
      productos: productosSeleccionados,
      productos_marca_aliada: productosMarcaSeleccionados,
      costos_adicionales: costosAdicionales,
      subtotal: calcularSubtotal(),
      total_marcas: calcularTotalMarcas(),
      total: total,
      monto_pagado: pagado,
      cambio: metodoPago === 'Efectivo' ? calcularCambio() : 0,
      metodo_pago: metodoPagoCompleto,
      descuento_manual_tipo: descuentoManual.tipo,
      descuento_manual_valor: descuentoManual.valor,
      descuento_manual_monto: calcularDescuentoManualMonto(),
        notas: [
          (descuentoActivo && descuentoAplicable > 0) ? `Descuento fidelidad: ${descuentoAplicable}%` : null,
          (descuentoManual.tipo === 'porcentaje') ? `Descuento adicional: ${descuentoManual.valor}%` : null,
          (descuentoManual.tipo === 'fijo') ? `Descuento adicional fijo: $${descuentoManual.valor}` : null,
          notas
        ].filter(Boolean).join(' | ') || notas,
      // ✅ FIDELIDAD: Información completa
      presento_tarjeta: tarjetaPresentada,
      descuento_fidelidad_aplicado: descuentoActivo && descuentoAplicable > 0,
      tipo_descuento: (descuentoActivo && descuentoAplicable > 0) ? `${descuentoAplicable}%` : null,
      // ✅ CRÍTICO: Estos campos se guardan en la tabla ventas
      descuento_porcentaje: porcentajeDescuento,  // ✅ Asegurar que NO sea undefined
      descuento_monto: montoDescuento             // ✅ Asegurar que NO sea undefined
    };

    console.log('📝 Datos de venta completos a enviar:', datosVenta);
    console.log('💰 Descuento final:', {
      porcentaje: porcentajeDescuento,
      monto: montoDescuento,
      activo: descuentoActivo,
    });

    const resultado = await crearVenta(datosVenta);

if (resultado.success) {
      if (datosCliente.id) {
        // ✅ CORREGIDO: Pasar el subtotal (sin costos) para fidelidad
        await procesarFidelidadPostVenta(datosCliente.id, subtotalBase);
      }

    setDescuentoManual({ tipo: null, valor: 0 }); // ← aquí
    setMostrarDescuento(false);


      // ✅ CORREGIDO: Solo mostrar mensaje de descuento si SE APLICÓ
      let mensajeExito = `Venta ${resultado.numero_venta} creada exitosamente`;

      if (resultado.tiene_deuda) {
        mensajeExito += ' — Se generó una deuda pendiente';
      }

      // ✅ Solo agregar mensaje de descuento si REALMENTE se aplicó
      if (descuentoActivo && descuentoAplicable > 0) {
        mensajeExito += ` — Descuento del ${descuentoAplicable}% aplicado`;
      }

      setMensajeModal(mensajeExito);
      setTipoMensaje("exito");
      setMostrarMensaje(true);

      setTimeout(() => {
        onSuccess();
      }, 2500);
    } else {
      setMensajeModal('Error al crear la venta: ' + resultado.error);
      setTipoMensaje("error");
      setMostrarMensaje(true);
    }
  };

  const total = calcularTotal();
  const cambio = calcularCambio();
  const subtotal = calcularSubtotal();

// ✅ COMPONENTE AlertaFidelidad COMPLETO Y CORREGIDO
const AlertaFidelidad = () => {
  if (!datosCliente.id && !datosCliente.nombre.trim()) return null;

  // ✅ Calcular si la compra actual es > $30,000
  const subtotalActual = calcularSubtotal();
  const esCompraGrande = subtotalActual > 30000;

  // ✅ NUEVO: Si es cliente nuevo (sin ID) y compra > $30k → Mostrar alerta
  if (!datosCliente.id && datosCliente.nombre.trim() && esCompraGrande) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Gift className="text-purple-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-purple-900">🎁 ¡IMPORTANTE! Entregar Tarjeta de Fidelidad</h4>
            <p className="text-sm text-purple-700 mt-2">
              <strong>⚠️ RECORDATORIO:</strong> Esta es la primera compra del cliente con un monto superior a $30,000.
            </p>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-400">
              <p className="text-sm font-bold text-purple-900">
                📋 Al finalizar la venta, entregar la tarjeta de fidelidad física al cliente
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Con esta tarjeta podrá acumular compras y obtener descuentos especiales en sus compras 3 y 6 con tarjeta presentada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Si no hay ID de cliente, no mostrar nada más
  if (!datosCliente.id) return null;

  // ✅ NUEVO: Verificar si cliente existente NO tiene tarjeta Y compra > $30k
  const clienteSinTarjeta = clienteActual?.tarjeta_fidelidad_entregada === 0;
  if (clienteSinTarjeta && esCompraGrande) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Gift className="text-purple-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-purple-900">🎁 ¡IMPORTANTE! Entregar Tarjeta de Fidelidad</h4>
            <p className="text-sm text-purple-700 mt-2">
              <strong>⚠️ RECORDATORIO:</strong> Esta es la primera compra del cliente con un monto superior a $30,000.
            </p>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-400">
              <p className="text-sm font-bold text-purple-900">
                📋 Al finalizar la venta, entregar la tarjeta de fidelidad física al cliente
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Con esta tarjeta podrá acumular compras y obtener descuentos especiales en sus compras 3 y 6 con tarjeta presentada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VERIFICAR SI YA USARON AMBOS DESCUENTOS
  const yaUsoAmbosDescuentos = clienteActual?.descuento_aplicado_3 === 1 &&
                                clienteActual?.descuento_aplicado_6 === 1;

  // ✅ Calcular fecha de reinicio (10 meses + 1 día desde primera compra)
  const calcularFechaReinicio = () => {
    if (!clienteActual?.fecha_primera_compra) return null;
    const fechaPrimeraCompra = new Date(clienteActual.fecha_primera_compra);
    const fechaReinicio = new Date(fechaPrimeraCompra);
    fechaReinicio.setMonth(fechaReinicio.getMonth() + 10);
    fechaReinicio.setDate(fechaReinicio.getDate() + 1);
    return fechaReinicio.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ⭐ Si ya usó ambos descuentos, mostrar mensaje informativo
  if (yaUsoAmbosDescuentos) {
    const fechaReinicio = calcularFechaReinicio();
    return (
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="text-gray-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">✨ Descuentos Completados</h4>
            <p className="text-sm text-gray-700 mt-1">
              Este cliente ya utilizó los dos descuentos disponibles del programa de fidelidad:
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>✅ Descuento del 10% (3ra compra con tarjeta)</div>
              <div>✅ Descuento del 15% (6ta compra con tarjeta)</div>
            </div>
            {fechaReinicio && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Podrá volver a participar:</strong> {fechaReinicio}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  El programa se reinicia automáticamente 10 meses después de su primera compra mayor a $30,000 (cuando recibió la tarjeta de fidelidad).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Alerta: Entregar tarjeta de fidelidad (1ra compra > $30k de cliente existente)
  if (requiereEntregarTarjeta && esCompraGrande) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Gift className="text-purple-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-purple-900">🎁 ¡IMPORTANTE! Entregar Tarjeta de Fidelidad</h4>
            <p className="text-sm text-purple-700 mt-2">
              <strong>⚠️ RECORDATORIO:</strong> Esta es la primera compra del cliente con un monto superior a $30,000.
            </p>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-400">
              <p className="text-sm font-bold text-purple-900">
                📋 Al finalizar la venta, entregar la tarjeta de fidelidad física al cliente
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Con esta tarjeta podrá acumular compras y obtener descuentos especiales en sus compras 3 y 6 con tarjeta presentada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ℹ️ Si es primera compra pero NO cumple monto, no mostrar nada
  if (requiereEntregarTarjeta && !esCompraGrande) {
    return null;
  }

  // ✅ Mostrar checkbox para registrar presentación de tarjeta (solo si compra > $30k Y ya tiene tarjeta)
  if (!requiereEntregarTarjeta && descuentoAplicable === 0 && esCompraGrande && clienteActual?.tarjeta_fidelidad_entregada === 1) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Award className="text-blue-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-blue-900">💳 Tarjeta de Fidelidad</h4>
            <p className="text-sm text-blue-700 mt-1">
              Marca si el cliente presenta su tarjeta en esta compra (compra válida > $30,000).
            </p>
            <label className="flex items-center space-x-2 text-sm text-blue-800 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tarjetaPresentada}
                onChange={() => registrarPresentacionTarjeta()}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium">Cliente presentó tarjeta de fidelidad</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Alerta: Descuento disponible (compra 3 o 6) - SOLO si compra > $30k
  if (descuentoAplicable > 0 && esCompraGrande) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Award className="text-green-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-green-900">
              🎉 ¡Descuento del {descuentoAplicable}% Disponible!
            </h4>
            <p className="text-sm text-green-700 mt-1">
              El cliente califica para un descuento de fidelidad en esta compra.
            </p>

            {/* ✅ CHECKBOX PARA PRESENTACIÓN DE TARJETA */}
            <label className="flex items-center space-x-2 text-sm text-green-800 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tarjetaPresentada}
                onChange={() => registrarPresentacionTarjeta()}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
              />
              <span className="font-medium">Cliente presentó tarjeta</span>
            </label>

            {/* ✅ CHECKBOX PARA APLICAR DESCUENTO */}
            {tarjetaPresentada && (
              <label className="flex items-center space-x-2 text-sm text-green-800 mt-3 cursor-pointer border-t pt-3">
                <input
                  type="checkbox"
                  checked={descuentoActivo}
                  onChange={() => toggleDescuento()}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <span className="font-bold text-base">✅ Aplicar descuento del {descuentoAplicable}%</span>
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ⚠️ Si tiene descuento disponible pero compra < $30k, mostrar aviso
  if (descuentoAplicable > 0 && !esCompraGrande) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Award className="text-yellow-600 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-yellow-900">⚠️ Descuento No Disponible</h4>
            <p className="text-sm text-yellow-700 mt-1">
              El cliente tiene un descuento del {descuentoAplicable}% disponible, pero <strong>solo aplica en compras mayores a $30,000</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Subtotal actual: <strong>${subtotalActual.toLocaleString()}</strong> (faltan ${(30000 - subtotalActual).toLocaleString()})
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

  const referenciasOptions = referenciasDisponibles.map(p => p.referencia || 'N/A');


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-teal-50">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Nueva Venta</h3>
              <p className="text-sm text-gray-600 mt-1">{numeroVenta}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setPaso(1)}
              className={`flex-1 px-6 py-4 font-medium transition ${paso === 1
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Package size={20} />
                <span>1. Productos</span>
              </div>
            </button>
                    <button
                      onClick={() => {
                        if (productosSeleccionados.length > 0 || productosMarcaSeleccionados.length > 0) {
                          setPaso(2);
                        } else {
                          setMensajeModal("Agrega al menos un producto (propio o de marca aliada)");
                          setTipoMensaje("error");
                          setMostrarMensaje(true);
                        }
                      }}

              className={`flex-1 px-6 py-4 font-medium transition ${paso === 2
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User size={20} />
                <span>2. Cliente</span>
              </div>
            </button>
                <button
                  onClick={() => {
                    if (productosSeleccionados.length > 0 || productosMarcaSeleccionados.length > 0) {
                      setPaso(3);
                    } else {
                      setMensajeModal("Agrega al menos un producto (propio o de marca aliada)");
                      setTipoMensaje("error");
                      setMostrarMensaje(true);
                    }
                  }}
              className={`flex-1 px-6 py-4 font-medium transition ${paso === 3
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <DollarSign size={20} />
                <span>3. Pago</span>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {paso === 1 && (
              <div className="space-y-6">
                {/* Productos Seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3">Productos en la Venta ({productosSeleccionados.length})</h4>
                    <div className="space-y-2">
                      {productosSeleccionados.map((producto, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{producto.nombre}</div>
                            <div className="text-xs text-gray-500">
                              Ref: {producto.referencia}
                              {producto.talla && ` | Talla: ${producto.talla}`}
                            </div>
                            <div className="text-sm text-gray-600">${producto.precio_unitario.toFixed(2)} c/u</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => actualizarCantidad(index, producto.cantidad - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-medium w-8 text-center">{producto.cantidad}</span>
                            <button
                              onClick={() => actualizarCantidad(index, producto.cantidad + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus size={16} />
                            </button>
                            <div className="text-right min-w-[80px]">
                              <div className="font-bold text-gray-800">${producto.subtotal.toFixed(2)}</div>
                            </div>
                            <button
                              onClick={() => eliminarProducto(index)}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-teal-700">Subtotal:</span>
                          <span className="text-xl font-bold text-teal-600">${subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Filtros de Selección */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-4">Seleccionar Productos</h4>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <ComboBoxField
                      label="1. Categoría"
                      value={categoriaSeleccionada}
                      onChange={handleCategoriaChange}
                      options={categorias}
                      placeholder="Escribe o selecciona categoría"
                    />

                    <ComboBoxField
                      label="2. Nombre del Producto"
                      value={nombreSeleccionado}
                      onChange={handleNombreChange}
                      options={nombresDisponibles}
                      placeholder="Escribe o selecciona nombre"
                      disabled={!categoriaSeleccionada}
                    />

                    <ComboBoxField
                      label="3. Referencia"
                      value={referenciaSeleccionada}
                      onChange={handleReferenciaChange}
                      options={referenciasOptions}
                      placeholder="Escribe o selecciona referencia"
                      disabled={!nombreSeleccionado}
                    />
                  </div>

                  {/* Producto Seleccionado con Variantes */}
                  {productoActual && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-700 mb-3">Producto Seleccionado:</h5>
                      <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start space-x-4 mb-3">
                              {/* ✅ IMAGEN DEL PRODUCTO */}
                              <ImagenProducto
                                rutaImagen={productoActual.imagen}
                                nombreProducto={productoActual.nombre}
                                    onClickImagen={(img) => {
                                      setImagenAmpliada(img);
                                      setNombreProductoAmpliado(productoActual.nombre);

                                  console.log('Imagen clickeada');
                                }}
                              />

                              {/* INFORMACIÓN DEL PRODUCTO */}
                              <div className="flex-1">
                                <div className="font-bold text-lg text-gray-800">{productoActual.nombre}</div>
                                <div className="text-sm text-teal-600">Ref: {productoActual.referencia || 'N/A'}</div>
                                <div className="text-sm text-gray-600 mt-1">Precio base: ${productoActual.precio_venta_base}</div>
                              </div>
                            </div>

                        {productoActual.variantes && productoActual.variantes.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Selecciona una talla:</p>
                            <div className="flex flex-wrap gap-2">
                              {productoActual.variantes.map((variante) => (
                                <button
                                  key={variante.id}
                                  onClick={() => agregarProducto(productoActual, variante)}
                                  disabled={variante.cantidad <= 0}
                                  className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                                    variante.cantidad <= 0
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
                                      : variante.cantidad < 5
                                        ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                                        : 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-bold">{variante.talla}</div>
                                    <div className="text-xs">Stock: {variante.cantidad}</div>
                                    {variante.ajuste_precio !== 0 && (
                                      <div className="text-xs">
                                        ${(parseFloat(productoActual.precio_venta_base) + parseFloat(variante.ajuste_precio)).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            {productoActual.variantes.every(v => v.cantidad <= 0) && (
                              <p className="text-sm text-red-600 font-medium mt-2">⚠️ Sin stock disponible</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => agregarProducto(productoActual, null)}
                            className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
                          >
                            Agregar Producto
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                            {/* ===== SECCIÓN DE MARCAS ALIADAS ===== */}
                            <div className="border-t pt-6 mt-6">
                              <button
                                onClick={() => setMostrarMarcasAliadas(!mostrarMarcasAliadas)}
                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 hover:border-purple-400 transition"
                              >
                                <div className="flex items-center space-x-3">
                                  <Store size={24} className="text-purple-600" />
                                  <div className="text-left">
                                    <h4 className="font-bold text-purple-900">Productos de Marcas Aliadas</h4>
                                    <p className="text-sm text-purple-600">
                                      {productosMarcaSeleccionados.length > 0
                                        ? `${productosMarcaSeleccionados.length} producto(s) agregado(s)`
                                        : 'Haz clic para agregar productos de marcas aliadas'}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown
                                  size={20}
                                  className={`text-purple-600 transition-transform ${mostrarMarcasAliadas ? 'rotate-180' : ''}`}
                                />
                              </button>

                              {mostrarMarcasAliadas && (
                                <div className="mt-4 space-y-4">
                                  {/* Lista de productos de marca seleccionados */}
                                  {productosMarcaSeleccionados.length > 0 && (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                      <h5 className="font-bold text-purple-900 mb-3">Productos de Marcas Aliadas ({productosMarcaSeleccionados.length})</h5>
                                      <div className="space-y-2">
                                        {productosMarcaSeleccionados.map((producto, index) => (
                                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-800">{producto.nombre}</div>
                                              <div className="text-xs text-gray-500">
                                                <span className="font-medium text-purple-600">{producto.marca_nombre}</span>
                                                {' | '}Ref: {producto.referencia}
                                                {producto.talla && ` | Talla: ${producto.talla}`}
                                              </div>
                                              <div className="text-sm text-gray-600">${producto.precio_unitario.toFixed(2)} c/u</div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                              <button
                                                onClick={() => actualizarCantidadMarca(index, producto.cantidad - 1)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                              >
                                                <Minus size={16} />
                                              </button>
                                              <span className="font-medium w-8 text-center">{producto.cantidad}</span>
                                              <button
                                                onClick={() => actualizarCantidadMarca(index, producto.cantidad + 1)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                              >
                                                <Plus size={16} />
                                              </button>
                                              <div className="text-right min-w-[80px]">
                                                <div className="font-bold text-gray-800">${producto.subtotal.toFixed(2)}</div>
                                              </div>
                                              <button
                                                onClick={() => eliminarProductoMarca(index)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition"
                                              >
                                                <Trash2 size={18} className="text-red-600" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                        <div className="bg-purple-100 p-3 rounded-lg border border-purple-300">
                                          <div className="flex justify-between items-center">
                                            <span className="font-medium text-purple-700">Total Marcas Aliadas:</span>
                                            <span className="text-xl font-bold text-purple-600">${calcularTotalMarcas().toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Selección de marca */}
                                  {!marcaSeleccionada ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {marcasAliadas.map((marca) => (
                                        <button
                                          key={marca.id}
                                          onClick={() => handleSeleccionarMarca(marca)}
                                          className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left"
                                        >
                                          <div className="font-bold text-gray-800">{marca.nombre}</div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            {marca.total_productos || 0} productos
                                          </div>
                                          <div className="text-xs text-purple-600 mt-1">
                                            Comisión: {marca.porcentaje_comision}%
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>
                            {/* Header de marca seleccionada */}
                            <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                              <div className="flex items-center space-x-3">
                                <Store size={20} className="text-purple-600" />
                                <div>
                                  <div className="font-bold text-purple-900">{marcaSeleccionada.nombre}</div>
                                  <div className="text-sm text-purple-600">{productosMarcaDisponibles.length} productos disponibles</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setMarcaSeleccionada(null);
                                  setProductosMarcaDisponibles([]);
                                  setBusquedaProductoMarca('');
                                }}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                              >
                                Cambiar marca
                              </button>
                            </div>

                            {/* 🔍 BUSCADOR DE PRODUCTOS */}
                            <div className="relative mb-3">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              <input
                                type="text"
                                value={busquedaProductoMarca}
                                onChange={(e) => setBusquedaProductoMarca(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                                placeholder="Buscar por nombre o referencia..."
                              />
                              {busquedaProductoMarca && (
                                <button
                                  onClick={() => setBusquedaProductoMarca('')}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>

                            {/* Lista de productos de la marca */}
                            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                              {(() => {
                                const productosFiltrados = productosMarcaDisponibles.filter(producto => {
                                  const termino = busquedaProductoMarca.toLowerCase();
                                  return (
                                    producto.nombre.toLowerCase().includes(termino) ||
                                    (producto.referencia && producto.referencia.toLowerCase().includes(termino))
                                  );
                                });

                                if (productosFiltrados.length === 0 && busquedaProductoMarca) {
                                  return (
                                    <div className="text-center py-8 text-gray-500">
                                      <Search size={32} className="mx-auto mb-2 text-gray-300" />
                                      <p className="text-sm">No se encontraron productos con "<strong>{busquedaProductoMarca}</strong>"</p>
                                    </div>
                                  );
                                }

                                return productosFiltrados.map((producto) => (
                                  <div key={producto.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                      {/* Imagen del producto */}
                                      <ImagenProducto
                                        rutaImagen={producto.imagen}
                                        nombreProducto={producto.nombre}
                                        onClickImagen={(img) => {
                                          setImagenAmpliada(img);
                                          setNombreProductoAmpliado(producto.nombre);
                                        }}
                                      />

                                      {/* Información del producto */}
                                      <div className="flex-1">
                                        <div className="font-bold text-lg text-gray-800">{producto.nombre}</div>
                                        <div className="text-sm text-purple-600">Ref: {producto.referencia || 'N/A'}</div>
                                        <div className="text-sm text-gray-600 mt-1">Precio: ${producto.precio_venta_base}</div>

                                        {/* Variantes/Tallas */}
                                        {producto.variantes && producto.variantes.length > 0 ? (
                                          <div className="mt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Selecciona una talla:</p>
                                            <div className="flex flex-wrap gap-2">
                                              {producto.variantes.map((variante) => (
                                                <button
                                                  key={variante.id}
                                                  onClick={() => agregarProductoMarca(producto, variante)}
                                                  disabled={variante.cantidad <= 0}
                                                  className={`px-3 py-2 rounded-lg border font-medium transition ${
                                                    variante.cantidad <= 0
                                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                      : variante.cantidad < 5
                                                        ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                                                        : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                                                  }`}
                                                >
                                                  <div>
                                                    <div className="font-bold">{variante.talla}</div>
                                                    <div className="text-xs">Stock: {variante.cantidad}</div>
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => agregarProductoMarca(producto, null)}
                                            className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                                          >
                                            Agregar Producto
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                                      </div>
                               )}
                           </div>
                          )}
                      </div>

                                {/* Costos Adicionales */}
                                <div>
                                  <h4 className="font-bold text-gray-800 mb-3">
                                    Costos Adicionales (Bolsas, Etiquetas, etc.)
                                  </h4>

                                  {costosAdicionales.length > 0 && (
                                    <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                                      {costosAdicionales.map((costo, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                                          <span className="text-sm text-gray-700">{costo.concepto}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-800">${costo.monto.toFixed(2)}</span>
                                            <button
                                              onClick={() => eliminarCostoAdicional(index)}
                                              className="p-1 hover:bg-red-50 rounded transition"
                                            >
                                              <Trash2 size={16} className="text-red-600" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium text-blue-700">Total Costos:</span>
                                          <span className="font-bold text-blue-600">${calcularCostosTotal().toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex space-x-2">
                                    <div className="flex-1 relative">
                                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={costoAdicional}
                                        onChange={(e) => setCostoAdicional(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ingresa el monto (ej: 500.00)"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            agregarCostoAdicional();
                                          }
                                        }}
                                      />
                                    </div>
                                    <button
                                      onClick={agregarCostoAdicional}
                                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-1"
                                    >
                                      <Plus size={18} />
                                      <span>Agregar</span>
                                    </button>
                                  </div>

                                  <p className="text-xs text-gray-500 mt-2">
                                    💡 Los costos adicionales se suman al total de la venta (bolsas, etiquetas, envío, etc.)
                                  </p>
                                </div>
              </div>

            )}

            {paso === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Opcional:</strong> Los datos del cliente son opcionales. Si los proporcionas, se guardarán en la base de datos para futuras ventas.
                  </p>
                </div>
              <AlertaFidelidad />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Cliente Existente
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={buscarCliente}
                      onChange={(e) => {
                        setBuscarCliente(e.target.value);
                        buscarClientesBD(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Buscar por nombre, cédula o celular..."
                    />
                  </div>

                  {clientesEncontrados.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-48 overflow-auto">
                      {clientesEncontrados.map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => seleccionarCliente(cliente)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="font-medium text-gray-800">{cliente.nombre}</div>
                          <div className="text-sm text-gray-600">
                            {cliente.cedula && `CC: ${cliente.cedula}`}
                            {cliente.celular && ` | Tel: ${cliente.celular}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">Datos del Cliente</h4>
                    {datosCliente.nombre && (
                      <button
                        onClick={limpiarCliente}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Limpiar datos
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <User size={16} />
                        <span>Nombre Completo</span>
                      </label>
                      <input
                        type="text"
                        value={datosCliente.nombre}
                        onChange={(e) => setDatosCliente({ ...datosCliente, id: null, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nombre del cliente"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <IdCard size={16} />
                        <span>Cédula</span>
                      </label>
                      <input
                        type="text"
                        value={datosCliente.cedula}
                        onChange={(e) => setDatosCliente({ ...datosCliente, id: null, cedula: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Número de cédula"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone size={16} />
                        <span>Celular</span>
                      </label>
                      <input
                        type="tel"
                        value={datosCliente.celular}
                        onChange={(e) => setDatosCliente({ ...datosCliente, id: null, celular: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Número de celular"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail size={16} />
                        <span>Correo Electrónico</span>
                      </label>
                      <input
                        type="email"
                        value={datosCliente.correo}
                        onChange={(e) => setDatosCliente({ ...datosCliente, id: null, correo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border mt-4">
                      <div className="space-y-2">
                        {/* Resumen de productos */}
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>
                            {productosSeleccionados.length > 0 && `${productosSeleccionados.length} producto(s) propio(s)`}
                            {productosSeleccionados.length > 0 && productosMarcaSeleccionados.length > 0 && ' + '}
                            {productosMarcaSeleccionados.length > 0 && `${productosMarcaSeleccionados.length} de marca aliada`}
                          </span>
                        </div>

                        {/* Subtotal productos propios */}
                        {productosSeleccionados.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Subtotal productos propios:</span>
                            <span className="font-bold text-gray-800">${subtotal.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Subtotal marcas aliadas */}
                        {productosMarcaSeleccionados.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-purple-700">Subtotal marcas aliadas:</span>
                            <span className="font-bold text-purple-700">${calcularTotalMarcas().toFixed(2)}</span>
                          </div>
                        )}

                        {/* Total general */}
                        {(productosSeleccionados.length > 0 || productosMarcaSeleccionados.length > 0) && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-bold text-gray-800">Total:</span>
                            <span className="text-xl font-bold text-teal-600">
                              ${(subtotal + calcularTotalMarcas()).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            )}

{paso === 3 && (
  <div className="space-y-6">
    {/* Resumen de la Venta */}
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border border-teal-200">
      <h4 className="font-bold text-gray-800 mb-4">Resumen de la Venta</h4>
      <div className="space-y-3">
        {/* Productos Propios */}
        {productosSeleccionados.length > 0 && (
          <div className="border-b pb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Productos Propios:</span>
              <span className="font-medium text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="space-y-1 ml-4">
              {productosSeleccionados.map((prod, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-600">
                  <span>• {prod.nombre} {prod.talla ? `(${prod.talla})` : ''} x{prod.cantidad}</span>
                  <span>${prod.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos de Marcas Aliadas */}
        {productosMarcaSeleccionados.length > 0 && (
          <div className="border-b pb-3 bg-purple-50 -mx-2 px-2 py-2 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-purple-700">Productos Marcas Aliadas:</span>
              <span className="font-bold text-purple-700">${calcularTotalMarcas().toFixed(2)}</span>
            </div>
            <div className="space-y-1 ml-4">
              {productosMarcaSeleccionados.map((prod, idx) => (
                <div key={idx} className="flex justify-between text-xs text-purple-600">
                  <span>
                    • {prod.nombre} {prod.talla ? `(${prod.talla})` : ''} x{prod.cantidad}
                    <span className="text-purple-500 ml-1">- {prod.marca_nombre}</span>
                  </span>
                  <span>${prod.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Costos Adicionales */}
        {costosAdicionales.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Costos adicionales:</span>
            <span className="font-medium">${calcularCostosTotal().toFixed(2)}</span>
          </div>
        )}

{/* Descuento adicional */}
<div className="border-t border-gray-100 pt-2">
  {!mostrarDescuento ? (
    <button
      onClick={() => setMostrarDescuento(true)}
      className="text-sm text-gray-400 hover:text-teal-600 transition flex items-center gap-1"
    >
      <Plus size={14} />
      Aplicar descuento adicional
    </button>
  ) : (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 whitespace-nowrap">Descuento:</span>

      <div className="flex gap-1">
        {[5, 10, 15].map(pct => (
          <button
            key={pct}
            onClick={() => setDescuentoManual(
              descuentoManual.tipo === 'porcentaje' && descuentoManual.valor === pct
                ? { tipo: null, valor: 0 }
                : { tipo: 'porcentaje', valor: pct }
            )}
            className={`px-3 py-1 rounded-md text-sm transition ${
              descuentoManual.tipo === 'porcentaje' && descuentoManual.valor === pct
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>

      <div className="relative flex-1 max-w-[140px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={descuentoManual.tipo === 'fijo' ? descuentoManual.valor : ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            setDescuentoManual(val > 0 ? { tipo: 'fijo', valor: val } : { tipo: null, valor: 0 });
          }}
          onWheel={(e) => e.target.blur()}
          className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="Monto fijo"
        />
      </div>

      {calcularDescuentoManualMonto() > 0 && (
        <span className="text-sm text-green-600 font-medium ml-auto">
          -${calcularDescuentoManualMonto().toFixed(2)}
        </span>
      )}

      <button
        onClick={() => {
          setMostrarDescuento(false);
          setDescuentoManual({ tipo: null, valor: 0 });

        }}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <X size={14} />
      </button>
    </div>
  )}
</div>
        {/* Descuento de Fidelidad */}
        {descuentoActivo && descuentoAplicable > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Descuento de fidelidad ({descuentoAplicable}%):</span>
            <span>-${calcularMontoDescuento(subtotal).toFixed(2)}</span>
          </div>
        )}

        {/* Cliente */}
        {datosCliente.nombre && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{datosCliente.nombre}</span>
          </div>
        )}

    {calcularDescuentoManualMonto() > 0 && (
      <div className="flex justify-between text-sm text-green-600 font-medium">
        <span>
          {descuentoManual.tipo === 'porcentaje'
            ? `Descuento adicional (${descuentoManual.valor}%):`
            : 'Descuento adicional (fijo):'}
        </span>
        <span>-${calcularDescuentoManualMonto().toFixed(2)}</span>
      </div>
    )}

        {/* Total */}
        <div className="border-t pt-2 flex justify-between">
          <span className="font-bold text-lg text-gray-800">Total:</span>
          <span className="font-bold text-2xl text-teal-600">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

                            {/* 🔥 MÉTODOS DE PAGO PRINCIPALES */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Método de Pago
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {Object.keys(METODOS_PAGO).map((metodo) => (
                                  <button
                                    key={metodo}
                                    onClick={() => handleMetodoPagoChange(metodo)}
                                    className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                                      metodoPago === metodo
                                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {metodo}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 🔥 SUB-MÉTODOS DE PAGO (TARJETA / TRANSFERENCIA) */}
                            {METODOS_PAGO[metodoPago].length > 0 && (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                  Selecciona el tipo de {metodoPago.toLowerCase()}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {METODOS_PAGO[metodoPago].map((subMetodo) => (
                                    <button
                                      key={subMetodo}
                                      onClick={() => setSubMetodoPago(subMetodo)}
                                      className={`px-4 py-3 rounded-lg border-2 font-medium transition flex items-center justify-center space-x-2 ${
                                        subMetodoPago === subMetodo
                                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      {metodoPago === 'Tarjeta' && <CreditCard size={18} />}
                                      {metodoPago === 'Transferencia' && <DollarSign size={18} />}
                                      <span>{subMetodo}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Monto Pagado */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto Pagado
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={montoPagado}
                                  onChange={(e) => setMontoPagado(e.target.value)}
                                  onWheel={(e) => e.target.blur()}
                                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium"
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="flex items-center justify-between mt-2 text-sm">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="font-bold text-teal-600">${total.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Cambio (solo para Efectivo) */}
                            {metodoPago === 'Efectivo' && parseFloat(montoPagado) > 0 && (
                              <div className={`p-4 rounded-lg border-2 ${
                                cambio >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex justify-between items-center">
                                  <span className={`font-medium ${cambio >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {cambio >= 0 ? 'Cambio a devolver:' : 'Falta por pagar:'}
                                  </span>
                                  <span className={`text-2xl font-bold ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${Math.abs(cambio).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Notas */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas (opcional)
                              </label>
                              <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                rows="3"
                                placeholder="Observaciones sobre la venta..."
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                                        {paso === 1 && (
                                          <span>
                                            {productosSeleccionados.length + productosMarcaSeleccionados.length} producto(s) agregado(s)
                                            {productosMarcaSeleccionados.length > 0 && (
                                              <span className="text-purple-600 ml-1">
                                                ({productosMarcaSeleccionados.length} de marcas aliadas)
                                              </span>
                                            )}
                                          </span>
                                        )}

                                    {paso === 2 && <span>{datosCliente.nombre ? `Cliente: ${datosCliente.nombre}` : 'Sin datos de cliente'}</span>}
                          {paso === 3 && (
                            <div className="flex flex-col">
                              <span>Total: ${total.toFixed(2)}</span>
                              {subMetodoPago && (
                                <span className="text-xs text-teal-600 font-medium mt-1">
                                  Método: {metodoPago} - {subMetodoPago}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-3">
                          {paso > 1 && (
                            <button
                              onClick={() => setPaso(paso - 1)}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                              Atrás
                            </button>
                          )}
                          <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                          >
                            Cancelar
                          </button>
                          {paso < 3 ? (
                            <button
                              onClick={() => {
                                if (paso === 1 && productosSeleccionados.length === 0 && productosMarcaSeleccionados.length === 0) {
                                  setMensajeModal("Agrega al menos un producto (propio o de marca aliada)");
                                  setTipoMensaje('error');
                                  setMostrarMensaje(true);
                                  return;
                                }
                                setPaso(paso + 1);
                              }}
                                                  className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
                            >
                              Continuar
                            </button>
                          ) : (
                            <button
                              onClick={handleSubmit}
                              disabled={loading}
                              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 flex items-center space-x-2"
                            >
                              <ShoppingCart size={20} />
                              <span>Confirmar Venta</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Modal de Imagen Ampliada */}
                  {imagenAmpliada && (
                    <ModalImagen
                      imagenBase64={imagenAmpliada}
                      nombreProducto={nombreProductoAmpliado}
                      onCerrar={() => setImagenAmpliada(null)}
                    />
                  )}

                  {/* ✅ Modal de Mensajes */}
                  {mostrarMensaje && (
                    <ModalMensaje
                      mensaje={mensajeModal}
                      tipo={tipoMensaje}
                      autoCloseMs={tipoMensaje === 'exito' ? 2200 : 0}
                      onCerrar={() => setMostrarMensaje(false)}
                    />
                  )}
                </>
              );
            };

            export default ModalAgregarVenta;
