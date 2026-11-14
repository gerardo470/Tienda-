import { useState } from 'react';
import { frases } from '../../../shared/mascot/frases';
import { useMascota } from '../../../shared/mascot/MascotaProvider';
import { Boton } from '../../../shared/ui/Boton';
import { IconoCompartir, IconoDocumento, IconoTabla } from '../../../shared/ui/iconos';
import { compartir, crearCSV, crearPDF, descargar, resumenTexto } from '../exportar';
import type { SesionCompleta } from '../types';

/** Botones para sacar el detalle de una sesión en PDF, Excel o por WhatsApp. */
export function BotonesExportar({ sesion }: { sesion: SesionCompleta }) {
  const { decir } = useMascota();
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function hacer(cual: 'pdf' | 'csv' | 'whatsapp') {
    setOcupado(cual);
    try {
      if (cual === 'csv') {
        descargar(crearCSV(sesion));
        decir(frases.exportado(), 'guino');
      } else if (cual === 'pdf') {
        descargar(await crearPDF(sesion));
        decir(frases.exportado(), 'guino');
      } else if (await compartir(await crearPDF(sesion), resumenTexto(sesion))) {
        decir(frases.exportado(), 'guino');
      }
    } catch {
      decir(frases.error(), 'preocupada');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Boton ancho variante="menta" disabled={!!ocupado} onClick={() => hacer('whatsapp')}>
        <IconoCompartir size={20} />
        {ocupado === 'whatsapp' ? 'Preparando…' : 'Compartir por WhatsApp'}
      </Boton>
      <div className="grid grid-cols-2 gap-2.5">
        <Boton variante="neutro" disabled={!!ocupado} onClick={() => hacer('pdf')}>
          <IconoDocumento size={20} />
          {ocupado === 'pdf' ? 'Creando…' : 'Bajar PDF'}
        </Boton>
        <Boton variante="neutro" disabled={!!ocupado} onClick={() => hacer('csv')}>
          <IconoTabla size={20} />
          Bajar Excel
        </Boton>
      </div>
    </div>
  );
}
