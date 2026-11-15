import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IconoAdelante, IconoCampana } from '../../../shared/ui/iconos';
import { nombreVehiculo, recordatorios } from '../calculos';
import { useClientes } from '../ClientesProvider';

/** Recordatorios de próximos servicios (cambio de aceite, etc.). No aparece si no hay ninguno. */
export function TarjetaRecordatorios({ className = '' }: { className?: string }) {
  const { clientes } = useClientes();
  const lista = useMemo(() => recordatorios(clientes).slice(0, 3), [clientes]);
  if (lista.length === 0) return null;

  return (
    <section className={`tarjeta flex flex-col gap-1 p-4 ${className}`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold leading-6">
        <IconoCampana size={20} />
        Próximos servicios
      </h2>
      {lista.map(({ cliente, vehiculo, texto, vencido }) => (
        <Link key={vehiculo.id} to={`/clientes/${cliente.id}/vehiculo/${vehiculo.id}`} className="flex min-h-[48px] items-center gap-2 border-t-2 border-borde pt-1.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-extrabold">
              {cliente.nombre} · {nombreVehiculo(vehiculo)}
            </span>
            <span className={`block truncate text-xs font-bold ${vencido ? 'text-coral-fg' : 'text-suave'}`}>{texto}</span>
          </span>
          <IconoAdelante size={18} className="shrink-0 text-suave" />
        </Link>
      ))}
    </section>
  );
}
