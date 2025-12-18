// src/components/sections/marcas/FormularioMarca.jsx
import React from 'react';
import { ArrowLeft, Save, Store, User, Phone, Mail, Percent, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

export const FormularioMarca = ({ marcasAliadas }) => {
  const esEdicion = marcasAliadas.vista === 'editar';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (esEdicion) {
      marcasAliadas.handleActualizarMarca();
    } else {
      marcasAliadas.handleGuardarMarca();
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={marcasAliadas.handleCancelar}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {esEdicion ? 'Editar Marca Aliada' : 'Nueva Marca Aliada'}
            </h2>
            <p className="text-gray-600 mt-1">
              {esEdicion
                ? 'Actualiza la información de la marca'
                : 'Completa los datos de la nueva marca'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8">
          {/* Información básica */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Store className="mr-2 text-purple-600" size={20} />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la marca */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={marcasAliadas.formularioMarca.nombre}
                  onChange={marcasAliadas.handleInputMarcaChange}
                  placeholder="Ej: Marca Premium"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Estado activo */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={marcasAliadas.formularioMarca.activo}
                    onChange={marcasAliadas.handleInputMarcaChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    {marcasAliadas.formularioMarca.activo ? (
                      <ToggleRight className="text-green-500" size={32} />
                    ) : (
                      <ToggleLeft className="text-gray-400" size={32} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Marca {marcasAliadas.formularioMarca.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="mb-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <User className="mr-2 text-purple-600" size={20} />
              Información de Contacto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre del contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Contacto
                </label>
                <input
                  type="text"
                  name="contacto_nombre"
                  value={marcasAliadas.formularioMarca.contacto_nombre}
                  onChange={marcasAliadas.handleInputMarcaChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="contacto_telefono"
                    value={marcasAliadas.formularioMarca.contacto_telefono}
                    onChange={marcasAliadas.handleInputMarcaChange}
                    placeholder="Ej: +57 300 123 4567"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="contacto_email"
                    value={marcasAliadas.formularioMarca.contacto_email}
                    onChange={marcasAliadas.handleInputMarcaChange}
                    placeholder="Ej: contacto@marca.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información comercial */}
          <div className="mb-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Percent className="mr-2 text-purple-600" size={20} />
              Información Comercial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Porcentaje de comisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de Comisión (%)
                </label>
                <input
                  type="number"
                  name="porcentaje_comision"
                  value={marcasAliadas.formularioMarca.porcentaje_comision}
                  onChange={marcasAliadas.handleInputMarcaChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ej: 15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje que se queda la marca de cada venta
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="mb-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-purple-600" size={20} />
              Notas Adicionales
            </h3>

            <textarea
              name="notas"
              value={marcasAliadas.formularioMarca.notas}
              onChange={marcasAliadas.handleInputMarcaChange}
              placeholder="Agrega cualquier información adicional sobre la marca..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={marcasAliadas.handleCancelar}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium"
            >
              <Save size={20} />
              <span>{esEdicion ? 'Actualizar' : 'Guardar'} Marca</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};