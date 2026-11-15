import { hoyISO } from '../../lib/format';
import { supabase } from '../../lib/supabase';

// Respaldos propios: el plan gratuito de Supabase no hace copias automáticas.

/** Tablas que entran al respaldo, en el orden en que se restauran. */
export const TABLAS = ['tipos_servicio', 'cash_sessions', 'cash_movements', 'clientes', 'vehiculos', 'servicios'] as const;
export type Tabla = (typeof TABLAS)[number];
export type Respaldo = Record<Tabla, Record<string, unknown>[]>;

export const NOMBRE_TABLA: Record<Tabla, string> = {
  tipos_servicio: 'Tipos de servicio',
  cash_sessions: 'Cajas',
  cash_movements: 'Gastos y abonos',
  clientes: 'Clientes',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
};

/** Columnas que guardan listas (en Excel van como texto y al leer se vuelven lista). */
const LISTAS = new Set(['etiquetas', 'fotos']);
const VACIA = '(sin datos)';
const HOJA_INFO = 'Llavecita';

const CLAVE_ULTIMO = 'llavecita-ultimo-respaldo';
const CLAVE_PRIMER_USO = 'llavecita-primer-uso';
const DEMO_CAJA = 'llavecita-demo-caja';
const DEMO_CLIENTES = 'llavecita-demo-clientes';

const leerLocal = (clave: string) => {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? '{}');
  } catch {
    return {};
  }
};

/** Lee todas las filas de todas las tablas (incluye lo eliminado, para que el respaldo sea completo). */
export async function leerTodo(): Promise<Respaldo> {
  if (!supabase) {
    const caja = leerLocal(DEMO_CAJA);
    const cli = leerLocal(DEMO_CLIENTES);
    return {
      tipos_servicio: cli.tipos ?? [],
      cash_sessions: caja.sesiones ?? [],
      cash_movements: caja.movimientos ?? [],
      clientes: cli.clientes ?? [],
      vehiculos: cli.vehiculos ?? [],
      servicios: cli.servicios ?? [],
    };
  }
  const datos = {} as Respaldo;
  for (const tabla of TABLAS) {
    const filas: Record<string, unknown>[] = [];
    // Supabase entrega de 1000 en 1000.
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await supabase.from(tabla).select('*').order('id').range(desde, desde + 999);
      if (error) throw new Error(error.message);
      filas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    datos[tabla] = filas;
  }
  return datos;
}

export const contar = (r: Respaldo) => Object.fromEntries(TABLAS.map((t) => [t, r[t].length])) as Record<Tabla, number>;

function celda(valor: unknown) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return { value: valor, type: Number };
  if (typeof valor === 'boolean') return { value: valor, type: Boolean };
  if (typeof valor === 'object') return { value: JSON.stringify(valor), type: String };
  return { value: String(valor), type: String };
}

