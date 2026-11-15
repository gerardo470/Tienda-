import { useEffect, useState, type FormEvent } from 'react';
import { Boton } from '../../../shared/ui/Boton';
import { Campo, textoONulo } from '../../../shared/ui/Campo';
import { Hoja } from '../../../shared/ui/Hoja';
import type { Cliente, DatosCliente } from '../types';

interface Props {
  abierta: boolean;
  cliente?: Cliente | null;
  alGuardar: (datos: DatosCliente) => Promise<void>;
  alCerrar: () => void;
}

/** Formulario para agregar o editar un cliente. */
export function FormCliente({ abierta, cliente, alGuardar, alCerrar }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [notas, setNotas] = useState('');
  const [frecuente, setFrecuente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    setNombre(cliente?.nombre ?? '');
    setTelefono(cliente?.telefono ?? '');
    setWhatsapp(cliente?.whatsapp ?? '');
    setCorreo(cliente?.correo ?? '');
    setNotas(cliente?.notas ?? '');
    setFrecuente(cliente?.etiquetas.includes('frecuente') ?? false);
    setError(null);
    setOcupado(false);
  }, [abierta, cliente]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Escriba el nombre del cliente.');
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const otras = (cliente?.etiquetas ?? []).filter((x) => x !== 'frecuente');
      await alGuardar({
        nombre: nombre.trim(),
        telefono: textoONulo(telefono),
        whatsapp: textoONulo(whatsapp),
        correo: textoONulo(correo),
        notas: textoONulo(notas),
        etiquetas: frecuente ? [...otras, 'frecuente'] : otras,
      });
      alCerrar();
    } catch {
      setError('No se pudo guardar. Revise el internet e intente de nuevo.');
      setOcupado(false);
    }
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <Campo id="cli-nombre" etiqueta="Nombre" valor={nombre} alCambiar={setNombre} autoCapitalize="words" placeholder="Ej. Juan Pérez" />
        <div className="grid grid-cols-2 gap-3">
          <Campo id="cli-tel" etiqueta="Teléfono" valor={telefono} alCambiar={setTelefono} inputMode="tel" placeholder="7000-0000" />
          <Campo id="cli-wa" etiqueta="WhatsApp (opcional)" valor={whatsapp} alCambiar={setWhatsapp} inputMode="tel" placeholder="Si es otro" />
        </div>
        <Campo id="cli-correo" etiqueta="Correo (opcional)" valor={correo} alCambiar={setCorreo} type="email" inputMode="email" autoCapitalize="none" placeholder="cliente@correo.com" />
        <Campo id="cli-notas" etiqueta="Notas (opcional)" valor={notas} alCambiar={setNotas} placeholder="Ej. Prefiere que le llamen por la tarde" />
        <button
          type="button"
          role="switch"
          aria-checked={frecuente}
          onClick={() => setFrecuente(!frecuente)}
          className={`flex min-h-[52px] items-center justify-center rounded-2xl border-2 text-[15px] font-extrabold ${frecuente ? 'border-naranja-oscuro bg-naranja text-petroleo-tinta' : 'border-borde bg-campo text-suave'}`}
        >
          {frecuente ? 'Cliente frecuente' : 'Marcar como cliente frecuente'}
        </button>
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}
        <Boton type="submit" ancho tamano="grande" disabled={ocupado}>
          {ocupado ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Guardar cliente'}
        </Boton>
      </form>
    </Hoja>
  );
}
