import { IconoCaja, IconoHistorial, IconoReportes } from '../../shared/ui/iconos';
import type { Rol } from '../../shared/auth/perfiles';
import type { ModuloApp } from '../tipos';
import { CajaProvider } from './CajaProvider';
import { PantallaCaja } from './screens/PantallaCaja';
import { PantallaCajasEliminadas } from './screens/PantallaCajasEliminadas';
import { PantallaDetalleSesion } from './screens/PantallaDetalleSesion';
import { PantallaHistorial } from './screens/PantallaHistorial';
import { PantallaReportes } from './screens/PantallaReportes';

// La caja chica la manejan el admin y el cajero.
const roles: Rol[] = ['admin', 'cajero'];

/** Módulo CAJA CHICA */
export const moduloCajaChica: ModuloApp = {
  id: 'caja-chica',
  Proveedor: CajaProvider,
  rutas: [
    { ruta: '/', roles, pantalla: <PantallaCaja /> },
    { ruta: '/historial', roles, pantalla: <PantallaHistorial /> },
    { ruta: '/historial/eliminadas', roles: ['admin'], pantalla: <PantallaCajasEliminadas /> },
    { ruta: '/historial/:id', roles, pantalla: <PantallaDetalleSesion /> },
    { ruta: '/reportes', roles, pantalla: <PantallaReportes /> },
  ],
  navegacion: [
    { ruta: '/', etiqueta: 'Caja', Icono: IconoCaja, orden: 1, roles },
    { ruta: '/historial', etiqueta: 'Historial', Icono: IconoHistorial, orden: 3, roles },
    { ruta: '/reportes', etiqueta: 'Reportes', Icono: IconoReportes, orden: 4, roles },
  ],
};
