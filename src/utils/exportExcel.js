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