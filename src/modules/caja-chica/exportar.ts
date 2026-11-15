import { dinero, fechaCorta, fechaHora, hoyISO } from '../../lib/format';
import { calcularTotales, textoDiferencia } from './calculos';
import type { Movimiento, SesionCompleta } from './types';

// Exportar el detalle de una sesión a PDF o Excel (CSV) y compartirlo.

const nombreArchivo = (s: SesionCompleta, ext: string) => `caja-chica-${hoyISO(new Date(s.opened_at))}.${ext}`;

const tipoTexto = (m: Movimiento) => (m.kind === 'abono' ? 'Abono' : m.type === 'cliente' ? 'Cliente' : 'Taller');

// En los archivos se usa el guion normal para que se lea bien en cualquier programa.
const plano = (n: number) => dinero(n).replace('−', '-');

function ordenados(s: SesionCompleta): Movimiento[] {
  return [...s.movimientos].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Archivo CSV: se abre directo en Excel o Google Sheets. */
export function crearCSV(s: SesionCompleta): File {
  const t = calcularTotales(s);
  const celda = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const fila = (...c: (string | number | null)[]) => c.map(celda).join(',');

  const lineas = [
    fila('Llavecita - Caja Chica'),
    fila('Apertura', fechaHora(s.opened_at)),
    fila('Cierre', s.closed_at ? fechaHora(s.closed_at) : 'Caja abierta'),
    '',
    fila('Fecha y hora', 'Clase', 'Tipo', 'Descripción', 'Vehículo', 'Registrado por', 'Monto (USD)'),
    ...ordenados(s).map((m) =>
      fila(fechaHora(m.created_at), m.kind === 'abono' ? 'Abono' : 'Gasto', tipoTexto(m), m.description, m.vehicle, m.registered_by, m.amount.toFixed(2)),
    ),
    '',
    fila('Monto inicial', '', '', '', '', '', t.inicial.toFixed(2)),
    fila('Total abonos', '', '', '', '', '', t.abonos.toFixed(2)),
    fila('Total gastos', '', '', '', '', '', t.gastos.toFixed(2)),
    fila('Gastos de clientes', '', '', '', '', '', t.gastosCliente.toFixed(2)),
    fila('Gastos del taller', '', '', '', '', '', t.gastosTaller.toFixed(2)),
    fila('Saldo esperado', '', '', '', '', '', t.saldo.toFixed(2)),
  ];
  if (s.counted_amount != null && t.diferencia != null) {
    lineas.push(fila('Efectivo contado', '', '', '', '', '', s.counted_amount.toFixed(2)));
    lineas.push(fila(`Diferencia (${textoDiferencia(t.diferencia)})`, '', '', '', '', '', t.diferencia.toFixed(2)));
  }
  // El "BOM" del inicio hace que Excel muestre bien los acentos.
  return new File(['﻿' + lineas.join('\r\n')], nombreArchivo(s, 'csv'), { type: 'text/csv' });
}

/** Archivo PDF con el resumen y la tabla de movimientos. */
export async function crearPDF(s: SesionCompleta): Promise<File> {
  // Se cargan solo cuando se necesitan, para que la app abra más rápido.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const t = calcularTotales(s);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 138, 31);
  doc.rect(0, 0, ancho, 78, 'F');
  doc.setTextColor(11, 46, 56);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Llavecita · Caja Chica', 40, 38);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Apertura: ${fechaHora(s.opened_at)}     Cierre: ${s.closed_at ? fechaHora(s.closed_at) : 'Caja abierta'}`,
    40,
    60,
  );

  const resumen: [string, string][] = [
    ['Monto inicial', plano(t.inicial)],
    ['Total abonos', plano(t.abonos)],
    ['Total gastos', plano(t.gastos)],
    ['   Gastos de clientes', plano(t.gastosCliente)],
    ['   Gastos del taller', plano(t.gastosTaller)],
    ['Saldo esperado', plano(t.saldo)],
  ];
  if (s.counted_amount != null && t.diferencia != null) {
    resumen.push(['Efectivo contado', plano(s.counted_amount)]);
    resumen.push([`Diferencia (${textoDiferencia(t.diferencia)})`, plano(t.diferencia)]);
  }

  autoTable(doc, {
    startY: 98,
    head: [['Resumen', 'USD']],
    body: resumen,
    theme: 'grid',
    tableWidth: 300,
    styles: { fontSize: 10, cellPadding: 5, textColor: [15, 61, 74] },
    headStyles: { fillColor: [15, 61, 74], textColor: [255, 246, 233] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  const finResumen = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: finResumen + 22,
    head: [['Hora', 'Tipo', 'Descripción', 'Vehículo', 'Registró', 'Monto']],
    body: ordenados(s).map((m) => [
      fechaHora(m.created_at),
      tipoTexto(m),
      m.description,
      m.vehicle ?? '',
      m.registered_by ?? '',
      `${m.kind === 'abono' ? '+' : '-'}${plano(m.amount)}`,
    ]),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 5, textColor: [15, 61, 74] },
    headStyles: { fillColor: [255, 138, 31], textColor: [11, 46, 56] },
    alternateRowStyles: { fillColor: [255, 246, 233] },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
  });

  return new File([doc.output('blob')], nombreArchivo(s, 'pdf'), { type: 'application/pdf' });
}

/** Texto corto para mandar por WhatsApp. */
export function resumenTexto(s: SesionCompleta): string {
  const t = calcularTotales(s);
  const lineas = [
    `*Caja Chica · ${fechaCorta(s.opened_at)}*`,
    `Inicial: ${plano(t.inicial)}`,
    `Abonos: ${plano(t.abonos)}`,
    `Gastos: ${plano(t.gastos)} (Cliente ${plano(t.gastosCliente)} · Taller ${plano(t.gastosTaller)})`,
    `Saldo esperado: ${plano(t.saldo)}`,
  ];
  if (s.counted_amount != null && t.diferencia != null) {
    lineas.push(`Contado: ${plano(s.counted_amount)}`);
    lineas.push(t.diferencia === 0 ? 'La caja cuadró cabal.' : `${textoDiferencia(t.diferencia)}: ${plano(Math.abs(t.diferencia))}`);
  }
  return lineas.join('\n');
}
