import { useEffect, useState, type FormEvent } from 'react';
import { dinero, leerMonto, sumar } from '../../../lib/format';
import { Boton } from '../../../shared/ui/Boton';
import { Hoja } from '../../../shared/ui/Hoja';
import { IconoCandado } from '../../../shared/ui/iconos';
import { textoDiferencia, type Totales } from '../calculos';

interface Props {
  abierta: boolean;
  totales: Totales;
  alCerrar: () => void;
  alConfirmar: (contado: number) => Promise<void>;
}

function Renglon({ texto, valor, fuerte }: { texto: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2 ${fuerte ? 'text-lg font-extrabold' : 'text-[15px] font-bold'}`}>
      <span className={fuerte ? '' : 'text-suave'}>{texto}</span>
      <span className="font-display font-bold">{valor}</span>
    </div>
  );
}

/** Cierre de caja: resumen, efectivo contado y diferencia. */
export function HojaCerrarCaja({ abierta, totales, alCerrar, alConfirmar }: Props) {
  const [contado, setContado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (abierta) {
      setContado('');
      setError(null);
      setOcupado(false);
    }
  }, [abierta]);

  const valor = leerMonto(contado);
  const hayValor = Number.isFinite(valor);
  const diferencia = hayValor ? sumar([valor, -totales.saldo]) : null;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!hayValor || valor < 0) {
      setError('Escriba cuánto efectivo contó.');
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      await alConfirmar(valor);
    } catch {
      setError('No se pudo cerrar la caja. Revise el internet e intente de nuevo.');
      setOcupado(false);
    }
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Cerrar caja">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <div className="tarjeta divide-y-2 divide-borde px-4 py-1">
          <Renglon texto="Monto inicial" valor={dinero(totales.inicial)} />
          <Renglon texto="+ Abonos" valor={dinero(totales.abonos)} />
          <Renglon texto="− Gastos" valor={dinero(totales.gastos)} />
          <Renglon texto="Saldo esperado" valor={dinero(totales.saldo)} fuerte />
        </div>

        <div>
          <label className="etiqueta" htmlFor="cierre-contado">
            Efectivo contado
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-3xl font-extrabold text-suave">$</span>
            <input
              id="cierre-contado"
              className="campo pl-10 font-display text-3xl font-extrabold"
              inputMode="decimal"
              placeholder="0.00"
              value={contado}
              onChange={(e) => setContado(e.target.value)}
            />
          </div>
        </div>

        {diferencia !== null && (
          <div
            role="status"
            className={`flex items-center justify-between rounded-2xl px-4 py-3 font-extrabold ${
              diferencia === 0 ? 'bg-menta-bg text-menta-fg' : diferencia > 0 ? 'bg-naranja-bg text-naranja-fg' : 'bg-coral-bg text-coral-fg'
            }`}
          >
            <span>{diferencia === 0 ? '¡La caja cuadra cabal!' : textoDiferencia(diferencia)}</span>
            {diferencia !== 0 && <span className="font-display text-xl">{dinero(Math.abs(diferencia))}</span>}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}

        <p className="text-[13px] font-semibold text-suave">Al cerrar, la caja queda guardada en el Historial y ya no se puede editar.</p>

        <Boton type="submit" ancho tamano="grande" disabled={ocupado}>
          <IconoCandado size={20} />
          {ocupado ? 'Cerrando…' : 'Cerrar caja'}
        </Boton>
      </form>
    </Hoja>
  );
}
