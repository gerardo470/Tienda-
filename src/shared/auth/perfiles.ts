import { supabase } from '../../lib/supabase';

export type Rol = 'admin' | 'cajero' | 'mecanico';

export interface Perfil {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

export const NOMBRE_ROL: Record<Rol, string> = { admin: 'Administrador', cajero: 'Cajero', mecanico: 'Mecánico' };

/** En modo demostración hay un solo usuario y es admin. */
export const PERFIL_DEMO: Perfil = { id: 'demo', nombre: '', rol: 'admin', activo: true };

export async function miPerfil(id: string): Promise<Perfil | null> {
  if (!supabase) return PERFIL_DEMO;
  const { data, error } = await supabase.from('profiles').select('id, nombre, rol, activo').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Perfil | null;
}

/** Todos los usuarios del taller (para Ajustes > Usuarios y para elegir mecánico). */
export async function listarPerfiles(): Promise<Perfil[]> {
  if (!supabase) return [PERFIL_DEMO];
  const { data, error } = await supabase.from('profiles').select('id, nombre, rol, activo').order('creado_en');
  if (error) throw new Error(error.message);
  return (data ?? []) as Perfil[];
}

/** Solo el admin puede cambiar nombre, rol o activar/desactivar (lo exige la base de datos). */
export async function actualizarPerfil(id: string, cambios: Partial<Pick<Perfil, 'nombre' | 'rol' | 'activo'>>): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('profiles').update(cambios).eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('No tiene permiso para cambiar usuarios');
}
