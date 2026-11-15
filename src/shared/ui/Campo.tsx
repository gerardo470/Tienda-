import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
}

/** Campo de texto con su etiqueta. */
export function Campo({ id, etiqueta, valor, alCambiar, className = '', ...rest }: Props) {
  return (
    <div className="min-w-0">
      <label className="etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input id={id} className={`campo ${className}`} value={valor} onChange={(e) => alCambiar(e.target.value)} {...rest} />
    </div>
  );
}

/** "12,500" -> 12500 · "" -> null */
export function entero(texto: string): number | null {
  const d = texto.replace(/\D/g, '');
  return d ? Number.parseInt(d, 10) : null;
}

/** "" -> null · " hola " -> "hola" */
export const textoONulo = (t: string) => t.trim() || null;
