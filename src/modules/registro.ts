import { moduloAjustes } from './ajustes';
import { moduloCajaChica } from './caja-chica';
import { moduloClientes } from './clientes';
import type { ModuloApp } from './tipos';

/**
 * Lista de módulos activos de Llavecita. Los módulos futuros se agregan aquí.
 * El orden en la barra inferior lo da el campo `orden` de cada botón.
 */
export const modulos: ModuloApp[] = [moduloCajaChica, moduloClientes, moduloAjustes];
