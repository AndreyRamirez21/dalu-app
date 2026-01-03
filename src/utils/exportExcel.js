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

      // ✅ SUMAR TODOS LOS COSTOS ADICIONALES DEL PRODUCTO
      const totalCostosAdicionales = (producto.costos_adicionales || [])
        .reduce((sum, costo) => sum + (costo.monto || 0), 0);

      // ✅ Costo total = costo base + costos adicionales
      const costoTotal = (producto.costo_base || 0) + totalCostosAdicionales;

      // ✅ Margen real usando el costo total
      const margenReal = precioFinal > 0
        ? (((precioFinal - costoTotal) / precioFinal) * 100).toFixed(1)
        : 0;

      // ✅ Ganancia bruta por unidad
      const gananciaBruta = precioFinal - costoTotal;

      return {
        Referencia: producto.referencia,
        Nombre: producto.nombre,
        Categoría: producto.categoria,
        Talla: variante.talla,
        Stock: variante.cantidad,
        CostoBase: producto.costo_base,
        CostosExtras: totalCostosAdicionales,
        CostoTotal: costoTotal,
        PrecioVenta: precioFinal,
        GananciaBruta: gananciaBruta,
        AjustePrecio: variante.ajuste_precio || 0,
        Margen: margenReal + "%",
      };
    })
  );

  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.json_to_sheet(datosExcel);

  // ===== AGREGAR FILA DE TOTALES =====
  const totalStock = datosExcel.reduce((sum, item) => sum + item.Stock, 0);
  const totalCostoBase = datosExcel.reduce((sum, item) => sum + item.CostoBase * item.Stock, 0);
  const totalCostosExtras = datosExcel.reduce((sum, item) => sum + item.CostosExtras * item.Stock, 0);
  const totalCostoTotal = datosExcel.reduce((sum, item) => sum + item.CostoTotal * item.Stock, 0);
  const totalPrecioVenta = datosExcel.reduce((sum, item) => sum + item.PrecioVenta * item.Stock, 0);
  const totalGananciaBruta = datosExcel.reduce((sum, item) => sum + item.GananciaBruta * item.Stock,0);
  const filaTotales = datosExcel.length + 1;

  XLSX.utils.sheet_add_aoa(hoja, [[
    "", "", "", "TOTALES",
    totalStock,
    totalCostoBase,
    totalCostosExtras,
    totalCostoTotal,
    totalPrecioVenta,
    totalGananciaBruta
  ]], {
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
  for (let C = 3; C <= 11; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: filaTotales, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "FFF2CC" } },
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

  hoja["!cols"] = Object.keys(datosExcel[0]).map((key) => ({ wch: key.length + 5 }));

  XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
  XLSX.writeFile(libro, "inventario_Dalu.xlsx");
}


