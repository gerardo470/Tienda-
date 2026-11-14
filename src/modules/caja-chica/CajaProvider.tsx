import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAjustes } from '../../shared/settings/AjustesProvider';
import { calcularTotales, type Totales } from './calculos';
import { repoCaja } from './repo';
import type { DatosMovimiento, Movimiento, Sesion, SesionCompleta } from './types';

interface Ctx {
  cargando: boolean;
  /** No se pudo hablar con el servidor: se muestra lo último guardado */
  sinConexion: boolean;
  sesion: SesionCompleta | null;
  totales: Totales | null;
  recargar: () => Promise<void>;
  abrir: (montoInicial: number) => Promise<void>;
  agregar: (datos: DatosMovimiento) => Promise<Movimiento>;
  editar: (id: string, datos: DatosMovimiento) => Promise<Movimiento>;
  eliminar: (id: string) => Promise<void>;
  cerrar: (contado: number) => Promise<Sesion>;
}

const CajaCtx = createContext<Ctx | null>(null);
const CACHE = 'llavecita-cache-caja';

function leerCache(): SesionCompleta | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? 'null');
  } catch {
    return null;
  }
}

/** Estado de la caja abierta, compartido por todas las pantallas del módulo. */
export function CajaProvider({ children }: { children: ReactNode }) {
  const { nombre } = useAjustes();
  const [sesion, setSesion] = useState<SesionCompleta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinConexion, setSinConexion] = useState(false);

  // Guarda una copia en el teléfono para poder verla sin internet.
  const fijar = useCallback((s: SesionCompleta | null) => {
    setSesion(s);
    try {
      localStorage.setItem(CACHE, JSON.stringify(s));
    } catch {
      /* sin espacio: no pasa nada */
    }
  }, []);

  const recargar = useCallback(async () => {
    try {
      fijar(await repoCaja.sesionAbierta());
      setSinConexion(false);
    } catch {
      setSesion(leerCache());
      setSinConexion(true);
    } finally {
      setCargando(false);
    }
  }, [fijar]);

  useEffect(() => {
    void recargar();
    // Al volver el internet o regresar a la app, se actualiza sola.
    const alVolver = () => {
      if (document.visibilityState === 'visible') void recargar();
    };
    window.addEventListener('online', alVolver);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.removeEventListener('online', alVolver);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargar]);

  const exigir = useCallback(() => {
    if (!sesion) throw new Error('No hay caja abierta');
    return sesion;
  }, [sesion]);

  const abrir = useCallback(
    async (montoInicial: number) => {
      fijar(await repoCaja.abrirSesion(montoInicial, nombre));
    },
    [fijar, nombre],
  );

  const agregar = useCallback(
    async (datos: DatosMovimiento) => {
      const s = exigir();
      const nuevo = await repoCaja.agregarMovimiento(s.id, datos);
      fijar({ ...s, movimientos: [nuevo, ...s.movimientos] });
      return nuevo;
    },
    [exigir, fijar],
  );

  const editar = useCallback(
    async (id: string, datos: DatosMovimiento) => {
      const s = exigir();
      const cambiado = await repoCaja.editarMovimiento(id, datos, nombre);
      fijar({ ...s, movimientos: s.movimientos.map((m) => (m.id === id ? cambiado : m)) });
      return cambiado;
    },
    [exigir, fijar, nombre],
  );

  const eliminar = useCallback(
    async (id: string) => {
      const s = exigir();
      await repoCaja.eliminarMovimiento(id, nombre);
      fijar({ ...s, movimientos: s.movimientos.filter((m) => m.id !== id) });
    },
    [exigir, fijar, nombre],
  );

  const cerrar = useCallback(
    async (contado: number) => {
      const s = exigir();
      const cerrada = await repoCaja.cerrarSesion(s.id, contado, nombre);
      fijar(null);
      return cerrada;
    },
    [exigir, fijar, nombre],
  );

  const totales = useMemo(() => (sesion ? calcularTotales(sesion) : null), [sesion]);

  const valor = useMemo<Ctx>(
    () => ({ cargando, sinConexion, sesion, totales, recargar, abrir, agregar, editar, eliminar, cerrar }),
    [cargando, sinConexion, sesion, totales, recargar, abrir, agregar, editar, eliminar, cerrar],
  );

  return <CajaCtx.Provider value={valor}>{children}</CajaCtx.Provider>;
}

export function useCaja(): Ctx {
  const ctx = useContext(CajaCtx);
  if (!ctx) throw new Error('useCaja debe usarse dentro de <CajaProvider>');
  return ctx;
}
