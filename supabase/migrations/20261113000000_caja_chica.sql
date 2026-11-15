-- =====================================================================
--  LLAVECITA · Módulo CAJA CHICA
--  Copie TODO este archivo y péguelo en Supabase > SQL Editor > New query,
--  luego presione "Run". Se puede ejecutar más de una vez sin dañar nada.
-- =====================================================================

-- ---------- 1. TABLAS -------------------------------------------------

create table if not exists public.cash_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  opening_amount  numeric(12,2) not null check (opening_amount >= 0),
  counted_amount  numeric(12,2) check (counted_amount is null or counted_amount >= 0),
  status          text not null default 'open' check (status in ('open', 'closed')),
  opened_by       text,
  closed_by       text
);

-- Solo UNA caja abierta a la vez por usuario.
create unique index if not exists cash_sessions_una_abierta
  on public.cash_sessions (user_id) where (status = 'open');

create index if not exists cash_sessions_fecha
  on public.cash_sessions (user_id, opened_at desc);

create table if not exists public.cash_movements (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.cash_sessions (id) on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('gasto', 'abono')),
  type           text check (type in ('cliente', 'taller')),
  description    text not null,
  vehicle        text,
  amount         numeric(12,2) not null check (amount > 0),
  registered_by  text,
  receipt_url    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz,
  updated_by     text,
  deleted_at     timestamptz,
  deleted_by     text,
  -- Un gasto siempre lleva tipo (cliente o taller).
  constraint gasto_con_tipo check (kind = 'abono' or type is not null)
);

create index if not exists cash_movements_sesion
  on public.cash_movements (session_id, created_at desc);

-- Bitácora: quién hizo qué y cuándo. Nadie puede editarla ni borrarla.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid(),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  actor       text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_fecha on public.audit_log (user_id, created_at desc);

-- ---------- 2. SEGURIDAD (Row Level Security) -------------------------
-- Cada usuario solo puede ver y tocar SUS propios datos.

alter table public.cash_sessions  enable row level security;
alter table public.cash_movements enable row level security;
alter table public.audit_log      enable row level security;

drop policy if exists "sesiones: ver propias"      on public.cash_sessions;
drop policy if exists "sesiones: crear propias"    on public.cash_sessions;
drop policy if exists "sesiones: editar propias"   on public.cash_sessions;
create policy "sesiones: ver propias"    on public.cash_sessions for select to authenticated using (user_id = auth.uid());
create policy "sesiones: crear propias"  on public.cash_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "sesiones: editar propias" on public.cash_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "movimientos: ver propios"    on public.cash_movements;
drop policy if exists "movimientos: crear propios"  on public.cash_movements;
drop policy if exists "movimientos: editar propios" on public.cash_movements;
create policy "movimientos: ver propios"    on public.cash_movements for select to authenticated using (user_id = auth.uid());
create policy "movimientos: crear propios"  on public.cash_movements for insert to authenticated with check (user_id = auth.uid());
create policy "movimientos: editar propios" on public.cash_movements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No hay permiso de DELETE: los movimientos nunca se borran de verdad (borrado lógico).

drop policy if exists "bitacora: ver propia" on public.audit_log;
create policy "bitacora: ver propia" on public.audit_log for select to authenticated using (user_id = auth.uid());
-- La bitácora solo la escriben los disparadores de abajo.

-- ---------- 3. REGLAS AUTOMÁTICAS -------------------------------------

-- 3a. Una caja cerrada ya no se puede modificar.
create or replace function public.proteger_sesion_cerrada()
returns trigger language plpgsql as $$
begin
  if old.status = 'closed' then
    raise exception 'La caja ya está cerrada y no se puede modificar';
  end if;
  if new.status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_proteger_sesion_cerrada on public.cash_sessions;
create trigger trg_proteger_sesion_cerrada
  before update on public.cash_sessions
  for each row execute function public.proteger_sesion_cerrada();

-- 3b. No se pueden agregar ni cambiar movimientos de una caja cerrada.
create or replace function public.proteger_movimientos()
returns trigger language plpgsql as $$
declare
  estado text;
begin
  select status into estado from public.cash_sessions where id = new.session_id;
  if estado is distinct from 'open' then
    raise exception 'La caja está cerrada: no se pueden cambiar sus movimientos';
  end if;
  if tg_op = 'UPDATE' then
    if old.deleted_at is not null then
      raise exception 'Este movimiento ya fue eliminado';
    end if;
    new.session_id := old.session_id;
    new.created_at := old.created_at;
    if new.deleted_at is null then
      new.updated_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_proteger_movimientos on public.cash_movements;
create trigger trg_proteger_movimientos
  before insert or update on public.cash_movements
  for each row execute function public.proteger_movimientos();

-- 3c. Bitácora automática de movimientos.
create or replace function public.bitacora_movimientos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'crear', 'movimiento', new.id, new.registered_by, to_jsonb(new));
  elsif new.deleted_at is not null and old.deleted_at is null then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'eliminar', 'movimiento', new.id, new.deleted_by, to_jsonb(old));
  else
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'editar', 'movimiento', new.id, new.updated_by,
            jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)));
  end if;
  return new;
end $$;

drop trigger if exists trg_bitacora_movimientos on public.cash_movements;
create trigger trg_bitacora_movimientos
  after insert or update on public.cash_movements
  for each row execute function public.bitacora_movimientos();

-- 3d. Bitácora automática de abrir y cerrar caja.
create or replace function public.bitacora_sesiones()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'abrir', 'caja', new.id, new.opened_by, to_jsonb(new));
  elsif new.status = 'closed' and old.status = 'open' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'cerrar', 'caja', new.id, new.closed_by, to_jsonb(new));
  end if;
  return new;
end $$;

drop trigger if exists trg_bitacora_sesiones on public.cash_sessions;
create trigger trg_bitacora_sesiones
  after insert or update on public.cash_sessions
  for each row execute function public.bitacora_sesiones();

-- ---------- 4. FOTOS DE RECIBOS (Storage) -----------------------------
-- Carpeta privada "recibos". Cada usuario guarda sus fotos en una
-- subcarpeta con su propio identificador y nadie más puede verlas.

insert into storage.buckets (id, name, public)
values ('recibos', 'recibos', false)
on conflict (id) do nothing;

drop policy if exists "recibos: ver propios"   on storage.objects;
drop policy if exists "recibos: subir propios" on storage.objects;
create policy "recibos: ver propios" on storage.objects for select to authenticated
  using (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recibos: subir propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ¡Listo! Si ve "Success. No rows returned", todo quedó creado.
