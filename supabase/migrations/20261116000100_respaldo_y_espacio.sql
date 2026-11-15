-- =====================================================================
--  LLAVECITA · Respaldos propios y control de espacio
--  (pensado para el plan gratuito de Supabase, que no trae copias
--   de seguridad automáticas). No modifica datos existentes.
-- =====================================================================

-- ---------- 1. ESPACIO USADO -------------------------------------------
-- Tamaño de la base de datos y de los archivos (fotos). Solo para el admin.
create or replace function public.uso_espacio()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'Solo el administrador puede ver el espacio usado';
  end if;
  return jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'archivos_bytes', (select coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects),
    'archivos', (select count(*) from storage.objects)
  );
end $$;

-- ---------- 2. BORRAR FOTOS PARA LIBERAR ESPACIO -----------------------
-- Quitar la foto de un recibo o de un servicio borra el archivo;
-- el movimiento o el servicio se conservan.
drop policy if exists "recibos: borrar" on storage.objects;
drop policy if exists "fotos servicios: borrar" on storage.objects;
create policy "recibos: borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'recibos' and public.tiene_rol('admin', 'cajero'));
create policy "fotos servicios: borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'servicios' and public.tiene_rol('admin'));

-- ---------- 3. RESTAURAR DESDE RESPALDO --------------------------------
-- Mientras se restaura, las reglas automáticas se hacen a un lado para
-- poder reponer cajas cerradas y no llenar la bitácora de entradas repetidas.
create or replace function public.restaurando()
returns boolean language sql stable as $$
  select coalesce(current_setting('llavecita.restaurando', true), '') = '1'
$$;

create or replace function public.proteger_movimientos()
returns trigger language plpgsql as $$
declare
  estado text;
begin
  if public.restaurando() then return new; end if;
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

create or replace function public.bitacora_movimientos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.restaurando() then return new; end if;
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

create or replace function public.bitacora_sesiones()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.restaurando() then return new; end if;
  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'abrir', 'caja', new.id, new.opened_by, to_jsonb(new));
  elsif new.status = 'closed' and old.status = 'open' then
    insert into public.audit_log (user_id, action, entity, entity_id, actor, details)
    values (new.user_id, 'cerrar', 'caja', new.id, new.closed_by, to_jsonb(new));
  end if;
  return new;
end $$;

create or replace function public.bitacora_generica()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  accion text;
  quien  text;
begin
  if public.restaurando() then return new; end if;
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

create or replace function public.marcar_actualizado()
returns trigger language plpgsql as $$
begin
  if public.restaurando() then return new; end if;
  new.actualizado_en := now();
  return new;
end $$;

-- Si el usuario guardado en el respaldo ya no existe, se usa el que restaura (o nada).
create or replace function public.usuario_valido(texto text, alterno uuid)
returns text language sql stable security definer set search_path = public as $$
  select case when texto is not null and exists (select 1 from auth.users u where u.id::text = texto)
              then texto else alterno::text end
$$;

-- Repone lo que falte a partir de un respaldo. NO borra ni cambia nada que
-- ya exista: cada fila se reconoce por su identificador y, si ya está, se salta.
create or replace function public.restaurar_respaldo(datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  yo uuid := auth.uid();
  n_tipos int; n_sesiones int; n_clientes int; n_vehiculos int; n_servicios int; n_movs int;
  resultado jsonb;
begin
  if not public.tiene_rol('admin') then
    raise exception 'Solo el administrador puede restaurar un respaldo';
  end if;
  perform set_config('llavecita.restaurando', '1', true);

  insert into public.tipos_servicio
  select (jsonb_populate_record(null::public.tipos_servicio, f)).*
  from jsonb_array_elements(coalesce(datos -> 'tipos_servicio', '[]'::jsonb)) f
  on conflict do nothing;
  get diagnostics n_tipos = row_count;

  insert into public.cash_sessions
  select (jsonb_populate_record(null::public.cash_sessions,
            f || jsonb_build_object('user_id', public.usuario_valido(f ->> 'user_id', yo)))).*
  from jsonb_array_elements(coalesce(datos -> 'cash_sessions', '[]'::jsonb)) f
  on conflict do nothing;
  get diagnostics n_sesiones = row_count;

  insert into public.clientes
  select (jsonb_populate_record(null::public.clientes,
            f || jsonb_build_object('creado_por', public.usuario_valido(f ->> 'creado_por', null),
                                    'eliminado_por', public.usuario_valido(f ->> 'eliminado_por', null)))).*
  from jsonb_array_elements(coalesce(datos -> 'clientes', '[]'::jsonb)) f
  on conflict do nothing;
  get diagnostics n_clientes = row_count;

  insert into public.vehiculos
  select (jsonb_populate_record(null::public.vehiculos,
            f || jsonb_build_object('creado_por', public.usuario_valido(f ->> 'creado_por', null),
                                    'eliminado_por', public.usuario_valido(f ->> 'eliminado_por', null)))).*
  from jsonb_array_elements(coalesce(datos -> 'vehiculos', '[]'::jsonb)) f
  where exists (select 1 from public.clientes c where c.id::text = f ->> 'cliente_id')
  on conflict do nothing;
  get diagnostics n_vehiculos = row_count;

  insert into public.servicios
  select (jsonb_populate_record(null::public.servicios,
            f || jsonb_build_object(
              'creado_por', public.usuario_valido(f ->> 'creado_por', null),
              'eliminado_por', public.usuario_valido(f ->> 'eliminado_por', null),
              'mecanico_id', case when exists (select 1 from public.profiles p where p.id::text = f ->> 'mecanico_id')
                                  then f ->> 'mecanico_id' end))).*
  from jsonb_array_elements(coalesce(datos -> 'servicios', '[]'::jsonb)) f
  where exists (select 1 from public.vehiculos v where v.id::text = f ->> 'vehiculo_id')
  on conflict do nothing;
  get diagnostics n_servicios = row_count;

  insert into public.cash_movements
  select (jsonb_populate_record(null::public.cash_movements,
            f || jsonb_build_object(
              'user_id', public.usuario_valido(f ->> 'user_id', yo),
              'servicio_id', case when exists (select 1 from public.servicios s where s.id::text = f ->> 'servicio_id')
                                  then f ->> 'servicio_id' end))).*
  from jsonb_array_elements(coalesce(datos -> 'cash_movements', '[]'::jsonb)) f
  where exists (select 1 from public.cash_sessions s where s.id::text = f ->> 'session_id')
  on conflict do nothing;
  get diagnostics n_movs = row_count;

  resultado := jsonb_build_object('tipos_servicio', n_tipos, 'cash_sessions', n_sesiones, 'clientes', n_clientes,
                                  'vehiculos', n_vehiculos, 'servicios', n_servicios, 'cash_movements', n_movs);

  insert into public.audit_log (user_id, action, entity, actor, details)
  values (yo, 'restaurar', 'respaldo', (select nombre from public.profiles where id = yo), resultado);

  perform set_config('llavecita.restaurando', '', true);
  return resultado;
end $$;

-- Estas funciones no son para visitantes sin sesión.
revoke execute on function public.uso_espacio() from public, anon;
revoke execute on function public.restaurar_respaldo(jsonb) from public, anon;
revoke execute on function public.usuario_valido(text, uuid) from public, anon, authenticated;
grant execute on function public.uso_espacio() to authenticated;
grant execute on function public.restaurar_respaldo(jsonb) to authenticated;
