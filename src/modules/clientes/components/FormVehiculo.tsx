import { useEffect, useState, type FormEvent } from 'react';
import { Boton } from '../../../shared/ui/Boton';
import { Campo, entero, textoONulo } from '../../../shared/ui/Campo';
import { Hoja } from '../../../shared/ui/Hoja';
import type { DatosVehiculo, Vehiculo } from '../types';

interface Props {
  abierta: boolean;
  vehiculo?: Vehiculo | null;
  alGuardar: (datos: DatosVehiculo) => Promise<void>;
  alCerrar: () => void;
}

/** Formulario para agregar o editar un vehículo, con su recordatorio de próximo servicio. */
export function FormVehiculo({ abierta, vehiculo, alGuardar, alCerrar }: Props) {
  const [f, setF] = useState({ placa: '', marca: '', modelo: '', anio: '', color: '', km: '', notas: '', proxNota: '', proxKm: '', proxFecha: '' });
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const cambiar = (campo: keyof typeof f) => (valor: string) => setF((p) => ({ ...p, [campo]: valor }));

  useEffect(() => {
    if (!abierta) return;
    setF({
      placa: vehiculo?.placa ?? '',
      marca: vehiculo?.marca ?? '',
      modelo: vehiculo?.modelo ?? '',
      anio: vehiculo?.anio?.toString() ?? '',
      color: vehiculo?.color ?? '',
      km: vehiculo?.kilometraje_actual?.toString() ?? '',
      notas: vehiculo?.notas ?? '',
      proxNota: vehiculo?.proximo_servicio_nota ?? '',
      proxKm: vehiculo?.proximo_servicio_km?.toString() ?? '',
      proxFecha: vehiculo?.proximo_servicio_fecha ?? '',
    });
    setError(null);
    setOcupado(false);
  }, [abierta, vehiculo]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!f.placa.trim() && !f.marca.trim() && !f.modelo.trim()) {
      setError('Escriba al menos la placa o la marca del vehículo.');
      return;
    }
    const anio = entero(f.anio);
    if (anio != null && (anio < 1900 || anio > 2100)) {
      setError('Revise el año del vehículo.');
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      await alGuardar({
        placa: textoONulo(f.placa.toUpperCase()),
        marca: textoONulo(f.marca),
        modelo: textoONulo(f.modelo),
        anio,
        color: textoONulo(f.color),
        kilometraje_actual: entero(f.km),
        notas: textoONulo(f.notas),
        proximo_servicio_nota: textoONulo(f.proxNota),
        proximo_servicio_km: entero(f.proxKm),
        proximo_servicio_fecha: f.proxFecha || null,
      });
      alCerrar();
    } catch {
      setError('No se pudo guardar. Revise el internet e intente de nuevo.');
      setOcupado(false);
    }
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={vehiculo ? 'Editar vehículo' : 'Nuevo vehículo'}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Campo id="veh-placa" etiqueta="Placa" valor={f.placa} alCambiar={cambiar('placa')} autoCapitalize="characters" placeholder="P 123-456" />
          <Campo id="veh-anio" etiqueta="Año" valor={f.anio} alCambiar={cambiar('anio')} inputMode="numeric" placeholder="2015" />
          <Campo id="veh-marca" etiqueta="Marca" valor={f.marca} alCambiar={cambiar('marca')} autoCapitalize="words" placeholder="Toyota" />
          <Campo id="veh-modelo" etiqueta="Modelo" valor={f.modelo} alCambiar={cambiar('modelo')} autoCapitalize="words" placeholder="Hilux" />
          <Campo id="veh-color" etiqueta="Color" valor={f.color} alCambiar={cambiar('color')} autoCapitalize="words" placeholder="Gris" />
          <Campo id="veh-km" etiqueta="Kilometraje" valor={f.km} alCambiar={cambiar('km')} inputMode="numeric" placeholder="120000" />
        </div>
        <Campo id="veh-notas" etiqueta="Notas (opcional)" valor={f.notas} alCambiar={cambiar('notas')} placeholder="Ej. Diésel, 4x4" />

        <fieldset className="rounded-3xl border-2 border-borde p-3">
          <legend className="px-1 text-[13px] font-extrabold uppercase tracking-wide text-suave">Próximo servicio (opcional)</legend>
          <div className="flex flex-col gap-3">
            <Campo id="veh-prox-nota" etiqueta="Qué le toca" valor={f.proxNota} alCambiar={cambiar('proxNota')} placeholder="Ej. Cambio de aceite" />
            <div className="grid grid-cols-2 gap-3">
              <Campo id="veh-prox-km" etiqueta="A los km" valor={f.proxKm} alCambiar={cambiar('proxKm')} inputMode="numeric" placeholder="125000" />
              <Campo id="veh-prox-fecha" etiqueta="O en fecha" valor={f.proxFecha} alCambiar={cambiar('proxFecha')} type="date" className="px-3 text-[15px]" />
            </div>
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}
        <Boton type="submit" ancho tamano="grande" disabled={ocupado}>
          {ocupado ? 'Guardando…' : vehiculo ? 'Guardar cambios' : 'Guardar vehículo'}
        </Boton>
      </form>
    </Hoja>
  );
}
