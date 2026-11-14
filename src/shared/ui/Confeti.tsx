import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';

export type TipoConfeti = 'confeti' | 'monedas';

const COLORES = ['#FF8A1F', '#3CCFA0', '#FF6B5E', '#0F3D4A', '#FFD27A'];

/** Celebración pequeña: papelitos o moneditas que saltan y caen. */
export function Confeti({ tipo, alTerminar }: { tipo: TipoConfeti; alTerminar: () => void }) {
  const piezas = useMemo(
    () =>
      Array.from({ length: tipo === 'monedas' ? 14 : 28 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        subida: -(160 + Math.random() * 220),
        giro: (Math.random() - 0.5) * 720,
        demora: Math.random() * 0.12,
        color: COLORES[i % COLORES.length],
        ancho: 7 + Math.random() * 7,
      })),
    [tipo],
  );

  useEffect(() => {
    const t = window.setTimeout(alTerminar, 1700);
    return () => window.clearTimeout(t);
  }, [alTerminar]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className="absolute left-1/2 top-[55%]">
        {piezas.map((p) => (
          <motion.span
            key={p.id}
            className="absolute block"
            style={
              tipo === 'monedas'
                ? {
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: '#3CCFA0',
                    border: '3px solid #0F3D4A',
                    boxSizing: 'border-box',
                  }
                : { width: p.ancho, height: p.ancho * 1.6, borderRadius: 3, background: p.color }
            }
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x: [0, p.x * 0.7, p.x],
              y: [0, p.subida, 260],
              rotate: p.giro,
              opacity: [1, 1, 0],
              scale: 1,
            }}
            transition={{ duration: 1.5, delay: p.demora, ease: ['easeOut', 'easeIn'], times: [0, 0.4, 1] }}
          />
        ))}
      </div>
    </div>
  );
}
