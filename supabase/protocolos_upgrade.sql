-- ============================================================
-- MÓDULO DE PROTOCOLOS ONCOLÓGICOS — ampliación de campos
--
-- Deja la tabla "protocolos" con todos los datos del documento
-- institucional de protocolos de quimioterapia:
--   patología / tipo de cáncer
--   medicamentos de quimioterapia (dosis teórica)
--   medicamentos de pre-medicación (dosis / frecuencia)
--   cantidad de ciclos como TEXTO ("8 ciclos, cada 21 días")
--
-- Es seguro ejecutarlo varias veces y no borra nada.
-- Ejecutar en: Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
-- (El editor ejecuta solo el texto seleccionado: no seleccione nada
--  o seleccione el archivo completo.)
--
-- Después de correrlo, abra la aplicación: los protocolos del
-- documento se cargan solos la primera vez que la tabla está vacía.
-- ============================================================

-- Por si la tabla aún no existe (instalación que no corrió setup.sql)
create table if not exists protocolos (
  nombre text primary key,
  patologia text,
  medicamentos text not null,
  premedicacion text,
  frecuencia_aplicacion text not null,
  cantidad_ciclos text not null,
  observaciones text,
  creado_por text not null,
  fecha_creacion text not null,
  creado_en timestamptz not null default now()
);

-- Campos nuevos y ciclos como texto libre
alter table protocolos add column if not exists patologia text;
alter table protocolos add column if not exists premedicacion text;
alter table protocolos alter column cantidad_ciclos type text using cantidad_ciclos::text;

-- RLS: leer, crear y eliminar con la clave pública (igual que el resto
-- de catálogos administrables). Se recrean por si no existieran.
alter table protocolos enable row level security;
drop policy if exists "protocolos_select" on protocolos;
drop policy if exists "protocolos_insert" on protocolos;
drop policy if exists "protocolos_delete" on protocolos;
create policy "protocolos_select" on protocolos for select to anon, authenticated using (true);
create policy "protocolos_insert" on protocolos for insert to anon, authenticated with check (true);
create policy "protocolos_delete" on protocolos for delete to anon, authenticated using (true);

-- ============ VERIFICACIÓN ============
-- Debe listar las 10 columnas, con cantidad_ciclos en tipo "text".
select column_name as columna, data_type as tipo
from information_schema.columns
where table_schema = 'public' and table_name = 'protocolos'
order by ordinal_position;
