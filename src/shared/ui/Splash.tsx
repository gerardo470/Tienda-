import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Llavecita } from '../mascot/Llavecita';

/** Pantalla de inicio: Llavecita aparece girando y hace un guiño. */
export function Splash({ alTerminar }: { alTerminar: () => void }) {
  const [guino, setGuino] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setGuino(true), 950);
    const t2 = window.setTimeout(alTerminar, 1900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [alTerminar]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-2 bg-naranja"
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        initial={{ rotate: -360, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <Llavecita animo={guino ? 'guino' : 'feliz'} size={170} />
      </motion.div>
      <motion.h1
        className="font-display text-5xl font-extrabold text-petroleo-tinta"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 18 }}
      >
        Llavecita
      </motion.h1>
      <motion.p
        className="text-base font-extrabold text-petroleo-tinta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        La ayudante de tu taller
      </motion.p>
    </motion.div>
  );
}
