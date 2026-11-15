import { diasHasta, sumar } from '../../lib/format';
import type { ClienteCompleto, Servicio, Vehiculo } from './types';

/** Un servicio de este monto o más hace que Llavecita se sorprenda. */
export const COSTO_ALTO = 200;

export function nombreVehiculo(v: Pick<Vehiculo, 'marca' | 'modelo' | 'anio' | 'placa'>): string {
  const texto = [v.marca, v.modelo, v.anio].filter(Boolean).join(' ');
  return texto || v.placa || 'Vehículo';
}

export interface ResumenCliente {
  total: number;
  pendiente: number;
  numServicios: number;
  /** Fecha del último servicio ("2026-11-13") o null */
  ultimo: string | null;
  debe: boolean;
}

export function resumenCliente(c: Pick<ClienteCompleto, 'servicios'>): ResumenCliente {
  const porCobrar = c.servicios.filter((s) => s.estado_pago !== 'pagado');
  return {
    total: sumar(c.servicios.map((s) => s.costo)),
    pendiente: sumar(porCobrar.map((s) => s.costo)),
    numServicios: c.servicios.length,
    ultimo: c.servicios.reduce<string | null>((m, s) => (!m || s.fecha > m ? s.fecha : m), null),
    debe: porCobrar.length > 0,
  };
}

/** Busca por nombre, teléfono o placa (sin importar mayúsculas, acentos, espacios ni guiones). */
const limpiar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const soloLetrasNumeros = (t: string) => limpiar(t).replace(/[^a-z0-9]/g, '');

export function coincide(c: ClienteCompleto, busqueda: string): boolean {
  const q = limpiar(busqueda.trim());
  if (!q) return true;
  const qPlano = soloLetrasNumeros(q);
  if (limpiar(c.nombre).includes(q)) return true;
  if (qPlano && [c.telefono, c.whatsapp, ...c.vehiculos.map((v) => v.placa)].some((x) => x && soloLetrasNumeros(x).includes(qPlano))) return true;
  return c.vehiculos.some((v) => limpiar(nombreVehiculo(v)).includes(q));
}

export interface Recordatorio {
  cliente: ClienteCompleto;
  vehiculo: Vehiculo;
  texto: string;
  /** true si ya se pasó la fecha o el kilometraje */
  vencido: boolean;
  orden: number;
}

/** Vehículos cuyo próximo servicio está cerca: 30 días o 500 km. */
export function recordatorios(clientes: ClienteCompleto[]): Recordatorio[] {
  const lista: Recordatorio[] = [];
  for (const cliente of clientes) {
    for (const vehiculo of cliente.vehiculos) {
      const partes: string[] = [];
      let vencido = false;
      let orden = Infinity;
      if (vehiculo.proximo_servicio_fecha) {
        const dias = diasHasta(vehiculo.proximo_servicio_fecha);
        if (dias <= 30) {
          partes.push(dias < 0 ? `venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}` : dias === 0 ? 'es hoy' : `en ${dias} ${dias === 1 ? 'día' : 'días'}`);
          vencido ||= dias < 0;
          orden = Math.min(orden, dias);
        }
      }
      if (vehiculo.proximo_servicio_km != null && vehiculo.kilometraje_actual != null) {
        const faltan = vehiculo.proximo_servicio_km - vehiculo.kilometraje_actual;
        if (faltan <= 500) {
          partes.push(faltan <= 0 ? 'ya llegó al kilometraje' : `faltan ${faltan} km`);
          vencido ||= faltan <= 0;
          orden = Math.min(orden, faltan / 20);
        }
      }
      if (partes.length) lista.push({ cliente, vehiculo, texto: `${vehiculo.proximo_servicio_nota || 'Próximo servicio'}: ${partes.join(' · ')}`, vencido, orden });
    }
  }
  return lista.sort((a, b) => a.orden - b.orden);
}

export const ordenarPorFecha = (lista: Servicio[]) => [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en));
