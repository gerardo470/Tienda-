import { IconoAjustes } from '../../shared/ui/iconos';
import type { ModuloApp } from '../tipos';
import { PantallaAjustes } from './PantallaAjustes';
import { PantallaRespaldo } from './PantallaRespaldo';
import { PantallaTipos } from './PantallaTipos';
import { PantallaUsuarios } from './PantallaUsuarios';
import { Vigilante } from './Vigilante';

/** Módulo AJUSTES */
export const moduloAjustes: ModuloApp = {
  id: 'ajustes',
  Vigilante,
  rutas: [
    { ruta: '/ajustes', pantalla: <PantallaAjustes /> },
    { ruta: '/ajustes/usuarios', pantalla: <PantallaUsuarios />, roles: ['admin'] },
    { ruta: '/ajustes/respaldo', pantalla: <PantallaRespaldo />, roles: ['admin'] },
    { ruta: '/ajustes/tipos', pantalla: <PantallaTipos />, roles: ['admin'] },
  ],
  navegacion: [{ ruta: '/ajustes', etiqueta: 'Ajustes', Icono: IconoAjustes, orden: 5 }],
};
