import { IconoAjustes } from '../../shared/ui/iconos';
import type { ModuloApp } from '../tipos';
import { PantallaAjustes } from './PantallaAjustes';
import { PantallaTipos } from './PantallaTipos';
import { PantallaUsuarios } from './PantallaUsuarios';

/** Módulo AJUSTES */
export const moduloAjustes: ModuloApp = {
  id: 'ajustes',
  rutas: [
    { ruta: '/ajustes', pantalla: <PantallaAjustes /> },
    { ruta: '/ajustes/usuarios', pantalla: <PantallaUsuarios />, roles: ['admin'] },
    { ruta: '/ajustes/tipos', pantalla: <PantallaTipos />, roles: ['admin'] },
  ],
  navegacion: [{ ruta: '/ajustes', etiqueta: 'Ajustes', Icono: IconoAjustes, orden: 5 }],
};
