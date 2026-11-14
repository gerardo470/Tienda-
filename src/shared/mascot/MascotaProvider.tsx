import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAjustes } from '../settings/AjustesProvider';
import { Confeti, type TipoConfeti } from '../ui/Confeti';
import type { Animo } from './Llavecita';

interface Ctx {
  /** Mensaje que se está mostrando en el globito (o null) */
  mensaje: string | null;
  /** Cara temporal mientras dura el mensaje (o null) */
  animoTemporal: Animo | null;
  /** Llavecita dice algo cortito y pone una cara por unos segundos */
  decir: (texto: string, animo?: Animo) => void;
  /** Lanza confeti o moneditas */
  celebrar: (tipo?: TipoConfeti) => void;
}

const MascotaCtx = createContext<Ctx | null>(null);
const DURACION = 3600;

export function MascotaProvider({ children }: { children: ReactNode }) {
  const { mensajes, animaciones } = useAjustes();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [animoTemporal, setAnimoTemporal] = useState<Animo | null>(null);
  const [fiesta, setFiesta] = useState<{ id: number; tipo: TipoConfeti } | null>(null);
  const reloj = useRef<number>();

  const decir = useCallback(
    (texto: string, animo?: Animo) => {
      window.clearTimeout(reloj.current);
      setMensaje(mensajes ? texto : null);
      setAnimoTemporal(animo ?? null);
      reloj.current = window.setTimeout(() => {
        setMensaje(null);
        setAnimoTemporal(null);
      }, DURACION);
    },
    [mensajes],
  );

  const celebrar = useCallback(
    (tipo: TipoConfeti = 'confeti') => {
      if (!animaciones) return;
      setFiesta({ id: Date.now(), tipo });
    },
    [animaciones],
  );

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const valor = useMemo(() => ({ mensaje, animoTemporal, decir, celebrar }), [mensaje, animoTemporal, decir, celebrar]);

  return (
    <MascotaCtx.Provider value={valor}>
      {children}
      {fiesta && <Confeti key={fiesta.id} tipo={fiesta.tipo} alTerminar={() => setFiesta(null)} />}
    </MascotaCtx.Provider>
  );
}

export function useMascota(): Ctx {
  const ctx = useContext(MascotaCtx);
  if (!ctx) throw new Error('useMascota debe usarse dentro de <MascotaProvider>');
  return ctx;
}
