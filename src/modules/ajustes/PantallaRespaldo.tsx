import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { compartir, descargar } from '../../lib/compartir';
import { fechaCorta } from '../../lib/format';
import { vibrar } from '../../lib/haptics';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { Boton } from '../../shared/ui/Boton';
import { Cabecera } from '../../shared/ui/Cabecera';
import { Hoja } from '../../shared/ui/Hoja';
import { IconoCompartir, IconoDocumento } from '../../shared/ui/iconos';
import { useCaja } from '../caja-chica/CajaProvider';
import { useClientes } from '../clientes/ClientesProvider';
import { BotonVolver } from '../clientes/screens/PantallaCliente';
import {
  AVISO_ESPACIO,
  contar,
  crearExcel,
  DIAS_PARA_AVISAR,
  diasSinRespaldo,
  leerExcel,
  leerTodo,
  LIMITE_ARCHIVOS,
  LIMITE_BD,
  marcarRespaldoHecho,
  NOMBRE_TABLA,
  restaurar,
  TABLAS,
  tamano,
  ultimoRespaldo,
  usoEspacio,
  type Espacio,
  type Respaldo,
  type Tabla,
} from './respaldo';

const PALABRA = 'RESTAURAR';

function Barra({ titulo, usado, limite, detalle }: { titulo: string; usado: number; limite: number; detalle?: string }) {
  const pct = Math.min(100, (usado / limite) * 100);
  const alto = pct >= AVISO_ESPACIO * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[15px] font-extrabold">
        <span>{titulo}</span>
        <span className={alto ? 'text-coral-fg' : ''}>{pct < 1 ? 'menos de 1 %' : `${Math.round(pct)} %`}</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-borde" role="img" aria-label={`${titulo}: ${Math.round(pct)} por ciento usado`}>
        <motion.div className={`h-full rounded-full ${alto ? 'bg-coral' : 'bg-menta'}`} initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 1.5)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
      <p className="mt-1 text-xs font-semibold text-suave">
        {tamano(usado)} de {tamano(limite)}
        {detalle ? ` · ${detalle}` : ''}
      </p>
    </div>
  );
}

