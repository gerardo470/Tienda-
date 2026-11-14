import { useState } from 'react';
import { modoDemo } from '../../lib/supabase';
import { useAuth } from '../../shared/auth/AuthProvider';
import { frases } from '../../shared/mascot/frases';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { useAjustes } from '../../shared/settings/AjustesProvider';
import { Boton } from '../../shared/ui/Boton';
import { Cabecera } from '../../shared/ui/Cabecera';
import { Confirmar } from '../../shared/ui/Confirmar';
import { IconoChispa, IconoGlobo, IconoLuna, IconoPersona, IconoSalir } from '../../shared/ui/iconos';
import { Interruptor } from '../../shared/ui/Interruptor';

/** Ajustes: nombre, mensajes y animaciones de la mascota, modo oscuro y cerrar sesión. */
export function PantallaAjustes() {
  const { nombre, mensajes, animaciones, oscuro, cambiar } = useAjustes();
  const { correo, salir } = useAuth();
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

        {!modoDemo && (
          <section className="tarjeta flex flex-col gap-3 p-4">
            <div>
              <p className="etiqueta">Sesión iniciada</p>
              <p className="truncate text-[15px] font-extrabold">{correo ?? '—'}</p>
            </div>
            <Boton variante="neutro" ancho onClick={() => setConfirmar(true)}>
              <IconoSalir size={20} />
              Cerrar sesión
            </Boton>
          </section>
        )}

        <p className="text-center text-xs font-semibold text-suave">Llavecita · versión 1.0 · módulo Caja Chica</p>
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
