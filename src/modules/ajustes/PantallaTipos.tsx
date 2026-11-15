import { useState, type FormEvent } from 'react';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { Boton } from '../../shared/ui/Boton';
import { Cabecera } from '../../shared/ui/Cabecera';
import { IconoLlave } from '../../shared/ui/iconos';
import { Interruptor } from '../../shared/ui/Interruptor';
import { useClientes } from '../clientes/ClientesProvider';
import { repoClientes } from '../clientes/repo';
import { BotonVolver } from '../clientes/screens/PantallaCliente';

/** Ajustes > Tipos de servicio (solo admin): agregar tipos y ocultar los que no se usan. */
export function PantallaTipos() {
  const { catalogo, recargar } = useClientes();
  const { decir } = useMascota();
  const [nuevo, setNuevo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    const nombre = nuevo.trim();
    if (!nombre) return;
    if (catalogo.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) return decir('Ese tipo ya existe, jefe.', 'pensativa');
    setOcupado(true);
    try {
      await repoClientes.agregarTipo(nombre);
      await recargar();
      setNuevo('');
      decir('¡Tipo agregado, jefe!', 'guino');
    } catch {
      decir('No se pudo agregar.', 'preocupada');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Cabecera titulo="Tipos de servicio" subtitulo="Lo que se ofrece en el taller" animo="feliz" accion={<BotonVolver a="/ajustes" texto="Volver a ajustes" />} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <form onSubmit={agregar} className="flex gap-2.5">
          <input className="campo" placeholder="Nuevo tipo, ej. Alineado" value={nuevo} onChange={(e) => setNuevo(e.target.value)} aria-label="Nombre del nuevo tipo" autoCapitalize="sentences" />
          <Boton type="submit" disabled={ocupado || !nuevo.trim()} className="shrink-0">
            Agregar
          </Boton>
        </form>
        <section className="tarjeta divide-y-2 divide-borde overflow-hidden">
          {catalogo.map((t) => (
            <Interruptor
              key={t.id}
              icono={<IconoLlave />}
              titulo={t.nombre}
              descripcion={t.activo ? 'Aparece al registrar un servicio' : 'Oculto'}
              activo={t.activo}
              alCambiar={async (v) => {
                try {
                  await repoClientes.activarTipo(t.id, v);
                  await recargar();
                } catch {
                  decir('No se pudo cambiar.', 'preocupada');
                }
              }}
            />
          ))}
        </section>
        <p className="text-xs font-semibold text-suave">Ocultar un tipo no cambia los servicios que ya se registraron con él.</p>
      </div>
    </>
  );
}
