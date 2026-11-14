import { sumar } from '../../lib/format';
import type { Movimiento, SesionCompleta } from './types';

export interface Totales {
  inicial: number;
  abonos: number;
  gastos: number;
  gastosCliente: number;
  gastosTaller: number;
  /** Saldo = monto inicial + abonos − gastos */
  saldo: number;
  /** Efectivo contado − saldo esperado (solo en cajas cerradas) */
  diferencia: number | null;
  numGastos: number;
  numAbonos: number;
}

const montos = (lista: Movimiento[]) => lista.map((m) => m.amount);

export function calcularTotales(sesion: Pick<SesionCompleta, 'opening_amount' | 'counted_amount' | 'movimientos'>): Totales {
  const vigentes = sesion.movimientos.filter((m) => !m.deleted_at);
  const gastosLista = vigentes.filter((m) => m.kind === 'gasto');
  const abonosLista = vigentes.filter((m) => m.kind === 'abono');

  const gastos = sumar(montos(gastosLista));
  const abonos = sumar(montos(abonosLista));
  const gastosCliente = sumar(montos(gastosLista.filter((m) => m.type === 'cliente')));
  const gastosTaller = sumar(montos(gastosLista.filter((m) => m.type === 'taller')));
  const saldo = sumar([sesion.opening_amount, abonos, -gastos]);

  return {
    inicial: sesion.opening_amount,
    abonos,
    gastos,
    gastosCliente,
    gastosTaller,
    saldo,
    diferencia: sesion.counted_amount == null ? null : sumar([sesion.counted_amount, -saldo]),
    numGastos: gastosLista.length,
    numAbonos: abonosLista.length,
  };
}

/** El saldo se considera "bajito" cuando queda menos del 15 % de lo que entró. */
export function saldoBajo(t: Totales): boolean {
  const entro = t.inicial + t.abonos;
  return t.saldo < 0 || (entro > 0 && t.saldo < entro * 0.15);
}

/** Un gasto es "grande" si se lleva el 40 % o más de lo que había antes de hacerlo. */
export function gastoGrande(monto: number, saldoAntes: number): boolean {
  return saldoAntes > 0 ? monto >= saldoAntes * 0.4 : monto > 0;
}

export function textoDiferencia(d: number): string {
  if (d === 0) return 'Cuadrada';
  return d > 0 ? 'Sobrante' : 'Faltante';
}
