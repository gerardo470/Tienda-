import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { compartir } from '../../../lib/compartir';
import { dinero, km, numeroWhatsApp } from '../../../lib/format';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { Confirmar } from '../../../shared/ui/Confirmar';
import { IconoAdelante, IconoAtras, IconoBasura, IconoCarro, IconoChat, IconoCompartir, IconoLapiz, IconoLlave, IconoSuma, IconoTelefono } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { nombreVehiculo, resumenCliente } from '../calculos';
import { useClientes } from '../ClientesProvider';
import { FormCliente } from '../components/FormCliente';
import { FormServicio } from '../components/FormServicio';
import { FormVehiculo } from '../components/FormVehiculo';
import { HojaServicio } from '../components/HojaServicio';
import { LineaTiempo } from '../components/LineaTiempo';
import { crearPDFHistorial, resumenHistorial } from '../exportar';
import { repoClientes } from '../repo';
import type { Servicio } from '../types';
import { useReacciones } from '../useAcciones';

export const BotonVolver = ({ a, texto }: { a: string; texto: string }) => (
  <Link to={a} aria-label={texto} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-naranja text-petroleo-tinta shadow-[0_4px_0_#C2560A]">
    <IconoAtras />
  </Link>
);

/** Ficha del cliente: contacto, vehículos, totales y últimos servicios. */
export function PantallaCliente() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { cargando, clientes, recargar, sinConexion } = useClientes();
  const { esAdmin, rol } = useAuth();
  const reaccion = useReacciones();
  const [editar, setEditar] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState(false);
  const [formServicio, setFormServicio] = useState<{ servicio: Servicio | null } | null>(null);
  const [detalle, setDetalle] = useState<Servicio | null>(null);
  const [borrar, setBorrar] = useState<'cliente' | Servicio | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cliente = clientes.find((c) => c.id === id);
  const volver = <BotonVolver a="/clientes" texto="Volver a clientes" />;

  if (!cliente) {
    return (
      <>
        <Cabecera titulo="Cliente" animo={cargando ? 'pensativa' : 'preocupada'} accion={volver} />
        {cargando ? <p className="py-10 text-center text-[15px] font-bold text-suave">Buscando al cliente…</p> : <Vacio animo="preocupada" titulo="No se encontró este cliente" texto="Puede que lo hayan eliminado." />}
      </>
    );
  }

  const r = resumenCliente(cliente);
  const puedeRegistrar = (rol === 'admin' || rol === 'mecanico') && !sinConexion;
  const wa = cliente.whatsapp || cliente.telefono;

  async function confirmarBorrado() {
    if (!borrar || !cliente) return;
    setOcupado(true);
    try {
      if (borrar === 'cliente') {
        await repoClientes.eliminarCliente(cliente.id);
        await recargar();
        reaccion.eliminado();
        navegar('/clientes');
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
    if (!cliente) return;
    try {
      if (await compartir(await crearPDFHistorial(cliente), resumenHistorial(cliente), 'Historial de servicios')) reaccion.exportado();
    } catch {
      reaccion.fallo();
    }
  }

  return (
    <>
      <Cabecera titulo={cliente.nombre} subtitulo={cliente.etiquetas.includes('frecuente') ? 'Cliente frecuente' : 'Cliente'} animo={r.debe ? 'pensativa' : 'feliz'} accion={volver} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        {/* Contacto */}
        <section className="tarjeta flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            {cliente.telefono ? (
              <a href={`tel:${cliente.telefono.replace(/[^\d+]/g, '')}`} className="flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] bg-naranja text-[15px] font-extrabold text-petroleo-tinta shadow-btn-naranja">
                <IconoTelefono size={20} />
                Llamar
              </a>
            ) : (
              <span className="flex min-h-[52px] items-center justify-center rounded-[20px] border-2 border-borde text-sm font-bold text-suave">Sin teléfono</span>
            )}
            {wa ? (
              <a href={`https://wa.me/${numeroWhatsApp(wa)}`} target="_blank" rel="noreferrer" className="flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] bg-menta text-[15px] font-extrabold text-petroleo-tinta shadow-btn-menta">
                <IconoChat size={20} />
                WhatsApp
              </a>
            ) : (
              <span className="flex min-h-[52px] items-center justify-center rounded-[20px] border-2 border-borde text-sm font-bold text-suave">Sin WhatsApp</span>
            )}
          </div>
          {(cliente.telefono || cliente.correo || cliente.notas) && (
            <div className="text-sm font-semibold text-suave">
              {cliente.telefono && <p>Tel. {cliente.telefono}</p>}
              {cliente.correo && <p className="truncate">{cliente.correo}</p>}
              {cliente.notas && <p className="mt-1 text-tinta">{cliente.notas}</p>}
            </div>
          )}
        </section>

        {/* Totales */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="rounded-3xl bg-petroleo-bg px-3 py-2.5 text-petroleo-fg">
            <p className="text-xs font-extrabold">Total histórico</p>
            <p className="font-display text-xl font-bold leading-7">{dinero(r.total)}</p>
          </div>
          <div className="rounded-3xl bg-menta-bg px-3 py-2.5 text-menta-fg">
            <p className="text-xs font-extrabold">Servicios</p>
            <p className="font-display text-xl font-bold leading-7">{r.numServicios}</p>
          </div>
          <div className={`rounded-3xl px-3 py-2.5 ${r.debe ? 'bg-coral-bg text-coral-fg' : 'bg-naranja-bg text-naranja-fg'}`}>
            <p className="text-xs font-extrabold">Por cobrar</p>
            <p className="font-display text-xl font-bold leading-7">{dinero(r.pendiente)}</p>
          </div>
        </section>

        {puedeRegistrar && (
          <Boton tamano="grande" ancho onClick={() => setFormServicio({ servicio: null })}>
            <IconoLlave size={22} />
            Registrar servicio
          </Boton>
        )}

        {/* Vehículos */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[19px] font-bold leading-6">Vehículos ({cliente.vehiculos.length})</h2>
            {esAdmin && (
              <Boton variante="neutro" tamano="chico" onClick={() => setNuevoVehiculo(true)}>
                <IconoSuma size={18} />
                Agregar
              </Boton>
            )}
          </div>
          {cliente.vehiculos.length === 0 ? (
            <p className="text-sm font-semibold text-suave">Este cliente aún no tiene vehículos.</p>
          ) : (
            cliente.vehiculos.map((v) => {
              const n = cliente.servicios.filter((s) => s.vehiculo_id === v.id).length;
              return (
                <Link key={v.id} to={`/clientes/${cliente.id}/vehiculo/${v.id}`} className="flex items-center gap-3 rounded-[20px] bg-tarjeta px-3 py-2.5 shadow-relieve-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-naranja-bg text-naranja-fg">
                    <IconoCarro />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold">{nombreVehiculo(v)}</span>
                    <span className="block truncate text-xs font-semibold text-suave">
                      {[v.placa, v.color, v.kilometraje_actual != null ? km(v.kilometraje_actual) : null, `${n} ${n === 1 ? 'servicio' : 'servicios'}`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <IconoAdelante className="shrink-0 text-suave" />
                </Link>
              );
            })
          )}
        </section>

        {/* Últimos servicios */}
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-[19px] font-bold leading-6">Últimos trabajos</h2>
          {cliente.servicios.length === 0 ? (
            <p className="text-sm font-semibold text-suave">Todavía no se le ha hecho ningún trabajo.</p>
          ) : (
            <LineaTiempo servicios={cliente.servicios.slice(0, 6)} vehiculos={cliente.vehiculos} alTocar={setDetalle} />
          )}
          {cliente.servicios.length > 6 && <p className="text-xs font-semibold text-suave">Entre a un vehículo para ver su historial completo.</p>}
        </section>

        <div className="flex flex-col gap-2.5">
          {cliente.servicios.length > 0 && (
            <Boton variante="menta" ancho onClick={exportar}>
              <IconoCompartir size={20} />
              Compartir historial (PDF)
            </Boton>
          )}
          {esAdmin && (
            <div className="grid grid-cols-2 gap-2.5">
              <Boton variante="neutro" onClick={() => setBorrar('cliente')}>
                <IconoBasura size={20} />
                Eliminar
              </Boton>
              <Boton variante="neutro" onClick={() => setEditar(true)}>
                <IconoLapiz size={20} />
                Editar datos
              </Boton>
            </div>
          )}
        </div>
      </div>

      <FormCliente
        abierta={editar}
        cliente={cliente}
        alCerrar={() => setEditar(false)}
        alGuardar={async (datos) => {
          await repoClientes.guardarCliente(datos, cliente.id);
          await recargar();
          reaccion.clienteGuardado(false, true);
        }}
      />
      <FormVehiculo
        abierta={nuevoVehiculo}
        alCerrar={() => setNuevoVehiculo(false)}
        alGuardar={async (datos) => {
          await repoClientes.guardarVehiculo(cliente.id, datos);
          await recargar();
          reaccion.guardado();
        }}
      />
      <FormServicio abierta={!!formServicio} clienteId={cliente.id} servicio={formServicio?.servicio} alCerrar={() => setFormServicio(null)} alGuardar={(info) => reaccion.servicioGuardado(info)} />
      <HojaServicio
        servicio={formServicio || borrar ? null : detalle}
        vehiculo={cliente.vehiculos.find((v) => v.id === detalle?.vehiculo_id)}
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
        titulo={borrar === 'cliente' ? '¿Eliminar este cliente?' : '¿Eliminar este servicio?'}
        mensaje={
          borrar === 'cliente'
            ? `${cliente.nombre} deja de aparecer en la lista, con sus vehículos y trabajos. Queda anotado en la bitácora.`
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
