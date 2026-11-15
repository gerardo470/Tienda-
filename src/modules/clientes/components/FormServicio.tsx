import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { hoyISO, leerMonto } from '../../../lib/format';
import { comprimirImagen } from '../../../lib/imagen';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Campo, entero, textoONulo } from '../../../shared/ui/Campo';
import { Hoja } from '../../../shared/ui/Hoja';
import { IconoCamara, IconoSuma } from '../../../shared/ui/iconos';
import { coincide, nombreVehiculo } from '../calculos';
import { useClientes } from '../ClientesProvider';
import { repoClientes } from '../repo';
import { ESTADOS_PAGO, type EstadoPago, type Servicio } from '../types';

interface Props {
  abierta: boolean;
  /** Cliente ya elegido (desde su ficha) */
  clienteId?: string;
  /** Vehículo ya elegido (desde su historial) */
  vehiculoId?: string;
  /** Si viene un servicio, el formulario lo edita */
  servicio?: Servicio | null;
  /** Avisa que se guardó: recibe el costo y si se creó un cliente nuevo */
  alGuardar: (info: { costo: number; clienteNuevo: boolean; edicion: boolean }) => void;
  alCerrar: () => void;
}

const chip = (activo: boolean) =>
  `min-h-[44px] rounded-full border-2 px-3.5 text-sm font-extrabold transition-colors ${activo ? 'border-naranja-oscuro bg-naranja text-petroleo-tinta' : 'border-borde bg-campo text-suave'}`;

/**
 * Registro rápido de servicio. Lo mínimo son 4 toques:
 * cliente, vehículo, tipo y costo. Lo demás es opcional.
 */
