import { useEffect, useState, type ReactNode } from 'react';
import { Llavecita } from '../mascot/Llavecita';
import { Boton } from './Boton';
import { Hoja } from './Hoja';

interface Props {
  abierta: boolean;
  titulo: string;
  mensaje: ReactNode;
  /** Palabra que hay que escribir para confirmar, por ejemplo "BORRAR" */
  palabra: string;
  textoSi: string;
  ocupado?: boolean;
  error?: string | null;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/** Confirmación fuerte: el botón solo se activa al escribir la palabra indicada. */
export function ConfirmarPalabra({ abierta, titulo, mensaje, palabra, textoSi, ocupado, error, alConfirmar, alCancelar }: Props) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (abierta) setTexto('');
  }, [abierta]);

  return (
    <Hoja abierta={abierta} alCerrar={alCancelar} titulo={titulo}>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <Llavecita animo="preocupada" size={84} soloCabeza className="shrink-0" />
          <p className="text-[15px] font-bold leading-snug text-suave">{mensaje}</p>
        </div>
        <div>
          <label className="etiqueta" htmlFor="confirmar-palabra">
            Para confirmar, escriba {palabra}
          </label>
          <input id="confirmar-palabra" className="campo" autoCapitalize="characters" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={palabra} />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Boton variante="neutro" onClick={alCancelar} disabled={ocupado}>
            Mejor no
          </Boton>
          <Boton variante="coral" disabled={ocupado || texto.trim().toUpperCase() !== palabra} onClick={alConfirmar}>
            {ocupado ? 'Un momento…' : textoSi}
          </Boton>
        </div>
      </div>
    </Hoja>
  );
}
