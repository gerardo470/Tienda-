# Llavecita

La ayudante de su taller. Por ahora tiene el módulo de **Caja Chica**; está armada por módulos para agregar después órdenes de trabajo, clientes e inventario.

Es una aplicación web que se instala en el teléfono Android como si fuera una app normal (PWA).

---

## Guía de puesta en marcha (sin saber de bases de datos)

Son tres partes: **Supabase** (donde se guardan los datos), **Vercel** (donde vive la app) e **instalarla en el teléfono**. Las dos cuentas son gratis. Calcule unos 20 minutos.

### Parte 1 · Supabase (la base de datos)

1. Entre a <https://supabase.com> y toque **Start your project**. Cree la cuenta con su correo o con GitHub.
2. Toque **New project** y llene:
   - **Name:** `llavecita`
   - **Database Password:** invente una contraseña y guárdela (no la va a usar a diario).
   - **Region:** la más cercana, por ejemplo *East US (North Virginia)*.
   - Toque **Create new project** y espere 1–2 minutos.
3. **Crear las tablas.** En el menú de la izquierda abra **SQL Editor** → **New query**. Abra el archivo [`supabase/schema.sql`](supabase/schema.sql) de este proyecto, copie **todo** su contenido, péguelo y toque **Run**. Debe decir *Success. No rows returned*.
4. **Crear su usuario.** Vaya a **Authentication** → **Users** → **Add user** → **Create new user**. Escriba su correo y una contraseña, deje marcado **Auto Confirm User** y toque **Create user**. Con ese correo y contraseña va a entrar a Llavecita.
5. **Cerrar la puerta a extraños (recomendado).** En **Authentication** → **Sign In / Providers** apague **Allow new users to sign up** y guarde. Así nadie más puede crearse una cuenta.
6. **Copiar las dos claves.** Vaya a **Project Settings** (el engranaje) → **API** (o **API Keys** / **Data API**) y copie:
   - **Project URL** — se ve así: `https://abcdefgh.supabase.co`
   - **anon public key** (también llamada *publishable key*) — un texto largo.

   > La clave *anon* es pública y no da acceso a sus datos por sí sola: la seguridad la ponen su contraseña y las reglas del paso 3. **Nunca** use ni comparta la clave `service_role` / *secret*.

### Parte 2 · Vercel (publicar la app)

1. Entre a <https://vercel.com> y toque **Sign Up** → **Continue with GitHub** (use la misma cuenta de GitHub donde está este proyecto).
2. Toque **Add New…** → **Project**, busque el repositorio **Tienda-** y toque **Import**.
3. Vercel detecta solo que es un proyecto **Vite**; no cambie nada de eso.
4. Abra **Environment Variables** y agregue las dos claves de Supabase:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | su *Project URL* |
   | `VITE_SUPABASE_ANON_KEY` | su clave *anon public* |

5. Toque **Deploy** y espere un minuto. Al terminar le da un enlace parecido a `https://tienda-xxxx.vercel.app`. **Ese es el enlace de su app.**

> Vercel publica lo que está en la rama principal (`main`) del repositorio. Si el código todavía está en otra rama, primero hay que pasarlo a `main`.

Si algún día cambia las claves, vaya a **Settings → Environment Variables** y luego a **Deployments → ⋯ → Redeploy**.

### Parte 3 · Instalarla en el Android

1. Abra el enlace de Vercel en **Chrome** en su teléfono.
2. Inicie sesión con el correo y la contraseña del paso 4 de Supabase.
3. Toque los **tres puntitos** (arriba a la derecha) → **Instalar aplicación** (en algunos teléfonos dice **Agregar a pantalla principal**) → **Instalar**.
4. Listo: el ícono naranja de **Llavecita** queda en su pantalla de inicio y abre a pantalla completa.

La sesión queda guardada: no tiene que escribir la contraseña cada vez.

---

## Cómo se usa

- **Abrir caja:** escriba el monto inicial. Solo puede haber una caja abierta.
- **Registrar gasto / abono:** los dos botones grandes. En el gasto elija **Cliente** (con el vehículo) o **Taller**, y si quiere tome foto del recibo.
- **En la lista:** toque para ver el detalle, **mantenga presionado** para editar, **deslice a la izquierda** para eliminar (pide confirmación).
- **Cerrar caja:** muestra el resumen, usted escribe el efectivo contado y le dice si sobra o falta. Una caja cerrada ya no se puede cambiar.
- **Historial:** cajas cerradas con filtro por fechas. Dentro de cada una puede **compartir por WhatsApp** o bajar el **PDF** o el **Excel** (archivo CSV).
- **Reportes:** totales del período y cuánto se fue en clientes y cuánto en el taller.
- **Ajustes:** su nombre, mensajes y animaciones de Llavecita, modo oscuro y cerrar sesión.

Sin internet la app abre y muestra lo último guardado, pero para registrar hace falta conexión.

### Modo demostración

Si la app se abre **sin** las claves de Supabase funciona en modo demostración: no pide contraseña y guarda todo solo en ese teléfono. Sirve para probarla, no para el día a día.

---

## Para quien toque el código

```bash
npm install
cp .env.example .env.local   # y pegue sus claves de Supabase
npm run dev                  # desarrollo
npm run build                # compilar para producción
npm run icons                # volver a generar los íconos
```

**Tecnología:** React + Vite + TypeScript + Tailwind CSS + Framer Motion, PWA con `vite-plugin-pwa`, Supabase (Postgres, Auth y Storage), despliegue en Vercel. Zona horaria `America/El_Salvador`, moneda USD.

### Estructura

```
src/
  lib/            formatos (dinero, fechas), conexión a Supabase, vibración, fotos
  shared/         lo que comparten todos los módulos
    auth/         inicio de sesión
    mascot/       Llavecita (dibujo SVG, frases, globito, confeti)
    settings/     ajustes guardados en el teléfono
    ui/           botones, hojas, encabezado, barra inferior, íconos
  modules/
    tipos.ts      la forma que debe tener un módulo
    registro.ts   lista de módulos activos  ← aquí se agregan los nuevos
    caja-chica/   pantallas, componentes, cálculos, datos y exportación
    ajustes/
supabase/schema.sql   tablas, seguridad (RLS), reglas y bitácora
```

### Agregar un módulo nuevo

1. Cree `src/modules/<nombre>/index.tsx` que exporte un `ModuloApp` (sus pantallas y sus botones de la barra inferior).
2. Agréguelo a la lista de `src/modules/registro.ts`.
3. Si necesita tablas, agréguelas en un archivo SQL nuevo dentro de `supabase/`.

### Datos y seguridad

- Tablas `cash_sessions`, `cash_movements` y `audit_log`, todas con **Row Level Security**: cada usuario solo ve lo suyo.
- Un índice único impide tener dos cajas abiertas.
- Los movimientos no se borran: se marcan con `deleted_at` / `deleted_by` (borrado lógico).
- La base de datos escribe sola la bitácora (`audit_log`) al abrir, cerrar, crear, editar y eliminar; desde la app no se puede alterar.
- Una caja cerrada queda bloqueada por la propia base de datos.
- Las fotos de recibos van a un espacio privado (`recibos`) y se abren con enlaces temporales.
- El campo "quién lo registró" ya existe en cada movimiento, listo para cuando haya ayudantes.
