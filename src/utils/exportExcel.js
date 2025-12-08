import * as XLSX from "sheetjs-style";

// --- Función margen ---
export function calcularMargen(costo, precioVenta) {
  if (!costo || !precioVenta) return 0;
  return (((precioVenta - costo) / precioVenta) * 100).toFixed(1);
}

export function exportarInventarioExcel(productos) {

  const datosExcel = productos.flatMap((producto) =>
    (producto.variantes || []).map((variante) => {
      const precioFinal =
        (producto.precio_venta_base || 0) +
        (variante.ajuste_precio || 0);

      return {
        Referencia: producto.referencia,
        Nombre: producto.nombre,
        Categoría: producto.categoria,
        Talla: variante.talla,
        Stock: variante.cantidad,
        CostoBase: producto.costo_base,
        PrecioVenta: precioFinal,
        AjustePrecio: variante.ajuste_precio || 0,
        Margen: (((precioFinal - producto.costo_base) / precioFinal) * 100).toFixed(1) + "%",
      };
    })
  );

  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.json_to_sheet(datosExcel);

  // ===== AGREGAR FILA DE TOTALES =====
  const totalStock = datosExcel.reduce((sum, item) => sum + item.Stock, 0);
  const totalCosto = datosExcel.reduce((sum, item) => sum + item.CostoBase, 0);
  const totalPrecioVenta = datosExcel.reduce((sum, item) => sum + item.PrecioVenta, 0);

  const filaTotales = datosExcel.length + 1; // Siguiente fila después de los datos

  // Agregar etiqueta "TOTALES" en la columna de Talla
  XLSX.utils.sheet_add_aoa(hoja, [["", "", "", "TOTALES", totalStock, totalCosto, totalPrecioVenta]], {
    origin: { r: filaTotales, c: 0 }
  });

  const range = XLSX.utils.decode_range(hoja["!ref"]);

  // ----- ESTILOS DE HEADER -----
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: 0, c: C })];
    cell.s = {
      fill: { fgColor: { rgb: "D9E1F2" } },
      font: { bold: true },
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
  }

  // ----- ESTILOS PARA FILA DE TOTALES -----
  for (let C = 3; C <= 6; C++) { // Desde columna "Talla" hasta "PrecioVenta"
    const cell = hoja[XLSX.utils.encode_cell({ r: filaTotales, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "FFF2CC" } }, // Fondo amarillo claro
        font: { bold: true },
        alignment: { horizontal: C === 3 ? "left" : "center" },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  // ----- BORDES PARA TODAS LAS CELDAS -----
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = hoja[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell) {
        cell.s = {
          ...cell.s,
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }
  }

  // Auto ancho
  hoja["!cols"] = Object.keys(datosExcel[0]).map((key) => ({ wch: key.length + 5 }));

  XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
  XLSX.writeFile(libro, "inventario_Dalu.xlsx");
}



// Exportar ventas a Excel
export function exportarVentasExcel(ventas) {
  const datosExcel = ventas.map((venta) => {
    const montoPendiente = venta.total - venta.monto_pagado;

    return {
      NumeroVenta: venta.numero_venta,
      Fecha: new Date(venta.fecha).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      Cliente: venta.cliente_nombre || 'Cliente General',
      Productos: venta.total_productos + ' producto(s)',
      Subtotal: venta.subtotal || 0,
      CostosAdicionales: (venta.total - (venta.subtotal || 0)),
      Total: venta.total,
      MontoPagado: venta.monto_pagado,
      Cambio: venta.cambio || 0,
      Pendiente: montoPendiente,
      MetodoPago: venta.metodo_pago,
      Estado: venta.estado,
      Notas: venta.notas || ''
    };
  });

  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.json_to_sheet(datosExcel);

  // ===== CALCULAR TOTALES =====
  const totalSubtotal = datosExcel.reduce((sum, item) => sum + item.Subtotal, 0);
  const totalCostosAdicionales = datosExcel.reduce((sum, item) => sum + item.CostosAdicionales, 0);
  const totalVentas = datosExcel.reduce((sum, item) => sum + item.Total, 0);
  const totalPagado = datosExcel.reduce((sum, item) => sum + item.MontoPagado, 0);
  const totalCambio = datosExcel.reduce((sum, item) => sum + item.Cambio, 0);
  const totalPendiente = datosExcel.reduce((sum, item) => sum + item.Pendiente, 0);

  const filaTotales = datosExcel.length + 1;

  // Agregar fila de totales
  XLSX.utils.sheet_add_aoa(hoja, [[
    "", "", "", "TOTALES",
    totalSubtotal,
    totalCostosAdicionales,
    totalVentas,
    totalPagado,
    totalCambio,
    totalPendiente,
    "", "", ""
  ]], {
    origin: { r: filaTotales, c: 0 }
  });

  const range = XLSX.utils.decode_range(hoja["!ref"]);

  // ----- ESTILOS DE HEADER -----
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "0D9488" } }, // Teal
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // ----- ESTILOS PARA FILA DE TOTALES -----
  for (let C = 0; C <= range.e.c; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: filaTotales, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "FFF2CC" } }, // Amarillo claro
        font: { bold: true },
        alignment: { horizontal: C === 3 ? "left" : "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // ----- COLOREAR ESTADOS -----
  const colEstado = 11; // Columna "Estado"
  for (let R = 1; R < filaTotales; R++) {
    const cellEstado = hoja[XLSX.utils.encode_cell({ r: R, c: colEstado })];
    if (cellEstado) {
      const estado = cellEstado.v;
      let bgColor = "FFFFFF";

      if (estado === "Pagado") bgColor = "D1FAE5"; // Verde claro
      else if (estado === "Pendiente") bgColor = "FEF3C7"; // Amarillo claro
      else if (estado === "Cancelado") bgColor = "FEE2E2"; // Rojo claro

      cellEstado.s = {
        fill: { fgColor: { rgb: bgColor } },
        font: { bold: true },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  // ----- BORDES PARA TODAS LAS CELDAS -----
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = hoja[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && !cell.s) {
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
          },
        };
      }
    }
  }

  // ----- AUTO ANCHO DE COLUMNAS -----
  hoja["!cols"] = [
    { wch: 15 }, // NumeroVenta
    { wch: 18 }, // Fecha
    { wch: 25 }, // Cliente
    { wch: 12 }, // Productos
    { wch: 12 }, // Subtotal
    { wch: 16 }, // CostosAdicionales
    { wch: 12 }, // Total
    { wch: 14 }, // MontoPagado
    { wch: 10 }, // Cambio
    { wch: 12 }, // Pendiente
    { wch: 14 }, // MetodoPago
    { wch: 12 }, // Estado
    { wch: 30 }, // Notas
  ];

  XLSX.utils.book_append_sheet(libro, hoja, "Ventas");

  // Generar nombre de archivo con fecha
  const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
  XLSX.writeFile(libro, `ventas_Dalu_${fecha}.xlsx`);
}