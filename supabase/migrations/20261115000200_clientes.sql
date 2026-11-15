-- =====================================================================
--  LLAVECITA · Módulo CLIENTES (clientes, vehículos y servicios)
--  Requiere la migración de perfiles y roles.
-- =====================================================================

-- ---------- 1. TABLAS --------------------------------------------------

-- Catálogo editable de tipos de servicio.
create table if not exists public.tipos_servicio (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique,
  orden   int  not null default 0,
  activo  boolean not null default true
);

insert into public.tipos_servicio (nombre, orden) values
  ('Cambio de aceite', 1), ('Frenos', 2), ('Transmisión', 3), ('Suspensión', 4),
  ('Afinación', 5), ('Diagnóstico', 6), ('Aire acondicionado', 7), ('Eléctrico', 8), ('Otro', 99)
on conflict (nombre) do nothing;

create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  telefono        text,
  whatsapp        text,
  correo          text,
  notas           text,
  etiquetas       text[] not null default '{}',
  creado_en       timestamptz not null default now(),
  creado_por      uuid default auth.uid() references auth.users (id) on delete set null,
  actualizado_en  timestamptz,
  eliminado_en    timestamptz,
  eliminado_por   uuid references auth.users (id) on delete set null
);

create table if not exists public.vehiculos (
  id                      uuid primary key default gen_random_uuid(),
  cliente_id              uuid not null references public.clientes (id) on delete cascade,
  placa                   text,
  marca                   text,
  modelo                  text,
  anio                    int check (anio is null or anio between 1900 and 2100),
  color                   text,
  kilometraje_actual      int check (kilometraje_actual is null or kilometraje_actual >= 0),
  notas                   text,
  -- Recordatorio opcional del próximo servicio
  proximo_servicio_nota   text,
  proximo_servicio_km     int,
  proximo_servicio_fecha  date,
  creado_en               timestamptz not null default now(),
  creado_por              uuid default auth.uid() references auth.users (id) on delete set null,
  actualizado_en          timestamptz,
  eliminado_en            timestamptz,
  eliminado_por           uuid references auth.users (id) on delete set null
);

create index if not exists vehiculos_cliente on public.vehiculos (cliente_id);

create table if not exists public.servicios (
  id              uuid primary key default gen_random_uuid(),
  vehiculo_id     uuid not null references public.vehiculos (id) on delete cascade,
  cliente_id      uuid not null references public.clientes (id) on delete cascade,
  fecha           date not null default ((now() at time zone 'America/El_Salvador')::date),
  tipo            text not null,
  descripcion     text,
  costo           numeric(12,2) not null default 0 check (costo >= 0),
  kilometraje     int check (kilometraje is null or kilometraje >= 0),
  estado_pago     text not null default 'pagado' check (estado_pago in ('pagado', 'pendiente', 'abonado')),
  mecanico_id     uuid references public.profiles (id) on delete set null,
  notas           text,
  fotos           text[] not null default '{}',
  creado_en       timestamptz not null default now(),
  creado_por      uuid default auth.uid() references auth.users (id) on delete set null,
  actualizado_en  timestamptz,
  eliminado_en    timestamptz,
  eliminado_por   uuid references auth.users (id) on delete set null
);

create index if not exists servicios_vehiculo on public.servicios (vehiculo_id, fecha desc);
create index if not exists servicios_cliente  on public.servicios (cliente_id, fecha desc);

-- Un gasto de caja chica tipo "Cliente" puede apuntar al servicio al que corresponde.
alter table public.cash_movements
  add column if not exists servicio_id uuid references public.servicios (id) on delete set null;

-- La bitácora ahora también recibe cambios hechos por el sistema.
alter table public.audit_log alter column user_id drop not null;

-- ---------- 2. SEGURIDAD POR ROL ---------------------------------------
alter table public.tipos_servicio enable row level security;
alter table public.clientes       enable row level security;
alter table public.vehiculos      enable row level security;
alter table public.servicios      enable row level security;

drop policy if exists "tipos: ver" on public.tipos_servicio;
drop policy if exists "tipos: admin crea" on public.tipos_servicio;
drop policy if exists "tipos: admin edita" on public.tipos_servicio;
create policy "tipos: ver"         on public.tipos_servicio for select to authenticated using (public.mi_rol() is not null);
create policy "tipos: admin crea"  on public.tipos_servicio for insert to authenticated with check (public.tiene_rol('admin'));
create policy "tipos: admin edita" on public.tipos_servicio for update to authenticated using (public.tiene_rol('admin')) with check (public.tiene_rol('admin'));

-- Clientes y vehículos: todos los roles consultan; solo el admin crea y edita.
drop policy if exists "clientes: ver" on public.clientes;
drop policy if exists "clientes: admin crea" on public.clientes;
drop policy if exists "clientes: admin edita" on public.clientes;
create policy "clientes: ver"         on public.clientes for select to authenticated using (public.mi_rol() is not null);
create policy "clientes: admin crea"  on public.clientes for insert to authenticated with check (public.tiene_rol('admin'));
create policy "clientes: admin edita" on public.clientes for update to authenticated using (public.tiene_rol('admin')) with check (public.tiene_rol('admin'));

