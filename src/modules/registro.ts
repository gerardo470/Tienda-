import { moduloAjustes } from './ajustes';
import { moduloCajaChica } from './caja-chica';
import type { ModuloApp } from './tipos';

/**
 * Lista de módulos activos de Llavecita, en el orden en que aparecen
 * en la barra inferior. Los módulos futuros se agregan aquí.
 */
export const modulos: ModuloApp[] = [moduloCajaChica, moduloAjustes];
