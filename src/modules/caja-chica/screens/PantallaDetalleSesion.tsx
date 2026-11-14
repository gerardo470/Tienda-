import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dinero, fechaCorta, fechaHora } from '../../../lib/format';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { IconoAtras } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { calcularTotales, textoDiferencia } from '../calculos';
import { BarraReparto } from '../components/BarraReparto';
import { BotonesExportar } from '../components/BotonesExportar';
import { HojaDetalle } from '../components/HojaDetalle';
import { ItemMovimiento } from '../components/ItemMovimiento';
import { repoCaja } from '../repo';
import type { Movimiento, SesionCompleta } from '../types';

function Renglon({ texto, valor, fuerte }: { texto: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2 ${fuerte ? 'text-lg font-extrabold' : 'text-[15px] font-bold'}`}>
      <span className={fuerte ? '' : 'text-suave'}>{texto}</span>
      <span className="font-display font-bold">{valor}</span>
    </div>
  );
}

/** Detalle de una caja cerrada: resumen, movimientos y exportación. */
export function PantallaDetalleSesion() {
  const { id } = useParams();
  const [sesion, setSesion] = useState<SesionCompleta | null | undefined>(undefined);
  const [detalle, setDetalle] = useState<Movimiento | null>(null);

  useEffect(() => {
    let vigente = true;
    setSesion(undefined);
    repoCaja
      .sesion(id ?? '')
      .then((s) => vigente && setSesion(s))
      .catch(() => vigente && setSesion(null));
    return () => {
      vigente = false;
    };
  }, [id]);

  const volver = (
    <Link to="/historial" aria-label="Volver al historial" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-naranja text-petroleo-tinta shadow-[0_4px_0_#C2560A]">
      <IconoAtras />
    </Link>
  );

  if (sesion === undefined) {
    return (
      <>
        <Cabecera titulo="Caja cerrada" animo="pensativa" accion={volver} />
        <p className="py-10 text-center text-[15px] font-bold text-suave">Buscando la caja…</p>
      </>
    );
  }

  if (sesion === null) {
    return (
      <>
        <Cabecera titulo="Caja cerrada" animo="preocupada" accion={volver} />
        <Vacio animo="preocupada" titulo="No se encontró esta caja" texto="Revise el internet o regrese al Historial." />
      </>
    );
  }

  const t = calcularTotales(sesion);
  const d = t.diferencia ?? 0;
  const gastos = sesion.movimientos.filter((m) => m.kind === 'gasto');
  const abonos = sesion.movimientos.filter((m) => m.kind === 'abono');

  return (
    <>
      <Cabecera titulo={fechaCorta(sesion.opened_at)} subtitulo={`Cerrada: ${sesion.closed_at ? fechaHora(sesion.closed_at) : '—'}`} animo={d === 0 ? 'contenta' : 'pensativa'} accion={volver} />

      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <section className="tarjeta px-4 py-1">
          <div className="divide-y-2 divide-borde">
            <Renglon texto="Monto inicial" valor={dinero(t.inicial)} />
            <Renglon texto="+ Abonos" valor={dinero(t.abonos)} />
            <Renglon texto="− Gastos" valor={dinero(t.gastos)} />
            <Renglon texto="Saldo esperado" valor={dinero(t.saldo)} fuerte />
            <Renglon texto="Efectivo contado" valor={sesion.counted_amount == null ? '—' : dinero(sesion.counted_amount)} />
          </div>
          <div
            className={`-mx-1 mb-3 mt-1 flex items-center justify-between rounded-2xl px-4 py-2.5 font-extrabold ${
              d === 0 ? 'bg-menta-bg text-menta-fg' : d > 0 ? 'bg-naranja-bg text-naranja-fg' : 'bg-coral-bg text-coral-fg'
            }`}
          >
            <span>{d === 0 ? 'La caja cuadró cabal' : textoDiferencia(d)}</span>
            {d !== 0 && <span className="font-display text-xl">{dinero(Math.abs(d))}</span>}
          </div>
        </section>

        <section className="tarjeta flex flex-col gap-2 p-4">
          <h2 className="font-display text-lg font-bold leading-6">Gastos: Cliente vs Taller</h2>
          <BarraReparto cliente={t.gastosCliente} taller={t.gastosTaller} />
        </section>

        <BotonesExportar sesion={sesion} />

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-[19px] font-bold leading-6">Gastos ({gastos.length})</h2>
          {gastos.length === 0 ? (
            <p className="text-sm font-semibold text-suave">Esta caja no tuvo gastos.</p>
          ) : (
            gastos.map((m) => <ItemMovimiento key={m.id} mov={m} alVer={setDetalle} />)
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-[19px] font-bold leading-6">Abonos ({abonos.length})</h2>
          {abonos.length === 0 ? (
            <p className="text-sm font-semibold text-suave">Esta caja no tuvo abonos.</p>
          ) : (
            abonos.map((m) => <ItemMovimiento key={m.id} mov={m} alVer={setDetalle} />)
          )}
        </section>
      </div>

      <HojaDetalle mov={detalle} alCerrar={() => setDetalle(null)} />
    </>
  );
}
