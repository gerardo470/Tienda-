-- REVERSA de 20261117000100_borrar_cajas.sql
-- ¡Cuidado! Las cajas que estén eliminadas volverían a verse como normales.
-- Si alguna caja eliminada estaba abierta y hay otra abierta, el índice fallará:
-- ciérrela o restáurela primero.
drop function if exists public.eliminar_caja(uuid);
drop function if exists public.restaurar_caja(uuid);
drop index if exists public.cash_sessions_una_abierta_taller;
create unique index cash_sessions_una_abierta_taller on public.cash_sessions ((true)) where (status = 'open');
alter table public.cash_sessions drop column if exists deleted_at;
alter table public.cash_sessions drop column if exists deleted_by;
-- Después vuelva a ejecutar 20261116000100_respaldo_y_espacio.sql para dejar
-- las reglas automáticas como estaban.
delete from supabase_migrations.schema_migrations where version = '20261117000100';
