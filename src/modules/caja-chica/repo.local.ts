import { finDelDia, inicioDelDia } from '../../lib/format';
import { blobADataUrl } from '../../lib/imagen';
import type { DatosMovimiento, Movimiento, Rango, RepoCaja, Sesion, SesionCompleta } from './types';

/**
 * Modo demostración: guarda todo en este teléfono (localStorage).
 * Sirve para probar la app antes de conectar Supabase.
 */
const CLAVE = 'llavecita-demo-caja';

interface Bitacora {
  action: string;
  entity: string;
  entity_id: string;
  actor: string | null;
  created_at: string;
}

interface Almacen {
  sesiones: Sesion[];
  movimientos: (Movimiento & { deleted_by?: string | null })[];
  bitacora: Bitacora[];
}

function leer(): Almacen {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return JSON.parse(crudo);
  } catch {
    /* datos dañados: se empieza de cero */
  }
  return { sesiones: [], movimientos: [], bitacora: [] };
}

function guardar(a: Almacen) {
  localStorage.setItem(CLAVE, JSON.stringify(a));
}

const id = () => crypto.randomUUID();
const ahora = () => new Date().toISOString();

function completa(a: Almacen, s: Sesion): SesionCompleta {
  return {
    ...s,
    movimientos: a.movimientos
      .filter((m) => m.session_id === s.id && !m.deleted_at)
      .sort((x, y) => y.created_at.localeCompare(x.created_at)),
  };
}

function anotar(a: Almacen, action: string, entity: string, entity_id: string, actor: string | null) {
  a.bitacora.push({ action, entity, entity_id, actor, created_at: ahora() });
}

function exigirAbierta(a: Almacen, sesionId: string) {
  const s = a.sesiones.find((x) => x.id === sesionId);
  if (!s || s.status !== 'open') throw new Error('La caja está cerrada: no se pueden cambiar sus movimientos');
}

export function crearRepoLocal(): RepoCaja {
  return {
    async sesionAbierta() {
      const a = leer();
      const s = a.sesiones.find((x) => x.status === 'open');
      return s ? completa(a, s) : null;
    },

    async abrirSesion(montoInicial, quien) {
      const a = leer();
      if (a.sesiones.some((x) => x.status === 'open')) throw new Error('Ya hay una caja abierta');
      const s: Sesion = {
        id: id(),
        opened_at: ahora(),
        closed_at: null,
        opening_amount: montoInicial,
        counted_amount: null,
        status: 'open',
        opened_by: quien || null,
        closed_by: null,
      };
      a.sesiones.push(s);
      anotar(a, 'abrir', 'caja', s.id, s.opened_by);
      guardar(a);
      return completa(a, s);
    },

    async agregarMovimiento(sesionId, datos: DatosMovimiento) {
      const a = leer();
      exigirAbierta(a, sesionId);
      const m: Movimiento = { id: id(), session_id: sesionId, ...datos, created_at: ahora(), updated_at: null, deleted_at: null };
      a.movimientos.push(m);
      anotar(a, 'crear', 'movimiento', m.id, m.registered_by);
      guardar(a);
      return m;
    },

    async editarMovimiento(idMov, datos, quien) {
      const a = leer();
      const i = a.movimientos.findIndex((m) => m.id === idMov && !m.deleted_at);
      if (i < 0) throw new Error('No se encontró el movimiento');
      exigirAbierta(a, a.movimientos[i].session_id);
      a.movimientos[i] = { ...a.movimientos[i], ...datos, updated_at: ahora() };
      anotar(a, 'editar', 'movimiento', idMov, quien || null);
      guardar(a);
      return a.movimientos[i];
    },

    async eliminarMovimiento(idMov, quien) {
      const a = leer();
      const m = a.movimientos.find((x) => x.id === idMov && !x.deleted_at);
      if (!m) throw new Error('No se encontró el movimiento');
      exigirAbierta(a, m.session_id);
      m.deleted_at = ahora();
      m.deleted_by = quien || null;
      anotar(a, 'eliminar', 'movimiento', idMov, quien || null);
      guardar(a);
    },

    async cerrarSesion(sesionId, contado, quien) {
      const a = leer();
      const s = a.sesiones.find((x) => x.id === sesionId);
      if (!s || s.status !== 'open') throw new Error('La caja ya está cerrada');
      s.status = 'closed';
      s.counted_amount = contado;
      s.closed_at = ahora();
      s.closed_by = quien || null;
      anotar(a, 'cerrar', 'caja', s.id, s.closed_by);
      guardar(a);
      return s;
    },

    async sesionesCerradas(rango: Rango) {
      const a = leer();
      const desde = rango.desde ? new Date(inicioDelDia(rango.desde)).getTime() : -Infinity;
      const hasta = rango.hasta ? new Date(finDelDia(rango.hasta)).getTime() : Infinity;
      return a.sesiones
        .filter((s) => {
          const t = new Date(s.opened_at).getTime();
          return s.status === 'closed' && t >= desde && t <= hasta;
        })
        .sort((x, y) => y.opened_at.localeCompare(x.opened_at))
        .map((s) => completa(a, s));
    },

    async sesion(idSesion) {
      const a = leer();
      const s = a.sesiones.find((x) => x.id === idSesion);
      return s ? completa(a, s) : null;
    },

    // En modo demostración la foto se guarda dentro del propio teléfono.
    async subirRecibo(foto) {
      return blobADataUrl(foto);
    },

    async urlRecibo(ruta) {
      return ruta;
    },
  };
}
