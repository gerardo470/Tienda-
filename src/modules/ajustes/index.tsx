import { IconoAjustes } from '../../shared/ui/iconos';
import type { ModuloApp } from '../tipos';
import { PantallaAjustes } from './PantallaAjustes';

/** Módulo AJUSTES */
export const moduloAjustes: ModuloApp = {
  id: 'ajustes',
  rutas: [{ ruta: '/ajustes', pantalla: <PantallaAjustes /> }],
  navegacion: [{ ruta: '/ajustes', etiqueta: 'Ajustes', Icono: IconoAjustes }],
};
