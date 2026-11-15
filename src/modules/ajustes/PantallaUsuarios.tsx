import { useEffect, useState } from 'react';
import { modoDemo } from '../../lib/supabase';
import { useAuth } from '../../shared/auth/AuthProvider';
import { actualizarPerfil, listarPerfiles, NOMBRE_ROL, type Perfil, type Rol } from '../../shared/auth/perfiles';
import { useMascota } from '../../shared/mascot/MascotaProvider';
import { Cabecera } from '../../shared/ui/Cabecera';
import { Vacio } from '../../shared/ui/Vacio';
import { BotonVolver } from '../clientes/screens/PantallaCliente';

const ROLES: Rol[] = ['admin', 'cajero', 'mecanico'];
const QUE_HACE: Record<Rol, string> = {
  admin: 'Ve y edita todo.',
  cajero: 'Maneja la caja chica y consulta clientes.',
  mecanico: 'Consulta clientes y registra servicios.',
};

/** Ajustes > Usuarios (solo admin): cambiar nombre, rol y activar o desactivar. */
export function PantallaUsuarios() {
  const { perfil } = useAuth();
  const { decir } = useMascota();
  const [usuarios, setUsuarios] = useState<Perfil[] | null>(null);
  const [fallo, setFallo] = useState(false);

  const cargar = () =>
    listarPerfiles()
      .then(setUsuarios)
      .catch(() => setFallo(true));

  useEffect(() => {
    void cargar();
  }, []);

  async function cambiar(u: Perfil, cambios: Partial<Pick<Perfil, 'nombre' | 'rol' | 'activo'>>) {
    try {
      await actualizarPerfil(u.id, cambios);
      setUsuarios((lista) => lista?.map((x) => (x.id === u.id ? { ...x, ...cambios } : x)) ?? null);
      decir('¡Cambio guardado, jefe!', 'guino');
    } catch (e) {
      decir(e instanceof Error && e.message.includes('administrador') ? 'Tiene que quedar al menos un admin.' : 'No se pudo guardar el cambio.', 'preocupada');
      void cargar();
    }
  }

  return (
    <>
      <Cabecera titulo="Usuarios" subtitulo="Quién puede usar Llavecita" animo={fallo ? 'preocupada' : 'feliz'} accion={<BotonVolver a="/ajustes" texto="Volver a ajustes" />} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        {usuarios === null && !fallo && <p className="py-8 text-center text-[15px] font-bold text-suave">Buscando usuarios…</p>}
        {fallo && <Vacio animo="preocupada" titulo="No se pudo cargar" texto="Revise el internet y vuelva a entrar." />}

        {usuarios?.map((u) => {
          const yo = u.id === perfil?.id;
          return (
            <section key={u.id} className={`tarjeta flex flex-col gap-3 p-4 ${u.activo ? '' : 'opacity-60'}`}>
              <div>
                <label className="etiqueta" htmlFor={`usr-${u.id}`}>
                  Nombre {yo && '(usted)'}
                </label>
                <input
                  id={`usr-${u.id}`}
                  className="campo"
                  defaultValue={u.nombre}
                  autoCapitalize="words"
                  onBlur={(e) => {
                    const nombre = e.target.value.trim();
                    if (nombre && nombre !== u.nombre) void cambiar(u, { nombre });
                  }}
                />
              </div>
              <div>
                <span className="etiqueta">Rol</span>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Rol de ${u.nombre}`}>
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={u.rol === r}
                      onClick={() => u.rol !== r && cambiar(u, { rol: r })}
                      className={`min-h-[44px] rounded-full border-2 px-1 text-[13px] font-extrabold ${u.rol === r ? 'border-naranja-oscuro bg-naranja text-petroleo-tinta' : 'border-borde bg-campo text-suave'}`}
                    >
                      {NOMBRE_ROL[r]}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-suave">{QUE_HACE[u.rol]}</p>
              </div>
              {!yo && (
                <button type="button" onClick={() => cambiar(u, { activo: !u.activo })} className={`min-h-[44px] self-start text-sm font-extrabold ${u.activo ? 'text-coral-fg' : 'text-menta-fg'}`}>
                  {u.activo ? 'Desactivar usuario' : 'Volver a activar'}
                </button>
              )}
            </section>
          );
        })}

        <section className="rounded-3xl bg-petroleo-bg px-4 py-3 text-[13px] font-bold leading-snug text-petroleo-fg">
          <p className="mb-1 text-sm font-extrabold">Cómo agregar a alguien</p>
          {modoDemo ? (
            <p>En modo demostración solo existe un usuario.</p>
          ) : (
            <ol className="list-decimal pl-5">
              <li>En el panel de Supabase: Authentication → Users → Add user → Create new user.</li>
              <li>Escriba su correo y una contraseña, y deje marcado “Auto Confirm User”.</li>
              <li>Vuelva a esta pantalla: la persona aparece como Mecánico. Aquí le pone su nombre y su rol.</li>
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
