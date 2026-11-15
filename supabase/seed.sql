-- DATOS DE EJEMPLO · SOLO PARA DESARROLLO
-- Nunca ejecutar en producción. No se aplica con las migraciones:
-- solo corre en una base local con "supabase db reset".
with c as (
  insert into public.clientes (nombre, telefono, whatsapp, etiquetas)
  values ('Cliente de ejemplo', '7000-0000', '50370000000', '{frecuente}')
  returning id
), v as (
  insert into public.vehiculos (cliente_id, placa, marca, modelo, anio, color, kilometraje_actual)
  select id, 'P 000-000', 'Toyota', 'Hilux', 2015, 'Gris', 120000 from c
  returning id, cliente_id
)
insert into public.servicios (vehiculo_id, cliente_id, fecha, tipo, descripcion, costo, kilometraje, estado_pago)
select id, cliente_id, current_date - 30, 'Cambio de aceite', 'Aceite 15W-40 y filtro', 35, 118500, 'pagado' from v
union all
select id, cliente_id, current_date, 'Frenos', 'Pastillas delanteras', 60, 120000, 'pendiente' from v;
