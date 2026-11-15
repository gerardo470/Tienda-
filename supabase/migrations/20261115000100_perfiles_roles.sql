-- =====================================================================
--  LLAVECITA · Usuarios y roles
--  Roles: admin (todo), cajero (caja chica + consulta clientes),
--         mecanico (consulta clientes y servicios, registra servicios).
--  No borra ni modifica datos existentes de caja chica.
-- =====================================================================

-- ---------- 1. PERFILES ------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null default '',
  rol        text not null default 'mecanico' check (rol in ('admin', 'cajero', 'mecanico')),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Rol del usuario que está usando la app (null si no tiene perfil o está desactivado).
create or replace function public.mi_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid() and activo
$$;

-- ¿El usuario actual tiene alguno de estos roles?
create or replace function public.tiene_rol(variadic roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = any (roles), false)
$$;

-- Cada usuario nuevo recibe su perfil automáticamente.
-- El primero de todos queda como admin; los demás entran como mecánico
-- (el rol con menos permisos) hasta que el admin les asigne otro.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1), ''),
    case when exists (select 1 from public.profiles where rol = 'admin') then 'mecanico' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Perfiles para los usuarios que ya existían: el más antiguo queda como admin.
insert into public.profiles (id, nombre, rol)
select u.id,
       coalesce(split_part(u.email, '@', 1), ''),
       case when row_number() over (order by u.created_at) = 1
                 and not exists (select 1 from public.profiles where rol = 'admin')
            then 'admin' else 'mecanico' end
from auth.users u
on conflict (id) do nothing;

-- Siempre debe quedar al menos un admin activo.
create or replace function public.proteger_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.rol = 'admin' and old.activo
     and (tg_op = 'DELETE' or new.rol <> 'admin' or not new.activo)
     and not exists (select 1 from public.profiles where rol = 'admin' and activo and id <> old.id) then
    raise exception 'Debe quedar al menos un administrador activo';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_proteger_ultimo_admin on public.profiles;
create trigger trg_proteger_ultimo_admin
  before update or delete on public.profiles
  for each row execute function public.proteger_ultimo_admin();

drop policy if exists "perfiles: ver" on public.profiles;
drop policy if exists "perfiles: admin edita" on public.profiles;
-- Cada quien ve su propio perfil; los usuarios activos ven los nombres del equipo.
create policy "perfiles: ver" on public.profiles for select to authenticated
  using (id = auth.uid() or public.mi_rol() is not null);
-- Solo el admin cambia nombres, roles o desactiva usuarios.
create policy "perfiles: admin edita" on public.profiles for update to authenticated
  using (public.tiene_rol('admin')) with check (public.tiene_rol('admin'));

-- ---------- 2. CAJA CHICA POR ROL --------------------------------------
-- Antes cada usuario veía solo lo suyo. Ahora la caja es del taller:
-- la manejan admin y cajero.

drop policy if exists "sesiones: ver propias"    on public.cash_sessions;
drop policy if exists "sesiones: crear propias"  on public.cash_sessions;
drop policy if exists "sesiones: editar propias" on public.cash_sessions;
drop policy if exists "sesiones: ver"    on public.cash_sessions;
drop policy if exists "sesiones: crear"  on public.cash_sessions;
drop policy if exists "sesiones: editar" on public.cash_sessions;
create policy "sesiones: ver"    on public.cash_sessions for select to authenticated using (public.tiene_rol('admin', 'cajero'));
create policy "sesiones: crear"  on public.cash_sessions for insert to authenticated with check (public.tiene_rol('admin', 'cajero') and user_id = auth.uid());
create policy "sesiones: editar" on public.cash_sessions for update to authenticated using (public.tiene_rol('admin', 'cajero')) with check (public.tiene_rol('admin', 'cajero'));

drop policy if exists "movimientos: ver propios"    on public.cash_movements;
drop policy if exists "movimientos: crear propios"  on public.cash_movements;
drop policy if exists "movimientos: editar propios" on public.cash_movements;
drop policy if exists "movimientos: ver"    on public.cash_movements;
drop policy if exists "movimientos: crear"  on public.cash_movements;
drop policy if exists "movimientos: editar" on public.cash_movements;
create policy "movimientos: ver"    on public.cash_movements for select to authenticated using (public.tiene_rol('admin', 'cajero'));
create policy "movimientos: crear"  on public.cash_movements for insert to authenticated with check (public.tiene_rol('admin', 'cajero') and user_id = auth.uid());
create policy "movimientos: editar" on public.cash_movements for update to authenticated using (public.tiene_rol('admin', 'cajero')) with check (public.tiene_rol('admin', 'cajero'));

-- La bitácora solo la ve el admin.
drop policy if exists "bitacora: ver propia" on public.audit_log;
drop policy if exists "bitacora: ver" on public.audit_log;
create policy "bitacora: ver" on public.audit_log for select to authenticated using (public.tiene_rol('admin'));

-- Una sola caja abierta en todo el taller (antes era una por usuario).
drop index if exists public.cash_sessions_una_abierta;
create unique index if not exists cash_sessions_una_abierta_taller
  on public.cash_sessions ((true)) where (status = 'open');

-- Fotos de recibos: las ven admin y cajero.
drop policy if exists "recibos: ver propios"   on storage.objects;
drop policy if exists "recibos: subir propios" on storage.objects;
drop policy if exists "recibos: ver"   on storage.objects;
drop policy if exists "recibos: subir" on storage.objects;
create policy "recibos: ver" on storage.objects for select to authenticated
  using (bucket_id = 'recibos' and public.tiene_rol('admin', 'cajero'));
create policy "recibos: subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'recibos' and public.tiene_rol('admin', 'cajero')
              and (storage.foldername(name))[1] = auth.uid()::text);
