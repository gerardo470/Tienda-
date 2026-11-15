import { IconoClientes } from '../../shared/ui/iconos';
import type { ModuloApp } from '../tipos';
import { ClientesProvider } from './ClientesProvider';
import { PantallaCliente } from './screens/PantallaCliente';
import { PantallaClientes } from './screens/PantallaClientes';
import { PantallaVehiculo } from './screens/PantallaVehiculo';

/** Módulo CLIENTES: clientes, vehículos e historial de servicios. */
export const moduloClientes: ModuloApp = {
  id: 'clientes',
  Proveedor: ClientesProvider,
  rutas: [
    { ruta: '/clientes', pantalla: <PantallaClientes /> },
    { ruta: '/clientes/:id', pantalla: <PantallaCliente /> },
    { ruta: '/clientes/:id/vehiculo/:vid', pantalla: <PantallaVehiculo /> },
  ],
  navegacion: [{ ruta: '/clientes', etiqueta: 'Clientes', Icono: IconoClientes, orden: 2 }],
};
