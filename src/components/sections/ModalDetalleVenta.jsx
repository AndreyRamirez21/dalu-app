import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Calendar, CreditCard, FileText, Package, Download, AlertCircle } from 'lucide-react';
import { generarPDFVenta } from '../../utils/generarPDFVenta';

const { ipcRenderer } = window.require('electron');

const ModalDetalleVenta = ({ venta, onClose }) => {
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDetalleCompleto();
  }, [venta.id]);

  const cargarDetalleCompleto = async () => {
    try {
      setLoading(true);
      setError(null);
      const detalle = await ipcRenderer.invoke('obtener-venta-por-id', venta.id);
      console.log('📦 Detalle cargado:', detalle); // Debug
      setDetalleCompleto(detalle);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setError('No se pudo cargar el detalle de la venta');
    } finally {
      setLoading(false);
    }
  };

const handleDescargarPDF = () => {
  if (detalleCompleto) {
    generarPDFVenta(detalleCompleto);
  }
};

const formatDate = (dateString) => {
  // SQLite ahora guarda en hora local, parseamos directamente
  const date = new Date(dateString);

  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

  const getEstadoColor = (estado) => {
    const colors = {
      'Pagado': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Cancelado': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center text-gray-600">Cargando detalle...</div>
        </div>
      </div>
    );
  }

  if (error || !detalleCompleto) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar el detalle de la venta'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const productos = detalleCompleto.productos || [];
  const costosAdicionales = detalleCompleto.costos_adicionales || [];
  const totalCostosAdicionales = detalleCompleto.total_costos_adicionales || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-blue-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Detalle de Venta</h3>
              <p className="text-teal-600 font-semibold mt-1">{detalleCompleto.numero_venta}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <User size={18} />
                <span className="text-sm font-medium">Cliente</span>
              </div>
              <div className="font-semibold text-gray-800">{detalleCompleto.cliente_nombre || 'Cliente General'}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Calendar size={18} />
                <span className="text-sm font-medium">Fecha</span>
              </div>
              <div className="font-semibold text-gray-800">{formatDate(detalleCompleto.fecha)}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <CreditCard size={18} />
                <span className="text-sm font-medium">Método de Pago</span>
              </div>
              <div className="font-semibold text-gray-800">{detalleCompleto.metodo_pago || 'No especificado'}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <ShoppingCart size={18} />
                <span className="text-sm font-medium">Estado</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(detalleCompleto.estado)}`}>
                {detalleCompleto.estado}
              </span>
            </div>
          </div>

{/* Productos */}
<div>
  <div className="flex items-center space-x-2 text-gray-700 font-bold mb-3">
    <Package size={20} />
    <h4>Productos</h4>
  </div>

  {productos.length > 0 ? (
    <div className="space-y-4">
      {/* Productos Propios */}
      {detalleCompleto.productos_propios && detalleCompleto.productos_propios.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Productos Propios</h5>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detalleCompleto.productos_propios.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {producto.producto_nombre || 'Producto sin nombre'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {producto.talla || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">
                      {producto.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">
                      ${Number(producto.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">
                      ${Number(producto.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Productos de Marcas Aliadas */}
      {detalleCompleto.productos_marca_aliada && detalleCompleto.productos_marca_aliada.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-purple-700 mb-2">Productos de Marcas Aliadas</h5>
          <div className="border border-purple-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-purple-50 border-b border-purple-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Talla</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase">Cant.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {detalleCompleto.productos_marca_aliada.map((producto, index) => (
                  <tr key={index} className="hover:bg-purple-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {producto.producto_nombre || 'Producto sin nombre'}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                      {producto.marca_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {producto.talla || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">
                      {producto.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">
                      ${Number(producto.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">
                      ${Number(producto.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="border rounded-lg p-8 text-center text-gray-500">
      <Package size={48} className="mx-auto mb-2 opacity-50" />
      <p>No hay productos registrados en esta venta</p>
    </div>
  )}
</div>

{/* Resumen Financiero - ACTUALIZADO */}
<div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border">
  <h4 className="font-bold text-gray-800 mb-4">Resumen Financiero</h4>
  <div className="space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Subtotal productos propios:</span>
      <span className="font-medium text-gray-800">${Number(detalleCompleto.subtotal || 0).toFixed(2)}</span>
    </div>

    {/* ⭐ NUEVO: Total de productos de marcas aliadas */}
    {detalleCompleto.productos_marca_aliada && detalleCompleto.productos_marca_aliada.length > 0 && (
      <div className="flex justify-between text-sm bg-purple-50 -mx-3 px-3 py-2 rounded">
        <span className="text-purple-700 font-medium">Productos marcas aliadas:</span>
        <span className="font-bold text-purple-700">
          ${detalleCompleto.productos_marca_aliada.reduce((sum, p) => sum + Number(p.subtotal), 0).toFixed(2)}
        </span>
      </div>
    )}

    {totalCostosAdicionales > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Costos adicionales:</span>
        <span className="font-medium text-gray-800">${Number(totalCostosAdicionales).toFixed(2)}</span>
      </div>
    )}

    {detalleCompleto.descuento_porcentaje > 0 && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 -mx-3">
        <div className="flex justify-between text-sm">
          <span className="text-green-700 font-medium">
            🎉 Descuento de fidelidad ({detalleCompleto.descuento_porcentaje}%):
          </span>
          <span className="font-bold text-green-600">
            -${Number(detalleCompleto.descuento_monto || 0).toFixed(2)}
          </span>
        </div>
      </div>
    )}

    <div className="border-t pt-3 flex justify-between">
      <span className="font-bold text-gray-800">Total:</span>
      <span className="font-bold text-xl text-teal-600">${Number(detalleCompleto.total).toFixed(2)}</span>
    </div>

    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Monto pagado:</span>
      <span className={`font-medium ${detalleCompleto.monto_pagado >= detalleCompleto.total ? 'text-green-600' : 'text-orange-600'}`}>
        ${Number(detalleCompleto.monto_pagado).toFixed(2)}</span>
    </div>

    {detalleCompleto.cambio > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Cambio devuelto:</span>
        <span className="font-medium text-blue-600">${Number(detalleCompleto.cambio).toFixed(2)}</span>
      </div>
    )}

    {detalleCompleto.estado === 'Pendiente' && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-yellow-800">Monto pendiente:</span>
          <span className="font-bold text-lg text-red-600">
            ${(Number(detalleCompleto.total) - Number(detalleCompleto.monto_pagado)).toFixed(2)}
          </span>
        </div>
      </div>
    )}
  </div>
</div>

          {/* Notas */}
          {detalleCompleto.notas && (
            <div>
              <div className="flex items-center space-x-2 text-gray-700 font-bold mb-2">
                <FileText size={18} />
                <h4>Notas</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{detalleCompleto.notas}</p>
              </div>
            </div>
          )}
        </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center sticky bottom-0">
              <button
                onClick={handleDescargarPDF}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                <Download size={18} />
                <span>Descargar Comprobante</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium"
              >
                Cerrar
              </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleVenta;