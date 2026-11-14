import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { vibrar } from '../../lib/haptics';
import { useAjustes } from '../settings/AjustesProvider';

type Variante = 'naranja' | 'menta' | 'coral' | 'neutro' | 'fantasma';
type Tamano = 'chico' | 'normal' | 'grande';

const ESTILO: Record<Variante, string> = {
  naranja: 'bg-naranja text-petroleo-tinta shadow-btn-naranja',
  menta: 'bg-menta text-petroleo-tinta shadow-btn-menta',
  coral: 'bg-coral text-petroleo-tinta shadow-btn-coral',
  neutro: 'bg-tarjeta text-tinta shadow-btn-neutro border-2 border-borde',
  fantasma: 'bg-transparent text-suave',
};

const TAMANO: Record<Tamano, string> = {
  chico: 'min-h-[44px] px-4 text-sm rounded-full',
  normal: 'min-h-[52px] px-5 text-[15px] rounded-[20px]',
  grande: 'min-h-[60px] px-4 text-[15px] rounded-[22px]',
};

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variante?: Variante;
  tamano?: Tamano;
  ancho?: boolean;
  children: ReactNode;
}

/** Botón con relieve que "rebota" al tocarlo y da una vibración cortita. */
export function Boton({ variante = 'naranja', tamano = 'normal', ancho, className = '', onClick, disabled, children, ...rest }: Props) {
  const { animaciones } = useAjustes();
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.94, y: 3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      disabled={disabled}
      onClick={(e) => {
        if (animaciones) vibrar('toque');
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center gap-2 font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-naranja/40 disabled:opacity-50 ${ESTILO[variante]} ${TAMANO[tamano]} ${ancho ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
