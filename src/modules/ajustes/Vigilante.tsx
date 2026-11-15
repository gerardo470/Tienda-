import { useEffect } from 'react';
import { hoyISO } from '../../lib/format';
import { useAuth } from '../../shared/auth/AuthProvider';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { AVISO_ESPACIO, DIAS_PARA_AVISAR, diasSinRespaldo, LIMITE_ARCHIVOS, LIMITE_BD, usoEspacio } from './respaldo';

const CLAVE = 'llavecita-aviso-diario';

/**
 * No dibuja nada: al abrir la app revisa (solo para el admin, una vez al día)
 * si el espacio pasó del 70 % o si hace más de 30 días que no hay respaldo,
 * y Llavecita lo avisa.
 */
export function Vigilante() {
  const { esAdmin } = useAuth();
  const { decir } = useMascota();

  useEffect(() => {
    if (!esAdmin || localStorage.getItem(CLAVE) === hoyISO()) return;
    let vigente = true;
    const reloj = window.setTimeout(async () => {
      let mensaje: string | null = null;
      try {
        const e = await usoEspacio();
        const pct = Math.max(e.bd / LIMITE_BD, e.archivos / LIMITE_ARCHIVOS);
        if (pct >= AVISO_ESPACIO) mensaje = `Ojo, jefe: el espacio va por ${Math.round(pct * 100)} %. Véalo en Ajustes.`;
      } catch {
        /* sin internet: se revisa otro día */
      }
      if (!mensaje && diasSinRespaldo() > DIAS_PARA_AVISAR) mensaje = 'Jefe, hace más de un mes que no sacamos respaldo. Está en Ajustes.';
      if (vigente && mensaje) {
        localStorage.setItem(CLAVE, hoyISO());
        decir(mensaje, 'preocupada');
      }
    }, 6000);
    return () => {
      vigente = false;
      window.clearTimeout(reloj);
    };
  }, [esAdmin, decir]);

  return null;
}
