import type { ReactNode } from 'react';
import { Llavecita, type Animo } from '../mascot/Llavecita';
import { Boton } from './Boton';
import { Hoja } from './Hoja';

interface Props {
  abierta: boolean;
  titulo: string;
  mensaje: ReactNode;
  textoSi: string;
  textoNo?: string;
  animo?: Animo;
  peligro?: boolean;
  ocupado?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/** Pregunta de confirmación con Llavecita. */
export function Confirmar({ abierta, titulo, mensaje, textoSi, textoNo = 'Mejor no', animo = 'pensativa', peligro, ocupado, alConfirmar, alCancelar }: Props) {
  return (
    <Hoja abierta={abierta} alCerrar={alCancelar} titulo={titulo}>
      <div className="flex items-center gap-3 pb-4">
        <Llavecita animo={animo} size={84} soloCabeza className="shrink-0" />
        <p className="text-[15px] font-bold leading-snug text-suave">{mensaje}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Boton variante="neutro" onClick={alCancelar} disabled={ocupado}>
          {textoNo}
        </Boton>
        <Boton variante={peligro ? 'coral' : 'naranja'} onClick={alConfirmar} disabled={ocupado}>
          {ocupado ? 'Un momento…' : textoSi}
        </Boton>
      </div>
    </Hoja>
  );
}
