import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { compartir } from '../../../lib/compartir';
import { dinero, fechaDia, km, sumar } from '../../../lib/format';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { Confirmar } from '../../../shared/ui/Confirmar';
import { FiltroFechas } from '../../../shared/ui/FiltroFechas';
import { IconoBasura, IconoCampana, IconoCompartir, IconoLapiz, IconoLlave } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { nombreVehiculo } from '../calculos';
import { useClientes } from '../ClientesProvider';
import { FormServicio } from '../components/FormServicio';
import { FormVehiculo } from '../components/FormVehiculo';
import { HojaServicio } from '../components/HojaServicio';
import { LineaTiempo } from '../components/LineaTiempo';
import { crearPDFHistorial, resumenHistorial } from '../exportar';
import { repoClientes } from '../repo';
import type { Servicio } from '../types';
import { useReacciones } from '../useAcciones';
import { BotonVolver } from './PantallaCliente';

/** Historial de servicios de un vehículo, como línea de tiempo con filtros. */
export function PantallaVehiculo() {
  const { id, vid } = useParams();
  const navegar = useNavigate();
  const { cargando, clientes, recargar, sinConexion } = useClientes();
  const { esAdmin, rol } = useAuth();
  const reaccion = useReacciones();
  const [tipo, setTipo] = useState('');
  const [rango, setRango] = useState({ desde: '', hasta: '' });
  const [editar, setEditar] = useState(false);
  const [formServicio, setFormServicio] = useState<{ servicio: Servicio | null } | null>(null);
  const [detalle, setDetalle] = useState<Servicio | null>(null);
  const [borrar, setBorrar] = useState<'vehiculo' | Servicio | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cliente = clientes.find((c) => c.id === id);
  const vehiculo = cliente?.vehiculos.find((v) => v.id === vid);
  const todos = useMemo(() => cliente?.servicios.filter((s) => s.vehiculo_id === vid) ?? [], [cliente, vid]);
  const tiposUsados = useMemo(() => [...new Set(todos.map((s) => s.tipo))].sort(), [todos]);
  const visibles = todos.filter((s) => (!tipo || s.tipo === tipo) && (!rango.desde || s.fecha >= rango.desde) && (!rango.hasta || s.fecha <= rango.hasta));

  const volver = <BotonVolver a={`/clientes/${id}`} texto="Volver al cliente" />;

  if (!cliente || !vehiculo) {
    return (
      <>
        <Cabecera titulo="Vehículo" animo={cargando ? 'pensativa' : 'preocupada'} accion={volver} />
        {cargando ? <p className="py-10 text-center text-[15px] font-bold text-suave">Buscando el vehículo…</p> : <Vacio animo="preocupada" titulo="No se encontró este vehículo" texto="Puede que lo hayan eliminado." />}
      </>
    );
  }

  const puedeRegistrar = (rol === 'admin' || rol === 'mecanico') && !sinConexion;
  const hayRecordatorio = vehiculo.proximo_servicio_nota || vehiculo.proximo_servicio_km != null || vehiculo.proximo_servicio_fecha;

  async function confirmarBorrado() {
    if (!borrar || !cliente || !vehiculo) return;
    setOcupado(true);
    try {
      if (borrar === 'vehiculo') {
        await repoClientes.eliminarVehiculo(vehiculo.id);
        await recargar();
        reaccion.eliminado();
        navegar(`/clientes/${cliente.id}`);
      } else {
        await repoClientes.eliminarServicio(borrar.id);
        await recargar();
        reaccion.eliminado();
        setBorrar(null);
        setDetalle(null);
      }
    } catch {
      reaccion.fallo();
    } finally {
      setOcupado(false);
    }
  }

  async function exportar() {
    if (!cliente || !vehiculo) return;
    try {
      if (await compartir(await crearPDFHistorial(cliente, vehiculo), resumenHistorial(cliente, vehiculo), 'Historial de servicios')) reaccion.exportado();
    } catch {
      reaccion.fallo();
    }
  }

  return (
    <>
      <Cabecera titulo={nombreVehiculo(vehiculo)} subtitulo={[cliente.nombre, vehiculo.placa].filter(Boolean).join(' · ')} animo="feliz" accion={volver} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <section className="tarjeta flex flex-col gap-2 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs font-extrabold text-suave">Kilometraje</p>
              <p className="font-display text-lg font-bold">{vehiculo.kilometraje_actual != null ? km(vehiculo.kilometraje_actual) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold text-suave">Servicios</p>
              <p className="font-display text-lg font-bold">{todos.length}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold text-suave">Total</p>
              <p className="font-display text-lg font-bold">{dinero(sumar(todos.map((s) => s.costo)))}</p>
            </div>
          </div>
          {(vehiculo.color || vehiculo.notas) && <p className="text-sm font-semibold text-suave">{[vehiculo.color, vehiculo.notas].filter(Boolean).join(' · ')}</p>}
          {hayRecordatorio && (
            <p className="flex items-center gap-2 rounded-2xl bg-naranja-bg px-3 py-2 text-[13px] font-bold text-naranja-fg">
              <IconoCampana size={18} className="shrink-0" />
              <span>
                {vehiculo.proximo_servicio_nota || 'Próximo servicio'}
                {vehiculo.proximo_servicio_km != null && ` a los ${km(vehiculo.proximo_servicio_km)}`}
                {vehiculo.proximo_servicio_fecha && ` · ${fechaDia(vehiculo.proximo_servicio_fecha)}`}
              </span>
            </p>
          )}
        </section>

        {puedeRegistrar && (
          <Boton tamano="grande" ancho onClick={() => setFormServicio({ servicio: null })}>
            <IconoLlave size={22} />
            Registrar servicio
          </Boton>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[19px] font-bold leading-6">Historial de servicios</h2>
          {todos.length > 0 && (
            <>
              <div className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Filtrar por tipo de servicio">
                {['', ...tiposUsados].map((t) => (
                  <button
                    key={t || 'todos'}
                    type="button"
                    role="radio"
                    aria-checked={tipo === t}
                    onClick={() => setTipo(t)}
                    className={`min-h-[40px] shrink-0 rounded-full border-2 px-3.5 text-sm font-extrabold ${tipo === t ? 'border-naranja-oscuro bg-naranja text-petroleo-tinta' : 'border-borde bg-tarjeta text-suave'}`}
                  >
                    {t || 'Todos'}
                  </button>
                ))}
              </div>
              <FiltroFechas desde={rango.desde} hasta={rango.hasta} alCambiar={setRango} />
            </>
          )}
          {todos.length === 0 ? (
            <Vacio titulo="Sin trabajos todavía" texto="Cuando registre un servicio de este carro, aquí queda su historia." />
          ) : visibles.length === 0 ? (
            <Vacio animo="pensativa" titulo="Nada con ese filtro" texto="Pruebe con otro tipo o con otras fechas." />
          ) : (
            <LineaTiempo servicios={visibles} alTocar={setDetalle} />
          )}
        </section>

        <div className="flex flex-col gap-2.5">
          {todos.length > 0 && (
            <Boton variante="menta" ancho onClick={exportar}>
              <IconoCompartir size={20} />
              Compartir historial (PDF)
            </Boton>
          )}
          {esAdmin && (
            <div className="grid grid-cols-2 gap-2.5">
              <Boton variante="neutro" onClick={() => setBorrar('vehiculo')}>
                <IconoBasura size={20} />
                Eliminar
              </Boton>
              <Boton variante="neutro" onClick={() => setEditar(true)}>
                <IconoLapiz size={20} />
                Editar vehículo
              </Boton>
            </div>
          )}
        </div>
      </div>

      <FormVehiculo
        abierta={editar}
        vehiculo={vehiculo}
        alCerrar={() => setEditar(false)}
        alGuardar={async (datos) => {
          await repoClientes.guardarVehiculo(cliente.id, datos, vehiculo.id);
          await recargar();
          reaccion.guardado();
        }}
      />
      <FormServicio abierta={!!formServicio} clienteId={cliente.id} vehiculoId={vehiculo.id} servicio={formServicio?.servicio} alCerrar={() => setFormServicio(null)} alGuardar={(info) => reaccion.servicioGuardado(info)} />
      <HojaServicio
        servicio={formServicio || borrar ? null : detalle}
        editable={esAdmin && !sinConexion}
        alCerrar={() => setDetalle(null)}
        alEditar={(s) => {
          setDetalle(null);
          setFormServicio({ servicio: s });
        }}
        alEliminar={setBorrar}
      />
      <Confirmar
        abierta={!!borrar}
        titulo={borrar === 'vehiculo' ? '¿Eliminar este vehículo?' : '¿Eliminar este servicio?'}
        mensaje={
          borrar === 'vehiculo'
            ? `${nombreVehiculo(vehiculo)} deja de aparecer, con sus trabajos. Queda anotado en la bitácora.`
            : borrar
              ? `${borrar.tipo} por ${dinero(borrar.costo)}. Queda anotado en la bitácora quién lo borró y cuándo.`
              : null
        }
        textoSi="Sí, eliminar"
        peligro
        ocupado={ocupado}
        alConfirmar={confirmarBorrado}
        alCancelar={() => setBorrar(null)}
      />
    </>
  );
}