drop policy if exists "vehiculos: ver" on public.vehiculos;
drop policy if exists "vehiculos: admin crea" on public.vehiculos;
drop policy if exists "vehiculos: admin edita" on public.vehiculos;
create policy "vehiculos: ver"         on public.vehiculos for select to authenticated using (public.mi_rol() is not null);
create policy "vehiculos: admin crea"  on public.vehiculos for insert to authenticated with check (public.tiene_rol('admin'));
create policy "vehiculos: admin edita" on public.vehiculos for update to authenticated using (public.tiene_rol('admin')) with check (public.tiene_rol('admin'));

-- Servicios: todos consultan; admin y mecánico registran; solo el admin edita o elimina.
drop policy if exists "servicios: ver" on public.servicios;
drop policy if exists "servicios: registrar" on public.servicios;
drop policy if exists "servicios: admin edita" on public.servicios;
create policy "servicios: ver"         on public.servicios for select to authenticated using (public.mi_rol() is not null);
create policy "servicios: registrar"   on public.servicios for insert to authenticated with check (public.tiene_rol('admin', 'mecanico'));
create policy "servicios: admin edita" on public.servicios for update to authenticated using (public.tiene_rol('admin')) with check (public.tiene_rol('admin'));
-- Ninguna tabla tiene permiso de DELETE: todo es borrado lógico.

-- ---------- 3. REGLAS AUTOMÁTICAS --------------------------------------

-- 3a. Bitácora de crear, editar y eliminar (clientes, vehículos y servicios).
create or replace function public.bitacora_generica()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  accion text;
  quien  text;
begin
  select nombre into quien from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    accion := 'crear';
  elsif new.eliminado_en is not null and old.eliminado_en is null then
    accion := 'eliminar';
  else
    accion := 'editar';
  end if;
  insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
  values (
    coalesce(auth.uid(), new.creado_por), accion, tg_argv[0], new.id, quien,
    case when tg_op = 'INSERT' then to_jsonb(new)
         else jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)) end
  );
  return new;
end $$;

drop trigger if exists trg_bitacora_clientes  on public.clientes;
drop trigger if exists trg_bitacora_vehiculos on public.vehiculos;
drop trigger if exists trg_bitacora_servicios on public.servicios;
create trigger trg_bitacora_clientes  after insert or update on public.clientes  for each row execute function public.bitacora_generica('cliente');
create trigger trg_bitacora_vehiculos after insert or update on public.vehiculos for each row execute function public.bitacora_generica('vehiculo');
create trigger trg_bitacora_servicios after insert or update on public.servicios for each row execute function public.bitacora_generica('servicio');

-- 3b. Fecha de última edición.
create or replace function public.marcar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists trg_actualizado_clientes  on public.clientes;
drop trigger if exists trg_actualizado_vehiculos on public.vehiculos;
drop trigger if exists trg_actualizado_servicios on public.servicios;
create trigger trg_actualizado_clientes  before update on public.clientes  for each row execute function public.marcar_actualizado();
create trigger trg_actualizado_vehiculos before update on public.vehiculos for each row execute function public.marcar_actualizado();
create trigger trg_actualizado_servicios before update on public.servicios for each row execute function public.marcar_actualizado();

-- 3c. El servicio siempre queda con el cliente dueño del vehículo.
create or replace function public.servicio_cliente_del_vehiculo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select cliente_id into new.cliente_id from public.vehiculos where id = new.vehiculo_id;
  if new.cliente_id is null then
    raise exception 'El vehículo no existe';
  end if;
  return new;
end $$;

drop trigger if exists trg_servicio_cliente on public.servicios;
create trigger trg_servicio_cliente
  before insert or update of vehiculo_id on public.servicios
  for each row execute function public.servicio_cliente_del_vehiculo();

-- 3d. Al registrar un servicio con más kilometraje, se actualiza el del vehículo.
create or replace function public.servicio_actualiza_kilometraje()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kilometraje is not null and new.eliminado_en is null then
    update public.vehiculos
       set kilometraje_actual = new.kilometraje
     where id = new.vehiculo_id
       and (kilometraje_actual is null or kilometraje_actual < new.kilometraje);
  end if;
  return new;
end $$;

drop trigger if exists trg_servicio_km on public.servicios;
create trigger trg_servicio_km
  after insert or update of kilometraje on public.servicios
  for each row execute function public.servicio_actualiza_kilometraje();

-- ---------- 4. FOTOS DE SERVICIOS (Storage) ----------------------------
insert into storage.buckets (id, name, public)
values ('servicios', 'servicios', false)
on conflict (id) do nothing;

drop policy if exists "fotos servicios: ver"   on storage.objects;
drop policy if exists "fotos servicios: subir" on storage.objects;
create policy "fotos servicios: ver" on storage.objects for select to authenticated
  using (bucket_id = 'servicios' and public.mi_rol() is not null);
create policy "fotos servicios: subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'servicios' and public.tiene_rol('admin', 'mecanico')
              and (storage.foldername(name))[1] = auth.uid()::text);