export function FormServicio({ abierta, clienteId, vehiculoId, servicio, alGuardar, alCerrar }: Props) {
  const { clientes, tipos, equipo, recargar } = useClientes();
  const { esAdmin } = useAuth();

  const [cliente, setCliente] = useState<string | 'nuevo' | null>(null);
  const [busca, setBusca] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [vehiculo, setVehiculo] = useState<string | 'nuevo' | null>(null);
  const [nv, setNv] = useState({ placa: '', marca: '', modelo: '' });
  const [tipo, setTipo] = useState('');
  const [costo, setCosto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [kilometraje, setKilometraje] = useState('');
  const [estado, setEstado] = useState<EstadoPago>('pagado');
  const [mecanico, setMecanico] = useState('');
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [nuevasFotos, setNuevasFotos] = useState<File[]>([]);
  const [mas, setMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    setCliente(servicio?.cliente_id ?? clienteId ?? null);
    setVehiculo(servicio?.vehiculo_id ?? vehiculoId ?? null);
    setBusca('');
    setNuevoNombre('');
    setNuevoTel('');
    setNv({ placa: '', marca: '', modelo: '' });
    setTipo(servicio?.tipo ?? '');
    setCosto(servicio ? String(servicio.costo) : '');
    setDescripcion(servicio?.descripcion ?? '');
    setFecha(servicio?.fecha ?? hoyISO());
    setKilometraje(servicio?.kilometraje?.toString() ?? '');
    setEstado(servicio?.estado_pago ?? 'pagado');
    setMecanico(servicio?.mecanico_id ?? '');
    setNotas(servicio?.notas ?? '');
    setFotos(servicio?.fotos ?? []);
    setNuevasFotos([]);
    setMas(!!servicio);
    setError(null);
    setOcupado(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, servicio]);

  const elegido = clientes.find((c) => c.id === cliente) ?? null;
  const vehiculos = elegido?.vehiculos ?? [];
  const sugeridos = useMemo(() => clientes.filter((c) => coincide(c, busca)).slice(0, 5), [clientes, busca]);
  const listaTipos = servicio && !tipos.includes(servicio.tipo) ? [servicio.tipo, ...tipos] : tipos;

  // Si el cliente tiene un solo vehículo, se elige solo.
  useEffect(() => {
    if (!abierta || servicio || vehiculo) return;
    if (elegido && elegido.vehiculos.length === 1) setVehiculo(elegido.vehiculos[0].id);
    else if (cliente === 'nuevo' || (elegido && elegido.vehiculos.length === 0 && esAdmin)) setVehiculo('nuevo');
  }, [abierta, servicio, vehiculo, elegido, cliente, esAdmin]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const monto = costo.trim() ? leerMonto(costo) : 0;
    if (!cliente) return setError('Elija el cliente.');
    if (cliente === 'nuevo' && !nuevoNombre.trim()) return setError('Escriba el nombre del cliente nuevo.');
    if (!vehiculo) return setError('Elija el vehículo.');
    if (vehiculo === 'nuevo' && !nv.placa.trim() && !nv.marca.trim() && !nv.modelo.trim()) return setError('Escriba la placa o la marca del vehículo nuevo.');
    if (!tipo) return setError('Elija el tipo de servicio.');
    if (!Number.isFinite(monto) || monto < 0) return setError('Revise el costo.');

    setOcupado(true);
    setError(null);
    try {
      // Cliente y vehículo "al vuelo"
      let idCliente = cliente;
      if (cliente === 'nuevo') {
        idCliente = (await repoClientes.guardarCliente({ nombre: nuevoNombre.trim(), telefono: textoONulo(nuevoTel), whatsapp: null, correo: null, notas: null, etiquetas: [] })).id;
      }
      let idVehiculo = vehiculo;
      if (vehiculo === 'nuevo') {
        idVehiculo = (
          await repoClientes.guardarVehiculo(idCliente, {
            placa: textoONulo(nv.placa.toUpperCase()),
            marca: textoONulo(nv.marca),
            modelo: textoONulo(nv.modelo),
            anio: null,
            color: null,
            kilometraje_actual: entero(kilometraje),
            notas: null,
            proximo_servicio_nota: null,
            proximo_servicio_km: null,
            proximo_servicio_fecha: null,
          })
        ).id;
      }
      const subidas: string[] = [];
      for (const f of nuevasFotos) subidas.push(await repoClientes.subirFoto(await comprimirImagen(f)));

      await repoClientes.guardarServicio(
        {
          vehiculo_id: idVehiculo,
          fecha,
          tipo,
          descripcion: textoONulo(descripcion),
          costo: monto,
          kilometraje: entero(kilometraje),
          estado_pago: estado,
          mecanico_id: mecanico || null,
          notas: textoONulo(notas),
          fotos: [...fotos, ...subidas],
        },
        servicio?.id,
      );
      await recargar();
      alGuardar({ costo: monto, clienteNuevo: cliente === 'nuevo', edicion: !!servicio });
      alCerrar();
    } catch (err) {
      await recargar(); // por si el cliente o el vehículo sí se alcanzaron a crear
      setError(err instanceof Error && err.message.includes('permiso') ? err.message : 'No se pudo guardar. Revise el internet e intente de nuevo.');
      setOcupado(false);
    }
  }

  const fijo = !!servicio; // al editar no se cambia de cliente

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={servicio ? 'Editar servicio' : 'Registrar servicio'}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        {/* ---------- Cliente ---------- */}
        <div>
          <span className="etiqueta">Cliente</span>
          {elegido ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-borde bg-campo px-4 py-2.5">
              <span className="truncate text-base font-extrabold">{elegido.nombre}</span>
              {!fijo && !clienteId && (
                <button type="button" className="min-h-[36px] shrink-0 text-sm font-extrabold text-naranja-fg" onClick={() => (setCliente(null), setVehiculo(null))}>
                  Cambiar
                </button>
              )}
            </div>
          ) : cliente === 'nuevo' ? (
            <div className="flex flex-col gap-2.5 rounded-3xl border-2 border-borde p-3">
              <div className="grid grid-cols-2 gap-2.5">
                <Campo id="srv-cli-nombre" etiqueta="Nombre" valor={nuevoNombre} alCambiar={setNuevoNombre} autoCapitalize="words" placeholder="Juan Pérez" />
                <Campo id="srv-cli-tel" etiqueta="Teléfono" valor={nuevoTel} alCambiar={setNuevoTel} inputMode="tel" placeholder="7000-0000" />
              </div>
              <button type="button" className="min-h-[36px] self-start text-sm font-extrabold text-naranja-fg" onClick={() => (setCliente(null), setVehiculo(null))}>
                Elegir uno que ya existe
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input className="campo" placeholder="Buscar por nombre, teléfono o placa" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar cliente" />
              <div className="flex flex-wrap gap-2">
                {sugeridos.map((c) => (
                  <button key={c.id} type="button" className={chip(false)} onClick={() => setCliente(c.id)}>
                    {c.nombre}
                  </button>
                ))}
                {esAdmin && (
                  <button
                    type="button"
                    className={`${chip(false)} inline-flex items-center gap-1 border-dashed`}
                    onClick={() => {
                      setCliente('nuevo');
                      setNuevoNombre(/\d/.test(busca) ? '' : busca);
                    }}
                  >
                    <IconoSuma size={16} />
                    Cliente nuevo
                  </button>
                )}
              </div>
              {sugeridos.length === 0 && !esAdmin && <p className="text-sm font-semibold text-suave">No hay clientes con ese dato. Pídale al administrador que lo agregue.</p>}
            </div>
          )}
        </div>

        {/* ---------- Vehículo ---------- */}
        {cliente && (
          <div>
            <span className="etiqueta">Vehículo</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Vehículo">
              {vehiculos.map((v) => (
                <button key={v.id} type="button" role="radio" aria-checked={vehiculo === v.id} className={chip(vehiculo === v.id)} onClick={() => setVehiculo(v.id)}>
                  {nombreVehiculo(v)}
                  {v.placa && v.marca ? ` · ${v.placa}` : ''}
                </button>
              ))}
              {esAdmin && (
                <button type="button" role="radio" aria-checked={vehiculo === 'nuevo'} className={`${chip(vehiculo === 'nuevo')} inline-flex items-center gap-1 border-dashed`} onClick={() => setVehiculo('nuevo')}>
                  <IconoSuma size={16} />
                  Vehículo nuevo
                </button>
              )}
            </div>
            {vehiculo === 'nuevo' && (
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                <Campo id="srv-veh-placa" etiqueta="Placa" valor={nv.placa} alCambiar={(x) => setNv({ ...nv, placa: x })} autoCapitalize="characters" placeholder="P 123-456" className="px-3" />
                <Campo id="srv-veh-marca" etiqueta="Marca" valor={nv.marca} alCambiar={(x) => setNv({ ...nv, marca: x })} autoCapitalize="words" placeholder="Toyota" className="px-3" />
                <Campo id="srv-veh-modelo" etiqueta="Modelo" valor={nv.modelo} alCambiar={(x) => setNv({ ...nv, modelo: x })} autoCapitalize="words" placeholder="Hilux" className="px-3" />
              </div>
            )}
          </div>
        )}

        {/* ---------- Tipo ---------- */}
        <div>
          <span className="etiqueta">Tipo de servicio</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de servicio">
            {listaTipos.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={tipo === t} className={chip(tipo === t)} onClick={() => setTipo(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Costo y pago ---------- */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="srv-costo">
              Costo
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-extrabold text-suave">$</span>
              <input id="srv-costo" className="campo pl-9 font-display text-2xl font-extrabold" inputMode="decimal" placeholder="0.00" value={costo} onChange={(e) => setCosto(e.target.value)} />
            </div>
          </div>
          <Campo id="srv-fecha" etiqueta="Fecha" valor={fecha} alCambiar={setFecha} type="date" max={hoyISO()} className="h-[56px] px-3 text-[15px]" />
        </div>

        <div>
          <span className="etiqueta">Estado de pago</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Estado de pago">
            {ESTADOS_PAGO.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={estado === e.id} className={chip(estado === e.id)} onClick={() => setEstado(e.id)}>
                {e.texto}
              </button>
            ))}
          </div>
        </div>

        <Campo id="srv-desc" etiqueta="Descripción del trabajo" valor={descripcion} alCambiar={setDescripcion} autoCapitalize="sentences" placeholder="Ej. Aceite 15W-40 y filtro" />

        {/* ---------- Opcional ---------- */}
        {!mas ? (
          <button type="button" className="min-h-[44px] self-start text-sm font-extrabold text-naranja-fg" onClick={() => setMas(true)}>
            + Kilometraje, mecánico, notas y fotos
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="srv-km" etiqueta="Kilometraje" valor={kilometraje} alCambiar={setKilometraje} inputMode="numeric" placeholder="120000" />
              <div>
                <label className="etiqueta" htmlFor="srv-mec">
                  Mecánico
                </label>
                <select id="srv-mec" className="campo h-[52px] px-3 text-[15px]" value={mecanico} onChange={(e) => setMecanico(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {equipo.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Campo id="srv-notas" etiqueta="Notas" valor={notas} alCambiar={setNotas} placeholder="Ej. Queda pendiente revisar suspensión" />
            <div>
              <span className="etiqueta">Fotos (opcional)</span>
              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-borde bg-campo text-[15px] font-extrabold text-suave">
                <IconoCamara />
                {fotos.length + nuevasFotos.length > 0 ? `${fotos.length + nuevasFotos.length} foto(s) · agregar otra` : 'Tomar o elegir fotos'}
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setNuevasFotos((p) => [...p, ...Array.from(e.target.files ?? [])].slice(0, 6))} />
              </label>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}
        <Boton type="submit" ancho tamano="grande" disabled={ocupado}>
          {ocupado ? 'Guardando…' : servicio ? 'Guardar cambios' : 'Guardar servicio'}
        </Boton>
      </form>
    </Hoja>
  );
}
