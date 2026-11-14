import { motion } from 'framer-motion';
import { dinero } from '../../../lib/format';

/** Gráfico circular animado: proporción de gastos Cliente vs Taller. */
export function Dona({ cliente, taller }: { cliente: number; taller: number }) {
  const total = cliente + taller;
  const R = 54;
  const C = 2 * Math.PI * R;
  const parteCliente = total > 0 ? cliente / total : 0;
  const pct = Math.round(parteCliente * 100);

  return (
    <div className="flex items-center gap-4">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        role="img"
        aria-label={`Cliente ${pct} por ciento, taller ${total > 0 ? 100 - pct : 0} por ciento`}
        className="shrink-0"
      >
        <g transform="rotate(-90 70 70)" fill="none" strokeWidth="22">
          {/* Aro completo = Taller; encima se dibuja la parte de Cliente */}
          <circle cx="70" cy="70" r={R} className={total > 0 ? 'stroke-petroleo dark:stroke-[#8FB8C2]' : 'stroke-borde'} />
          <motion.circle
            cx="70"
            cy="70"
            r={R}
            stroke="#FF8A1F"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - parteCliente) }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </g>
        <text x="70" y="66" textAnchor="middle" className="fill-tinta font-display text-[26px] font-extrabold">
          {total > 0 ? `${pct}%` : '—'}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-suave text-[12px] font-extrabold">
          cliente
        </text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-suave">
            <span className="h-2.5 w-2.5 rounded-full bg-naranja" />
            Cliente
          </p>
          <p className="font-display text-2xl font-bold leading-7">{dinero(cliente)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-suave">
            <span className="h-2.5 w-2.5 rounded-full bg-petroleo dark:bg-[#8FB8C2]" />
            Taller
          </p>
          <p className="font-display text-2xl font-bold leading-7">{dinero(taller)}</p>
        </div>
      </div>
    </div>
  );
}
