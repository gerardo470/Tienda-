import { blobADataUrl } from '../../lib/imagen';
import { TIPOS_BASE, type Cliente, type ClienteCompleto, type RepoClientes, type Servicio, type TipoServicio, type Vehiculo } from './types';

/** Modo demostración: guarda todo en este teléfono (localStorage). */
const CLAVE = 'llavecita-demo-clientes';

type Borrable = { eliminado_en?: string | null };

interface Almacen {
  clientes: (Cliente & Borrable)[];
  vehiculos: (Vehiculo & Borrable)[];
  servicios: (Servicio & Borrable)[];
  tipos: TipoServicio[];
}

function leer(): Almacen {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return JSON.parse(crudo);
  } catch {
    /* datos dañados: se empieza de cero */
  }
  return { clientes: [], vehiculos: [], servicios: [], tipos: TIPOS_BASE.map((nombre) => ({ id: crypto.randomUUID(), nombre, activo: true })) };
}

const guardar = (a: Almacen) => localStorage.setItem(CLAVE, JSON.stringify(a));
const ahora = () => new Date().toISOString();

function poner<T extends { id: string }>(lista: T[], datos: object, id?: string, extra: object = {}): T {
  if (id) {
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) throw new Error('No se encontró el registro');
    lista[i] = { ...lista[i], ...datos };
    return lista[i];
  }
  const nuevo = { id: crypto.randomUUID(), creado_en: ahora(), ...extra, ...datos } as unknown as T;
  lista.push(nuevo);
  return nuevo;
}

function borrar(lista: ({ id: string } & Borrable)[], id: string) {
  const x = lista.find((y) => y.id === id);
  if (x) x.eliminado_en = ahora();
}

export function crearRepoLocal(): RepoClientes {
  return {
    async listar() {
      const a = leer();
      return a.clientes
        .filter((c) => !c.eliminado_en)
        .sort((x, y) => x.nombre.localeCompare(y.nombre))
        .map<ClienteCompleto>((c) => ({
          ...c,
          vehiculos: a.vehiculos.filter((v) => v.cliente_id === c.id && !v.eliminado_en),
          servicios: a.servicios
            .filter((s) => s.cliente_id === c.id && !s.eliminado_en)
            .sort((x, y) => y.fecha.localeCompare(x.fecha) || y.creado_en.localeCompare(x.creado_en)),
        }));
    },
    async guardarCliente(datos, id) {
      const a = leer();
      const c = poner(a.clientes, datos, id);
      guardar(a);
      return c;
    },
    async eliminarCliente(id) {
      const a = leer();
      borrar(a.clientes, id);
      guardar(a);
    },
    async guardarVehiculo(clienteId, datos, id) {
      const a = leer();
      const v = poner(a.vehiculos, datos, id, { cliente_id: clienteId });
      guardar(a);
      return v;
    },
    async eliminarVehiculo(id) {
      const a = leer();
      borrar(a.vehiculos, id);
      guardar(a);
    },
    async guardarServicio(datos, id) {
      const a = leer();
      const v = a.vehiculos.find((x) => x.id === datos.vehiculo_id);
      if (!v) throw new Error('El vehículo no existe');
      const s = poner(a.servicios, { ...datos, cliente_id: v.cliente_id }, id);
      if (datos.kilometraje != null && (v.kilometraje_actual == null || v.kilometraje_actual < datos.kilometraje)) v.kilometraje_actual = datos.kilometraje;
      guardar(a);
      return s;
    },
    async eliminarServicio(id) {
      const a = leer();
      borrar(a.servicios, id);
      guardar(a);
    },
    async tipos() {
      return leer().tipos;
    },
    async agregarTipo(nombre) {
      const a = leer();
      if (!a.tipos.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) a.tipos.splice(Math.max(0, a.tipos.length - 1), 0, { id: crypto.randomUUID(), nombre, activo: true });
      guardar(a);
    },
    async activarTipo(id, activo) {
      const a = leer();
      const t = a.tipos.find((x) => x.id === id);
      if (t) t.activo = activo;
      guardar(a);
    },
    async subirFoto(foto) {
      return blobADataUrl(foto);
    },
    async urlFoto(ruta) {
      return ruta;
    },
  };
}
