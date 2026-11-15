import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cliente, ClienteCompleto, DatosCliente, DatosServicio, DatosVehiculo, RepoClientes, Servicio, TipoServicio, Vehiculo } from './types';

const BUCKET = 'servicios';

function revisar<T>(resp: { data: T; error: { message: string } | null }): T {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
}

const aServicio = (f: any): Servicio => ({ ...f, costo: Number(f.costo), fotos: f.fotos ?? [] });

function aCompleto(f: any): ClienteCompleto {
  const { vehiculos, servicios, ...cliente } = f;
  return {
    ...cliente,
    etiquetas: cliente.etiquetas ?? [],
    vehiculos: ((vehiculos ?? []) as any[]).filter((v) => !v.eliminado_en),
    servicios: ((servicios ?? []) as any[])
      .filter((s) => !s.eliminado_en)
      .map(aServicio)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en)),
  };
}

export function crearRepoSupabase(db: SupabaseClient): RepoClientes {
  const yo = async () => (await db.auth.getSession()).data.session?.user.id ?? null;

  // Borrado lógico: la fila queda guardada con fecha y autor del borrado.
  async function borrar(tabla: string, id: string) {
    const filas = revisar(
      await db
        .from(tabla)
        .update({ eliminado_en: new Date().toISOString(), eliminado_por: await yo() })
        .eq('id', id)
        .select('id'),
    );
    if (!filas?.length) throw new Error('No tiene permiso para eliminar');
  }

  async function guardar<T>(tabla: string, datos: object, id?: string): Promise<T> {
    if (!id) return revisar(await db.from(tabla).insert(datos).select().single()) as T;
    const filas = revisar(await db.from(tabla).update(datos).eq('id', id).select());
    if (!filas?.length) throw new Error('No tiene permiso para editar');
    return filas[0] as T;
  }

  return {
    async listar() {
      const filas = revisar(await db.from('clientes').select('*, vehiculos(*), servicios(*)').is('eliminado_en', null).order('nombre'));
      return (filas as any[]).map(aCompleto);
    },

    guardarCliente: (datos: DatosCliente, id) => guardar<Cliente>('clientes', datos, id),
    eliminarCliente: (id) => borrar('clientes', id),

    guardarVehiculo: (clienteId, datos: DatosVehiculo, id) => guardar<Vehiculo>('vehiculos', { ...datos, cliente_id: clienteId }, id),
    eliminarVehiculo: (id) => borrar('vehiculos', id),

    async guardarServicio(datos: DatosServicio, id) {
      // cliente_id lo corrige la base de datos según el dueño del vehículo.
      const fila = await guardar<any>('servicios', id ? datos : { ...datos, cliente_id: '00000000-0000-0000-0000-000000000000' }, id);
      return aServicio(fila);
    },
    eliminarServicio: (id) => borrar('servicios', id),

    async tipos() {
      return revisar(await db.from('tipos_servicio').select('id, nombre, activo').order('orden').order('nombre')) as TipoServicio[];
    },
    async agregarTipo(nombre) {
      revisar(await db.from('tipos_servicio').insert({ nombre, orden: 50 }).select('id').single());
    },
    async activarTipo(id, activo) {
      revisar(await db.from('tipos_servicio').update({ activo }).eq('id', id).select('id').single());
    },

    async subirFoto(foto) {
      const usuario = await yo();
      if (!usuario) throw new Error('No hay sesión iniciada');
      const ruta = `${usuario}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await db.storage.from(BUCKET).upload(ruta, foto, { contentType: 'image/jpeg' });
      if (error) throw new Error(error.message);
      return ruta;
    },
    async urlFoto(ruta) {
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(ruta, 3600);
      if (error || !data) throw new Error(error?.message ?? 'No se pudo abrir la foto');
      return data.signedUrl;
    },
  };
}
