import { vibrar } from '../../lib/haptics';
import { frases } from '../../shared/mascot/frases';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { useAjustes } from '../../shared/settings/AjustesProvider';
import { COSTO_ALTO } from './calculos';

/** Reacciones de Llavecita comunes a las pantallas de Clientes. */
export function useReacciones() {
  const { decir, celebrar } = useMascota();
  const { animaciones } = useAjustes();
  const hapt = (p: 'exito' | 'alerta') => animaciones && vibrar(p);

  return {
    servicioGuardado({ costo, clienteNuevo, edicion }: { costo: number; clienteNuevo: boolean; edicion: boolean }, primerCliente = false) {
      hapt('exito');
      if (clienteNuevo && primerCliente) celebrar('confeti');
      if (edicion) decir(frases.editado(), 'guino');
      else if (costo >= COSTO_ALTO) decir(frases.servicioCaro(), 'sorprendida');
      else decir(frases.servicioGuardado(), 'contenta');
    },
    clienteGuardado(primero: boolean, edicion: boolean) {
      hapt('exito');
      if (primero) celebrar('confeti');
      decir(edicion ? frases.editado() : primero ? frases.primerCliente() : frases.clienteGuardado(), 'contenta');
    },
    guardado() {
      hapt('exito');
      decir(frases.editado(), 'guino');
    },
    eliminado() {
      hapt('exito');
      decir(frases.eliminado(), 'guino');
    },
    fallo() {
      hapt('alerta');
      decir(frases.error(), 'preocupada');
    },
    exportado() {
      decir(frases.exportado(), 'guino');
    },
  };
}
