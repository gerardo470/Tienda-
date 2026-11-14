import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface Ajustes {
  /** Mostrar los globitos de diálogo de Llavecita */
  mensajes: boolean;
  /** Animaciones, confeti y vibración */
  animaciones: boolean;
  /** Modo oscuro */
  oscuro: boolean;
  /** Nombre que se guarda en "quién lo registró" */
  nombre: string;
}

const CLAVE = 'llavecita-ajustes';
const INICIAL: Ajustes = { mensajes: true, animaciones: true, oscuro: false, nombre: '' };

function leer(): Ajustes {
  try {
    return { ...INICIAL, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') };
  } catch {
    return INICIAL;
  }
}

interface Ctx extends Ajustes {
  cambiar: (parcial: Partial<Ajustes>) => void;
}

const AjustesCtx = createContext<Ctx | null>(null);

export function AjustesProvider({ children }: { children: ReactNode }) {
  const [ajustes, setAjustes] = useState<Ajustes>(leer);

  const cambiar = useCallback((parcial: Partial<Ajustes>) => {
    setAjustes((prev) => {
      const nuevo = { ...prev, ...parcial };
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevo));
      } catch {
        /* sin espacio: se mantiene solo en memoria */
      }
      return nuevo;
    });
  }, []);

  // Aplica el modo oscuro a toda la app y a la barra del teléfono.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', ajustes.oscuro);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', ajustes.oscuro ? '#061C22' : '#0F3D4A');
  }, [ajustes.oscuro]);

  const valor = useMemo(() => ({ ...ajustes, cambiar }), [ajustes, cambiar]);
  return <AjustesCtx.Provider value={valor}>{children}</AjustesCtx.Provider>;
}

export function useAjustes(): Ctx {
  const ctx = useContext(AjustesCtx);
  if (!ctx) throw new Error('useAjustes debe usarse dentro de <AjustesProvider>');
  return ctx;
}
