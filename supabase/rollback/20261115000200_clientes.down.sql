-- REVERSA de 20261115000200_clientes.sql
-- ¡CUIDADO! Borra las tablas de clientes, vehículos y servicios CON SUS DATOS.
-- Ejecutar solo a propósito y con respaldo. No toca la caja chica.
drop policy if exists "fotos servicios: ver"   on storage.objects;
drop policy if exists "fotos servicios: subir" on storage.objects;
alter table public.cash_movements drop column if exists servicio_id;
drop table if exists public.servicios;
drop table if exists public.vehiculos;
drop table if exists public.clientes;
drop table if exists public.tipos_servicio;
drop function if exists public.servicio_actualiza_kilometraje();
drop function if exists public.servicio_cliente_del_vehiculo();
drop function if exists public.marcar_actualizado();
drop function if exists public.bitacora_generica();
-- El espacio de fotos "servicios" se borra desde el panel de Supabase (Storage) si ya no se necesita.
delete from supabase_migrations.schema_migrations where version = '20261115000200';
