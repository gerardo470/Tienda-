import type { SupabaseClient } from '@supabase/supabase-js';
import { finDelDia, inicioDelDia } from '../../lib/format';
import type { DatosMovimiento, Movimiento, Rango, RepoCaja, Sesion, SesionCompleta } from './types';

const BUCKET = 'recibos';

// Supabase puede devolver los montos como texto: aquí se convierten a número.
function aSesion(f: any): Sesion {
  return {
    id: f.id,
    opened_at: f.opened_at,
    closed_at: f.closed_at,
    opening_amount: Number(f.opening_amount),
    counted_amount: f.counted_amount == null ? null : Number(f.counted_amount),
    status: f.status,
    opened_by: f.opened_by ?? null,
    closed_by: f.closed_by ?? null,
  };
}

function aMovimiento(f: any): Movimiento {
  return {
    id: f.id,
    session_id: f.session_id,
    kind: f.kind,
    type: f.type ?? null,
    description: f.description,
    vehicle: f.vehicle ?? null,
    amount: Number(f.amount),
    registered_by: f.registered_by ?? null,
    receipt_url: f.receipt_url ?? null,
    servicio_id: f.servicio_id ?? null,
    created_at: f.created_at,
    updated_at: f.updated_at ?? null,
    deleted_at: f.deleted_at ?? null,
  };
}

function aCompleta(f: any): SesionCompleta {
  const movimientos = ((f.cash_movements ?? []) as any[])
    .map(aMovimiento)
    .filter((m) => !m.deleted_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { ...aSesion(f), movimientos };
}

function revisar<T>(resp: { data: T; error: { message: string } | null }): T {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
}

export function crearRepoSupabase(db: SupabaseClient): RepoCaja {
  const SELECT = '*, cash_movements(*)';

  return {
    async sesionAbierta() {
      const fila = revisar(await db.from('cash_sessions').select(SELECT).eq('status', 'open').maybeSingle());
      return fila ? aCompleta(fila) : null;
    },

    async abrirSesion(montoInicial, quien) {
      const fila = revisar(
        await db
          .from('cash_sessions')
          .insert({ opening_amount: montoInicial, opened_by: quien || null })
          .select(SELECT)
          .single(),
      );
      return aCompleta(fila);
    },

    async agregarMovimiento(sesionId, datos: DatosMovimiento) {
      const fila = revisar(
        await db
          .from('cash_movements')
          .insert({ session_id: sesionId, ...datos })
          .select()
          .single(),
      );
      return aMovimiento(fila);
    },

    async editarMovimiento(id, datos, quien) {
      const fila = revisar(
        await db
          .from('cash_movements')
          .update({ ...datos, updated_by: quien || null })
          .eq('id', id)
          .select()
          .single(),
      );
      return aMovimiento(fila);
    },

    // Borrado lógico: el movimiento queda guardado con fecha y autor del borrado.
    async eliminarMovimiento(id, quien) {
      revisar(
        await db
          .from('cash_movements')
          .update({ deleted_at: new Date().toISOString(), deleted_by: quien || null })
          .eq('id', id)
          .select('id')
          .single(),
      );
    },

    async cerrarSesion(sesionId, contado, quien) {
      const fila = revisar(
        await db
          .from('cash_sessions')
          .update({
            status: 'closed',
            counted_amount: contado,
            closed_at: new Date().toISOString(),
            closed_by: quien || null,
          })
          .eq('id', sesionId)
          .select()
          .single(),
      );
      return aSesion(fila);
    },

    async sesionesCerradas(rango: Rango) {
      let consulta = db.from('cash_sessions').select(SELECT).eq('status', 'closed');
      if (rango.desde) consulta = consulta.gte('opened_at', inicioDelDia(rango.desde));
      if (rango.hasta) consulta = consulta.lte('opened_at', finDelDia(rango.hasta));
      const filas = revisar(await consulta.order('opened_at', { ascending: false }).limit(500));
      return (filas as any[]).map(aCompleta);
    },

    async sesion(id) {
      const fila = revisar(await db.from('cash_sessions').select(SELECT).eq('id', id).maybeSingle());
      return fila ? aCompleta(fila) : null;
    },

    async subirRecibo(foto) {
      const { data } = await db.auth.getUser();
      const usuario = data.user?.id;
      if (!usuario) throw new Error('No hay sesión iniciada');
      const ruta = `${usuario}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await db.storage.from(BUCKET).upload(ruta, foto, { contentType: 'image/jpeg' });
      if (error) throw new Error(error.message);
      return ruta;
    },

    // Las fotos son privadas: se pide un enlace temporal (1 hora) para verlas.
    async urlRecibo(ruta) {
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(ruta, 3600);
      if (error || !data) throw new Error(error?.message ?? 'No se pudo abrir la foto');
      return data.signedUrl;
    },
  };
}
