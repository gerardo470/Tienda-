import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../../shared/auth/AuthProvider';
import { listarPerfiles, type Perfil } from '../../shared/auth/perfiles';
import { repoClientes } from './repo';
import { TIPOS_BASE, type ClienteCompleto, type TipoServicio } from './types';

interface Ctx {
  cargando: boolean;
  sinConexion: boolean;
  clientes: ClienteCompleto[];
  /** Catálogo completo de tipos de servicio */
  catalogo: TipoServicio[];
  /** Nombres de los tipos activos, para los formularios */
  tipos: string[];
  /** Usuarios del taller, para elegir mecánico */
  equipo: Perfil[];
  recargar: () => Promise<void>;
}

const ClientesCtx = createContext<Ctx | null>(null);
const CACHE = 'llavecita-cache-clientes';

/** Clientes, vehículos y servicios en memoria, compartidos por todas las pantallas. */
export function ClientesProvider({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  const [catalogo, setCatalogo] = useState<TipoServicio[]>([]);
  const [equipo, setEquipo] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sinConexion, setSinConexion] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const [lista, cat, eq] = await Promise.all([repoClientes.listar(), repoClientes.tipos(), listarPerfiles()]);
      setClientes(lista);
      setCatalogo(cat);
      setEquipo(eq.filter((p) => p.activo));
      setSinConexion(false);
      try {
        localStorage.setItem(CACHE, JSON.stringify(lista));
      } catch {
        /* sin espacio: no pasa nada */
      }
    } catch {
      try {
        setClientes(JSON.parse(localStorage.getItem(CACHE) ?? '[]'));
      } catch {
        setClientes([]);
      }
      setSinConexion(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!perfil) return;
    void recargar();
    const alVolver = () => void recargar();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [perfil, recargar]);

  const valor = useMemo<Ctx>(() => {
    const activos = catalogo.filter((t) => t.activo).map((t) => t.nombre);
    return { cargando, sinConexion, clientes, catalogo, tipos: activos.length ? activos : TIPOS_BASE, equipo, recargar };
  }, [cargando, sinConexion, clientes, catalogo, equipo, recargar]);

  return <ClientesCtx.Provider value={valor}>{children}</ClientesCtx.Provider>;
}

export function useClientes(): Ctx {
  const ctx = useContext(ClientesCtx);
  if (!ctx) throw new Error('useClientes debe usarse dentro de <ClientesProvider>');
  return ctx;
}
