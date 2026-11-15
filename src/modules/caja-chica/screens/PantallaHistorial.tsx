import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dinero, fechaLarga, hora, hoyISO, inicioMesISO } from '../../../lib/format';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { IconoAdelante } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { calcularTotales, textoDiferencia } from '../calculos';
import { FiltroFechas } from '../../../shared/ui/FiltroFechas';
import { repoCaja } from '../repo';
import type { SesionCompleta } from '../types';

// El filtro se recuerda mientras la app está abierta.
let rangoGuardado: { desde: string; hasta: string } | null = null;

/** Historial de cajas cerradas, con filtro por fechas. */
export function PantallaHistorial() {
  const [rango, setRango] = useState(() => rangoGuardado ?? { desde: inicioMesISO(), hasta: hoyISO() });
  const [sesiones, setSesiones] = useState<SesionCompleta[] | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    rangoGuardado = rango;
    let vigente = true;
    setFallo(false);
    repoCaja
      .sesionesCerradas(rango)
      .then((lista) => vigente && setSesiones(lista))
      .catch(() => {
        if (!vigente) return;
        setSesiones([]);
        setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, [rango]);

  return (
    <>
      <Cabecera titulo="Historial" subtitulo="Cajas cerradas" animo={fallo ? 'preocupada' : 'feliz'} />
      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        <FiltroFechas desde={rango.desde} hasta={rango.hasta} alCambiar={setRango} />

        {sesiones === null ? (
          <p className="py-8 text-center text-[15px] font-bold text-suave">Buscando cajas…</p>
        ) : fallo ? (
          <Vacio animo="preocupada" titulo="No se pudo cargar" texto="Revise el internet y vuelva a entrar al Historial." />
        ) : sesiones.length === 0 ? (
          <Vacio titulo="No hay cajas en estas fechas" texto="Cuando cierre una caja, aquí queda guardada." />
        ) : (
          sesiones.map((s, i) => {
            const t = calcularTotales(s);
            const d = t.diferencia ?? 0;
            const chip = d === 0 ? 'bg-menta-bg text-menta-fg' : d > 0 ? 'bg-naranja-bg text-naranja-fg' : 'bg-coral-bg text-coral-fg';
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, type: 'spring', stiffness: 380, damping: 28 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to={`/historial/${s.id}`} className="tarjeta flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold first-letter:uppercase">{fechaLarga(s.opened_at)}</p>
                    <p className="text-xs font-semibold text-suave">
                      {hora(s.opened_at)} a {s.closed_at ? hora(s.closed_at) : '—'} · {t.numGastos} {t.numGastos === 1 ? 'gasto' : 'gastos'} · {t.numAbonos}{' '}
                      {t.numAbonos === 1 ? 'abono' : 'abonos'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl font-bold leading-6">{dinero(t.saldo)}</span>
                      <span className={`rounded-full px-2 py-px text-[11px] font-extrabold ${chip}`}>
                        {d === 0 ? 'Cuadrada' : `${textoDiferencia(d)} ${dinero(Math.abs(d))}`}
                      </span>
                    </div>
                  </div>
                  <IconoAdelante className="shrink-0 text-suave" />
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );
}
