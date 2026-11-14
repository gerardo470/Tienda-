import type { ReactNode } from 'react';
import { Llavecita, type Animo } from '../mascot/Llavecita';

/** Estado vacío con ilustración de Llavecita. */
export function Vacio({ animo = 'dormida', titulo, texto, children }: { animo?: Animo; titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-6 text-center">
      <Llavecita animo={animo} size={120} />
      <p className="font-display text-xl font-bold leading-tight">{titulo}</p>
      {texto && <p className="max-w-[260px] text-sm font-semibold text-suave">{texto}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
