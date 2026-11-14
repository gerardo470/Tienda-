import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { dinero, fechaCorta, hoyISO, inicioMesISO, sumar } from '../../../lib/format';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { NumeroAnimado } from '../../../shared/ui/NumeroAnimado';
import { Vacio } from '../../../shared/ui/Vacio';
import { calcularTotales } from '../calculos';
import { useCaja } from '../CajaProvider';
import { Dona } from '../components/Dona';
import { FiltroFechas } from '../components/FiltroFechas';
import { repoCaja } from '../repo';
import type { SesionCompleta } from '../types';

/** Reportes: totales del período y proporción Cliente vs Taller. */
export function PantallaReportes() {
  const { sesion: abierta } = useCaja();
  const [rango, setRango] = useState({ desde: inicioMesISO(), hasta: hoyISO() });
  const [cerradas, setCerradas] = useState<SesionCompleta[] | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    setFallo(false);
    repoCaja
      .sesionesCerradas(rango)
      .then((lista) => vigente && setCerradas(lista))
      .catch(() => {
        if (!vigente) return;
        setCerradas([]);
        setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, [rango]);

  const r = useMemo(() => {
    // La caja abierta también cuenta si cae dentro de las fechas.
    const dia = abierta ? hoyISO(new Date(abierta.opened_at)) : '';
    const incluirAbierta = abierta && (!rango.desde || dia >= rango.desde) && (!rango.hasta || dia <= rango.hasta);
    const todas = [...(incluirAbierta ? [abierta] : []), ...(cerradas ?? [])];
    const porSesion = todas.map((s) => ({ s, t: calcularTotales(s) }));
    return {
      porSesion,
      gastos: sumar(porSesion.map((x) => x.t.gastos)),
      abonos: sumar(porSesion.map((x) => x.t.abonos)),
      cliente: sumar(porSesion.map((x) => x.t.gastosCliente)),
      taller: sumar(porSesion.map((x) => x.t.gastosTaller)),
      diferencia: sumar(porSesion.map((x) => x.t.diferencia ?? 0)),
      mayor: Math.max(0, ...porSesion.map((x) => x.t.gastos)),
    };
  }, [abierta, cerradas, rango]);

  return (
    <>
      <Cabecera titulo="Reportes" subtitulo="Cómo va el gasto del taller" animo={fallo ? 'preocupada' : 'pensativa'} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <FiltroFechas desde={rango.desde} hasta={rango.hasta} alCambiar={setRango} />

        {cerradas === null ? (
          <p className="py-8 text-center text-[15px] font-bold text-suave">Sacando cuentas…</p>
        ) : fallo ? (
          <Vacio animo="preocupada" titulo="No se pudo cargar" texto="Revise el internet y vuelva a entrar a Reportes." />
        ) : r.porSesion.length === 0 ? (
          <Vacio animo="pensativa" titulo="No hay datos en estas fechas" texto="Pruebe con otro rango de fechas." />
        ) : (
          <>
            <section className="tarjeta flex flex-col gap-3 p-4">
              <h2 className="font-display text-lg font-bold leading-6">Gastos: Cliente vs Taller</h2>
              <Dona cliente={r.cliente} taller={r.taller} />
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-coral-bg px-4 py-3 text-coral-fg">
                <p className="text-xs font-extrabold">Total gastado</p>
                <NumeroAnimado valor={r.gastos} className="block font-display text-2xl font-bold leading-7" />
              </div>
              <div className="rounded-3xl bg-menta-bg px-4 py-3 text-menta-fg">
                <p className="text-xs font-extrabold">Total abonos</p>
                <NumeroAnimado valor={r.abonos} className="block font-display text-2xl font-bold leading-7" />
              </div>
              <div className="rounded-3xl bg-petroleo-bg px-4 py-3 text-petroleo-fg">
                <p className="text-xs font-extrabold">Cajas</p>
                <p className="font-display text-2xl font-bold leading-7">{r.porSesion.length}</p>
              </div>
              <div className={`rounded-3xl px-4 py-3 ${r.diferencia < 0 ? 'bg-coral-bg text-coral-fg' : 'bg-naranja-bg text-naranja-fg'}`}>
                <p className="text-xs font-extrabold">{r.diferencia < 0 ? 'Faltante acumulado' : r.diferencia > 0 ? 'Sobrante acumulado' : 'Diferencias'}</p>
                <p className="font-display text-2xl font-bold leading-7">{dinero(Math.abs(r.diferencia))}</p>
              </div>
            </section>

            <section className="tarjeta flex flex-col gap-2.5 p-4">
              <h2 className="font-display text-lg font-bold leading-6">Gasto por caja</h2>
              {r.porSesion.slice(0, 10).map(({ s, t }, i) => (
                <div key={s.id} className="flex items-center gap-3 text-xs font-bold">
                  <span className="w-[86px] shrink-0 text-suave">{s.status === 'open' ? 'Caja abierta' : fechaCorta(s.opened_at)}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-borde">
                    <motion.div
                      className="h-full rounded-full bg-coral"
                      initial={{ width: 0 }}
                      animate={{ width: `${r.mayor > 0 ? (t.gastos / r.mayor) * 100 : 0}%` }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="w-[70px] shrink-0 text-right font-display text-sm">{dinero(t.gastos)}</span>
                </div>
              ))}
              {r.porSesion.length > 10 && <p className="text-xs font-semibold text-suave">Se muestran las 10 cajas más recientes.</p>}
            </section>
          </>
        )}
      </div>
    </>
  );
}
