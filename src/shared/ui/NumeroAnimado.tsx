import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { dinero } from '../../lib/format';
import { useAjustes } from '../settings/AjustesProvider';

/** Monto que sube o baja como contador cuando cambia. */
export function NumeroAnimado({ valor, className }: { valor: number; className?: string }) {
  const { animaciones } = useAjustes();
  const ref = useRef<HTMLSpanElement>(null);
  const previo = useRef(valor);

  useEffect(() => {
    const desde = previo.current;
    previo.current = valor;
    const pintar = (v: number) => {
      if (ref.current) ref.current.textContent = dinero(v);
    };
    if (!animaciones || desde === valor) {
      pintar(valor);
      return;
    }
    const control = animate(desde, valor, { duration: 0.7, ease: 'easeOut', onUpdate: pintar });
    return () => {
      control.stop();
      pintar(valor);
    };
  }, [valor, animaciones]);

  return (
    <span ref={ref} className={className} aria-label={dinero(valor)}>
      {dinero(previo.current)}
    </span>
  );
}
