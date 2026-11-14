import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { IconoCerrar } from './iconos';

interface Props {
  abierta: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

/** Hoja que sube desde abajo (para formularios y confirmaciones). */
export function Hoja({ abierta, alCerrar, titulo, children }: Props) {
  // Bloquea el desplazamiento del fondo mientras la hoja está abierta.
  useEffect(() => {
    if (!abierta) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierta]);

  return (
    <AnimatePresence>
      {abierta && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
          <motion.div
            className="absolute inset-0 bg-petroleo-profundo/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={alCerrar}
          />
          <motion.div
            className="sin-barra relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-5xl bg-fondo px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-borde" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold leading-tight">{titulo}</h2>
              <button
                type="button"
                onClick={alCerrar}
                aria-label="Cerrar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tarjeta text-suave shadow-relieve-sm"
              >
                <IconoCerrar size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
