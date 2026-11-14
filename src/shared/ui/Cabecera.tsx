import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Llavecita, type Animo } from '../mascot/Llavecita';
import { useMascota } from '../mascot/MascotaProvider';

interface Props {
  titulo: string;
  subtitulo?: string;
  /** Botón o acción a la derecha del título */
  accion?: ReactNode;
  /** Cara de Llavecita cuando no está diciendo nada */
  animo?: Animo;
  /** Deja espacio para que una tarjeta se monte sobre el encabezado */
  solapar?: boolean;
}

/** Encabezado azul petróleo con Llavecita asomándose y su globito de diálogo. */
export function Cabecera({ titulo, subtitulo, accion, animo = 'feliz', solapar = false }: Props) {
  const { mensaje, animoTemporal } = useMascota();

  return (
    <header
      className={`relative overflow-hidden rounded-b-5xl bg-cabecera px-5 pt-[calc(18px+env(safe-area-inset-top))] ${
        solapar ? 'pb-[62px]' : 'pb-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[32px] font-extrabold leading-9 text-crema">{titulo}</h1>
          {subtitulo && <p className="text-[13px] font-semibold text-[#CFE3E8]">{subtitulo}</p>}
        </div>
        {accion}
      </div>

      {/* Fila del globito: altura fija para que nada brinque */}
      <div className="mt-3 flex h-[58px] items-center pr-[118px]">
        <AnimatePresence mode="wait">
          {mensaje && (
            <motion.div
              key={mensaje}
              role="status"
              className="relative rounded-[18px] bg-crema px-3.5 py-2 text-sm font-bold leading-[19px] text-petroleo"
              initial={{ opacity: 0, scale: 0.7, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              style={{ transformOrigin: 'right center' }}
            >
              {mensaje}
              <span className="absolute -right-1.5 top-1/2 -mt-[7px] block h-3.5 w-3.5 rotate-45 rounded-[3px] bg-crema" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className={`absolute right-3 ${solapar ? 'bottom-[30px]' : '-bottom-3'}`}
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
      >
        <Llavecita animo={animoTemporal ?? animo} size={118} soloCabeza />
      </motion.div>
    </header>
  );
}
