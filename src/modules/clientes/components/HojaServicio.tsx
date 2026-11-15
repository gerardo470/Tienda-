import { useEffect, useState } from 'react';
import { dinero, fechaDia, km } from '../../../lib/format';
import { Boton } from '../../../shared/ui/Boton';
import { Hoja } from '../../../shared/ui/Hoja';
import { IconoBasura, IconoLapiz } from '../../../shared/ui/iconos';
import { nombreVehiculo } from '../calculos';
import { useClientes } from '../ClientesProvider';
import { repoClientes } from '../repo';
import { ESTADOS_PAGO, type Servicio, type Vehiculo } from '../types';

interface Props {
  servicio: Servicio | null;
  vehiculo?: Vehiculo;
  editable: boolean;
  alCerrar: () => void;
  alEditar: (s: Servicio) => void;
  alEliminar: (s: Servicio) => void;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-[15px]">
      <span className="font-bold text-suave">{etiqueta}</span>
      <span className="text-right font-extrabold">{valor}</span>
    </div>
  );
}

/** Detalle de un servicio, con sus fotos. */
export function HojaServicio({ servicio, vehiculo, editable, alCerrar, alEditar, alEliminar }: Props) {
  const { equipo } = useClientes();
  const [fotos, setFotos] = useState<string[]>([]);

  useEffect(() => {
    setFotos([]);
    if (!servicio?.fotos.length) return;
    let vigente = true;
    Promise.all(servicio.fotos.map((r) => repoClientes.urlFoto(r).catch(() => '')))
      .then((urls) => vigente && setFotos(urls.filter(Boolean)));
    return () => {
      vigente = false;
    };
  }, [servicio]);

  const mecanico = servicio?.mecanico_id ? equipo.find((p) => p.id === servicio.mecanico_id)?.nombre : null;

  return (
    <Hoja abierta={!!servicio} alCerrar={alCerrar} titulo="Detalle del servicio">
      {servicio && (
        <div className="flex flex-col gap-3">
          <div className="tarjeta px-4 py-3">
            <p className="font-display text-4xl font-extrabold">{dinero(servicio.costo)}</p>
            <p className="text-lg font-extrabold leading-snug">{servicio.tipo}</p>
            {servicio.descripcion && <p className="text-[15px] font-semibold text-suave">{servicio.descripcion}</p>}
            <div className="mt-2 divide-y-2 divide-borde">
              <Dato etiqueta="Fecha" valor={fechaDia(servicio.fecha)} />
              {vehiculo && <Dato etiqueta="Vehículo" valor={`${nombreVehiculo(vehiculo)}${vehiculo.placa ? ` · ${vehiculo.placa}` : ''}`} />}
              <Dato etiqueta="Pago" valor={ESTADOS_PAGO.find((e) => e.id === servicio.estado_pago)?.texto ?? ''} />
              {servicio.kilometraje != null && <Dato etiqueta="Kilometraje" valor={km(servicio.kilometraje)} />}
              {mecanico && <Dato etiqueta="Mecánico" valor={mecanico} />}
              {servicio.notas && <Dato etiqueta="Notas" valor={servicio.notas} />}
            </div>
          </div>

          {servicio.fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {fotos.length === 0 ? (
                <p className="col-span-3 py-3 text-center text-sm font-bold text-suave">Cargando fotos…</p>
              ) : (
                fotos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="Foto del servicio" className="aspect-square w-full rounded-2xl object-cover" />
                  </a>
                ))
              )}
            </div>
          )}

          {editable && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Boton variante="neutro" onClick={() => alEliminar(servicio)}>
                <IconoBasura size={20} />
                Eliminar
              </Boton>
              <Boton onClick={() => alEditar(servicio)}>
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
