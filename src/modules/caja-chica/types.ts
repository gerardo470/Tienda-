// Tipos del módulo Caja Chica (iguales a las tablas de Supabase).

export type Clase = 'gasto' | 'abono';
export type TipoGasto = 'cliente' | 'taller';
export type EstadoSesion = 'open' | 'closed';

export interface Sesion {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  counted_amount: number | null;
  status: EstadoSesion;
  opened_by: string | null;
  closed_by: string | null;
  /** Si tiene fecha, la caja fue eliminada por el administrador (se puede restaurar) */
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Movimiento {
  id: string;
  session_id: string;
  kind: Clase;
  /** Solo para gastos: 'cliente' o 'taller' */
  type: TipoGasto | null;
  description: string;
  /** Vehículo del cliente (solo gastos de tipo cliente) */
  vehicle: string | null;
  amount: number;
  /** Quién lo registró (gasto) o quién lo entregó (abono) */
  registered_by: string | null;
  /** Ruta de la foto del recibo en Storage */
  receipt_url: string | null;
  /** Servicio de un cliente al que corresponde este gasto (opcional) */
  servicio_id: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

/** Una sesión junto con sus movimientos vigentes (sin los eliminados). */
export interface SesionCompleta extends Sesion {
  movimientos: Movimiento[];
}

export interface DatosMovimiento {
  kind: Clase;
  type: TipoGasto | null;
  description: string;
  vehicle: string | null;
  amount: number;
  registered_by: string | null;
  receipt_url: string | null;
  servicio_id: string | null;
}

export interface Rango {
  /** "2026-11-01" */
  desde?: string;
  /** "2026-11-30" */
  hasta?: string;
}

/**
 * Contrato de datos del módulo. Hay dos implementaciones:
 * Supabase (la real) y local (modo demostración).
 */
export interface RepoCaja {
  sesionAbierta(): Promise<SesionCompleta | null>;
  abrirSesion(montoInicial: number, quien: string): Promise<SesionCompleta>;
  agregarMovimiento(sesionId: string, datos: DatosMovimiento): Promise<Movimiento>;
  editarMovimiento(id: string, datos: DatosMovimiento, quien: string): Promise<Movimiento>;
  eliminarMovimiento(id: string, quien: string): Promise<void>;
  cerrarSesion(sesionId: string, contado: number, quien: string): Promise<Sesion>;
  sesionesCerradas(rango: Rango): Promise<SesionCompleta[]>;
  sesion(id: string): Promise<SesionCompleta | null>;
  /** Elimina una caja completa (borrado lógico, solo admin) */
  eliminarSesion(id: string, quien: string): Promise<void>;
  /** Devuelve una caja eliminada a su lugar (solo admin) */
  restaurarSesion(id: string): Promise<void>;
  /** Cajas eliminadas, para poder restaurarlas */
  sesionesEliminadas(): Promise<SesionCompleta[]>;
  subirRecibo(foto: Blob): Promise<string>;
  urlRecibo(ruta: string): Promise<string>;
  /** Borra el archivo de la foto para liberar espacio (el movimiento se conserva) */
  borrarRecibo(ruta: string): Promise<void>;
}
