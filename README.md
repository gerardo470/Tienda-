# Llavecita

La ayudante de su taller. Tiene los módulos de **Caja Chica** y **Clientes** (vehículos e historial de servicios), con usuarios por rol. Está armada por módulos para seguir agregando.

Es una aplicación web que se instala en el teléfono Android como si fuera una app normal (PWA).

---

## Dónde vive cada cosa

- **App publicada:** <https://tienda-black-nine.vercel.app> (Vercel, proyecto `tienda`).
- **Datos:** Supabase, proyecto `psjahflasdnryynqkswh`.
- **Código:** este repositorio. Lo que llega a la rama `main` se publica solo en Vercel en 1–2 minutos.

## Cómo hacer cambios y volver a desplegar

1. Cambie el código en una rama y ábrale una solicitud de cambios (pull request) hacia `main`.
2. Al aprobarla (**Merge**), Vercel publica la versión nueva sola. No hay que hacer nada más.
3. Si el cambio trae tablas o reglas nuevas, van en un archivo nuevo dentro de `supabase/migrations/` (ver abajo) y se aplican **antes** de aprobar la solicitud.

Las dos claves de Supabase (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) viven en Vercel → Settings → Environment Variables. Nunca se escriben en el código.

### Migraciones de la base de datos

Cada cambio a la base de datos es un archivo numerado en `supabase/migrations/`. Nunca se edita uno ya aplicado: se agrega uno nuevo.

| Archivo | Qué hace |
| --- | --- |
| `20261113000000_caja_chica.sql` | Caja chica: sesiones, movimientos, bitácora y fotos de recibos |
| `20261115000100_perfiles_roles.sql` | Usuarios y roles (admin, cajero, mecánico) |
| `20261115000200_clientes.sql` | Clientes, vehículos, servicios y catálogo de tipos |
| `20261116000100_respaldo_y_espacio.sql` | Restaurar respaldos, espacio usado y borrado de fotos |
| `20261117000100_borrar_cajas.sql` | Eliminar y restaurar cajas completas (solo admin) |

Con la CLI de Supabase:

```bash
npx supabase login
npx supabase link --project-ref psjahflasdnryynqkswh
npx supabase db push          # aplica las migraciones que falten
```

Sin la CLI: pegue el archivo nuevo en Supabase → SQL Editor → Run. Todas las migraciones se pueden ejecutar más de una vez sin dañar nada.

- **Deshacer:** cada migración tiene su reversa en `supabase/rollback/`. La de clientes **borra datos**: úsela solo a propósito y con respaldo.
- **Datos de ejemplo:** `supabase/seed.sql` es solo para una base local de pruebas (`npx supabase db reset`). Nunca se aplica en producción.

### Planes gratuitos, respaldos y crecimiento

Llavecita corre en los planes gratuitos de Supabase y Vercel. Los límites, qué pasa al alcanzarlos, cómo funcionan los respaldos y el "latido", y cómo pasar a Supabase Pro están en [`docs/limites.md`](docs/limites.md).

- **Respaldo manual:** Ajustes → Respaldo y espacio.
- **Respaldo automático semanal (opcional):** `.github/workflows/respaldo.yml`.
- **Latido diario:** `api/latido.js`, programado en `vercel.json`.

### Instalarla en un Android

1. Abra <https://tienda-black-nine.vercel.app> en **Chrome**.
2. Inicie sesión con su correo y contraseña.
3. Tres puntitos (arriba a la derecha) → **Instalar aplicación** (o **Agregar a pantalla principal**) → **Instalar**.

### Agregar un usuario

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user** (correo, contraseña y **Auto Confirm User** marcado).
2. En Llavecita: **Ajustes → Usuarios y roles**. La persona aparece como *Mecánico*; ahí se le pone nombre y rol.

| Rol | Qué puede hacer |
| --- | --- |
| Administrador | Todo: caja, clientes, servicios, usuarios, bitácora |
| Cajero | Maneja la caja chica y consulta clientes y servicios |
| Mecánico | Consulta clientes y servicios, y registra servicios |

Estas reglas las hace cumplir la base de datos (Row Level Security), no solo la pantalla.

---

## Cómo se usa

- **Abrir caja:** escriba el monto inicial. Solo puede haber una caja abierta.
- **Registrar gasto / abono:** los dos botones grandes. En el gasto elija **Cliente** (con el vehículo) o **Taller**, y si quiere tome foto del recibo.
- **En la lista:** toque para ver el detalle, **mantenga presionado** para editar, **deslice a la izquierda** para eliminar (pide confirmación).
- **Cerrar caja:** muestra el resumen, usted escribe el efectivo contado y le dice si sobra o falta. Una caja cerrada ya no se puede cambiar.
- **Eliminar una caja (solo admin):** en el Historial (ícono de basurero), dentro del detalle de la caja o al final de la caja abierta. Pide escribir BORRAR. La caja no se destruye: queda en Historial → Cajas eliminadas, desde donde se puede restaurar.
- **Historial:** cajas cerradas con filtro por fechas. Dentro de cada una puede **compartir por WhatsApp** o bajar el **PDF** o el **Excel** (archivo CSV).
- **Reportes:** totales del período y cuánto se fue en clientes y cuánto en el taller.
- **Clientes:** lista con buscador (nombre, teléfono o placa), ficha con botones de Llamar y WhatsApp, vehículos, historial de servicios por vehículo como línea de tiempo, registro rápido de servicio y PDF para compartir.
- **Ajustes:** su nombre, mensajes y animaciones de Llavecita, modo oscuro, respaldo y espacio, usuarios y roles, tipos de servicio y cerrar sesión.

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
    clientes/     clientes, vehículos, servicios, recordatorios y PDF
    ajustes/
supabase/migrations/  cambios de la base de datos, numerados
supabase/rollback/    reversa de cada migración
supabase/seed.sql     datos de ejemplo (solo desarrollo)
```

### Agregar un módulo nuevo

1. Cree `src/modules/<nombre>/index.tsx` que exporte un `ModuloApp` (sus pantallas y sus botones de la barra inferior).
2. Agréguelo a la lista de `src/modules/registro.ts`.
3. Si necesita tablas, agréguelas en una migración nueva dentro de `supabase/migrations/`.

### Datos y seguridad

- Todas las tablas tienen **Row Level Security** con permisos por rol.
- Un índice único impide tener dos cajas abiertas en el taller.
- Los movimientos no se borran: se marcan con `deleted_at` / `deleted_by` (borrado lógico).
- La base de datos escribe sola la bitácora (`audit_log`) al abrir, cerrar, crear, editar y eliminar; desde la app no se puede alterar.
- Una caja cerrada queda bloqueada por la propia base de datos.
- Las fotos de recibos van a un espacio privado (`recibos`) y se abren con enlaces temporales.
- Clientes, vehículos y servicios también usan borrado lógico y quedan en la bitácora.
