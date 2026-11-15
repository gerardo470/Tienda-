import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { modoDemo, supabase } from '../../lib/supabase';
import { miPerfil, PERFIL_DEMO, type Perfil, type Rol } from './perfiles';

interface Ctx {
  /** true mientras se revisa si ya había una sesión guardada */
  cargando: boolean;
  /** Hay un usuario dentro (o estamos en modo demostración) */
  dentro: boolean;
  correo: string | null;
  /** Perfil del usuario (nombre y rol). null si no tiene o está desactivado */
  perfil: Perfil | null;
  rol: Rol | null;
  esAdmin: boolean;
  entrar: (correo: string, clave: string) => Promise<string | null>;
  salir: () => Promise<void>;
}

const AuthCtx = createContext<Ctx | null>(null);

function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Falta confirmar el correo en Supabase.';
  if (m.includes('fetch') || m.includes('network')) return 'No hay conexión a internet.';
  if (m.includes('rate limit')) return 'Muchos intentos seguidos. Espere un momento.';
  return 'No se pudo iniciar sesión. Intente de nuevo.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(!modoDemo);
  const [perfil, setPerfil] = useState<Perfil | null>(modoDemo ? PERFIL_DEMO : null);
  const [perfilListo, setPerfilListo] = useState(modoDemo);
  const usuarioId = sesion?.user.id ?? null;

  // Al iniciar sesión se carga el perfil (rol). Sin internet se usa el último guardado.
  useEffect(() => {
    if (modoDemo) return;
    if (!usuarioId) {
      setPerfil(null);
      setPerfilListo(false);
      return;
    }
    let vigente = true;
    const CLAVE = `llavecita-perfil-${usuarioId}`;
    miPerfil(usuarioId)
      .then((p) => {
        if (!vigente) return;
        setPerfil(p);
        localStorage.setItem(CLAVE, JSON.stringify(p));
      })
      .catch(() => {
        if (!vigente) return;
        try {
          setPerfil(JSON.parse(localStorage.getItem(CLAVE) ?? 'null'));
        } catch {
          setPerfil(null);
        }
      })
      .finally(() => vigente && setPerfilListo(true));
    return () => {
      vigente = false;
    };
  }, [usuarioId]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva));
    return () => data.subscription.unsubscribe();
  }, []);

  const entrar = useCallback(async (correo: string, clave: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    return error ? traducirError(error.message) : null;
  }, []);

  const salir = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const valor = useMemo<Ctx>(
    () => ({
      cargando: cargando || (!!sesion && !perfilListo),
      dentro: modoDemo || !!sesion,
      correo: sesion?.user.email ?? null,
      perfil: perfil?.activo ? perfil : null,
      rol: perfil?.activo ? perfil.rol : null,
      esAdmin: !!perfil?.activo && perfil.rol === 'admin',
      entrar,
      salir,
    }),
    [cargando, sesion, perfil, perfilListo, entrar, salir],
  );

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
