import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { dinero, fechaLarga, leerMonto } from '../../../lib/format';
import { vibrar } from '../../../lib/haptics';
import { frases } from '../../../shared/mascot/frases';
import type { Animo } from '../../../shared/mascot/Llavecita';
import { useMascota } from '../../../shared/mascot/MascotaProvider';
import { useAjustes } from '../../../shared/settings/AjustesProvider';
import { Boton } from '../../../shared/ui/Boton';
import { Cabecera } from '../../../shared/ui/Cabecera';
import { Confirmar } from '../../../shared/ui/Confirmar';
import { IconoCandado, IconoMas, IconoMenos, IconoSinSenal } from '../../../shared/ui/iconos';
import { NumeroAnimado } from '../../../shared/ui/NumeroAnimado';
import { Vacio } from '../../../shared/ui/Vacio';
import { calcularTotales, gastoGrande, saldoBajo } from '../calculos';
import { useCaja } from '../CajaProvider';
import { BarraReparto } from '../components/BarraReparto';
import { FormMovimiento } from '../components/FormMovimiento';
import { HojaCerrarCaja } from '../components/HojaCerrarCaja';
import { HojaDetalle } from '../components/HojaDetalle';
import { ItemMovimiento } from '../components/ItemMovimiento';
import type { Clase, DatosMovimiento, Movimiento } from '../types';

let yaSaludo = false; // Llavecita saluda una sola vez por visita

function AvisoSinConexion() {
  return (
    <p role="status" className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-naranja-bg px-4 py-2.5 text-[13px] font-bold text-naranja-fg">
      <IconoSinSenal size={18} className="shrink-0" />
      Sin internet: se muestra lo último guardado. Para registrar hace falta conexión.
    </p>
  );
}