/** Arma un archivo Excel (.xlsx) con una hoja por tabla. */
export async function crearExcel(datos: Respaldo): Promise<File> {
  const { default: escribir } = await import('write-excel-file/browser');
  const titulo = (t: string) => ({ value: t, type: String, fontWeight: 'bold' as const });
  const hojas = [
    {
      sheet: HOJA_INFO,
      data: [
        [titulo('Respaldo de Llavecita')],
        [celda('Fecha'), celda(new Date().toISOString())],
        ...TABLAS.map((t) => [celda(NOMBRE_TABLA[t]), celda(datos[t].length)]),
        [celda('Nota'), celda('No cambie los nombres de las hojas ni de las columnas. Las fotos no van en este archivo.')],
      ],
    },
    ...TABLAS.map((tabla) => {
      const filas = datos[tabla];
      const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))];
      return {
        sheet: tabla,
        data: filas.length ? [columnas.map(titulo), ...filas.map((f) => columnas.map((c) => celda(f[c])))] : [[celda(VACIA)]],
      };
    }),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await (escribir as any)(hojas).toBlob();
  return new File([blob], `respaldo-llavecita-${hoyISO()}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Lee un archivo de respaldo y lo convierte de nuevo en filas. */
export async function leerExcel(archivo: File): Promise<Respaldo> {
  const { default: leer } = await import('read-excel-file/browser');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hojas = (await (leer as any)(archivo)) as { sheet: string; data: unknown[][] }[];
  if (!hojas.some((h) => (TABLAS as readonly string[]).includes(h.sheet))) throw new Error('Este archivo no es un respaldo de Llavecita.');

  const datos = Object.fromEntries(TABLAS.map((t) => [t, []])) as unknown as Respaldo;
  for (const tabla of TABLAS) {
    const hoja = hojas.find((h) => h.sheet === tabla);
    if (!hoja || hoja.data.length < 2 || hoja.data[0]?.[0] === VACIA) continue;
    const columnas = hoja.data[0].map((c) => String(c ?? ''));
    datos[tabla] = hoja.data
      .slice(1)
      .map((fila) => {
        const obj: Record<string, unknown> = {};
        columnas.forEach((col, i) => {
          if (!col) return;
          let v: unknown = fila[i] ?? null;
          if (v instanceof Date) v = v.toISOString();
          if (LISTAS.has(col)) {
            try {
              v = typeof v === 'string' ? JSON.parse(v) : [];
            } catch {
              v = [];
            }
          }
          obj[col] = v;
        });
        return obj;
      })
      .filter((f) => typeof f.id === 'string' && f.id);
  }
  return datos;
}

/**
 * Repone lo que falte. Nunca borra ni cambia lo que ya existe:
 * cada fila se reconoce por su identificador y, si ya está, se salta.
 * Devuelve cuántas filas se agregaron por tabla.
 */
export async function restaurar(datos: Respaldo): Promise<Record<Tabla, number>> {
  if (supabase) {
    const { data, error } = await supabase.rpc('restaurar_respaldo', { datos });
    if (error) throw new Error(error.message);
    return data as Record<Tabla, number>;
  }
  // Modo demostración: se mezcla dentro del teléfono.
  const caja = { sesiones: [], movimientos: [], bitacora: [], ...leerLocal(DEMO_CAJA) };
  const cli = { clientes: [], vehiculos: [], servicios: [], tipos: [], ...leerLocal(DEMO_CLIENTES) };
  const destino: Record<Tabla, { id: string }[]> = {
    tipos_servicio: cli.tipos,
    cash_sessions: caja.sesiones,
    cash_movements: caja.movimientos,
    clientes: cli.clientes,
    vehiculos: cli.vehiculos,
    servicios: cli.servicios,
  };
  const agregadas = {} as Record<Tabla, number>;
  for (const tabla of TABLAS) {
    const ya = new Set(destino[tabla].map((f) => f.id));
    const hayAbierta = caja.sesiones.some((s: { status: string }) => s.status === 'open');
    const nombres = new Set(tabla === 'tipos_servicio' ? cli.tipos.map((t: { nombre: string }) => t.nombre) : []);
    const nuevas = datos[tabla].filter((f) => !ya.has(f.id as string) && !nombres.has(f.nombre as string) && !(tabla === 'cash_sessions' && f.status === 'open' && hayAbierta));
    destino[tabla].push(...(nuevas as { id: string }[]));
    agregadas[tabla] = nuevas.length;
  }
  localStorage.setItem(DEMO_CAJA, JSON.stringify(caja));
  localStorage.setItem(DEMO_CLIENTES, JSON.stringify(cli));
  return agregadas;
}

// ---------- Recordatorio de respaldo ----------

export function marcarRespaldoHecho(): void {
  localStorage.setItem(CLAVE_ULTIMO, new Date().toISOString());
}

export function ultimoRespaldo(): Date | null {
  const t = localStorage.getItem(CLAVE_ULTIMO);
  return t ? new Date(t) : null;
}

/** Días desde el último respaldo (o desde que se empezó a usar la app en este teléfono). */
export function diasSinRespaldo(): number {
  if (!localStorage.getItem(CLAVE_PRIMER_USO)) localStorage.setItem(CLAVE_PRIMER_USO, new Date().toISOString());
  const base = ultimoRespaldo() ?? new Date(localStorage.getItem(CLAVE_PRIMER_USO)!);
  return Math.floor((Date.now() - base.getTime()) / 86400000);
}

export const DIAS_PARA_AVISAR = 30;

// ---------- Espacio usado ----------

/** Límites del plan gratuito de Supabase (ver docs/limites.md). */
export const LIMITE_BD = 500 * 1024 * 1024; // 500 MB
export const LIMITE_ARCHIVOS = 1024 * 1024 * 1024; // 1 GB
export const AVISO_ESPACIO = 0.7; // avisar al pasar del 70 %

export interface Espacio {
  bd: number;
  archivos: number;
  numArchivos: number;
}

export async function usoEspacio(): Promise<Espacio> {
  if (!supabase) {
    const bytes = [DEMO_CAJA, DEMO_CLIENTES].reduce((n, k) => n + (localStorage.getItem(k)?.length ?? 0), 0);
    return { bd: bytes, archivos: 0, numArchivos: 0 };
  }
  const { data, error } = await supabase.rpc('uso_espacio');
  if (error) throw new Error(error.message);
  return { bd: Number(data.db_bytes), archivos: Number(data.archivos_bytes), numArchivos: Number(data.archivos) };
}

export function tamano(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
