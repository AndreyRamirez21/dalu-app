import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ShoppingCart, DollarSign, Package, CreditCard, Minus, User, Phone, Mail, CreditCard as IdCard, Search, ChevronDown } from 'lucide-react';
import { useVentas } from '../../api/useVentas';
import { ModalMensaje } from '../common/ModalMensaje';


const { ipcRenderer } = window.require('electron');

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

  const [paso, setPaso] = useState(1);
  const [numeroVenta, setNumeroVenta] = useState('');
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info"); // 'exito' | 'error' | 'info'


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
  const [nuevoCosto, setNuevoCosto] = useState({ concepto: '', monto: '' });

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
  const [montoPagado, setMontoPagado] = useState('');
  const [notas, setNotas] = useState('');

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'];

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

  // AGREGAR ESTAS LÍNEAS AL FINAL:
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
  console.log('🔵 Intentando agregar costo:', nuevoCosto); // ← AGREGAR

  if (
    !nuevoCosto.concepto ||
    !nuevoCosto.monto ||
    parseFloat(nuevoCosto.monto) <= 0
  ) {
    setMensajeModal("Completa el concepto y el monto del costo");
    setTipoMensaje('error');
    setMostrarMensaje(true);
    return;
  }

  const costoParaAgregar = {
    concepto: nuevoCosto.concepto,
    monto: parseFloat(nuevoCosto.monto)
  };

  console.log('✅ Costo a agregar:', costoParaAgregar); // ← AGREGAR
  console.log('📋 Array actual de costos:', costosAdicionales); // ← AGREGAR

  setCostosAdicionales([...costosAdicionales, costoParaAgregar]);

  console.log('📋 Nuevo array de costos:', [...costosAdicionales, costoParaAgregar]); // ← AGREGAR

  setMensajeModal("Costo adicional agregado exitosamente");
  setTipoMensaje('exito');
  setMostrarMensaje(true);

  setNuevoCosto({ concepto: '', monto: '' });
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

  const seleccionarCliente = (cliente) => {
    setDatosCliente({
      id: cliente.id,
      nombre: cliente.nombre,
      cedula: cliente.cedula || '',
      correo: cliente.correo || '',
      celular: cliente.celular || ''
    });
    setBuscarCliente('');
    setClientesEncontrados([]);
  };

  const limpiarCliente = () => {
    setDatosCliente({
      id: null,
      nombre: '',
      cedula: '',
      correo: '',
      celular: ''
    });
  };

  const calcularSubtotal = () => {
    return productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const calcularCostosTotal = () => {
    return costosAdicionales.reduce((sum, c) => sum + c.monto, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularCostosTotal();
  };

  const calcularCambio = () => {
    const total = calcularTotal();
    const pagado = parseFloat(montoPagado) || 0;
    return Math.max(0, pagado - total);
  };

const handleSubmit = async () => {
    console.log('🔍 Estado de costosAdicionales:', costosAdicionales); // ← AGREGAR ESTO PRIMERO
      console.log('🔍 Productos seleccionados:', productosSeleccionados); // ← Y ESTO


  if (productosSeleccionados.length === 0) {
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

    const datosVenta = {
      cliente: clienteData,
      productos: productosSeleccionados,
      costos_adicionales: costosAdicionales,  // ← Verifica que esto esté aquí
      subtotal: calcularSubtotal(),
      total: total,
      monto_pagado: pagado,
      cambio: metodoPago === 'Efectivo' ? calcularCambio() : 0,
      metodo_pago: metodoPago,
      notas: notas
    };


  console.log('📤 Enviando datos de venta:', datosVenta); // ← Este log debe aparecer


    const resultado = await crearVenta(datosVenta);

    if (resultado.success) {
      setMensajeModal(
        `Venta ${resultado.numero_venta} creada exitosamente` +
        (resultado.tiene_deuda ? ' — Se generó una deuda pendiente' : '')
      );
      setTipoMensaje("exito");
      setMostrarMensaje(true);

      // cerrar auto y luego ejecutar onSuccess
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } else {
      setMensajeModal('Error al crear la venta: ' + resultado.error);
      setTipoMensaje("error");
      setMostrarMensaje(true);
    }

      };

  const total = calcularTotal();
  const cambio = calcularCambio();
  const subtotal = calcularSubtotal();

  // Obtener lista de referencias como strings
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
                      if (productosSeleccionados.length > 0) {
                        setPaso(2);
                      } else {
                        setMensajeModal("Agrega productos primero");
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
                  if (productosSeleccionados.length > 0) {
                    setPaso(3);
                  } else {
                    setMensajeModal("Agrega productos primero");
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
                        <div className="flex justify-between items-start mb-3">
                          <div>
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

                {/* Costos Adicionales */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">Costos Adicionales (Bolsas, Etiquetas, etc.)</h4>

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
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={nuevoCosto.concepto}
                      onChange={(e) => setNuevoCosto({ ...nuevoCosto, concepto: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Concepto (ej: Bolsas)"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCosto.monto}
                      onChange={(e) => setNuevoCosto({ ...nuevoCosto, monto: e.target.value })}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="$0.00"
                    />
                    <button
                      onClick={agregarCostoAdicional}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
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
                        onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
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
                        onChange={(e) => setDatosCliente({ ...datosCliente, cedula: e.target.value })}
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
                        onChange={(e) => setDatosCliente({ ...datosCliente, celular: e.target.value })}
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
                        onChange={(e) => setDatosCliente({ ...datosCliente, correo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{productosSeleccionados.length} producto(s) agregado(s)</span>
                      <span className="font-bold text-lg text-gray-800">Subtotal: ${subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-gray-800 mb-4">Resumen de la Venta</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({productosSeleccionados.length} productos):</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {costosAdicionales.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costos adicionales:</span>
                        <span className="font-medium">${calcularCostosTotal().toFixed(2)}</span>
                      </div>
                    )}
                    {datosCliente.nombre && (
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">{datosCliente.nombre}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold text-lg text-gray-800">Total:</span>
                      <span className="font-bold text-2xl text-teal-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {metodosPago.map((metodo) => (
                      <button
                        key={metodo}
                        onClick={() => setMetodoPago(metodo)}
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-600">Total a pagar:</span>
                    <span className="font-bold text-teal-600">${total.toFixed(2)}</span>
                  </div>
                </div>

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
              {paso === 1 && <span>{productosSeleccionados.length} producto(s) agregado(s)</span>}
              {paso === 2 && <span>{datosCliente.nombre ? `Cliente: ${datosCliente.nombre}` : 'Sin datos de cliente'}</span>}
              {paso === 3 && <span>Total: ${total.toFixed(2)}</span>}
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
                        if (paso === 1 && productosSeleccionados.length === 0) {
                          setMensajeModal("Agrega al menos un producto");
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
