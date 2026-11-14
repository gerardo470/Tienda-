import { motion } from 'framer-motion';
import { useRef } from 'react';
import { dinero, hora } from '../../../lib/format';
import { vibrar } from '../../../lib/haptics';
import { IconoBasura, IconoCamara, IconoCarro, IconoLlave, IconoMas } from '../../../shared/ui/iconos';
import type { Movimiento } from '../types';

interface Props {
  mov: Movimiento;
  /** false en cajas cerradas: no se puede deslizar ni mantener presionado */
  editable?: boolean;
  alVer: (m: Movimiento) => void;
  alEditar?: (m: Movimiento) => void;
  alEliminar?: (m: Movimiento) => void;
}

const UMBRAL_BORRAR = -90;
const TIEMPO_PRESION = 520;

/**
 * Fila de un gasto o abono.
 *  · Tocar: ver el detalle.
 *  · Mantener presionado: editar.
 *  · Deslizar a la izquierda: eliminar (pide confirmación).
 */
export function ItemMovimiento({ mov, editable = false, alVer, alEditar, alEliminar }: Props) {
  const reloj = useRef<number>();
  const presionLarga = useRef(false);
  const arrastrando = useRef(false);

  const esAbono = mov.kind === 'abono';
  const esCliente = mov.type === 'cliente';

  const chip = esAbono ? 'bg-menta-bg text-menta-fg' : esCliente ? 'bg-naranja-bg text-naranja-fg' : 'bg-petroleo-bg text-petroleo-fg';
  const etiqueta = esAbono ? 'Abono' : esCliente ? 'Cliente' : 'Taller';
  const Icono = esAbono ? IconoMas : esCliente ? IconoCarro : IconoLlave;

  const detalle = [esAbono ? null : esCliente ? mov.vehicle || 'Vehículo de cliente' : 'Para el taller', hora(mov.created_at), mov.registered_by]
    .filter(Boolean)
    .join(' · ');

  const cancelarPresion = () => window.clearTimeout(reloj.current);

  return (
    <div className="relative">
      {editable && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-end rounded-[20px] bg-coral pr-5 text-petroleo-tinta">
          <IconoBasura />
        </div>
      )}
      <motion.article
        layout
        drag={editable ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.55, right: 0 }}
        dragSnapToOrigin
        onDragStart={() => {
          arrastrando.current = true;
          cancelarPresion();
        }}
        onDragEnd={(_e, info) => {
          window.setTimeout(() => (arrastrando.current = false), 50);
          if (info.offset.x < UMBRAL_BORRAR) {
            vibrar('alerta');
            alEliminar?.(mov);
          }
        }}
        onPointerDown={() => {
          presionLarga.current = false;
          if (!editable) return;
          reloj.current = window.setTimeout(() => {
            presionLarga.current = true;
            vibrar('toque');
            alEditar?.(mov);
          }, TIEMPO_PRESION);
        }}
        onPointerUp={cancelarPresion}
        onPointerLeave={cancelarPresion}
        onPointerCancel={cancelarPresion}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (presionLarga.current || arrastrando.current) return;
          alVer(mov);
        }}
        whileTap={{ scale: 0.98 }}
        className="relative flex cursor-pointer items-center gap-3 rounded-[20px] bg-tarjeta px-3 py-2.5 shadow-relieve-sm"
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${chip}`}>
          <Icono />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-extrabold">
            <span className="truncate">{mov.description}</span>
            {mov.receipt_url && <IconoCamara size={15} className="shrink-0 text-suave" />}
          </p>
          <p className="truncate text-xs font-semibold text-suave">{detalle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <p className={`font-display text-lg font-bold leading-[22px] ${esAbono ? 'text-menta-fg' : 'text-coral-fg'}`}>
            {esAbono ? '+' : '−'}
            {dinero(mov.amount)}
          </p>
          <span className={`rounded-full px-2 py-px text-[11px] font-extrabold ${chip}`}>{etiqueta}</span>
        </div>
      </motion.article>
    </div>
  );
}
