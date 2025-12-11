const db = require('./config/connection');
const initDatabase = require('./schemas/initSchemas');

// Importar todos los modelos
const ventasModel = require('./models/ventas.model');
const productosModel = require('./models/productos.model');
const gastosModel = require('./models/gastos.model');
const deudasModel = require('./models/deudas.model');
const deudasClientesModel = require('./models/deudasClientes.model');
const clientesModel = require('./models/clientes.model');

// Inicializar la base de datos
initDatabase();

// Exportar todo de forma organizada
module.exports = {
  // Base de datos
  db,

  // ==================== VENTAS ====================
  ventas: {
    generarNumeroVenta: ventasModel.generarNumeroVenta,
    crear: ventasModel.crearVenta,
    obtener: ventasModel.obtenerVentas,
    obtenerPorId: ventasModel.obtenerVentaPorId,
    buscar: ventasModel.buscarVentas,
    obtenerEstadisticas: ventasModel.obtenerEstadisticasVentas,
    cancelar: ventasModel.cancelarVenta
  },

  // ==================== PRODUCTOS / INVENTARIO ====================
  productos: {
    agregar: productosModel.agregarProducto,
    obtener: productosModel.obtenerProductos,
    obtenerPorCategoria: productosModel.obtenerProductosPorCategoria,
    buscar: productosModel.buscarProductos,
    actualizar: productosModel.actualizarProducto,
    eliminar: productosModel.eliminarProducto,
    obtenerEstadisticas: productosModel.obtenerEstadisticasInventario,
    actualizarStockVariante: productosModel.actualizarStockVariante
  },

  // ==================== GASTOS ====================
  gastos: {
    agregar: gastosModel.agregarGasto,
    obtener: gastosModel.obtenerGastos,
    obtenerPorCategoria: gastosModel.obtenerGastosPorCategoria,
    obtenerPorFecha: gastosModel.obtenerGastosPorFecha,
    buscar: gastosModel.buscarGastos,
    actualizar: gastosModel.actualizarGasto,
    eliminar: gastosModel.eliminarGasto,
    obtenerEstadisticas: gastosModel.obtenerEstadisticasGastos,
    obtenerTotal: gastosModel.obtenerTotalGastos,
    obtenerMesActual: gastosModel.obtenerGastosMesActual
  },

  // ==================== DEUDAS (PROVEEDORES) ====================
  deudas: {
    agregar: deudasModel.agregarDeuda,
    obtener: deudasModel.obtenerDeudas,
    obtenerPendientes: deudasModel.obtenerDeudasPendientes,
    obtenerPorId: deudasModel.obtenerDeudaPorId,
    registrarPago: deudasModel.registrarPagoDeuda,
    actualizar: deudasModel.actualizarDeuda,
    eliminar: deudasModel.eliminarDeuda,
    buscar: deudasModel.buscarDeudas,
    obtenerEstadisticas: deudasModel.obtenerEstadisticasDeudas,
    obtenerHistorialPagos: deudasModel.obtenerHistorialPagos
  },

  // ==================== DEUDAS DE CLIENTES ====================
  deudasClientes: {
    obtener: deudasClientesModel.obtenerDeudasClientes,
    obtenerPorId: deudasClientesModel.obtenerDeudaClientePorId,
    registrarAbono: deudasClientesModel.registrarAbonoDeudaCliente,
    obtenerPorCliente: deudasClientesModel.obtenerDeudasPorCliente,
    buscar: deudasClientesModel.buscarDeudasClientes,
    obtenerEstadisticas: deudasClientesModel.obtenerEstadisticasDeudasClientes,
    obtenerHistorialAbonos: deudasClientesModel.obtenerHistorialAbonos
  },

  // ==================== CLIENTES ====================
  clientes: {
    agregar: clientesModel.agregarCliente,
    obtener: clientesModel.obtenerClientes,
    obtenerPorId: clientesModel.obtenerClientePorId,
    obtenerPorCedula: clientesModel.obtenerClientePorCedula,
    buscar: clientesModel.buscarClientes,
    actualizar: clientesModel.actualizarCliente,
    eliminar: clientesModel.eliminarCliente,
    actualizarEstadisticas: clientesModel.actualizarEstadisticasCliente,
    obtenerEstadisticas: clientesModel.obtenerEstadisticasCliente,
    obtenerTop: clientesModel.obtenerTopClientes
  },

  // ==================== EXPORTACIONES LEGACY (compatibilidad con código anterior) ====================
  // Ventas
  generarNumeroVenta: ventasModel.generarNumeroVenta,
  crearVenta: ventasModel.crearVenta,
  obtenerVentas: ventasModel.obtenerVentas,
  obtenerVentaPorId: ventasModel.obtenerVentaPorId,
  buscarVentas: ventasModel.buscarVentas,
  obtenerEstadisticasVentas: ventasModel.obtenerEstadisticasVentas,
  cancelarVenta: ventasModel.cancelarVenta,

  // Productos
  agregarProducto: productosModel.agregarProducto,
  obtenerProductos: productosModel.obtenerProductos,
  obtenerProductosPorCategoria: productosModel.obtenerProductosPorCategoria,
  buscarProductos: productosModel.buscarProductos,
  actualizarProducto: productosModel.actualizarProducto,
  eliminarProducto: productosModel.eliminarProducto,
  obtenerEstadisticasInventario: productosModel.obtenerEstadisticasInventario,
  actualizarStockVariante: productosModel.actualizarStockVariante,

  // Gastos
  agregarGasto: gastosModel.agregarGasto,
  obtenerGastos: gastosModel.obtenerGastos,
  obtenerGastosPorCategoria: gastosModel.obtenerGastosPorCategoria,
  obtenerGastosPorFecha: gastosModel.obtenerGastosPorFecha,
  buscarGastos: gastosModel.buscarGastos,
  actualizarGasto: gastosModel.actualizarGasto,
  eliminarGasto: gastosModel.eliminarGasto,
  obtenerEstadisticasGastos: gastosModel.obtenerEstadisticasGastos,
  obtenerTotalGastos: gastosModel.obtenerTotalGastos,
  obtenerGastosMesActual: gastosModel.obtenerGastosMesActual,

  // Deudas
  agregarDeuda: deudasModel.agregarDeuda,
  obtenerDeudas: deudasModel.obtenerDeudas,
  obtenerDeudasPendientes: deudasModel.obtenerDeudasPendientes,
  obtenerDeudaPorId: deudasModel.obtenerDeudaPorId,
  registrarPagoDeuda: deudasModel.registrarPagoDeuda,
  actualizarDeuda: deudasModel.actualizarDeuda,
  eliminarDeuda: deudasModel.eliminarDeuda,
  buscarDeudas: deudasModel.buscarDeudas,
  obtenerEstadisticasDeudas: deudasModel.obtenerEstadisticasDeudas,
  obtenerHistorialPagos: deudasModel.obtenerHistorialPagos,

  // Deudas de clientes
  obtenerDeudasClientes: deudasClientesModel.obtenerDeudasClientes,
  obtenerDeudaClientePorId: deudasClientesModel.obtenerDeudaClientePorId,
  registrarAbonoDeudaCliente: deudasClientesModel.registrarAbonoDeudaCliente,
  obtenerDeudasPorCliente: deudasClientesModel.obtenerDeudasPorCliente,
  buscarDeudasClientes: deudasClientesModel.buscarDeudasClientes,
  obtenerEstadisticasDeudasClientes: deudasClientesModel.obtenerEstadisticasDeudasClientes,
  obtenerHistorialAbonos: deudasClientesModel.obtenerHistorialAbonos,

  // Clientes
  agregarCliente: clientesModel.agregarCliente,
  obtenerClientes: clientesModel.obtenerClientes,
  obtenerClientePorId: clientesModel.obtenerClientePorId,
  obtenerClientePorCedula: clientesModel.obtenerClientePorCedula,
  buscarClientes: clientesModel.buscarClientes,
  actualizarCliente: clientesModel.actualizarCliente,
  eliminarCliente: clientesModel.eliminarCliente,
  actualizarEstadisticasCliente: clientesModel.actualizarEstadisticasCliente,
  obtenerEstadisticasCliente: clientesModel.obtenerEstadisticasCliente,
  obtenerTopClientes: clientesModel.obtenerTopClientes
};