/** Ajustes > Respaldo y espacio (solo admin). */
export function PantallaRespaldo() {
  const { decir, celebrar } = useMascota();
  const { recargar: recargarCaja } = useCaja();
  const { recargar: recargarClientes } = useClientes();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState(ultimoRespaldo);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [porRestaurar, setPorRestaurar] = useState<Respaldo | null>(null);
  const [palabra, setPalabra] = useState('');
  const [resultado, setResultado] = useState<Record<Tabla, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    usoEspacio()
      .then(setEspacio)
      .catch(() => setEspacio(null));
  }, [resultado]);

  const dias = diasSinRespaldo();
  const atrasado = dias > DIAS_PARA_AVISAR;

  async function respaldar(modo: 'bajar' | 'compartir') {
    setOcupado(modo);
    setError(null);
    try {
      const datos = await leerTodo();
      const archivo = await crearExcel(datos);
      const n = contar(datos);
      if (modo === 'bajar') descargar(archivo);
      else if (!(await compartir(archivo, `Respaldo de Llavecita: ${n.cash_sessions} cajas, ${n.clientes} clientes, ${n.servicios} servicios.`, 'Respaldo de Llavecita'))) return;
      marcarRespaldoHecho();
      setUltimo(ultimoRespaldo());
      vibrar('exito');
      decir('¡Respaldo listo, jefe! Guárdelo bien.', 'contenta');
    } catch {
      setError('No se pudo crear el respaldo. Revise el internet e intente de nuevo.');
      decir('No se pudo, jefe. Revise el internet.', 'preocupada');
    } finally {
      setOcupado(null);
    }
  }

  async function elegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setResultado(null);
    try {
      setPorRestaurar(await leerExcel(archivo));
      setPalabra('');
    } catch (e) {
      setError(e instanceof Error && e.message.includes('respaldo') ? e.message : 'No se pudo leer el archivo. Debe ser un respaldo de Llavecita (.xlsx).');
    }
  }

  async function confirmarRestaurar() {
    if (!porRestaurar) return;
    setOcupado('restaurar');
    try {
      const agregadas = await restaurar(porRestaurar);
      await Promise.all([recargarCaja(), recargarClientes()]);
      setResultado(agregadas);
      setPorRestaurar(null);
      vibrar('exito');
      if (Object.values(agregadas).some((x) => x > 0)) celebrar('confeti');
      decir('¡Listo, jefe! Datos restaurados.', 'contenta');
    } catch {
      setPorRestaurar(null);
      setError('No se pudo restaurar. No se cambió nada. Revise el internet e intente de nuevo.');
      decir('No se pudo restaurar, jefe.', 'preocupada');
    } finally {
      setOcupado(null);
    }
  }

  const conteo = porRestaurar ? contar(porRestaurar) : null;

  return (
    <>
      <Cabecera titulo="Respaldo" subtitulo="Sus datos, a salvo" animo={atrasado ? 'preocupada' : 'feliz'} accion={<BotonVolver a="/ajustes" texto="Volver a ajustes" />} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <section className="tarjeta flex flex-col gap-3 p-4">
          <div>
            <h2 className="font-display text-lg font-bold leading-6">Descargar respaldo</h2>
            <p className={`text-sm font-bold ${atrasado ? 'text-coral-fg' : 'text-suave'}`}>
              {ultimo ? `Último respaldo desde este teléfono: ${fechaCorta(ultimo)} (hace ${dias} ${dias === 1 ? 'día' : 'días'}).` : 'Todavía no ha sacado ningún respaldo desde este teléfono.'}
            </p>
          </div>
          <Boton variante="menta" ancho disabled={!!ocupado} onClick={() => respaldar('compartir')}>
            <IconoCompartir size={20} />
            {ocupado === 'compartir' ? 'Preparando…' : 'Compartir (WhatsApp, Drive…)'}
          </Boton>
          <Boton variante="neutro" ancho disabled={!!ocupado} onClick={() => respaldar('bajar')}>
            <IconoDocumento size={20} />
            {ocupado === 'bajar' ? 'Preparando…' : 'Guardar en el teléfono'}
          </Boton>
          <p className="text-xs font-semibold text-suave">
            Es un archivo de Excel con cajas, gastos, abonos, clientes, vehículos y servicios. Las fotos no van incluidas. Guárdelo fuera del teléfono (por ejemplo, mándeselo a usted mismo por WhatsApp o súbalo a Drive).
          </p>
        </section>

        <section className="tarjeta flex flex-col gap-3 p-4">
          <div>
            <h2 className="font-display text-lg font-bold leading-6">Restaurar desde respaldo</h2>
            <p className="text-sm font-semibold text-suave">Repone lo que falte a partir de un archivo de respaldo. No borra ni cambia lo que ya está, y no duplica nada.</p>
          </div>
          <label className={`flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-borde bg-tarjeta text-[15px] font-extrabold shadow-btn-neutro ${ocupado ? 'opacity-50' : ''}`}>
            <IconoDocumento size={20} />
            Elegir archivo de respaldo
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={!!ocupado}
              onChange={(e) => {
                void elegirArchivo(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {resultado && (
            <div role="status" className="rounded-2xl bg-menta-bg px-4 py-3 text-sm font-bold text-menta-fg">
              <p className="font-extrabold">{Object.values(resultado).some((x) => x > 0) ? 'Se agregó lo que faltaba:' : 'No faltaba nada: todo lo del respaldo ya estaba.'}</p>
              {TABLAS.filter((t) => resultado[t] > 0).map((t) => (
                <p key={t}>
                  {NOMBRE_TABLA[t]}: {resultado[t]}
                </p>
              ))}
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}

        <section className="tarjeta flex flex-col gap-3 p-4">
          <h2 className="font-display text-lg font-bold leading-6">Espacio usado</h2>
          {espacio ? (
            <>
              <Barra titulo="Base de datos" usado={espacio.bd} limite={LIMITE_BD} />
              <Barra titulo="Fotos" usado={espacio.archivos} limite={LIMITE_ARCHIVOS} detalle={`${espacio.numArchivos} ${espacio.numArchivos === 1 ? 'foto' : 'fotos'}`} />
              <p className="text-xs font-semibold text-suave">Límites del plan gratuito de Supabase. Llavecita le avisa si alguno pasa del 70 %.</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-suave">Calculando…</p>
          )}
        </section>
      </div>

      <Hoja abierta={!!porRestaurar} alCerrar={() => setPorRestaurar(null)} titulo="¿Restaurar este respaldo?">
        {conteo && (
          <div className="flex flex-col gap-3.5">
            <div className="tarjeta divide-y-2 divide-borde px-4 py-1">
              {TABLAS.map((t) => (
                <div key={t} className="flex justify-between gap-4 py-2 text-[15px] font-bold">
                  <span className="text-suave">{NOMBRE_TABLA[t]}</span>
                  <span className="font-display">{conteo[t]}</span>
                </div>
              ))}
            </div>
            <p className="rounded-2xl bg-naranja-bg px-4 py-2.5 text-[13px] font-bold leading-snug text-naranja-fg">
              Se van a agregar las filas de este archivo que no existan en la app. Lo que ya existe no se toca. Esta acción queda en la bitácora.
            </p>
            <div>
              <label className="etiqueta" htmlFor="rest-palabra">
                Para confirmar, escriba {PALABRA}
              </label>
              <input id="rest-palabra" className="campo" autoCapitalize="characters" autoComplete="off" value={palabra} onChange={(e) => setPalabra(e.target.value)} placeholder={PALABRA} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Boton variante="neutro" onClick={() => setPorRestaurar(null)} disabled={!!ocupado}>
                Mejor no
              </Boton>
              <Boton variante="coral" disabled={!!ocupado || palabra.trim().toUpperCase() !== PALABRA} onClick={confirmarRestaurar}>
                {ocupado === 'restaurar' ? 'Restaurando…' : 'Restaurar'}
              </Boton>
            </div>
          </div>
        )}
      </Hoja>
    </>
  );
}
