import { motion } from 'framer-motion';
import { dinero } from '../../../lib/format';

/** Barra animada con la proporción de gastos Cliente vs Taller. */
export function BarraReparto({ cliente, taller }: { cliente: number; taller: number }) {
  const total = cliente + taller;
  const pctCliente = total > 0 ? (cliente / total) * 100 : 0;
  const pctTaller = total > 0 ? 100 - pctCliente : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-3 overflow-hidden rounded-full bg-borde"
        role="img"
        aria-label={`Gastos: cliente ${dinero(cliente)}, taller ${dinero(taller)}`}
      >
        <motion.div className="h-full bg-naranja" initial={false} animate={{ width: `${pctCliente}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        <motion.div className="h-full bg-petroleo dark:bg-[#8FB8C2]" initial={false} animate={{ width: `${pctTaller}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
      <div className="flex justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-naranja" />
          Cliente {dinero(cliente)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-petroleo dark:bg-[#8FB8C2]" />
          Taller {dinero(taller)}
        </span>
      </div>
    </div>
  );
}
