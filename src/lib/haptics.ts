// Vibración corta en acciones importantes (solo si el teléfono lo permite).
type Patron = 'toque' | 'exito' | 'alerta';

const PATRONES: Record<Patron, number | number[]> = {
  toque: 12,
  exito: [18, 40, 28],
  alerta: [40, 60, 40],
};

export function vibrar(patron: Patron = 'toque'): void {
  try {
    navigator.vibrate?.(PATRONES[patron]);
  } catch {
    /* algunos navegadores no lo soportan: no pasa nada */
  }
}
