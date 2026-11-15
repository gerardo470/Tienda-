import { useState } from 'react';
import { Link } from 'react-router-dom';
import { modoDemo } from '../../lib/supabase';
import { useAuth } from '../../shared/auth/AuthProvider';
import { frases } from '../../shared/mascot/frases';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { useAjustes } from '../../shared/settings/AjustesProvider';
import { Boton } from '../../shared/ui/Boton';
import { Cabecera } from '../../shared/ui/Cabecera';
import { Confirmar } from '../../shared/ui/Confirmar';
import { NOMBRE_ROL } from '../../shared/auth/perfiles';
import { IconoAdelante, IconoChispa, IconoDocumento, IconoClientes, IconoGlobo, IconoLlave, IconoLuna, IconoPersona, IconoSalir } from '../../shared/ui/iconos';
import { Interruptor } from '../../shared/ui/Interruptor';
import { DIAS_PARA_AVISAR, diasSinRespaldo } from './respaldo';

/** Ajustes: nombre, mensajes y animaciones de la mascota, modo oscuro y cerrar sesión. */
export function PantallaAjustes() {
  const { nombre, mensajes, animaciones, oscuro, cambiar } = useAjustes();
  const { correo, salir, esAdmin, rol } = useAuth();
  const { decir } = useMascota();
  const [confirmar, setConfirmar] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  return (
    <>
      <Cabecera titulo="Ajustes" subtitulo="A su gusto, jefe" animo="guino" />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        {modoDemo && (
          <p role="status" className="rounded-3xl bg-naranja-bg px-4 py-3 text-[13px] font-bold leading-snug text-naranja-fg">
            Modo demostración: faltan las claves de Supabase. Lo que registre se guarda solo en este teléfono.
          </p>
        )}

        <section className="tarjeta p-4">
          <label className="etiqueta flex items-center gap-1.5" htmlFor="ajuste-nombre">
            <IconoPersona size={16} />
            Su nombre
          </label>
          <input
            id="ajuste-nombre"
            className="campo"
            autoCapitalize="words"
            placeholder="Ej. Gerardo"
            value={nombre}
            onChange={(e) => cambiar({ nombre: e.target.value })}
          />
          <p className="mt-1.5 text-xs font-semibold text-suave">Se pone solo en “quién lo registró” para que no tenga que escribirlo cada vez.</p>
        </section>

        <section className="tarjeta divide-y-2 divide-borde overflow-hidden">
          <Interruptor
            icono={<IconoGlobo />}
            titulo="Mensajes de Llavecita"
            descripcion="Globitos cortos que se van solos"
            activo={mensajes}
            alCambiar={(v) => {
              cambiar({ mensajes: v });
              if (!v) decir('', undefined);
            }}
          />
          <Interruptor icono={<IconoChispa />} titulo="Animaciones" descripcion="Confeti, contadores, rebotes y vibración" activo={animaciones} alCambiar={(v) => cambiar({ animaciones: v })} />
          <Interruptor icono={<IconoLuna />} titulo="Modo oscuro" descripcion="Para trabajar de noche" activo={oscuro} alCambiar={(v) => cambiar({ oscuro: v })} />
        </section>

        {esAdmin && (
          <section className="tarjeta divide-y-2 divide-borde overflow-hidden">
            {[
              { a: '/ajustes/respaldo', Icono: IconoDocumento, titulo: 'Respaldo y espacio', texto: diasSinRespaldo() > DIAS_PARA_AVISAR ? 'Ya toca sacar un respaldo' : 'Descargar, restaurar y ver el espacio usado' },
              { a: '/ajustes/usuarios', Icono: IconoClientes, titulo: 'Usuarios y roles', texto: 'Quién entra y qué puede hacer' },
              { a: '/ajustes/tipos', Icono: IconoLlave, titulo: 'Tipos de servicio', texto: 'Catálogo de trabajos del taller' },
            ].map(({ a, Icono, titulo, texto }) => (
              <Link key={a} to={a} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-naranja-bg text-naranja-fg">
                  <Icono />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold">{titulo}</span>
                  <span className="block text-xs font-semibold text-suave">{texto}</span>
                </span>
                <IconoAdelante className="shrink-0 text-suave" />
              </Link>
            ))}
          </section>
        )}

        {!modoDemo && (
          <section className="tarjeta flex flex-col gap-3 p-4">
            <div>
              <p className="etiqueta">Sesión iniciada</p>
              <p className="truncate text-[15px] font-extrabold">{correo ?? '—'}</p>
              {rol && <p className="text-xs font-semibold text-suave">Rol: {NOMBRE_ROL[rol]}</p>}
            </div>
            <Boton variante="neutro" ancho onClick={() => setConfirmar(true)}>
              <IconoSalir size={20} />
              Cerrar sesión
            </Boton>
          </section>
        )}

        <p className="text-center text-xs font-semibold text-suave">Llavecita · versión 1.2 · Caja Chica y Clientes</p>
      </div>

      <Confirmar
        abierta={confirmar}
        titulo="¿Cerrar sesión?"
        mensaje="Va a tener que escribir su correo y contraseña para volver a entrar."
        textoSi="Sí, salir"
        textoNo="Quedarme"
        ocupado={saliendo}
        alCancelar={() => setConfirmar(false)}
        alConfirmar={async () => {
          setSaliendo(true);
          decir(frases.adios(), 'guino');
          await salir();
        }}
      />
    </>
  );
}
