// src/utils/generarPDFVenta.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========== IMPORTAR LOGO DIRECTAMENTE ==========
// Esto funciona tanto en desarrollo como en producción
import logoImg from '../assets/images/logooo1.png';

export const generarPDFVenta = async (venta) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margenInferior = 25; // Espacio reservado para el pie de página

  // ========== AGREGAR LOGO ==========
  try {
    const logoWidth = 30;
    const logoHeight = 30;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoImg, 'PNG', logoX, 10, logoWidth, logoHeight);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // ========== ENCABEZADO ==========
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 184, 166);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Comprobante de Venta', pageWidth / 2, 48, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 60, pageWidth - 20, 60);

  // ========== INFORMACIÓN DE LA VENTA ==========
  let yPos = 68;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(`Venta: ${venta.numero_venta}`, 20, yPos);

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth - 20, yPos, { align: 'right' });

  yPos += 10;

  doc.text(`Cliente: ${venta.cliente_nombre || 'Cliente General'}`, 20, yPos);

  const estadoColor = venta.estado === 'Pagado' ? [34, 197, 94] :
                      venta.estado === 'Pendiente' ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(...estadoColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado: ${venta.estado}`, pageWidth - 20, yPos, { align: 'right' });

  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Método de pago: ${venta.metodo_pago || 'No especificado'}`, 20, yPos);

  yPos += 15;

  // ========== FUNCIÓN PARA PIE DE PÁGINA ==========
  const agregarPieDePagina = (numeroPagina, totalPaginas) => {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gracias por su compra', pageWidth / 2, footerY, { align: 'center' });
    doc.text(
      `Generado el ${new Date().toLocaleString('es-CO')} | Página ${numeroPagina} de ${totalPaginas}`,
      pageWidth / 2,
      footerY + 4,
      { align: 'center' }
    );
  };

  // ========== PRODUCTOS PROPIOS ==========
  if (venta.productos_propios && venta.productos_propios.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Productos Propios', 20, yPos);
    yPos += 7;

    const productosData = venta.productos_propios.map(p => [
      p.producto_nombre || 'Sin nombre',
      p.talla || '-',
      p.cantidad.toString(),
      `${Number(p.precio_unitario).toFixed(2)}`,
      `${Number(p.subtotal).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Talla', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: productosData,
      theme: 'grid',
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { bottom: margenInferior },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 184, 166);
          doc.text('DALÚ', 20, 15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Venta: ${venta.numero_venta}`, 20, 22);
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ========== PRODUCTOS DE MARCAS ALIADAS ==========
  if (venta.productos_marca_aliada && venta.productos_marca_aliada.length > 0) {
    if (yPos > pageHeight - margenInferior - 40) {
      doc.addPage();
      yPos = 30;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 184, 166);
      doc.text('DALÚ', 20, 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Venta: ${venta.numero_venta}`, 20, 22);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(147, 51, 234);
    doc.text('Productos de Marcas Aliadas', 20, yPos);
    yPos += 7;

    const marcasData = venta.productos_marca_aliada.map(p => [
      p.producto_nombre || 'Sin nombre',
      p.marca_nombre,
      p.talla || '-',
      p.cantidad.toString(),
      `${Number(p.precio_unitario).toFixed(2)}`,
      `${Number(p.subtotal).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Marca', 'Talla', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: marcasData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { bottom: margenInferior },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 184, 166);
          doc.text('DALÚ', 20, 15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Venta: ${venta.numero_venta}`, 20, 22);
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ========== VERIFICAR ESPACIO PARA RESUMEN FINANCIERO ==========
  const alturaResumen = 70;
  if (yPos > pageHeight - margenInferior - alturaResumen) {
    doc.addPage();
    yPos = 30;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 184, 166);
    doc.text('DALÚ', 20, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Venta: ${venta.numero_venta}`, 20, 22);
  }

  // ========== RESUMEN FINANCIERO ==========
  yPos += 5;
  const boxX = pageWidth - 90;
  const boxWidth = 70;

  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, yPos - 5, boxWidth, 60, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Resumen Financiero', boxX + 5, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text('Subtotal propios:', boxX + 5, yPos);
  doc.text(`$${Number(venta.subtotal || 0).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
  yPos += 6;

  if (venta.productos_marca_aliada && venta.productos_marca_aliada.length > 0) {
    const totalMarcas = venta.productos_marca_aliada.reduce((sum, p) => sum + Number(p.subtotal), 0);
    doc.setTextColor(147, 51, 234);
    doc.text('Marcas aliadas:', boxX + 5, yPos);
    doc.text(`$${totalMarcas.toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
    yPos += 6;
    doc.setTextColor(60, 60, 60);
  }

  if (venta.total_costos_adicionales > 0) {
    doc.text('Costos adicionales:', boxX + 5, yPos);
    doc.text(`$${Number(venta.total_costos_adicionales).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
    yPos += 6;
  }

  if (venta.descuento_monto > 0) {
    doc.setTextColor(34, 197, 94);
    doc.text(`Descuento (${venta.descuento_porcentaje}%):`, boxX + 5, yPos);
    doc.text(`-$${Number(venta.descuento_monto).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
    yPos += 6;
    doc.setTextColor(60, 60, 60);
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(boxX + 5, yPos, boxX + boxWidth - 5, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 184, 166);
  doc.text('TOTAL:', boxX + 5, yPos);
  doc.text(`$${Number(venta.total).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Pagado:', boxX + 5, yPos);
  doc.text(`$${Number(venta.monto_pagado).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
  yPos += 6;

  if (venta.cambio > 0) {
    doc.setTextColor(59, 130, 246);
    doc.text('Cambio:', boxX + 5, yPos);
    doc.text(`$${Number(venta.cambio).toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
    yPos += 6;
  }

  if (venta.estado === 'Pendiente') {
    const pendiente = Number(venta.total) - Number(venta.monto_pagado);
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text('Pendiente:', boxX + 5, yPos);
    doc.text(`$${pendiente.toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
  }

  // ========== NOTAS ==========
  if (venta.notas) {
    yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

    if (yPos > pageHeight - margenInferior - 20) {
      doc.addPage();
      yPos = 30;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 184, 166);
      doc.text('DALÚ', 20, 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Venta: ${venta.numero_venta}`, 20, 22);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Notas:', 20, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notasLines = doc.splitTextToSize(venta.notas, pageWidth - 40);
    doc.text(notasLines, 20, yPos);
  }

  // ========== AGREGAR PIE DE PÁGINA A TODAS LAS PÁGINAS ==========
  const totalPaginas = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    agregarPieDePagina(i, totalPaginas);
  }

  // ========== GUARDAR PDF ==========
  doc.save(`Comprobante_${venta.numero_venta}.pdf`);
};