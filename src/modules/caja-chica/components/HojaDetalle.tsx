import { useEffect, useState } from 'react';
import { dinero, fechaHora } from '../../../lib/format';
import { Boton } from '../../../shared/ui/Boton';
import { Hoja } from '../../../shared/ui/Hoja';
import { IconoBasura, IconoLapiz } from '../../../shared/ui/iconos';
import { repoCaja } from '../repo';
import type { Movimiento } from '../types';

interface Props {
  mov: Movimiento | null;
  editable?: boolean;
  alCerrar: () => void;
  alEditar?: (m: Movimiento) => void;
  alEliminar?: (m: Movimiento) => void;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-[15px]">
      <span className="font-bold text-suave">{etiqueta}</span>
      <span className="text-right font-extrabold">{valor}</span>
    </div>
  );
}

/** Detalle de un movimiento, con la foto del recibo si tiene. */
export function HojaDetalle({ mov, editable, alCerrar, alEditar, alEliminar }: Props) {
  const [foto, setFoto] = useState<string | null>(null);
  const [falloFoto, setFalloFoto] = useState(false);

  useEffect(() => {
    setFoto(null);
    setFalloFoto(false);
    if (!mov?.receipt_url) return;
    let vigente = true;
    repoCaja
      .urlRecibo(mov.receipt_url)
      .then((url) => vigente && setFoto(url))
      .catch(() => vigente && setFalloFoto(true));
    return () => {
      vigente = false;
    };
  }, [mov]);

  const esAbono = mov?.kind === 'abono';

  return (
    <Hoja abierta={!!mov} alCerrar={alCerrar} titulo={esAbono ? 'Detalle del abono' : 'Detalle del gasto'}>
      {mov && (
        <div className="flex flex-col gap-3">
          <div className="tarjeta px-4 py-3">
            <p className={`font-display text-4xl font-extrabold ${esAbono ? 'text-menta-fg' : 'text-coral-fg'}`}>
              {esAbono ? '+' : '−'}
              {dinero(mov.amount)}
            </p>
            <p className="text-lg font-extrabold leading-snug">{mov.description}</p>
            <div className="mt-2 divide-y-2 divide-borde">
              {!esAbono && <Dato etiqueta="Tipo" valor={mov.type === 'cliente' ? 'Cliente' : 'Taller'} />}
              {mov.vehicle && <Dato etiqueta="Vehículo" valor={mov.vehicle} />}
              <Dato etiqueta={esAbono ? 'Lo entregó' : 'Lo registró'} valor={mov.registered_by || 'Sin nombre'} />
              <Dato etiqueta="Fecha" valor={fechaHora(mov.created_at)} />
              {mov.updated_at && <Dato etiqueta="Editado" valor={fechaHora(mov.updated_at)} />}
            </div>
          </div>

          {mov.receipt_url && (
            <div className="tarjeta overflow-hidden p-2">
              {foto ? (
                <a href={foto} target="_blank" rel="noreferrer">
                  <img src={foto} alt="Foto del recibo" className="max-h-80 w-full rounded-3xl object-contain" />
                </a>
              ) : (
                <p className="px-3 py-6 text-center text-sm font-bold text-suave">
                  {falloFoto ? 'No se pudo cargar la foto del recibo.' : 'Cargando foto del recibo…'}
                </p>
              )}
            </div>
          )}

          {editable && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Boton variante="neutro" onClick={() => alEliminar?.(mov)}>
                <IconoBasura size={20} />
                Eliminar
              </Boton>
              <Boton onClick={() => alEditar?.(mov)}>
                <IconoLapiz size={20} />
                Editar
              </Boton>
            </div>
          )}
        </div>
      )}
    </Hoja>
  );
}
