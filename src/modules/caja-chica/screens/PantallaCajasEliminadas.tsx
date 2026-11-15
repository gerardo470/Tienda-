import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dinero, fechaHora, fechaLarga } from '../../../lib/format';
import { useMascota } from '../../../shared/mascot/MascotaProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { IconoAtras } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { calcularTotales } from '../calculos';
import { useCaja } from '../CajaProvider';
import { repoCaja } from '../repo';
import type { SesionCompleta } from '../types';

/** Cajas eliminadas (solo admin): se pueden revisar y restaurar. */
export function PantallaCajasEliminadas() {
  const { decir } = useMascota();
  const { recargar } = useCaja();
  const [cajas, setCajas] = useState<SesionCompleta[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () =>
    repoCaja
      .sesionesEliminadas()
      .then(setCajas)
      .catch(() => setFallo(true));

  useEffect(() => {
    void cargar();
  }, []);

  async function restaurar(id: string) {
    setOcupada(id);
    setError(null);
    try {
      await repoCaja.restaurarSesion(id);
      await Promise.all([cargar(), recargar()]);
      decir('¡Caja restaurada, jefe!', 'contenta');
    } catch (e) {
      setError(e instanceof Error && e.message.includes('abierta') ? e.message : 'No se pudo restaurar. Revise el internet e intente de nuevo.');
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      <Cabecera
        titulo="Cajas eliminadas"
        subtitulo="Se pueden restaurar"
        animo={fallo ? 'preocupada' : 'pensativa'}
        accion={
          <Link to="/historial" aria-label="Volver al historial" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-naranja text-petroleo-tinta shadow-[0_4px_0_#C2560A]">
            <IconoAtras />
          </Link>
        }
      />
      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}
        {cajas === null && !fallo ? (
          <p className="py-8 text-center text-[15px] font-bold text-suave">Buscando…</p>
        ) : fallo ? (
          <Vacio animo="preocupada" titulo="No se pudo cargar" texto="Revise el internet y vuelva a entrar." />
        ) : cajas!.length === 0 ? (
          <Vacio animo="feliz" titulo="No hay cajas eliminadas" texto="Si elimina una caja por error, aquí la puede recuperar." />
        ) : (
          cajas!.map((s) => {
            const t = calcularTotales(s);
            return (
              <section key={s.id} className="tarjeta flex flex-col gap-2.5 p-4">
                <Link to={`/historial/${s.id}`} className="block">
                  <p className="text-[15px] font-extrabold first-letter:uppercase">{fechaLarga(s.opened_at)}</p>
                  <p className="text-xs font-semibold text-suave">
                    {s.status === 'open' ? 'Estaba abierta' : 'Cerrada'} · Inicial {dinero(t.inicial)} · {t.numGastos} {t.numGastos === 1 ? 'gasto' : 'gastos'} · {t.numAbonos}{' '}
                    {t.numAbonos === 1 ? 'abono' : 'abonos'}
                  </p>
                  <p className="text-xs font-bold text-coral-fg">
                    Eliminada el {s.deleted_at ? fechaHora(s.deleted_at) : '—'}
                    {s.deleted_by ? ` por ${s.deleted_by}` : ''}
                  </p>
                </Link>
                <Boton variante="neutro" ancho disabled={!!ocupada} onClick={() => restaurar(s.id)}>
                  {ocupada === s.id ? 'Restaurando…' : 'Restaurar'}
                </Boton>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
