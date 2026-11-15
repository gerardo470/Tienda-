-- =====================================================================
--  LLAVECITA · Eliminar y restaurar cajas completas (solo administrador)
--  Borrado lógico: la caja y sus movimientos se ocultan, no se destruyen.
--  No modifica ningún dato existente: solo agrega dos columnas vacías.
-- =====================================================================

alter table public.cash_sessions add column if not exists deleted_at timestamptz;
alter table public.cash_sessions add column if not exists deleted_by text;

-- "Una sola caja abierta" ahora ignora las cajas eliminadas,
-- para que al borrar la caja abierta se pueda abrir otra.
drop index if exists public.cash_sessions_una_abierta_taller;
create unique index if not exists cash_sessions_una_abierta_taller
  on public.cash_sessions ((true)) where (status = 'open' and deleted_at is null);

-- Una caja cerrada sigue sin poder modificarse; lo único permitido es
-- marcarla como eliminada o restaurarla, y eso solo lo hace el administrador.
create or replace function public.proteger_sesion_cerrada()
returns trigger language plpgsql as $$
begin
  if new.deleted_at is distinct from old.deleted_at
     and auth.uid() is not null and not public.tiene_rol('admin') then
    raise exception 'Solo el administrador puede eliminar o restaurar una caja';
  end if;
  if old.status = 'closed'
     and (to_jsonb(new) - 'deleted_at' - 'deleted_by') is distinct from (to_jsonb(old) - 'deleted_at' - 'deleted_by') then
    raise exception 'La caja ya está cerrada y no se puede modificar';
  end if;
  if new.status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;
  return new;
end $$;

-- Los movimientos de una caja eliminada tampoco se pueden tocar.
create or replace function public.proteger_movimientos()
returns trigger language plpgsql as $$
declare
  estado text;
  borrada timestamptz;
begin
  if public.restaurando() then return new; end if;
  select status, deleted_at into estado, borrada from public.cash_sessions where id = new.session_id;
  if borrada is not null then
    raise exception 'La caja fue eliminada: no se pueden cambiar sus movimientos';
  end if;
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

-- La bitácora anota quién eliminó o restauró cada caja y cuándo.
create or replace function public.bitacora_sesiones()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  quien text;
begin
  if public.restaurando() then return new; end if;
  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'abrir', 'caja', new.id, new.opened_by, to_jsonb(new));
  elsif new.deleted_at is distinct from old.deleted_at then
    select nombre into quien from public.profiles where id = auth.uid();
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (coalesce(auth.uid(), new.user_id),
            case when new.deleted_at is null then 'restaurar' else 'eliminar' end,
            'caja', new.id, coalesce(quien, new.deleted_by, old.deleted_by), to_jsonb(old));
  elsif new.status = 'closed' and old.status = 'open' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'cerrar', 'caja', new.id, new.closed_by, to_jsonb(new));
  end if;
  return new;
end $$;

-- Eliminar una caja (abierta o cerrada). Solo administrador.
create or replace function public.eliminar_caja(caja uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'Solo el administrador puede eliminar una caja';
  end if;
  update public.cash_sessions
     set deleted_at = now(),
         deleted_by = (select nombre from public.profiles where id = auth.uid())
   where id = caja and deleted_at is null;
  if not found then
    raise exception 'No se encontró la caja o ya estaba eliminada';
  end if;
end $$;

-- Restaurar una caja eliminada. Solo administrador.
create or replace function public.restaurar_caja(caja uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'Solo el administrador puede restaurar una caja';
  end if;
  if exists (select 1 from public.cash_sessions where id = caja and status = 'open')
     and exists (select 1 from public.cash_sessions where id <> caja and status = 'open' and deleted_at is null) then
    raise exception 'Ya hay otra caja abierta: ciérrela antes de restaurar esta';
  end if;
  update public.cash_sessions set deleted_at = null, deleted_by = null
   where id = caja and deleted_at is not null;
  if not found then
    raise exception 'No se encontró la caja o no estaba eliminada';
  end if;
end $$;

revoke execute on function public.eliminar_caja(uuid) from public, anon;
revoke execute on function public.restaurar_caja(uuid) from public, anon;
grant execute on function public.eliminar_caja(uuid) to authenticated;
grant execute on function public.restaurar_caja(uuid) to authenticated;
