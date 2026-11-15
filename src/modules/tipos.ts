import type { ComponentType, ReactNode } from 'react';
import type { Rol } from '../shared/auth/perfiles';

/**
 * Forma que debe tener cada módulo de Llavecita.
 * Para agregar un módulo nuevo (órdenes de trabajo, clientes, inventario…):
 *   1. Cree su carpeta en src/modules/<nombre>/ con un index.tsx que exporte un ModuloApp.
 *   2. Agréguelo a la lista de src/modules/registro.ts.
 * No hay que tocar nada más: las rutas y la barra inferior se arman solas.
 */
export interface ModuloApp {
  id: string;
  /** Pantallas del módulo */
  /** `roles`: quiénes pueden entrar (si falta, todos) */
  rutas: { ruta: string; pantalla: ReactNode; roles?: Rol[] }[];
  /** Botones que el módulo pone en la barra inferior */
  /** `orden`: posición en la barra (de menor a mayor) */
  navegacion: { ruta: string; etiqueta: string; Icono: ComponentType<{ size?: number }>; orden: number; roles?: Rol[] }[];
  /** Componente invisible que revisa algo al abrir la app (opcional) */
  Vigilante?: ComponentType;
  /** Estado compartido del módulo (opcional): envuelve toda la app */
  Proveedor?: ComponentType<{ children: ReactNode }>;
}
