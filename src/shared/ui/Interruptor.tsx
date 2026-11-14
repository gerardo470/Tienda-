import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { vibrar } from '../../lib/haptics';

interface Props {
  icono: ReactNode;
  titulo: string;
  descripcion?: string;
  activo: boolean;
  alCambiar: (valor: boolean) => void;
}

/** Fila de ajuste con interruptor de encendido/apagado. */
export function Interruptor({ icono, titulo, descripcion, activo, alCambiar }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => {
        vibrar('toque');
        alCambiar(!activo);
      }}
      className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-naranja-bg text-naranja-fg">{icono}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold">{titulo}</span>
        {descripcion && <span className="block text-xs font-semibold text-suave">{descripcion}</span>}
      </span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${activo ? 'justify-end bg-menta' : 'justify-start bg-borde'}`}>
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 30 }} className="block h-6 w-6 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
