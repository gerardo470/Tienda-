import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { vibrar } from '../../lib/haptics';
import { Llavecita } from '../mascot/Llavecita';
import { Boton } from '../ui/Boton';
import { useAuth } from './AuthProvider';

/** Inicio de sesión con correo y contraseña. */
export function PantallaLogin() {
  const { entrar } = useAuth();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!correo.trim() || !clave) {
      setError('Escriba su correo y su contraseña.');
      return;
    }
    setOcupado(true);
    setError(null);
    const fallo = await entrar(correo, clave);
    setOcupado(false);
    if (fallo) {
      setError(fallo);
      vibrar('alerta');
    } else {
      vibrar('exito');
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-naranja">
      <div className="flex flex-1 flex-col items-center justify-end gap-1 px-6 pb-5 pt-[calc(28px+env(safe-area-inset-top))]">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
          <Llavecita animo={error ? 'preocupada' : ocupado ? 'pensativa' : 'feliz'} size={140} />
        </motion.div>
        <h1 className="font-display text-5xl font-extrabold leading-none text-petroleo-tinta">Llavecita</h1>
        <p className="text-base font-extrabold text-petroleo-tinta">La ayudante de tu taller</p>
      </div>

      <motion.form
        onSubmit={enviar}
        noValidate
        className="rounded-t-5xl bg-fondo px-6 pb-[calc(28px+env(safe-area-inset-bottom))] pt-7"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <h2 className="mb-4 font-display text-2xl font-extrabold">¡Buenas, jefe! Entre a su taller</h2>

        <label className="etiqueta" htmlFor="correo">
          Correo
        </label>
        <input
          id="correo"
          className="campo mb-4"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="usted@correo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <label className="etiqueta" htmlFor="clave">
          Contraseña
        </label>
        <input
          id="clave"
          className="campo"
          type="password"
          autoComplete="current-password"
          placeholder="Su contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />

        {error && (
          <p role="alert" className="mt-3 rounded-2xl bg-coral-bg px-4 py-2.5 text-sm font-bold text-coral-fg">
            {error}
          </p>
        )}

        <Boton type="submit" ancho tamano="grande" className="mt-5" disabled={ocupado}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </Boton>
        <p className="mt-4 text-center text-xs font-semibold text-suave">Su sesión queda guardada en este teléfono.</p>
      </motion.form>
    </div>
  );
}