// ✅ EXPORTAR VENTAS A EXCEL - VERSIÓN CORREGIDA
export function exportarVentasExcel(ventas) {
  const datosExcel = ventas.map((venta) => {
    const montoPendiente = venta.total - venta.monto_pagado;

    let productosDetalle = '';
    let subtotalPropios = 0;
    let subtotalMarcas = 0;

    if (venta.items && venta.items.length > 0) {
      productosDetalle = venta.items.map(item => {
        const tallaStr = item.talla ? ` (${item.talla})` : '';
        const tipoStr = item.tipo !== 'Propio' ? ` - ${item.tipo}` : '';

        const subtotalItem = item.cantidad * item.precio;
        if (item.tipo === 'Propio') {
          subtotalPropios += subtotalItem;
        } else {
          subtotalMarcas += subtotalItem;
        }

        return `${item.cantidad}x ${item.nombre}${tallaStr}${tipoStr}`;
      }).join(', ');
    } else {
      productosDetalle = 'Sin productos';
    }

    const costosAdicionalesReales = venta.total - (subtotalPropios + subtotalMarcas) + (venta.descuento_monto || 0);

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
      Productos: productosDetalle,
      CantidadTotal: venta.total_productos || 0,
      SubtotalPropios: subtotalPropios,
      SubtotalMarcas: subtotalMarcas,
      CostosAdicionales: costosAdicionalesReales,
      Descuento: -(venta.descuento_monto || 0), // Negativo para mostrar como resta
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
  const totalSubtotalPropios = datosExcel.reduce((sum, item) => sum + (item.SubtotalPropios || 0), 0);
  const totalSubtotalMarcas = datosExcel.reduce((sum, item) => sum + (item.SubtotalMarcas || 0), 0);
  const totalCostosAdicionales = datosExcel.reduce((sum, item) => sum + (item.CostosAdicionales || 0), 0);
  const totalDescuento = datosExcel.reduce((sum, item) => sum + (item.Descuento || 0), 0); // Ya viene negativo
  const totalVentas = datosExcel.reduce((sum, item) => sum + (item.Total || 0), 0);
  const totalPagado = datosExcel.reduce((sum, item) => sum + (item.MontoPagado || 0), 0);
  const totalCambio = datosExcel.reduce((sum, item) => sum + (item.Cambio || 0), 0);
  const totalPendiente = datosExcel.reduce((sum, item) => sum + (item.Pendiente || 0), 0);

  const filaTotales = datosExcel.length + 1;

  // Agregar fila de totales (16 columnas)
  XLSX.utils.sheet_add_aoa(hoja, [[
    "", // NumeroVenta
    "", // Fecha
    "", // Cliente
    "TOTALES", // Productos
    "", // CantidadTotal
    totalSubtotalPropios, // SubtotalPropios
    totalSubtotalMarcas, // SubtotalMarcas
    totalCostosAdicionales, // CostosAdicionales
    totalDescuento, // Descuento
    totalVentas, // Total
    totalPagado, // MontoPagado
    totalCambio, // Cambio
    totalPendiente, // Pendiente
    "", // MetodoPago
    "", // Estado
    "" // Notas
  ]], {
    origin: { r: filaTotales, c: 0 }
  });

  // Actualizar rango después de agregar totales
  hoja["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: filaTotales, c: 15 }
  });

  // ----- ESTILOS DE HEADER -----
  for (let C = 0; C <= 15; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "0D9488" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
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
  for (let C = 0; C <= 15; C++) {
    const cell = hoja[XLSX.utils.encode_cell({ r: filaTotales, c: C })];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: "FFF2CC" } },
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
  const colEstado = 14;
  for (let R = 1; R < filaTotales; R++) {
    const cellEstado = hoja[XLSX.utils.encode_cell({ r: R, c: colEstado })];
    if (cellEstado) {
      const estado = cellEstado.v;
      let bgColor = "FFFFFF";

      if (estado === "Pagado") bgColor = "D1FAE5";
      else if (estado === "Pendiente") bgColor = "FEF3C7";
      else if (estado === "Cancelado") bgColor = "FEE2E2";

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
  for (let R = 0; R <= filaTotales; R++) {
    for (let C = 0; C <= 15; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = hoja[cellAddr];
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
    { wch: 50 }, // Productos
    { wch: 13 }, // CantidadTotal
    { wch: 15 }, // SubtotalPropios
    { wch: 15 }, // SubtotalMarcas
    { wch: 17 }, // CostosAdicionales
    { wch: 12 }, // Descuento
    { wch: 12 }, // Total
    { wch: 14 }, // MontoPagado
    { wch: 10 }, // Cambio
    { wch: 12 }, // Pendiente
    { wch: 14 }, // MetodoPago
    { wch: 12 }, // Estado
    { wch: 30 }, // Notas
  ];

  XLSX.utils.book_append_sheet(libro, hoja, "Ventas");

  const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
  XLSX.writeFile(libro, `ventas_Dalu_${fecha}.xlsx`);
}