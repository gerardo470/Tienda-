import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { vibrar } from '../../lib/haptics';
import { modulos } from '../../modules/registro';
import { useAjustes } from '../settings/AjustesProvider';

const botones = modulos.flatMap((m) => m.navegacion);

/** Barra inferior de navegación con iconos animados. */
export function BarraInferior() {
  const { pathname } = useLocation();
  const { animaciones } = useAjustes();

  return (
    <nav
      aria-label="Navegación principal"
      className="relative z-20 grid shrink-0 gap-1 rounded-t-[26px] bg-tarjeta px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_0_var(--borde)]"
      style={{ gridTemplateColumns: `repeat(${botones.length}, minmax(0, 1fr))` }}
    >
      {botones.map(({ ruta, etiqueta, Icono }) => {
        const activo = ruta === '/' ? pathname === '/' : pathname.startsWith(ruta);
        return (
          <NavLink
            key={ruta}
            to={ruta}
            onClick={() => animaciones && vibrar('toque')}
            aria-current={activo ? 'page' : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs ${activo ? 'font-extrabold text-tinta' : 'font-bold text-suave'}`}
          >
            <span className="relative flex h-[30px] w-14 items-center justify-center">
              {activo && <motion.span layoutId="nav-activo" className="absolute inset-0 rounded-full bg-naranja" transition={{ type: 'spring', stiffness: 500, damping: 32 }} />}
              <motion.span
                className={`relative ${activo ? 'text-petroleo-tinta' : ''}`}
                animate={activo ? { y: [0, -5, 0], rotate: [0, -10, 8, 0] } : { y: 0, rotate: 0 }}
                transition={{ duration: 0.45 }}
              >
                <Icono size={22} />
              </motion.span>
            </span>
            {etiqueta}
          </NavLink>
        );
      })}
    </nav>
  );
}
