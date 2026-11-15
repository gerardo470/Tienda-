-- REVERSA de 20261115000100_perfiles_roles.sql
-- Vuelve a las reglas "cada usuario ve solo lo suyo" y quita los perfiles.
-- Ejecutar primero la reversa de clientes. No borra datos de caja chica.
drop policy if exists "recibos: ver"   on storage.objects;
drop policy if exists "recibos: subir" on storage.objects;
create policy "recibos: ver propios" on storage.objects for select to authenticated
  using (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "recibos: subir propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'recibos' and (storage.foldername(name))[1] = auth.uid()::text);

drop index if exists public.cash_sessions_una_abierta_taller;
create unique index if not exists cash_sessions_una_abierta on public.cash_sessions (user_id) where (status = 'open');

drop policy if exists "bitacora: ver" on public.audit_log;
create policy "bitacora: ver propia" on public.audit_log for select to authenticated using (user_id = auth.uid());

drop policy if exists "movimientos: ver"    on public.cash_movements;
drop policy if exists "movimientos: crear"  on public.cash_movements;
drop policy if exists "movimientos: editar" on public.cash_movements;
create policy "movimientos: ver propios"    on public.cash_movements for select to authenticated using (user_id = auth.uid());
create policy "movimientos: crear propios"  on public.cash_movements for insert to authenticated with check (user_id = auth.uid());
create policy "movimientos: editar propios" on public.cash_movements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sesiones: ver"    on public.cash_sessions;
drop policy if exists "sesiones: crear"  on public.cash_sessions;
drop policy if exists "sesiones: editar" on public.cash_sessions;
create policy "sesiones: ver propias"    on public.cash_sessions for select to authenticated using (user_id = auth.uid());
create policy "sesiones: crear propias"  on public.cash_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "sesiones: editar propias" on public.cash_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists trg_crear_perfil on auth.users;
drop table if exists public.profiles;
drop function if exists public.proteger_ultimo_admin();
drop function if exists public.crear_perfil();
drop function if exists public.tiene_rol(variadic text[]);
drop function if exists public.mi_rol();
delete from supabase_migrations.schema_migrations where version = '20261115000100';
