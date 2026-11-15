import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { dinero, leerMonto } from '../../../lib/format';
import { comprimirImagen } from '../../../lib/imagen';
import { dinero as usd, fechaDia } from '../../../lib/format';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { useAjustes } from '../../../shared/settings/AjustesProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Hoja } from '../../../shared/ui/Hoja';
import { IconoCamara, IconoCarro, IconoCerrar, IconoLlave } from '../../../shared/ui/iconos';
import { nombreVehiculo } from '../../clientes/calculos';
import { useClientes } from '../../clientes/ClientesProvider';
import { repoCaja } from '../repo';
import type { Clase, DatosMovimiento, Movimiento, TipoGasto } from '../types';

interface Props {
  abierta: boolean;
  clase: Clase;
  /** Si viene un movimiento, el formulario lo edita; si no, crea uno nuevo */
  movimiento?: Movimiento | null;
  /** Saldo disponible, para avisar si el gasto lo excede */
  saldo: number;
  alGuardar: (datos: DatosMovimiento) => Promise<void>;
  alCerrar: () => void;
}

const CLAVE_TIPO = 'llavecita-ultimo-tipo';

/** Formulario para registrar o editar un gasto o un abono. */
export function FormMovimiento({ abierta, clase, movimiento, saldo, alGuardar, alCerrar }: Props) {
  const { nombre, cambiar } = useAjustes();
  const { perfil } = useAuth();
  const { clientes } = useClientes();
  const [servicioId, setServicioId] = useState('');

  // Los 30 servicios más recientes, para poder ligar el gasto a uno de ellos.
  const serviciosRecientes = useMemo(
    () =>
      clientes
        .flatMap((c) => c.servicios.map((s) => ({ s, c, v: c.vehiculos.find((x) => x.id === s.vehiculo_id) })))
        .sort((a, b) => b.s.fecha.localeCompare(a.s.fecha))
        .slice(0, 30),
    [clientes],
  );
  const esGasto = clase === 'gasto';

  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoGasto>('taller');
  const [vehiculo, setVehiculo] = useState('');
  const [quien, setQuien] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaFoto, setVistaFoto] = useState<string | null>(null);
  const [rutaFoto, setRutaFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const campoMonto = useRef<HTMLInputElement>(null);

  // Cada vez que se abre, se llena con el movimiento a editar o se limpia.
  useEffect(() => {
    if (!abierta) return;
    setMonto(movimiento ? String(movimiento.amount) : '');
    setDescripcion(movimiento?.description ?? '');
    setTipo(movimiento?.type ?? ((localStorage.getItem(CLAVE_TIPO) as TipoGasto | null) || 'taller'));
    setVehiculo(movimiento?.vehicle ?? '');
    setQuien(movimiento?.registered_by ?? (nombre || perfil?.nombre || ''));
    setServicioId(movimiento?.servicio_id ?? '');
    setFoto(null);
    setVistaFoto(null);
    setRutaFoto(movimiento?.receipt_url ?? null);
    setError(null);
    setOcupado(false);
    const t = window.setTimeout(() => campoMonto.current?.focus(), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, movimiento]);

  // Vista previa de la foto recién tomada.
  useEffect(() => {
    if (!foto) return;
    const url = URL.createObjectURL(foto);
    setVistaFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const valor = leerMonto(monto);
  // Al editar, el monto anterior ya estaba descontado del saldo.
  const disponible = saldo + (movimiento && esGasto ? movimiento.amount : 0);
  const excede = esGasto && Number.isFinite(valor) && valor > disponible;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Escriba un monto mayor que cero.');
      return;
    }
    if (!descripcion.trim()) {
      setError(esGasto ? 'Escriba en qué se gastó.' : 'Escriba el concepto del abono.');
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      let recibo = rutaFoto;
      if (esGasto && foto) recibo = await repoCaja.subirRecibo(await comprimirImagen(foto));
      const persona = quien.trim();
      if (persona && !nombre) cambiar({ nombre: persona }); // se recuerda para la próxima
      if (esGasto) localStorage.setItem(CLAVE_TIPO, tipo);
      await alGuardar({
        kind: clase,
        type: esGasto ? tipo : null,
        description: descripcion.trim(),
        vehicle: esGasto && tipo === 'cliente' ? vehiculo.trim() || null : null,
        amount: valor,
        registered_by: persona || null,
        receipt_url: esGasto ? recibo : null,
        servicio_id: esGasto && tipo === 'cliente' ? servicioId || null : null,
      });
      // Si se quitó o cambió la foto, se borra el archivo viejo para liberar espacio.
      const anterior = movimiento?.receipt_url;
      if (anterior && anterior !== (esGasto ? recibo : null)) void repoCaja.borrarRecibo(anterior).catch(() => undefined);
      alCerrar();
    } catch (err) {
      setError(err instanceof Error && err.message.includes('cerrada') ? err.message : 'No se pudo guardar. Revise el internet e intente de nuevo.');
      setOcupado(false);
    }
  }

  const titulo = `${movimiento ? 'Editar' : 'Registrar'} ${esGasto ? 'gasto' : 'abono'}`;

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={titulo}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <div>
          <label className="etiqueta" htmlFor="mov-monto">
            Monto
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-3xl font-extrabold text-suave">$</span>
            <input
              id="mov-monto"
              ref={campoMonto}
              className="campo pl-10 font-display text-3xl font-extrabold"
              inputMode="decimal"
              enterKeyHint="next"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          {excede && (
            <p role="status" className="mt-2 rounded-2xl bg-naranja-bg px-3 py-2 text-[13px] font-bold text-naranja-fg">
              Ojo: este gasto pasa del saldo disponible ({dinero(disponible)}). Igual se puede guardar.
            </p>
          )}
        </div>

        <div>
          <label className="etiqueta" htmlFor="mov-desc">
            {esGasto ? '¿En qué se gastó?' : 'Concepto'}
          </label>
          <input
            id="mov-desc"
            className="campo"
            autoCapitalize="sentences"
            enterKeyHint="next"
            placeholder={esGasto ? 'Ej. Filtro de aceite' : 'Ej. Reposición de caja'}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {esGasto && (
          <div>
            <span className="etiqueta">Tipo de gasto</span>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Tipo de gasto">
              {(
                [
                  { id: 'cliente', texto: 'Cliente', Icono: IconoCarro, activo: 'bg-naranja text-petroleo-tinta border-naranja-oscuro' },
                  { id: 'taller', texto: 'Taller', Icono: IconoLlave, activo: 'bg-petroleo text-crema border-petroleo-profundo' },
                ] as const
              ).map(({ id, texto, Icono, activo }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={tipo === id}
                  onClick={() => setTipo(id)}
                  className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 text-[15px] font-extrabold transition-colors ${
                    tipo === id ? activo : 'border-borde bg-campo text-suave'
                  }`}
                >
                  <Icono size={22} />
                  {texto}
                </button>
              ))}
            </div>
          </div>
        )}

        {esGasto && tipo === 'cliente' && (
          <div>
            <label className="etiqueta" htmlFor="mov-veh">
              Vehículo del cliente
            </label>
            <input
              id="mov-veh"
              className="campo"
              autoCapitalize="words"
              placeholder="Ej. Toyota Hilux gris, P 123-456"
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
            />
          </div>
        )}

        {esGasto && tipo === 'cliente' && serviciosRecientes.length > 0 && (
          <div>
            <label className="etiqueta" htmlFor="mov-servicio">
              Servicio al que corresponde (opcional)
            </label>
            <select
              id="mov-servicio"
              className="campo h-[52px] px-3 text-[15px]"
              value={servicioId}
              onChange={(e) => {
                setServicioId(e.target.value);
                const elegido = serviciosRecientes.find((x) => x.s.id === e.target.value);
                if (elegido?.v && !vehiculo.trim()) setVehiculo([nombreVehiculo(elegido.v), elegido.v.placa].filter(Boolean).join(', '));
              }}
            >
              <option value="">Ninguno</option>
              {serviciosRecientes.map(({ s, c }) => (
                <option key={s.id} value={s.id}>
                  {c.nombre} · {s.tipo} · {fechaDia(s.fecha)} · {usd(s.costo)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="etiqueta" htmlFor="mov-quien">
            {esGasto ? 'Quién lo registró' : 'Quién lo entregó'}
          </label>
          <input
            id="mov-quien"
            className="campo"
            autoCapitalize="words"
            placeholder="Su nombre"
            value={quien}
            onChange={(e) => setQuien(e.target.value)}
          />
        </div>

        {esGasto && (
          <div>
            <span className="etiqueta">Foto del recibo (opcional)</span>
            {vistaFoto || rutaFoto ? (
              <div className="flex items-center gap-3 rounded-2xl border-2 border-borde bg-campo p-2.5">
                {vistaFoto ? (
                  <img src={vistaFoto} alt="Recibo" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-menta-bg text-menta-fg">
                    <IconoCamara />
                  </span>
                )}
                <span className="flex-1 text-sm font-bold">{vistaFoto ? 'Foto lista para guardar' : 'Este gasto ya tiene foto. Toque la X para quitarla.'}</span>
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => {
                    setFoto(null);
                    setVistaFoto(null);
                    setRutaFoto(null);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-suave"
                >
                  <IconoCerrar size={20} />
                </button>
              </div>
            ) : (
              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-borde bg-campo text-[15px] font-extrabold text-suave">
                <IconoCamara />
                Tomar o elegir foto
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}

        <Boton type="submit" ancho tamano="grande" variante={esGasto ? 'naranja' : 'menta'} disabled={ocupado}>
          {ocupado ? 'Guardando…' : movimiento ? 'Guardar cambios' : esGasto ? 'Guardar gasto' : 'Guardar abono'}
        </Boton>
      </form>
    </Hoja>
  );
}
