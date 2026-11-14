import { IconoCaja, IconoHistorial, IconoReportes } from '../../shared/ui/iconos';
import type { ModuloApp } from '../tipos';
import { CajaProvider } from './CajaProvider';
import { PantallaCaja } from './screens/PantallaCaja';
import { PantallaDetalleSesion } from './screens/PantallaDetalleSesion';
import { PantallaHistorial } from './screens/PantallaHistorial';
import { PantallaReportes } from './screens/PantallaReportes';

/** Módulo CAJA CHICA */
export const moduloCajaChica: ModuloApp = {
  id: 'caja-chica',
  Proveedor: CajaProvider,
  rutas: [
    { ruta: '/', pantalla: <PantallaCaja /> },
    { ruta: '/historial', pantalla: <PantallaHistorial /> },
    { ruta: '/historial/:id', pantalla: <PantallaDetalleSesion /> },
    { ruta: '/reportes', pantalla: <PantallaReportes /> },
  ],
  navegacion: [
    { ruta: '/', etiqueta: 'Caja', Icono: IconoCaja },
    { ruta: '/historial', etiqueta: 'Historial', Icono: IconoHistorial },
    { ruta: '/reportes', etiqueta: 'Reportes', Icono: IconoReportes },
  ],
};
