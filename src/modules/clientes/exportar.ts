import { dinero, fechaDia, hoyISO, km } from '../../lib/format';
import { nombreVehiculo, ordenarPorFecha, resumenCliente } from './calculos';
import type { ClienteCompleto, Servicio, Vehiculo } from './types';

const ESTADO: Record<string, string> = { pagado: 'Pagado', pendiente: 'Pendiente', abonado: 'Abonado' };
const archivoSeguro = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/** PDF con el historial de servicios de un cliente o de uno solo de sus vehículos. */
export async function crearPDFHistorial(cliente: ClienteCompleto, vehiculo?: Vehiculo): Promise<File> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const servicios = ordenarPorFecha(vehiculo ? cliente.servicios.filter((s) => s.vehiculo_id === vehiculo.id) : cliente.servicios);
  const r = resumenCliente({ servicios });
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  const deVehiculo = (s: Servicio) => cliente.vehiculos.find((v) => v.id === s.vehiculo_id);

  doc.setFillColor(255, 138, 31);
  doc.rect(0, 0, ancho, 92, 'F');
  doc.setTextColor(11, 46, 56);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Llavecita · Historial de servicios', 40, 36);
  doc.setFontSize(12);
  doc.text(cliente.nombre + (cliente.telefono ? `   ·   Tel. ${cliente.telefono}` : ''), 40, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    vehiculo
      ? [nombreVehiculo(vehiculo), vehiculo.placa ? `Placa ${vehiculo.placa}` : '', vehiculo.color ?? '', vehiculo.kilometraje_actual != null ? km(vehiculo.kilometraje_actual) : ''].filter(Boolean).join('   ·   ')
      : `${cliente.vehiculos.length} vehículo(s)`,
    40,
    76,
  );

  autoTable(doc, {
    startY: 112,
    head: [vehiculo ? ['Fecha', 'Servicio', 'Trabajo realizado', 'Km', 'Pago', 'Costo'] : ['Fecha', 'Vehículo', 'Servicio', 'Trabajo realizado', 'Pago', 'Costo']],
    body: servicios.map((s) => {
      const v = deVehiculo(s);
      const comunes = [fechaDia(s.fecha)];
      const resto = [s.tipo, s.descripcion ?? ''];
      return vehiculo
        ? [...comunes, ...resto, s.kilometraje != null ? km(s.kilometraje) : '', ESTADO[s.estado_pago], dinero(s.costo)]
        : [...comunes, v ? `${nombreVehiculo(v)}${v.placa ? ` (${v.placa})` : ''}` : '', ...resto, ESTADO[s.estado_pago], dinero(s.costo)];
    }),
    foot: [['', '', '', '', 'Total', dinero(r.total)], ...(r.pendiente > 0 ? [['', '', '', '', 'Por cobrar', dinero(r.pendiente)]] : [])],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 5, textColor: [15, 61, 74] },
    headStyles: { fillColor: [15, 61, 74], textColor: [255, 246, 233] },
    footStyles: { fillColor: [255, 246, 233], textColor: [15, 61, 74], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 246, 233] },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
  });

  const nombre = `historial-${archivoSeguro(vehiculo ? `${cliente.nombre} ${vehiculo.placa ?? nombreVehiculo(vehiculo)}` : cliente.nombre)}-${hoyISO()}.pdf`;
  return new File([doc.output('blob')], nombre, { type: 'application/pdf' });
}

/** Texto corto para acompañar el PDF en WhatsApp. */
export function resumenHistorial(cliente: ClienteCompleto, vehiculo?: Vehiculo): string {
  const servicios = vehiculo ? cliente.servicios.filter((s) => s.vehiculo_id === vehiculo.id) : cliente.servicios;
  const r = resumenCliente({ servicios });
  return [
    `*Historial de servicios · ${cliente.nombre}*`,
    vehiculo ? `${nombreVehiculo(vehiculo)}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}` : null,
    `${r.numServicios} servicio(s) · Total ${dinero(r.total)}`,
    r.pendiente > 0 ? `Por cobrar: ${dinero(r.pendiente)}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
