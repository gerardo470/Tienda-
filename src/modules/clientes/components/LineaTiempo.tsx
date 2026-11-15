import { motion } from 'framer-motion';
import { dinero, km, mesAnio } from '../../../lib/format';
import { nombreVehiculo } from '../calculos';
import type { Servicio, Vehiculo } from '../types';

const PAGO: Record<string, { texto: string; clase: string }> = {
  pagado: { texto: 'Pagado', clase: 'bg-menta-bg text-menta-fg' },
  abonado: { texto: 'Abonado', clase: 'bg-naranja-bg text-naranja-fg' },
  pendiente: { texto: 'Pendiente', clase: 'bg-coral-bg text-coral-fg' },
};

interface Props {
  servicios: Servicio[];
  /** Si se pasa, cada servicio muestra a qué vehículo pertenece */
  vehiculos?: Vehiculo[];
  alTocar: (s: Servicio) => void;
}

/** Línea de tiempo vertical: "Nov 2026 – Cambio de aceite – $35". */
export function LineaTiempo({ servicios, vehiculos, alTocar }: Props) {
  return (
    <ol className="relative ml-2 flex flex-col gap-2.5 border-l-4 border-borde pl-5">
      {servicios.map((s, i) => {
        const v = vehiculos?.find((x) => x.id === s.vehiculo_id);
        const pago = PAGO[s.estado_pago];
        return (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04, type: 'spring', stiffness: 380, damping: 28 }}
            className="relative"
          >
            <span aria-hidden="true" className="absolute -left-[32px] top-4 h-4 w-4 rounded-full border-4 border-fondo bg-naranja" />
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => alTocar(s)} className="w-full rounded-[20px] bg-tarjeta px-3.5 py-2.5 text-left shadow-relieve-sm">
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[15px] font-extrabold">
                  <span className="text-suave">{mesAnio(s.fecha)} – </span>
                  {s.tipo}
                </span>
                <span className="shrink-0 font-display text-lg font-bold leading-6">{dinero(s.costo)}</span>
              </span>
              {s.descripcion && <span className="block truncate text-[13px] font-semibold text-suave">{s.descripcion}</span>}
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
                <span className={`rounded-full px-2 py-px ${pago.clase}`}>{pago.texto}</span>
                {v && <span className="rounded-full bg-petroleo-bg px-2 py-px text-petroleo-fg">{nombreVehiculo(v)}</span>}
                {s.kilometraje != null && <span className="text-suave">{km(s.kilometraje)}</span>}
              </span>
            </motion.button>
          </motion.li>
        );
      })}
    </ol>
  );
}
