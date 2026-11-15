-- REVERSA de 20261116000100_respaldo_y_espacio.sql. No borra datos.
drop policy if exists "recibos: borrar" on storage.objects;
drop policy if exists "fotos servicios: borrar" on storage.objects;
drop function if exists public.restaurar_respaldo(jsonb);
drop function if exists public.usuario_valido(text, uuid);
drop function if exists public.uso_espacio();
-- Las funciones de reglas automáticas siguen funcionando igual con o sin
-- public.restaurando(), así que se dejan como están.
delete from supabase_migrations.schema_migrations where version = '20261116000100';
