import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { modulos } from './modules/registro';
import { AuthProvider, useAuth } from './shared/auth/AuthProvider';
import { PantallaLogin } from './shared/auth/PantallaLogin';
import { Llavecita } from './shared/mascot/Llavecita';
import { MascotaProvider } from './shared/mascot/MascotaProvider';
import { AjustesProvider, useAjustes } from './shared/settings/AjustesProvider';
import { BarraInferior } from './shared/ui/BarraInferior';
import { Boton } from './shared/ui/Boton';
import { Splash } from './shared/ui/Splash';

/** Envuelve la app con el estado compartido de cada módulo. */
function ProveedoresDeModulos({ children }: { children: ReactNode }) {
  return modulos.reduceRight<ReactNode>((dentro, m) => (m.Proveedor ? <m.Proveedor>{dentro}</m.Proveedor> : dentro), children) as JSX.Element;
}

/** Pantallas con transición suave + barra inferior. */
function Marco() {
  const ubicacion = useLocation();
  const cuerpo = useRef<HTMLElement>(null);
  const { rol } = useAuth();
  const inicio =
    modulos
      .flatMap((m) => m.navegacion)
      .sort((a, b) => a.orden - b.orden)
      .find((b) => !b.roles || (rol && b.roles.includes(rol)))?.ruta ?? '/ajustes';

  // Cada pantalla empieza arriba.
  useEffect(() => {
    cuerpo.current?.scrollTo({ top: 0 });
  }, [ubicacion.pathname]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-fondo">
      <main ref={cuerpo} className="sin-barra relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* Cada pantalla entra con un deslizamiento suave */}
        <motion.div key={ubicacion.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <Routes location={ubicacion}>
            {modulos.flatMap((m) => m.rutas.filter((r) => !r.roles || (rol && r.roles.includes(rol))).map((r) => <Route key={r.ruta} path={r.ruta} element={r.pantalla} />))}
            {/* Si su rol no puede ver una pantalla, va a la primera que sí puede */}
            <Route path="*" element={<Navigate to={inicio} replace />} />
          </Routes>
        </motion.div>
      </main>
      <BarraInferior />
    </div>
  );
}

function Contenido() {
  const { cargando, dentro, perfil, salir } = useAuth();
  const { animaciones } = useAjustes();
  const [splash, setSplash] = useState(true);
  const terminarSplash = useCallback(() => setSplash(false), []);

  // Sin animaciones, el splash dura solo lo que tarde en revisar la sesión.
  useEffect(() => {
    if (!animaciones) setSplash(false);
  }, [animaciones]);

  const listo = !cargando;

  return (
    <>
      {listo &&
        (dentro && !perfil ? (
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-2 px-8 text-center">
            <Llavecita animo="preocupada" size={130} />
            <p className="font-display text-2xl font-extrabold">Su usuario no tiene acceso</p>
            <p className="text-sm font-semibold text-suave">Puede que esté desactivado o que falte internet. Pídale al administrador que lo revise.</p>
            <Boton variante="neutro" className="mt-3" onClick={() => void salir()}>
              Cerrar sesión
            </Boton>
          </div>
        ) : dentro ? (
          <ProveedoresDeModulos>
            <BrowserRouter>
              <Marco />
            </BrowserRouter>
          </ProveedoresDeModulos>
        ) : (
          <PantallaLogin />
        ))}
      <AnimatePresence>{(splash || !listo) && <Splash key="splash" alTerminar={terminarSplash} />}</AnimatePresence>
    </>
  );
}

function ConMovimiento({ children }: { children: ReactNode }) {
  const { animaciones } = useAjustes();
  // Si el usuario apaga las animaciones, todo aparece al instante.
  return <MotionConfig reducedMotion={animaciones ? 'never' : 'always'}>{children}</MotionConfig>;
}

export default function App() {
  return (
    <AjustesProvider>
      <ConMovimiento>
        <AuthProvider>
          <MascotaProvider>
            <Contenido />
          </MascotaProvider>
        </AuthProvider>
      </ConMovimiento>
    </AjustesProvider>
  );
}