/** Pantalla principal: la caja chica del día. */
export function PantallaCaja() {
  const { cargando, sinConexion, sesion, totales, abrir, agregar, editar, eliminar, cerrar } = useCaja();
  const { decir, celebrar } = useMascota();
  const { animaciones } = useAjustes();
  const navegar = useNavigate();

  const [pestana, setPestana] = useState<Clase>('gasto');
  const [form, setForm] = useState<{ clase: Clase; mov: Movimiento | null } | null>(null);
  const [detalle, setDetalle] = useState<Movimiento | null>(null);
  const [porBorrar, setPorBorrar] = useState<Movimiento | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // Abrir caja
  const [inicial, setInicial] = useState('');
  const [errorAbrir, setErrorAbrir] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  const saludado = useRef(false);
  useEffect(() => {
    if (cargando || saludado.current || yaSaludo) return;
    saludado.current = true;
    yaSaludo = true;
    const t = window.setTimeout(() => decir(frases.saludo(), 'guino'), 700);
    return () => window.clearTimeout(t);
  }, [cargando, decir]);

  const hapt = (p: 'exito' | 'alerta') => animaciones && vibrar(p);

  async function abrirCaja(e: FormEvent) {
    e.preventDefault();
    const monto = leerMonto(inicial);
    if (!Number.isFinite(monto) || monto < 0) {
      setErrorAbrir('Escriba con cuánto dinero abre la caja (puede ser 0).');
      return;
    }
    setAbriendo(true);
    setErrorAbrir(null);
    try {
      await abrir(monto);
      setInicial('');
      hapt('exito');
      decir(frases.cajaAbierta(), 'contenta');
    } catch {
      setErrorAbrir('No se pudo abrir la caja. Revise el internet e intente de nuevo.');
      hapt('alerta');
    } finally {
      setAbriendo(false);
    }
  }

  // Llavecita reacciona según cómo quedó la caja después de guardar.
  function reaccionar(datos: DatosMovimiento, saldoAntes: number, saldoDespues: number, entro: number, esEdicion: boolean) {
    hapt('exito');
    if (datos.kind === 'abono') {
      if (!esEdicion) celebrar('monedas');
      decir(esEdicion ? frases.editado() : frases.abonoGuardado(), 'contenta');
      return;
    }
    if (saldoDespues < 0) decir(frases.saldoNegativo(), 'preocupada');
    else if (entro > 0 && saldoDespues < entro * 0.15) decir(frases.saldoBajo(), 'preocupada');
    else if (!esEdicion && gastoGrande(datos.amount, saldoAntes)) decir(frases.gastoGrande(), 'sorprendida');
    else decir(esEdicion ? frases.editado() : frases.gastoGuardado(), 'guino');
  }

  async function guardar(datos: DatosMovimiento) {
    if (!sesion || !totales || !form) return;
    const previo = form.mov;
    if (previo) await editar(previo.id, datos);
    else await agregar(datos);

    // Se calcula cómo queda la caja con el cambio aplicado.
    const lista = previo
      ? sesion.movimientos.map((m) => (m.id === previo.id ? { ...m, ...datos } : m))
      : [...sesion.movimientos, { ...datos, id: 'nuevo', session_id: sesion.id, created_at: '', updated_at: null, deleted_at: null }];
    const despues = calcularTotales({ ...sesion, movimientos: lista });
    reaccionar(datos, totales.saldo, despues.saldo, despues.inicial + despues.abonos, !!previo);
    setPestana(datos.kind);
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await eliminar(porBorrar.id);
      hapt('exito');
      decir(frases.eliminado(), 'guino');
      setPorBorrar(null);
      setDetalle(null);
    } catch {
      hapt('alerta');
      decir(frases.error(), 'preocupada');
    } finally {
      setBorrando(false);
    }
  }

  async function confirmarCierre(contado: number) {
    if (!sesion || !totales) return;
    const id = sesion.id;
    const cuadra = Math.round((contado - totales.saldo) * 100) === 0;
    await cerrar(contado);
    setCerrando(false);
    hapt('exito');
    if (cuadra) {
      celebrar('confeti');
      decir(frases.cierreCuadrado(), 'contenta');
    } else {
      decir(frases.cierreConDiferencia(), 'pensativa');
    }
    navegar(`/historial/${id}`);
  }

  // ---------- Cargando ----------
  if (cargando) {
    return (
      <>
        <Cabecera titulo="Caja Chica" subtitulo={fechaLarga()} animo="pensativa" />
        <p className="px-6 py-10 text-center text-[15px] font-bold text-suave">Abriendo la caja…</p>
      </>
    );
  }

  // ---------- Sin caja abierta ----------
  if (!sesion || !totales) {
    return (
      <>
        <Cabecera titulo="Caja Chica" subtitulo={fechaLarga()} animo="dormida" solapar />
        <section className="tarjeta relative z-10 mx-4 -mt-12 p-5">
          <h2 className="font-display text-2xl font-extrabold leading-tight">Abrir caja</h2>
          <p className="mb-3 text-sm font-semibold text-suave">¿Con cuánto dinero empieza hoy la caja chica?</p>
          <form onSubmit={abrirCaja} noValidate className="flex flex-col gap-3">
            <div>
              <label className="etiqueta" htmlFor="abrir-monto">
                Monto inicial
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-3xl font-extrabold text-suave">$</span>
                <input
                  id="abrir-monto"
                  className="campo pl-10 font-display text-3xl font-extrabold"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={inicial}
                  onChange={(e) => setInicial(e.target.value)}
                  disabled={sinConexion}
                />
              </div>
            </div>
            {errorAbrir && (
              <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
                {errorAbrir}
              </p>
            )}
            <Boton type="submit" ancho tamano="grande" disabled={abriendo || sinConexion}>
              {abriendo ? 'Abriendo…' : 'Abrir caja'}
            </Boton>
          </form>
        </section>
        {sinConexion && <AvisoSinConexion />}
        <Vacio titulo="La caja está cerrada" texto="Ábrala con el monto inicial para empezar a registrar gastos y abonos." />
      </>
    );
  }

  // ---------- Caja abierta ----------
  const animo: Animo = saldoBajo(totales) ? 'preocupada' : 'feliz';
  const gastos = sesion.movimientos.filter((m) => m.kind === 'gasto');
  const abonos = sesion.movimientos.filter((m) => m.kind === 'abono');
  const lista = pestana === 'gasto' ? gastos : abonos;

  return (
    <>
      <Cabecera
        titulo="Caja Chica"
        subtitulo={fechaLarga()}
        animo={animo}
        solapar
        accion={
          <Boton tamano="chico" className="shrink-0 !shadow-[0_4px_0_#C2560A]" onClick={() => setCerrando(true)} disabled={sinConexion}>
            <IconoCandado size={18} />
            Cerrar caja
          </Boton>
        }
      />

      <section className="tarjeta relative z-10 mx-4 -mt-12 flex flex-col gap-3 p-[18px]">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-wide text-suave">Saldo disponible</p>
          <NumeroAnimado valor={totales.saldo} className={`block font-display text-5xl font-extrabold leading-[52px] ${totales.saldo < 0 ? 'text-coral-fg' : ''}`} />
          <p className="text-xs font-semibold text-suave">Inicial {dinero(totales.inicial)} + abonos − gastos</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-coral-bg px-3 py-2.5 text-coral-fg">
            <p className="text-xs font-extrabold">Total gastado</p>
            <NumeroAnimado valor={totales.gastos} className="block font-display text-2xl font-bold leading-7" />
          </div>
          <div className="rounded-[18px] bg-menta-bg px-3 py-2.5 text-menta-fg">
            <p className="text-xs font-extrabold">Total abonos</p>
            <NumeroAnimado valor={totales.abonos} className="block font-display text-2xl font-bold leading-7" />
          </div>
        </div>
        <BarraReparto cliente={totales.gastosCliente} taller={totales.gastosTaller} />
      </section>

      {sinConexion && <AvisoSinConexion />}

      <div className="grid grid-cols-2 gap-3 px-4 pb-1.5 pt-4">
        <Boton variante="menta" tamano="grande" disabled={sinConexion} onClick={() => setForm({ clase: 'abono', mov: null })}>
          <IconoMas size={22} />
          Registrar Abono
        </Boton>
        <Boton tamano="grande" disabled={sinConexion} onClick={() => setForm({ clase: 'gasto', mov: null })}>
          <IconoMenos size={22} />
          Registrar Gasto
        </Boton>
      </div>

      <section className="flex flex-col gap-2 px-4 pb-6 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[19px] font-bold leading-6">{pestana === 'gasto' ? 'Gastos de esta sesión' : 'Abonos de esta sesión'}</h2>
          <div className="flex rounded-full bg-tarjeta p-1 shadow-relieve-sm" role="tablist" aria-label="Ver gastos o abonos">
            {(
              [
                { id: 'gasto', texto: `Gastos ${gastos.length}` },
                { id: 'abono', texto: `Abonos ${abonos.length}` },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={pestana === p.id}
                onClick={() => setPestana(p.id)}
                className={`relative min-h-[36px] rounded-full px-3 text-xs font-extrabold ${pestana === p.id ? 'text-petroleo-tinta' : 'text-suave'}`}
              >
                {pestana === p.id && <motion.span layoutId="pestana-activa" className="absolute inset-0 rounded-full bg-naranja" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
                <span className="relative">{p.texto}</span>
              </button>
            ))}
          </div>
        </div>

        {lista.length === 0 ? (
          <Vacio
            animo={pestana === 'gasto' ? 'dormida' : 'pensativa'}
            titulo={pestana === 'gasto' ? 'Aún no hay gastos hoy' : 'Aún no hay abonos hoy'}
            texto={pestana === 'gasto' ? 'Cuando registre un gasto, aquí lo va a ver.' : 'Los abonos son el dinero que entra a la caja.'}
          />
        ) : (
          <>
            <AnimatePresence initial={false} mode="popLayout">
              {lista.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: -18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -120 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                >
                  <ItemMovimiento
                    mov={m}
                    editable={!sinConexion}
                    alVer={setDetalle}
                    alEditar={(mov) => setForm({ clase: mov.kind, mov })}
                    alEliminar={setPorBorrar}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <p className="pt-1 text-center text-xs font-semibold text-suave">Deslice a la izquierda para eliminar · Mantenga presionado para editar</p>
          </>
        )}
      </section>

      <FormMovimiento
        abierta={!!form}
        clase={form?.clase ?? 'gasto'}
        movimiento={form?.mov}
        saldo={totales.saldo}
        alGuardar={guardar}
        alCerrar={() => setForm(null)}
      />

      <HojaDetalle
        mov={form || porBorrar ? null : detalle}
        editable={!sinConexion}
        alCerrar={() => setDetalle(null)}
        alEditar={(mov) => {
          setDetalle(null);
          setForm({ clase: mov.kind, mov });
        }}
        alEliminar={setPorBorrar}
      />

      <Confirmar
        abierta={!!porBorrar}
        titulo={porBorrar?.kind === 'abono' ? '¿Eliminar este abono?' : '¿Eliminar este gasto?'}
        mensaje={
          porBorrar ? (
            <>
              “{porBorrar.description}” por {dinero(porBorrar.amount)}. Queda anotado en la bitácora quién lo borró y cuándo.
            </>
          ) : null
        }
        textoSi="Sí, eliminar"
        peligro
        ocupado={borrando}
        alConfirmar={confirmarBorrado}
        alCancelar={() => setPorBorrar(null)}
      />

      <HojaCerrarCaja abierta={cerrando} totales={totales} alCerrar={() => setCerrando(false)} alConfirmar={confirmarCierre} />
    </>
  );
}
