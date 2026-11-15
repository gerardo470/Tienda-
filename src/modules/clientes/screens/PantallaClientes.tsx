import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fechaDia } from '../../../lib/format';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { IconoAdelante, IconoBuscar, IconoLlave, IconoSuma } from '../../../shared/ui/iconos';
import { Vacio } from '../../../shared/ui/Vacio';
import { coincide, nombreVehiculo, resumenCliente } from '../calculos';
import { useClientes } from '../ClientesProvider';
import { FormCliente } from '../components/FormCliente';
import { FormServicio } from '../components/FormServicio';
import { TarjetaRecordatorios } from '../components/TarjetaRecordatorios';
import { repoClientes } from '../repo';
import { useReacciones } from '../useAcciones';

/** Lista de clientes con buscador, ordenada por último servicio. */
export function PantallaClientes() {
  const { cargando, sinConexion, clientes, recargar } = useClientes();
  const { esAdmin, rol } = useAuth();
  const reaccion = useReacciones();
  const [busca, setBusca] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [nuevoServicio, setNuevoServicio] = useState(false);

  const puedeRegistrar = rol === 'admin' || rol === 'mecanico';

  const lista = useMemo(
    () =>
      clientes
        .filter((c) => coincide(c, busca))
        .map((c) => ({ c, r: resumenCliente(c) }))
        .sort((a, b) => (b.r.ultimo ?? '').localeCompare(a.r.ultimo ?? '') || a.c.nombre.localeCompare(b.c.nombre)),
    [clientes, busca],
  );

  return (
    <>
      <Cabecera titulo="Clientes" subtitulo={clientes.length === 1 ? '1 cliente' : `${clientes.length} clientes`} animo={clientes.length === 0 && !cargando ? 'pensativa' : 'feliz'} />
      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        {sinConexion && <p className="rounded-2xl bg-naranja-bg px-4 py-2.5 text-[13px] font-bold text-naranja-fg">Sin internet: se muestra lo último guardado.</p>}

        <div className={`grid gap-3 ${esAdmin && puedeRegistrar ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {puedeRegistrar && (
            <Boton tamano="grande" disabled={sinConexion} onClick={() => setNuevoServicio(true)}>
              <IconoLlave size={22} />
              Registrar servicio
            </Boton>
          )}
          {esAdmin && (
            <Boton variante="neutro" tamano="grande" disabled={sinConexion} onClick={() => setNuevoCliente(true)}>
              <IconoSuma size={22} />
              Nuevo cliente
            </Boton>
          )}
        </div>

        <TarjetaRecordatorios />

        {clientes.length > 0 && (
          <div className="relative">
            <IconoBuscar size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave" />
            <input className="campo pl-11" placeholder="Buscar por nombre, teléfono o placa" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar cliente" />
          </div>
        )}

        {cargando ? (
          <p className="py-8 text-center text-[15px] font-bold text-suave">Buscando clientes…</p>
        ) : clientes.length === 0 ? (
          <Vacio animo="guino" titulo="Aún no hay clientes" texto={esAdmin ? 'Agregue el primero y aquí va a ir quedando el historial de cada carro.' : 'Cuando el administrador agregue clientes, aquí aparecen.'}>
            {esAdmin && <Boton onClick={() => setNuevoCliente(true)}>Agregar el primer cliente</Boton>}
          </Vacio>
        ) : lista.length === 0 ? (
          <Vacio animo="pensativa" titulo="No encontré a nadie" texto="Pruebe con otro nombre, teléfono o placa." />
        ) : (
          lista.map(({ c, r }, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, type: 'spring', stiffness: 380, damping: 28 }} whileTap={{ scale: 0.97 }}>
              <Link to={`/clientes/${c.id}`} className="tarjeta flex items-center gap-3 px-4 py-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-naranja-bg font-display text-xl font-extrabold text-naranja-fg">{c.nombre.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[16px] font-extrabold">{c.nombre}</span>
                    {c.etiquetas.includes('frecuente') && <span className="shrink-0 rounded-full bg-menta-bg px-2 py-px text-[11px] font-extrabold text-menta-fg">Frecuente</span>}
                    {r.debe && <span className="shrink-0 rounded-full bg-coral-bg px-2 py-px text-[11px] font-extrabold text-coral-fg">Debe</span>}
                  </span>
                  <span className="block truncate text-[13px] font-semibold text-suave">
                    {c.vehiculos.length ? c.vehiculos.map((v) => `${nombreVehiculo(v)}${v.placa && v.marca ? ` ${v.placa}` : ''}`).join(' · ') : 'Sin vehículos'}
                  </span>
                  <span className="block text-xs font-bold text-suave">{r.ultimo ? `Último trabajo: ${fechaDia(r.ultimo)}` : 'Sin trabajos todavía'}</span>
                </span>
                <IconoAdelante className="shrink-0 text-suave" />
              </Link>
            </motion.div>
          ))
        )}
      </div>

      <FormCliente
        abierta={nuevoCliente}
        alCerrar={() => setNuevoCliente(false)}
        alGuardar={async (datos) => {
          const primero = clientes.length === 0;
          await repoClientes.guardarCliente(datos);
          await recargar();
          reaccion.clienteGuardado(primero, false);
        }}
      />
      <FormServicio abierta={nuevoServicio} alCerrar={() => setNuevoServicio(false)} alGuardar={(info) => reaccion.servicioGuardado(info, clientes.length === 0)} />
    </>
  );
}
