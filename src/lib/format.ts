// Formatos en español, dólares y hora de El Salvador.
export const ZONA = 'America/El_Salvador';
const LOCALE = 'es-SV';

const fmtMoneda = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 184.5 -> "$184.50" · -5 -> "−$5.00" */
export function dinero(n: number): string {
  const s = fmtMoneda.format(Math.abs(n));
  return n < 0 ? `−${s}` : s;
}

/** Convierte lo que el usuario escribe ("12,50", "$ 12.5") en número. */
export function leerMonto(texto: string): number {
  const limpio = texto.replace(/[^0-9.,]/g, '').replace(',', '.');
  const n = Number.parseFloat(limpio);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/** Suma segura en centavos para evitar errores de decimales. */
export function sumar(valores: number[]): number {
  return valores.reduce((acc, v) => acc + Math.round(v * 100), 0) / 100;
}

/** "viernes, 13 de noviembre de 2026" */
export function fechaLarga(d: Date | string = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(d));
}

/** "13 nov 2026" */
export function fechaCorta(d: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

/** "9:42 a. m." */
export function hora(d: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
}

/** "13/11/2026 9:42 a. m." */
export function fechaHora(d: Date | string): string {
  const f = new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(d));
  return `${f} ${hora(d)}`;
}

/** Fecha de hoy en El Salvador como "2026-11-13" (para los filtros). */
export function hoyISO(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(d);
}

/** Primer día del mes actual en El Salvador, "2026-11-01". */
export function inicioMesISO(): string {
  return `${hoyISO().slice(0, 8)}01`;
}

// El Salvador no cambia la hora: siempre es UTC−6.
export const inicioDelDia = (iso: string) => `${iso}T00:00:00-06:00`;
export const finDelDia = (iso: string) => `${iso}T23:59:59.999-06:00`;
